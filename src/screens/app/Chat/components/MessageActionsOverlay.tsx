import React, {useEffect, useState} from 'react';

import {Modal, TextStyle, ViewStyle, useWindowDimensions} from 'react-native';

import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {EmojiKeyboard, pt} from 'rn-emoji-keyboard';

import {
  Box,
  Icon,
  IconName,
  MenuBackdrop,
  MenuCard,
  MenuItemSpec,
  Text,
  TouchableOpacityBox,
} from '@components';
import {Message} from '@domain';
import {useAppTheme} from '@hooks';

import {MessageBubble} from './MessageBubble';

/** Emojis rápidos da barra de reações (mesmo conjunto do WhatsApp). */
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Altura estimada da barra de reações (p/ clamp vertical). */
const BAR_HEIGHT = 48;
/** Altura estimada de cada linha do menu (p/ clamp vertical). */
const MENU_ROW_HEIGHT = 46;
const GAP = 8;

/** Bolha pressionada + posição dela na janela (measureInWindow). */
export interface MessageActionsTarget {
  message: Message;
  frame: {x: number; y: number; width: number; height: number};
}

interface MessageActionsOverlayProps {
  target: MessageActionsTarget | null;
  onClose: () => void;
  onReact: (message: Message, emoji: string) => void;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onCopy: (message: Message) => void;
  onToggleStar: (message: Message) => void;
  onDelete: (message: Message) => void;
  onMore: (message: Message) => void;
}

/**
 * Overlay de long-press na mensagem (estilo WhatsApp): fundo com blur,
 * a bolha em destaque na posição original, barra de reações acima e
 * menu de ações abaixo. O "+" da barra troca o menu por um teclado de
 * emojis que sobe por baixo da mensagem (sem perder o destaque). Tocar
 * fora fecha.
 */
export function MessageActionsOverlay({
  target,
  onClose,
  onReact,
  onReply,
  onForward,
  onCopy,
  onToggleStar,
  onDelete,
}: MessageActionsOverlayProps) {
  const {height: windowHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {colors} = useAppTheme();
  const [emojiMode, setEmojiMode] = useState(false);
  /** 0 = posição original da mensagem · 1 = ancorada acima do teclado. */
  const slide = useSharedValue(0);

  // reabrir o overlay (novo target) sempre começa no menu, não no teclado
  useEffect(() => {
    if (!target) {
      setEmojiMode(false);
    }
  }, [target]);

  // desliza a mensagem entre as duas posições — rápido e seco (sem mola)
  useEffect(() => {
    slide.value = withTiming(emojiMode ? 1 : 0, {
      duration: 190,
      easing: Easing.out(Easing.cubic),
    });
  }, [emojiMode, slide]);

  // altura do teclado de emojis (modo "+") — fica ancorado na base
  const keyboardHeight = Math.round(windowHeight * 0.52);

  // geometria da bolha nas duas posições (guardada — irrelevante sem target)
  const frame = target?.frame;
  const menuRows = target?.message.kind === 'text' ? 6 : 5;
  const menuHeight = menuRows * MENU_ROW_HEIGHT + 9;
  const blockTop = frame ? frame.y - BAR_HEIGHT - GAP : 0;
  const blockBottom = frame ? frame.y + frame.height + GAP + menuHeight : 0;
  const topBound = insets.top + 12;
  const bottomBound = windowHeight - insets.bottom - 12;
  let shift = 0;
  if (frame) {
    if (blockBottom > bottomBound) {
      shift = bottomBound - blockBottom;
    }
    if (blockTop + shift < topBound) {
      shift = topBound - blockTop;
    }
  }
  // topo da bolha: posição original (menu) e ancorada acima do teclado (emoji)
  const bubbleTopMenu = frame ? frame.y + shift : 0;
  const bubbleTopEmoji = frame
    ? windowHeight - keyboardHeight - GAP - frame.height
    : 0;

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: slide.value * (bubbleTopEmoji - bubbleTopMenu)},
    ],
  }));

  if (!target) {
    return (
      <Modal visible={false} transparent>
        <Box />
      </Modal>
    );
  }

  const {message} = target;
  const canCopy = message.kind === 'text';
  const align = message.isMine ? 'flex-end' : 'flex-start';

  const emojiTheme = {
    backdrop: 'transparent',
    knob: colors.textTertiary,
    container: colors.surface,
    header: colors.textSecondary,
    skinTonesContainer: colors.chip,
    category: {
      icon: colors.textSecondary,
      iconActive: colors.primary,
      container: colors.chip,
      containerActive: colors.primaryTint,
    },
    search: {
      background: colors.chip,
      text: colors.text,
      placeholder: colors.textSecondary,
      icon: colors.textSecondary,
    },
    emoji: {selected: colors.primaryTint},
  };

  const reactionBar = (
    <Animated.View entering={FadeInDown.duration(180)}>
      <Box
        flexDirection="row"
        alignItems="center"
        gap="s2"
        backgroundColor="surface"
        borderRadius="full"
        padding="s4"
        shadowColor="text"
        shadowOpacity={0.18}
        shadowRadius={12}
        shadowOffset={$shadowOffset}
        elevation={8}>
        {QUICK_REACTIONS.map(emoji => {
          const isMineReaction = message.reactions?.some(
            r => r.emoji === emoji && r.reactedByMe,
          );
          return (
            <TouchableOpacityBox
              key={emoji}
              onPress={() => onReact(message, emoji)}
              activeOpacity={0.6}
              backgroundColor={isMineReaction ? 'chip' : undefined}
              borderRadius="full"
              padding="s4">
              <Text style={$reactionEmoji}>{emoji}</Text>
            </TouchableOpacityBox>
          );
        })}
        <TouchableOpacityBox
          onPress={() => setEmojiMode(true)}
          activeOpacity={0.6}
          backgroundColor="chip"
          borderRadius="full"
          width={34}
          height={34}
          alignItems="center"
          justifyContent="center">
          <Icon name="plus" size={17} color="textSecondary" />
        </TouchableOpacityBox>
      </Box>
    </Animated.View>
  );

  const highlightedBubble = (
    <Box width="100%">
      <MessageBubble message={message} />
    </Box>
  );

  const menuItems: MenuItemSpec[] = [
    {icon: 'reply', label: 'Responder', onPress: () => onReply(message)},
    {icon: 'forward', label: 'Encaminhar', onPress: () => onForward(message)},
    ...(canCopy
      ? [
          {
            icon: 'copy' as IconName,
            label: 'Copiar',
            onPress: () => onCopy(message),
          },
        ]
      : []),
    {
      icon: 'star',
      label: message.starred ? 'Desfavoritar' : 'Favoritar',
      onPress: () => onToggleStar(message),
    },
    {
      icon: 'trash',
      label: 'Apagar',
      danger: true,
      onPress: () => onDelete(message),
    },
  ];

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <MenuBackdrop blur onPress={onClose}>
        {/* Barra de reações — só no modo menu, acima da bolha (some ao abrir
            o teclado) */}
        {!emojiMode && (
          <Box
            position="absolute"
            left={0}
            right={0}
            paddingHorizontal="s12"
            alignItems={align}
            style={{top: bubbleTopMenu - BAR_HEIGHT - GAP}}>
            {reactionBar}
          </Box>
        )}

        {/* Bolha em destaque — desliza entre a posição original e a de cima
            do teclado (o container fica sempre montado p/ a animação correr) */}
        <Animated.View
          style={[$bubbleWrap, {top: bubbleTopMenu}, bubbleAnimatedStyle]}>
          <Box paddingHorizontal="s12" alignItems={align}>
            {highlightedBubble}
          </Box>
        </Animated.View>

        {/* Menu de ações — só no modo menu, abaixo da bolha */}
        {!emojiMode && frame && (
          <Box
            position="absolute"
            left={0}
            right={0}
            paddingHorizontal="s12"
            alignItems={align}
            style={{top: bubbleTopMenu + frame.height + GAP}}>
            <Animated.View entering={FadeInUp.duration(180)}>
              <MenuCard items={menuItems} />
            </Animated.View>
          </Box>
        )}

        {/* Teclado de emojis subindo pela base (estilo WhatsApp) */}
        {emojiMode && (
          <Animated.View
            entering={SlideInDown.duration(220)}
            style={[$keyboard, {height: keyboardHeight}]}>
            <EmojiKeyboard
              onEmojiSelected={emoji => onReact(message, emoji.emoji)}
              enableSearchBar
              enableRecentlyUsed
              categoryPosition="bottom"
              translation={pt}
              theme={emojiTheme}
            />
          </Animated.View>
        )}
      </MenuBackdrop>
    </Modal>
  );
}

const $reactionEmoji: TextStyle = {
  fontSize: 24,
  lineHeight: 28,
};

const $bubbleWrap: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
};

const $keyboard: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  overflow: 'hidden',
};

const $shadowOffset = {width: 0, height: 4};

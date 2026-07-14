import React from 'react';

import {Modal, Pressable, TextStyle, ViewStyle, useWindowDimensions} from 'react-native';

import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Box, Icon, IconName, Text, TouchableOpacityBox} from '@components';
import {Message} from '@domain';

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
  onPickCustomReaction: (message: Message) => void;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onCopy: (message: Message) => void;
  onToggleStar: (message: Message) => void;
  onDelete: (message: Message) => void;
  onMore: (message: Message) => void;
}

/**
 * Overlay de long-press na mensagem (estilo WhatsApp): fundo escurecido,
 * a bolha em destaque na posição original, barra de reações acima e
 * menu de ações abaixo. Tocar fora fecha.
 */
export function MessageActionsOverlay({
  target,
  onClose,
  onReact,
  onPickCustomReaction,
  onReply,
  onForward,
  onCopy,
  onToggleStar,
  onDelete,
  onMore,
}: MessageActionsOverlayProps) {
  const {height: windowHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!target) {
    return (
      <Modal visible={false} transparent>
        <Box />
      </Modal>
    );
  }

  const {message, frame} = target;
  const canCopy = message.kind === 'text';
  const menuRows = canCopy ? 6 : 5;
  const menuHeight = menuRows * MENU_ROW_HEIGHT + 9;

  // desloca o bloco inteiro (barra + bolha + menu) p/ caber na tela
  const blockTop = frame.y - BAR_HEIGHT - GAP;
  const blockBottom = frame.y + frame.height + GAP + menuHeight;
  const topBound = insets.top + 12;
  const bottomBound = windowHeight - insets.bottom - 12;
  let shift = 0;
  if (blockBottom > bottomBound) {
    shift = bottomBound - blockBottom;
  }
  if (blockTop + shift < topBound) {
    shift = topBound - blockTop;
  }

  const align = message.isMine ? 'flex-end' : 'flex-start';

  const menuItems: Array<{
    icon: IconName;
    label: string;
    danger?: boolean;
    separated?: boolean;
    onPress: () => void;
  }> = [
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
    {
      icon: 'dots',
      label: 'Mais...',
      separated: true,
      onPress: () => onMore(message),
    },
  ];

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={$backdrop} onPress={onClose}>
        <Box
          position="absolute"
          left={0}
          right={0}
          paddingHorizontal="s12"
          alignItems={align}
          gap="s8"
          style={{top: blockTop + shift}}>
          {/* Barra de reações */}
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
                onPress={() => onPickCustomReaction(message)}
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

          {/* Bolha em destaque (clone estático na posição original) */}
          <Box width="100%">
            <MessageBubble message={message} />
          </Box>

          {/* Menu de ações */}
          <Animated.View entering={FadeInUp.duration(180)}>
            <Box
              width={250}
              backgroundColor="card"
              borderRadius="br16"
              paddingVertical="s4"
              shadowColor="text"
              shadowOpacity={0.18}
              shadowRadius={12}
              shadowOffset={$shadowOffset}
              elevation={8}
              overflow="hidden">
              {menuItems.map(item => (
                <Box key={item.label}>
                  {item.separated && (
                    <Box
                      height={1}
                      backgroundColor="separator"
                      marginVertical="s4"
                    />
                  )}
                  <TouchableOpacityBox
                    onPress={item.onPress}
                    activeOpacity={0.6}
                    flexDirection="row"
                    alignItems="center"
                    gap="s12"
                    paddingHorizontal="s14"
                    paddingVertical="s12">
                    <Icon
                      name={item.icon}
                      size={19}
                      color={item.danger ? 'danger' : 'text'}
                    />
                    <Text
                      variant="paragraph"
                      color={item.danger ? 'danger' : 'text'}>
                      {item.label}
                    </Text>
                  </TouchableOpacityBox>
                </Box>
              ))}
            </Box>
          </Animated.View>
        </Box>
      </Pressable>
    </Modal>
  );
}

const $backdrop: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.55)',
};

const $reactionEmoji: TextStyle = {
  fontSize: 24,
  lineHeight: 28,
};

const $shadowOffset = {width: 0, height: 4};

import React, {useCallback, useRef} from 'react';

import {Image, ImageStyle, Pressable, TextStyle, View, ViewStyle} from 'react-native';

import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import {trigger as triggerHaptic} from 'react-native-haptic-feedback';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

import {Box, Icon, Text, TouchableOpacityBox} from '@components';
import {Message, MessageReply} from '@domain';
import {useAppTheme} from '@hooks';

import {VoiceMessageBubble} from './VoiceMessageBubble';

/** Arrastar a bolha além disso dispara a resposta ao soltar (com haptic). */
const REPLY_TRIGGER = 52;
/** Depois daqui o arrasto ganha resistência — a bolha não acompanha o dedo 1:1. */
const MAX_DRAG = 72;

/** Posição da bolha em coordenadas de janela, medida no long-press. */
export interface BubbleFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MessageBubbleProps {
  message: Message;
  /** Quando presente, habilita o swipe-to-reply (estilo WhatsApp/Instagram). */
  onReply?: (message: Message) => void;
  /** Tocar na citação de uma resposta rola a lista até a mensagem original. */
  onQuotePress?: (messageId: string) => void;
  /** Segurar a bolha abre o menu de ações (overlay) na posição medida. */
  onLongPress?: (message: Message, frame: BubbleFrame) => void;
  /** Tocar num chip de reação alterna a minha reação naquele emoji. */
  onReactionPress?: (message: Message, emoji: string) => void;
}

function MessageContent({message}: {message: Message}) {
  if (message.kind === 'audio') {
    return <VoiceMessageBubble message={message} />;
  }
  if (message.kind === 'image') {
    return (
      <Image source={{uri: message.imageUri}} style={$image} resizeMode="cover" />
    );
  }
  return <Text variant="paragraph">{message.text}</Text>;
}

/** Citação da mensagem original dentro da bolha (mensagens que respondem outra). */
function ReplyQuote({
  reply,
  onPress,
}: {
  reply: MessageReply;
  onPress?: (messageId: string) => void;
}) {
  return (
    <TouchableOpacityBox
      onPress={onPress ? () => onPress(reply.messageId) : undefined}
      activeOpacity={0.7}
      disabled={!onPress}
      backgroundColor="primaryTint"
      borderRadius="br6"
      borderLeftWidth={3}
      borderLeftColor="primary"
      paddingHorizontal="s8"
      paddingVertical="s4"
      marginBottom="s6">
      <Text variant="captionSmall" fontWeight="700" color="primary" numberOfLines={1}>
        {reply.authorName}
      </Text>
      <Text variant="captionSmall" color="textSecondary" numberOfLines={1}>
        {reply.preview}
      </Text>
    </TouchableOpacityBox>
  );
}

/** Chips de reação sobrepostos à borda inferior da bolha (estilo WhatsApp). */
function ReactionChips({
  message,
  onPress,
}: {
  message: Message;
  onPress?: (message: Message, emoji: string) => void;
}) {
  return (
    <Box
      flexDirection="row"
      gap="s4"
      alignSelf={message.isMine ? 'flex-end' : 'flex-start'}
      paddingHorizontal="s6"
      style={$reactionsRow}>
      {message.reactions?.map(reaction => (
        <TouchableOpacityBox
          key={reaction.emoji}
          onPress={onPress ? () => onPress(message, reaction.emoji) : undefined}
          disabled={!onPress}
          activeOpacity={0.7}
          flexDirection="row"
          alignItems="center"
          gap="s2"
          backgroundColor="surface"
          borderRadius="full"
          paddingHorizontal="s6"
          paddingVertical="s2"
          borderWidth={1}
          borderColor={reaction.reactedByMe ? 'primary' : 'separator'}>
          <Text style={$reactionEmoji}>{reaction.emoji}</Text>
          {reaction.count > 1 && (
            <Text variant="tiny" color="textSecondary">
              {reaction.count}
            </Text>
          )}
        </TouchableOpacityBox>
      ))}
    </Box>
  );
}

export function MessageBubble({
  message,
  onReply,
  onQuotePress,
  onLongPress,
  onReactionPress,
}: MessageBubbleProps) {
  const pressableRef = useRef<View>(null);
  /** true enquanto um swipe-to-reply está em curso — bloqueia o long-press. */
  const isSwipingRef = useRef(false);

  const handleLongPress = useCallback(() => {
    if (!onLongPress || isSwipingRef.current) {
      return;
    }
    triggerHaptic('impactMedium');
    pressableRef.current?.measureInWindow((x, y, width, height) =>
      onLongPress(message, {x, y, width, height}),
    );
  }, [message, onLongPress]);

  if (message.kind === 'system') {
    return (
      <Box
        alignSelf="center"
        backgroundColor="primaryTint"
        borderRadius="br10"
        paddingHorizontal="s12"
        paddingVertical="s4"
        marginVertical="s4">
        <Text variant="captionSmall" textAlign="center">
          {message.text}
        </Text>
      </Box>
    );
  }

  const bubble = message.isMine ? (
    <Box
      alignSelf="flex-end"
      maxWidth="80%"
      backgroundColor="bubbleOutgoing"
      borderRadius="br14"
      borderTopRightRadius="br4"
      paddingHorizontal="s10"
      paddingVertical="s8">
      {message.replyTo && (
        <ReplyQuote reply={message.replyTo} onPress={onQuotePress} />
      )}
      <MessageContent message={message} />
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        gap="s2"
        marginTop="s2">
        {message.starred && <Icon name="star" size={11} color="textSecondary" />}
        <Text variant="tiny">{message.time}</Text>
        {message.ticks === 'read' && (
          <Icon name="doubleCheck" size={13} color="primary" />
        )}
        {message.ticks === 'sent' && (
          <Icon name="check" size={13} color="textTertiary" />
        )}
      </Box>
    </Box>
  ) : (
    <Box
      alignSelf="flex-start"
      maxWidth="80%"
      backgroundColor="bubbleIncoming"
      borderRadius="br14"
      borderTopLeftRadius="br4"
      paddingHorizontal="s10"
      paddingVertical="s8"
      shadowColor="text"
      shadowOpacity={0.06}
      shadowRadius={1}
      shadowOffset={$shadowOffset}
      elevation={1}>
      {message.author && (
        <Text
          variant="captionSmall"
          fontWeight="700"
          marginBottom="s2"
          style={{color: message.author.color}}>
          {message.author.name}
        </Text>
      )}
      {message.replyTo && (
        <ReplyQuote reply={message.replyTo} onPress={onQuotePress} />
      )}
      <MessageContent message={message} />
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        gap="s2"
        marginTop="s2">
        {message.starred && <Icon name="star" size={11} color="textSecondary" />}
        <Text variant="tiny">{message.time}</Text>
      </Box>
    </Box>
  );

  const withReactions = message.reactions?.length ? (
    <>
      {bubble}
      <ReactionChips message={message} onPress={onReactionPress} />
    </>
  ) : (
    bubble
  );

  const content = onLongPress ? (
    <Pressable
      ref={pressableRef}
      onLongPress={handleLongPress}
      delayLongPress={300}>
      {withReactions}
    </Pressable>
  ) : (
    withReactions
  );

  if (!onReply) {
    return content;
  }

  return (
    <SwipeToReplyRow
      message={message}
      onReply={onReply}
      isSwipingRef={isSwipingRef}>
      {content}
    </SwipeToReplyRow>
  );
}

/**
 * Arrastar a bolha para a direita revela um ícone de resposta atrás dela;
 * passando do gatilho vibra e, ao soltar, dispara `onReply` — mesmo gesto
 * do WhatsApp/Instagram. Só o eixo horizontal ativa (activeOffsetX) e o
 * gesto falha se o movimento for vertical (failOffsetY), para não brigar
 * com o scroll da lista de mensagens.
 */
function SwipeToReplyRow({
  message,
  onReply,
  isSwipingRef,
  children,
}: {
  message: Message;
  onReply: (message: Message) => void;
  /** Sinaliza swipe em curso p/ o long-press da bolha não disparar no meio do arrasto. */
  isSwipingRef?: React.RefObject<boolean>;
  children: React.ReactNode;
}) {
  const {colors} = useAppTheme();
  const translateX = useSharedValue(0);
  /** Translação bruta (sem clamp/resistência) — o evento de onFinalize não traz translationX. */
  const rawX = useSharedValue(0);
  const pastTrigger = useSharedValue(false);
  const swipeStarted = useSharedValue(false);

  const hapticTick = useCallback(() => triggerHaptic('impactMedium'), []);
  // worklets NÃO capturam isSwipingRef (objeto com ref mutável congela — Fase 12);
  // a escrita acontece do lado JS, via scheduleOnRN destas funções
  const markSwiping = useCallback(() => {
    if (isSwipingRef) {
      isSwipingRef.current = true;
    }
  }, [isSwipingRef]);
  const handleRelease = useCallback(
    (finalX: number) => {
      if (isSwipingRef) {
        isSwipingRef.current = false;
      }
      if (finalX >= REPLY_TRIGGER) {
        onReply(message);
      }
    },
    [isSwipingRef, onReply, message],
  );

  const panGesture = usePanGesture({
    // ativa só depois de 24pt para a DIREITA — swipe à esquerda não existe aqui
    activeOffsetX: 24,
    failOffsetY: [-12, 12],
    onUpdate: e => {
      'worklet';
      const x = Math.max(0, e.translationX);
      rawX.value = x;
      translateX.value = x > MAX_DRAG ? MAX_DRAG + (x - MAX_DRAG) * 0.15 : x;
      if (!swipeStarted.value && x > 8) {
        swipeStarted.value = true;
        scheduleOnRN(markSwiping);
      }
      if (!pastTrigger.value && x >= REPLY_TRIGGER) {
        pastTrigger.value = true;
        scheduleOnRN(hapticTick);
      } else if (pastTrigger.value && x < REPLY_TRIGGER) {
        pastTrigger.value = false;
      }
    },
    onFinalize: () => {
      'worklet';
      const finalX = rawX.value;
      rawX.value = 0;
      pastTrigger.value = false;
      swipeStarted.value = false;
      translateX.value = withTiming(0, {duration: 180});
      scheduleOnRN(handleRelease, finalX);
    },
  });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [8, REPLY_TRIGGER],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [8, REPLY_TRIGGER],
          [0.4, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[$replyBadge, iconStyle, {backgroundColor: colors.chip}]}>
          <Icon name="reply" size={15} color="textSecondary" />
        </Animated.View>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const $shadowOffset = {width: 0, height: 1};

const $image: ImageStyle = {
  width: 220,
  height: 220,
  borderRadius: 10,
};

// sobrepõe os chips à borda inferior da bolha, como no WhatsApp
const $reactionsRow: ViewStyle = {
  marginTop: -8,
  zIndex: 1,
};

const $reactionEmoji: TextStyle = {
  fontSize: 12,
  lineHeight: 16,
};

const $replyBadge: ViewStyle = {
  position: 'absolute',
  left: 0,
  top: '50%',
  marginTop: -15,
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
};

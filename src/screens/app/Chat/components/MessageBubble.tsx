import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  Image,
  Keyboard,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import {trigger as triggerHaptic} from 'react-native-haptic-feedback';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

import {Box, Icon, Text, TouchableOpacityBox} from '@components';
import {Message, MessageForward, MessageReply} from '@domain';
import {useAppTheme} from '@hooks';

import {VoiceMessageBubble} from './VoiceMessageBubble';

/** Arrastar a bolha além disso dispara a resposta ao soltar (com haptic). */
const REPLY_TRIGGER = 52;
/** Depois daqui o arrasto ganha resistência — a bolha não acompanha o dedo 1:1. */
const MAX_DRAG = 72;

/**
 * Animação de ENTRADA da bolha (mensagem enviada/recebida "aparecendo"):
 * fade + leve escala. Só opacity/scale — nada de translateY — porque a lista
 * é `inverted` (scaleY:-1) e um deslocamento vertical entraria invertido.
 * Aplicada apenas em mensagens novas (guarda de id na ChatScreen), nunca ao
 * rolar/reciclar bolhas antigas.
 */
function bubbleEntering() {
  'worklet';
  return {
    initialValues: {opacity: 0, transform: [{scale: 0.9}]},
    animations: {
      opacity: withTiming(1, {duration: 180}),
      transform: [{scale: withSpring(1, {damping: 15, stiffness: 220, mass: 0.6})}],
    },
  };
}

/** Animação de SAÍDA da bolha (mensagem apagada "sumindo"): fade + encolher. */
function bubbleExiting() {
  'worklet';
  return {
    initialValues: {opacity: 1, transform: [{scale: 1}]},
    animations: {
      opacity: withTiming(0, {duration: 160}),
      transform: [{scale: withTiming(0.85, {duration: 160})}],
    },
  };
}

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
  /**
   * Tocar numa imagem abre o visualizador em tela cheia (shared element).
   * `realSize` é o tamanho REAL da foto quando já medido (cache) — evita o
   * visualizador refazer Image.getSize (lento em URI remota).
   */
  onImagePress?: (
    message: Message,
    frame: BubbleFrame,
    realSize?: {width: number; height: number},
  ) => void;
  /** Habilita o botão flutuante de encaminhamento rápido em mídias. */
  onForward?: (message: Message) => void;
  /**
   * true quando a mensagem acabou de chegar (enviada/recebida) — dispara a
   * animação de entrada. Falso/omitido para as já existentes (carga inicial,
   * bolhas recicladas ao rolar) para não reanimarem.
   */
  animateEntrance?: boolean;
}

/** Horário + ticks sobrepostos ao canto inferior direito da imagem (WhatsApp). */
function ImageTimeOverlay({message}: {message: Message}) {
  return (
    <Box
      position="absolute"
      bottom={6}
      right={6}
      flexDirection="row"
      alignItems="center"
      gap="s2"
      paddingHorizontal="s6"
      paddingVertical="s2"
      borderRadius="full"
      style={$timeScrim}>
      {message.starred && (
        <Icon name="star" size={11} color="primaryContrast" />
      )}
      <Text variant="tiny" style={$timeOverlayText}>
        {message.time}
      </Text>
      {message.isMine && message.ticks === 'read' && (
        <Icon name="doubleCheck" size={13} color="primaryContrast" />
      )}
      {message.isMine && message.ticks === 'sent' && (
        <Icon name="check" size={13} color="primaryContrast" />
      )}
    </Box>
  );
}

/** Footer padrão da bolha: estrela de favorita + hora + ticks (só nas minhas). */
function BubbleFooter({message}: {message: Message}) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-end"
      gap="s2"
      marginTop="s2">
      {message.starred && <Icon name="star" size={11} color="textSecondary" />}
      <Text variant="tiny">{message.time}</Text>
      {message.isMine && message.ticks === 'read' && (
        <Icon name="doubleCheck" size={13} color="primary" />
      )}
      {message.isMine && message.ticks === 'sent' && (
        <Icon name="check" size={13} color="textTertiary" />
      )}
    </Box>
  );
}

/** Botão flutuante de encaminhamento rápido ao lado de mídias (WhatsApp). */
function QuickForwardButton({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.7}
      width={38}
      height={38}
      borderRadius="full"
      backgroundColor="surface"
      alignItems="center"
      justifyContent="center"
      shadowColor="text"
      shadowOpacity={0.15}
      shadowRadius={5}
      shadowOffset={$forwardShadow}
      elevation={4}>
      <Icon name="forward" size={18} color="textSecondary" />
    </TouchableOpacityBox>
  );
}

/**
 * Tamanho real das imagens já medidas (Image.getSize) — evita a bolha
 * "pular" de tamanho quando a FlatList recicla/remonta a mensagem.
 */
const imageSizeCache = new Map<string, {width: number; height: number}>();

/** Espessura do frame da bolha em volta da foto (padding s4 de cada lado). */
const IMAGE_FRAME = 4;

/**
 * Tamanho de EXIBIÇÃO da foto na bolha (estilo WhatsApp): proporção real
 * (retrato alto, paisagem largo) dentro de uma caixa máxima. O valor é
 * usado como largura EXPLÍCITA da bolha — nada de maxWidth em % (que,
 * dentro de pais dimensionados pelo conteúdo, resolve errado e deixa a
 * imagem vazar pra fora do card).
 */
function useChatImageSize(uri: string | undefined, windowWidth: number) {
  const [size, setSize] = useState(
    uri ? imageSizeCache.get(uri) ?? null : null,
  );

  useEffect(() => {
    if (!uri) {
      return;
    }
    const cached = imageSizeCache.get(uri);
    if (cached) {
      setSize(cached);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        imageSizeCache.set(uri, {width, height});
        if (!cancelled) {
          setSize({width, height});
        }
      },
      // falhou a medição → mantém o fallback quadrado
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  // caixa máxima: ~65% da tela — folga p/ o botão de encaminhar + paddings
  const maxW = Math.min(windowWidth * 0.65, 280);
  const maxH = Math.min(windowWidth * 1.05, 420);
  const minW = 140;

  const aspect = size && size.height > 0 ? size.width / size.height : 1;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  if (w < minW) {
    // foto muito estreita/alta — trava a largura mínima e deixa o cover cortar
    w = minW;
  }

  return {width: Math.round(w), height: Math.round(h)};
}

/**
 * Conteúdo da bolha. A imagem recebe um ref no seu container pra que o tap
 * (tratado no Pressable externo da bolha) meça o retângulo exato e o passe
 * ao visualizador em tela cheia (transição de shared element).
 */
function MessageContent({
  message,
  imageRef,
  imageSize,
}: {
  message: Message;
  imageRef?: React.RefObject<View | null>;
  imageSize?: {width: number; height: number};
}) {
  if (message.kind === 'audio') {
    return <VoiceMessageBubble message={message} />;
  }
  if (message.kind === 'image') {
    return (
      <View ref={imageRef} collapsable={false} style={$imageWrap}>
        <Image
          source={{uri: message.imageUri}}
          style={imageSize}
          resizeMode="cover"
        />
      </View>
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

/**
 * Cabeçalho de mensagem encaminhada (estilo WhatsApp): ícone + "Encaminhada"
 * e o nome do usuário que a enviou originalmente. Só aparece quando a mensagem
 * veio de outro usuário — encaminhar mensagem própria não gera referência.
 */
function ForwardedHeader({forward}: {forward: MessageForward}) {
  return (
    <Box marginBottom="s6">
      <Box flexDirection="row" alignItems="center" gap="s4" marginBottom="s6">
        <Icon name="forward" size={13} color="textSecondary" />
        <Text variant="captionSmall" color="textSecondary" style={$forwardedLabel}>
          Encaminhada
        </Text>
      </Box>
      <Text variant="captionSmall" fontWeight="700" numberOfLines={1}>
        {forward.authorName}
      </Text>
      <Box height={1} backgroundColor="separator" marginTop="s6" />
    </Box>
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
  onImagePress,
  onForward,
  animateEntrance,
}: MessageBubbleProps) {
  const pressableRef = useRef<View>(null);
  const imageRef = useRef<View>(null);
  /** true enquanto um swipe-to-reply está em curso — bloqueia o long-press. */
  const isSwipingRef = useRef(false);

  const {width: windowWidth} = useWindowDimensions();
  const isImage = message.kind === 'image';
  /** Foto com legenda: texto abaixo da imagem + footer normal (sem overlay). */
  const hasCaption = isImage && message.text.length > 0;
  const imageSize = useChatImageSize(
    isImage ? message.imageUri : undefined,
    windowWidth,
  );
  /** Largura EXPLÍCITA da bolha de imagem: foto + frame dos dois lados. */
  const imageBubbleWidth = imageSize.width + IMAGE_FRAME * 2;

  const handleLongPress = useCallback(() => {
    if (!onLongPress || isSwipingRef.current) {
      return;
    }
    triggerHaptic('impactMedium');
    pressableRef.current?.measureInWindow((x, y, width, height) =>
      onLongPress(message, {x, y, width, height}),
    );
  }, [message, onLongPress]);

  /** Tap numa mensagem de imagem → mede a imagem e abre o visualizador. */
  const handlePress = useCallback(() => {
    if (message.kind !== 'image' || !onImagePress || !message.imageUri) {
      return;
    }
    const uri = message.imageUri;
    imageRef.current?.measureInWindow((x, y, width, height) =>
      onImagePress(message, {x, y, width, height}, imageSizeCache.get(uri)),
    );
  }, [message, onImagePress]);

  const isImageTappable = isImage && !!onImagePress;

  if (message.kind === 'system') {
    return (
      <Animated.View
        entering={animateEntrance ? bubbleEntering : undefined}
        exiting={bubbleExiting}>
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
      </Animated.View>
    );
  }

  const bubble = message.isMine ? (
    <Box
      alignSelf="flex-end"
      maxWidth={isImage ? undefined : '80%'}
      width={isImage ? imageBubbleWidth : undefined}
      backgroundColor="bubbleOutgoing"
      borderRadius="br14"
      borderTopRightRadius="br4"
      paddingHorizontal={isImage ? 's4' : 's10'}
      paddingVertical={isImage ? 's4' : 's8'}>
      {/* headers (encaminhada/resposta) ganham respiro extra na bolha de
          imagem — o frame de 4px é fino demais pra texto encostado */}
      {(message.forwardedFrom || message.replyTo) && (
        <Box
          paddingHorizontal={isImage ? 's6' : 's0'}
          paddingTop={isImage ? 's4' : 's0'}>
          {message.forwardedFrom && (
            <ForwardedHeader forward={message.forwardedFrom} />
          )}
          {message.replyTo && (
            <ReplyQuote reply={message.replyTo} onPress={onQuotePress} />
          )}
        </Box>
      )}
      {isImage ? (
        <>
          <Box>
            <MessageContent
              message={message}
              imageRef={imageRef}
              imageSize={imageSize}
            />
            {!hasCaption && <ImageTimeOverlay message={message} />}
          </Box>
          {hasCaption && (
            <Box paddingHorizontal="s6" paddingTop="s4" paddingBottom="s2">
              <Text variant="paragraph">{message.text}</Text>
              <BubbleFooter message={message} />
            </Box>
          )}
        </>
      ) : (
        <>
          <MessageContent message={message} imageRef={imageRef} />
          <BubbleFooter message={message} />
        </>
      )}
    </Box>
  ) : (
    <Box
      alignSelf="flex-start"
      maxWidth={isImage ? undefined : '80%'}
      width={isImage ? imageBubbleWidth : undefined}
      backgroundColor="bubbleIncoming"
      borderRadius="br14"
      borderTopLeftRadius="br4"
      paddingHorizontal={isImage ? 's4' : 's10'}
      paddingVertical={isImage ? 's4' : 's8'}
      shadowColor="text"
      shadowOpacity={0.06}
      shadowRadius={1}
      shadowOffset={$shadowOffset}
      elevation={1}>
      {/* headers (autor/encaminhada/resposta) ganham respiro extra na bolha
          de imagem — o frame de 4px é fino demais pra texto encostado */}
      {(message.author || message.forwardedFrom || message.replyTo) && (
        <Box
          paddingHorizontal={isImage ? 's6' : 's0'}
          paddingTop={isImage ? 's4' : 's0'}>
          {message.author && (
            <Text
              variant="captionSmall"
              fontWeight="700"
              marginBottom="s2"
              style={{color: message.author.color}}>
              {message.author.name}
            </Text>
          )}
          {message.forwardedFrom && (
            <ForwardedHeader forward={message.forwardedFrom} />
          )}
          {message.replyTo && (
            <ReplyQuote reply={message.replyTo} onPress={onQuotePress} />
          )}
        </Box>
      )}
      {isImage ? (
        <>
          <Box>
            <MessageContent
              message={message}
              imageRef={imageRef}
              imageSize={imageSize}
            />
            {!hasCaption && <ImageTimeOverlay message={message} />}
          </Box>
          {hasCaption && (
            <Box paddingHorizontal="s6" paddingTop="s4" paddingBottom="s2">
              <Text variant="paragraph">{message.text}</Text>
              <BubbleFooter message={message} />
            </Box>
          )}
        </>
      ) : (
        <>
          <MessageContent message={message} imageRef={imageRef} />
          <BubbleFooter message={message} />
        </>
      )}
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

  const pressable =
    onLongPress || isImageTappable ? (
      <Pressable
        ref={pressableRef}
        // o Pressable captura o toque (long-press), então o tap na bolha não
        // chega ao gesto da lista — fecha o teclado aqui também
        onPress={isImageTappable ? handlePress : Keyboard.dismiss}
        onLongPress={onLongPress ? handleLongPress : undefined}
        delayLongPress={300}>
        {withReactions}
      </Pressable>
    ) : (
      withReactions
    );

  // mídias ganham o botão de encaminhamento rápido ao lado da bolha (WhatsApp);
  // fica fora do Pressable p/ o tap dele não abrir o visualizador.
  // alignSelf (e não justifyContent) — a linha encolhe pro tamanho do
  // conteúdo, deixando a seta colada na bolha e a bolha dentro da margem
  const content =
    isImage && onForward ? (
      <Box
        flexDirection="row"
        alignItems="center"
        gap="s12"
        alignSelf={message.isMine ? 'flex-end' : 'flex-start'}>
        {message.isMine && (
          <QuickForwardButton onPress={() => onForward(message)} />
        )}
        {pressable}
        {!message.isMine && (
          <QuickForwardButton onPress={() => onForward(message)} />
        )}
      </Box>
    ) : (
      pressable
    );

  const node = onReply ? (
    <SwipeToReplyRow
      message={message}
      onReply={onReply}
      isSwipingRef={isSwipingRef}>
      {content}
    </SwipeToReplyRow>
  ) : (
    content
  );

  // Envolve tudo (inclusive o gesto de swipe) para animar entrada/saída da
  // bolha sem interferir nos gestos internos. `transformOrigin` ancora a escala
  // no lado da bolha: as minhas (direita) crescem da direita p/ a esquerda, as
  // do outro (esquerda) crescem da esquerda p/ a direita — direcional e sutil.
  return (
    <Animated.View
      entering={animateEntrance ? bubbleEntering : undefined}
      exiting={bubbleExiting}
      style={message.isMine ? $originRight : $originLeft}>
      {node}
    </Animated.View>
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

// ancora a escala da animação de entrada/saída no lado da bolha (transformOrigin
// horizontal; o vertical fica no centro, sutil). Não afetado pelo scaleY:-1 da
// lista inverted, que inverte só o eixo Y.
const $originRight: ViewStyle = {transformOrigin: 'right center'};
const $originLeft: ViewStyle = {transformOrigin: 'left center'};

const $shadowOffset = {width: 0, height: 1};

const $forwardedLabel: TextStyle = {
  fontStyle: 'italic',
};

const $imageWrap: ViewStyle = {
  alignSelf: 'flex-start',
  // arredondamento 10 por dentro do frame de 4px da bolha (br14 − 4)
  borderRadius: 10,
  overflow: 'hidden',
};

const $timeScrim: ViewStyle = {
  backgroundColor: 'rgba(0,0,0,0.35)',
};

const $timeOverlayText: TextStyle = {
  color: '#fff',
};

const $forwardShadow = {width: 0, height: 2};

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

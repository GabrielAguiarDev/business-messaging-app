import React, {useEffect, useRef, useState} from 'react';

import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {scheduleOnRN} from 'react-native-worklets';
import {EmojiKeyboard, pt} from 'rn-emoji-keyboard';

import {Icon, IconName, Text, TouchableOpacityBox} from '@components';
import {useAppTheme} from '@hooks';

/** Imagem tocada + geometria dela na janela (measureInWindow) + tamanho real. */
export interface ImageViewerTarget {
  uri: string;
  frame: {x: number; y: number; width: number; height: number};
  /** Dimensões reais da imagem (Image.getSize) — definem o retângulo final. */
  imageWidth: number;
  imageHeight: number;
  /** Quem enviou — "Você" ou o nome do autor (barra superior). */
  title: string;
  /** Data/horário da mensagem (barra superior). */
  subtitle: string;
  /** Estado de favorita — pinta a estrela da barra inferior. */
  starred?: boolean;
  /** Raio do retângulo de origem — ex.: metade do tamanho de um avatar
   * circular. Default 10 (bolha de mensagem). */
  cornerRadius?: number;
}

interface ImageViewerProps {
  target: ImageViewerTarget | null;
  onClose: () => void;
  /** Ações da barra inferior — botão só aparece quando o handler existe. */
  onDownload?: () => void;
  onForward?: () => void;
  onToggleStar?: () => void;
  onDelete?: () => void;
  /** Responder a foto (pill flutuante) — fecha o viewer e abre o composer. */
  onReply?: () => void;
  /** Reagir com emoji (botão flutuante abre o teclado de emojis). */
  onReact?: (emoji: string) => void;
}

/**
 * Degradê do chrome superior (preto → transparente). Ajuste fino aqui:
 * cada parada é "cor posição%" — aumente a opacidade/posição pra escurecer
 * mais/descer mais o degradê.
 */
const TOP_GRADIENT =
  'linear-gradient(180deg, rgba(0, 0, 0, 0.754) 0%, rgba(0, 0, 0, 0.617) 45%, rgba(0,0,0,0) 100%)';

/** Degradê de transição acima da barra inferior (transparente → preto). */
const BOTTOM_GRADIENT =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,1) 100%)';

/** Passar disto no arrasto → solta fecha (encolhe de volta pra bolha). */
const DISMISS_DISTANCE = 140;
const OPEN_DURATION = 260;
const CLOSE_DURATION = 220;
/** Limite do zoom por pinça. */
const MAX_ZOOM = 5;

/** Interpolação linear (worklet) entre dois valores conforme progress 0→1. */
function lerp(p: number, a: number, b: number) {
  'worklet';
  return a + (b - a) * p;
}

/**
 * Botão "liquid glass" pro chrome sobre mídia (iOS 26+; fallback chip
 * escuro) — círculo ou pill conforme o borderRadius/conteúdo. Usado aqui
 * e na tela de preview da foto antes do envio (PhotoPreviewSheet).
 */
export function GlassButton({
  onPress,
  borderRadius,
  style,
  children,
}: {
  onPress: () => void;
  borderRadius: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const touchable = (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.75}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap="s6"
      style={[
        style,
        {borderRadius},
        !isLiquidGlassSupported && styles.glassFallback,
      ]}>
      {children}
    </TouchableOpacityBox>
  );

  if (isLiquidGlassSupported) {
    return (
      <View style={[styles.glassClip, {borderRadius}]}>
        <LiquidGlassView interactive effect="regular" style={{borderRadius}}>
          {touchable}
        </LiquidGlassView>
      </View>
    );
  }
  return touchable;
}

/**
 * Visualizador de imagem em tela cheia (estilo WhatsApp/Fotos):
 * - abre com transição de shared element a partir do retângulo da bolha;
 * - pinça dá zoom (até 5x); com zoom, um dedo arrasta e double-tap volta
 *   pro encaixe; sem zoom, arrastar na vertical fecha;
 * - tap alterna o "chrome": degradê + glass no topo (autor + data/hora),
 *   flutuantes de reação/responder e barra escura de ações embaixo.
 */
export function ImageViewer({
  target,
  onClose,
  onDownload,
  onForward,
  onToggleStar,
  onDelete,
  onReply,
  onReact,
}: ImageViewerProps) {
  const {width: screenW, height: screenH} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {colors} = useAppTheme();

  // cópia interna: mantém o conteúdo montado durante a animação de fechar,
  // mesmo depois de o pai limpar o target
  const [current, setCurrent] = useState<ImageViewerTarget | null>(target);
  /** Chrome (barras) visível — tap na imagem alterna. */
  const [chromeVisible, setChromeVisible] = useState(true);
  /** Teclado de emojis aberto (botão de reação). */
  const [emojiOpen, setEmojiOpen] = useState(false);

  /** 0 = na bolha (frame) · 1 = tela cheia. Dirige o shared element. */
  const progress = useSharedValue(0);
  /** Arrasto vertical durante a visualização SEM zoom (dismiss gesture). */
  const dragY = useSharedValue(0);
  /** Zoom por pinça (1 = sem zoom). */
  const zoom = useSharedValue(1);
  const zoomSaved = useSharedValue(1);
  /** Arrasto da imagem COM zoom. */
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const panSavedX = useSharedValue(0);
  const panSavedY = useSharedValue(0);
  /** Opacidade do chrome (anima junto do estado chromeVisible). */
  const chromeOpacity = useSharedValue(1);

  /** URI aberta no momento — distingue abertura nova de atualização
   * do mesmo target (ex.: toggle de favorita), que NÃO reinicia a animação. */
  const openUriRef = useRef<string | null>(null);

  useEffect(() => {
    if (target) {
      setCurrent(target);
      if (openUriRef.current !== target.uri) {
        // abertura nova — zera gestos e prepara o shared element
        openUriRef.current = target.uri;
        setChromeVisible(true);
        setEmojiOpen(false);
        chromeOpacity.value = 1;
        dragY.value = 0;
        zoom.value = 1;
        zoomSaved.value = 1;
        panX.value = 0;
        panY.value = 0;
        panSavedX.value = 0;
        panSavedY.value = 0;
        progress.value = 0;
      }
    } else {
      // fechado por fora (ex.: apagar/encaminhar) — desmonta sem animação
      openUriRef.current = null;
      setCurrent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  /**
   * Cresce da bolha pra tela cheia SÓ quando o bitmap está pronto (onLoad).
   * Imagens remotas (http) decodificam async — disparar no mount rodava a
   * animação com a imagem ainda em branco e o shared element "não aparecia".
   */
  function startOpenAnimation() {
    if (progress.value === 0) {
      progress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }
  }

  function finishClose() {
    setCurrent(null);
    onClose();
  }

  /** Encolhe de volta pra bolha e desmonta ao terminar. */
  function requestClose() {
    setEmojiOpen(false);
    dragY.value = withTiming(0, {duration: CLOSE_DURATION});
    zoom.value = withTiming(1, {duration: CLOSE_DURATION});
    panX.value = withTiming(0, {duration: CLOSE_DURATION});
    panY.value = withTiming(0, {duration: CLOSE_DURATION});
    progress.value = withTiming(
      0,
      {duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic)},
      finished => {
        'worklet';
        if (finished) {
          scheduleOnRN(finishClose);
        }
      },
    );
  }

  function toggleChrome() {
    setChromeVisible(visible => {
      chromeOpacity.value = withTiming(visible ? 0 : 1, {duration: 160});
      return !visible;
    });
  }

  /** Pinça: zoom em torno do centro; soltar abaixo de 1x volta pro encaixe. */
  const pinchGesture = usePinchGesture({
    onUpdate: e => {
      'worklet';
      zoom.value = Math.min(zoomSaved.value * e.scale, MAX_ZOOM);
    },
    onFinalize: () => {
      'worklet';
      if (zoom.value <= 1) {
        zoom.value = withTiming(1, {duration: 180});
        zoomSaved.value = 1;
        panX.value = withTiming(0, {duration: 180});
        panY.value = withTiming(0, {duration: 180});
        panSavedX.value = 0;
        panSavedY.value = 0;
      } else {
        zoomSaved.value = zoom.value;
      }
    },
  });

  /** Um dedo: com zoom arrasta a imagem; sem zoom, arrasto vertical fecha. */
  const panGesture = usePanGesture({
    maxPointers: 1,
    activeOffsetX: [-14, 14],
    activeOffsetY: [-14, 14],
    onUpdate: e => {
      'worklet';
      if (zoom.value > 1) {
        panX.value = panSavedX.value + e.translationX;
        panY.value = panSavedY.value + e.translationY;
      } else {
        dragY.value = e.translationY;
      }
    },
    onFinalize: () => {
      'worklet';
      if (zoom.value > 1) {
        panSavedX.value = panX.value;
        panSavedY.value = panY.value;
      } else if (Math.abs(dragY.value) > DISMISS_DISTANCE) {
        scheduleOnRN(requestClose);
      } else {
        dragY.value = withTiming(0, {duration: 200});
      }
    },
  });

  /** Tap na imagem esconde/mostra as barras (estilo Fotos/WhatsApp). */
  const tapGesture = useTapGesture({
    runOnJS: true,
    onActivate: toggleChrome,
  });

  /** Dois taps rápidos com zoom → volta a imagem pro encaixe inicial. */
  const doubleTapGesture = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      if (zoom.value > 1) {
        zoom.value = withTiming(1, {duration: 180});
        zoomSaved.value = 1;
        panX.value = withTiming(0, {duration: 180});
        panY.value = withTiming(0, {duration: 180});
        panSavedX.value = 0;
        panSavedY.value = 0;
      }
    },
  });

  // double-tap tem prioridade: o tap simples (chrome) espera ele falhar
  const tapsGesture = useExclusiveGestures(doubleTapGesture, tapGesture);

  const composedGesture = useSimultaneousGestures(
    pinchGesture,
    panGesture,
    tapsGesture,
  );

  // retângulo final: imagem "contida" na tela, centrada, preservando aspecto
  const frame = current?.frame;
  const startRadius = current?.cornerRadius ?? 10;
  const aspect =
    current && current.imageHeight > 0
      ? current.imageWidth / current.imageHeight
      : 1;
  let targetW = screenW;
  let targetH = screenW / aspect;
  if (targetH > screenH) {
    targetH = screenH;
    targetW = screenH * aspect;
  }
  const targetX = (screenW - targetW) / 2;
  const targetY = (screenH - targetH) / 2;

  const imageStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // enquanto arrasta pra fechar, encolhe suavemente acompanhando o dedo
    const dragScale = 1 - Math.min(Math.abs(dragY.value) / 1000, 0.18);
    return {
      position: 'absolute',
      left: lerp(p, frame?.x ?? 0, targetX),
      top: lerp(p, frame?.y ?? 0, targetY),
      width: lerp(p, frame?.width ?? 0, targetW),
      height: lerp(p, frame?.height ?? 0, targetH),
      borderRadius: lerp(p, startRadius, 0),
      transform: [
        {translateX: panX.value},
        {translateY: dragY.value * p + panY.value},
        {scale: dragScale * zoom.value},
      ],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const dragFade = 1 - Math.min(Math.abs(dragY.value) / 400, 1);
    return {opacity: progress.value * dragFade};
  });

  // barras somem junto: toggle do tap, abertura e arrasto de dismiss
  const barsStyle = useAnimatedStyle(() => {
    const dragFade = 1 - Math.min(Math.abs(dragY.value) / 300, 1);
    return {opacity: chromeOpacity.value * progress.value * dragFade};
  });

  if (!current) {
    return (
      <Modal visible={false} transparent>
        <></>
      </Modal>
    );
  }

  const allActions: {icon: IconName; onPress?: () => void; active?: boolean}[] =
    [
      {icon: 'download', onPress: onDownload},
      {icon: 'forward', onPress: onForward},
      {icon: 'star', onPress: onToggleStar, active: current.starred},
      {icon: 'trash', onPress: onDelete},
    ];
  // sem nenhuma ação (ex.: foto de perfil), a barra inferior nem aparece
  const actions = allActions.filter(action => action.onPress);

  const emojiKeyboardHeight = Math.round(screenH * 0.5);

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

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={requestClose}>
      <StatusBar hidden />
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[styles.backdrop, backdropStyle]}
            pointerEvents="none"
          />
          <Animated.Image
            source={{uri: current.uri}}
            resizeMode="cover"
            style={imageStyle}
            onLoad={startOpenAnimation}
            // erro de load: anima mesmo assim pro viewer não ficar preso
            onError={startOpenAnimation}
          />
        </Animated.View>
      </GestureDetector>

      {/* Chrome superior — degradê preto→transparente + glass */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[
          styles.topChrome,
          {paddingTop: insets.top + 6, height: insets.top + 110},
          barsStyle,
        ]}>
        <View pointerEvents="none" style={styles.topGradient} />
        <View style={styles.topRow} pointerEvents="box-none">
          <GlassButton
            onPress={requestClose}
            borderRadius={20}
            style={styles.circleButton}>
            <Icon name="back" size={20} color="primaryContrast" />
          </GlassButton>
          <View style={styles.topCenter} pointerEvents="none">
            <Text variant="itemTitle" fontWeight="700" style={styles.barText}>
              {current.title}
            </Text>
            <Text variant="captionSmall" style={styles.barSubtext}>
              {current.subtitle}
            </Text>
          </View>
          {/* espelho do botão de voltar p/ manter o título centrado */}
          <View style={styles.circleButton} />
        </View>
      </Animated.View>

      {/* Chrome inferior — flutuantes (reação/responder) + degradê + barra */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.bottomChrome, barsStyle]}>
        <View pointerEvents="none" style={styles.bottomGradient} />

        {(onReact || onReply) && (
          <View style={styles.floatingRow} pointerEvents="box-none">
            {onReact ? (
              <GlassButton
                onPress={() => setEmojiOpen(true)}
                borderRadius={20}
                style={styles.circleButton}>
                <Text style={styles.reactEmoji}>😀</Text>
              </GlassButton>
            ) : (
              <View />
            )}
            {onReply && (
              <GlassButton
                onPress={onReply}
                borderRadius={20}
                style={styles.replyPill}>
                <Icon name="reply" size={17} color="primaryContrast" />
                <Text
                  variant="captionSmall"
                  fontWeight="700"
                  style={styles.barText}>
                  Responder
                </Text>
              </GlassButton>
            )}
          </View>
        )}

        {actions.length > 0 && (
          <View style={[styles.bottomBar, {paddingBottom: insets.bottom + 6}]}>
            {actions.map(action => (
              <TouchableOpacityBox
                key={action.icon}
                onPress={action.onPress}
                activeOpacity={0.7}
                width={48}
                height={44}
                alignItems="center"
                justifyContent="center">
                <Icon
                  name={action.icon}
                  size={22}
                  color={action.active ? 'primary' : 'primaryContrast'}
                />
              </TouchableOpacityBox>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Teclado de emojis (reação) subindo pela base */}
      {emojiOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEmojiOpen(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(220)}
            style={[styles.emojiSheet, {height: emojiKeyboardHeight}]}>
            <EmojiKeyboard
              onEmojiSelected={emoji => {
                setEmojiOpen(false);
                onReact?.(emoji.emoji);
              }}
              enableSearchBar
              enableRecentlyUsed
              categoryPosition="bottom"
              translation={pt}
              theme={emojiTheme}
            />
          </Animated.View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  glassClip: {
    overflow: 'hidden',
  },
  glassFallback: {
    backgroundColor: 'rgba(28,28,32,0.72)',
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: TOP_GRADIENT,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  circleButton: {
    width: 40,
    height: 40,
  },
  bottomChrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: BOTTOM_GRADIENT,
  },
  floatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  replyPill: {
    height: 40,
    paddingHorizontal: 16,
  },
  reactEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 12,
    // barra de ações preta sólida (sem transparência)
    backgroundColor: '#000',
  },
  barText: {
    color: '#fff',
  },
  barSubtext: {
    color: 'rgba(255,255,255,0.7)',
  },
  emojiSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});

import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  Keyboard,
  Platform,
  TextInput as RNTextInput,
  TextStyle,
  ViewStyle,
} from 'react-native';

import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  LinearTransition,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {scheduleOnRN} from 'react-native-worklets';

import {Box, Icon, IconName, Text, TouchableOpacityBox} from '@components';
import {MessageReply} from '@domain';
import {useAppTheme} from '@hooks';
import {toastService} from '@services';
import {ThemeColors} from '@theme';
import {formatDuration} from '@utils';

import {AttachmentSheet} from './AttachmentSheet';
import {CameraCaptureSheet} from './CameraCaptureSheet';
import {GalleryPickerSheet} from './GalleryPickerSheet';
import {useVoiceRecorder} from './useVoiceRecorder';

const KEYBOARD_GAP = 8;
const MIN_BOTTOM_PADDING = 12;

/** Arrastar o botão de gravação além destes limites cancela (esquerda) ou trava (cima). */
const CANCEL_THRESHOLD = -90;
const LOCK_THRESHOLD = -70;

// LayoutAnimation é no-op na new arch — transições via reanimated.
// timing (sem física de mola) = zero bounce, só expande/contrai
const TRANSITION = LinearTransition.duration(220).easing(
  Easing.out(Easing.cubic),
);

interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendAudio: (uri: string, durationSeconds: number) => void;
  onSendImage: (uri: string, caption?: string) => void;
  /** Mensagem sendo respondida (swipe-to-reply) — mostra a barra de referência acima do input. */
  replyingTo?: MessageReply | null;
  onCancelReply?: () => void;
}

/**
 * Composer em dois estados (referência do usuário, estilo ChatGPT):
 * - sem foco: pill compacta (placeholder + mic embutido) + botão anexo fora
 * - com foco: card expandido — campo em cima, linha de ações dentro
 * Transição de layout via reanimated (timing, sem bounce); TextInput único
 * sempre montado.
 *
 * Um terceiro "modo" (recorder.state) sobrepõe o card quando o usuário
 * segura o mic: grava (RecordingHint) ou trava a gravação como no
 * WhatsApp/Instagram (LockedControls). O botão de mic/gravação
 * (RecordButton) nunca desmonta durante um gesto ativo — só o conteúdo
 * ao redor dele muda — para não perder o toque em andamento.
 */
export function Composer({
  value,
  onChangeText,
  onSend,
  onSendAudio,
  onSendImage,
  replyingTo,
  onCancelReply,
}: ComposerProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useAppTheme();
  const inputRef = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);
  const [attachmentsVisible, setAttachmentsVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  /** Câmera própria do app aberta (vision-camera — sem a UI nativa do SO). */
  const [cameraVisible, setCameraVisible] = useState(false);
  const recorder = useVoiceRecorder();
  const recording = recorder.state !== 'idle';
  /** Largura medida da caixa do input — usada p/ definir onde o arrasto cancela. */
  const boxWidth = useSharedValue(0);

  // padding inferior decide-se pelo teclado REAL na tela, não pelo foco:
  // com teclado de hardware (simulador/externo) o input foca sem teclado —
  // o inset da home indicator/nav bar do Android precisa continuar valendo
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () =>
      setKeyboardShown(true),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKeyboardShown(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const hasDraft = value.trim().length > 0;

  // começar uma resposta já abre o teclado com o input focado (WhatsApp)
  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  function openAttachments() {
    // o teclado do iOS renderiza ACIMA do Modal — fechar antes
    Keyboard.dismiss();
    setAttachmentsVisible(true);
  }

  function handleCamera() {
    Keyboard.dismiss();
    setCameraVisible(true);
  }

  function handleSendPhoto(uri: string, caption: string) {
    setCameraVisible(false);
    onSendImage(uri, caption || undefined);
  }

  /** Botão de galeria dentro da câmera — fecha o modal dela e abre a grade. */
  function handleCameraGallery() {
    setCameraVisible(false);
    openGallery();
  }

  function openGallery() {
    Keyboard.dismiss();
    // dá tempo do BottomSheetModal do AttachmentSheet terminar de fechar
    // antes de apresentar o da galeria — apresentar/dispensar dois
    // BottomSheetModal no mesmo tick é frágil (mesma família de bug já
    // documentada no components/BottomSheet).
    setTimeout(() => setGalleryVisible(true), 300);
  }

  function handleGallerySelect(uri: string) {
    setGalleryVisible(false);
    onSendImage(uri);
  }

  async function handleDiscardLocked() {
    await recorder.cancel();
  }

  async function handleSendLocked() {
    const result = await recorder.stopAndSend();
    if (result) {
      onSendAudio(result.uri, result.duration);
    }
  }

  const $input: TextStyle = {
    color: colors.text,
    fontSize: 15,
    padding: 0,
    maxHeight: 96,
    opacity: recording ? 0 : 1,
  };

  const $card: ViewStyle = {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: focused || recording ? 12 : 8,
  };

  return (
    <Animated.View
      layout={TRANSITION}
      style={[
        $container,
        {
          // com teclado na tela o inset da home indicator não se aplica
          paddingBottom: keyboardShown
            ? KEYBOARD_GAP
            : Math.max(insets.bottom, MIN_BOTTOM_PADDING),
        },
      ]}>
      {/* Card do input (pill compacta ⭤ card expandido ⭤ gravação) */}
      <Animated.View
        layout={TRANSITION}
        style={$card}
        onLayout={e => {
          boxWidth.value = e.nativeEvent.layout.width;
        }}>
        {/* Barra de referência da resposta — acima do input, estilo WhatsApp */}
        {replyingTo && !recording && (
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(100)}
            layout={TRANSITION}>
            <Box
              flexDirection="row"
              alignItems="center"
              backgroundColor="surface"
              borderRadius="br10"
              borderLeftWidth={3}
              borderLeftColor="primary"
              paddingHorizontal="s10"
              paddingVertical="s6"
              marginBottom="s8"
              gap="s8">
              <Box flex={1}>
                <Text
                  variant="captionSmall"
                  fontWeight="700"
                  color="primary"
                  numberOfLines={1}>
                  {replyingTo.authorName}
                </Text>
                <Text variant="captionSmall" color="textSecondary" numberOfLines={1}>
                  {replyingTo.preview}
                </Text>
              </Box>
              <TouchableOpacityBox
                onPress={onCancelReply}
                activeOpacity={0.7}
                width={26}
                height={26}
                borderRadius="full"
                backgroundColor="chip"
                alignItems="center"
                justifyContent="center">
                <Icon name="close" size={13} color="textSecondary" />
              </TouchableOpacityBox>
            </Box>
          </Animated.View>
        )}

        <Box flexDirection="row" alignItems="center" gap="s8" position="relative">
          <Box flex={1} justifyContent="center">
            <RNTextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Mensagem"
              placeholderTextColor={colors.textTertiary}
              style={$input}
              editable={!recording}
              multiline
            />
            {recorder.state === 'recording' && (
              <RecordingHint
                elapsedMs={recorder.elapsedMs}
                translateX={recorder.dragX}
              />
            )}
          </Box>

          {hasDraft && !recording ? (
            <ComposerCircle
              icon="send"
              onPress={onSend}
              backgroundColor="primary"
              iconColor="primaryContrast"
            />
          ) : (
            <RecordButton
              recorder={recorder}
              onSendAudio={onSendAudio}
              boxWidth={boxWidth}
            />
          )}

          {/* Overlay cobrindo a linha INTEIRA (não só a área do input) — o
              botão de enviar precisa ficar na quina real do composer, não
              no fim da área de texto (deixando o RecordButton invisível
              como espaço morto à direita). */}
          {recorder.state === 'locked' && (
            <LockedControls
              elapsedMs={recorder.elapsedMs}
              onDiscard={handleDiscardLocked}
              onSend={handleSendLocked}
            />
          )}
        </Box>

        {/* Linha de ações — só no estado focado (sem gravação em andamento) */}
        {focused && !recording && (
          <Animated.View
            entering={FadeIn.duration(180).delay(60)}
            exiting={FadeOut.duration(100)}
            layout={TRANSITION}
            style={$actionsRow}>
            <ComposerCircle icon="plus" onPress={openAttachments} subtle />
            <ComposerCircle icon="camera" onPress={handleCamera} subtle />
          </Animated.View>
        )}
      </Animated.View>

      {/* Botão de anexo fora do card — só no estado compacto */}
      {!focused && !recording && (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(100)}
          layout={TRANSITION}>
          <TouchableOpacityBox
            onPress={openAttachments}
            activeOpacity={0.75}
            width={52}
            height={52}
            borderRadius="full"
            backgroundColor="chip"
            alignItems="center"
            justifyContent="center">
            <Icon name="paperclip" size={22} color="textSecondary" />
          </TouchableOpacityBox>
        </Animated.View>
      )}

      <AttachmentSheet
        visible={attachmentsVisible}
        onClose={() => setAttachmentsVisible(false)}
        onCamera={handleCamera}
        onPickImage={openGallery}
      />

      <GalleryPickerSheet
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        onSelect={handleGallerySelect}
      />

      {/* Câmera própria → o preview da foto tirada (legenda + enviar) abre
          como overlay DENTRO do modal dela */}
      <CameraCaptureSheet
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onSendPhoto={handleSendPhoto}
        onPickGallery={handleCameraGallery}
      />
    </Animated.View>
  );
}

interface RecordButtonProps {
  recorder: ReturnType<typeof useVoiceRecorder>;
  onSendAudio: (uri: string, durationSeconds: number) => void;
  /** Largura medida da caixa do input — define o limite de cancelar (passar do meio). */
  boxWidth: SharedValue<number>;
}


/**
 * Botão único de mic/gravação — SEMPRE montado (nunca some via `&&`)
 * enquanto não há rascunho de texto, para não perder um gesto em
 * andamento no meio de um press-and-hold. Arrastar p/ esquerda cancela,
 * p/ cima trava (a gravação segue sem precisar manter o dedo).
 *
 * Memoizado comparando só `recorder.state`: `elapsedMs`/`level` mudam a
 * cada tick de gravação (~10x/s) e, se esse componente re-renderizasse
 * nessa frequência, o `usePanGesture` reconfiguraria o handler nativo
 * rápido demais e derrubava o toque em andamento (segurar virava um tap).
 */
function RecordButtonImpl({recorder, onSendAudio, boxWidth}: RecordButtonProps) {
  const {colors} = useAppTheme();
  // IMPORTANTE: os worklets abaixo NÃO podem capturar o objeto `recorder` — o
  // Reanimated congela objetos capturados por worklet, e isso travava o
  // `stateRef.current` (writes em applyState falhavam silenciosamente → estado
  // preso em 'idle' → cancel/stopAndSend viravam no-op e o áudio nunca parava).
  // Por isso extraímos só o shared value (dragX) e o primitivo (state).
  const {state, dragX} = recorder;
  const translateY = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const lockedSV = useSharedValue(false);
  /** true entre o disparo de `recorder.start()` e sua resolução (janela de startup). */
  const startingRef = useRef(false);
  /** X do release que chegou durante a janela de startup — resolvido ao fim do start(). */
  const pendingReleaseXRef = useRef<number | null>(null);

  const resolveRelease = useCallback(
    async (x: number) => {
      if (recorder.stateRef.current === 'locked') {
        // já travado — soltar o dedo não cancela nem envia, só solta o gesto
        return;
      }
      const cancelAt =
        boxWidth.value > 0 ? -(boxWidth.value / 2 - 15) : CANCEL_THRESHOLD;
      if (x < cancelAt) {
        await recorder.cancel();
        return;
      }
      const result = await recorder.stopAndSend();
      if (result) {
        onSendAudio(result.uri, result.duration);
      }
    },
    [recorder, onSendAudio, boxWidth],
  );

  const handleGestureBegin = useCallback(async () => {
    pendingReleaseXRef.current = null;
    Keyboard.dismiss();
    startingRef.current = true;
    let started = false;
    try {
      started = await recorder.start();
    } finally {
      startingRef.current = false;
    }
    if (!started) {
      toastService.show(
        'Não foi possível acessar o microfone. Verifique a permissão.',
        'error',
      );
      return;
    }
    // dedo já soltou antes de start() resolver — resolve agora
    if (pendingReleaseXRef.current !== null) {
      const x = pendingReleaseXRef.current;
      pendingReleaseXRef.current = null;
      await resolveRelease(x);
    }
  }, [recorder, resolveRelease]);

  const handleLockThresholdCrossed = useCallback(() => {
    recorder.lock();
  }, [recorder]);

  const handleGestureFinalize = useCallback(
    async (x: number) => {
      // Só adia se o start() ainda não resolveu (startingRef). Discriminar por
      // "start em andamento" (não pelo estado, que confundia iniciando/parado)
      // garante que soltar com a gravação ativa SEMPRE resolve na hora.
      if (startingRef.current) {
        pendingReleaseXRef.current = x;
        return;
      }
      await resolveRelease(x);
    },
    [resolveRelease],
  );

  const panGesture = usePanGesture({
    minDistance: 0,
    shouldCancelWhenOutside: false,
    enabled: state !== 'locked',
    onBegin: () => {
      'worklet';
      pressScale.value = withTiming(1.15, {duration: 120});
      scheduleOnRN(handleGestureBegin);
    },
    onUpdate: e => {
      'worklet';
      dragX.value = Math.min(0, e.translationX);
      translateY.value = Math.min(0, e.translationY);
      if (!lockedSV.value && translateY.value < LOCK_THRESHOLD) {
        lockedSV.value = true;
        scheduleOnRN(handleLockThresholdCrossed);
      }
    },
    onFinalize: () => {
      'worklet';
      const finalX = dragX.value;
      dragX.value = withTiming(0);
      translateY.value = withTiming(0);
      pressScale.value = withTiming(1);
      lockedSV.value = false;
      scheduleOnRN(handleGestureFinalize, finalX);
    },
  });

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: dragX.value},
      {translateY: translateY.value},
      {scale: pressScale.value},
    ],
    opacity: state === 'locked' ? withTiming(0) : withTiming(1),
  }));

  const lockPillStyle = useAnimatedStyle(() => ({
    opacity: state === 'recording' ? withTiming(1) : withTiming(0),
    transform: [{translateY: translateY.value * 0.25}],
  }));

  return (
    <Box alignItems="center" justifyContent="center" position="relative">
      <Animated.View
        pointerEvents="none"
        style={[$lockPill, lockPillStyle, {backgroundColor: colors.surface}]}>
        <Icon name="lock" size={15} color="primary" />
        <Icon name="chevronUp" size={11} color="textTertiary" />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          pointerEvents={state === 'locked' ? 'none' : 'auto'}
          style={[
            $recordCircle,
            buttonStyle,
            {
              backgroundColor: state === 'idle' ? colors.surface : colors.primary,
            },
          ]}>
          <Icon
            name="mic"
            size={18}
            color={state === 'idle' ? 'textSecondary' : 'primaryContrast'}
          />
        </Animated.View>
      </GestureDetector>
    </Box>
  );
}

const RecordButton = React.memo(
  RecordButtonImpl,
  (prev, next) => prev.recorder.state === next.recorder.state,
);

function PulsingDot() {
  const {colors} = useAppTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, {duration: 650}), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({opacity: opacity.value}));

  return (
    <Animated.View style={[$dot, style, {backgroundColor: colors.danger}]} />
  );
}

function RecordingHint({
  elapsedMs,
  translateX,
}: {
  elapsedMs: number;
  translateX: {value: number};
}) {
  const hintStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value * 0.5}],
    opacity: interpolate(
      translateX.value,
      [CANCEL_THRESHOLD, 0],
      [0.3, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Box position="absolute" style={$overlay} flexDirection="row" alignItems="center">
      <PulsingDot />
      <Text variant="paragraph" fontWeight="600" marginLeft="s8">
        {formatDuration(Math.floor(elapsedMs / 1000))}
      </Text>
      <Box flex={1} />
      <Animated.View style={[$cancelHint, hintStyle]}>
        <Icon name="back" size={13} color="textTertiary" />
        <Text variant="caption" marginLeft="s4">
          Arraste para cancelar
        </Text>
      </Animated.View>
    </Box>
  );
}

function LockedControls({
  elapsedMs,
  onDiscard,
  onSend,
}: {
  elapsedMs: number;
  onDiscard: () => void;
  onSend: () => void;
}) {
  return (
    <Box
      position="absolute"
      style={$overlay}
      flexDirection="row"
      alignItems="center"
      gap="s10">
      <TouchableOpacityBox
        onPress={onDiscard}
        activeOpacity={0.7}
        width={30}
        height={30}
        alignItems="center"
        justifyContent="center">
        <Icon name="trash" size={19} color="danger" />
      </TouchableOpacityBox>
      <PulsingDot />
      <Text variant="paragraph" fontWeight="600" marginLeft="s4">
        {formatDuration(Math.floor(elapsedMs / 1000))}
      </Text>
      <Box flex={1} />
      <TouchableOpacityBox
        onPress={onSend}
        activeOpacity={0.75}
        width={34}
        height={34}
        borderRadius="full"
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center">
        <Icon name="send" size={15} color="primaryContrast" />
      </TouchableOpacityBox>
    </Box>
  );
}

function ComposerCircle({
  icon,
  onPress,
  subtle = false,
  backgroundColor,
  iconColor,
}: {
  icon: IconName;
  onPress: () => void;
  subtle?: boolean;
  backgroundColor?: keyof ThemeColors;
  iconColor?: keyof ThemeColors;
}) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.75}
      width={32}
      height={32}
      borderRadius="full"
      backgroundColor={backgroundColor ?? (subtle ? 'surface' : 'chip')}
      alignItems="center"
      justifyContent="center">
      <Icon name={icon} size={17} color={iconColor ?? 'textSecondary'} />
    </TouchableOpacityBox>
  );
}

const $container: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 8,
  paddingHorizontal: 12,
  paddingTop: 8,
};

const $actionsRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 10,
};

const $recordCircle: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
};

const $lockPill: ViewStyle = {
  position: 'absolute',
  bottom: 46,
  width: 32,
  paddingVertical: 8,
  borderRadius: 16,
  alignItems: 'center',
  gap: 6,
};

const $dot: ViewStyle = {
  width: 9,
  height: 9,
  borderRadius: 5,
};

const $overlay: ViewStyle = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

const $cancelHint: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

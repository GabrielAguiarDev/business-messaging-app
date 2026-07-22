import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
} from 'react-native';

import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {captureRef} from 'react-native-view-shot';

import {Icon, IconName, Text, TouchableOpacityBox} from '@components';
import {PhotoEditorTool, toastService} from '@services';

import {GlassButton} from './ImageViewer';
import {
  CropFrame,
  CropRect,
  DEFAULT_TEXT_SIZE,
  DraggableText,
  DrawingLayer,
  DrawPath,
  EDITOR_COLORS,
  editorId,
  Frame,
  TextItem,
} from './photoEditor';

interface PhotoPreviewProps {
  /** Uri local da foto capturada/escolhida. */
  uri: string;
  /** Descartar — volta pra câmera (tirar outra). */
  onClose: () => void;
  /** Confirmar a foto (já com as edições achatadas) + legenda digitada. */
  onSend: (uri: string, caption: string) => void;
  /** Mostra o campo de legenda na base. Padrão: true. */
  showCaption?: boolean;
  /** Ferramentas de edição no topo. Padrão: crop/text/draw. */
  editors?: PhotoEditorTool[];
  /** Ícone do botão de confirmar. Padrão: 'send'. */
  confirmIcon?: 'send' | 'check';
}

/** Degradê do chrome superior (mesmo do ImageViewer). */
const TOP_GRADIENT =
  'linear-gradient(180deg, rgba(0, 0, 0, 0.754) 0%, rgba(0, 0, 0, 0.617) 45%, rgba(0,0,0,0) 100%)';

type Mode = 'idle' | 'crop' | 'text' | 'draw';

/** Garante o esquema file:// no caminho devolvido pelo view-shot. */
function normalizeUri(path: string) {
  if (/^[a-z]+:\/\//i.test(path)) {
    return path;
  }
  return `file://${path}`;
}

/**
 * Preview + edição da foto ANTES de enviar (estilo WhatsApp): foto em tela
 * cheia; no topo, ferramentas de CORTAR, TEXTO (Aa) e DESENHAR; na base,
 * legenda + confirmar (opcionais/configuráveis). Cada ferramenta "achata"
 * suas edições na imagem (view-shot) ao confirmar, então o que sai em
 * `onSend` é sempre uma imagem final única.
 *
 * NÃO é um Modal: renderiza como overlay DENTRO do modal da câmera
 * (CameraCaptureSheet) — dois RN Modals irmãos visíveis ao mesmo tempo
 * quebram a apresentação no iOS. Envolvemos em GestureHandlerRootView
 * porque gestos dentro de um RN Modal ficam fora do root de gestos do App.
 */
export function PhotoPreview({
  uri,
  onClose,
  onSend,
  showCaption = true,
  editors = ['crop', 'text', 'draw'],
  confirmIcon = 'send',
}: PhotoPreviewProps) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');

  /** Imagem "de trabalho" — troca a cada edição achatada (corte/desenho/texto). */
  const [workingUri, setWorkingUri] = useState(uri);
  const [imageSize, setImageSize] = useState<{width: number; height: number} | null>(
    null,
  );
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [mode, setMode] = useState<Mode>('idle');
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [drawColor, setDrawColor] = useState(EDITOR_COLORS[2]); // vermelho
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [editingText, setEditingText] = useState<{
    id: string;
    value: string;
    color: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropCapturing, setCropCapturing] = useState(false);

  const shotRef = useRef<View>(null);
  const cropShotRef = useRef<View>(null);
  /** Resolvido quando a imagem da view de recorte termina de carregar. */
  const cropLoadedRef = useRef<(() => void) | null>(null);

  // dimensões reais da imagem de trabalho → define o frame exibido (contain)
  useEffect(() => {
    let alive = true;
    Image.getSize(
      workingUri,
      (width, height) => alive && setImageSize({width, height}),
      () => alive && setImageSize(null),
    );
    return () => {
      alive = false;
    };
  }, [workingUri]);

  const frame: Frame | null = useMemo(() => {
    if (!imageSize || !containerSize) {
      return null;
    }
    const scale = Math.min(
      containerSize.width / imageSize.width,
      containerSize.height / imageSize.height,
    );
    const width = imageSize.width * scale;
    const height = imageSize.height * scale;
    return {
      width,
      height,
      left: (containerSize.width - width) / 2,
      top: (containerSize.height - height) / 2,
    };
  }, [imageSize, containerSize]);

  const hasEdits = paths.length > 0 || texts.length > 0;

  // ── captura / achatamento ──────────────────────────────────────

  const bakeMain = useCallback(async () => {
    if (busy) {
      return;
    }
    if (!hasEdits) {
      setMode('idle');
      return;
    }
    setBusy(true);
    try {
      const captured = await captureRef(shotRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      setPaths([]);
      setTexts([]);
      setWorkingUri(normalizeUri(captured));
    } catch {
      toastService.show('Não foi possível aplicar a edição.', 'error');
    } finally {
      setBusy(false);
      setMode('idle');
    }
  }, [busy, hasEdits]);

  const confirmCrop = useCallback(async () => {
    if (busy || !frame || !cropRect) {
      return;
    }
    // recorte de tela cheia = sem mudança
    const full =
      cropRect.x <= 0.5 &&
      cropRect.y <= 0.5 &&
      cropRect.width >= frame.width - 1 &&
      cropRect.height >= frame.height - 1;
    if (full) {
      setMode('idle');
      return;
    }
    setBusy(true);
    setCropCapturing(true);
    try {
      // espera a IMAGEM da view de recorte carregar/pintar antes de capturar —
      // capturar antes disso gerava um quadro preto (view recém-montada).
      await new Promise<void>(resolve => {
        cropLoadedRef.current = resolve;
        setTimeout(resolve, 1200); // fallback de segurança
      });
      cropLoadedRef.current = null;
      // dois frames extras garantem que o layout já foi pintado
      await new Promise<void>(res =>
        requestAnimationFrame(() => requestAnimationFrame(() => res())),
      );
      const captured = await captureRef(cropShotRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      setWorkingUri(normalizeUri(captured));
    } catch {
      toastService.show('Não foi possível cortar a imagem.', 'error');
    } finally {
      setCropCapturing(false);
      setBusy(false);
      setMode('idle');
    }
  }, [busy, frame, cropRect]);

  // ── entradas/saídas das ferramentas ────────────────────────────

  function enterCrop() {
    if (!frame) {
      return;
    }
    setCropRect({x: 0, y: 0, width: frame.width, height: frame.height});
    setMode('crop');
  }

  function enterText() {
    setMode('text');
    setEditingText({id: editorId(), value: '', color: textColor});
  }

  function enterDraw() {
    setMode('draw');
  }

  function cancelTool() {
    if (mode === 'draw') {
      setPaths([]);
    }
    if (mode === 'text') {
      setTexts([]);
      setEditingText(null);
    }
    setMode('idle');
  }

  function commitText() {
    const editing = editingText;
    if (!editing) {
      return;
    }
    const value = editing.value.trim();
    setEditingText(null);
    setTexts(prev => {
      const exists = prev.some(t => t.id === editing.id);
      if (!value) {
        return prev.filter(t => t.id !== editing.id);
      }
      if (exists) {
        return prev.map(t =>
          t.id === editing.id ? {...t, text: value, color: editing.color} : t,
        );
      }
      const f = frame;
      const item: TextItem = {
        id: editing.id,
        text: value,
        x: f ? f.width * 0.12 : 24,
        y: f ? f.height * 0.42 : 120,
        color: editing.color,
        fontSize: DEFAULT_TEXT_SIZE,
      };
      return [...prev, item];
    });
  }

  function handleSend() {
    if (busy) {
      return;
    }
    onSend(workingUri, caption.trim());
  }

  const toolIcon: Record<PhotoEditorTool, {icon?: IconName; label?: string; onPress: () => void}> =
    {
      crop: {icon: 'crop', onPress: enterCrop},
      text: {label: 'Aa', onPress: enterText},
      draw: {icon: 'pencil', onPress: enterDraw},
    };

  const editing = mode !== 'idle';

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Superfície editável — o que o view-shot captura */}
      <View
        style={StyleSheet.absoluteFill}
        onLayout={e =>
          setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }>
        {frame && (
          <View
            ref={shotRef}
            collapsable={false}
            style={[
              styles.absolute,
              {
                left: frame.left,
                top: frame.top,
                width: frame.width,
                height: frame.height,
              },
            ]}>
            <Image
              source={{uri: workingUri}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            {texts.map(t => (
              <DraggableText
                key={t.id}
                item={t}
                frame={frame}
                editable={mode === 'text'}
                onChangePos={(x, y) =>
                  setTexts(prev =>
                    prev.map(it => (it.id === t.id ? {...it, x, y} : it)),
                  )
                }
              />
            ))}
            {mode === 'draw' && (
              <DrawingLayer
                frame={frame}
                color={drawColor}
                paths={paths}
                onAddPath={p => setPaths(prev => [...prev, p])}
              />
            )}
          </View>
        )}
      </View>

      {/* Moldura de corte (UI, fora da captura principal) */}
      {mode === 'crop' && frame && cropRect && (
        <CropFrame
          frame={frame}
          rect={cropRect}
          onChange={updater =>
            setCropRect(prev => (prev ? updater(prev) : prev))
          }
        />
      )}

      {/* View de recorte temporária, capturada ao confirmar o corte */}
      {cropCapturing && frame && cropRect && (
        <View
          ref={cropShotRef}
          collapsable={false}
          style={[
            styles.cropClip,
            {
              left: frame.left + cropRect.x,
              top: frame.top + cropRect.y,
              width: cropRect.width,
              height: cropRect.height,
            },
          ]}>
          <Image
            source={{uri: workingUri}}
            onLoad={() => cropLoadedRef.current?.()}
            fadeDuration={0}
            style={[
              styles.absolute,
              {
                left: -cropRect.x,
                top: -cropRect.y,
                width: frame.width,
                height: frame.height,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Chrome superior */}
      <View
        style={[styles.topChrome, {paddingTop: insets.top + 6}]}
        pointerEvents="box-none">
        <View pointerEvents="none" style={styles.topGradient} />
        <View style={styles.topRow} pointerEvents="box-none">
          <GlassButton
            onPress={editing ? cancelTool : onClose}
            borderRadius={20}
            style={styles.circleButton}>
            <Icon name="close" size={19} color="primaryContrast" />
          </GlassButton>

          {/* Ações — modo ocioso mostra as ferramentas; modos de edição
              mostram controles + confirmar */}
          <View style={styles.topActions} pointerEvents="box-none">
            {mode === 'idle' &&
              editors.map(tool => {
                const t = toolIcon[tool];
                return (
                  <GlassButton
                    key={tool}
                    onPress={t.onPress}
                    borderRadius={20}
                    style={styles.circleButton}>
                    {t.icon ? (
                      <Icon name={t.icon} size={18} color="primaryContrast" />
                    ) : (
                      <Text
                        variant="captionSmall"
                        fontWeight="700"
                        style={styles.actionLabel}>
                        {t.label}
                      </Text>
                    )}
                  </GlassButton>
                );
              })}

            {mode === 'draw' && paths.length > 0 && (
              <GlassButton
                onPress={() => setPaths(prev => prev.slice(0, -1))}
                borderRadius={20}
                style={styles.circleButton}>
                <Icon name="back" size={18} color="primaryContrast" />
              </GlassButton>
            )}

            {mode === 'text' && (
              <GlassButton
                onPress={enterText}
                borderRadius={20}
                style={styles.circleButton}>
                <Text
                  variant="captionSmall"
                  fontWeight="700"
                  style={styles.actionLabel}>
                  +Aa
                </Text>
              </GlassButton>
            )}

            {editing && (
              <TouchableOpacityBox
                onPress={mode === 'crop' ? confirmCrop : bakeMain}
                activeOpacity={0.8}
                disabled={busy}
                width={40}
                height={40}
                borderRadius="full"
                backgroundColor="primary"
                alignItems="center"
                justifyContent="center">
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon name="check" size={20} color="primaryContrast" />
                )}
              </TouchableOpacityBox>
            )}
          </View>
        </View>
      </View>

      {/* Paleta de cores — desenho e texto */}
      {(mode === 'draw' || mode === 'text') && (
        <View
          style={[styles.paletteRow, {bottom: insets.bottom + 24}]}
          pointerEvents="box-none">
          {EDITOR_COLORS.map(color => {
            const selected =
              mode === 'draw' ? color === drawColor : color === textColor;
            return (
              <TouchableOpacityBox
                key={color}
                activeOpacity={0.8}
                onPress={() => {
                  if (mode === 'draw') {
                    setDrawColor(color);
                  } else {
                    setTextColor(color);
                    setEditingText(prev => (prev ? {...prev, color} : prev));
                  }
                }}
                style={[
                  styles.swatch,
                  {backgroundColor: color},
                  selected && styles.swatchSelected,
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Base — legenda + confirmar (só no modo ocioso) */}
      {mode === 'idle' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomChrome}
          pointerEvents="box-none">
          <View
            style={[
              styles.captionRow,
              {paddingBottom: Math.max(insets.bottom, 12)},
            ]}>
            {showCaption && (
              <View style={styles.captionField}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Adicionar legenda..."
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={$captionInput}
                  multiline
                />
              </View>
            )}
            <View style={showCaption ? undefined : styles.confirmCenter}>
              <TouchableOpacityBox
                onPress={handleSend}
                activeOpacity={0.8}
                disabled={busy}
                width={52}
                height={52}
                borderRadius="full"
                backgroundColor="primary"
                alignItems="center"
                justifyContent="center">
                <Icon name={confirmIcon} size={22} color="primaryContrast" />
              </TouchableOpacityBox>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Overlay de digitação de texto */}
      {editingText && (
        <View style={styles.textEditorOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.textEditorFill}>
            <View style={styles.textEditorCenter} pointerEvents="box-none">
              <TextInput
                value={editingText.value}
                onChangeText={value =>
                  setEditingText(prev => (prev ? {...prev, value} : prev))
                }
                placeholder="Digite algo"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoFocus
                multiline
                style={[
                  $textEditorInput,
                  {color: editingText.color},
                ]}
              />
            </View>
            <View style={[styles.textEditorBar, {paddingBottom: insets.bottom + 12}]}>
              <View style={styles.textEditorSwatches}>
                {EDITOR_COLORS.map(color => (
                  <TouchableOpacityBox
                    key={color}
                    activeOpacity={0.8}
                    onPress={() => {
                      setTextColor(color);
                      setEditingText(prev => (prev ? {...prev, color} : prev));
                    }}
                    style={[
                      styles.swatch,
                      {backgroundColor: color},
                      editingText.color === color && styles.swatchSelected,
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacityBox
                onPress={commitText}
                activeOpacity={0.8}
                paddingHorizontal="s16"
                paddingVertical="s8"
                borderRadius="full"
                backgroundColor="primary">
                <Text
                  variant="paragraph"
                  fontWeight="700"
                  color="primaryContrast">
                  Concluir
                </Text>
              </TouchableOpacityBox>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const $captionInput: TextStyle = {
  color: '#fff',
  fontSize: 15,
  padding: 0,
  maxHeight: 96,
};

const $textEditorInput: TextStyle = {
  fontSize: 30,
  fontWeight: '700',
  textAlign: 'center',
  minWidth: 120,
  maxWidth: '90%',
  textShadowColor: 'rgba(0,0,0,0.55)',
  textShadowOffset: {width: 0, height: 1},
  textShadowRadius: 4,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  absolute: {
    position: 'absolute',
  },
  cropClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 34,
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
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleButton: {
    width: 40,
    height: 40,
  },
  actionLabel: {
    color: '#fff',
  },
  paletteRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  swatchSelected: {
    borderColor: '#fff',
    transform: [{scale: 1.2}],
  },
  bottomChrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    // base totalmente preta (pedido do usuário)
    backgroundColor: '#000',
  },
  captionField: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(28,28,32,0.88)',
  },
  confirmCenter: {
    flex: 1,
    alignItems: 'flex-end',
  },
  textEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  textEditorFill: {
    flex: 1,
  },
  textEditorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  textEditorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textEditorSwatches: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
});

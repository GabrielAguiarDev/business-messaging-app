import React, {useEffect, useRef, useState} from 'react';

import {Modal, StatusBar, StyleSheet, View, ViewStyle} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import {Box, Icon, Text, TouchableOpacityBox} from '@components';
import {CameraOpenOptions, toastService} from '@services';

import {GlassButton} from './ImageViewer';
import {PhotoPreview} from './PhotoPreview';

interface CameraCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Confirmou o envio no preview — uri local (`file://...`) + legenda. */
  onSendPhoto: (uri: string, caption: string) => void;
  /** Botão de galeria (canto inferior esquerdo) — fecha a câmera e abre a grade. */
  onPickGallery?: () => void;
  /** Config de legenda/ferramentas de edição/ícone de confirmar do preview. */
  options?: CameraOpenOptions;
}

/**
 * Câmera PRÓPRIA do chat (react-native-vision-camera) — substitui a câmera
 * nativa do SO (`launchCamera`), que obrigava a passar pela confirmação
 * "Retake/Use Photo" do iOS antes do nosso preview. Controles estilo
 * WhatsApp: X fecha, raio alterna o flash, disparador central e botão de
 * virar a câmera.
 *
 * O disparo abre o PhotoPreview como overlay DENTRO deste Modal (não como
 * segundo Modal — dois RN Modals irmãos visíveis congelam os toques no
 * iOS); a câmera fica pausada (isActive=false) atrás e o X do preview
 * volta pra ela ("tirar outra").
 */
export function CameraCaptureSheet({
  visible,
  onClose,
  onSendPhoto,
  onPickGallery,
  options,
}: CameraCaptureSheetProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const [position, setPosition] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  /** Fator de zoom do chip "1x"/"2x" — multiplica o zoom neutro da lente. */
  const [zoomFactor, setZoomFactor] = useState<1 | 2>(1);
  /** Foto tirada aguardando confirmação no overlay de preview. */
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice(position);

  // pede a permissão na primeira abertura (o hook só LÊ o status)
  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
  }, [visible, hasPermission, requestPermission]);

  async function handleRequestPermission() {
    const granted = await requestPermission();
    if (!granted) {
      toastService.show(
        'Ative o acesso à câmera nos Ajustes do aparelho.',
        'error',
      );
    }
  }

  async function handleShutter() {
    if (!cameraRef.current || capturing) {
      return;
    }
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: device?.hasFlash ? flash : 'off',
      });
      setCapturedUri(`file://${photo.path}`);
    } catch {
      toastService.show('Não foi possível tirar a foto.', 'error');
    } finally {
      setCapturing(false);
    }
  }

  /** Fechar descarta qualquer foto pendente — reabrir começa na câmera. */
  function handleClose() {
    setCapturedUri(null);
    onClose();
  }

  function handlePickGallery() {
    setCapturedUri(null);
    onPickGallery?.();
  }

  function handleSendPhoto(uri: string, caption: string) {
    setCapturedUri(null);
    onSendPhoto(uri, caption);
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={handleClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        {hasPermission && device && (
          <Camera
            ref={cameraRef}
            device={device}
            isActive={!capturedUri}
            photo
            zoom={Math.min(device.neutralZoom * zoomFactor, device.maxZoom)}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Estados sem preview: permissão negada ou aparelho sem câmera */}
        {(!hasPermission || !device) && (
          <Box flex={1} alignItems="center" justifyContent="center" gap="s12" padding="s24">
            <Icon name="camera" size={34} color="textTertiary" />
            <Text variant="paragraph" textAlign="center" style={styles.emptyText}>
              {!hasPermission
                ? 'Permita o acesso à câmera para tirar fotos.'
                : 'Câmera indisponível neste aparelho.'}
            </Text>
            {!hasPermission && (
              <TouchableOpacityBox
                onPress={handleRequestPermission}
                activeOpacity={0.8}
                backgroundColor="primary"
                borderRadius="full"
                paddingHorizontal="s20"
                paddingVertical="s10">
                <Text variant="paragraph" fontWeight="700" color="primaryContrast">
                  Permitir acesso
                </Text>
              </TouchableOpacityBox>
            )}
          </Box>
        )}

        {/* Chrome superior — X e flash */}
        <View
          style={[styles.topRow, {paddingTop: insets.top + 6}]}
          pointerEvents="box-none">
          <GlassButton
            onPress={handleClose}
            borderRadius={20}
            style={styles.circleButton}>
            <Icon name="close" size={19} color="primaryContrast" />
          </GlassButton>
          {device?.hasFlash && (
            <GlassButton
              onPress={() => setFlash(f => (f === 'off' ? 'on' : 'off'))}
              borderRadius={20}
              style={styles.circleButton}>
              <Icon
                name={flash === 'on' ? 'flash' : 'flashOff'}
                size={19}
                color="primaryContrast"
              />
            </GlassButton>
          )}
        </View>

        {/* Controles inferiores estilo WhatsApp: galeria · disparador ·
            zoom/virar câmera, com a faixa de modos VÍDEO|FOTO abaixo */}
        <View style={styles.bottomChrome} pointerEvents="box-none">
          <View style={styles.controlsRow} pointerEvents="box-none">
            <View style={styles.sideSlot}>
              {onPickGallery && (
                <TouchableOpacityBox
                  onPress={handlePickGallery}
                  activeOpacity={0.75}
                  style={[styles.controlChip, styles.galleryButton]}>
                  <Icon name="image" size={20} color="primaryContrast" />
                </TouchableOpacityBox>
              )}
            </View>
            <TouchableOpacityBox
              onPress={handleShutter}
              activeOpacity={0.7}
              disabled={capturing || !hasPermission || !device}
              style={[styles.shutter, capturing && styles.shutterDisabled]}
            />
            <View style={[styles.sideSlot, styles.rightControls]}>
              {device && (
                <TouchableOpacityBox
                  onPress={() => setZoomFactor(f => (f === 1 ? 2 : 1))}
                  activeOpacity={0.75}
                  style={styles.controlChip}>
                  <Text variant="captionSmall" fontWeight="700" style={styles.controlLabel}>
                    {zoomFactor}x
                  </Text>
                </TouchableOpacityBox>
              )}
              <TouchableOpacityBox
                onPress={() => setPosition(p => (p === 'back' ? 'front' : 'back'))}
                activeOpacity={0.75}
                style={styles.controlChip}>
                <Icon name="flipCamera" size={20} color="primaryContrast" />
              </TouchableOpacityBox>
            </View>
          </View>

          {/* Faixa de modos — só FOTO funciona; VÍDEO é placeholder */}
          <View style={[styles.modesBar, {paddingBottom: insets.bottom + 10}]}>
            <TouchableOpacityBox
              onPress={() => toastService.show('Disponível em breve.')}
              activeOpacity={0.7}>
              <Text variant="captionSmall" fontWeight="700" style={styles.modeLabel}>
                VÍDEO
              </Text>
            </TouchableOpacityBox>
            <Text variant="captionSmall" fontWeight="700" color="primary">
              FOTO
            </Text>
          </View>
        </View>

        {/* Preview da foto tirada — overlay por cima da câmera pausada */}
        {capturedUri && (
          <PhotoPreview
            uri={capturedUri}
            onClose={() => setCapturedUri(null)}
            onSend={handleSendPhoto}
            showCaption={options?.showCaption ?? true}
            editors={options?.editors ?? ['crop', 'text', 'draw']}
            confirmIcon={options?.confirmIcon ?? 'send'}
          />
        )}
      </View>
    </Modal>
  );
}

const $shutterRing: ViewStyle = {
  borderWidth: 5,
  borderColor: '#fff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
  },
  topRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  sideSlot: {
    // slots laterais de mesma largura mantêm o disparador no centro real
    width: 104,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  controlChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,28,32,0.6)',
  },
  galleryButton: {
    borderRadius: 12,
  },
  controlLabel: {
    color: '#fff',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    ...$shutterRing,
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  modesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
    paddingTop: 14,
    backgroundColor: '#000',
  },
  modeLabel: {
    color: 'rgba(255,255,255,0.85)',
  },
});

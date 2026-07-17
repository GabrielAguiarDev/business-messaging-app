import React, {useState} from 'react';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Icon, IconName, Text, TouchableOpacityBox} from '@components';
import {toastService} from '@services';

import {GlassButton} from './ImageViewer';

interface PhotoPreviewProps {
  /** Uri local da foto capturada/escolhida. */
  uri: string;
  /** Descartar — volta pra câmera (tirar outra). */
  onClose: () => void;
  /** Enviar a foto com a legenda digitada (vazia = sem legenda). */
  onSend: (uri: string, caption: string) => void;
}

/** Degradê do chrome superior (mesmo do ImageViewer). */
const TOP_GRADIENT =
  'linear-gradient(180deg, rgba(0, 0, 0, 0.754) 0%, rgba(0, 0, 0, 0.617) 45%, rgba(0,0,0,0) 100%)';

/**
 * Preview da foto ANTES de enviar (estilo WhatsApp): foto em tela cheia,
 * X para descartar, ações de edição no topo (placeholders "em breve") e
 * campo de legenda + botão de enviar na base.
 *
 * NÃO é um Modal: renderiza como overlay DENTRO do modal da câmera
 * (CameraCaptureSheet) — dois RN Modals irmãos visíveis ao mesmo tempo
 * quebram a apresentação no iOS (o segundo não apresenta e os toques
 * congelam).
 */
export function PhotoPreview({uri, onClose, onSend}: PhotoPreviewProps) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');

  function handleSend() {
    onSend(uri, caption.trim());
  }

  function handleSoon() {
    toastService.show('Disponível em breve.');
  }

  const editActions: {key: string; icon?: IconName; label?: string}[] = [
    {key: 'hd', label: 'HD'},
    {key: 'crop', icon: 'crop'},
    {key: 'text', label: 'Aa'},
    {key: 'draw', icon: 'pencil'},
  ];

  return (
    <View style={styles.container}>
      <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="contain" />

      {/* Chrome superior — X à esquerda, ações de edição à direita */}
      <View
        style={[styles.topChrome, {paddingTop: insets.top + 6}]}
        pointerEvents="box-none">
        <View pointerEvents="none" style={styles.topGradient} />
        <View style={styles.topRow} pointerEvents="box-none">
          <GlassButton
            onPress={onClose}
            borderRadius={20}
            style={styles.circleButton}>
            <Icon name="close" size={19} color="primaryContrast" />
          </GlassButton>
          <View style={styles.topActions} pointerEvents="box-none">
            {editActions.map(action => (
              <GlassButton
                key={action.key}
                onPress={handleSoon}
                borderRadius={20}
                style={styles.circleButton}>
                {action.icon ? (
                  <Icon name={action.icon} size={18} color="primaryContrast" />
                ) : (
                  <Text variant="captionSmall" fontWeight="700" style={styles.actionLabel}>
                    {action.label}
                  </Text>
                )}
              </GlassButton>
            ))}
          </View>
        </View>
      </View>

      {/* Base — legenda + enviar (sobe junto com o teclado) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomChrome}
        pointerEvents="box-none">
        <View
          style={[
            styles.captionRow,
            {paddingBottom: Math.max(insets.bottom, 12)},
          ]}>
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
          <TouchableOpacityBox
            onPress={handleSend}
            activeOpacity={0.8}
            width={46}
            height={46}
            borderRadius="full"
            backgroundColor="primary"
            alignItems="center"
            justifyContent="center">
            <Icon name="send" size={20} color="primaryContrast" />
          </TouchableOpacityBox>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const $captionInput: TextStyle = {
  color: '#fff',
  fontSize: 15,
  padding: 0,
  maxHeight: 96,
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
    // faixa escura pro campo não se perder sobre fotos claras
    backgroundColor: 'rgba(0,0,0,0.45)',
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
});

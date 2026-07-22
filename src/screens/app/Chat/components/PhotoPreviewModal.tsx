import React from 'react';

import {Modal, StatusBar, StyleSheet, View} from 'react-native';

import {CameraOpenOptions} from '@services';

import {PhotoPreview} from './PhotoPreview';

interface PhotoPreviewModalProps {
  /** Foto já escolhida (galeria/fotos recentes) a editar antes de enviar. */
  uri: string;
  /** Cancelar — descarta e fecha (não há câmera pra voltar). */
  onClose: () => void;
  /** Confirmar — uri final (com edições) + legenda. */
  onSend: (uri: string, caption: string) => void;
  options?: CameraOpenOptions;
}

/**
 * Abre a tela de preview/edição (PhotoPreview) DIRETO para uma foto já
 * escolhida — sem passar pela câmera. Usado quando o usuário toca numa foto
 * recente/da galeria: dá pra cortar, escrever, desenhar e legendar antes de
 * enviar, igual à foto tirada na hora.
 */
export function PhotoPreviewModal({
  uri,
  onClose,
  onSend,
  options,
}: PhotoPreviewModalProps) {
  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        <PhotoPreview
          uri={uri}
          onClose={onClose}
          onSend={onSend}
          showCaption={options?.showCaption ?? true}
          editors={options?.editors ?? ['crop', 'text', 'draw']}
          confirmIcon={options?.confirmIcon ?? 'send'}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

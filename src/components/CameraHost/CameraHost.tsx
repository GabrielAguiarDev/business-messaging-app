import React from 'react';

import {CameraCaptureSheet} from '@screens/app/Chat/components/CameraCaptureSheet';
import {PhotoPreviewModal} from '@screens/app/Chat/components/PhotoPreviewModal';
import {useCameraStore} from '@services';

/**
 * Ponto único de montagem da câmera GLOBAL — mora no root do app (App.tsx),
 * ao lado do <Toast/>. Fica invisível enquanto ninguém abre a câmera; ao
 * chamar `cameraService.open(...)`, apresenta a CameraCaptureSheet e resolve
 * a promise de quem pediu com a foto/galeria/cancelamento.
 *
 * Não é exportado pelo barrel de @components de propósito: a CameraCaptureSheet
 * importa @components, e reexportar aqui criaria um ciclo de módulos.
 */
export function CameraHost() {
  const request = useCameraStore(s => s.request);
  const close = useCameraStore(s => s.close);

  if (!request) {
    return null;
  }

  const {options, previewUri} = request;

  // foto já escolhida (galeria/recentes) → abre direto no preview/edição
  if (previewUri) {
    return (
      <PhotoPreviewModal
        uri={previewUri}
        options={options}
        onClose={() => close(null)}
        onSend={(uri, caption) => close({type: 'photo', uri, caption})}
      />
    );
  }

  return (
    <CameraCaptureSheet
      visible
      options={options}
      onClose={() => close(null)}
      onSendPhoto={(uri, caption) => close({type: 'photo', uri, caption})}
      onPickGallery={
        options.allowGallery ? () => close({type: 'gallery'}) : undefined
      }
    />
  );
}

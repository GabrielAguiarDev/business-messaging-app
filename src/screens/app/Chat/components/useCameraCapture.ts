import {useCallback} from 'react';

import {launchCamera} from 'react-native-image-picker';

import {toastService} from '@services';

/**
 * Abre a câmera nativa, tira uma foto e devolve a uri local do arquivo
 * (fica em pasta temporária do SO — sem cópia p/ storage próprio por ora,
 * ver DEVELOPMENT.md). `null` se o usuário cancelar ou algo falhar.
 */
export function useCameraCapture() {
  return useCallback(async (): Promise<string | null> => {
    const result = await launchCamera({mediaType: 'photo', saveToPhotos: false});
    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      toastService.show(
        result.errorCode === 'permission'
          ? 'Permissão da câmera negada.'
          : 'Não foi possível abrir a câmera.',
        'error',
      );
      return null;
    }
    const uri = result.assets?.[0]?.uri;
    return uri ?? null;
  }, []);
}

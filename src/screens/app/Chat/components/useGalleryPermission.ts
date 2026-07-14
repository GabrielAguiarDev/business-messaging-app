import {useCallback} from 'react';

import {PermissionsAndroid, Platform} from 'react-native';

import {
  iosReadGalleryPermission,
  iosRequestReadWriteGalleryPermission,
} from '@react-native-camera-roll/camera-roll';

/** Só leitura — nunca salvamos nada na galeria do usuário. */
export function useGalleryPermission() {
  return useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iosReadGalleryPermission só CONSULTA o status — no primeiro uso vem
      // 'not-determined' e é preciso pedir de fato, senão o prompt do sistema
      // nunca aparece e a grade fica vazia para sempre.
      let status = await iosReadGalleryPermission('readWrite');
      if (status === 'not-determined') {
        status = await iosRequestReadWriteGalleryPermission();
      }
      return status === 'granted' || status === 'limited';
    }

    if ((Platform.Version as number) >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);
}

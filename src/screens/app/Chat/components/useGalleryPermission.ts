import {useCallback} from 'react';

import {PermissionsAndroid, Platform} from 'react-native';

import {iosReadGalleryPermission} from '@react-native-camera-roll/camera-roll';

/** Só leitura — nunca salvamos nada na galeria do usuário. */
export function useGalleryPermission() {
  return useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const status = await iosReadGalleryPermission('readWrite');
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

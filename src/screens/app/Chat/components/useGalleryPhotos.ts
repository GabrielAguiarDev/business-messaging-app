import {useCallback, useRef, useState} from 'react';

import {CameraRoll, PhotoIdentifier} from '@react-native-camera-roll/camera-roll';

import {useGalleryPermission} from './useGalleryPermission';

const PAGE_SIZE = 60;

export type GalleryLoadState = 'idle' | 'loading' | 'denied' | 'error';

/**
 * Busca fotos do rolo da câmera direto (sem abrir o picker/modal nativo do
 * SO) — a grid customizada em `GalleryPickerSheet` é quem exibe as miniaturas.
 */
export function useGalleryPhotos() {
  const [photos, setPhotos] = useState<PhotoIdentifier[]>([]);
  const [state, setState] = useState<GalleryLoadState>('idle');
  const [hasNextPage, setHasNextPage] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const requestPermission = useGalleryPermission();

  const loadMore = useCallback(async () => {
    if (state === 'loading' || !hasNextPage) {
      return;
    }
    setState('loading');
    const granted = await requestPermission();
    if (!granted) {
      setState('denied');
      return;
    }
    try {
      const page = await CameraRoll.getPhotos({
        first: PAGE_SIZE,
        after: cursorRef.current,
        assetType: 'Photos',
      });
      setPhotos(prev => [...prev, ...page.edges]);
      cursorRef.current = page.page_info.end_cursor;
      setHasNextPage(page.page_info.has_next_page);
      setState('idle');
    } catch {
      setState('error');
    }
  }, [state, hasNextPage, requestPermission]);

  const reset = useCallback(() => {
    setPhotos([]);
    setState('idle');
    setHasNextPage(true);
    cursorRef.current = undefined;
  }, []);

  return {photos, state, hasNextPage, loadMore, reset};
}

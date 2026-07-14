import {useCallback, useEffect, useState} from 'react';

import Sound from 'react-native-nitro-sound';

import {useAudioPlaybackStore} from '@services';

/**
 * Player de uma mensagem de áudio na bolha do chat. O player nativo é um
 * singleton (só toca um arquivo por vez) — `audioPlaybackStore` guarda qual
 * mensagem é a "dona" atual (tocando ou pausada); iniciar outra substitui.
 */
export function useAudioPlayback(messageId: string, uri: string) {
  const activeId = useAudioPlaybackStore(s => s.activeId);
  const storeIsPlaying = useAudioPlaybackStore(s => s.isPlaying);
  const setActive = useAudioPlaybackStore(s => s.setActive);
  const isMine = activeId === messageId;
  const isPlaying = isMine && storeIsPlaying;
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    if (!isMine) {
      setPositionMs(0);
      return;
    }
    Sound.addPlayBackListener(e => setPositionMs(e.currentPosition));
    Sound.addPlaybackEndListener(() => {
      setPositionMs(0);
      setActive(null, false);
    });
    return () => {
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
    };
  }, [isMine, setActive]);

  const toggle = useCallback(async () => {
    if (isMine) {
      if (isPlaying) {
        await Sound.pausePlayer();
        setActive(messageId, false);
      } else {
        await Sound.resumePlayer();
        setActive(messageId, true);
      }
      return;
    }
    // troca de dono do player — reinicia esta mensagem do começo
    setActive(messageId, true);
    await Sound.startPlayer(uri);
  }, [isMine, isPlaying, messageId, uri, setActive]);

  return {
    isPlaying,
    toggle,
    elapsedSeconds: Math.round(positionMs / 1000),
  };
}

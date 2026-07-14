import {create} from 'zustand';

interface AudioPlaybackState {
  /** id da mensagem "dona" do player nativo no momento (tocando OU pausada) */
  activeId: string | null;
  isPlaying: boolean;
  setActive: (id: string | null, isPlaying: boolean) => void;
}

/**
 * Coordena qual bolha de áudio "possui" o player nativo (singleton) no momento —
 * o player só toca um arquivo por vez, então iniciar outra mensagem substitui
 * a anterior (que não pode mais ser retomada de onde parou, só reiniciada).
 */
export const useAudioPlaybackStore = create<AudioPlaybackState>(set => ({
  activeId: null,
  isPlaying: false,
  setActive: (id, isPlaying) => set({activeId: id, isPlaying}),
}));

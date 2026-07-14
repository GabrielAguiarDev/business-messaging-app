import {useCallback, useRef, useState} from 'react';

import {PermissionsAndroid, Platform} from 'react-native';

import {trigger as triggerHaptic} from 'react-native-haptic-feedback';
import Sound from 'react-native-nitro-sound';
import {useSharedValue} from 'react-native-reanimated';

export type RecorderState = 'idle' | 'recording' | 'locked';

/** Abaixo disso o toque é tratado como acidental — descarta sem enviar. */
const MIN_RECORDING_MS = 800;

/** Faixa aproximada de metering (dBFS) usada para normalizar a onda em 0..1. */
const METERING_FLOOR_DB = -50;

/**
 * Grava mensagens de voz com react-native-nitro-sound (Nitro), salvando
 * localmente no diretório padrão do app (sem uri explícita — a lib gera o
 * arquivo em Documents/filesDir e devolve o path usado).
 *
 * `start`/`lock`/`stopAndSend`/`cancel` são 100% estáveis (deps vazias, leem
 * de refs) DE PROPÓSITO: `elapsedMs` muda a cada tick do listener de
 * gravação (~10x/s) e, se essas funções dependessem dele, o componente que
 * segura o `GestureDetector` (RecordButton) re-renderizaria nessa mesma
 * frequência — reconfigurando o gesto nativo tantas vezes por segundo que
 * ele perde o toque em andamento (o press-and-hold degenerava num tap).
 */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const stateRef = useRef<RecorderState>('idle');
  const elapsedMsRef = useRef(0);
  const uriRef = useRef<string | null>(null);
  /**
   * Promessa do `stopRecorder()` nativo ainda em andamento (a UI já voltou —
   * ver "UI otimista"). O próximo `start()` espera por ela antes de subir um
   * novo gravador: sem isso, criar um AVAudioRecorder enquanto o anterior ainda
   * finaliza faz o `audioRecorder = nil` do stop derrubar o gravador novo.
   */
  const pendingStopRef = useRef<Promise<unknown> | null>(null);
  /**
   * A contagem na tela roda num timer JS ancorado no instante do toque — o
   * `currentPosition` do listener nativo só começa a andar depois do setup da
   * sessão de áudio (~200ms), o que deixava o "0:00" congelado no início.
   */
  const startTsRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Deslocamento horizontal do arrasto (cancelar) — compartilhado entre o botão e o hint de gravação. */
  const dragX = useSharedValue(0);

  const applyState = useCallback((next: RecorderState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const reset = useCallback(() => {
    Sound.removeRecordBackListener();
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    uriRef.current = null;
    elapsedMsRef.current = 0;
    applyState('idle');
    setElapsedMs(0);
    setLevel(0);
  }, [applyState]);

  const start = useCallback(async () => {
    if (stateRef.current !== 'idle') {
      // já gravando/travado — ignora um segundo onBegin (ex.: toque acidental no botão invisível pós-lock)
      return false;
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissão de microfone',
          message: 'Precisamos do microfone para gravar mensagens de voz.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Cancelar',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    // UI otimista: mostra "gravando" JÁ, sem esperar o setup nativo (que reativa
    // a sessão de áudio + delay fixo da lib, ~200ms). O gesto (lock/release)
    // passa a responder na hora; o gravador nativo entra em seguida por baixo.
    triggerHaptic('impactMedium', {enableVibrateFallback: true});
    elapsedMsRef.current = 0;
    setElapsedMs(0);
    setLevel(0);
    applyState('recording');
    // contagem ancorada no toque (não no início real do gravador nativo)
    startTsRef.current = Date.now();
    tickerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTsRef.current;
      elapsedMsRef.current = elapsed;
      setElapsedMs(elapsed);
    }, 200);

    try {
      // espera um stop anterior terminar antes de subir outro gravador
      if (pendingStopRef.current) {
        await pendingStopRef.current;
        pendingStopRef.current = null;
      }
      const uri = await Sound.startRecorder(undefined, undefined, true);
      uriRef.current = uri;
      // o listener nativo fica só com o metering — o tempo vem do ticker JS
      Sound.addRecordBackListener(e => {
        if (typeof e.currentMetering === 'number') {
          setLevel(
            Math.max(0, Math.min(1, (e.currentMetering + Math.abs(METERING_FLOOR_DB)) / Math.abs(METERING_FLOOR_DB))),
          );
        }
      });
      return true;
    } catch {
      reset();
      return false;
    }
  }, [applyState, reset]);

  const lock = useCallback(() => {
    // só trava a partir de uma gravação ativa: se o release já parou/resetou
    // (corrida entre soltar o dedo e cruzar o limite de lock num arrasto
    // rápido), não reintroduz um estado 'locked' sem gravação por trás.
    if (stateRef.current === 'recording') {
      applyState('locked');
    }
  }, [applyState]);

  const stopAndSend = useCallback(async (): Promise<
    {uri: string; duration: number} | null
  > => {
    if (stateRef.current === 'idle') {
      return null;
    }
    const uri = uriRef.current;
    const duration = elapsedMsRef.current;
    // UI otimista: volta ao composer JÁ; o arquivo é finalizado por baixo.
    reset();
    // aguarda a finalização nativa (o arquivo só fica íntegro depois do stop)
    // antes de devolver a uri para enviar; a UI não espera por isso.
    const stopP = Sound.stopRecorder().catch(() => {});
    pendingStopRef.current = stopP;
    await stopP;
    if (pendingStopRef.current === stopP) {
      pendingStopRef.current = null;
    }
    if (!uri || duration < MIN_RECORDING_MS) {
      return null;
    }
    return {uri, duration: Math.round(duration / 1000)};
  }, [reset]);

  const cancel = useCallback(async () => {
    if (stateRef.current === 'idle') {
      return;
    }
    // ponto único do "excluir" — cobre o arrasto p/ cancelar E a lixeira do modo travado
    triggerHaptic('impactMedium', {enableVibrateFallback: true});
    // UI otimista: descarta na hora; a finalização nativa segue em background
    // (o próximo start() espera por ela via pendingStopRef).
    reset();
    pendingStopRef.current = Sound.stopRecorder().catch(() => {});
  }, [reset]);

  return {
    state,
    // estado ao vivo (síncrono) para decisões dentro de callbacks de gesto,
    // que rodam com um closure de render possivelmente defasado — ler `state`
    // ali pode enxergar 'idle' quando a gravação já começou, e vice-versa.
    stateRef,
    elapsedMs,
    level,
    dragX,
    start,
    lock,
    stopAndSend,
    cancel,
  };
}

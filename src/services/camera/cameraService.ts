import {create} from 'zustand';

/** Ferramentas de edição disponíveis no topo do preview da foto. */
export type PhotoEditorTool = 'crop' | 'text' | 'draw';

export interface CameraOpenOptions {
  /** Mostra o campo de legenda na base do preview. Padrão: true. */
  showCaption?: boolean;
  /** Ferramentas de edição no topo (ordem preservada). Padrão: crop/text/draw. */
  editors?: PhotoEditorTool[];
  /** Exibe o botão de galeria na câmera (resolve com `{type:'gallery'}`). Padrão: false. */
  allowGallery?: boolean;
  /** Ícone do botão de confirmar no preview. Padrão: 'send'. */
  confirmIcon?: 'send' | 'check';
}

/**
 * Resultado da câmera global: uma foto (já com as edições achatadas na
 * imagem) ou o pedido de abrir a galeria (`gallery`) — quem chamou decide
 * como abrir a grade. `null` = usuário cancelou.
 */
export type CameraResult =
  | {type: 'photo'; uri: string; caption: string}
  | {type: 'gallery'};

interface CameraRequest {
  options: CameraOpenOptions;
  /** Se definido, abre DIRETO no preview/edição desta uri (pula a câmera). */
  previewUri?: string;
  resolve: (result: CameraResult | null) => void;
}

interface CameraStore {
  request: CameraRequest | null;
  open: (options?: CameraOpenOptions) => Promise<CameraResult | null>;
  openPreview: (
    uri: string,
    options?: CameraOpenOptions,
  ) => Promise<CameraResult | null>;
  close: (result: CameraResult | null) => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  request: null,
  open: options =>
    new Promise<CameraResult | null>(resolve => {
      // abrir uma nova câmera enquanto outra estava pendente cancela a anterior
      get().request?.resolve(null);
      set({request: {options: options ?? {}, resolve}});
    }),
  openPreview: (uri, options) =>
    new Promise<CameraResult | null>(resolve => {
      get().request?.resolve(null);
      set({request: {options: options ?? {}, previewUri: uri, resolve}});
    }),
  close: result => {
    const req = get().request;
    if (!req) {
      return;
    }
    req.resolve(result);
    set({request: null});
  },
}));

/**
 * Câmera + preview/edição GLOBAL do app (montada uma vez no root via
 * `CameraHost`). Uso imperativo em qualquer tela:
 *
 *   const res = await cameraService.open({showCaption: true, allowGallery: true});
 *   if (res?.type === 'photo') enviar(res.uri, res.caption);
 */
export const cameraService = {
  open: (options?: CameraOpenOptions) => useCameraStore.getState().open(options),
  /** Abre direto na tela de preview/edição de uma foto já escolhida (galeria). */
  openPreview: (uri: string, options?: CameraOpenOptions) =>
    useCameraStore.getState().openPreview(uri, options),
  close: (result: CameraResult | null = null) =>
    useCameraStore.getState().close(result),
};

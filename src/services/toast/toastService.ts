import {create} from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

interface ToastState {
  toast: ToastData | null;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  toast: null,
  show: (message, type = 'info') => set({toast: {message, type}}),
  hide: () => set({toast: null}),
}));

/** Uso fora de componentes (services, useCases): toastService.show('...') */
export const toastService = {
  show: (message: string, type: ToastType = 'info') =>
    useToastStore.getState().show(message, type),
  hide: () => useToastStore.getState().hide(),
};

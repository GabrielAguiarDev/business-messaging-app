import {isAxiosError} from 'axios';

export interface ApiError {
  status: number;
  message: string;
}

const DEFAULT_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

const MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Requisição inválida. Revise os dados e tente novamente.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  422: 'Não foi possível processar os dados enviados.',
  500: 'Erro no servidor. Tente novamente em instantes.',
};

export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const backendMessage = error.response?.data?.message;
    return {
      status,
      message:
        typeof backendMessage === 'string' && backendMessage.length > 0
          ? backendMessage
          : MESSAGE_BY_STATUS[status] ?? DEFAULT_MESSAGE,
    };
  }
  return {status: 0, message: DEFAULT_MESSAGE};
}

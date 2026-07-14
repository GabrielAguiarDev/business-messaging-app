import {AxiosError, AxiosHeaders} from 'axios';

import {toApiError} from '../apiError';

function axiosErrorWithStatus(status: number, data?: unknown): AxiosError {
  const headers = new AxiosHeaders();
  const config = {headers};
  return new AxiosError('fail', 'ERR', config, {}, {
    status,
    data,
    statusText: '',
    headers,
    config,
  });
}

describe('toApiError', () => {
  it('usa a mensagem do backend quando existir', () => {
    const error = axiosErrorWithStatus(400, {message: 'Email já cadastrado'});
    expect(toApiError(error)).toEqual({
      status: 400,
      message: 'Email já cadastrado',
    });
  });

  it('usa mensagem default em PT por status', () => {
    expect(toApiError(axiosErrorWithStatus(401)).message).toBe(
      'Sessão expirada. Faça login novamente.',
    );
    expect(toApiError(axiosErrorWithStatus(500)).message).toBe(
      'Erro no servidor. Tente novamente em instantes.',
    );
  });

  it('normaliza erros não-axios', () => {
    const apiError = toApiError(new Error('boom'));
    expect(apiError.status).toBe(0);
    expect(apiError.message).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});

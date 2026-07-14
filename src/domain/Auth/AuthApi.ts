import {delay} from '@utils';

import {AuthCredentialsAPI} from './AuthTypes';

/**
 * MOCK — sem backend ainda. Simula latência e devolve o usuário do
 * protótipo. Quando o contrato existir: trocar por `api.post<...>(...)`
 * sem tocar em Service/useCases.
 */
const MOCK_USER_API = {
  id: 'u1',
  full_name: 'Ana Prado',
  role: 'Recepção · Yago',
  department: 'Recepção',
  email: 'ana.prado@yago.com',
  avatar_color: '#9079d7',
  is_admin: false,
  is_online: true,
};

async function signIn(email: string, _password: string): Promise<AuthCredentialsAPI> {
  await delay();
  return {
    token: `mock-token-${Date.now()}`,
    user: {...MOCK_USER_API, email},
  };
}

async function requestNewPassword(email: string): Promise<{message: string}> {
  await delay();
  return {message: `Link de redefinição enviado para ${email}`};
}

export const authApi = {signIn, requestNewPassword};

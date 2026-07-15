import {initialsOf, User} from '../User';
import {authAdapter} from './AuthAdapter';
import {authApi} from './AuthApi';
import {
  AuthCredentials,
  SignInParams,
  UpdateProfileParams,
} from './AuthTypes';

async function signIn({email, password}: SignInParams): Promise<AuthCredentials> {
  const credentialsAPI = await authApi.signIn(email, password);
  return authAdapter.toAuthCredentials(credentialsAPI);
}

async function requestNewPassword(email: string): Promise<void> {
  await authApi.requestNewPassword(email);
}

/**
 * Atualiza nome/foto do usuário logado e devolve o User atualizado
 * (o chamador persiste nas credenciais). Iniciais recalculadas do nome.
 */
async function updateProfile(
  user: User,
  params: UpdateProfileParams,
): Promise<User> {
  const updated = await authApi.updateProfile({
    full_name: params.name,
    avatar_url: params.avatarUrl,
  });
  return {
    ...user,
    name: updated.full_name,
    initials: initialsOf(updated.full_name),
    avatarUrl: updated.avatar_url,
  };
}

export const authService = {signIn, requestNewPassword, updateProfile};

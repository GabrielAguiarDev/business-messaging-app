import {authAdapter} from './AuthAdapter';
import {authApi} from './AuthApi';
import {AuthCredentials, SignInParams} from './AuthTypes';

async function signIn({email, password}: SignInParams): Promise<AuthCredentials> {
  const credentialsAPI = await authApi.signIn(email, password);
  return authAdapter.toAuthCredentials(credentialsAPI);
}

async function requestNewPassword(email: string): Promise<void> {
  await authApi.requestNewPassword(email);
}

export const authService = {signIn, requestNewPassword};

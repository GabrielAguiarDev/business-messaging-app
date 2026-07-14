import {MutationOptions, useMutation} from '@infra';

import {authService} from '../AuthService';
import {AuthCredentials, SignInParams} from '../AuthTypes';

export function useAuthSignIn(options?: MutationOptions<AuthCredentials>) {
  const mutation = useMutation<SignInParams, AuthCredentials>(
    authService.signIn,
    options,
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    signIn: (params: SignInParams) => mutation.mutate(params),
  };
}

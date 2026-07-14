import {MutationOptions, useMutation} from '@infra';

import {authService} from '../AuthService';

export function useAuthRequestNewPassword(options?: MutationOptions<void>) {
  const mutation = useMutation<string, void>(
    authService.requestNewPassword,
    options,
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    requestNewPassword: (email: string) => mutation.mutate(email),
  };
}

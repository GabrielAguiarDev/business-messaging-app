import {MutationOptions, useMutation} from '@infra';

import {User} from '../../User';
import {authService} from '../AuthService';
import {UpdateProfileParams} from '../AuthTypes';

interface UpdateProfileVariables {
  user: User;
  params: UpdateProfileParams;
}

export function useAuthUpdateProfile(options?: MutationOptions<User>) {
  const mutation = useMutation<UpdateProfileVariables, User>(
    ({user, params}) => authService.updateProfile(user, params),
    options,
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    updateProfile: (user: User, params: UpdateProfileParams) =>
      mutation.mutate({user, params}),
  };
}

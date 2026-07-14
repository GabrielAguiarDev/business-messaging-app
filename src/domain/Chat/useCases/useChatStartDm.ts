import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {User} from '../../User';
import {chatService} from '../ChatService';
import {Chat} from '../ChatTypes';

export function useChatStartDm(options?: MutationOptions<Chat>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<User, Chat>(chatService.startDm, {
    onSuccess: chat => {
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
      options?.onSuccess?.(chat);
    },
    onError: options?.onError,
  });

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    startDm: (user: User) => mutation.mutate(user),
  };
}

import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';

export function useChatDelete(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<string, void>(chatService.deleteChat, {
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
      options?.onSuccess?.(undefined);
    },
    onError: options?.onError,
  });

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    deleteChat: (chatId: string) => mutation.mutate(chatId),
  };
}

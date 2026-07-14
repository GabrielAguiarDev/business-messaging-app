import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';

export function useChatToggleMute(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<{chatId: string; muted: boolean}, void>(
    chatService.setMuted,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatDetails]});
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
        options?.onSuccess?.(undefined);
      },
      onError: options?.onError,
    },
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    setMuted: (chatId: string, muted: boolean) =>
      mutation.mutate({chatId, muted}),
  };
}

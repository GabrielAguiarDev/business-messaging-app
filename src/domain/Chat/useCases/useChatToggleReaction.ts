import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';

export function useChatToggleReaction(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    {chatId: string; messageId: string; emoji: string},
    void
  >(chatService.toggleReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatMessages]});
      options?.onSuccess?.(undefined);
    },
    onError: options?.onError,
  });

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    toggleReaction: (chatId: string, messageId: string, emoji: string) =>
      mutation.mutate({chatId, messageId, emoji}),
  };
}

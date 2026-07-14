import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';

export function useChatToggleStar(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<{chatId: string; messageId: string}, void>(
    chatService.toggleStarred,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatMessages]});
        options?.onSuccess?.(undefined);
      },
      onError: options?.onError,
    },
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    toggleStar: (chatId: string, messageId: string) =>
      mutation.mutate({chatId, messageId}),
  };
}

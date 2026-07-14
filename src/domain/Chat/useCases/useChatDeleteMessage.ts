import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';

export function useChatDeleteMessage(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<{chatId: string; messageId: string}, void>(
    chatService.deleteMessage,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatMessages]});
        // a apagada pode ter sido a última — o preview da lista muda
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
        options?.onSuccess?.(undefined);
      },
      onError: options?.onError,
    },
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    deleteMessage: (chatId: string, messageId: string) =>
      mutation.mutate({chatId, messageId}),
  };
}

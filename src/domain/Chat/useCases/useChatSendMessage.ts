import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {chatService} from '../ChatService';
import {Message, SendMessageParams} from '../ChatTypes';

export function useChatSendMessage(options?: MutationOptions<Message>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<SendMessageParams, Message>(
    chatService.sendMessage,
    {
      onSuccess: message => {
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatMessages]});
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
        options?.onSuccess?.(message);
      },
      onError: options?.onError,
    },
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    sendMessage: (params: SendMessageParams) => mutation.mutate(params),
  };
}

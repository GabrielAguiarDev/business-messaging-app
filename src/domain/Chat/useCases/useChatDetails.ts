import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {chatService} from '../ChatService';

export function useChatDetails(chatId: string) {
  const {data, isLoading, isError} = useQuery({
    queryKey: [QueryKeys.ChatDetails, chatId],
    queryFn: () => chatService.getChatById(chatId),
  });

  return {
    chat: data,
    isLoading,
    isError,
  };
}

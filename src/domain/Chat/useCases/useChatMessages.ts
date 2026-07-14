import {useEffect} from 'react';

import {useQuery, useQueryClient} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {chatService} from '../ChatService';

export function useChatMessages(chatId: string) {
  const queryClient = useQueryClient();

  const {data, isLoading, isError} = useQuery({
    queryKey: [QueryKeys.ChatMessages, chatId],
    queryFn: () => chatService.getMessages(chatId),
  });

  // abrir a conversa zera as não lidas na lista
  useEffect(() => {
    chatService.markAsRead(chatId).then(() => {
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
    });
  }, [chatId, queryClient]);

  return {
    messages: data ?? [],
    isLoading,
    isError,
  };
}

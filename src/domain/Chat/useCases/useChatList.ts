import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {chatService} from '../ChatService';

export function useChatList() {
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: [QueryKeys.ChatList],
    queryFn: chatService.getChats,
  });

  return {
    chats: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}

import React, {useMemo, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';

import {
  Box,
  EmptyState,
  ErrorState,
  IconButton,
  Screen,
  SearchBar,
  Text,
} from '@components';
import {Chat, useChatDelete, useChatList, useChatToggleMute} from '@domain';
import {AppTabScreenProps} from '@routes';
import {toastService} from '@services';

import {ChatListItem} from './components/ChatListItem';

export function ChatListScreen({
  navigation,
}: AppTabScreenProps<'ChatsTab'>) {
  const [search, setSearch] = useState('');
  const {chats, isLoading, isError, refetch} = useChatList();

  const {setMuted} = useChatToggleMute({
    onError: error => toastService.show(error.message, 'error'),
  });
  const {deleteChat} = useChatDelete({
    onError: error => toastService.show(error.message, 'error'),
  });

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return chats;
    }
    return chats.filter(
      chat =>
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query),
    );
  }, [chats, search]);

  function navigateToChat(chatId: string) {
    navigation.navigate('ChatScreen', {chatId});
  }

  function navigateToNewConversation() {
    navigation.navigate('NewConversationScreen');
  }

  function confirmDelete(chat: Chat) {
    Alert.alert(
      'Apagar conversa',
      `A conversa com "${chat.name}" será apagada. Essa ação não pode ser desfeita.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => deleteChat(chat.id),
        },
      ],
    );
  }

  function renderItem({item}: ListRenderItemInfo<Chat>) {
    return (
      <ChatListItem
        chat={item}
        onPress={() => navigateToChat(item.id)}
        onToggleMute={() => setMuted(item.id, !item.muted)}
        onDelete={() => confirmDelete(item)}
      />
    );
  }

  return (
    <Screen contentProps={$content}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="s20"
        paddingVertical="s8">
        <Text variant="largeTitle">Chats</Text>
        <IconButton
          icon="newChat"
          preset="primary"
          onPress={navigateToNewConversation}
        />
      </Box>
      <Box paddingHorizontal="s16" paddingBottom="s8">
        <SearchBar
          placeholder="Buscar conversas e pessoas"
          value={search}
          onChangeText={setSearch}
        />
      </Box>
      {isLoading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={chat => chat.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <EmptyState
              icon="chat"
              title="Nenhuma conversa"
              message="Toque em Nova conversa para começar."
            />
          }
        />
      )}
    </Screen>
  );
}

const $content = {paddingHorizontal: 's0'} as const;
// tab bar flutuante — folga no fim da lista
const $listContent = {paddingBottom: 100, flexGrow: 1};

import React, {useMemo, useState} from 'react';

import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';

import {
  Avatar,
  Box,
  EmptyState,
  ErrorState,
  Icon,
  Screen,
  SearchBar,
  Text,
  TouchableOpacityBox,
} from '@components';
import {
  Chat,
  Message,
  SendMessageParams,
  useChatList,
  useChatSendMessage,
} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

/** Resumo do conteúdo da mensagem para o cabeçalho da tela. */
function previewOf(message: Message): string {
  if (message.kind === 'audio') {
    return '🎤 Mensagem de voz';
  }
  if (message.kind === 'image') {
    return '📷 Foto';
  }
  return message.text;
}

/** Reconstrói os parâmetros de envio a partir da mensagem encaminhada. */
function toSendParams(
  message: Message,
  chatId: string,
  forward: SendMessageParams['forward'],
): SendMessageParams {
  const content: Partial<SendMessageParams> =
    message.kind === 'audio'
      ? {
          audio: {
            uri: message.audioUri ?? '',
            duration: message.audioDuration ?? 0,
          },
        }
      : message.kind === 'image'
        ? // legenda (se houver) viaja junto com a foto encaminhada
          {image: {uri: message.imageUri ?? ''}, text: message.text}
        : {text: message.text};
  return {chatId, forward, ...content};
}

export function ForwardMessageScreen({
  navigation,
  route,
}: AppStackScreenProps<'ForwardMessageScreen'>) {
  const {message, forward} = route.params;
  const [search, setSearch] = useState('');
  const {chats, isLoading, isError, refetch} = useChatList();

  const {sendMessage, isLoading: isSending} = useChatSendMessage({
    onError: error => toastService.show(error.message, 'error'),
  });

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return chats;
    }
    return chats.filter(chat => chat.name.toLowerCase().includes(query));
  }, [chats, search]);

  function handleSelect(chat: Chat) {
    sendMessage(toSendParams(message, chat.id, forward));
    toastService.show('Mensagem encaminhada.');
    navigation.replace('ChatScreen', {chatId: chat.id});
  }

  function renderItem({item: chat}: ListRenderItemInfo<Chat>) {
    return (
      <TouchableOpacityBox
        onPress={() => handleSelect(chat)}
        disabled={isSending}
        activeOpacity={0.7}
        flexDirection="row"
        alignItems="center"
        gap="s12"
        paddingHorizontal="s16"
        paddingTop="s10">
        <Avatar
          label={chat.initials}
          color={chat.avatarColor}
          photoUri={chat.avatarUrl}
          shape="circle"
          size={50}
        />
        <Box
          flex={1}
          flexDirection="row"
          alignItems="center"
          gap="s6"
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s12">
          <Box flex={1}>
            <Text variant="itemTitle" numberOfLines={1}>
              {chat.name}
            </Text>
            {chat.context && (
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {chat.context}
              </Text>
            )}
          </Box>
          <Icon name="forward" size={20} color="textTertiary" />
        </Box>
      </TouchableOpacityBox>
    );
  }

  return (
    <Screen
      title="Encaminhar para"
      canGoBack
      onBackPress={navigation.goBack}
      contentProps={$content}>
      {/* Prévia da mensagem sendo encaminhada */}
      <Box
        marginHorizontal="s16"
        marginBottom="s8"
        padding="s12"
        borderRadius="br10"
        backgroundColor="primaryTint"
        borderLeftWidth={3}
        borderLeftColor="primary">
        <Box flexDirection="row" alignItems="center" gap="s4" marginBottom="s2">
          <Icon name="forward" size={13} color="primary" />
          <Text variant="captionSmall" color="primary" fontWeight="700">
            {forward ? `Encaminhando de ${forward.authorName}` : 'Encaminhando'}
          </Text>
        </Box>
        <Text variant="paragraphSecondary" numberOfLines={2}>
          {previewOf(message)}
        </Text>
      </Box>

      <Box paddingHorizontal="s16" paddingBottom="s8">
        <SearchBar
          placeholder="Buscar conversa"
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
      ) : filteredChats.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nenhuma conversa encontrada"
          message="Tente buscar por outro nome."
        />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={chat => chat.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </Screen>
  );
}

const $content = {paddingHorizontal: 's0'} as const;
const $listContent = {paddingBottom: 24};

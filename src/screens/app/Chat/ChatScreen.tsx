import React, {useMemo, useRef, useState} from 'react';

import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
} from 'react-native';

import {GestureDetector, useTapGesture} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Avatar, Box, IconButton, Text, TouchableOpacityBox} from '@components';
import {
  Chat,
  Message,
  MessageReply,
  useChatDelete,
  useChatDetails,
  useChatMessages,
  useChatSendMessage,
  useChatToggleMute,
} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

import {AttendanceBanner} from './components/AttendanceBanner';
import {ChatMenuSheet} from './components/ChatMenuSheet';
import {Composer} from './components/Composer';
import {MessageBubble} from './components/MessageBubble';

export function ChatScreen({
  navigation,
  route,
}: AppStackScreenProps<'ChatScreen'>) {
  const {chatId} = route.params;
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const {chat} = useChatDetails(chatId);
  const {messages} = useChatMessages(chatId);
  const {sendMessage} = useChatSendMessage({
    onError: error => toastService.show(error.message, 'error'),
  });
  const {setMuted} = useChatToggleMute({
    onError: error => toastService.show(error.message, 'error'),
  });
  const {deleteChat} = useChatDelete({
    onSuccess: () => navigation.goBack(),
    onError: error => toastService.show(error.message, 'error'),
  });

  function confirmDelete() {
    if (!chat) {
      return;
    }
    Alert.alert(
      'Apagar conversa',
      `A conversa com "${chat.name}" será apagada. Essa ação não pode ser desfeita.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => deleteChat(chatId),
        },
      ],
    );
  }

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // tap na área de mensagens desfoca o input (composer volta ao compacto);
  // arrastar cancela o tap, então o scroll não é afetado
  const dismissKeyboardTap = useTapGesture({
    runOnJS: true,
    onActivate: () => Keyboard.dismiss(),
  });

  /** Monta a referência exibida na bolha/composer a partir da mensagem respondida. */
  function toReplyRef(message: Message): MessageReply {
    return {
      messageId: message.id,
      authorName: message.isMine
        ? 'Você'
        : message.author?.name ?? chat?.name ?? '',
      preview:
        message.kind === 'audio'
          ? '🎤 Mensagem de voz'
          : message.kind === 'image'
            ? '📷 Foto'
            : message.text,
      kind: message.kind,
    };
  }

  const replyRef = replyingTo ? toReplyRef(replyingTo) : undefined;

  function submitMessage() {
    if (!draft.trim()) {
      return;
    }
    sendMessage({chatId, text: draft, replyTo: replyRef});
    setDraft('');
    setReplyingTo(null);
  }

  function submitAudioMessage(uri: string, duration: number) {
    sendMessage({chatId, audio: {uri, duration}, replyTo: replyRef});
    setReplyingTo(null);
  }

  function submitImageMessage(uri: string) {
    sendMessage({chatId, image: {uri}, replyTo: replyRef});
    setReplyingTo(null);
  }

  /** Tap na citação de uma resposta → rola até a mensagem original. */
  function scrollToMessage(messageId: string) {
    const index = invertedMessages.findIndex(m => m.id === messageId);
    if (index < 0) {
      return;
    }
    listRef.current?.scrollToIndex({index, animated: true, viewPosition: 0.5});
  }

  function renderItem({item}: ListRenderItemInfo<Message>) {
    return (
      <MessageBubble
        message={item}
        onReply={setReplyingTo}
        onQuotePress={scrollToMessage}
      />
    );
  }

  return (
    <Box flex={1} backgroundColor="chatBackground">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={$flex}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          gap="s10"
          paddingHorizontal="s10"
          paddingBottom="s10"
          backgroundColor="surface"
          borderBottomWidth={1}
          borderColor="separator"
          style={{paddingTop: insets.top + 6}}>
          <IconButton icon="back" onPress={navigation.goBack} />
          {chat && (
            <TouchableOpacityBox
              onPress={() =>
                navigation.navigate('ChatProfileScreen', {chatId})
              }
              activeOpacity={0.7}
              flex={1}
              flexDirection="row"
              alignItems="center"
              gap="s10">
              <Avatar
                label={chat.initials}
                color={chat.avatarColor}
                shape="circle"
                size={38}
              />
              <Box flex={1}>
                <Text variant="itemTitle" fontWeight="700" numberOfLines={1}>
                  {chat.name}
                </Text>
                <ChatSubtitle chat={chat} />
              </Box>
            </TouchableOpacityBox>
          )}
          <IconButton icon="dots" onPress={() => setMenuVisible(true)} />
        </Box>

        {/* Banner de atendimento */}
        {chat?.type === 'attendance' && <AttendanceBanner chat={chat} />}

        {/* Mensagens */}
        <GestureDetector gesture={dismissKeyboardTap}>
          <FlatList
            ref={listRef}
            data={invertedMessages}
            inverted
            style={$flex}
            keyExtractor={message => message.id}
            renderItem={renderItem}
            contentContainerStyle={$messagesContent}
            showsVerticalScrollIndicator={false}
            // scrollToIndex sem getItemLayout falha quando o alvo ainda não
            // foi medido (fora do render window) — aproxima via offset e o
            // FlatList tenta de novo sozinho na sequência
            onScrollToIndexFailed={info => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }}
          />
        </GestureDetector>

        {/* Composer */}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={submitMessage}
          onSendAudio={submitAudioMessage}
          onSendImage={submitImageMessage}
          replyingTo={replyRef}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>

      {chat && (
        <ChatMenuSheet
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          chat={chat}
          onViewProfile={() =>
            navigation.navigate('ChatProfileScreen', {chatId})
          }
          onToggleMute={() => setMuted(chatId, !chat.muted)}
          onDelete={confirmDelete}
        />
      )}
    </Box>
  );
}

function ChatSubtitle({chat}: {chat: Chat}) {
  if (chat.type === 'dm') {
    return (
      <Text
        variant="captionSmall"
        color={chat.online ? 'primary' : 'textSecondary'}>
        {chat.online ? 'online' : 'visto por último hoje'}
      </Text>
    );
  }
  if (chat.context) {
    return (
      <Text variant="captionSmall" numberOfLines={1}>
        {chat.type === 'group' ? `${chat.context} › ${chat.name}` : chat.context}
      </Text>
    );
  }
  return null;
}

const $flex = {flex: 1};
// flexGrow: 1 — sem isso o conteúdo tem só a altura das mensagens e o
// espaço vazio acima não responde ao arrasto/scroll
const $messagesContent = {padding: 12, gap: 6, flexGrow: 1};

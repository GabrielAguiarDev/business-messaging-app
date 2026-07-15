import React, {useMemo, useRef, useState} from 'react';

import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  View,
} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {GestureDetector, useTapGesture} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  AnchorFrame,
  Avatar,
  Box,
  ContextMenu,
  IconButton,
  MenuItemSpec,
  Text,
  TouchableOpacityBox,
} from '@components';
import {
  Chat,
  Message,
  MessageReply,
  useChatDelete,
  useChatDeleteMessage,
  useChatDetails,
  useChatMessages,
  useChatSendMessage,
  useChatToggleMute,
  useChatToggleReaction,
  useChatToggleStar,
} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

import {AttendanceBanner} from './components/AttendanceBanner';
import {Composer} from './components/Composer';
import {
  MessageActionsOverlay,
  MessageActionsTarget,
} from './components/MessageActionsOverlay';
import {BubbleFrame, MessageBubble} from './components/MessageBubble';

export function ChatScreen({
  navigation,
  route,
}: AppStackScreenProps<'ChatScreen'>) {
  const {chatId} = route.params;
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<AnchorFrame | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [actionsTarget, setActionsTarget] =
    useState<MessageActionsTarget | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const menuButtonRef = useRef<View>(null);

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
  const {toggleReaction} = useChatToggleReaction({
    onError: error => toastService.show(error.message, 'error'),
  });
  const {toggleStar} = useChatToggleStar({
    onError: error => toastService.show(error.message, 'error'),
  });
  const {deleteMessage} = useChatDeleteMessage({
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

  /** Botão ⋯ do header → menu de contexto ancorado nele (estilo WhatsApp). */
  function openHeaderMenu() {
    Keyboard.dismiss();
    menuButtonRef.current?.measureInWindow((x, y, width, height) =>
      setHeaderMenuAnchor({x, y, width, height}),
    );
  }

  /** Fecha o menu do header e executa a ação escolhida. */
  function headerMenuAction(action: () => void) {
    return () => {
      setHeaderMenuAnchor(null);
      action();
    };
  }

  const headerMenuItems: MenuItemSpec[] = chat
    ? [
        {
          icon: 'person',
          label: 'Ver perfil',
          onPress: headerMenuAction(() =>
            navigation.navigate('ChatProfileScreen', {chatId}),
          ),
        },
        {
          icon: chat.muted ? 'bell' : 'bellOff',
          label: chat.muted
            ? 'Reativar notificações'
            : 'Silenciar notificações',
          onPress: headerMenuAction(() => setMuted(chatId, !chat.muted)),
        },
        {
          icon: 'search',
          label: 'Buscar na conversa',
          onPress: headerMenuAction(() =>
            toastService.show('Disponível em breve.'),
          ),
        },
        {
          icon: 'trash',
          label: 'Apagar conversa',
          danger: true,
          separated: true,
          onPress: headerMenuAction(confirmDelete),
        },
      ]
    : [];

  /** Long-press na bolha → abre o overlay de ações na posição medida. */
  function openMessageActions(message: Message, frame: BubbleFrame) {
    Keyboard.dismiss();
    setActionsTarget({message, frame});
  }

  function handleReact(message: Message, emoji: string) {
    setActionsTarget(null);
    toggleReaction(chatId, message.id, emoji);
  }

  function handleReplyAction(message: Message) {
    setActionsTarget(null);
    setReplyingTo(message);
  }

  function handleCopy(message: Message) {
    Clipboard.setString(message.text);
    setActionsTarget(null);
    toastService.show('Mensagem copiada.');
  }

  function handleToggleStar(message: Message) {
    setActionsTarget(null);
    toggleStar(chatId, message.id);
    toastService.show(
      message.starred
        ? 'Mensagem removida das favoritas.'
        : 'Mensagem favoritada.',
    );
  }

  function confirmDeleteMessage(message: Message) {
    setActionsTarget(null);
    Alert.alert(
      'Apagar mensagem',
      'A mensagem será apagada. Essa ação não pode ser desfeita.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => deleteMessage(chatId, message.id),
        },
      ],
    );
  }

  /**
   * Encaminhar mantém o vínculo com o autor ORIGINAL:
   * - mensagem já encaminhada → preserva a referência que ela já carrega
   *   (reencaminhar não troca o autor pela pessoa do meio da corrente);
   * - mensagem própria (autoria minha) → vai só o conteúdo, sem referência;
   * - mensagem de outro usuário → referência ao autor dela.
   */
  function handleForward(message: Message) {
    setActionsTarget(null);
    const forward = message.forwardedFrom
      ? message.forwardedFrom
      : message.isMine
        ? undefined
        : {authorName: message.author?.name ?? chat?.name ?? ''};
    navigation.navigate('ForwardMessageScreen', {message, forward});
  }

  function handleActionSoon() {
    setActionsTarget(null);
    toastService.show('Disponível em breve.');
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
        onLongPress={openMessageActions}
        onReactionPress={(message, emoji) =>
          toggleReaction(chatId, message.id, emoji)
        }
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
          <Box ref={menuButtonRef} collapsable={false}>
            <IconButton icon="dots" onPress={openHeaderMenu} />
          </Box>
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

      <ContextMenu
        visible={!!headerMenuAnchor}
        anchor={headerMenuAnchor}
        items={headerMenuItems}
        onClose={() => setHeaderMenuAnchor(null)}
      />

      <MessageActionsOverlay
        target={actionsTarget}
        onClose={() => setActionsTarget(null)}
        onReact={handleReact}
        onReply={handleReplyAction}
        onForward={handleForward}
        onCopy={handleCopy}
        onToggleStar={handleToggleStar}
        onDelete={confirmDeleteMessage}
        onMore={handleActionSoon}
      />
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

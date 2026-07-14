import {Chat, ChatAPI, Message, MessageAPI} from './ChatTypes';

function toChat(chatAPI: ChatAPI): Chat {
  return {
    id: chatAPI.id,
    type: chatAPI.type,
    name: chatAPI.name,
    initials: chatAPI.initials,
    avatarColor: chatAPI.avatar_color,
    lastMessage: chatAPI.last_message,
    lastMessageTime: chatAPI.last_message_time,
    unreadCount: chatAPI.unread_count,
    muted: chatAPI.is_muted,
    context: chatAPI.context,
    online: chatAPI.is_online,
    product: chatAPI.product,
    status: chatAPI.status,
    assignedTo: chatAPI.assigned_to,
  };
}

function toMessage(messageAPI: MessageAPI): Message {
  return {
    id: messageAPI.id,
    kind: messageAPI.kind,
    text: messageAPI.text,
    isMine: messageAPI.is_mine,
    author:
      messageAPI.author_name && messageAPI.author_color
        ? {name: messageAPI.author_name, color: messageAPI.author_color}
        : undefined,
    time: messageAPI.time,
    ticks: messageAPI.ticks,
    audioUri: messageAPI.audio_uri,
    audioDuration: messageAPI.audio_duration,
    imageUri: messageAPI.image_uri,
    reactions: messageAPI.reactions?.map(reaction => ({
      emoji: reaction.emoji,
      count: reaction.count,
      reactedByMe: reaction.reacted_by_me,
    })),
    starred: messageAPI.is_starred,
    replyTo: messageAPI.reply_to
      ? {
          messageId: messageAPI.reply_to.message_id,
          authorName: messageAPI.reply_to.author_name,
          preview: messageAPI.reply_to.preview,
          kind: messageAPI.reply_to.kind,
        }
      : undefined,
  };
}

export const chatAdapter = {toChat, toMessage};

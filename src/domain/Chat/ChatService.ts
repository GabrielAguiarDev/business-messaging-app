import {User} from '../User';
import {chatAdapter} from './ChatAdapter';
import {chatApi} from './ChatApi';
import {Chat, Message, SendMessageParams} from './ChatTypes';

async function getChats(): Promise<Chat[]> {
  const chats = await chatApi.getChats();
  return chats.map(chatAdapter.toChat);
}

async function getChatById(chatId: string): Promise<Chat> {
  const chat = await chatApi.getChatById(chatId);
  return chatAdapter.toChat(chat);
}

async function getMessages(chatId: string): Promise<Message[]> {
  const messages = await chatApi.getMessages(chatId);
  return messages.map(chatAdapter.toMessage);
}

async function sendMessage({
  chatId,
  text,
  audio,
  image,
  replyTo,
}: SendMessageParams): Promise<Message> {
  const message = await chatApi.sendMessage(chatId, {
    text: text?.trim(),
    audio,
    image,
    reply_to: replyTo
      ? {
          message_id: replyTo.messageId,
          author_name: replyTo.authorName,
          preview: replyTo.preview,
          kind: replyTo.kind,
        }
      : undefined,
  });
  return chatAdapter.toMessage(message);
}

async function markAsRead(chatId: string): Promise<void> {
  await chatApi.markAsRead(chatId);
}

async function setMuted({
  chatId,
  muted,
}: {
  chatId: string;
  muted: boolean;
}): Promise<void> {
  await chatApi.setMuted(chatId, muted);
}

async function deleteChat(chatId: string): Promise<void> {
  await chatApi.deleteChat(chatId);
}

async function startDm(user: User): Promise<Chat> {
  const chat = await chatApi.startDm({
    id: user.id,
    full_name: user.name,
    role: user.role,
    department: user.department,
    email: user.email,
    avatar_color: user.avatarColor,
    is_admin: user.isAdmin,
    is_online: user.online,
  });
  return chatAdapter.toChat(chat);
}

export const chatService = {
  getChats,
  getChatById,
  getMessages,
  sendMessage,
  markAsRead,
  setMuted,
  deleteChat,
  startDm,
};

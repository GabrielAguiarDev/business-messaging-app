import {delay} from '@utils';

import {UserAPI} from '../User';
import {mockDb, nextMessageId} from './ChatApiMockDb';
import {
  ChatAPI,
  MessageAPI,
  MessageForwardAPI,
  MessageReplyAPI,
} from './ChatTypes';

/**
 * MOCK stateful — simula o backend de chats sobre `mockDb`.
 * Quando o contrato existir: trocar por chamadas `api.*` mantendo
 * as assinaturas; Service/useCases não mudam.
 */

async function getChats(): Promise<ChatAPI[]> {
  await delay(400);
  return [...mockDb.chats];
}

async function getChatById(chatId: string): Promise<ChatAPI> {
  await delay(150);
  const chat =
    mockDb.chats.find(c => c.id === chatId) ??
    mockDb.hiddenChats.find(c => c.id === chatId);
  if (!chat) {
    throw new Error('Conversa não encontrada');
  }
  return {...chat};
}

async function getMessages(chatId: string): Promise<MessageAPI[]> {
  await delay(300);
  return [...(mockDb.threads[chatId] ?? [])];
}

async function sendMessage(
  chatId: string,
  params: {
    text?: string;
    audio?: {uri: string; duration: number};
    image?: {uri: string};
    reply_to?: MessageReplyAPI;
    forwarded_from?: MessageForwardAPI;
  },
): Promise<MessageAPI> {
  await delay(200);
  const base = {
    id: nextMessageId(),
    is_mine: true,
    time: 'agora',
    ticks: 'sent' as const,
    reply_to: params.reply_to,
    forwarded_from: params.forwarded_from,
  };
  const message: MessageAPI = params.audio
    ? {
        ...base,
        kind: 'audio',
        text: '',
        audio_uri: params.audio.uri,
        audio_duration: params.audio.duration,
      }
    : params.image
      ? {...base, kind: 'image', text: '', image_uri: params.image.uri}
      : {...base, kind: 'text', text: params.text ?? ''};
  mockDb.threads[chatId] = [...(mockDb.threads[chatId] ?? []), message];

  const preview = params.audio
    ? '🎤 Mensagem de voz'
    : params.image
      ? '📷 Foto'
      : message.text;
  const chat = mockDb.chats.find(c => c.id === chatId);
  if (chat) {
    chat.last_message = preview;
    chat.last_message_time = 'agora';
    mockDb.chats = [chat, ...mockDb.chats.filter(c => c.id !== chatId)];
  } else {
    const hidden = mockDb.hiddenChats.find(c => c.id === chatId);
    if (hidden) {
      hidden.last_message = preview;
      hidden.last_message_time = 'agora';
    }
  }
  return message;
}

function findMessage(chatId: string, messageId: string): MessageAPI {
  const message = (mockDb.threads[chatId] ?? []).find(m => m.id === messageId);
  if (!message) {
    throw new Error('Mensagem não encontrada');
  }
  return message;
}

function previewOf(message: MessageAPI): string {
  if (message.kind === 'audio') {
    return '🎤 Mensagem de voz';
  }
  if (message.kind === 'image') {
    return '📷 Foto';
  }
  return message.text;
}

/**
 * Alterna a MINHA reação na mensagem: mesmo emoji remove; emoji diferente
 * troca (só uma reação minha por mensagem, como no WhatsApp).
 */
async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
): Promise<void> {
  await delay(120);
  const message = findMessage(chatId, messageId);
  const reactions = message.reactions ?? [];

  const removedMine = reactions
    .map(r =>
      r.reacted_by_me ? {...r, count: r.count - 1, reacted_by_me: false} : r,
    )
    .filter(r => r.count > 0);

  const hadMineOnSameEmoji = reactions.some(
    r => r.emoji === emoji && r.reacted_by_me,
  );
  if (hadMineOnSameEmoji) {
    message.reactions = removedMine.length > 0 ? removedMine : undefined;
    return;
  }

  const existing = removedMine.find(r => r.emoji === emoji);
  message.reactions = existing
    ? removedMine.map(r =>
        r.emoji === emoji ? {...r, count: r.count + 1, reacted_by_me: true} : r,
      )
    : [...removedMine, {emoji, count: 1, reacted_by_me: true}];
}

async function toggleStarred(
  chatId: string,
  messageId: string,
): Promise<void> {
  await delay(120);
  const message = findMessage(chatId, messageId);
  message.is_starred = !message.is_starred;
}

async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  await delay(150);
  findMessage(chatId, messageId);
  const thread = (mockDb.threads[chatId] ?? []).filter(m => m.id !== messageId);
  mockDb.threads[chatId] = thread;

  // se a apagada era a última, o preview da conversa reflete a nova última
  const chat =
    mockDb.chats.find(c => c.id === chatId) ??
    mockDb.hiddenChats.find(c => c.id === chatId);
  if (chat) {
    const last = [...thread].reverse().find(m => m.kind !== 'system');
    chat.last_message = last ? previewOf(last) : '';
  }
}

async function markAsRead(chatId: string): Promise<void> {
  const chat =
    mockDb.chats.find(c => c.id === chatId) ??
    mockDb.hiddenChats.find(c => c.id === chatId);
  if (chat) {
    chat.unread_count = 0;
  }
}

async function setMuted(chatId: string, muted: boolean): Promise<void> {
  await delay(150);
  const chat =
    mockDb.chats.find(c => c.id === chatId) ??
    mockDb.hiddenChats.find(c => c.id === chatId);
  if (!chat) {
    throw new Error('Conversa não encontrada');
  }
  chat.is_muted = muted;
}

async function deleteChat(chatId: string): Promise<void> {
  await delay(200);
  const exists =
    mockDb.chats.some(c => c.id === chatId) ||
    mockDb.hiddenChats.some(c => c.id === chatId);
  if (!exists) {
    throw new Error('Conversa não encontrada');
  }
  mockDb.chats = mockDb.chats.filter(c => c.id !== chatId);
  mockDb.hiddenChats = mockDb.hiddenChats.filter(c => c.id !== chatId);
  delete mockDb.threads[chatId];
}

async function startDm(user: UserAPI): Promise<ChatAPI> {
  await delay(250);
  const chatId = `dm-${user.id}`;
  const existing = mockDb.chats.find(c => c.id === chatId);
  if (existing) {
    return {...existing};
  }
  const chat: ChatAPI = {
    id: chatId,
    type: 'dm',
    name: user.full_name,
    initials: user.full_name
      .trim()
      .split(/\s+/)
      .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ''))
      .join('')
      .toUpperCase(),
    avatar_color: user.avatar_color,
    last_message: 'Toque para conversar',
    last_message_time: 'agora',
    unread_count: 0,
    is_muted: false,
    context: null,
    is_online: user.is_online,
  };
  mockDb.chats = [chat, ...mockDb.chats];
  mockDb.threads[chatId] = [];
  return {...chat};
}

export const chatApi = {
  getChats,
  getChatById,
  getMessages,
  sendMessage,
  toggleReaction,
  toggleStarred,
  deleteMessage,
  markAsRead,
  setMuted,
  deleteChat,
  startDm,
};

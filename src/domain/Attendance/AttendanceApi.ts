import {delay} from '@utils';

import {ChatAPI} from '../Chat';
import {attendanceMockDb} from './AttendanceApiMockDb';
import {ChannelAPI, ChannelQueuesAPI, QueueItemAPI} from './AttendanceTypes';
import {mockDb as chatMockDb, nextMessageId} from '../Chat/ChatApiMockDb';

/**
 * MOCK stateful — filas de atendimento. Assumir/abrir/resolver mutam
 * também o mock de Chat (a conversa de atendimento É um chat).
 */

function channelBase(channelId: string) {
  const channel = attendanceMockDb.channels.find(c => c.id === channelId);
  if (!channel) {
    throw new Error('Canal não encontrado');
  }
  return channel;
}

function buildAttendanceChat(
  channelId: string,
  item: QueueItemAPI,
  chatId: string,
  status: 'atendimento' | 'resolvida',
  assignedTo?: string,
): ChatAPI {
  const channel = channelBase(channelId);
  return {
    id: chatId,
    type: 'attendance',
    name: item.name,
    initials: item.initials,
    avatar_color: item.avatar_color,
    last_message: item.preview,
    last_message_time: item.time,
    unread_count: 0,
    is_muted: false,
    context: `${channel.name} · ${channel.product}`,
    product: channel.product,
    status,
    assigned_to: assignedTo,
  };
}

function ensureThread(chatId: string, item: QueueItemAPI, assignedTo?: string) {
  if (chatMockDb.threads[chatId]) {
    return;
  }
  const thread = [];
  if (assignedTo) {
    thread.push({
      id: nextMessageId(),
      kind: 'system' as const,
      text: `Conversa assumida por ${assignedTo}`,
      is_mine: false,
      time: '',
    });
  }
  thread.push({
    id: nextMessageId(),
    kind: 'text' as const,
    text: item.preview,
    is_mine: false,
    author_name: item.name,
    author_color: item.avatar_color,
    time: item.time,
  });
  chatMockDb.threads[chatId] = thread;
}

async function getChannels(): Promise<ChannelAPI[]> {
  await delay(400);
  return attendanceMockDb.channels.map(channel => ({
    ...channel,
    waiting_count: attendanceMockDb.queues[channel.id].aguardando.length,
  }));
}

async function getChannelById(channelId: string): Promise<ChannelAPI> {
  await delay(150);
  const channel = channelBase(channelId);
  return {
    ...channel,
    waiting_count: attendanceMockDb.queues[channelId].aguardando.length,
  };
}

async function getQueues(channelId: string): Promise<ChannelQueuesAPI> {
  await delay(300);
  const queues = attendanceMockDb.queues[channelId];
  if (!queues) {
    throw new Error('Canal não encontrado');
  }
  return {
    aguardando: [...queues.aguardando],
    atendimento: [...queues.atendimento],
    resolvidas: [...queues.resolvidas],
  };
}

/** Assume uma conversa aguardando → vira chat de atendimento "Assumida por Você". */
async function assume(channelId: string, itemId: string): Promise<string> {
  await delay(250);
  const queues = attendanceMockDb.queues[channelId];
  const item = queues.aguardando.find(i => i.id === itemId);
  if (!item) {
    throw new Error('Conversa não está mais aguardando');
  }
  const chatId = itemId.startsWith('att-') ? itemId : `att-${itemId}`;

  queues.aguardando = queues.aguardando.filter(i => i.id !== itemId);
  queues.atendimento = [
    {...item, id: chatId, assigned_to: 'Você'},
    ...queues.atendimento,
  ];

  // regra: atendimento NÃO entra na lista de Chats — fica só nas filas
  const chat = buildAttendanceChat(channelId, item, chatId, 'atendimento', 'Você');
  chatMockDb.chats = chatMockDb.chats.filter(c => c.id !== chatId);
  chatMockDb.hiddenChats = [
    chat,
    ...chatMockDb.hiddenChats.filter(c => c.id !== chatId),
  ];
  if (!chatMockDb.threads[chatId]) {
    chatMockDb.threads[chatId] = [
      {id: nextMessageId(), kind: 'system', text: 'Conversa assumida por Você', is_mine: false, time: ''},
      {id: nextMessageId(), kind: 'text', text: item.preview, is_mine: false, author_name: item.name, author_color: item.avatar_color, time: item.time},
    ];
  }
  return chatId;
}

/** Garante que um item de fila (em atendimento/resolvida) exista como chat abrível. */
async function openQueueItem(
  channelId: string,
  itemId: string,
): Promise<string> {
  await delay(150);
  const queues = attendanceMockDb.queues[channelId];
  const inAttendance = queues.atendimento.find(i => i.id === itemId);
  const inResolved = queues.resolvidas.find(i => i.id === itemId);
  const item = inAttendance ?? inResolved;
  if (!item) {
    throw new Error('Conversa não encontrada na fila');
  }

  const exists =
    chatMockDb.chats.some(c => c.id === itemId) ||
    chatMockDb.hiddenChats.some(c => c.id === itemId);
  if (!exists) {
    const chat = buildAttendanceChat(
      channelId,
      item,
      itemId,
      inResolved ? 'resolvida' : 'atendimento',
      item.assigned_to,
    );
    chatMockDb.hiddenChats = [...chatMockDb.hiddenChats, chat];
  }
  ensureThread(itemId, item, item.assigned_to);
  return itemId;
}

/** Marca uma conversa de atendimento como resolvida. */
async function resolve(chatId: string): Promise<void> {
  await delay(250);
  const chat =
    chatMockDb.chats.find(c => c.id === chatId) ??
    chatMockDb.hiddenChats.find(c => c.id === chatId);
  if (chat) {
    chat.status = 'resolvida';
    chat.assigned_to = chat.assigned_to ?? 'Você';
  }
  chatMockDb.threads[chatId] = [
    ...(chatMockDb.threads[chatId] ?? []),
    {id: nextMessageId(), kind: 'system', text: 'Conversa marcada como resolvida por Você', is_mine: false, time: ''},
  ];

  Object.values(attendanceMockDb.queues).forEach(queues => {
    const item = queues.atendimento.find(i => i.id === chatId);
    if (item) {
      queues.atendimento = queues.atendimento.filter(i => i.id !== chatId);
      queues.resolvidas = [{...item, assigned_to: 'Você'}, ...queues.resolvidas];
    }
  });
}

export const attendanceApi = {
  getChannels,
  getChannelById,
  getQueues,
  assume,
  openQueueItem,
  resolve,
};

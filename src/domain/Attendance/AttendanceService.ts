import {attendanceAdapter} from './AttendanceAdapter';
import {attendanceApi} from './AttendanceApi';
import {
  AssumeParams,
  Channel,
  ChannelQueues,
  OpenQueueItemParams,
} from './AttendanceTypes';

async function getChannels(): Promise<Channel[]> {
  const channels = await attendanceApi.getChannels();
  return channels.map(attendanceAdapter.toChannel);
}

async function getChannelById(channelId: string): Promise<Channel> {
  const channel = await attendanceApi.getChannelById(channelId);
  return attendanceAdapter.toChannel(channel);
}

async function getQueues(channelId: string): Promise<ChannelQueues> {
  const queues = await attendanceApi.getQueues(channelId);
  return attendanceAdapter.toChannelQueues(queues);
}

/** Devolve o chatId da conversa assumida. */
async function assume({channelId, itemId}: AssumeParams): Promise<string> {
  return attendanceApi.assume(channelId, itemId);
}

/** Devolve o chatId da conversa aberta a partir da fila. */
async function openQueueItem({
  channelId,
  itemId,
}: OpenQueueItemParams): Promise<string> {
  return attendanceApi.openQueueItem(channelId, itemId);
}

async function resolve(chatId: string): Promise<void> {
  await attendanceApi.resolve(chatId);
}

export const attendanceService = {
  getChannels,
  getChannelById,
  getQueues,
  assume,
  openQueueItem,
  resolve,
};

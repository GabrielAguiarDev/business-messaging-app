import {
  Channel,
  ChannelAPI,
  ChannelQueues,
  ChannelQueuesAPI,
  QueueItem,
  QueueItemAPI,
} from './AttendanceTypes';

function toChannel(channelAPI: ChannelAPI): Channel {
  return {
    id: channelAPI.id,
    name: channelAPI.name,
    initials: channelAPI.initials,
    avatarColor: channelAPI.avatar_color,
    avatarUrl: channelAPI.avatar_url,
    product: channelAPI.product,
    waitingCount: channelAPI.waiting_count,
  };
}

function toQueueItem(itemAPI: QueueItemAPI): QueueItem {
  return {
    id: itemAPI.id,
    name: itemAPI.name,
    initials: itemAPI.initials,
    avatarColor: itemAPI.avatar_color,
    avatarUrl: itemAPI.avatar_url,
    preview: itemAPI.preview,
    time: itemAPI.time,
    assignedTo: itemAPI.assigned_to,
  };
}

function toChannelQueues(queuesAPI: ChannelQueuesAPI): ChannelQueues {
  return {
    aguardando: queuesAPI.aguardando.map(toQueueItem),
    atendimento: queuesAPI.atendimento.map(toQueueItem),
    resolvidas: queuesAPI.resolvidas.map(toQueueItem),
  };
}

export const attendanceAdapter = {toChannel, toQueueItem, toChannelQueues};

// ── Formato do backend (contrato provisório) ──────────────────────
export interface ChannelAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  /** Foto do canal — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  product: string;
  waiting_count: number;
}

export interface QueueItemAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  /** Foto do cliente — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  preview: string;
  time: string;
  assigned_to?: string;
}

export interface ChannelQueuesAPI {
  aguardando: QueueItemAPI[];
  atendimento: QueueItemAPI[];
  resolvidas: QueueItemAPI[];
}

// ── Domínio ───────────────────────────────────────────────────────
export interface Channel {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  /** Foto do canal — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  product: string;
  waitingCount: number;
}

export interface QueueItem {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  /** Foto do cliente — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  preview: string;
  time: string;
  assignedTo?: string;
}

export interface ChannelQueues {
  aguardando: QueueItem[];
  atendimento: QueueItem[];
  resolvidas: QueueItem[];
}

/** Nome das filas (a fila "resolvidas" agrupa conversas com status 'resolvida') */
export type QueueTab = keyof ChannelQueues;

export interface AssumeParams {
  channelId: string;
  itemId: string;
}

export interface OpenQueueItemParams {
  channelId: string;
  itemId: string;
}

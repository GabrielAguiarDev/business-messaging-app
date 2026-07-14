export type ChatType = 'dm' | 'group' | 'attendance';
export type AttendanceStatus = 'aguardando' | 'atendimento' | 'resolvida';
export type MessageTicks = 'sent' | 'read';
export type MessageKind = 'system' | 'text' | 'audio' | 'image';

// ── Formato do backend (contrato provisório) ──────────────────────
export interface ChatAPI {
  id: string;
  type: ChatType;
  name: string;
  initials: string;
  avatar_color: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_muted: boolean;
  context: string | null;
  is_online?: boolean;
  product?: string;
  status?: AttendanceStatus;
  assigned_to?: string;
}

export interface MessageAPI {
  id: string;
  kind: MessageKind;
  text: string;
  is_mine: boolean;
  author_name?: string;
  author_color?: string;
  time: string;
  ticks?: MessageTicks;
  /** Só para kind 'audio': uri local do arquivo gravado (sem backend real, ver ChatApi). */
  audio_uri?: string;
  /** Só para kind 'audio': duração em segundos. */
  audio_duration?: number;
  /** Só para kind 'image': uri local da foto capturada (sem backend real, ver ChatApi). */
  image_uri?: string;
}

// ── Domínio ───────────────────────────────────────────────────────
export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  muted: boolean;
  /** Ex.: "Yago Colaborador" (grupo) ou "Yago · App do Hóspede" (atendimento) */
  context: string | null;
  online?: boolean;
  product?: string;
  status?: AttendanceStatus;
  assignedTo?: string;
}

export interface Message {
  id: string;
  kind: MessageKind;
  text: string;
  isMine: boolean;
  author?: {name: string; color: string};
  time: string;
  ticks?: MessageTicks;
  audioUri?: string;
  audioDuration?: number;
  imageUri?: string;
}

export interface SendMessageParams {
  chatId: string;
  text?: string;
  /** Presente quando a mensagem é um áudio gravado (composer) em vez de texto. */
  audio?: {uri: string; duration: number};
  /** Presente quando a mensagem é uma foto tirada na hora (composer/câmera) em vez de texto. */
  image?: {uri: string};
}

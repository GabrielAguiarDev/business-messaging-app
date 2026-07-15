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

/** Referência a outra mensagem (responder deslizando, estilo WhatsApp). */
export interface MessageReplyAPI {
  message_id: string;
  author_name: string;
  /** Resumo pronto para exibição: texto da mensagem ou "🎤 Mensagem de voz"/"📷 Foto". */
  preview: string;
  kind: MessageKind;
}

/** Reação de emoji agrupada (long-press na mensagem, estilo WhatsApp). */
export interface MessageReactionAPI {
  emoji: string;
  count: number;
  /** true quando a minha reação está incluída no count. */
  reacted_by_me: boolean;
}

/**
 * Origem de uma mensagem encaminhada. Presente só quando a mensagem original
 * era de OUTRO usuário — encaminhar mensagem própria não carrega referência.
 */
export interface MessageForwardAPI {
  /** Nome do usuário que enviou a mensagem originalmente. */
  author_name: string;
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
  /** Reações de emoji agrupadas (long-press). */
  reactions?: MessageReactionAPI[];
  /** true quando a mensagem foi favoritada (ação "Favoritar" do menu). */
  is_starred?: boolean;
  /** Só para kind 'audio': uri local do arquivo gravado (sem backend real, ver ChatApi). */
  audio_uri?: string;
  /** Só para kind 'audio': duração em segundos. */
  audio_duration?: number;
  /** Só para kind 'image': uri local da foto capturada (sem backend real, ver ChatApi). */
  image_uri?: string;
  /** Presente quando esta mensagem é uma resposta a outra. */
  reply_to?: MessageReplyAPI;
  /** Presente quando esta mensagem foi encaminhada de outro usuário. */
  forwarded_from?: MessageForwardAPI;
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

/** Referência a outra mensagem (responder deslizando, estilo WhatsApp). */
export interface MessageReply {
  messageId: string;
  authorName: string;
  /** Resumo pronto para exibição: texto da mensagem ou "🎤 Mensagem de voz"/"📷 Foto". */
  preview: string;
  kind: MessageKind;
}

/** Reação de emoji agrupada (long-press na mensagem, estilo WhatsApp). */
export interface MessageReaction {
  emoji: string;
  count: number;
  /** true quando a minha reação está incluída no count. */
  reactedByMe: boolean;
}

/**
 * Origem de uma mensagem encaminhada. Presente só quando a mensagem original
 * era de OUTRO usuário — encaminhar mensagem própria não carrega referência.
 */
export interface MessageForward {
  /** Nome do usuário que enviou a mensagem originalmente. */
  authorName: string;
}

export interface Message {
  id: string;
  kind: MessageKind;
  text: string;
  isMine: boolean;
  author?: {name: string; color: string};
  time: string;
  ticks?: MessageTicks;
  /** Reações de emoji agrupadas (long-press). */
  reactions?: MessageReaction[];
  /** true quando a mensagem foi favoritada (ação "Favoritar" do menu). */
  starred?: boolean;
  audioUri?: string;
  audioDuration?: number;
  imageUri?: string;
  /** Presente quando esta mensagem é uma resposta a outra. */
  replyTo?: MessageReply;
  /** Presente quando esta mensagem foi encaminhada de outro usuário. */
  forwardedFrom?: MessageForward;
}

export interface SendMessageParams {
  chatId: string;
  text?: string;
  /** Presente quando a mensagem é um áudio gravado (composer) em vez de texto. */
  audio?: {uri: string; duration: number};
  /** Presente quando a mensagem é uma foto tirada na hora (composer/câmera) em vez de texto. */
  image?: {uri: string};
  /** Presente quando a mensagem responde outra (swipe-to-reply). */
  replyTo?: MessageReply;
  /** Presente quando a mensagem está sendo encaminhada de outro usuário. */
  forward?: MessageForward;
}

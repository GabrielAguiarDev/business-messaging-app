// ── Formato do backend (contrato provisório) ──────────────────────
export interface ModuleAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  /** Foto do módulo — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  unread_count: number;
}

export interface AnnouncementAPI {
  last_message: string;
  date: string;
}

export interface ModuleGroupAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  /** Foto do grupo — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  last_message: string;
  time: string;
  unread_count: number;
  is_muted: boolean;
}

export interface JoinableGroupAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  /** Foto do grupo — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  members_count: number;
}

export interface ModuleContentAPI {
  announcement: AnnouncementAPI;
  my_groups: ModuleGroupAPI[];
  joinable_groups: JoinableGroupAPI[];
}

// ── Domínio ───────────────────────────────────────────────────────
export interface Module {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  /** Foto do módulo — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  unreadCount: number;
}

export interface Announcement {
  lastMessage: string;
  date: string;
}

export interface ModuleGroup {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  /** Foto do grupo — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  muted: boolean;
}

export interface JoinableGroup {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  /** Foto do grupo — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  membersCount: number;
}

export interface ModuleContent {
  announcement: Announcement;
  myGroups: ModuleGroup[];
  joinableGroups: JoinableGroup[];
}

// ── Formato do backend (contrato provisório) ──────────────────────
export interface UserAPI {
  id: string;
  full_name: string;
  role: string;
  department: string;
  email: string;
  avatar_color: string;
  /** Foto do usuário — ausente quando o avatar é só iniciais. */
  avatar_url?: string;
  is_admin: boolean;
  is_online: boolean;
}

// ── Domínio ───────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  initials: string;
  avatarColor: string;
  /** Foto do usuário — ausente quando o avatar é só iniciais. */
  avatarUrl?: string;
  isAdmin: boolean;
  online: boolean;
}

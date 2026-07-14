import {User, UserAPI} from '../User';

// ── Formato do backend (contrato provisório — sem backend ainda) ──
export interface AuthCredentialsAPI {
  token: string;
  user: UserAPI;
}

// ── Domínio ───────────────────────────────────────────────────────
export interface AuthCredentials {
  token: string;
  user: User;
}

export interface SignInParams {
  email: string;
  password: string;
}

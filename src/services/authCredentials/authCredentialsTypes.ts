import {AuthCredentials} from '@domain';

export interface AuthCredentialsService {
  authCredentials: AuthCredentials | null;
  isLoading: boolean;
  saveCredentials: (credentials: AuthCredentials) => Promise<void>;
  removeCredentials: () => Promise<void>;
}

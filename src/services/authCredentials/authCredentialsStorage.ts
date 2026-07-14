import {AuthCredentials} from '@domain';

import {storage} from '../storage';

const AUTH_KEY = '@yMessage:authCredentials';

export const authCredentialsStorage = {
  get: (): AuthCredentials | null => storage.getItem<AuthCredentials>(AUTH_KEY),
  set: (credentials: AuthCredentials): void =>
    storage.setItem(AUTH_KEY, credentials),
  remove: (): void => storage.removeItem(AUTH_KEY),
};

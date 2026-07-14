import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {api} from '@api';
import {AuthCredentials} from '@domain';

import {authCredentialsStorage} from './authCredentialsStorage';
import {AuthCredentialsService} from './authCredentialsTypes';

const AuthCredentialsContext = createContext<AuthCredentialsService>({
  authCredentials: null,
  isLoading: true,
  saveCredentials: async () => {},
  removeCredentials: async () => {},
});

export function AuthCredentialsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authCredentials, setAuthCredentials] =
    useState<AuthCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // storage é síncrono (MMKV), mas mantemos a assinatura async p/ trocas futuras
    const credentials = authCredentialsStorage.get();
    if (credentials) {
      api.defaults.headers.common.Authorization = `Bearer ${credentials.token}`;
      setAuthCredentials(credentials);
    }
    setIsLoading(false);
  }, []);

  const saveCredentials = useCallback(
    async (credentials: AuthCredentials) => {
      api.defaults.headers.common.Authorization = `Bearer ${credentials.token}`;
      authCredentialsStorage.set(credentials);
      setAuthCredentials(credentials);
    },
    [],
  );

  const removeCredentials = useCallback(async () => {
    delete api.defaults.headers.common.Authorization;
    authCredentialsStorage.remove();
    setAuthCredentials(null);
  }, []);

  return (
    <AuthCredentialsContext.Provider
      value={{authCredentials, isLoading, saveCredentials, removeCredentials}}>
      {children}
    </AuthCredentialsContext.Provider>
  );
}

export function useAuthCredentials(): AuthCredentialsService {
  return useContext(AuthCredentialsContext);
}

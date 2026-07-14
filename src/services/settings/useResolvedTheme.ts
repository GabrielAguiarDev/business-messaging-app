import {useColorScheme} from 'react-native';

import {useSettingsStore} from './settingsService';

/** Tema efetivo: preferência manual do usuário > tema do sistema. */
export function useResolvedTheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore(state => state.themePreference);
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

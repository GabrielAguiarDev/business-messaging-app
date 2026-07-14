import {create} from 'zustand';

import {storage} from '../storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = '@yMessage:themePreference';
const PUSH_KEY = '@yMessage:pushEnabled';
const SOUND_KEY = '@yMessage:soundEnabled';

interface SettingsState {
  themePreference: ThemePreference;
  pushEnabled: boolean;
  soundEnabled: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  setPushEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  themePreference: storage.getItem<ThemePreference>(THEME_KEY) ?? 'system',
  pushEnabled: storage.getItem<boolean>(PUSH_KEY) ?? true,
  soundEnabled: storage.getItem<boolean>(SOUND_KEY) ?? false,
  setThemePreference: preference => {
    storage.setItem(THEME_KEY, preference);
    set({themePreference: preference});
  },
  setPushEnabled: enabled => {
    storage.setItem(PUSH_KEY, enabled);
    set({pushEnabled: enabled});
  },
  setSoundEnabled: enabled => {
    storage.setItem(SOUND_KEY, enabled);
    set({soundEnabled: enabled});
  },
}));

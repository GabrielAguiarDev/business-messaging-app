import {createMMKV} from 'react-native-mmkv';

import {Storage} from './storage';

const instance = createMMKV();

export const storage: Storage = {
  getItem<T>(key: string): T | null {
    const raw = instance.getString(key);
    if (raw === undefined) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setItem<T>(key: string, value: T): void {
    instance.set(key, JSON.stringify(value));
  },
  removeItem(key: string): void {
    instance.remove(key);
  },
};

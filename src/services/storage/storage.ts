/**
 * Abstração de storage — nenhuma camada acessa MMKV direto.
 * Trocar a implementação (ex.: AsyncStorage) não deve afetar consumidores.
 */
export interface Storage {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
}

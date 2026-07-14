/** Simula latência de rede nas APIs mockadas. */
export function delay(ms = 700): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

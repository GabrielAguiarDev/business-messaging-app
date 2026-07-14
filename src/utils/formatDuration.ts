/** Formata segundos como "m:ss" (ex.: 75 → "1:15"), padrão de player de áudio. */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

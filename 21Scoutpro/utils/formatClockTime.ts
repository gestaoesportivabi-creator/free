/**
 * Única formatação do cronômetro Scout 21.
 * Sempre mm:ss com zero à esquerda (00:00, 05:07).
 * Segundos fracionários são truncados. Valor inválido ou negativo vira 00:00.
 */
export function formatClockTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const clamped = Math.max(0, Math.floor(safe));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Minutos fracionários (entradas/saídas) no mesmo mm:ss. */
export function formatClockMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? minutes : 0;
  return formatClockTime(Math.round(Math.max(0, safe) * 60));
}

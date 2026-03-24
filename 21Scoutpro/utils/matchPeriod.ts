/**
 * Metade do jogo (futsal ~20+20) — valor técnico para log/API, sem UI de escolha.
 * Minuto absoluto 0–20 → 1T, 21+ → 2T (igual ao fluxo de confirmação de gol: minutes > 20).
 */
export type MatchHalf = '1T' | '2T';

export function deriveHalfFromAbsoluteMinute(min: number): MatchHalf {
  if (!Number.isFinite(min) || min < 0) return '1T';
  return min < 21 ? '1T' : '2T';
}

export function deriveHalfFromAbsoluteSeconds(totalSeconds: number): MatchHalf {
  const m = Math.floor(totalSeconds / 60);
  return deriveHalfFromAbsoluteMinute(m);
}

/** Segundos absolutos do jogo (0…~40 min) a partir do par armazenado no evento. */
export function storedToAbsoluteSeconds(period: MatchHalf, timeSeconds: number): number {
  return period === '1T' ? timeSeconds : 21 * 60 + timeSeconds;
}

/** Converte instante absoluto no par period + tempo relativo ao cronômetro da metade. */
export function absoluteSecondsToStored(absoluteSec: number): { period: MatchHalf; time: number } {
  const clamped = Math.max(0, absoluteSec);
  const period = deriveHalfFromAbsoluteSeconds(clamped);
  const time = period === '1T' ? clamped : clamped - 21 * 60;
  return { period, time: Math.max(0, time) };
}

/**
 * Duração máxima de uma metade no relógio da coleta (20:00), em segundos.
 * Valores MM:SS com total **estritamente maior** que isso no campo `time` do PostMatchEvent
 * indicam legado da planilha onde o usuário digitou o relógio absoluto (0–40 min) no mesmo campo.
 */
export const HALF_RELATIVE_MAX_SECONDS = 20 * 60;

/**
 * Interpreta string "MM:SS" ou "M:SS" de `PostMatchEvent.time` (remove sufixo legado " (1T)" opcional).
 */
export function parsePostMatchTimeStringToSeconds(timeStr: string): number {
  const trimmed = timeStr.trim().replace(/\s*\([12]T\)\s*$/i, '');
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const m = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!Number.isNaN(m) && !Number.isNaN(sec) && m >= 0 && sec >= 0 && sec <= 59) {
      return m * 60 + sec;
    }
  }
  return 0;
}

/**
 * Segundo absoluto do jogo (eixo comum 0…~40 min) a partir de `PostMatchEvent.time` + `period`.
 * Compatível com dados antigos da planilha (minuto absoluto gravado em `time`).
 */
export function postMatchEventClockToAbsoluteSeconds(timeStr: string, period: MatchHalf): number {
  const parsedSec = parsePostMatchTimeStringToSeconds(timeStr);
  if (parsedSec > HALF_RELATIVE_MAX_SECONDS) {
    const { period: p, time: t } = absoluteSecondsToStored(parsedSec);
    return storedToAbsoluteSeconds(p, t);
  }
  return storedToAbsoluteSeconds(period, parsedSec);
}

/** Normaliza par time+period do log pós-jogo para o formato canônico da coleta (meia relativa + period). */
export function canonicalizePostMatchEventClock(
  timeStr: string,
  period: MatchHalf
): { time: number; period: MatchHalf } {
  const abs = postMatchEventClockToAbsoluteSeconds(timeStr, period);
  return absoluteSecondsToStored(abs);
}

/**
 * Metade do jogo (futsal ~20+20) — valor técnico para log/API, sem UI de escolha.
 * Relógio absoluto: 1º tempo 0:00–19:59; 2º tempo 20:00–39:59.
 */
/** Último segundo relativo na 1ª metade (19:59 no relógio da 1ª parte). */
export const HALF_RELATIVE_LAST_SECOND_1T = 19 * 60 + 59;

/**
 * Último segundo relativo na 2ª metade (39:59 absoluto = 19:59 após o 20:00).
 */
export const HALF_RELATIVE_LAST_SECOND_2T = 19 * 60 + 59;

/** Instantâneo absoluto máximo do jogo (39:59). */
export const MATCH_ABSOLUTE_MAX_SECONDS = 39 * 60 + 59;

/** @deprecated usar HALF_RELATIVE_LAST_SECOND_1T — mantido para legado em time string > 20:00 */
export const HALF_RELATIVE_MAX_SECONDS = 20 * 60;

export type MatchHalf = '1T' | '2T';

export function deriveHalfFromAbsoluteMinute(min: number): MatchHalf {
  if (!Number.isFinite(min) || min < 0) return '1T';
  return min < 20 ? '1T' : '2T';
}

export function deriveHalfFromAbsoluteSeconds(totalSeconds: number): MatchHalf {
  const m = Math.floor(totalSeconds / 60);
  return deriveHalfFromAbsoluteMinute(m);
}

/** Segundos absolutos do jogo a partir do par armazenado no evento. */
export function storedToAbsoluteSeconds(period: MatchHalf, timeSeconds: number): number {
  const rel = Math.max(
    0,
    period === '1T'
      ? Math.min(timeSeconds, HALF_RELATIVE_LAST_SECOND_1T)
      : Math.min(timeSeconds, HALF_RELATIVE_LAST_SECOND_2T)
  );
  return period === '1T' ? rel : 20 * 60 + rel;
}

/** Converte instante absoluto no par period + tempo relativo ao cronômetro da metade. */
export function absoluteSecondsToStored(absoluteSec: number): { period: MatchHalf; time: number } {
  const clamped = Math.max(0, Math.min(absoluteSec, MATCH_ABSOLUTE_MAX_SECONDS));
  const period = deriveHalfFromAbsoluteSeconds(clamped);
  const time = period === '1T' ? clamped : clamped - 20 * 60;
  return { period, time: Math.max(0, time) };
}

/**
 * Valores MM:SS com total **estritamente maior** que 20:00 no campo relativo à metade
 * indicam legado da planilha (minuto absoluto no mesmo campo).
 */

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

/**
 * Até 4 dígitos como relógio MM:SS da metade (esquerda → direita), ex.: "1856" → 18 min 56 s.
 * Com 1–2 dígitos interpreta só minutos; com 3–4, MM + SS (segundo par com pad à direita: "185" → 18:50).
 */
export function parseGoalTimeDigits(digits: string): { mm: number; ss: number } {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (!d) return { mm: 0, ss: 0 };
  if (d.length <= 2) {
    const mm = parseInt(d, 10);
    return { mm: Number.isNaN(mm) ? 0 : mm, ss: 0 };
  }
  const mm = parseInt(d.slice(0, 2), 10);
  let ss = parseInt(d.slice(2).padEnd(2, '0'), 10);
  if (Number.isNaN(mm)) return { mm: 0, ss: 0 };
  if (Number.isNaN(ss)) ss = 0;
  ss = Math.min(59, ss);
  return { mm, ss };
}

/** Máscara visual MM:SS: ":" após o 2.º dígito (no 3.º caractere), ex.: "1856" → "18:56". */
export function formatGoalTimeDigitsMask(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Segundos relativos à metade a partir dos dígitos, limitado a `maxRel`. */
export function goalDigitsToRelativeSeconds(digits: string, maxRel: number): number {
  const { mm, ss } = parseGoalTimeDigits(digits);
  const rel = mm * 60 + ss;
  return Math.max(0, Math.min(rel, maxRel));
}

/** 2º tempo no UI do gol: dígitos como relógio absoluto 20:00–39:59 (MM:SS com MM em 20–39). */
export function parseGoalTimeDigitsSecondHalfAbsolute(digits: string): { mmAbs: number; ss: number } {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (!d) return { mmAbs: 20, ss: 0 };
  if (d.length <= 2) {
    const mmAbs = parseInt(d, 10);
    return { mmAbs: Number.isNaN(mmAbs) ? 20 : mmAbs, ss: 0 };
  }
  const mmAbs = parseInt(d.slice(0, 2), 10);
  let ss = parseInt(d.slice(2).padEnd(2, '0'), 10);
  if (Number.isNaN(mmAbs)) return { mmAbs: 20, ss: 0 };
  if (Number.isNaN(ss)) ss = 0;
  ss = Math.min(59, ss);
  return { mmAbs, ss };
}

/** Converte dígitos absolutos do 2º tempo em segundos relativos à metade (0…HALF_RELATIVE_LAST_SECOND_2T). */
export function goalAbsoluteDigitsToRelativeSecondsSecondHalf(digits: string): number {
  const { mmAbs, ss } = parseGoalTimeDigitsSecondHalfAbsolute(digits);
  const rel = mmAbs * 60 + ss - 20 * 60;
  return Math.max(0, Math.min(rel, HALF_RELATIVE_LAST_SECOND_2T));
}

export function goalAbsoluteDigitsToRelativeSecondsSecondHalfUnclamped(digits: string): number {
  const { mmAbs, ss } = parseGoalTimeDigitsSecondHalfAbsolute(digits);
  return mmAbs * 60 + ss - 20 * 60;
}

/** Dígitos absolutos MM:SS (20–39) a partir de segundos relativos ao 2º tempo. */
export function secondHalfRelativeToGoalDigits(rel: number): string {
  const capped = Math.max(0, Math.min(rel, HALF_RELATIVE_LAST_SECOND_2T));
  const abs = 20 * 60 + capped;
  const mm = Math.floor(abs / 60);
  const ss = abs % 60;
  return `${String(mm).padStart(2, '0')}${String(ss).padStart(2, '0')}`;
}

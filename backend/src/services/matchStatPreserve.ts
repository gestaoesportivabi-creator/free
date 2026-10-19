/**
 * Minutos, cartões e RPE no PUT de partida.
 * Número presente grava (0 inclusive). Campo ausente mantém a coluna já gravada.
 * Sem linha anterior, minutos caem em 40 (o que o create já gravava) e cartões em 0.
 * RPE ausente fica null. A coluna rpe_partida é inteira.
 */

export interface StoredMinutesCardsRpe {
  minutosJogados?: number | null;
  cartoesAmarelos?: number | null;
  cartoesVermelhos?: number | null;
  rpePartida?: number | null;
}

export interface MinutesCardsRpeColumns {
  minutosJogados: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  rpePartida: number | null;
}

const MINUTES_KEYS = ['minutesPlayed', 'minutosJogados'];
const YELLOW_KEYS = ['yellowCards', 'cartoesAmarelos'];
const RED_KEYS = ['redCards', 'cartoesVermelhos'];
const RPE_KEYS = ['rpeMatch', 'rpePartida', 'rpe'];

export function readFiniteNumber(source: unknown, keys: string[]): number | undefined {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function firstDefined(primary: number | undefined, fallback: number | undefined): number | undefined {
  return primary !== undefined ? primary : fallback;
}

function preserveNumber(incoming: number | undefined, existing: number | null | undefined, fallback: number): number {
  if (incoming !== undefined) return Math.max(0, Math.round(incoming));
  if (typeof existing === 'number' && Number.isFinite(existing)) return existing;
  return fallback;
}

function preserveRpe(incoming: number | undefined, existing: number | null | undefined): number | null {
  if (incoming !== undefined) return Math.round(incoming);
  if (typeof existing === 'number' && Number.isFinite(existing)) return existing;
  return null;
}

export function resolveMinutesCardsRpe(input: {
  stats?: unknown;
  /** Campos soltos no corpo do jogo, usados só nas estatísticas da equipe. */
  matchLevel?: unknown;
  existing?: StoredMinutesCardsRpe | null;
}): MinutesCardsRpeColumns {
  const minutes = firstDefined(
    readFiniteNumber(input.stats, MINUTES_KEYS),
    readFiniteNumber(input.matchLevel, MINUTES_KEYS)
  );
  const yellow = firstDefined(
    readFiniteNumber(input.stats, YELLOW_KEYS),
    readFiniteNumber(input.matchLevel, YELLOW_KEYS)
  );
  const red = firstDefined(
    readFiniteNumber(input.stats, RED_KEYS),
    readFiniteNumber(input.matchLevel, RED_KEYS)
  );
  const rpe = firstDefined(
    readFiniteNumber(input.stats, RPE_KEYS),
    readFiniteNumber(input.matchLevel, RPE_KEYS)
  );
  const existing = input.existing;
  return {
    minutosJogados: preserveNumber(minutes, existing?.minutosJogados, 40),
    cartoesAmarelos: preserveNumber(yellow, existing?.cartoesAmarelos, 0),
    cartoesVermelhos: preserveNumber(red, existing?.cartoesVermelhos, 0),
    rpePartida: preserveRpe(rpe, existing?.rpePartida),
  };
}

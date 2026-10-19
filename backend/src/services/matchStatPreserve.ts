/**
 * Colunas de estatística no PUT de partida.
 * Número presente grava (0 inclusive). Campo ausente mantém a coluna já gravada.
 * Sem linha anterior, vale o default de hoje: minutos 40, cartões 0, RPE null,
 * gols de jogo aberto / bola parada / sofridos do jogador 0.
 *
 * Cartão amarelo ou vermelho omitido é preservado. Quem exclui o único cartão
 * precisa enviar 0; a ausência da chave não zera a coluna.
 *
 * rpe_partida é inteiro. 7,4 grava 7 (Math.round).
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

const OPEN_PLAY_SCORED_KEYS = ['goalsScoredOpenPlay', 'golsMarcadosJogoAberto'];
const SET_PIECE_SCORED_KEYS = ['goalsScoredSetPiece', 'golsMarcadosBolaParada'];
const OPEN_PLAY_CONCEDED_KEYS = ['goalsConcededOpenPlay', 'golsSofridosJogoAberto'];
const SET_PIECE_CONCEDED_KEYS = ['goalsConcededSetPiece', 'golsSofridosBolaParada'];
/** Só no jogador. Na equipe, goalsConceded alimenta o placar (gols sofridos do time). */
const PLAYER_GOALS_CONCEDED_KEYS = ['goalsConceded', 'golsSofridos'];

export interface StoredGoalOrigin {
  golsMarcadosJogoAberto?: number | null;
  golsMarcadosBolaParada?: number | null;
  golsSofridosJogoAberto?: number | null;
  golsSofridosBolaParada?: number | null;
  golsSofridos?: number | null;
}

export interface GoalOriginColumns {
  golsMarcadosJogoAberto: number;
  golsMarcadosBolaParada: number;
  golsSofridosJogoAberto: number;
  golsSofridosBolaParada: number;
  golsSofridos: number;
}

function readCount(
  stats: unknown,
  matchLevel: unknown,
  keys: string[],
  existing: number | null | undefined
): number {
  return preserveNumber(
    firstDefined(readFiniteNumber(stats, keys), readFiniteNumber(matchLevel, keys)),
    existing,
    0
  );
}

/**
 * Gols de jogo aberto, de bola parada e sofridos do jogador.
 * playerGoalsConceded liga goalsConceded → golsSofridos. Na equipe esse campo
 * é o placar, então o caller deixa a flag desligada.
 */
export function resolveGoalOriginColumns(input: {
  stats?: unknown;
  matchLevel?: unknown;
  existing?: StoredGoalOrigin | null;
  playerGoalsConceded?: boolean;
}): GoalOriginColumns {
  const existing = input.existing;
  const conceded = input.playerGoalsConceded
    ? readCount(input.stats, input.matchLevel, PLAYER_GOALS_CONCEDED_KEYS, existing?.golsSofridos)
    : preserveNumber(undefined, existing?.golsSofridos, 0);
  return {
    golsMarcadosJogoAberto: readCount(
      input.stats,
      input.matchLevel,
      OPEN_PLAY_SCORED_KEYS,
      existing?.golsMarcadosJogoAberto
    ),
    golsMarcadosBolaParada: readCount(
      input.stats,
      input.matchLevel,
      SET_PIECE_SCORED_KEYS,
      existing?.golsMarcadosBolaParada
    ),
    golsSofridosJogoAberto: readCount(
      input.stats,
      input.matchLevel,
      OPEN_PLAY_CONCEDED_KEYS,
      existing?.golsSofridosJogoAberto
    ),
    golsSofridosBolaParada: readCount(
      input.stats,
      input.matchLevel,
      SET_PIECE_CONCEDED_KEYS,
      existing?.golsSofridosBolaParada
    ),
    golsSofridos: conceded,
  };
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

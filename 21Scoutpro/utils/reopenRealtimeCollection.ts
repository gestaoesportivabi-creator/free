import type { MatchRecord } from '../types';
import { isPersistedServerMatchId } from './matchIds';

export interface FixtureIdentity {
  date: string;
  opponent: string;
  competition?: string;
  /** Horário de início (HH:MM). Entra na chave; sem ele, só vincula se não houver outro jogo. */
  time?: string;
  /** Vínculo já gravado na agenda. Tem prioridade sobre data, adversário e hora. */
  jogoId?: string | null;
}

export interface CollectedMatchRef {
  id?: string;
  date?: string;
  opponent?: string;
  competition?: string;
  /** Horário de início, quando a coleta foi aberta a partir de um card com hora. */
  time?: string;
  kickoffTime?: string;
  status?: MatchRecord['status'];
  postMatchEventLog?: unknown[] | null;
  postMatchEventCount?: number;
  lineup?: {
    clockSnapshot?: unknown;
    selectedPlayerIds?: string[];
    players?: string[];
    kickoffTime?: string;
  } | null;
}

/** Data + adversário, sem somar hora e sem diferenciar maiúsculas. */
export function fixtureKey(date: string | undefined, opponent: string | undefined): string {
  const day = String(date || '').trim().slice(0, 10);
  const name = String(opponent || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!day || !name) return '';
  return `${day}_${name}`;
}

/** HH:MM. Vazio quando o card ou a coleta não tem horário. */
export function normalizeKickoffTime(value: string | undefined): string {
  if (!value) return '';
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return '';
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function readKickoffTime(match: {
  time?: string;
  kickoffTime?: string;
  lineup?: { kickoffTime?: string } | null;
}): string {
  return normalizeKickoffTime(match.kickoffTime || match.lineup?.kickoffTime || match.time);
}

function competitionBlocks(a?: string, b?: string): boolean {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  return Boolean(left && right && left !== right);
}

/** Mesma data, adversário e, se os dois tiverem, a mesma competição. A hora fica de fora. */
export function sameFixtureBase(
  a: { date?: string; opponent?: string; competition?: string },
  b: { date?: string; opponent?: string; competition?: string }
): boolean {
  const key = fixtureKey(a.date, a.opponent);
  if (!key || key !== fixtureKey(b.date, b.opponent)) return false;
  return !competitionBlocks(a.competition, b.competition);
}

/** Chave com horário, depois do filtro de data e adversário. Sem hora, `sem_hora`. */
export function fixtureDetailKey(match: {
  date?: string;
  opponent?: string;
  time?: string;
  kickoffTime?: string;
  lineup?: { kickoffTime?: string } | null;
}): string {
  const base = fixtureKey(match.date, match.opponent);
  if (!base) return '';
  return `${base}_${readKickoffTime(match) || 'sem_hora'}`;
}

/** Titulares ou convocados gravados. Não conta relógio nem fita. */
export function hasPersistedLineup(
  lineup: { players?: string[]; selectedPlayerIds?: string[] } | null | undefined
): boolean {
  const players = Array.isArray(lineup?.players)
    ? lineup.players.some((id) => String(id || '').trim())
    : false;
  const selected = Array.isArray(lineup?.selectedPlayerIds)
    ? lineup.selectedPlayerIds.some((id) => String(id || '').trim())
    : false;
  return players || selected;
}

export function collectedMatchScore(match: CollectedMatchRef | null | undefined): number {
  if (!match?.id || !isPersistedServerMatchId(String(match.id))) return 0;
  const count = Array.isArray(match.postMatchEventLog)
    ? match.postMatchEventLog.length
    : (match.postMatchEventCount ?? 0);
  const hasClock = Boolean(match.lineup && match.lineup.clockSnapshot);
  let score = 0;
  if (match.status === 'encerrado') score += 8;
  if (match.status === 'em_andamento') score += 4;
  if (count > 0) score += 2;
  if (hasClock) score += 1;
  if (hasPersistedLineup(match.lineup)) score += 1;
  return score;
}

/** A coleta já existe: eventos, relógio, escalação gravada, ou partida em andamento/encerrada. */
export function shouldResumeRealtimeCollection(match: CollectedMatchRef | null | undefined): boolean {
  return collectedMatchScore(match) > 0;
}

export interface FixtureLinkOptions {
  /**
   * Cards da agenda usados para contar ambiguidade (mesma data, adversário
   * e competição). Sem esta lista, hora diferente não cai no fallback.
   */
  scheduled?: Array<{ date?: string; opponent?: string; competition?: string; time?: string }>;
  /** Quantidade já contada de cards com a mesma base. 1 libera o fallback sem hora. */
  scheduledBaseCount?: number;
}

function scheduledPeerCount(fixture: FixtureIdentity, options?: FixtureLinkOptions): number | undefined {
  if (options?.scheduled) {
    return options.scheduled.filter((item) => sameFixtureBase(item, fixture)).length;
  }
  if (typeof options?.scheduledBaseCount === 'number') return options.scheduledBaseCount;
  return undefined;
}

/**
 * Partida salva que corresponde ao card.
 * 1. jogoId, quando existir.
 * 2. Data + adversário + competição + horário.
 * 3. Sem horário, só se houver um único card nessa base (proteção da main).
 * Dois resultados possíveis: não vincula.
 */
export function selectSavedForFixture<T extends CollectedMatchRef>(
  fixture: FixtureIdentity,
  matches: T[],
  options?: FixtureLinkOptions
): T | null {
  if (fixture.jogoId) {
    const byId = matches.find((match) => String(match.id || '') === String(fixture.jogoId));
    if (byId) return byId;
  }

  const pool = matches.filter((match) => sameFixtureBase(match, fixture));
  if (pool.length === 0) return null;

  const wanted = fixtureDetailKey(fixture);
  const exact = pool.filter((match) => fixtureDetailKey(match) === wanted);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    const collected = exact.filter((match) => collectedMatchScore(match) > 0);
    if (collected.length === 1) return collected[0];
    return null;
  }

  const peers = scheduledPeerCount(fixture, options);
  const fixtureHasTime = Boolean(readKickoffTime(fixture));
  const uniqueSchedule = peers === 1 || (peers === undefined && !fixtureHasTime && pool.length === 1);
  if (!uniqueSchedule) return null;
  if (pool.length === 1) return pool[0];
  const collected = pool.filter((match) => collectedMatchScore(match) > 0);
  const details = new Set(pool.map((match) => fixtureDetailKey(match)));
  if (collected.length === 1 && details.size === 1) return collected[0];
  return null;
}

/**
 * Acha a coleta já gravada. Card de agenda não entra como id de jogo.
 * Sem hora bastante para decidir, devolve null em vez da coleta do outro horário.
 */
export function findCollectedMatchForFixture<T extends CollectedMatchRef>(
  matches: T[],
  fixture: FixtureIdentity,
  options?: FixtureLinkOptions
): T | null {
  const linked = selectSavedForFixture(fixture, matches, options);
  if (!linked || collectedMatchScore(linked) <= 0) return null;
  return linked;
}

/** Card da agenda deste jogo. Ambíguo: não devolve o outro horário. */
export function findAgendaForFixture<T extends FixtureIdentity & { id?: string }>(
  fixture: FixtureIdentity,
  agendas: T[]
): T | null {
  const pool = agendas.filter((item) => sameFixtureBase(item, fixture));
  if (pool.length === 1) return pool[0];
  const wanted = fixtureDetailKey(fixture);
  const exact = pool.filter((item) => readKickoffTime(item) && fixtureDetailKey(item) === wanted);
  if (exact.length === 1) return exact[0];
  return null;
}

export interface RealtimeOpenResolution<T extends CollectedMatchRef> {
  /** Partida de jogo a hidratar. Null = começar coleta nova, sem reutilizar id de agenda. */
  match: T | null;
  /** O id pedido era de agenda/outro recurso: não gravar por cima dele. */
  ignoredForeignId: boolean;
}

/**
 * Decide qual coleta o scout ao vivo abre.
 * Partida encerrada, em andamento, com fita, com clockSnapshot ou com escalação gravada, reabre.
 * Id que não é um jogo (404 na agenda) não vira scout novo em 00:00 se já
 * existir coleta da mesma data, adversário e horário.
 */
export function resolveRealtimeOpenTarget<T extends CollectedMatchRef>(input: {
  requestedId?: string;
  fetched: T | null;
  catalog: T[];
  fixture: FixtureIdentity;
  scheduledBaseCount?: number;
}): RealtimeOpenResolution<T> {
  const requestedId = String(input.requestedId || '').trim();
  if (input.fetched && shouldResumeRealtimeCollection(input.fetched)) {
    return { match: input.fetched, ignoredForeignId: false };
  }

  const fromCatalog = findCollectedMatchForFixture(input.catalog, input.fixture, {
    scheduledBaseCount: input.scheduledBaseCount,
  });
  if (fromCatalog && (!input.fetched || String(fromCatalog.id) !== String(input.fetched.id))) {
    return {
      match: fromCatalog,
      ignoredForeignId: Boolean(requestedId) && String(fromCatalog.id) !== requestedId,
    };
  }

  if (input.fetched && isPersistedServerMatchId(String(input.fetched.id))) {
    return { match: input.fetched, ignoredForeignId: false };
  }

  return {
    match: null,
    ignoredForeignId: Boolean(requestedId),
  };
}

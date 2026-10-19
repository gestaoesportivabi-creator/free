import type { MatchClockSnapshot } from '../types';

const PERSISTED_CLOCK_STATES = new Set<MatchClockSnapshot['state']>([
  'PRE_JOGO',
  'PRIMEIRO_TEMPO',
  'PAUSADO',
  'SINCRONIZANDO',
  'INTERVALO',
  'SEGUNDO_TEMPO',
  'ENCERRADO',
]);

export interface LiveClockInput {
  currentTimeSeconds: number;
  period: '1T' | '2T';
  state: MatchClockSnapshot['state'];
  isRunning: boolean;
  firstHalfLocked: boolean;
}

export interface ReopenClockTarget {
  seconds: number;
  period: '1T' | '2T';
  firstHalfLocked: boolean;
  state: MatchClockSnapshot['state'];
  isRunning: false;
}

export interface RealtimeReopenClock {
  needsClockSyncFallback: boolean;
  clock: ReopenClockTarget;
}

export function normalizePersistedClockSnapshot(snapshot: unknown): MatchClockSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const candidate = snapshot as Partial<MatchClockSnapshot>;
  const rawSeconds = Number(candidate.currentTimeSeconds);
  const period = candidate.period;
  const state = candidate.state;

  if (!Number.isFinite(rawSeconds)) return null;
  if (period !== '1T' && period !== '2T') return null;
  if (typeof state !== 'string' || !PERSISTED_CLOCK_STATES.has(state as MatchClockSnapshot['state'])) {
    return null;
  }

  return {
    currentTimeSeconds: Math.max(0, Math.floor(rawSeconds)),
    period,
    state: state as MatchClockSnapshot['state'],
    isRunning: Boolean(candidate.isRunning),
    firstHalfLocked: Boolean(candidate.firstHalfLocked),
  };
}

/** Snapshot gravado na partida: relógio sempre pausado, sem inventar tempo. */
export function buildPersistedClockSnapshot(snapshot: LiveClockInput): MatchClockSnapshot {
  const nextState =
    snapshot.state === 'PRIMEIRO_TEMPO' ||
    snapshot.state === 'SEGUNDO_TEMPO' ||
    snapshot.state === 'SINCRONIZANDO'
      ? 'PAUSADO'
      : snapshot.state;

  return {
    currentTimeSeconds: snapshot.currentTimeSeconds,
    period: snapshot.period,
    state: nextState,
    isRunning: false,
    firstHalfLocked: snapshot.firstHalfLocked,
  };
}

/** Best-effort clock when lineup.clockSnapshot is missing but the event tape has times. */
export function inferClockFromMatchEvents(
  events: Array<{ time: number; period: '1T' | '2T' }>,
  collectionPhase: number | undefined
): MatchClockSnapshot | null {
  if (!events.length) return null;
  const has2T = events.some((e) => e.period === '2T');
  const period: '1T' | '2T' = collectionPhase === 2 || has2T ? '2T' : '1T';
  const inPeriod = events.filter((e) => e.period === period);
  const source = inPeriod.length > 0 ? inPeriod : events;
  let maxTime = 0;
  for (const e of source) {
    const t = Number(e.time);
    if (Number.isFinite(t) && t > maxTime) maxTime = t;
  }
  return {
    currentTimeSeconds: Math.max(0, Math.floor(maxTime)),
    period,
    state: 'PAUSADO',
    isRunning: false,
    firstHalfLocked: period === '2T',
  };
}

type LineupWithClock<T> = Omit<T, 'clockSnapshot'> & { clockSnapshot?: MatchClockSnapshot };

/**
 * Mescla o clock no lineup que será gravado.
 * Um snapshot novo e válido substitui o anterior.
 * Payload sem snapshot (ex.: save pós-jogo) preserva o que já estava na partida.
 */
export function mergeLineupClockSnapshot<T extends object>(
  nextLineup: T,
  existingLineup: object | null | undefined
): LineupWithClock<T> {
  const incomingClock = normalizePersistedClockSnapshot(
    (nextLineup as { clockSnapshot?: unknown }).clockSnapshot
  );
  if (incomingClock) {
    return { ...nextLineup, clockSnapshot: incomingClock };
  }

  const preserved = normalizePersistedClockSnapshot(
    existingLineup && 'clockSnapshot' in existingLineup
      ? (existingLineup as { clockSnapshot?: unknown }).clockSnapshot
      : undefined
  );
  if (preserved) {
    return { ...nextLineup, clockSnapshot: preserved };
  }

  if (!('clockSnapshot' in nextLineup)) {
    return { ...nextLineup };
  }

  const rest = { ...(nextLineup as T & { clockSnapshot?: unknown }) };
  delete rest.clockSnapshot;
  return rest as LineupWithClock<T>;
}

function pausedRestore(snapshot: MatchClockSnapshot): ReopenClockTarget {
  const state =
    snapshot.state === 'PRIMEIRO_TEMPO' ||
    snapshot.state === 'SEGUNDO_TEMPO' ||
    snapshot.state === 'SINCRONIZANDO'
      ? 'PAUSADO'
      : snapshot.state;

  return {
    seconds: snapshot.currentTimeSeconds,
    period: snapshot.period,
    firstHalfLocked: snapshot.firstHalfLocked,
    state,
    isRunning: false,
  };
}

/**
 * Decide o relógio ao reabrir coleta ao vivo.
 * Snapshot salvo tem prioridade; sem ele, infere da fita; senão, fallback de sincronização.
 */
export function resolveRealtimeReopenClock(input: {
  persistedClock: unknown;
  events: Array<{ time: number; period: '1T' | '2T' }>;
  hasLog: boolean;
  collectionPhase: number | undefined;
  inSecondHalf: boolean;
  hasPossessionProgress: boolean;
}): RealtimeReopenClock {
  const persisted = normalizePersistedClockSnapshot(input.persistedClock);
  const inferred =
    !persisted && input.hasLog
      ? inferClockFromMatchEvents(input.events, input.collectionPhase)
      : null;
  const clockToRestore = persisted ?? inferred;

  if (clockToRestore) {
    return { needsClockSyncFallback: false, clock: pausedRestore(clockToRestore) };
  }

  if (!input.hasLog && input.inSecondHalf) {
    return {
      needsClockSyncFallback: true,
      clock: { seconds: 0, period: '2T', firstHalfLocked: true, state: 'PAUSADO', isRunning: false },
    };
  }

  if (!input.hasLog && input.hasPossessionProgress) {
    return {
      needsClockSyncFallback: true,
      clock: { seconds: 0, period: '1T', firstHalfLocked: false, state: 'PAUSADO', isRunning: false },
    };
  }

  if (!input.hasLog && !input.inSecondHalf) {
    return {
      needsClockSyncFallback: false,
      clock: { seconds: 0, period: '1T', firstHalfLocked: false, state: 'PRE_JOGO', isRunning: false },
    };
  }

  return {
    needsClockSyncFallback: true,
    clock: {
      seconds: 0,
      period: input.inSecondHalf ? '2T' : '1T',
      firstHalfLocked: input.inSecondHalf,
      state: 'PAUSADO',
      isRunning: false,
    },
  };
}

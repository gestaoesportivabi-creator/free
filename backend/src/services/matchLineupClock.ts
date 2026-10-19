/**
 * Preserva lineup.clockSnapshot no update da partida.
 * O JSON de lineup é substituído por inteiro; um payload sem snapshot novo
 * (save pós-jogo, análise técnica parcial) não pode apagar o relógio do ao vivo.
 * A mescla usa só o lineup da partida já autorizada para o tenant — não consulta outro clube.
 * deletedEventIds (tombstones) sobrevivem a qualquer update: objeto sem a chave,
 * objeto que manda outros ids (união) e lineup null. Null sem tombstone continua
 * limpeza explícita do restante do JSON. undefined não inventa lineup.
 */

const PERSISTED_CLOCK_STATES = new Set([
  'PRE_JOGO',
  'PRIMEIRO_TEMPO',
  'PAUSADO',
  'SINCRONIZANDO',
  'INTERVALO',
  'SEGUNDO_TEMPO',
  'ENCERRADO',
]);

export interface MatchClockSnapshot {
  currentTimeSeconds: number;
  period: '1T' | '2T';
  state: string;
  isRunning: boolean;
  firstHalfLocked: boolean;
}

export function normalizePersistedClockSnapshot(snapshot: unknown): MatchClockSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return null;
  }

  const candidate = snapshot as Partial<MatchClockSnapshot>;
  const rawSeconds = Number(candidate.currentTimeSeconds);
  const period = candidate.period;
  const state = candidate.state;

  if (!Number.isFinite(rawSeconds)) return null;
  if (period !== '1T' && period !== '2T') return null;
  if (typeof state !== 'string' || !PERSISTED_CLOCK_STATES.has(state)) return null;

  return {
    currentTimeSeconds: Math.max(0, Math.floor(rawSeconds)),
    period,
    state,
    isRunning: Boolean(candidate.isRunning),
    firstHalfLocked: Boolean(candidate.firstHalfLocked),
  };
}

function deletedEventIdsOf(lineup: unknown): string[] {
  if (!lineup || typeof lineup !== 'object' || Array.isArray(lineup)) return [];
  const raw = (lineup as { deletedEventIds?: unknown }).deletedEventIds;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const id = String(item).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function attachDeletedEventIds(existingLineup: unknown, incoming: Record<string, unknown>): Record<string, unknown> {
  const ids = deletedEventIdsOf(existingLineup);
  const seen = new Set(ids);
  for (const id of deletedEventIdsOf(incoming)) {
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length === 0) {
    delete incoming.deletedEventIds;
    return incoming;
  }
  incoming.deletedEventIds = ids;
  return incoming;
}

export function mergeLineupPreservingClockSnapshot(
  existingLineup: unknown,
  incomingLineup: unknown
): unknown {
  if (incomingLineup === undefined) return undefined;
  if (incomingLineup === null) {
    const ids = deletedEventIdsOf(existingLineup);
    if (ids.length === 0) return null;
    return { deletedEventIds: ids };
  }
  if (typeof incomingLineup !== 'object' || Array.isArray(incomingLineup)) {
    return incomingLineup;
  }

  const incoming = { ...(incomingLineup as Record<string, unknown>) };
  keepPossessionSeconds(incoming, existingLineup);
  const incomingClock = normalizePersistedClockSnapshot(incoming.clockSnapshot);
  if (incomingClock) {
    incoming.clockSnapshot = incomingClock;
    return attachDeletedEventIds(existingLineup, incoming);
  }

  const existingClock =
    existingLineup && typeof existingLineup === 'object' && !Array.isArray(existingLineup)
      ? normalizePersistedClockSnapshot((existingLineup as { clockSnapshot?: unknown }).clockSnapshot)
      : null;

  if (existingClock) {
    incoming.clockSnapshot = existingClock;
    return attachDeletedEventIds(existingLineup, incoming);
  }

  if ('clockSnapshot' in incoming) {
    delete incoming.clockSnapshot;
  }
  return attachDeletedEventIds(existingLineup, incoming);
}

/** Save pós-jogo não reenvia a posse. Sem isto o JSON novo apaga os segundos. */
function keepPossessionSeconds(incoming: Record<string, unknown>, existingLineup: unknown): void {
  if (!existingLineup || typeof existingLineup !== 'object' || Array.isArray(existingLineup)) return;
  const prev = existingLineup as Record<string, unknown>;
  for (const key of ['possessionSecondsWith', 'possessionSecondsWithout']) {
    const current = Number(incoming[key]);
    if (Number.isFinite(current) && current >= 0) continue;
    const kept = Number(prev[key]);
    if (Number.isFinite(kept) && kept >= 0) incoming[key] = Math.floor(kept);
  }
  const nextKickoff = typeof incoming.kickoffTime === 'string' ? incoming.kickoffTime.trim() : '';
  const prevKickoff = typeof prev.kickoffTime === 'string' ? prev.kickoffTime.trim() : '';
  if (!nextKickoff && prevKickoff) incoming.kickoffTime = prevKickoff;
}

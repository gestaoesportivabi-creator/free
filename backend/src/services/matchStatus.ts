import { MatchRecord } from '../types/frontend';

const MATCH_STATUSES = ['disponivel', 'nao_executado', 'em_andamento', 'encerrado'] as const;

export function isValidMatchStatus(v: unknown): v is NonNullable<MatchRecord['status']> {
  return (MATCH_STATUSES as readonly string[]).includes(String(v));
}

function hasNonZeroCoreStats(match: MatchRecord): boolean {
  const t = match.teamStats;
  if (!t) return false;
  return (
    (t.goals ?? 0) > 0 ||
    (t.goalsConceded ?? 0) > 0 ||
    (t.assists ?? 0) > 0 ||
    (t.passesCorrect ?? 0) > 0 ||
    (t.passesWrong ?? 0) > 0 ||
    (t.shotsOnTarget ?? 0) > 0 ||
    (t.shotsOffTarget ?? 0) > 0 ||
    (t.tacklesWithBall ?? 0) > 0 ||
    (t.tacklesWithoutBall ?? 0) > 0 ||
    (t.tacklesCounterAttack ?? 0) > 0 ||
    (t.transitionErrors ?? 0) > 0 ||
    Object.keys(match.playerStats || {}).length > 0
  );
}

/**
 * Status lido do banco.
 * `encerrado` e `em_andamento` explícitos vencem a fase. A fase 2 do Finalizar
 * não reabre uma coleta cujo relógio já está ENCERRADO quando o status não
 * foi gravado. `em_andamento` explícito continua incompleto.
 */
export function inferStatusFromData(
  rawStatus: unknown,
  match: MatchRecord,
  jogo?: { collectionPhase?: number; postMatchEventLog?: unknown; postMatchEventCount?: number; lineup?: unknown }
): NonNullable<MatchRecord['status']> {
  if (rawStatus === 'encerrado' || rawStatus === 'em_andamento') return rawStatus;

  const phase = jogo?.collectionPhase;
  const hasEventLog =
    (typeof jogo?.postMatchEventCount === 'number' && jogo.postMatchEventCount > 0) ||
    (Array.isArray(jogo?.postMatchEventLog) && jogo.postMatchEventLog.length > 0) ||
    (Array.isArray(match.postMatchEventLog) && match.postMatchEventLog.length > 0);
  const lineup = (jogo?.lineup ?? match.lineup) as
    | { players?: unknown[]; selectedPlayerIds?: unknown[]; clockSnapshot?: { state?: string } }
    | undefined;
  const hasLineupDraft =
    (Array.isArray(lineup?.players) && lineup.players.length > 0) ||
    (Array.isArray(lineup?.selectedPlayerIds) && lineup.selectedPlayerIds.length > 0);
  const clockState = lineup?.clockSnapshot?.state;

  if (clockState === 'ENCERRADO' && hasEventLog) return 'encerrado';
  if (isValidMatchStatus(rawStatus)) return rawStatus;
  if (phase === 1 || phase === 2) return 'em_andamento';
  if (hasEventLog) return 'encerrado';
  if (hasNonZeroCoreStats(match)) return 'encerrado';
  if (phase === 0 || hasLineupDraft) return 'disponivel';
  return 'disponivel';
}

/**
 * Valor a persistir. `encerrado` não regride para `em_andamento`.
 * Não promove `em_andamento` só porque o relógio encerrou.
 */
export function statusToPersist(
  existingStatus: string | null | undefined,
  incomingStatus: unknown
): string | undefined {
  if (incomingStatus === undefined) return undefined;
  if (existingStatus === 'encerrado' && incomingStatus !== 'encerrado') return 'encerrado';
  if (incomingStatus === 'encerrado') return 'encerrado';
  if (isValidMatchStatus(incomingStatus)) return incomingStatus;
  return undefined;
}

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
 * Relógio ENCERRADO com fita não vira "em andamento" só porque collectionPhase
 * ficou em 2 (segundo tempo). Status explícito continua valendo.
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
    (Array.isArray(jogo?.postMatchEventLog) && jogo.postMatchEventLog.length > 0);
  const lineup = jogo?.lineup as
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
 * Gravação de status. Finalizar (`encerrado`) não é rebaixado por um
 * autosave atrasado com `em_andamento`.
 */
export function statusToPersist(
  existingStatus: string | null | undefined,
  incomingStatus: unknown,
  hints?: { clockState?: unknown; eventCount?: number }
): string | undefined {
  if (incomingStatus === undefined) return undefined;
  const finishedCollection = hints?.clockState === 'ENCERRADO' && (hints.eventCount ?? 0) > 0;
  if (incomingStatus === 'encerrado') return 'encerrado';
  // `disponivel` com relógio encerrado e fita não pode ficar na lista como futura.
  // `em_andamento` explícito espera o botão Finalizar (ou já perdeu para um encerrado).
  if (finishedCollection && incomingStatus !== 'em_andamento') return 'encerrado';
  if (existingStatus === 'encerrado') return 'encerrado';
  if (isValidMatchStatus(incomingStatus)) return incomingStatus;
  return undefined;
}

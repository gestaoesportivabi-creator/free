import type { MatchRecord } from '../types';

/** Partidas que entram nas estatísticas das abas Scout (só coleta encerrada). */
export function isMatchFinalizedForScout(m: MatchRecord): boolean {
  const s = m.status;
  if (s === 'encerrado') return true;
  if (s === 'em_andamento' || s === 'disponivel' || s === 'nao_executado') return false;
  return true;
}

/**
 * Autosave e "guardar incompleto" não rebaixam uma coleta já encerrada.
 * Partida que ainda está em andamento continua em andamento.
 */
export function statusForScoutSave(
  current: MatchRecord['status'] | undefined,
  requested: 'em_andamento' | 'encerrado'
): 'em_andamento' | 'encerrado' {
  if (current === 'encerrado') return 'encerrado';
  return requested;
}

/** O GET ou a listagem não substituem um encerrado já conhecido por em_andamento. */
export function preserveEncerradoStatus<T extends { status?: MatchRecord['status'] }>(
  previous: { status?: MatchRecord['status'] } | null | undefined,
  next: T
): T {
  if (previous?.status === 'encerrado' && next.status !== 'encerrado') {
    return { ...next, status: 'encerrado' };
  }
  return next;
}

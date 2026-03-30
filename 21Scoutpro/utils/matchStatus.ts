import type { MatchRecord } from '../types';

/** Partidas que entram nas estatísticas das abas Scout (só coleta encerrada). */
export function isMatchFinalizedForScout(m: MatchRecord): boolean {
  const s = m.status;
  if (s === 'encerrado') return true;
  if (s === 'em_andamento' || s === 'disponivel' || s === 'nao_executado') return false;
  return true;
}

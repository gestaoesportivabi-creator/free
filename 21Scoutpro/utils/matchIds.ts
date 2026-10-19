/**
 * Linha de `championship_matches` ainda não é um jogo em `matches`.
 * O prefixo `sched-` impede PUT no id cru da agenda.
 */
export function draftIdForChampionshipMatch(championshipMatchId: string): string {
  const raw = championshipMatchId.trim();
  if (raw.startsWith('sched-')) return raw;
  return `sched-${raw}`;
}

/** IDs locais de rascunho/agenda — não existem no servidor. */
export function isPersistedServerMatchId(id: string): boolean {
  const s = id.trim();
  if (s.length === 0) return false;
  if (s === 'undefined' || s === 'null') return false;
  if (s.startsWith('sched-') || s.startsWith('temp-')) return false;
  return true;
}

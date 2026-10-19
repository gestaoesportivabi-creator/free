/** IDs locais de rascunho/agenda — não existem no servidor. */
export function isPersistedServerMatchId(id: string): boolean {
  const s = id.trim();
  if (s.length === 0) return false;
  if (s === 'undefined' || s === 'null') return false;
  if (s.startsWith('sched-') || s.startsWith('temp-')) return false;
  return true;
}

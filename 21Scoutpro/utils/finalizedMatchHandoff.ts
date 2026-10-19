import type { MatchRecord } from '../types';

/** Outra aba escuta este sinal e recarrega a lista de jogos. */
export const MATCHES_DIRTY_KEY = 'scout21_matches_dirty';

const FINALIZED_MATCH_KEY = 'scout21_finalized_match_payload';

export function markMatchesDirty(): void {
  try {
    localStorage.setItem(MATCHES_DIRTY_KEY, String(Date.now()));
  } catch {
    /* ignore quota */
  }
}

/** Guarda a partida recém-finalizada para a mesma aba aplicar antes do GET. */
export function stashFinalizedMatch(match: MatchRecord): void {
  const id = String(match.id || '').trim();
  if (!id) return;
  try {
    sessionStorage.setItem(
      FINALIZED_MATCH_KEY,
      JSON.stringify({ ...match, id, status: 'encerrado' })
    );
  } catch {
    /* ignore quota */
  }
  markMatchesDirty();
}

export function consumeFinalizedMatch(): MatchRecord | null {
  try {
    const raw = sessionStorage.getItem(FINALIZED_MATCH_KEY);
    sessionStorage.removeItem(FINALIZED_MATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchRecord;
    if (!parsed?.id) return null;
    return { ...parsed, status: 'encerrado' };
  } catch {
    return null;
  }
}

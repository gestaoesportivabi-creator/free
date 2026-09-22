/** After realtime finalize: dashboard opens Dados do Jogo → analysis for this match id. */
export const OPEN_MATCH_ANALYSIS_KEY = 'scout21_open_match_analysis';

export function stashOpenMatchAnalysis(matchId: string): void {
  const id = String(matchId || '').trim();
  if (!id) return;
  try {
    localStorage.setItem(OPEN_MATCH_ANALYSIS_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeOpenMatchAnalysisId(): string | null {
  try {
    const id = localStorage.getItem(OPEN_MATCH_ANALYSIS_KEY);
    if (!id) return null;
    localStorage.removeItem(OPEN_MATCH_ANALYSIS_KEY);
    return id;
  } catch {
    return null;
  }
}

export function peekOpenMatchAnalysisId(): string | null {
  try {
    return localStorage.getItem(OPEN_MATCH_ANALYSIS_KEY);
  } catch {
    return null;
  }
}

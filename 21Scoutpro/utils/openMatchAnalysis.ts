/** After realtime finalize: dashboard opens Dados do Jogo → analysis for this match id. */
export const OPEN_MATCH_ANALYSIS_KEY = 'scout21_open_match_analysis';

/**
 * Grace window after Finalizar → /dashboard so a flaky 401 on /auth/profile
 * does not wipe the session (BUG-LOGOUT-POS-FINALIZAR / Verify 5).
 */
export const KEEP_SESSION_AFTER_FINALIZE_KEY = 'scout21_keep_session_until';

export function stashOpenMatchAnalysis(matchId: string): void {
  const id = String(matchId || '').trim();
  if (!id) return;
  try {
    localStorage.setItem(OPEN_MATCH_ANALYSIS_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Call immediately before navigating off /scout-realtime after finalize. */
export function markKeepSessionAfterFinalize(ms = 25_000): void {
  try {
    sessionStorage.setItem(KEEP_SESSION_AFTER_FINALIZE_KEY, String(Date.now() + ms));
  } catch {
    /* ignore */
  }
}

export function shouldKeepSessionAfterFinalize(): boolean {
  try {
    const until = Number(sessionStorage.getItem(KEEP_SESSION_AFTER_FINALIZE_KEY) || 0);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
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

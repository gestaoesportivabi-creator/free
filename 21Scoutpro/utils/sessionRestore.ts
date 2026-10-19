/**
 * Política de sessão no restore de /auth/profile e no handoff pós-Finalizar.
 * Só um 401 autenticado apaga o token. Rede, 5xx, 403 e abort mantêm a sessão.
 * Cancelamento (unmount / AbortController) nunca desloga.
 */

export type SessionFailure =
  | { type: 'http'; status: number }
  | { type: 'network' }
  | { type: 'abort' };

export function shouldClearSessionToken(
  failure: SessionFailure,
  opts?: { cancelled?: boolean }
): boolean {
  if (opts?.cancelled) return false;
  if (failure.type === 'network' || failure.type === 'abort') return false;
  return failure.status === 401;
}

/** Token resultante depois de uma falha de perfil. `null` só quando o 401 limpa a sessão. */
export function sessionTokenAfterProfileFailure(
  token: string | null,
  failure: SessionFailure,
  opts?: { cancelled?: boolean }
): string | null {
  if (!token) return token;
  if (shouldClearSessionToken(failure, opts)) return null;
  return token;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name;
  return name === 'AbortError';
}

export interface FinalizeNavigationDeps {
  hasLiveOpener: boolean;
  pushState: (url: string) => void;
  assign: (url: string) => void;
  close: () => void;
  /** Router da App (setState). Preferido ao reload. */
  softRoute?: () => void;
}

/**
 * Depois de Finalizar: fecha o popup se houver opener, senão navega no mesmo
 * documento. Nunca chama `location.assign` (isso recarregava e caía em /login).
 */
export function performFinalizeNavigation(
  deps: FinalizeNavigationDeps
): 'soft' | 'close-opener' {
  if (deps.hasLiveOpener) {
    deps.close();
    return 'close-opener';
  }
  if (deps.softRoute) {
    deps.softRoute();
    return 'soft';
  }
  deps.pushState('/dashboard');
  return 'soft';
}

/** Detecção de boot público — sem imports de UI (mantém o chunk leve). */

function normalizePathname(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function matchBlogPath(p: string): boolean {
  return /^\/blog(?:\/(en|es))?(?:\/([^/]+))?$/.test(p);
}

function matchLegalPath(p: string): boolean {
  return (
    p === '/termos' ||
    p === '/termos-de-uso' ||
    p === '/privacidade' ||
    p === '/politica-de-privacidade'
  );
}

function matchAuthEmailPath(p: string): boolean {
  const m = p.match(/^\/login\/(reset-password|magic-link|verify-email)$/);
  if (!m) return false;
  return Boolean(new URLSearchParams(window.location.search).get('token'));
}

const SIGNUP_PATHS = ['/criar-conta', '/cadastro', '/signup'];

/**
 * Paths que devem entrar pelo PublicApp (sem dashboard).
 * Sessão na home → App completo (restaura usuário).
 */
export function shouldBootPublicApp(): boolean {
  if (typeof window === 'undefined') return false;
  const p = normalizePathname();
  if (p === '/dashboard' || p.startsWith('/dashboard/')) return false;
  if (p === '/bem-vindo') return false;
  if ((p === '/' || p === '') && localStorage.getItem('token')) return false;
  if (matchBlogPath(p)) return true;
  if (matchLegalPath(p)) return true;
  if (SIGNUP_PATHS.includes(p)) return true;
  if (p === '/login' || matchAuthEmailPath(p)) return true;
  if (p === '/' || p === '') return true;
  if (p === '/newsletter') return true;
  return false;
}

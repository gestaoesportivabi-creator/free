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

function isAuthEmailPath(p: string): boolean {
  return /^\/login\/(reset-password|magic-link|verify-email)$/.test(p);
}

/** Rotas do App autenticado (nunca boot público). */
function isAuthenticatedAppPath(p: string): boolean {
  if (p === '/dashboard' || p.startsWith('/dashboard/')) return true;
  if (p === '/bem-vindo') return true;
  if (p === '/scout-realtime') return true;
  if (p === '/guia-de-uso') return true;
  return false;
}

const SIGNUP_PATHS = ['/criar-conta', '/cadastro', '/signup'];

function isCalculatorPath(p: string): boolean {
  return p === '/calculadoras/jackson-pollock-7-dobras' || p === '/calculadora/jackson-pollock-7-dobras';
}

/**
 * Paths que devem entrar pelo PublicApp (sem dashboard).
 * Sessão na home → App completo (restaura usuário).
 * Rotas de app (/scout-realtime, /guia-de-uso, …) → App.
 * Paths desconhecidos → PublicApp com 404.
 */
export function shouldBootPublicApp(): boolean {
  if (typeof window === 'undefined') return false;
  const p = normalizePathname();
  if (isAuthenticatedAppPath(p)) return false;
  if ((p === '/' || p === '') && localStorage.getItem('token')) return false;
  if (matchBlogPath(p)) return true;
  if (matchLegalPath(p)) return true;
  if (SIGNUP_PATHS.includes(p)) return true;
  if (isCalculatorPath(p)) return true;
  if (p === '/login' || isAuthEmailPath(p)) return true;
  if (p === '/' || p === '') return true;
  if (p === '/newsletter') return true;
  // Rotas desconhecidas → shell público com 404 (não cair no dashboard)
  return true;
}

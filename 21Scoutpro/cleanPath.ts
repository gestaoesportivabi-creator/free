/**
 * Corrige links "sujos" antes de o app decidir a rota.
 * Ex.: no WhatsApp, "https://www.scout21.com.br/criar-conta." leva o ponto final junto
 * e caía no 404. Aqui removemos pontuação/espaço grudados no fim do caminho e
 * normalizamos maiúsculas nas rotas públicas conhecidas.
 */
const TRAILING_JUNK = /(?:[.,;:!?)\]}>'"*_~`]|%20|%22|%27|%29|%5D|%3E|\s)+$/i;

const KNOWN_ROUTES = [
  '/criar-conta', '/cadastro', '/signup', '/registro', '/register', '/bem-vindo',
  '/login', '/entrar', '/termos', '/termos-de-uso', '/privacidade',
  '/politica-de-privacidade', '/newsletter', '/blog', '/dashboard', '/guia-de-uso',
];

export function cleanPathname(pathname: string): string {
  let p = pathname;
  let prev = '';
  while (p !== prev) {
    prev = p;
    p = p.replace(TRAILING_JUNK, '');
  }
  if (!p) p = '/';
  const lower = p.toLowerCase();
  if (lower !== p && KNOWN_ROUTES.includes(lower.replace(/\/$/, ''))) p = lower;
  return p;
}

export function fixDirtyUrl(): void {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  const cleaned = cleanPathname(pathname);
  if (cleaned !== pathname) {
    window.history.replaceState(window.history.state, '', cleaned + search + hash);
  }
}

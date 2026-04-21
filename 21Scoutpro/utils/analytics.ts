/**
 * Analytics helpers para GA4 + eventos de produto.
 *
 * Contrato:
 * - GA4 é carregado em index.html apenas se `import.meta.env.VITE_GA4_ID` existir
 *   (ver snippet em index.html). Quando não existir, estes helpers viram no-op.
 * - Uso centralizado de `track(event, params)` permite que o OnPageSEO ajuste
 *   eventos sem caçar chamadas pelo código.
 */

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __scout21_analytics_ready?: boolean;
  }
}

const CONSENT_KEY = 'scout21_consent_v1';

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function grantAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_KEY, 'granted');
  } catch {
    /* ignore */
  }
  try {
    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'granted',
    });
  } catch {
    /* ignore */
  }
}

export function denyAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_KEY, 'denied');
  } catch {
    /* ignore */
  }
  try {
    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
    });
  } catch {
    /* ignore */
  }
}

export function track(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  const payload: AnalyticsParams = {
    ...params,
    page_path: window.location.pathname,
  };
  try {
    window.gtag?.('event', event, payload);
  } catch {
    /* ignore */
  }
  const meta = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  if (!window.gtag && meta?.DEV) {
    console.debug('[analytics]', event, payload);
  }
}

export function trackPageView(path?: string): void {
  if (typeof window === 'undefined') return;
  const p = path || window.location.pathname;
  try {
    window.gtag?.('event', 'page_view', {
      page_path: p,
      page_location: window.location.href,
      page_title: document.title,
    });
  } catch {
    /* ignore */
  }
}

/** Auxiliar: attach listener de scroll que dispara uma vez quando passa de X%. */
export function onScrollPercent(target: number, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let fired = false;
  const onScroll = () => {
    if (fired) return;
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    if (total <= 0) return;
    const pct = (window.scrollY / total) * 100;
    if (pct >= target) {
      fired = true;
      cb();
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

/**
 * Analytics helpers para GA4 + Google Ads (gtag.js).
 *
 * - Snippet gtag em `index.html` (Measurement ID G-JDLX263HXT / VITE_GA4_ID).
 * - Consent Mode v2: default denied; ao Aceitar libera analytics + ads (atribuição).
 * - Conversão Ads opcional via `VITE_GOOGLE_ADS_CONVERSION_ID` (formato AW-XXXX/YYYY).
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

const CONSENT_GRANTED = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
} as const;

const CONSENT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

function envString(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const value = env?.[key]?.trim();
    if (!value || value.includes(key)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

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
    window.gtag?.('consent', 'update', { ...CONSENT_GRANTED });
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
    window.gtag?.('consent', 'update', { ...CONSENT_DENIED });
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

/**
 * Cadastro concluído: evento custom (histórico) + `sign_up` recomendado GA4
 * + conversão Google Ads se `VITE_GOOGLE_ADS_CONVERSION_ID` estiver definido.
 */
export function trackSignupCompleted(params: { plan?: string | null } = {}): void {
  const plan = params.plan || undefined;
  // beacon: SignUp redireciona com location.assign logo em seguida — sem beacon o hit some.
  track('signup_completed', { plan, method: 'email', transport_type: 'beacon' });
  // Evento recomendado GA4 — facilita importação automática no Google Ads
  track('sign_up', { method: 'email', plan, transport_type: 'beacon' });

  const conversionId = envString('VITE_GOOGLE_ADS_CONVERSION_ID');
  if (!conversionId || typeof window === 'undefined') return;
  try {
    window.gtag?.('event', 'conversion', {
      send_to: conversionId,
      plan,
      transport_type: 'beacon',
    });
  } catch {
    /* ignore */
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

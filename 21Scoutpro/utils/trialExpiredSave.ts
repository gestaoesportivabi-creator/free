/**
 * Contrato já existente em `requireActiveSubscription()`:
 * HTTP 402 + corpo `{ success: false, error: "trial_expired" }`.
 * Cobre teste vencido e assinatura `expired` / `canceled` (os dois caem em `isExpired`).
 */

export const TRIAL_EXPIRED_STATUS = 402;
export const TRIAL_EXPIRED_CODE = 'trial_expired';

/** Mesmo canal de planos já usado no app (não há página interna de preços). */
export const PLANS_CTA_HREF =
  'https://wa.me/5548991486176?text=' +
  encodeURIComponent('Olá, meu período de teste do SCOUT 21 terminou e quero ver os planos.');

export const PLANS_CTA_LABEL = 'Ver planos';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message || code || `Erro ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

export function isTrialExpiredSaveError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: unknown }).status;
  const code = (error as { code?: unknown }).code;
  return status === TRIAL_EXPIRED_STATUS && code === TRIAL_EXPIRED_CODE;
}

/**
 * @param dataKeptLocally true só quando o rascunho continua na tela e o 402 não apaga o que já estava no servidor.
 */
export function trialExpiredMatchSaveMessage(dataKeptLocally: boolean): string {
  const head = 'Seu período de teste terminou. A partida não foi gravada no servidor.';
  if (!dataKeptLocally) return head;
  return (
    `${head} Os dados desta partida não foram perdidos: continuam nesta tela, ` +
    'e o que já estava salvo segue disponível para consulta.'
  );
}

export function notifyTrialExpiredMatchSave(
  dataKeptLocally: boolean,
  deps?: {
    confirm?: (message: string) => boolean;
    open?: (url: string) => void;
  }
): void {
  const confirmFn = deps?.confirm ?? ((message: string) => window.confirm(message));
  const openFn =
    deps?.open ??
    ((url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  const accepted = confirmFn(
    `${trialExpiredMatchSaveMessage(dataKeptLocally)}\n\nDeseja ver os planos agora?`
  );
  if (accepted) openFn(PLANS_CTA_HREF);
}

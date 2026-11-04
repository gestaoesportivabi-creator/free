/**
 * Verificação da assinatura `Stripe-Signature` (esquema v1, HMAC-SHA256).
 * Implementação própria com `crypto` para não depender do SDK; segue
 * https://docs.stripe.com/webhooks#verify-manually
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Tolerância padrão do Stripe: 5 minutos contra replay. */
export const DEFAULT_TOLERANCE_SECONDS = 300;

export function verifyStripeSignature(
  rawBody: Buffer | string,
  header: string | undefined,
  secret: string,
  options: { toleranceSeconds?: number; nowSeconds?: number } = {}
): boolean {
  if (!header || !secret) return false;

  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=');
    if (key?.trim() === 't') timestamp = (value || '').trim();
    if (key?.trim() === 'v1' && value) signatures.push(value.trim());
  }

  const ts = Number(timestamp);
  if (!timestamp || !Number.isFinite(ts) || signatures.length === 0) return false;
  if (Math.abs(now - ts) > tolerance) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();

  return signatures.some((signature) => {
    const candidate = Buffer.from(signature, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

/** Gera o header de um evento — usado pelos testes (e útil para depurar). */
export function signStripePayload(payload: string, secret: string, timestampSeconds: number): string {
  const digest = createHmac('sha256', secret).update(`${timestampSeconds}.${payload}`).digest('hex');
  return `t=${timestampSeconds},v1=${digest}`;
}

/**
 * Rate limiting em memória para rotas públicas de autenticação.
 *
 * Abrir o cadastro ao mundo sem trava é convite a bot. `/api/leads` já tinha
 * limite; `/api/auth/*` não tinha nenhum. Ver docs/PLANO_MESTRE_TRIAL_30D.md (§1.5).
 *
 * Limitação conhecida: o estado é por instância. No Vercel serverless cada
 * instância tem o seu contador, então o limite efetivo é mais frouxo do que o
 * configurado. É suficiente para travar abuso trivial; quando houver volume real,
 * trocar por Redis/Upstash. O `SIGNUP_ENABLED` continua a ser o freio de emergência.
 */

import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60_000;

/** Remove janelas expiradas para o Map não crescer indefinidamente. */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > windowMs * 2) buckets.delete(key);
  }
}

export function clientIp(req: Request): string {
  const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Prefixo do bucket — separa limites de rotas diferentes. */
  scope: string;
  /** Chave adicional além do IP (ex.: e-mail), para limitar por identidade. */
  keyFrom?: (req: Request) => string | null;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, scope, keyFrom, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    sweep(now, windowMs);

    const extra = keyFrom?.(req);
    // Sem chave extra utilizável, limita só por IP.
    const key = `${scope}:${extra ?? clientIp(req)}`;

    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: message ?? 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfterSeconds: retryAfter,
      });
    }

    next();
    return;
  };
}

/** Normaliza o e-mail do body para servir de chave de rate-limit. */
export function emailKey(scope: string) {
  return (req: Request): string | null => {
    const raw = (req.body as Record<string, unknown> | undefined)?.email;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    return `${scope}:email:${raw.trim().toLowerCase()}`;
  };
}

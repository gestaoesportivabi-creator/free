/**
 * Controller de captura de leads (landing + blog + futuro outreach).
 *
 * Contrato mínimo:
 *   POST /api/leads
 *     { name, email, phone?, message?, source, lang?, utm_* }
 *     -> 201 { success: true, id }
 *
 * Notas de produto:
 * - Sem tenant: rota é pública para a landing capturar sem login.
 * - Rate-limit simples por IP (em memória) — ok para MVP; trocar por Redis quando escalar.
 * - Se o banco estiver indisponível, ainda retorna 202 para não comer o lead no UX;
 *   o campo é logado no console/Vercel logs para recuperação manual até o DB voltar.
 */
import { Request, Response } from 'express';
import prisma from '../config/database';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, { count: number; windowStart: number }>();

function clientIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return xff || req.socket.remoteAddress || 'unknown';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const prev = hits.get(ip);
  if (!prev || now - prev.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  prev.count += 1;
  return prev.count <= MAX_PER_WINDOW;
}

export const leadsController = {
  async create(req: Request, res: Response) {
    try {
      const ip = clientIp(req);
      if (!rateLimit(ip)) {
        return res.status(429).json({ success: false, error: 'rate_limited' });
      }

      const body = (req.body || {}) as Record<string, unknown>;
      const name = String(body.name ?? '').trim().slice(0, 255);
      const email = String(body.email ?? '').trim().slice(0, 255).toLowerCase();
      const phone = body.phone ? String(body.phone).trim().slice(0, 50) : null;
      const message = body.message ? String(body.message).slice(0, 4000) : null;
      const source = String(body.source ?? 'landing').trim().slice(0, 120);
      const lang = body.lang ? String(body.lang).trim().slice(0, 10) : null;
      const ua = body.ua ? String(body.ua).slice(0, 500) : (req.headers['user-agent'] as string | undefined) || null;

      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'missing_name_or_email' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'invalid_email' });
      }

      const utm = (key: string) => {
        const v = body[key];
        if (typeof v !== 'string') return null;
        return v.trim().slice(0, 120) || null;
      };

      const data = {
        name,
        email,
        phone,
        message,
        source,
        lang,
        ua,
        ip,
        utmSource: utm('utm_source'),
        utmMedium: utm('utm_medium'),
        utmCampaign: utm('utm_campaign'),
        utmTerm: utm('utm_term'),
        utmContent: utm('utm_content'),
      };

      try {
        const anyPrisma = prisma as unknown as { lead?: { create: (args: { data: typeof data }) => Promise<{ id: string }> } };
        if (!anyPrisma.lead) {
          console.warn('[leads] Prisma model "Lead" não gerado. Rode `prisma migrate`/`prisma generate`.', data);
          return res.status(202).json({ success: true, queued: true });
        }
        const row = await anyPrisma.lead.create({ data });
        return res.status(201).json({ success: true, id: row.id });
      } catch (err) {
        console.error('[leads] db error, persisting to logs:', err, data);
        return res.status(202).json({ success: true, queued: true });
      }
    } catch (err) {
      console.error('[leads] unexpected', err);
      return res.status(500).json({ success: false, error: 'internal' });
    }
  },
};

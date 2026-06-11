/**
 * Web Assistant — proxy SSE para Hermes API (dashboard)
 */

import { Response } from 'express';
import { env } from '../config/env';
import { TenantInfo } from '../utils/tenant.helper';
import {
  containsYouTubeUrl,
  enrichUserMessageForYouTubeScout,
} from '../utils/youtubeUrl.helper';
import { buildYouTubeScoutContext } from './youtubeScout.context';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const HERMES_MAX_TOKENS = 1024;
const MAX_HISTORY_MESSAGES = 12;

export function isHermesWebConfigured(): boolean {
  return Boolean(env.HERMES_WEB_API_URL?.trim() && env.HERMES_WEB_API_KEY?.trim());
}

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export function buildSessionSystemPrompt(params: {
  userId: string;
  role: string;
  name: string;
  tenantInfo: TenantInfo;
}): string {
  const equipeIds = params.tenantInfo.equipe_ids?.join(',') ?? '';
  const jogadorPart = params.tenantInfo.jogador_id ? ` jogadorId=${params.tenantInfo.jogador_id}` : '';
  const isAdmin = params.role === 'ADMINISTRADOR';

  const adminBlock = isAdmin
    ? `

Voce atende um ADMINISTRADOR da plataforma. Use endpoints /api/assistant/admin/platform/* (skill scout21-api):
- GET /admin/platform/overview — totais usuarios, equipes, assistente
- GET /admin/platform/users — lista usuarios
- GET /admin/platform/tenants — tecnicos e clubes
- GET /admin/platform/activity — uso assistente web/Telegram
- GET /admin/platform/users/:userId/insights — insights de um tecnico

Base URL OBRIGATORIA: env SCOUT21_API_URL ou https://gestaoesportiva-free.vercel.app — NUNCA api.scout21.com.br (nao existe).
Headers: X-Assistant-Token + X-Scout21-User-Id da sessao.`
    : '';

  return `[SCOUT21_SESSION userId=${params.userId} role=${params.role} equipeIds=${equipeIds} name=${params.name}${jogadorPart}]

Voce e o Assistente Scout21 no dashboard web. Use skill scout21-api com header X-Scout21-User-Id: ${params.userId} em todas as consultas de dados. Nunca acesse dados de outro usuario. Responda em portugues BR, tom profissional e acolhedor, max ~280 palavras.
${adminBlock}

REGRAS CRITICAS (anti-loop):
- Skills ja estao carregadas — PROIBIDO dizer "vou carregar a skill", "carregando skill", "aguarde".
- Se a mensagem do usuario contiver [SCOUT21_YOUTUBE_CONTEXT], os dados JA foram buscados — monte a resposta final IMEDIATAMENTE sem tools.
- Ao colar link YouTube: primeira frase = status curto ("Salvando video...") e em seguida entregue o scout ou UMA pergunta objetiva.

YouTube Scout (PRO): skill scout21-youtube-scout. Na 1a mensagem ofereca colar link YouTube. Max 2 tools por turno quando precisar buscar dados (exceto quando [SCOUT21_YOUTUBE_CONTEXT] presente).`;
}

export async function prepareMessagesForHermes(
  messages: ChatMessage[],
  tenantInfo: TenantInfo,
  role: string
): Promise<ChatMessage[]> {
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  const out: ChatMessage[] = [];

  for (let i = 0; i < trimmed.length; i++) {
    const m = trimmed[i];
    if (m.role !== 'user') {
      out.push(m);
      continue;
    }
    let content = m.content;
    if (containsYouTubeUrl(content)) {
      const contextBlock = await buildYouTubeScoutContext(tenantInfo, content, role);
      content = enrichUserMessageForYouTubeScout(content, contextBlock);
    }
    out.push({ ...m, content });
  }
  return out;
}

export async function streamChatToHermes(
  params: {
    userId: string;
    role: string;
    name: string;
    tenantInfo: TenantInfo;
    messages: ChatMessage[];
  },
  res: Response
): Promise<void> {
  if (!isHermesWebConfigured()) {
    res.status(503).json({ success: false, error: 'Assistente web não configurado no servidor' });
    return;
  }

  const systemPrompt = buildSessionSystemPrompt(params);
  const prepared = await prepareMessagesForHermes(params.messages, params.tenantInfo, params.role);
  const apiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...prepared.filter((m) => m.role !== 'system'),
  ];

  const baseUrl = env.HERMES_WEB_API_URL!.replace(/\/$/, '');
  const hermesRes = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.HERMES_WEB_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Key': `web:${params.userId}`,
    },
    body: JSON.stringify({
      model: 'minimax/minimax-m3',
      stream: true,
      max_tokens: HERMES_MAX_TOKENS,
      messages: apiMessages,
    }),
  });

  if (!hermesRes.ok) {
    const errText = await hermesRes.text().catch(() => '');
    console.error('[webAssistant] Hermes error', hermesRes.status, errText.slice(0, 500));
    res.status(502).json({
      success: false,
      error: 'Assistente temporariamente indisponível. Tente novamente em instantes.',
    });
    return;
  }

  if (!hermesRes.body) {
    res.status(502).json({ success: false, error: 'Resposta vazia do assistente' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const reader = hermesRes.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      if (typeof (res as Response & { flush?: () => void }).flush === 'function') {
        (res as Response & { flush?: () => void }).flush!();
      }
    }
  } catch (err) {
    console.error('[webAssistant] stream relay error', err);
  } finally {
    res.end();
  }
}

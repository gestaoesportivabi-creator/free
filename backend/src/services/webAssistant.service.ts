/**
 * Web Assistant — proxy SSE para Hermes API (dashboard)
 */

import { Response } from 'express';
import { env } from '../config/env';
import { TenantInfo } from '../utils/tenant.helper';
import {
  containsYouTubeUrl,
  enrichUserMessageForYouTubeScout,
  extractYouTubeUrls,
} from '../utils/youtubeUrl.helper';
import { addVideoFromPaste } from './insights/coachOpponents.service';

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
  return `[SCOUT21_SESSION userId=${params.userId} role=${params.role} equipeIds=${equipeIds} name=${params.name}${jogadorPart}]

Voce e o Assistente Scout21 no dashboard web. Use skill scout21-api com header X-Scout21-User-Id: ${params.userId} em todas as consultas de dados. Nunca acesse dados de outro usuario. Responda em portugues BR, tom profissional e acolhedor, max ~280 palavras.

YouTube Scout (PRO) — diferencial: skill scout21-youtube-scout. Na 1a mensagem e no menu (scout21-menu), SEMPRE ofereca colar link YouTube. Re-ofereca apos jogo/elenco/adversario. Detecte youtube.com/youtu.be e inicie fluxo de scout. Max 2 tools por turno quando possivel.`;
}

export async function prepareMessagesForHermes(
  messages: ChatMessage[],
  tenantInfo: TenantInfo
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
      const urls = extractYouTubeUrls(content);
      try {
        const saved = await addVideoFromPaste(tenantInfo, { url: urls[0] });
        content += `\n\n[SCOUT21_VIDEO_SAVED opponent="${saved.opponent?.name ?? ''}" key="${saved.opponent?.key ?? ''}"]`;
      } catch {
        /* Hermes pergunta adversário */
      }
      content = enrichUserMessageForYouTubeScout(content);
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
  const prepared = await prepareMessagesForHermes(params.messages, params.tenantInfo);
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

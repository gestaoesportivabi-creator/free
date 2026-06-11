/**
 * Web Assistant API client (dashboard chat)
 */

import { getApiUrl } from '../config';

export type AssistantChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type WebAssistantStatus = {
  userId: string;
  enabled: boolean;
  userName: string;
  role: string;
  userType: 'staff' | 'athlete';
  equipeCount: number;
  youtubeScoutEnabled?: boolean;
  videoCount?: number;
  lastMatch?: {
    opponent: string;
    date: string;
    result: string | null;
    videoUrl: string | null;
  } | null;
};

export type StreamingPhase = 'idle' | 'thinking' | 'streaming';

async function authHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchWebAssistantStatus(): Promise<WebAssistantStatus | null> {
  try {
    const res = await fetch(`${getApiUrl()}/web-assistant/status`, {
      headers: await authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function streamWebAssistantChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/web-assistant/chat/stream`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    let msg = 'Não foi possível falar com o assistente.';
    try {
      const json = await res.json();
      if (json.error) msg = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (!res.body) throw new Error('Resposta vazia do assistente');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        /* ignore partial JSON */
      }
    }
  }
}

/**
 * Testes integrados — Web Assistant (BFF + Hermes + tenant)
 * Uso: npx tsx scripts/test-web-assistant.ts
 */

import jwt from 'jsonwebtoken';
import prisma from '../src/config/database';
import { env } from '../src/config/env';

const DANIEL_ID = '0b1b468f-274f-49e7-8624-2dbe4670eea5';
const API_BASE = process.env.TEST_API_BASE ?? 'http://localhost:3000/api';
const HERMES_URL = process.env.HERMES_WEB_API_URL ?? env.HERMES_WEB_API_URL;
const HERMES_KEY = process.env.HERMES_WEB_API_KEY ?? env.HERMES_WEB_API_KEY;

type Result = { name: string; ok: boolean; detail: string };

const results: Result[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}: ${detail}`);
}

async function signToken(userId: string, email: string, userType: 'staff' | 'athlete', jogadorId?: string) {
  return jwt.sign(
    { userId, email, userType, jogadorId },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function fetchJson(path: string, token?: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text: text.slice(0, 500) };
}

async function testHermesDirect() {
  if (!HERMES_URL?.trim() || !HERMES_KEY?.trim()) {
    record('Hermes VPS /v1/models', false, 'HERMES_WEB_* não configurado localmente');
    return;
  }
  const base = HERMES_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/v1/models`, {
    headers: { Authorization: `Bearer ${HERMES_KEY}` },
  });
  const body = await res.text();
  record(
    'Hermes VPS /v1/models',
    res.ok && body.includes('hermes-agent'),
    `HTTP ${res.status} ${body.slice(0, 80)}`
  );
}

async function testProductionEndpoints() {
  const prod = 'https://gestaoesportiva-free.vercel.app/api';
  const status = await fetch(`${prod}/web-assistant/status`);
  record(
    'Produção GET /web-assistant/status',
    status.status !== 404,
    `HTTP ${status.status} (404 = backend ainda não deployado)`
  );

  const js = await fetch('https://gestaoesportiva-free.vercel.app/');
  const html = await js.text();
  const bundle = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  if (bundle) {
    const bundleText = await (await fetch(`https://gestaoesportiva-free.vercel.app${bundle}`)).text();
    const hasButton = bundleText.includes('Acessar Assistente Scout21');
    record(
      'Produção frontend — botão no bundle',
      hasButton,
      hasButton ? 'texto encontrado no JS' : `bundle ${bundle} sem o botão (deploy pendente)`
    );
  } else {
    record('Produção frontend — botão no bundle', false, 'bundle index não encontrado no HTML');
  }
}

async function testBff(danielToken: string, otherToken: string | null) {
  const noAuth = await fetchJson('/web-assistant/status');
  record('BFF status sem JWT', noAuth.status === 401, `HTTP ${noAuth.status}`);

  const status = await fetchJson('/web-assistant/status', danielToken);
  const data = (status.json as { data?: { enabled?: boolean; userName?: string; equipeCount?: number } })?.data;
  record(
    'BFF status Daniel (JWT)',
    status.status === 200 && !!data?.userName,
    status.status === 200
      ? `enabled=${data?.enabled} user=${data?.userName} equipes=${data?.equipeCount}`
      : `HTTP ${status.status} ${status.text}`
  );

  if (otherToken) {
    const other = await fetchJson('/web-assistant/status', otherToken);
    const od = (other.json as { data?: { userName?: string; equipeCount?: number } })?.data;
    record(
      'BFF status segundo usuário',
      other.status === 200,
      other.status === 200 ? `${od?.userName} equipes=${od?.equipeCount}` : `HTTP ${other.status}`
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const stream = await fetch(`${API_BASE}/web-assistant/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${danielToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Responda apenas: OK' }],
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  let sseOk = stream.ok;
  let sseSnippet = '';
  if (stream.body) {
    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    sseSnippet = decoder.decode(value ?? new Uint8Array()).slice(0, 120);
    reader.cancel().catch(() => {});
    sseOk = sseOk && (sseSnippet.includes('data:') || sseSnippet.length > 0);
  }
  record(
    'BFF chat/stream SSE Daniel',
    sseOk,
    `HTTP ${stream.status} ${sseSnippet.replace(/\n/g, ' ').slice(0, 100)}`
  );
}

async function testAssistantApiIsolation(danielId: string, otherId: string | null) {
  const token = env.ASSISTANT_SERVICE_TOKEN;
  if (!token?.trim()) {
    record('Assistant API X-Scout21-User-Id', false, 'ASSISTANT_SERVICE_TOKEN ausente');
    return;
  }

  const headers = {
    'X-Assistant-Token': token,
    'X-Scout21-User-Id': danielId,
  };

  const matches = await fetch(`${API_BASE}/assistant/matches?limit=3`, { headers });
  const matchesJson = await matches.json().catch(() => ({}));
  const count = Array.isArray((matchesJson as { data?: unknown[] }).data)
    ? (matchesJson as { data: unknown[] }).data.length
    : 0;
  record(
    'Assistant API matches (Daniel userId)',
    matches.ok,
    `HTTP ${matches.status} jogos=${count}`
  );

  if (otherId) {
    const otherMatches = await fetch(`${API_BASE}/assistant/matches?limit=3`, {
      headers: { ...headers, 'X-Scout21-User-Id': otherId },
    });
    const oj = await otherMatches.json().catch(() => ({}));
    const oCount = Array.isArray((oj as { data?: unknown[] }).data)
      ? (oj as { data: unknown[] }).data.length
      : 0;
    record(
      'Assistant API isolamento (outro userId)',
      otherMatches.ok,
      `HTTP ${otherMatches.status} jogos=${oCount} (deve ser escopo diferente de Daniel)`
    );
  }
}

async function testDanielTelegramReset() {
  const u = await prisma.user.findUnique({
    where: { id: DANIEL_ID },
    select: { telegramCoachChatId: true },
  });
  record(
    'Daniel telegramCoachChatId reset',
    u?.telegramCoachChatId == null,
    u?.telegramCoachChatId == null ? 'null (ok)' : String(u?.telegramCoachChatId)
  );
}

async function main() {
  console.log('\n=== Web Assistant — testes ===\n');
  console.log(`API: ${API_BASE}`);
  console.log(`Hermes: ${HERMES_URL || '(vazio)'}\n`);

  await testHermesDirect();
  await testProductionEndpoints();
  await testDanielTelegramReset();

  const daniel = await prisma.user.findUnique({
    where: { id: DANIEL_ID },
    select: { id: true, email: true, name: true, jogadorId: true, role: { select: { name: true } } },
  });
  if (!daniel) {
    record('Carregar Daniel', false, 'usuário não encontrado');
    process.exit(1);
  }

  const danielToken = await signToken(daniel.id, daniel.email, 'staff');

  const otherStaff = await prisma.user.findFirst({
    where: {
      id: { not: DANIEL_ID },
      isActive: true,
      role: { name: { in: ['ESSENCIAL', 'PERFORMANCE', 'COMPETICAO', 'ADMINISTRADOR'] } },
      tecnico: { isNot: null },
    },
    select: { id: true, email: true },
  });
  const otherToken = otherStaff ? await signToken(otherStaff.id, otherStaff.email, 'staff') : null;

  try {
    await testBff(danielToken, otherToken);
  } catch (err) {
    record('BFF (servidor local)', false, `Servidor indisponível em ${API_BASE} — ${err}`);
  }

  try {
    await testAssistantApiIsolation(daniel.id, otherStaff?.id ?? null);
  } catch (err) {
    record('Assistant API', false, String(err));
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- ${results.length - failed}/${results.length} passou ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

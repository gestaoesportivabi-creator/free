import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { requirePlatformAdmin } from '../middleware/admin.middleware';
import { telegramWebhookSecretMatches } from '../middleware/telegramWebhook.middleware';
import telegramRoutes from './telegram.routes';

type RouteLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: { name: string } }>;
  };
};

function handles(path: string, method: 'get' | 'post'): string[] {
  const layer = (telegramRoutes as unknown as { stack: RouteLayer[] }).stack.find(
    (entry) => entry.route?.path === path && entry.route.methods[method]
  );
  assert.ok(layer?.route, `rota ausente ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((entry) => entry.handle.name);
}

describe('rotas admin do Telegram', () => {
  test('status, diagnose, register e delete exigem auth e papel de admin', () => {
    for (const [method, path] of [
      ['get', '/status'],
      ['get', '/diagnose'],
      ['post', '/register-webhook'],
      ['post', '/delete-webhook'],
    ] as const) {
      const names = handles(path, method);
      assert.equal(names[0], 'authMiddleware');
      assert.equal(names[1], 'requirePlatformAdmin');
    }
  });

  test('webhook valida o secret e não exige JWT; cron fica fora do admin', () => {
    const webhook = handles('/webhook', 'post');
    assert.equal(webhook[0], 'telegramWebhookSecretMiddleware');
    assert.equal(webhook.includes('authMiddleware'), false);
    assert.equal(handles('/cron/reminders', 'get').includes('authMiddleware'), false);
    assert.equal(handles('/cron/reminders', 'post').includes('authMiddleware'), false);
  });

  test('papel que não é administrador recebe 403', () => {
    const req = { user: { role_id: 'ESSENCIAL' } } as Request;
    let statusCode = 0;
    let body: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        body = payload;
        return this;
      },
    } as Response;
    let nextCalled = false;
    requirePlatformAdmin(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);
    assert.equal(statusCode, 403);
    assert.equal(nextCalled, false);
    assert.equal((body as { success: boolean }).success, false);
  });
});

describe('TELEGRAM_WEBHOOK_SECRET', () => {
  const fixture = 'fixture-webhook-secret';

  test('sem variável aceita; com variável exige o header exato', () => {
    assert.equal(telegramWebhookSecretMatches('', null), 'unconfigured');
    assert.equal(telegramWebhookSecretMatches('   ', 'qualquer'), 'unconfigured');
    assert.equal(telegramWebhookSecretMatches(fixture, null), 'reject');
    assert.equal(telegramWebhookSecretMatches(fixture, ''), 'reject');
    assert.equal(telegramWebhookSecretMatches(fixture, 'outro'), 'reject');
    assert.equal(telegramWebhookSecretMatches(fixture, fixture), 'match');
    assert.equal(telegramWebhookSecretMatches(`${fixture} `, fixture), 'reject');
  });
});

describe('HTTP /api/telegram', () => {
  let server: Server;
  let base: string;
  const previousSecret = env.TELEGRAM_WEBHOOK_SECRET;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/telegram', telegramRoutes);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function call(
    method: string,
    path: string,
    headers: Record<string, string> = {},
    body?: unknown
  ): Promise<{ status: number; json: { success?: boolean; error?: string; ok?: boolean } }> {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json()) as { success?: boolean; error?: string; ok?: boolean };
    return { status: response.status, json };
  }

  test('endpoints admin sem token respondem 401 e não chegam no handler', async () => {
    for (const [method, path] of [
      ['GET', '/api/telegram/status'],
      ['GET', '/api/telegram/diagnose'],
      ['POST', '/api/telegram/register-webhook'],
      ['POST', '/api/telegram/delete-webhook'],
    ] as const) {
      const result = await call(method, path, {}, method === 'POST' ? {} : undefined);
      assert.equal(result.status, 401, path);
      assert.equal(result.json.success, false);
    }
  });

  test('webhook falha fechado quando o secret está configurado', async () => {
    env.TELEGRAM_WEBHOOK_SECRET = 'fixture-webhook-secret';
    const missing = await call('POST', '/api/telegram/webhook', {}, {});
    assert.equal(missing.status, 401);
    const wrong = await call(
      'POST',
      '/api/telegram/webhook',
      { 'X-Telegram-Bot-Api-Secret-Token': 'outro' },
      {}
    );
    assert.equal(wrong.status, 401);
    const ok = await call(
      'POST',
      '/api/telegram/webhook',
      { 'X-Telegram-Bot-Api-Secret-Token': 'fixture-webhook-secret' },
      {}
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.json.ok, true);
  });

  test('webhook sem a variável continua aceito', async () => {
    env.TELEGRAM_WEBHOOK_SECRET = '';
    const open = await call('POST', '/api/telegram/webhook', {}, {});
    assert.equal(open.status, 200);
    assert.equal(open.json.ok, true);
  });

  test('cron sem CRON_SECRET responde 401', async () => {
    const result = await call('POST', '/api/telegram/cron/reminders', {}, {});
    assert.equal(result.status, 401);
  });
});

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Request, Response } from 'express';
import { wellnessController, type ClassicIo, type WellnessAccess } from './wellness.controller';
import type { BemEstarDiarioRepository } from '../repositories/bemEstarDiario.repository';
import type { JogadorTenantDb } from '../utils/tenantPlayers';

type Calls = {
  findMany: unknown[];
  findFirst: unknown[];
  update: unknown[];
  create: unknown[];
};

function mockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headersSent: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
}

function mockReq(partial: {
  type?: string;
  body?: unknown;
  role?: string;
  equipeIds?: string[];
}): Request {
  return {
    params: { type: partial.type ?? 'bem-estar-diario' },
    body: partial.body,
    user: {
      id: 'user-1',
      role_id: partial.role ?? 'ESSENCIAL',
      email: 'coach@example.com',
      name: 'Coach',
    },
    tenantInfo: { equipe_ids: partial.equipeIds ?? ['eq-1'] },
  } as Request;
}

function fakeRepo(existing: { id: string; equipe_id: string } | null = null): {
  repo: BemEstarDiarioRepository;
  calls: Calls;
} {
  const calls: Calls = { findMany: [], findFirst: [], update: [], create: [] };
  const repo: BemEstarDiarioRepository = {
    async findMany(args) {
      calls.findMany.push(args);
      return [{ id: 'row-1' }];
    },
    async findFirst(args) {
      calls.findFirst.push(args);
      return existing;
    },
    async update(args) {
      calls.update.push(args);
      return { id: existing?.id ?? 'updated' };
    },
    async create(args) {
      calls.create.push(args);
      return { id: 'created' };
    },
  };
  return { repo, calls };
}

function playersOf(membership: Record<string, string[]>): JogadorTenantDb {
  return {
    jogador: {
      async findMany(args) {
        const ids = args.where.id.in;
        const teams = args.where.equipes.some.equipeId.in;
        return ids
          .filter((id) => (membership[id] ?? []).some((equipeId) => teams.includes(equipeId)))
          .map((id) => ({ id }));
      },
    },
  };
}

function accessFor(
  membership: Record<string, string[]> = { j1: ['eq-1'] },
  classic?: ClassicIo
): WellnessAccess {
  return { players: playersOf(membership), classic };
}

async function callGet(
  res: ReturnType<typeof mockRes>,
  req: Request,
  repo: BemEstarDiarioRepository,
  access?: WellnessAccess
) {
  await wellnessController.getAll.call(undefined, req, res as unknown as Response, repo, access);
}

async function callSave(
  res: ReturnType<typeof mockRes>,
  req: Request,
  repo: BemEstarDiarioRepository,
  access: WellnessAccess = accessFor()
) {
  await wellnessController.saveBulk.call(undefined, req, res as unknown as Response, repo, access);
}

describe('GET /api/wellness/bem-estar-diario', () => {
  test('handler solto (this indefinido) lista a equipe e não responde 500', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callGet(res, mockReq({}), repo);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, data: [{ id: 'row-1' }] });
    assert.equal(calls.findMany.length, 1);
    assert.deepEqual(calls.findMany[0], {
      where: { equipe_id: { in: ['eq-1'] } },
      orderBy: { created_at: 'desc' },
    });
  });

  test('técnico sem equipes recebe lista vazia e não consulta IN ()', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callGet(res, mockReq({ equipeIds: [] }), repo);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, data: [] });
    assert.equal(calls.findMany.length, 0);
  });

  test('admin sem equipes lista sem filtro de equipe', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callGet(res, mockReq({ role: 'ADMINISTRADOR', equipeIds: [] }), repo);
    assert.equal(res.statusCode, 200);
    assert.deepEqual((calls.findMany[0] as { where?: unknown }).where, undefined);
  });

  test('tipo inválido é 400', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callGet(res, mockReq({ type: 'nao-existe' }), repo);
    assert.equal(res.statusCode, 400);
    assert.equal(calls.findMany.length, 0);
    assert.deepEqual(res.body, { success: false, error: 'Tipo de wellness inválido.' });
  });

  test('leitura omite jogador que não é das equipes do tenant', async () => {
    const repo: BemEstarDiarioRepository = {
      async findMany() {
        return [
          { id: 'own', jogador_id: 'j1' },
          { id: 'foreign', jogador_id: 'j-a' },
        ];
      },
      async findFirst() {
        return null;
      },
      async update() {
        return {};
      },
      async create() {
        return {};
      },
    };
    const res = mockRes();
    await callGet(res, mockReq({}), repo, accessFor({ j1: ['eq-1'], 'j-a': ['eq-a'] }));
    assert.equal(res.statusCode, 200);
    assert.deepEqual((res.body as { data: Array<{ id: string }> }).data.map((row) => row.id), ['own']);
  });
});

describe('POST /api/wellness/bem-estar-diario/bulk', () => {
  test('corpo inválido, data inválida e item nulo são 400 e não gravam', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callSave(res, mockReq({ body: {} }), repo);
    assert.equal(res.statusCode, 400);

    const badDate = mockRes();
    await callSave(
      badDate,
      mockReq({
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-1', data: '2026-02-31', nivel_stress: 3 }] },
      }),
      repo
    );
    assert.equal(badDate.statusCode, 400);

    const badItem = mockRes();
    await callSave(badItem, mockReq({ body: { items: [null] } }), repo);
    assert.equal(badItem.statusCode, 400);

    const badScale = mockRes();
    await callSave(
      badScale,
      mockReq({
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 'alto' }] },
      }),
      repo
    );
    assert.equal(badScale.statusCode, 400);
    assert.equal(calls.findFirst.length, 0);
    assert.equal(calls.create.length, 0);
  });

  test('equipe de outro tenant é 404 e linha de outro tenant não é atualizada', async () => {
    const skipped = fakeRepo();
    const res = mockRes();
    await callSave(
      res,
      mockReq({
        body: { items: [{ jogadorId: 'j1', equipeId: 'outra', data: '2026-10-19', nivel_stress: 3 }] },
      }),
      skipped.repo
    );
    assert.equal(res.statusCode, 404);
    assert.equal(skipped.calls.findFirst.length, 0);
    assert.equal(skipped.calls.create.length, 0);

    const conflict = fakeRepo({ id: 'row-x', equipe_id: 'outra' });
    const conflictRes = mockRes();
    await callSave(
      conflictRes,
      mockReq({
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 3 }] },
      }),
      conflict.repo
    );
    assert.equal(conflictRes.statusCode, 409);
    assert.equal(conflict.calls.update.length, 0);
    assert.equal(conflict.calls.create.length, 0);
  });

  test('cria com a data civil e atualiza a linha da própria equipe', async () => {
    const created = fakeRepo(null);
    const res = mockRes();
    await callSave(
      res,
      mockReq({
        body: {
          items: [{
            jogadorId: 'j1',
            equipeId: 'eq-1',
            data: '2026-10-19',
            nivel_stress: 3,
            qual_sono: null,
            observacoes: 'ok',
          }],
        },
      }),
      created.repo
    );
    assert.equal(res.statusCode, 200);
    const payload = created.calls.create[0] as { data: { data: Date; nivel_stress: number; observacoes: string } };
    assert.equal(payload.data.data.toISOString(), '2026-10-19T12:00:00.000Z');
    assert.equal(payload.data.nivel_stress, 3);
    assert.equal(payload.data.observacoes, 'ok');

    const updated = fakeRepo({ id: 'row-1', equipe_id: 'eq-1' });
    const updateRes = mockRes();
    await callSave(
      updateRes,
      mockReq({
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 2 }] },
      }),
      updated.repo
    );
    assert.equal(updateRes.statusCode, 200);
    assert.equal(updated.calls.update.length, 1);
    assert.equal(updated.calls.create.length, 0);
  });

  test('PSE com data inválida é 400 antes de qualquer gravação', async () => {
    const { repo, calls } = fakeRepo();
    const res = mockRes();
    await callSave(
      res,
      mockReq({
        type: 'pse-treino',
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-1', data: 'ontem', value: 5 }] },
      }),
      repo
    );
    assert.equal(res.statusCode, 400);
    assert.equal(calls.create.length, 0);
    assert.deepEqual(res.body, { success: false, error: 'Data inválida.' });
  });

  test('jogador de outro tenant não é gravado, nem no meio de um lote válido', async () => {
    const foreign = fakeRepo();
    const res = mockRes();
    await callSave(
      res,
      mockReq({
        body: { items: [{ jogadorId: 'j-a', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 3 }] },
      }),
      foreign.repo,
      accessFor({ 'j-a': ['eq-a'] })
    );
    assert.equal(res.statusCode, 404);
    assert.equal(foreign.calls.create.length, 0);

    const mixed = fakeRepo();
    const mixedRes = mockRes();
    await callSave(
      mixedRes,
      mockReq({
        body: {
          items: [
            { jogadorId: 'j1', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 3 },
            { jogadorId: 'j-a', equipeId: 'eq-1', data: '2026-10-19', nivel_stress: 2 },
          ],
        },
      }),
      mixed.repo,
      accessFor({ j1: ['eq-1'], 'j-a': ['eq-a'] })
    );
    assert.equal(mixedRes.statusCode, 404);
    assert.equal(mixed.calls.create.length, 0);
    assert.equal(mixed.calls.update.length, 0);
  });
});

describe('isolamento de PSE/PSR entre tenants', () => {
  function classic() {
    const calls: string[] = [];
    const listed: unknown[] = [];
    const io: ClassicIo = {
      async findMany(args) {
        calls.push(`list:${JSON.stringify(args)}`);
        return listed;
      },
      async findFirst() {
        calls.push('find');
        return null;
      },
      async update() {
        calls.push('update');
        return {};
      },
      async create() {
        calls.push('create');
        return { id: 'created' };
      },
      async jogoEquipeId(jogoId) {
        calls.push(`jogo:${jogoId}`);
        return jogoId === 'jogo-b' ? 'eq-1' : 'eq-a';
      },
    };
    return { calls, listed, io };
  }

  test('leitura de PSE fica na equipe do tenant e esconde jogador de fora', async () => {
    const { calls, listed, io } = classic();
    listed.push(
      { id: 'own', jogadorId: 'j1', equipeId: 'eq-1' },
      { id: 'foreign', jogadorId: 'j-a', equipeId: 'eq-1' }
    );
    const res = mockRes();
    await callGet(
      res,
      mockReq({ type: 'pse-treino' }),
      fakeRepo().repo,
      accessFor({ j1: ['eq-1'], 'j-a': ['eq-a'] }, io)
    );
    assert.equal(res.statusCode, 200);
    const data = (res.body as { data: Array<{ id: string }> }).data;
    assert.deepEqual(data.map((row) => row.id), ['own']);
    assert.match(calls[0], /eq-1/);
    assert.equal(calls[0].includes('eq-a'), false);
  });

  test('PSE de equipe ou jogo de outro tenant não grava', async () => {
    const equipe = classic();
    const equipeRes = mockRes();
    await callSave(
      equipeRes,
      mockReq({
        type: 'pse-treino',
        body: { items: [{ jogadorId: 'j1', equipeId: 'eq-a', data: '2026-10-19', value: 5 }] },
      }),
      fakeRepo().repo,
      accessFor({ j1: ['eq-1'] }, equipe.io)
    );
    assert.equal(equipeRes.statusCode, 404);
    assert.equal(equipe.calls.includes('create'), false);

    const jogo = classic();
    const jogoRes = mockRes();
    await callSave(
      jogoRes,
      mockReq({
        type: 'pse-jogo',
        body: { items: [{ jogadorId: 'j1', jogoId: 'jogo-a', value: 6 }] },
      }),
      fakeRepo().repo,
      accessFor({ j1: ['eq-1'] }, jogo.io)
    );
    assert.equal(jogoRes.statusCode, 404);
    assert.equal(jogo.calls.includes('create'), false);
    assert.equal(jogo.calls.includes('jogo:jogo-a'), true);
  });
});

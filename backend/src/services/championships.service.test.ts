import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { TenantInfo } from '../utils/tenant.helper';
import {
  createChampionship,
  deleteChampionship,
  listChampionships,
  updateChampionship,
  type ChampionshipRow,
  type ChampionshipStore,
} from './championships.service';

const tenantA: TenantInfo = { tecnico_id: 'tec-a', equipe_ids: ['eq-a'] };
const tenantB: TenantInfo = { tecnico_id: 'tec-b', equipe_ids: ['eq-b', 'eq-b2'] };

function seed(): ChampionshipRow[] {
  return [
    {
      id: 'camp-a',
      nome: 'Liga A',
      equipeId: 'eq-a',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      dados: { fase: 'grupos' },
    },
    {
      id: 'camp-b',
      nome: 'Liga B',
      equipeId: 'eq-b',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      dados: { fase: 'final' },
    },
  ];
}

function memory(initial = seed()) {
  const rows = initial.map((row) => ({ ...row, dados: { ...(row.dados as object) } }));
  const calls: string[] = [];
  const store: ChampionshipStore = {
    async listByEquipes(equipeIds) {
      calls.push('list');
      return rows.filter((row) => row.equipeId !== null && equipeIds.includes(row.equipeId));
    },
    async create(data) {
      calls.push(`create:${data.equipeId}`);
      const row: ChampionshipRow = {
        id: `new-${rows.length + 1}`,
        nome: data.nome,
        equipeId: data.equipeId,
        createdAt: new Date('2026-10-19T12:00:00.000Z'),
        dados: data.dados,
      };
      rows.push(row);
      return row;
    },
    async updateInEquipes(id, equipeIds, data) {
      calls.push(`update:${id}`);
      const row = rows.find((item) => item.id === id && item.equipeId !== null && equipeIds.includes(item.equipeId));
      if (!row) return null;
      if (data.nome !== undefined) row.nome = data.nome;
      row.dados = data.dados;
      return { ...row, dados: { ...(row.dados as object) } };
    },
    async deleteInEquipes(id, equipeIds) {
      calls.push(`delete:${id}`);
      const index = rows.findIndex(
        (item) => item.id === id && item.equipeId !== null && equipeIds.includes(item.equipeId)
      );
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
  return { rows, calls, store };
}

describe('campeonatos isolados por tenant', () => {
  test('tenant B só lista os campeonatos das próprias equipes', async () => {
    const db = memory();
    const listed = await listChampionships(db.store, tenantB);
    assert.equal(listed.status, 200);
    const data = listed.body.data as Array<{ id: string }>;
    assert.deepEqual(data.map((row) => row.id), ['camp-b']);
  });

  test('tenant B não cria campeonato na equipe de A', async () => {
    const db = memory();
    const outcome = await createChampionship(db.store, tenantB, {
      name: 'Invasão',
      equipeId: 'eq-a',
    });
    assert.equal(outcome.status, 404);
    assert.equal(db.calls.some((call) => call.startsWith('create:')), false);
    assert.equal(db.rows.some((row) => row.nome === 'Invasão'), false);
  });

  test('create sem equipeId grava na equipe do próprio tenant', async () => {
    const db = memory();
    const outcome = await createChampionship(db.store, tenantB, { name: 'Copa B' });
    assert.equal(outcome.status, 201);
    const data = outcome.body.data as { equipeId: string; name: string };
    assert.equal(data.equipeId, 'eq-b');
    assert.equal(data.name, 'Copa B');
    assert.deepEqual(db.calls, ['create:eq-b']);
  });

  test('create com a segunda equipe do tenant é aceito', async () => {
    const db = memory();
    const outcome = await createChampionship(db.store, tenantB, { name: 'Copa B2', equipeId: 'eq-b2' });
    assert.equal(outcome.status, 201);
    assert.equal((outcome.body.data as { equipeId: string }).equipeId, 'eq-b2');
  });

  test('tenant sem equipe não cria e não lista nada', async () => {
    const db = memory();
    const listed = await listChampionships(db.store, { tecnico_id: 'tec-vazio', equipe_ids: [] });
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.body.data, []);
    assert.equal(db.calls.includes('list'), false);

    const created = await createChampionship(db.store, { equipe_ids: [] }, { name: 'Nada', equipeId: 'eq-a' });
    assert.equal(created.status, 400);
    assert.equal(db.calls.some((call) => call.startsWith('create:')), false);
  });

  test('tenant B não atualiza nem apaga o campeonato de A', async () => {
    const db = memory();
    const updated = await updateChampionship(db.store, tenantB, 'camp-a', { name: 'Roubado' });
    assert.equal(updated.status, 404);
    assert.equal(db.rows.find((row) => row.id === 'camp-a')?.nome, 'Liga A');

    const removed = await deleteChampionship(db.store, tenantB, 'camp-a');
    assert.equal(removed.status, 404);
    assert.equal(db.rows.some((row) => row.id === 'camp-a'), true);
  });

  test('update que tenta mover o campeonato para outra equipe responde 404 e não grava', async () => {
    const db = memory();
    const outcome = await updateChampionship(db.store, tenantB, 'camp-b', {
      name: 'Movido',
      equipeId: 'eq-a',
    });
    assert.equal(outcome.status, 404);
    assert.equal(db.calls.includes('update:camp-b'), false);
    assert.equal(db.rows.find((row) => row.id === 'camp-b')?.nome, 'Liga B');
    assert.equal(db.rows.find((row) => row.id === 'camp-b')?.equipeId, 'eq-b');
  });

  test('tenant B atualiza e apaga só o próprio campeonato', async () => {
    const db = memory();
    const updated = await updateChampionship(db.store, tenantB, 'camp-b', { name: 'Liga B atualizada' });
    assert.equal(updated.status, 200);
    assert.equal((updated.body.data as { name: string; fase: string }).name, 'Liga B atualizada');
    assert.equal((updated.body.data as { fase: string }).fase, undefined);

    const removed = await deleteChampionship(db.store, tenantB, 'camp-b');
    assert.equal(removed.status, 200);
    assert.equal(db.rows.some((row) => row.id === 'camp-b'), false);
    assert.equal(db.rows.some((row) => row.id === 'camp-a'), true);
  });
});

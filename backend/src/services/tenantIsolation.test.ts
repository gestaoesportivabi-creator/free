import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { NotFoundError } from '../utils/errors';
import { assessmentsRepository } from '../repositories/assessments.repository';
import { assessmentsService } from './assessments.service';
import { timeControlsService } from './timeControls.service';
import type { TenantInfo } from '../utils/tenant.helper';

const tenantB: TenantInfo = { tecnico_id: 'tec-b', equipe_ids: ['eq-b'] };

function isNotFound(error: unknown): boolean {
  return error instanceof NotFoundError;
}

describe('avaliações físicas não atravessam o tenant', () => {
  test('listagem consulta só jogadores das equipes do tenant', async () => {
    const queries: unknown[] = [];
    const tx = {
      jogador: {
        async findMany(args: unknown) {
          queries.push(args);
          return [{ id: 'j-b' }];
        },
      },
      avaliacaoFisica: {
        async findMany(args: unknown) {
          queries.push(args);
          return [];
        },
      },
    };

    const rows = await assessmentsRepository.findAll(tenantB, tx as never);
    assert.deepEqual(rows, []);
    assert.deepEqual(queries[0], {
      where: { equipes: { some: { equipeId: { in: ['eq-b'] } } } },
      select: { id: true },
    });
    assert.deepEqual(queries[1], {
      where: { jogadorId: { in: ['j-b'] } },
      orderBy: { data: 'desc' },
    });
  });

  test('getById de avaliação de outro tenant é 404', async () => {
    const tx = {
      avaliacaoFisica: {
        async findUnique() {
          return { id: 'av-a', jogador: { equipes: [] } };
        },
      },
    };
    await assert.rejects(
      () => assessmentsService.getById('av-a', tenantB, tx as never),
      isNotFound
    );
  });

  test('create com jogador de A não grava na avaliação', async () => {
    let created = false;
    const tx = {
      jogador: {
        async findMany() {
          return [];
        },
      },
      avaliacaoFisica: {
        async create() {
          created = true;
          return {};
        },
      },
    };
    await assert.rejects(
      () => assessmentsService.create({ playerId: 'j-a', date: '2026-10-19', weight: 70 }, tenantB, tx as never),
      isNotFound
    );
    assert.equal(created, false);
  });

  test('update não aplica campos se o jogador do corpo é de outro tenant', async () => {
    let updated = false;
    const tx = {
      jogador: {
        async findMany() {
          return [];
        },
      },
      avaliacaoFisica: {
        async findUnique() {
          return {
            id: 'av-b',
            jogadorId: 'j-b',
            data: new Date('2026-10-19T00:00:00.000Z'),
            jogador: { equipes: [{ equipeId: 'eq-b' }] },
          };
        },
        async update() {
          updated = true;
          return {};
        },
      },
    };
    await assert.rejects(
      () => assessmentsService.update('av-b', { playerId: 'j-a', weight: 80 }, tenantB, tx as never),
      isNotFound
    );
    assert.equal(updated, false);
  });

  test('create do próprio jogador grava', async () => {
    const tx = {
      jogador: {
        async findMany() {
          return [{ id: 'j-b' }];
        },
      },
      avaliacaoFisica: {
        async create(args: { data: { jogadorId: string; peso: number } }) {
          return {
            id: 'av-b',
            jogadorId: args.data.jogadorId,
            data: new Date('2026-10-19T12:00:00.000Z'),
            peso: args.data.peso,
            altura: null,
            gorduraCorporal: null,
            massaMuscular: null,
            vo2max: null,
            flexibilidade: null,
            velocidade: null,
            forca: null,
            agilidade: null,
            peitoral: null,
            axilar: null,
            subescapular: null,
            triceps: null,
            abdominal: null,
            suprailiaca: null,
            coxa: null,
            planoAcao: null,
            createdAt: new Date('2026-10-19T12:00:00.000Z'),
          };
        },
      },
    };
    const created = await assessmentsService.create(
      { playerId: 'j-b', date: '2026-10-19', weight: 71 },
      tenantB,
      tx as never
    );
    assert.equal(created.playerId, 'j-b');
    assert.equal(created.weight, 71);
  });
});

describe('controle de tempo não atravessa o tenant', () => {
  function clockDb(matchEquipe: string, playersInB: string[], events: Array<{ jogadorId: string }> = []) {
    const calls: string[] = [];
    const tx = {
      jogo: {
        async findUnique() {
          calls.push('jogo');
          return { id: 'match-1', equipeId: matchEquipe };
        },
      },
      jogador: {
        async findMany(args: { where: { id: { in: string[] }; equipes: { some: { equipeId: { in: string[] } } } } }) {
          calls.push('jogador');
          const ids = args.where.id.in;
          const teams = args.where.equipes.some.equipeId.in;
          return ids
            .filter((id) => playersInB.includes(id) && teams.includes('eq-b'))
            .map((id) => ({ id }));
        },
      },
      jogosEventos: {
        async findMany() {
          calls.push('eventos');
          return events.map((event, index) => ({
            id: `e-${index}`,
            jogoId: 'match-1',
            jogadorId: event.jogadorId,
            tipoEvento: 'ENTRADA' as const,
            minuto: 1,
            segundo: 0,
            createdAt: new Date('2026-10-19T12:00:00.000Z'),
          }));
        },
        async deleteMany() {
          calls.push('delete');
          return { count: 1 };
        },
        async create(args: { data: { jogadorId: string; tipoEvento: string } }) {
          calls.push(`create:${args.data.jogadorId}`);
          return { id: 'new', jogoId: 'match-1', minuto: 0, segundo: 0, createdAt: new Date(), ...args.data };
        },
      },
    };
    return { tx: tx as never, calls };
  }

  test('tenant B não lê o jogo de A', async () => {
    const db = clockDb('eq-a', ['j-a'], [{ jogadorId: 'j-a' }]);
    await assert.rejects(() => timeControlsService.getByMatchId('match-1', tenantB, db.tx), isNotFound);
    assert.deepEqual(db.calls, ['jogo']);
  });

  test('leitura do próprio jogo esconde jogador de outro tenant', async () => {
    const db = clockDb('eq-b', ['j-b'], [{ jogadorId: 'j-a' }, { jogadorId: 'j-b' }]);
    const rows = await timeControlsService.getByMatchId('match-1', tenantB, db.tx);
    assert.deepEqual(rows.map((row) => row.playerId), ['j-b']);
  });

  test('salvar jogador de A no jogo de B não apaga os eventos', async () => {
    const db = clockDb('eq-b', ['j-b']);
    await assert.rejects(
      () =>
        timeControlsService.saveForMatch(
          'match-1',
          [{ playerId: 'j-a', timeEntries: [{ entryTime: '00:10', exitTime: '00:20' }] } as never],
          tenantB,
          db.tx
        ),
      isNotFound
    );
    assert.equal(db.calls.includes('delete'), false);
    assert.equal(db.calls.includes('jogador'), true);
    assert.ok(db.calls.indexOf('jogador') > db.calls.indexOf('jogo'));
  });

  test('salvar no jogo de A não apaga os eventos de A', async () => {
    const db = clockDb('eq-a', ['j-a']);
    await assert.rejects(
      () =>
        timeControlsService.saveForMatch(
          'match-1',
          [{ playerId: 'j-a', timeEntries: [{ entryTime: '00:10' }] } as never],
          tenantB,
          db.tx
        ),
      isNotFound
    );
    assert.deepEqual(db.calls, ['jogo']);
  });

  test('salvar o próprio jogador só apaga depois da validação', async () => {
    const db = clockDb('eq-b', ['j-b']);
    await timeControlsService.saveForMatch(
      'match-1',
      [{ playerId: 'j-b', timeEntries: [{ entryTime: '01:00', exitTime: '02:00' }] } as never],
      tenantB,
      db.tx
    );
    const deleteAt = db.calls.indexOf('delete');
    const playerAt = db.calls.indexOf('jogador');
    assert.ok(playerAt >= 0 && deleteAt > playerAt);
    assert.equal(db.calls.includes('create:j-b'), true);
    assert.equal(db.calls.includes('create:j-a'), false);
  });
});

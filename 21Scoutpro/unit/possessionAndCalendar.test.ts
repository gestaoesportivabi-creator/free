import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  possessionShare,
  preservePossessionSeconds,
  readPossessionSeconds,
} from '../utils/possessionStats';
import {
  collectionCountsAsFinalized,
  dropUncollectedFixtureShells,
  findSavedMatchForAgenda,
} from '../utils/calendarListStatus';

const clockEnded = {
  clockSnapshot: { state: 'ENCERRADO' as const },
};

describe('posse de bola no Scout Coletivo', () => {
  test('lê os segundos gravados só no lineup quando o topo da partida veio vazio', () => {
    const posse = readPossessionSeconds({
      possessionSecondsWith: 0,
      possessionSecondsWithout: 0,
      lineup: { possessionSecondsWith: 70, possessionSecondsWithout: 30 },
    });
    assert.deepEqual(posse, { withBall: 70, withoutBall: 30 });
    assert.deepEqual(possessionShare(posse), { us: 70, opponent: 30 });
  });

  test('sem segundos em lugar nenhum não inventa posse', () => {
    const posse = readPossessionSeconds({ lineup: { possessionSecondsWith: 0, possessionSecondsWithout: 0 } });
    assert.equal(possessionShare(posse), null);
  });

  test('save pós-jogo não apaga a posse que o ao vivo já gravou', () => {
    const merged = preservePossessionSeconds(
      { players: ['p1'], ballPossessionStart: 'us' },
      { players: ['p1'], possessionSecondsWith: 80, possessionSecondsWithout: 40 }
    );
    assert.equal(merged.possessionSecondsWith, 80);
    assert.equal(merged.possessionSecondsWithout, 40);
  });
});

describe('lista de partidas depois de finalizar', () => {
  test('status disponivel com relógio encerrado e fita conta como finalizado', () => {
    assert.equal(
      collectionCountsAsFinalized({
        status: 'disponivel',
        postMatchEventCount: 21,
        lineup: clockEnded,
      }),
      true
    );
  });

  test('em andamento explícito continua incompleto', () => {
    assert.equal(
      collectionCountsAsFinalized({
        status: 'em_andamento',
        postMatchEventCount: 21,
        lineup: clockEnded,
      }),
      false
    );
  });

  test('agenda deixa de apontar para o shell disponível quando a coleta existe', () => {
    const shell = {
      id: 'shell',
      date: '2026-10-19',
      opponent: 'Rival QA 1849',
      competition: 'Amistoso',
      status: 'disponivel',
    };
    const collected = {
      id: 'jogo-1849',
      date: '2026-10-19',
      opponent: 'Rival QA 1849',
      competition: 'Amistoso',
      status: 'disponivel',
      postMatchEventCount: 21,
      lineup: clockEnded,
    };
    const visible = dropUncollectedFixtureShells([shell, collected]);
    assert.deepEqual(visible.map((match) => match.id), ['jogo-1849']);
    const linked = findSavedMatchForAgenda(
      { id: 'agenda-1', date: '2026-10-19', opponent: 'Rival QA 1849', competition: 'Amistoso' },
      [shell, collected]
    );
    assert.equal(linked?.id, 'jogo-1849');
    assert.equal(collectionCountsAsFinalized(linked!), true);
  });

  test('jogoId da agenda acha a coleta mesmo com adversário diferente', () => {
    const collected = {
      id: 'jogo-1849',
      date: '2026-10-19',
      opponent: 'Outro nome',
      status: 'encerrado',
      postMatchEventCount: 21,
      lineup: clockEnded,
    };
    const linked = findSavedMatchForAgenda(
      { id: 'agenda-1', date: '2026-10-19', opponent: 'Rival QA 1849', jogoId: 'jogo-1849' },
      [collected]
    );
    assert.equal(linked?.id, 'jogo-1849');
  });
});

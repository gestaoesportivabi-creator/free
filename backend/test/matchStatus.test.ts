import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { inferStatusFromData, statusToPersist } from '../src/services/matchStatus';
import { MatchRecord } from '../src/types/frontend';

function match(partial: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: 'jogo-1',
    opponent: 'Rival',
    date: '2026-10-19',
    result: 'E',
    goalsFor: 0,
    goalsAgainst: 0,
    playerStats: {},
    teamStats: {
      goals: 0,
      assists: 0,
      passesCorrect: 0,
      passesWrong: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      tacklesWithBall: 0,
      tacklesWithoutBall: 0,
      tacklesCounterAttack: 0,
      transitionErrors: 0,
    },
    ...partial,
  };
}

const events = [{ id: 'e1' }];
const clockEnded = {
  players: ['a'],
  clockSnapshot: { state: 'ENCERRADO', currentTimeSeconds: 22, period: '2T' },
};

describe('status da partida não regride', () => {
  test('encerrado explícito permanece encerrado no segundo tempo', () => {
    assert.equal(
      inferStatusFromData('encerrado', match(), {
        collectionPhase: 2,
        postMatchEventCount: 115,
        lineup: clockEnded,
      }),
      'encerrado'
    );
  });

  test('em_andamento explícito com relógio ENCERRADO continua em andamento', () => {
    assert.equal(
      inferStatusFromData('em_andamento', match(), {
        collectionPhase: 2,
        postMatchEventCount: 21,
        lineup: clockEnded,
      }),
      'em_andamento'
    );
  });

  test('sem status, relógio ENCERRADO e fita não viram em andamento por causa da fase 2', () => {
    assert.equal(
      inferStatusFromData(undefined, match(), {
        collectionPhase: 2,
        postMatchEventLog: events,
        lineup: clockEnded,
      }),
      'encerrado'
    );
  });

  test('segundo tempo ainda aberto, sem encerrar o relógio, continua em andamento', () => {
    assert.equal(
      inferStatusFromData(undefined, match(), {
        collectionPhase: 2,
        postMatchEventCount: 4,
        lineup: { clockSnapshot: { state: 'PAUSADO' } },
      }),
      'em_andamento'
    );
  });

  test('autosave em_andamento não rebaixa encerrado; em_andamento segue incompleto', () => {
    assert.equal(statusToPersist('encerrado', 'em_andamento'), 'encerrado');
    assert.equal(statusToPersist('encerrado', 'disponivel'), 'encerrado');
    assert.equal(statusToPersist('em_andamento', 'encerrado'), 'encerrado');
    assert.equal(statusToPersist('em_andamento', 'em_andamento'), 'em_andamento');
    assert.equal(statusToPersist('disponivel', 'em_andamento'), 'em_andamento');
    assert.equal(statusToPersist(undefined, 'nao_executado'), 'nao_executado');
    assert.equal(statusToPersist('disponivel', 'valor-invalido'), undefined);
  });
});

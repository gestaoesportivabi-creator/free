import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { inferStatusFromData, statusToPersist } from '../src/services/matchStatus';
import { MatchRecord } from '../src/types/frontend';

function match(partial: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: 'jogo-1',
    opponent: 'Rival',
    date: '2026-10-25',
    result: 'E',
    goalsFor: 0,
    goalsAgainst: 0,
    playerStats: { p1: { goals: 0, assists: 0, passesCorrect: 98, passesWrong: 0, shotsOnTarget: 0, shotsOffTarget: 0, tacklesWithBall: 0, tacklesWithoutBall: 0, tacklesCounterAttack: 0, transitionErrors: 0 } },
    teamStats: {
      goals: 0,
      assists: 0,
      passesCorrect: 98,
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

function emptyMatch(): MatchRecord {
  return match({
    playerStats: {},
    teamStats: {
      goals: 0,
      goalsConceded: 0,
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
  });
}

const events = [{ id: 'e1' }];
const clockEnded = {
  players: ['a'],
  clockSnapshot: { state: 'ENCERRADO', currentTimeSeconds: 93, period: '2T' },
};

describe('status da partida depois de finalizar', () => {
  test('encerrado explícito permanece encerrado mesmo no segundo tempo', () => {
    assert.equal(
      inferStatusFromData('encerrado', match(), {
        collectionPhase: 2,
        postMatchEventCount: 112,
        lineup: clockEnded,
      }),
      'encerrado'
    );
  });

  test('sem status gravado, relógio ENCERRADO e fita não viram em andamento', () => {
    assert.equal(
      inferStatusFromData(undefined, match({ playerStats: {}, teamStats: { ...match().teamStats, passesCorrect: 0 } }), {
        collectionPhase: 2,
        postMatchEventLog: events,
        lineup: clockEnded,
      }),
      'encerrado'
    );
  });

  test('coleta ainda no segundo tempo, sem encerrar o relógio, continua em andamento', () => {
    assert.equal(
      inferStatusFromData(undefined, match({ playerStats: {}, teamStats: { ...match().teamStats, passesCorrect: 0 } }), {
        collectionPhase: 2,
        postMatchEventCount: 4,
        lineup: { clockSnapshot: { state: 'PAUSADO' } },
      }),
      'em_andamento'
    );
  });

  test('disponivel gravado com relógio encerrado e fita vira encerrado na leitura', () => {
    assert.equal(
      inferStatusFromData('disponivel', match({ goalsFor: 3 }), {
        collectionPhase: 2,
        postMatchEventCount: 21,
        lineup: clockEnded,
      }),
      'encerrado'
    );
  });

  test('disponivel com coleta encerrada é o que persiste, sem rebaixar em_andamento', () => {
    assert.equal(
      statusToPersist('disponivel', 'disponivel', { clockState: 'ENCERRADO', eventCount: 21 }),
      'encerrado'
    );
    assert.equal(
      statusToPersist('disponivel', 'em_andamento', { clockState: 'ENCERRADO', eventCount: 21 }),
      'em_andamento'
    );
  });

  test('autosave em_andamento não rebaixa uma partida já encerrada', () => {
    assert.equal(statusToPersist('encerrado', 'em_andamento'), 'encerrado');
    assert.equal(statusToPersist('encerrado', 'disponivel'), 'encerrado');
    assert.equal(statusToPersist('em_andamento', 'encerrado'), 'encerrado');
    assert.equal(statusToPersist('em_andamento', 'em_andamento'), 'em_andamento');
    assert.equal(statusToPersist(undefined, 'nao_executado'), 'nao_executado');
    assert.equal(statusToPersist('disponivel', 'valor-invalido'), undefined);
  });
});

describe('partida sem coleta não é incompleta', () => {
  test('em_andamento sem fita, sem relógio e sem estatística volta a disponível', () => {
    assert.equal(inferStatusFromData('em_andamento', emptyMatch()), 'disponivel');
    assert.equal(
      inferStatusFromData('em_andamento', emptyMatch(), {
        collectionPhase: 2,
        lineup: { players: ['p1'], clockSnapshot: { state: 'PRE_JOGO' } },
      }),
      'disponivel'
    );
  });

  test('coleta real continua em andamento e encerrado não regride', () => {
    assert.equal(
      inferStatusFromData('em_andamento', emptyMatch(), { postMatchEventCount: 3 }),
      'em_andamento'
    );
    assert.equal(
      inferStatusFromData('em_andamento', emptyMatch(), {
        lineup: { clockSnapshot: { state: 'PAUSADO', currentTimeSeconds: 120 } },
      }),
      'em_andamento'
    );
    assert.equal(inferStatusFromData('em_andamento', match()), 'em_andamento');
    assert.equal(inferStatusFromData('encerrado', emptyMatch()), 'encerrado');
    assert.equal(statusToPersist('encerrado', 'em_andamento'), 'encerrado');
    assert.equal(statusToPersist('encerrado', 'disponivel'), 'encerrado');
  });
});

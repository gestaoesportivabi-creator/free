import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeLineupPreservingClockSnapshot } from '../src/services/matchLineupClock';
import { statusToPersist } from '../src/services/matchStatus';
import { isLineupOnlyWrite, resolveLineupOnlyUpdate } from '../src/services/lineupOnlyUpdate';

const clock = {
  currentTimeSeconds: 640,
  period: '1T' as const,
  state: 'PAUSADO',
  isRunning: false,
  firstHalfLocked: false,
};

describe('PUT de escalação não apaga o jogo', () => {
  it('jogo com placar e estatística mantém tudo quando o PUT só manda a escalação', () => {
    const existingLineup = {
      players: ['antigo'],
      bench: [],
      ballPossessionStart: 'us',
      clockSnapshot: clock,
    };
    const incoming = {
      result: 'E',
      goalsFor: 0,
      goalsAgainst: 0,
      status: 'disponivel',
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
      playerStats: {},
      lineup: {
        players: ['gk', '3', '4', '5', '6'],
        bench: ['7'],
        selectedPlayerIds: ['gk', '3', '4', '5', '6', '7'],
        kickoffTime: '20:00',
      },
    };

    assert.equal(isLineupOnlyWrite(incoming), true);
    const sheet = resolveLineupOnlyUpdate(
      { resultado: 'V', golsPro: 3, golsContra: 1 },
      incoming
    );
    assert.equal(sheet.lineupOnly, true);
    assert.equal(sheet.golsPro, 3);
    assert.equal(sheet.golsContra, 1);
    assert.equal(sheet.resultado, undefined);
    assert.equal(sheet.applyTeamStats, false);
    assert.equal(sheet.applyPlayerStats, false);

    const lineup = mergeLineupPreservingClockSnapshot(existingLineup, incoming.lineup) as {
      players: string[];
      clockSnapshot: { state: string; currentTimeSeconds: number };
    };
    assert.deepEqual(lineup.players, ['gk', '3', '4', '5', '6']);
    assert.equal(lineup.clockSnapshot.state, 'PAUSADO');
    assert.equal(lineup.clockSnapshot.currentTimeSeconds, 640);
    assert.equal(statusToPersist('encerrado', incoming.status), 'encerrado');
  });

  it('save com fita ou estatística nova continua gravando placar e números', () => {
    const withTape = resolveLineupOnlyUpdate(
      { resultado: 'E', golsPro: 0, golsContra: 0 },
      {
        result: 'V',
        goalsFor: 2,
        goalsAgainst: 1,
        teamStats: { goals: 2, passesCorrect: 8 },
        playerStats: { p1: { goals: 2 } },
        postMatchEventLog: [{ id: 'e1' }],
        lineup: { players: ['p1'] },
      }
    );
    assert.equal(withTape.lineupOnly, false);
    assert.equal(withTape.golsPro, 2);
    assert.equal(withTape.golsContra, 1);
    assert.equal(withTape.resultado, 'V');
    assert.equal(withTape.applyTeamStats, true);
    assert.equal(withTape.applyPlayerStats, true);
  });
});

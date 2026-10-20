import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  findCollectedMatchForFixture,
  resolveRealtimeOpenTarget,
  shouldResumeRealtimeCollection,
} from '../utils/reopenRealtimeCollection';
import { findSavedMatchForAgenda } from '../utils/calendarListStatus';
import { splitChampionshipFixtures } from '../utils/championshipMatchBuckets';
import { replaceMatchInList } from '../utils/matchListState';
import type { MatchRecord } from '../types';

const clock = {
  currentTimeSeconds: 93,
  period: '2T' as const,
  state: 'ENCERRADO' as const,
  isRunning: false,
  firstHalfLocked: true,
};

function saved(partial: Partial<MatchRecord> & { id: string }): MatchRecord {
  return {
    opponent: 'Rival QA',
    date: '2026-10-25',
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

describe('reabrir scout em tempo real na coleta existente', () => {
  test('id da agenda não abre scout novo se já existe coleta encerrada da mesma partida', () => {
    const collected = saved({
      id: 'jogo-1',
      status: 'encerrado',
      postMatchEventCount: 112,
      lineup: { players: ['a'], bench: [], ballPossessionStart: 'us', clockSnapshot: clock },
    });
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'agenda-futura',
      fetched: null,
      catalog: [collected],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso' },
    });

    assert.equal(resolution.ignoredForeignId, true);
    assert.equal(resolution.match?.id, 'jogo-1');
    assert.equal(shouldResumeRealtimeCollection(resolution.match), true);
  });

  test('partida encerrada com fita e relógio é a coleta a hidratar', () => {
    const full = saved({
      id: 'jogo-1',
      status: 'encerrado',
      postMatchEventLog: [{ id: 'e1' } as never],
      lineup: { players: ['a'], bench: [], ballPossessionStart: 'us', clockSnapshot: clock },
    });
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'jogo-1',
      fetched: full,
      catalog: [],
      fixture: { date: full.date, opponent: full.opponent },
    });
    assert.equal(resolution.match?.id, 'jogo-1');
    assert.equal(resolution.ignoredForeignId, false);
  });

  test('escalação gravada sem relógio e sem fita reabre a mesma partida', () => {
    const lineupOnly = saved({
      id: 'jogo-disp',
      status: 'disponivel',
      postMatchEventCount: 0,
      postMatchEventLog: [],
      kickoffTime: '20:00',
      lineup: {
        players: ['gk', '3', '4', '5', '6'],
        bench: ['7'],
        ballPossessionStart: 'us',
        selectedPlayerIds: ['gk', '3', '4', '5', '6', '7'],
        kickoffTime: '20:00',
      },
    });
    assert.equal(shouldResumeRealtimeCollection(lineupOnly), true);
    assert.equal(
      findCollectedMatchForFixture(
        [lineupOnly],
        { date: '2026-10-25', opponent: 'Rival QA', time: '20:00' }
      )?.id,
      'jogo-disp'
    );
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'sched-agenda-1',
      fetched: null,
      catalog: [lineupOnly],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', time: '20:00' },
      scheduledBaseCount: 1,
    });
    assert.equal(resolution.match?.id, 'jogo-disp');
    assert.notEqual(resolution.match?.id, 'sched-agenda-1');
  });

  test('partida disponível sem escalação, fita ou relógio não vira coleta', () => {
    const empty = saved({
      id: 'jogo-vazio',
      status: 'disponivel',
      postMatchEventCount: 0,
      postMatchEventLog: [],
    });
    assert.equal(shouldResumeRealtimeCollection(empty), false);
    assert.equal(
      findCollectedMatchForFixture([empty], { date: '2026-10-25', opponent: 'Rival QA' }),
      null
    );
  });

  test('sem coleta anterior, o id de agenda é ignorado para não gravar em cima dele', () => {
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'agenda-futura',
      fetched: null,
      catalog: [],
      fixture: { date: '2026-10-25', opponent: 'Rival QA' },
    });
    assert.equal(resolution.match, null);
    assert.equal(resolution.ignoredForeignId, true);
  });

  test('4 a 3 não confunde a busca: outra data não reaproveita a coleta', () => {
    const other = saved({
      id: 'jogo-outro',
      date: '2026-10-20',
      status: 'encerrado',
      postMatchEventCount: 10,
    });
    assert.equal(
      findCollectedMatchForFixture([other], { date: '2026-10-25', opponent: 'Rival QA' }),
      null
    );
  });
});

describe('dois jogos no mesmo dia contra o mesmo adversário', () => {
  const agendas = [
    { id: 'agenda-20', date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '20:00' },
    { id: 'agenda-22', date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '22:00' },
  ];
  const at20 = saved({
    id: 'jogo-20',
    competition: 'Amistoso',
    status: 'encerrado',
    postMatchEventCount: 21,
    kickoffTime: '20:00',
    lineup: { players: ['a'], bench: [], ballPossessionStart: 'us', clockSnapshot: clock, kickoffTime: '20:00' },
  });
  const at22 = saved({
    id: 'jogo-22',
    competition: 'Amistoso',
    status: 'em_andamento',
    postMatchEventCount: 4,
    kickoffTime: '22:00',
    lineup: { players: ['b'], bench: [], ballPossessionStart: 'opponent', kickoffTime: '22:00' },
  });

  test('os dois cards seguem visíveis e cada um abre a própria coleta', () => {
    assert.equal(findSavedMatchForAgenda(agendas[0], [at20, at22], agendas)?.id, 'jogo-20');
    assert.equal(findSavedMatchForAgenda(agendas[1], [at20, at22], agendas)?.id, 'jogo-22');

    const open20 = resolveRealtimeOpenTarget({
      requestedId: 'agenda-20',
      fetched: null,
      catalog: [at20, at22],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '20:00' },
      scheduledBaseCount: 2,
    });
    const open22 = resolveRealtimeOpenTarget({
      requestedId: 'agenda-22',
      fetched: null,
      catalog: [at20, at22],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '22:00' },
      scheduledBaseCount: 2,
    });
    assert.equal(open20.match?.id, 'jogo-20');
    assert.equal(open22.match?.id, 'jogo-22');
  });

  test('finalizar o das 20h não esconde nem reabre o das 22h', () => {
    const finalized = { ...at20, status: 'encerrado' as const };
    const split = splitChampionshipFixtures(
      [
        { ...agendas[0], jogoId: 'jogo-20' },
        agendas[1],
      ],
      [finalized],
      new Date(2026, 9, 19)
    );
    assert.deepEqual(split.past.map((item) => item.id), ['agenda-20']);
    assert.deepEqual(split.future.map((item) => item.id), ['agenda-22']);

    const open22 = resolveRealtimeOpenTarget({
      requestedId: 'agenda-22',
      fetched: null,
      catalog: [finalized],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '22:00' },
      scheduledBaseCount: 2,
    });
    assert.equal(open22.match, null);
    assert.equal(findSavedMatchForAgenda(agendas[1], [finalized], agendas), null);
    assert.equal(findSavedMatchForAgenda({ ...agendas[0], jogoId: 'jogo-20' }, [finalized], agendas)?.id, 'jogo-20');
  });

  test('sem horário gravado e dois cards, não vincula a coleta do outro', () => {
    const timeless = saved({
      id: 'jogo-x',
      status: 'encerrado',
      postMatchEventCount: 8,
    });
    assert.equal(findSavedMatchForAgenda(agendas[0], [timeless], agendas), null);
    assert.equal(findSavedMatchForAgenda(agendas[1], [timeless], agendas), null);
  });

  test('partida finalizada aberta pelo id do jogo não usa o outro horário', () => {
    const resolution = resolveRealtimeOpenTarget({
      requestedId: 'jogo-20',
      fetched: at20,
      catalog: [at22],
      fixture: { date: '2026-10-25', opponent: 'Rival QA', competition: 'Amistoso', time: '20:00' },
      scheduledBaseCount: 2,
    });
    assert.equal(resolution.match?.id, 'jogo-20');
    assert.equal(resolution.ignoredForeignId, false);
  });
});

describe('lista depois de Finalizar', () => {
  const today = new Date(2026, 9, 19);

  test('partida futura da tabela passa a passada quando o jogo encerrado entra na lista', () => {
    const scheduled = [{
      id: 'agenda-1',
      date: '2026-10-25',
      opponent: 'Rival QA',
      time: '20:00',
    }];
    const before = splitChampionshipFixtures(scheduled, [], today);
    assert.deepEqual(before.future.map((item) => item.id), ['agenda-1']);
    assert.deepEqual(before.past, []);

    const stale: MatchRecord[] = [];
    const finalized = saved({ id: 'jogo-1', status: 'encerrado', postMatchEventCount: 112 });
    const fresh = replaceMatchInList(stale, finalized);
    const after = splitChampionshipFixtures(scheduled, fresh, today);
    assert.deepEqual(after.past.map((item) => item.id), ['agenda-1']);
    assert.deepEqual(after.future, []);
  });

  test('jogoId vinculado também tira a partida das futuras', () => {
    const split = splitChampionshipFixtures(
      [{ id: 'agenda-1', date: '2026-11-02', opponent: 'Nome diferente', jogoId: 'jogo-1' }],
      [saved({ id: 'jogo-1', opponent: 'Outro', date: '2026-11-02', status: 'encerrado' })],
      today
    );
    assert.equal(split.past.length, 1);
    assert.equal(split.future.length, 0);
  });
});

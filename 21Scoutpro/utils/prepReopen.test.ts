import { describe, expect, it } from 'vitest';
import {
  agendaCanOpenPreparation,
  benchForLineupModal,
  clearExplicitScoutStart,
  consumeOpenPrep,
  hasExplicitScoutStart,
  isExplicitScoutStart,
  markExplicitScoutStart,
  OPEN_PREP_KEY,
  pickDefaultLineup,
  prepReopenTarget,
  REALTIME_FRESH_KEY,
  realtimeEntryDecision,
  shouldReturnUnconfirmedRealtimeToPrep,
  splitCourtAndBench,
  stashOpenPrep,
} from './prepReopen';

const manual = ['2', '7', '8', '9', '10'];

function storageMock(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('reabrir a seleção manual na Preparação', () => {
  it('convocação sem posse, sem relógio e sem fita reabre na Preparação', () => {
    const draft = {
      status: 'disponivel' as const,
      postMatchEventCount: 0,
      teamStats: { goals: 0, passesCorrect: 0 },
      playerStats: {},
      lineup: { players: [], selectedPlayerIds: manual },
    };
    expect(prepReopenTarget(draft)).toBe('preparation');
    expect(shouldReturnUnconfirmedRealtimeToPrep(draft, false)).toBe(true);
    expect(shouldReturnUnconfirmedRealtimeToPrep(draft, true)).toBe(false);
  });

  it('Iniciar Scout da Partida não volta para a Preparação, nem numa segunda leitura', () => {
    const previousSession = globalThis.sessionStorage;
    globalThis.sessionStorage = storageMock();
    const fresh = {
      status: 'disponivel' as const,
      postMatchEventCount: 0,
      teamStats: { goals: 0, passesCorrect: 0 },
      playerStats: {},
      lineup: {
        players: [] as string[],
        selectedPlayerIds: manual,
        clockSnapshot: { state: 'PRE_JOGO' },
      },
    };
    try {
      markExplicitScoutStart();
      const payload = { explicitStart: true as const };
      const stay = () => isExplicitScoutStart(payload);
      expect(stay()).toBe(true);
      expect(realtimeEntryDecision(fresh, stay())).toBe('collection');
      expect(shouldReturnUnconfirmedRealtimeToPrep(fresh, stay())).toBe(false);
      expect(hasExplicitScoutStart()).toBe(true);
      expect(sessionStorage.getItem(REALTIME_FRESH_KEY)).toBe('1');
      expect(shouldReturnUnconfirmedRealtimeToPrep(fresh, stay())).toBe(false);

      expect(realtimeEntryDecision(fresh, true)).toBe('collection');

      clearExplicitScoutStart();
      expect(hasExplicitScoutStart()).toBe(false);
      expect(isExplicitScoutStart({ explicitStart: true })).toBe(true);
      expect(shouldReturnUnconfirmedRealtimeToPrep(fresh, isExplicitScoutStart({ explicitStart: true }))).toBe(false);
      expect(prepReopenTarget(fresh)).toBe('preparation');
      expect(realtimeEntryDecision(fresh, false)).toBe('preparation');
      expect(shouldReturnUnconfirmedRealtimeToPrep(fresh, isExplicitScoutStart({}))).toBe(true);
    } finally {
      globalThis.sessionStorage = previousSession;
    }
  });

  it('a marca de iniciar não some na primeira leitura; sair da coleta apaga', () => {
    const previousLocal = globalThis.localStorage;
    const previousSession = globalThis.sessionStorage;
    globalThis.localStorage = storageMock();
    globalThis.sessionStorage = storageMock();
    try {
      markExplicitScoutStart();
      expect(hasExplicitScoutStart()).toBe(true);
      expect(hasExplicitScoutStart()).toBe(true);
      expect(sessionStorage.getItem(REALTIME_FRESH_KEY)).toBe('1');
      clearExplicitScoutStart();
      expect(hasExplicitScoutStart()).toBe(false);

      stashOpenPrep({ matchId: 'jogo-prep', agendaMatchId: 'agenda-prep' });
      expect(localStorage.getItem(OPEN_PREP_KEY)).toContain('jogo-prep');
      expect(consumeOpenPrep()).toEqual({ matchId: 'jogo-prep', agendaMatchId: 'agenda-prep' });
      expect(consumeOpenPrep()).toBeNull();
    } finally {
      globalThis.localStorage = previousLocal;
      globalThis.sessionStorage = previousSession;
    }
  });

  it('5 titulares com posse, relógio de verdade ou encerrado não voltam para a Preparação', () => {
    expect(prepReopenTarget({
      lineup: {
        players: manual,
        selectedPlayerIds: manual,
        ballPossessionStart: 'us',
        clockSnapshot: { state: 'PRE_JOGO' },
      },
    })).toBe('collection');
    expect(prepReopenTarget({
      lineup: {
        players: manual,
        selectedPlayerIds: manual,
        ballPossessionStart: 'us',
        clockSnapshot: { state: 'PAUSADO' },
      },
    })).toBe('collection');
    expect(prepReopenTarget({
      status: 'encerrado',
      lineup: { selectedPlayerIds: manual },
    })).toBe('collection');
    expect(prepReopenTarget({
      postMatchEventCount: 1,
      lineup: { selectedPlayerIds: manual, clockSnapshot: { state: 'PRE_JOGO' } },
    })).toBe('collection');
    expect(shouldReturnUnconfirmedRealtimeToPrep({
      lineup: { players: manual, ballPossessionStart: 'opponent' },
    }, false)).toBe(false);
  });

  it('tabela abre a Preparação sem coleta ou com convocação, e não abre a encerrada', () => {
    expect(agendaCanOpenPreparation(null)).toBe(true);
    expect(agendaCanOpenPreparation({
      status: 'disponivel',
      postMatchEventCount: 0,
      lineup: { selectedPlayerIds: manual, clockSnapshot: { state: 'PRE_JOGO' } },
    })).toBe(true);
    expect(agendaCanOpenPreparation({ status: 'encerrado', lineup: { selectedPlayerIds: manual } })).toBe(false);
    expect(agendaCanOpenPreparation({
      lineup: { players: manual, selectedPlayerIds: manual, ballPossessionStart: 'us' },
    })).toBe(false);
    const convocation = {
      status: 'disponivel' as const,
      postMatchEventCount: 0,
      lineup: { selectedPlayerIds: manual, clockSnapshot: { state: 'PRE_JOGO' } },
    };
    expect(realtimeEntryDecision(convocation, true)).toBe('collection');
    expect(realtimeEntryDecision(convocation, false)).toBe('preparation');
  });

  it('PRE_JOGO sozinho não confirma a coleta', () => {
    expect(prepReopenTarget({
      lineup: {
        selectedPlayerIds: manual,
        clockSnapshot: { state: 'PRE_JOGO' },
      },
    })).toBe('preparation');
  });

  it('o padrão 1+4 sai da convocação, não do elenco do clube', () => {
    const club = [
      { id: '1', position: 'Goleiro', jerseyNumber: 1, name: 'GK Um' },
      { id: '2', position: 'Goleiro', jerseyNumber: 2, name: 'GK Dois' },
      { id: '3', position: 'Ala', jerseyNumber: 3, name: 'Tres' },
      { id: '4', position: 'Ala', jerseyNumber: 4, name: 'Quatro' },
      { id: '5', position: 'Fixo', jerseyNumber: 5, name: 'Cinco' },
      { id: '6', position: 'Pivo', jerseyNumber: 6, name: 'Seis' },
      { id: '7', position: 'Ala', jerseyNumber: 7, name: 'Sete' },
      { id: '8', position: 'Ala', jerseyNumber: 8, name: 'Oito' },
      { id: '9', position: 'Pivo', jerseyNumber: 9, name: 'Nove' },
      { id: '10', position: 'Pivo', jerseyNumber: 10, name: 'Dez' },
    ];
    const convocation = club.filter((athlete) => manual.includes(athlete.id));
    expect(pickDefaultLineup(convocation)).toEqual({
      court: ['2', '7', '8', '9', '10'],
      bench: [],
    });
    expect(pickDefaultLineup(club)?.court).toEqual(['1', '3', '4', '5', '6']);
    expect(pickDefaultLineup([{ id: '2', position: 'Goleiro', jerseyNumber: 2 }])).toBeNull();
  });

  it('o banco do modal não troca a convocação pelo elenco inteiro', () => {
    const roster = Array.from({ length: 14 }, (_, index) => String(index + 1));
    expect(benchForLineupModal({
      selectedPlayerIds: manual,
      lineup: { selectedPlayerIds: manual },
      rosterIds: roster,
    })).toEqual(manual);
    expect(benchForLineupModal({
      selectedPlayerIds: [],
      lineup: null,
      rosterIds: roster,
    })).toEqual(roster);
  });

  it('13 ids na quadra viram 5 em quadra e o resto no banco', () => {
    const ids = Array.from({ length: 13 }, (_, index) => String(index + 1));
    const split = splitCourtAndBench({ players: ids, bench: [], selectedPlayerIds: ids });
    expect(split.court).toEqual(['1', '2', '3', '4', '5']);
    expect(split.bench).toHaveLength(8);
    expect(split.bench).not.toEqual(expect.arrayContaining(split.court));

    const edited = splitCourtAndBench({
      players: ['2', '3', '4', '5', '6'],
      bench: [],
      selectedPlayerIds: ids,
    });
    expect(edited.court).toEqual(['2', '3', '4', '5', '6']);
    expect(edited.bench).toHaveLength(8);
    expect(edited.bench).not.toContain('2');
  });
});

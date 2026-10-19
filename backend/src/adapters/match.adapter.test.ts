import assert from 'node:assert/strict';
import test from 'node:test';
import { transformMatchToFrontend } from './match.adapter';

const jogo = {
  id: 'jogo-1',
  equipeId: 'eq-1',
  adversario: 'Rival',
  data: new Date('2026-03-09T00:00:00.000Z'),
  resultado: 'V',
  golsPro: 1,
  golsContra: 0,
  postMatchEventLog: [
    { action: 'goal', time: '03:00', period: '1T', goalMethod: 'JOGO ABERTO', playerId: 'p1' },
    { action: 'passCorrect', time: '04:00', period: '1T', playerId: 'p1' },
  ],
  lineup: { players: ['p1'], bench: [], ballPossessionStart: 'us' },
  createdAt: new Date('2026-03-09T00:00:00.000Z'),
};

const equipe = {
  id: 'est-1',
  jogoId: 'jogo-1',
  minutosJogados: 40,
  gols: 1,
  golsSofridos: 0,
  assistencias: 0,
  cartoesAmarelos: 0,
  cartoesVermelhos: 0,
  passesCorretos: 1,
  passesErrados: 0,
  passesErradosTransicao: 0,
  desarmesComBola: 0,
  desarmesContraAtaque: 0,
  desarmesSemBola: 0,
  chutesNoGol: 1,
  chutesFora: 0,
  golsMarcadosJogoAberto: 1,
  golsMarcadosBolaParada: 0,
  golsSofridosJogoAberto: 0,
  golsSofridosBolaParada: 0,
};

test('getById mantém o log e deriva os tempos de gol', () => {
  const match = transformMatchToFrontend(jogo, [], equipe);
  assert.equal(match.postMatchEventLog?.length, 2);
  assert.equal(match.postMatchEventCount, 2);
  assert.equal(match.teamStats.goalTimes?.length, 1);
  assert.equal(match.teamStats.passesCorrect, 1);
});

test('listagem omite o log, guarda a contagem e preserva estatísticas', () => {
  const match = transformMatchToFrontend(jogo, [], equipe, {
    includeEventLog: false,
    postMatchEventCount: 2,
  });
  assert.equal(match.postMatchEventLog, undefined);
  assert.equal(match.postMatchEventCount, 2);
  assert.equal(match.teamStats.goalTimes, undefined);
  assert.equal(match.teamStats.goals, 1);
  assert.equal(match.teamStats.passesCorrect, 1);
  assert.deepEqual(match.lineup?.players, ['p1']);
  assert.equal(match.date, '2026-03-09');
});

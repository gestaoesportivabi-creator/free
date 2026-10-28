import assert from 'node:assert/strict';
import test from 'node:test';
import { transformMatchToFrontend } from '../src/adapters/match.adapter';
import { countShotsOnTarget, derivedShotsOnTarget } from '../src/services/shotsOnTarget';

/** 1 No gol, 1 Fora, 1 Trave (gravada como shotOn) e 1 GOL nosso. */
const scenarioLog = [
  {
    id: 's1',
    action: 'shotOn',
    tipo: 'Finalização',
    subtipo: 'No gol',
    result: 'inside',
    playerId: 'p1',
    time: '01:00',
    period: '1T',
  },
  {
    id: 's2',
    action: 'shotOff',
    tipo: 'Finalização',
    subtipo: 'Pra fora',
    result: 'outside',
    playerId: 'p1',
    time: '02:00',
    period: '1T',
  },
  {
    id: 's3',
    action: 'shotOn',
    tipo: 'Finalização',
    subtipo: 'Trave',
    result: 'post',
    playerId: 'p1',
    time: '03:00',
    period: '1T',
  },
  {
    id: 's4',
    action: 'goal',
    tipo: 'Gol',
    subtipo: 'A favor',
    playerId: 'p1',
    time: '04:00',
    period: '1T',
  },
];

test('cenário no gol, fora, trave e gol conta 1 chute no gol', () => {
  const count = countShotsOnTarget(scenarioLog);
  assert.equal(count.team, 1);
  assert.equal(count.byPlayer.p1, 1);
});

test('trave nova (shotPost) e gol nosso não entram', () => {
  const count = countShotsOnTarget([
    { action: 'shotOn', tipo: 'Finalização', subtipo: 'No gol', result: 'inside', playerId: 'p1' },
    { action: 'shotPost', tipo: 'Finalização', subtipo: 'Trave', result: 'post', playerId: 'p1' },
    { action: 'goal', tipo: 'Gol', subtipo: 'Gol nosso', playerId: 'p1' },
  ]);
  assert.equal(count.team, 1);
});

test('sem finalização no log, o número gravado permanece', () => {
  assert.equal(derivedShotsOnTarget([{ action: 'goal', tipo: 'Gol', subtipo: 'A favor' }]), null);
  assert.equal(derivedShotsOnTarget(undefined), null);
});

test('getById corrige chutes no gol gravados a mais por causa da trave', () => {
  const match = transformMatchToFrontend(
    {
      id: 'jogo-shots',
      equipeId: 'eq-1',
      adversario: 'Rival',
      data: new Date('2026-04-01T00:00:00.000Z'),
      resultado: 'V',
      golsPro: 1,
      golsContra: 0,
      postMatchEventLog: scenarioLog,
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
    },
    [
      {
        id: 'est-j',
        jogoId: 'jogo-shots',
        jogadorId: 'p1',
        minutosJogados: 40,
        gols: 1,
        golsSofridos: 0,
        assistencias: 0,
        cartoesAmarelos: 0,
        cartoesVermelhos: 0,
        passesCorretos: 0,
        passesErrados: 0,
        passesErradosTransicao: 0,
        desarmesComBola: 0,
        desarmesContraAtaque: 0,
        desarmesSemBola: 0,
        chutesNoGol: 2,
        chutesFora: 1,
        golsMarcadosJogoAberto: 1,
        golsMarcadosBolaParada: 0,
        golsSofridosJogoAberto: 0,
        golsSofridosBolaParada: 0,
      },
    ],
    {
      id: 'est-e',
      jogoId: 'jogo-shots',
      minutosJogados: 40,
      gols: 1,
      golsSofridos: 0,
      assistencias: 0,
      cartoesAmarelos: 0,
      cartoesVermelhos: 0,
      passesCorretos: 0,
      passesErrados: 0,
      passesErradosTransicao: 0,
      desarmesComBola: 0,
      desarmesContraAtaque: 0,
      desarmesSemBola: 0,
      chutesNoGol: 2,
      chutesFora: 1,
      golsMarcadosJogoAberto: 1,
      golsMarcadosBolaParada: 0,
      golsSofridosJogoAberto: 0,
      golsSofridosBolaParada: 0,
    }
  );

  assert.equal(match.teamStats.shotsOnTarget, 1);
  assert.equal(match.playerStats.p1.shotsOnTarget, 1);
  assert.equal(match.teamStats.shotsOffTarget, 1);
  assert.equal(match.teamStats.goals, 1);
});

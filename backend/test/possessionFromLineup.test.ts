import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transformMatchToFrontend } from '../src/adapters/match.adapter';

test('a listagem expõe a posse gravada no lineup da coleta', () => {
  const match = transformMatchToFrontend(
    {
      id: 'jogo-1849',
      equipeId: 'eq-1',
      adversario: 'Rival QA 1849',
      data: '2026-10-19',
      resultado: 'V',
      golsPro: 3,
      golsContra: 0,
      lineup: {
        players: ['p1'],
        bench: [],
        ballPossessionStart: 'us',
        possessionSecondsWith: 70,
        possessionSecondsWithout: 30,
      },
      createdAt: '2026-10-19T12:00:00.000Z',
    },
    [],
    {
      id: 'est-1',
      jogoId: 'jogo-1849',
      minutosJogados: 40,
      gols: 3,
      golsSofridos: 0,
      assistencias: 0,
      cartoesAmarelos: 0,
      cartoesVermelhos: 0,
      passesCorretos: 18,
      passesErrados: 0,
      passesErradosTransicao: 0,
      desarmesComBola: 0,
      desarmesContraAtaque: 0,
      desarmesSemBola: 0,
      chutesNoGol: 0,
      chutesFora: 0,
      golsMarcadosJogoAberto: 3,
      golsMarcadosBolaParada: 0,
      golsSofridosJogoAberto: 0,
      golsSofridosBolaParada: 0,
    },
    { includeEventLog: false, postMatchEventCount: 21 }
  );

  assert.equal(match.possessionSecondsWith, 70);
  assert.equal(match.possessionSecondsWithout, 30);
  assert.equal(match.postMatchEventLog, undefined);
});

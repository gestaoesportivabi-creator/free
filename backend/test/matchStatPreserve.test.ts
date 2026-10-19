import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveGoalOriginColumns, resolveMinutesCardsRpe } from '../src/services/matchStatPreserve';

const stored = {
  minutosJogados: 27,
  cartoesAmarelos: 2,
  cartoesVermelhos: 1,
  rpePartida: 8,
};

describe('resolveMinutesCardsRpe', () => {
  it('preserva minutos, cartões e RPE quando o payload não traz os campos', () => {
    const columns = resolveMinutesCardsRpe({
      stats: { goals: 1, passesCorrect: 4 },
      existing: stored,
    });

    assert.equal(columns.minutosJogados, 27);
    assert.equal(columns.cartoesAmarelos, 2);
    assert.equal(columns.cartoesVermelhos, 1);
    assert.equal(columns.rpePartida, 8);
  });

  it('grava o valor quando a lista ou a planilha envia o campo, inclusive zero', () => {
    const columns = resolveMinutesCardsRpe({
      stats: {
        minutesPlayed: 40,
        yellowCards: 0,
        redCards: 1,
        rpeMatch: 7.4,
      },
      existing: stored,
    });

    assert.equal(columns.minutosJogados, 40);
    assert.equal(columns.cartoesAmarelos, 0);
    assert.equal(columns.cartoesVermelhos, 1);
    assert.equal(columns.rpePartida, 7);
  });

  it('aceita os nomes das colunas e os campos soltos do jogo na equipe', () => {
    const columns = resolveMinutesCardsRpe({
      stats: { goals: 2 },
      matchLevel: { minutosJogados: '18', cartoesAmarelos: 3, rpe: 6 },
      existing: stored,
    });

    assert.equal(columns.minutosJogados, 18);
    assert.equal(columns.cartoesAmarelos, 3);
    assert.equal(columns.cartoesVermelhos, 1);
    assert.equal(columns.rpePartida, 6);
  });

  it('não usa o minuto do jogo no jogador quando matchLevel não é passado', () => {
    const columns = resolveMinutesCardsRpe({
      stats: { goals: 1 },
      existing: { minutosJogados: 12, cartoesAmarelos: 1, cartoesVermelhos: 0, rpePartida: 9 },
    });

    assert.equal(columns.minutosJogados, 12);
    assert.equal(columns.rpePartida, 9);
  });

  it('sem linha anterior, minuto ausente fica 40 e RPE ausente fica null', () => {
    const columns = resolveMinutesCardsRpe({ stats: { goals: 0 } });

    assert.equal(columns.minutosJogados, 40);
    assert.equal(columns.cartoesAmarelos, 0);
    assert.equal(columns.cartoesVermelhos, 0);
    assert.equal(columns.rpePartida, null);
  });

  it('documenta cartão omitido preservado e RPE inteiro (7,4 → 7)', () => {
    const columns = resolveMinutesCardsRpe({
      stats: { goals: 1, rpeMatch: 7.4 },
      existing: { minutosJogados: 40, cartoesAmarelos: 1, cartoesVermelhos: 1, rpePartida: 5 },
    });

    assert.equal(columns.cartoesAmarelos, 1);
    assert.equal(columns.cartoesVermelhos, 1);
    assert.equal(columns.rpePartida, 7);
  });
});

const storedGoals = {
  golsMarcadosJogoAberto: 3,
  golsMarcadosBolaParada: 2,
  golsSofridosJogoAberto: 4,
  golsSofridosBolaParada: 1,
  golsSofridos: 6,
};

describe('resolveGoalOriginColumns', () => {
  it('preserva jogo aberto, bola parada e gols sofridos do jogador quando o campo falta', () => {
    const columns = resolveGoalOriginColumns({
      stats: { goals: 1 },
      existing: storedGoals,
      playerGoalsConceded: true,
    });

    assert.equal(columns.golsMarcadosJogoAberto, 3);
    assert.equal(columns.golsMarcadosBolaParada, 2);
    assert.equal(columns.golsSofridosJogoAberto, 4);
    assert.equal(columns.golsSofridosBolaParada, 1);
    assert.equal(columns.golsSofridos, 6);
  });

  it('grava o número presente, inclusive zero', () => {
    const columns = resolveGoalOriginColumns({
      stats: {
        goalsScoredOpenPlay: 0,
        goalsScoredSetPiece: 1,
        goalsConcededOpenPlay: 0,
        golsSofridosBolaParada: 2,
        goalsConceded: 0,
      },
      existing: storedGoals,
      playerGoalsConceded: true,
    });

    assert.equal(columns.golsMarcadosJogoAberto, 0);
    assert.equal(columns.golsMarcadosBolaParada, 1);
    assert.equal(columns.golsSofridosJogoAberto, 0);
    assert.equal(columns.golsSofridosBolaParada, 2);
    assert.equal(columns.golsSofridos, 0);
  });

  it('sem linha anterior usa zero, e a equipe não trata goalsConceded como gol sofrido do jogador', () => {
    const created = resolveGoalOriginColumns({ stats: { goals: 2 } });
    assert.equal(created.golsMarcadosJogoAberto, 0);
    assert.equal(created.golsMarcadosBolaParada, 0);
    assert.equal(created.golsSofridosJogoAberto, 0);
    assert.equal(created.golsSofridosBolaParada, 0);
    assert.equal(created.golsSofridos, 0);

    const team = resolveGoalOriginColumns({
      stats: { goalsConceded: 5, goalsScoredOpenPlay: 1 },
      existing: storedGoals,
    });
    assert.equal(team.golsMarcadosJogoAberto, 1);
    assert.equal(team.golsMarcadosBolaParada, 2);
    // Sem a flag, goalsConceded: 5 (placar) não entra em golsSofridos; a coluna anterior fica.
    assert.equal(team.golsSofridos, 6);
  });
});

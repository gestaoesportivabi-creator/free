import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveMinutesCardsRpe } from '../src/services/matchStatPreserve';

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
});

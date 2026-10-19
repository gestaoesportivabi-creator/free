import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { resolveFreeKickAvailability } from '../components/FreeKickEventButton';

const SYNC_MESSAGE =
  'Necessário sincronizar o relógio. Esta partida não possui snapshot temporal salvo.';
const FOULS_MESSAGE = 'Disponível após 5 faltas (nossas ou do adversário) neste tempo';

describe('TIRO LIVRE — motivo do bloqueio', () => {
  test('menos de 5 faltas nos dois lados explica a regra de faltas', () => {
    const availability = resolveFreeKickAvailability({
      foulsFor: 4,
      foulsAgainst: 4,
      realtimeLocked: false,
      realtimeMessage: SYNC_MESSAGE,
    });

    assert.equal(availability.blocked, true);
    assert.equal(availability.reason, 'fouls');
    assert.equal(availability.message, FOULS_MESSAGE);
  });

  test('5 faltas de qualquer lado não bloqueia pela regra de faltas', () => {
    for (const counts of [
      { foulsFor: 5, foulsAgainst: 0 },
      { foulsFor: 0, foulsAgainst: 5 },
      { foulsFor: 5, foulsAgainst: 5 },
    ]) {
      const availability = resolveFreeKickAvailability({
        ...counts,
        realtimeLocked: false,
        realtimeMessage: SYNC_MESSAGE,
      });
      assert.equal(availability.blocked, false, JSON.stringify(counts));
      assert.equal(availability.reason, null);
      assert.equal(availability.message, undefined);
    }
  });

  test('trava de sync/realtime substitui o texto das faltas', () => {
    const withFewFouls = resolveFreeKickAvailability({
      foulsFor: 0,
      foulsAgainst: 1,
      realtimeLocked: true,
      realtimeMessage: SYNC_MESSAGE,
    });
    assert.equal(withFewFouls.blocked, true);
    assert.equal(withFewFouls.reason, 'realtime');
    assert.equal(withFewFouls.message, SYNC_MESSAGE);
    assert.notEqual(withFewFouls.message, FOULS_MESSAGE);

    const withEnoughFouls = resolveFreeKickAvailability({
      foulsFor: 6,
      foulsAgainst: 0,
      realtimeLocked: true,
      realtimeMessage: 'Retome a partida para continuar registrando eventos.',
    });
    assert.equal(withEnoughFouls.reason, 'realtime');
    assert.equal(withEnoughFouls.message, 'Retome a partida para continuar registrando eventos.');
  });
});

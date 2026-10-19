import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { resolveFreeKickAvailability } from '../components/FreeKickEventButton';
import {
  describeAccumulatedFouls,
  directFreeKickWall,
} from '../utils/freeKickRule';

const SYNC_MESSAGE =
  'Necessário sincronizar o relógio. Esta partida não possui snapshot temporal salvo.';

describe('TIRO LIVRE — 6ª falta por equipe (FIFA/CBFS)', () => {
  test('4 nossas + 3 do adversário não somam e não liberam cobrança sem barreira', () => {
    const rights = describeAccumulatedFouls(4, 3);
    assert.equal(rights.noWallForUs, false);
    assert.equal(rights.noWallAgainst, false);
    assert.equal(rights.foulsUntilOpponentNoWall, 2);
    assert.equal(rights.foulsUntilOurNoWall, 3);
    assert.match(rights.message, /por equipe/);
    assert.match(rights.message, /faltam 2 faltas nossas/);
    assert.match(rights.message, /faltam 3 faltas do adversário/);
    assert.doesNotMatch(rights.message, /após 5 faltas/);

    const availability = resolveFreeKickAvailability({
      foulsFor: 4,
      foulsAgainst: 3,
      realtimeLocked: false,
      realtimeMessage: SYNC_MESSAGE,
    });
    assert.equal(availability.blocked, false);
    assert.equal(availability.reason, null);
    assert.equal(availability.message, rights.message);
    assert.equal(directFreeKickWall('for', 4, 3), 'withWall');
    assert.equal(directFreeKickWall('against', 4, 3), 'withWall');
  });

  test('5 faltas de um lado ainda são tiro livre com barreira', () => {
    const rights = describeAccumulatedFouls(5, 0);
    assert.equal(rights.noWallAgainst, false);
    assert.equal(rights.foulsUntilOpponentNoWall, 1);
    assert.equal(directFreeKickWall('against', 5, 0), 'withWall');
    assert.equal(directFreeKickWall('for', 0, 5), 'withWall');
  });

  test('a 6ª falta de um lado dá o direto sem barreira ao adversário', () => {
    const ours = describeAccumulatedFouls(6, 3);
    assert.equal(ours.noWallAgainst, true);
    assert.equal(ours.noWallForUs, false);
    assert.match(ours.message, /adversário cobra tiro livre direto sem barreira/);
    assert.match(ours.message, /nós com 6 faltas/);
    assert.equal(directFreeKickWall('against', 6, 3), 'noWall');
    assert.equal(directFreeKickWall('for', 6, 3), 'withWall');

    const theirs = describeAccumulatedFouls(4, 6);
    assert.equal(theirs.noWallForUs, true);
    assert.equal(theirs.noWallAgainst, false);
    assert.match(theirs.message, /Nossa equipe cobra tiro livre direto sem barreira/);
    assert.equal(directFreeKickWall('for', 4, 6), 'noWall');
    assert.equal(directFreeKickWall('against', 4, 6), 'withWall');
  });

  test('os dois lados na 6ª falta: quem sofre a falta cobra sem barreira', () => {
    const rights = describeAccumulatedFouls(6, 8);
    assert.equal(rights.noWallForUs, true);
    assert.equal(rights.noWallAgainst, true);
    assert.match(rights.message, /quem sofre a falta/);
    assert.equal(directFreeKickWall('for', 6, 8), 'noWall');
    assert.equal(directFreeKickWall('against', 6, 8), 'noWall');
  });

  test('trava de sync/realtime substitui o texto das faltas e bloqueia o clique', () => {
    const withFewFouls = resolveFreeKickAvailability({
      foulsFor: 4,
      foulsAgainst: 3,
      realtimeLocked: true,
      realtimeMessage: SYNC_MESSAGE,
    });
    assert.equal(withFewFouls.blocked, true);
    assert.equal(withFewFouls.reason, 'realtime');
    assert.equal(withFewFouls.message, SYNC_MESSAGE);

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

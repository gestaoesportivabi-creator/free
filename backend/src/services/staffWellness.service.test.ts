import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../utils/errors';
import {
  assertStaffWellnessType,
  bemEstarListWhere,
  clampBemEstarScore,
  parseBemEstarDate,
  prepareBemEstarItem,
  resolveTeamScope,
  wellnessFailure,
} from './staffWellness.service';

describe('escopo de equipes do bem-estar', () => {
  test('técnico sem equipes não gera IN vazio', () => {
    for (const ids of [[], undefined, [''], [null], [1]]) {
      const scope = resolveTeamScope(false, ids);
      assert.equal(scope.mode, 'none');
      assert.throws(() => bemEstarListWhere(scope), /não consulta/);
    }
  });

  test('admin sem equipes lista sem filtro; com equipes continua restrito', () => {
    assert.deepEqual(resolveTeamScope(true, []), { mode: 'unrestricted' });
    assert.equal(bemEstarListWhere({ mode: 'unrestricted' }), undefined);
    const scoped = resolveTeamScope(true, ['eq-1', '', 'eq-2']);
    assert.deepEqual(scoped, { mode: 'restricted', equipeIds: ['eq-1', 'eq-2'] });
    assert.deepEqual(bemEstarListWhere(scoped), { equipe_id: { in: ['eq-1', 'eq-2'] } });
  });

  test('tipo desconhecido é erro de validação, não erro genérico', () => {
    assert.throws(() => assertStaffWellnessType('foo'), ValidationError);
    assert.equal(assertStaffWellnessType('bem-estar-diario'), 'bem-estar-diario');
  });
});

describe('data e escala', () => {
  test('YYYY-MM-DD fica no mesmo dia civil, ao meio-dia UTC', () => {
    const dt = parseBemEstarDate('2026-10-19');
    assert.equal(dt.toISOString(), '2026-10-19T12:00:00.000Z');
    const withOffset = parseBemEstarDate('2026-10-19T00:00:00.000-03:00');
    assert.equal(withOffset.toISOString(), '2026-10-19T12:00:00.000Z');
  });

  test('data impossível ou formato errado é 400', () => {
    assert.throws(() => parseBemEstarDate('2026-02-31'), ValidationError);
    assert.throws(() => parseBemEstarDate('31/10/2026'), ValidationError);
    assert.throws(() => parseBemEstarDate(null), ValidationError);
  });

  test('escala fora de 1–5 vira nulo; texto inválido é 400', () => {
    assert.equal(clampBemEstarScore(null), null);
    assert.equal(clampBemEstarScore(4.2), 4);
    assert.equal(clampBemEstarScore(9), null);
    assert.throws(() => clampBemEstarScore('alto'), ValidationError);
  });

  test('item completo com data inválida não é ignorado em silêncio', () => {
    const scope = resolveTeamScope(false, ['eq-1']);
    assert.throws(
      () => prepareBemEstarItem({ jogadorId: 'j1', equipeId: 'eq-1', data: 'ontem' }, scope),
      ValidationError
    );
  });
});

describe('status HTTP de erro de wellness', () => {
  test('validação e constraints de dado são 4xx; P2028 continua 500', () => {
    assert.deepEqual(wellnessFailure(new ValidationError('Tipo de wellness inválido.'), 'falha'), {
      status: 400,
      error: 'Tipo de wellness inválido.',
    });
    assert.equal(
      wellnessFailure(
        new Prisma.PrismaClientValidationError('Invalid', { clientVersion: '5.7.1' }),
        'falha'
      ).status,
      400
    );
    assert.equal(
      wellnessFailure(
        new Prisma.PrismaClientKnownRequestError('fk', { code: 'P2003', clientVersion: '5.7.1' }),
        'falha'
      ).status,
      400
    );
    assert.equal(
      wellnessFailure(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5.7.1' }),
        'falha'
      ).status,
      409
    );
    const p2028 = wellnessFailure(
      new Prisma.PrismaClientKnownRequestError('tx', { code: 'P2028', clientVersion: '5.7.1' }),
      'Erro ao buscar dados.'
    );
    assert.equal(p2028.status, 500);
    assert.equal(p2028.error, 'Erro ao buscar dados.');
  });
});

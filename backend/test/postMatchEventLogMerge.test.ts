import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMPTY_UNION_EVENT_LOG_CODE, mergePostMatchEventLogs } from '../src/services/postMatchEventLogMerge';
import { ConflictError } from '../src/utils/errors';

function ev(partial: Record<string, unknown>) {
  return partial;
}

describe('mergePostMatchEventLogs', () => {
  it('une por id e não deixa um payload menor apagar o 2º tempo', () => {
    const stored = Array.from({ length: 136 }, (_, index) =>
      ev({
        id: `e-${index + 1}`,
        time: index < 117 ? '10:00' : '05:00',
        period: index < 117 ? '1T' : '2T',
        action: 'pass',
        seq: index + 1,
      })
    );
    const received = stored.slice(0, 117).map((event, index) =>
      index === 10 ? { ...event, action: 'goal' } : event
    );

    const merged = mergePostMatchEventLogs(stored, received) as Array<Record<string, unknown>>;

    assert.equal(merged.length, 136);
    assert.equal(merged.filter((event) => event.period === '2T').length, 19);
    assert.equal(merged.find((event) => event.id === 'e-11')?.action, 'goal');
    assert.ok(merged.some((event) => event.id === 'e-136'));
  });

  it('o evento recebido vence no mesmo id', () => {
    const merged = mergePostMatchEventLogs(
      [ev({ id: 'a', time: '01:00', period: '1T', action: 'pass', note: 'old' })],
      [ev({ id: 'a', time: '01:00', period: '1T', action: 'goal' })]
    ) as Array<Record<string, unknown>>;

    assert.equal(merged.length, 1);
    assert.equal(merged[0].action, 'goal');
    assert.equal(merged[0].note, undefined);
  });

  it('id numérico e string do mesmo valor são o mesmo lance', () => {
    const merged = mergePostMatchEventLogs(
      [ev({ id: 7, time: '01:00', period: '1T', action: 'pass' })],
      [ev({ id: '7', time: '02:00', period: '1T', action: 'shot' })]
    ) as Array<Record<string, unknown>>;

    assert.equal(merged.length, 1);
    assert.equal(merged[0].action, 'shot');
  });

  it('omite o id excluído mesmo quando o payload ainda o traz', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'keep', time: '01:00', period: '1T' }),
        ev({ id: 'drop', time: '02:00', period: '1T' }),
      ],
      [
        ev({ id: 'keep', time: '01:00', period: '1T' }),
        ev({ id: 'drop', time: '02:00', period: '1T', action: 'stale' }),
      ],
      ['drop']
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id),
      ['keep']
    );
  });

  it('deletedEventIds apaga lance que o cliente só omitiu', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'a', time: '01:00', period: '1T' }),
        ev({ id: 'b', time: '03:00', period: '1T' }),
      ],
      [ev({ id: 'a', time: '01:00', period: '1T' })],
      ['b']
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id),
      ['a']
    );
  });

  it('ordena por período e tempo e mantém a ordem existente no empate', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'late-half', time: '19:00', period: '1T', label: 'first' }),
        ev({ id: 'same', time: '01:00', period: '1T', label: 'second' }),
        ev({ id: 'second-half', time: '00:30', period: '2T' }),
      ],
      [
        ev({ id: 'late-half', time: '19:00', period: '1T', label: 'first-edit' }),
        ev({ id: 'same', time: '01:00', period: '1T', label: 'second' }),
        ev({ id: 'inserted', time: '07:00', period: '1T' }),
        ev({ id: 'second-half', time: '00:30', period: '2T' }),
      ]
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id),
      ['same', 'inserted', 'late-half', 'second-half']
    );
    assert.equal(merged[2].label, 'first-edit');
  });

  it('mantém a ordem já gravada quando o tempo de jogo empata e não há timestamp', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'a', time: '01:00', period: '1T', label: 'first' }),
        ev({ id: 'b', time: '01:00', period: '1T', label: 'second' }),
      ],
      [
        ev({ id: 'a', time: '01:00', period: '1T', label: 'first-edit' }),
        ev({ id: 'b', time: '01:00', period: '1T', label: 'second' }),
      ]
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id),
      ['a', 'b']
    );
    assert.equal(merged[0].label, 'first-edit');
  });

  it('desempata pelo timestamp quando o tempo de jogo é igual', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'later', time: '01:00', period: '1T', timestamp: 200 }),
        ev({ id: 'earlier', time: '01:00', period: '1T', timestamp: 100 }),
      ],
      [
        ev({ id: 'later', time: '01:00', period: '1T', timestamp: 200 }),
        ev({ id: 'earlier', time: '01:00', period: '1T', timestamp: 100 }),
      ]
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id),
      ['earlier', 'later']
    );
  });

  it('substitui log sem id quando o recebido não é menor e preserva a ordem recebida', () => {
    const stored = [ev({ time: '01:00', period: '1T', action: 'old' })];
    const received = [
      ev({ time: '19:00', period: '2T', action: 'new-a' }),
      ev({ time: '01:00', period: '1T', action: 'new-b' }),
    ];

    const merged = mergePostMatchEventLogs(stored, received);

    assert.deepEqual(merged, received);
  });

  it('recusa 409 quando o log sem id é menor que o armazenado', () => {
    const stored = [
      ev({ time: '01:00', period: '1T' }),
      ev({ time: '02:00', period: '1T' }),
    ];
    const received = [ev({ time: '01:00', period: '1T' })];

    assert.throws(
      () => mergePostMatchEventLogs(stored, received),
      (error: unknown) => {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /1 evento\(s\) sem id/);
        assert.match(error.message, /2 armazenado/);
        assert.match(error.message, /deletedEventIds/);
        return true;
      }
    );
  });

  it('recusa 409 para array vazio sem ids quando já há lances', () => {
    assert.throws(
      () => mergePostMatchEventLogs([ev({ id: 'a', time: '01:00', period: '1T' })], []),
      (error: unknown) =>
        error instanceof ConflictError &&
        error.statusCode === 409 &&
        error.code === EMPTY_UNION_EVENT_LOG_CODE
    );
  });

  it('recusa 409 se a parte sem id encolhe num payload que também tem ids', () => {
    assert.throws(
      () =>
        mergePostMatchEventLogs(
          [ev({ id: 'a', time: '01:00', period: '1T' }), ev({ legacy: 1 }), ev({ legacy: 2 })],
          [ev({ id: 'a', time: '01:00', period: '1T' }), ev({ legacy: 1 })]
        ),
      (error: unknown) => error instanceof ConflictError
    );
  });

  it('mantém lance legado sem id quando a quantidade sem id não diminui', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'a', time: '02:00', period: '1T', v: 1 }),
        ev({ id: 'only-stored', time: '03:00', period: '1T' }),
        ev({ legacy: true, time: '01:00', period: '1T', v: 1 }),
      ],
      [
        ev({ id: 'a', time: '02:00', period: '1T', v: 2 }),
        ev({ legacy: true, time: '01:00', period: '1T', v: 2 }),
      ]
    ) as Array<Record<string, unknown>>;

    assert.deepEqual(
      merged.map((event) => event.id ?? event.legacy),
      [true, 'a', 'only-stored']
    );
    assert.equal(merged[1].v, 2);
    assert.equal(merged[0].v, 2);
  });

  it('apaga todos os lances com id quando o payload vem vazio e lista deletedEventIds', () => {
    const merged = mergePostMatchEventLogs(
      [
        ev({ id: 'a', time: '01:00', period: '1T' }),
        ev({ id: 'b', time: '12:00', period: '2T' }),
      ],
      [],
      ['a', 'b']
    );

    assert.deepEqual(merged, []);
  });

  it('não apaga o lance que sobrou quando o payload vazio só lista parte dos ids', () => {
    assert.throws(
      () =>
        mergePostMatchEventLogs(
          [
            ev({ id: 'a', time: '01:00', period: '1T' }),
            ev({ id: 'b', time: '02:00', period: '1T' }),
          ],
          [],
          ['a']
        ),
      (error: unknown) => {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, EMPTY_UNION_EVENT_LOG_CODE);
        assert.match(error.message, /fita chegou vazia/);
        assert.match(error.message, /1 lance/);
        return true;
      }
    );
  });

  it('aceita log vazio quando não havia nada armazenado', () => {
    assert.deepEqual(mergePostMatchEventLogs(undefined, []), []);
  });

  it('ignora deletedEventIds que não é array', () => {
    const merged = mergePostMatchEventLogs(
      [ev({ id: 'a', time: '01:00', period: '1T' })],
      [ev({ id: 'a', time: '01:00', period: '1T' })],
      'a'
    ) as Array<Record<string, unknown>>;

    assert.equal(merged.length, 1);
  });
});

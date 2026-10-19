import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './trialExpiredSave';
import {
  EMPTY_UNION_EVENT_LOG_CODE,
  EMPTY_UNION_EVENT_LOG_MESSAGE,
  isEmptyUnionEventLogError,
  readLineupDeletedEventIds,
} from './eventLogConflict';

describe('409 da fita vazia no modo union', () => {
  it('reconhece o código e não trata outro 409 como o mesmo caso', () => {
    const emptyLog = new ApiRequestError(409, EMPTY_UNION_EVENT_LOG_CODE, 'fita vazia');
    expect(isEmptyUnionEventLogError(emptyLog)).toBe(true);
    expect(EMPTY_UNION_EVENT_LOG_MESSAGE).toMatch(/coleta desta tela foi mantida/);
    expect(isEmptyUnionEventLogError(new ApiRequestError(409, 'CONFLICT', 'outro'))).toBe(false);
    expect(isEmptyUnionEventLogError(new Error('Erro ao salvar partida no servidor'))).toBe(false);
  });

  it('lê os tombstones gravados no lineup', () => {
    expect(readLineupDeletedEventIds({ players: ['p1'], deletedEventIds: [' a ', 2, '', 'a'] })).toEqual([
      'a',
      '2',
    ]);
    expect(readLineupDeletedEventIds(null)).toEqual([]);
    expect(readLineupDeletedEventIds({ players: [] })).toEqual([]);
  });
});

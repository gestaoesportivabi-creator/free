import { describe, expect, it } from 'vitest';
import { EMPTY_EVENT_LOG_FINALIZE_MESSAGE, emptyEventLogFinalizeBlock } from './finalizeEventLogGuard';

const base = {
  id: 'jogo-1',
  localEventCount: 0,
  deletedCount: 0,
};

describe('emptyEventLogFinalizeBlock', () => {
  it('bloqueia finalização sem contagem e sem fita', () => {
    expect(emptyEventLogFinalizeBlock(base)).toBe(EMPTY_EVENT_LOG_FINALIZE_MESSAGE);
  });

  it('bloqueia quando a hidratação falhou, mesmo com contagem 0', () => {
    expect(
      emptyEventLogFinalizeBlock({
        ...base,
        postMatchEventCount: 0,
        hydrationFailed: true,
      })
    ).toBe(EMPTY_EVENT_LOG_FINALIZE_MESSAGE);
  });

  it('bloqueia log vazio explícito se a contagem diz que havia lances', () => {
    expect(
      emptyEventLogFinalizeBlock({
        ...base,
        postMatchEventLog: [],
        postMatchEventCount: 4,
      })
    ).toBe(EMPTY_EVENT_LOG_FINALIZE_MESSAGE);
  });

  it('deixa finalizar fita vazia confirmada e coleta local', () => {
    expect(
      emptyEventLogFinalizeBlock({
        ...base,
        postMatchEventLog: [],
        postMatchEventCount: 0,
      })
    ).toBeNull();
    expect(
      emptyEventLogFinalizeBlock({
        ...base,
        postMatchEventCount: 4,
        localEventCount: 2,
      })
    ).toBeNull();
    expect(emptyEventLogFinalizeBlock({ ...base, id: 'sched-agenda' })).toBeNull();
  });
});

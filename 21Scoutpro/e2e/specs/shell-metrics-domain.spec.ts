import { expect, test } from '@playwright/test';
import {
  summarizeShellMetrics,
  type ShellMetricEntry,
} from '../../components/collection-shell/metrics';

const metric = (
  type: ShellMetricEntry['type'],
  createdAt: string,
  patch: Partial<ShellMetricEntry> = {}
): ShellMetricEntry => ({
  type,
  mode: 'realtime',
  createdAt,
  ...patch,
});

test('resumo operacional calcula gates sem inventar resultados de operador', () => {
  const summary = summarizeShellMetrics([
    metric('start', '2026-07-29T20:00:00.000Z', { eventId: 'shot', inputMethod: 'touch' }),
    metric('success', '2026-07-29T20:00:01.000Z', {
      eventId: 'shot',
      inputMethod: 'touch',
      durationMs: 1000,
      interactionCount: 2,
    }),
    metric('start', '2026-07-29T20:00:10.000Z', { eventId: 'goal', inputMethod: 'keyboard' }),
    metric('success', '2026-07-29T20:00:13.000Z', {
      eventId: 'goal',
      inputMethod: 'keyboard',
      durationMs: 3000,
      interactionCount: 3,
    }),
    metric('start', '2026-07-29T20:00:20.000Z', { eventId: 'card', inputMethod: 'touch' }),
    metric('cancel', '2026-07-29T20:00:22.000Z', { eventId: 'card', inputMethod: 'touch' }),
    metric('undo', '2026-07-29T20:01:00.000Z', { eventId: 'goal' }),
  ]);

  expect(summary).toMatchObject({
    starts: 3,
    successes: 2,
    cancels: 1,
    undos: 1,
    tteP50Ms: 1000,
    tteP95Ms: 3000,
    averageInteractionsPerEvent: 2.5,
    cancelRate: 1 / 3,
    undoRate: 0.5,
    eventsPerMinute: 2,
    byInputMethod: {
      touch: 1,
      keyboard: 1,
      preset: 0,
    },
  });
});

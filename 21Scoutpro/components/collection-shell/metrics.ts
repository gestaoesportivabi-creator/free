export type ShellMetricType =
  | 'start'
  | 'interaction'
  | 'cancel'
  | 'confirm'
  | 'success'
  | 'error'
  | 'undo'
  | 'preset'
  | 'shortcut'
  | 'skip';

export interface ShellMetricEntry {
  type: ShellMetricType;
  mode: 'realtime' | 'postmatch';
  eventId?: string;
  stepId?: string;
  inputMethod?: 'touch' | 'keyboard' | 'preset';
  durationMs?: number;
  interactionCount?: number;
  detail?: string;
  createdAt: string;
}

export interface ShellMetricSummary {
  starts: number;
  successes: number;
  cancels: number;
  errors: number;
  undos: number;
  tteP50Ms: number | null;
  tteP95Ms: number | null;
  averageInteractionsPerEvent: number | null;
  cancelRate: number;
  undoRate: number;
  eventsPerMinute: number | null;
  byInputMethod: Record<'touch' | 'keyboard' | 'preset', number>;
}

declare global {
  interface Window {
    __scout21CollectionShellMetrics__?: ShellMetricEntry[];
    __scout21CollectionShellMetricSummary__?: () => ShellMetricSummary;
  }
}

const percentile = (values: number[], target: number): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(target * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

export function summarizeShellMetrics(entries: ShellMetricEntry[]): ShellMetricSummary {
  const starts = entries.filter((entry) => entry.type === 'start');
  const successes = entries.filter((entry) => entry.type === 'success');
  const cancels = entries.filter((entry) => entry.type === 'cancel');
  const errors = entries.filter((entry) => entry.type === 'error');
  const undos = entries.filter((entry) => entry.type === 'undo');
  const durations = successes
    .map((entry) => entry.durationMs)
    .filter((value): value is number => typeof value === 'number' && value >= 0);
  const interactions = successes
    .map((entry) => entry.interactionCount)
    .filter((value): value is number => typeof value === 'number' && value >= 0);
  const timeline = entries
    .map((entry) => Date.parse(entry.createdAt))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);
  const elapsedMinutes =
    timeline.length >= 2 ? (timeline[timeline.length - 1] - timeline[0]) / 60_000 : 0;

  return {
    starts: starts.length,
    successes: successes.length,
    cancels: cancels.length,
    errors: errors.length,
    undos: undos.length,
    tteP50Ms: percentile(durations, 0.5),
    tteP95Ms: percentile(durations, 0.95),
    averageInteractionsPerEvent:
      interactions.length > 0
        ? interactions.reduce((total, value) => total + value, 0) / interactions.length
        : null,
    cancelRate: starts.length > 0 ? cancels.length / starts.length : 0,
    undoRate: successes.length > 0 ? undos.length / successes.length : 0,
    eventsPerMinute: elapsedMinutes > 0 ? successes.length / elapsedMinutes : null,
    byInputMethod: {
      touch: successes.filter((entry) => entry.inputMethod === 'touch').length,
      keyboard: successes.filter((entry) => entry.inputMethod === 'keyboard').length,
      preset: successes.filter((entry) => entry.inputMethod === 'preset').length,
    },
  };
}

export function pushShellMetric(entry: Omit<ShellMetricEntry, 'createdAt'>): void {
  if (typeof window === 'undefined') return;
  const bucket = window.__scout21CollectionShellMetrics__ ?? [];
  bucket.push({ ...entry, createdAt: new Date().toISOString() });
  window.__scout21CollectionShellMetrics__ = bucket;
  window.__scout21CollectionShellMetricSummary__ = () =>
    summarizeShellMetrics(window.__scout21CollectionShellMetrics__ ?? []);
}

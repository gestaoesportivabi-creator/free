import {
  HALF_RELATIVE_LAST_SECOND_1T,
  HALF_RELATIVE_LAST_SECOND_2T,
  MATCH_ABSOLUTE_MAX_SECONDS,
  absoluteSecondsToStored,
  deriveHalfFromAbsoluteSeconds,
  type MatchHalf,
} from '../utils/matchPeriod';

export type ClockMode = 'realtime' | 'postmatch';

export type ClockState =
  | 'PRE_JOGO'
  | 'PRIMEIRO_TEMPO'
  | 'PAUSADO'
  | 'SINCRONIZANDO'
  | 'INTERVALO'
  | 'SEGUNDO_TEMPO'
  | 'ENCERRADO';

export interface ClockSnapshot {
  mode: ClockMode;
  state: ClockState;
  period: MatchHalf;
  currentTimeSeconds: number;
  isRunning: boolean;
  firstHalfLocked: boolean;
}

export interface ClockSyncOptions {
  period?: MatchHalf;
  firstHalfLocked?: boolean;
  state?: ClockState;
  isRunning?: boolean;
}

export interface EventStamp {
  time: number;
  period: MatchHalf;
}

const CLOCK_TRANSITIONS: Record<ClockState, ReadonlyArray<ClockState>> = {
  PRE_JOGO: ['SINCRONIZANDO', 'PRIMEIRO_TEMPO', 'PAUSADO', 'SEGUNDO_TEMPO', 'ENCERRADO'],
  PRIMEIRO_TEMPO: ['SINCRONIZANDO', 'PAUSADO', 'INTERVALO', 'SEGUNDO_TEMPO', 'ENCERRADO'],
  PAUSADO: ['SINCRONIZANDO', 'PRIMEIRO_TEMPO', 'INTERVALO', 'SEGUNDO_TEMPO', 'ENCERRADO'],
  SINCRONIZANDO: ['PRE_JOGO', 'PRIMEIRO_TEMPO', 'PAUSADO', 'INTERVALO', 'SEGUNDO_TEMPO', 'ENCERRADO'],
  INTERVALO: ['SINCRONIZANDO', 'SEGUNDO_TEMPO', 'ENCERRADO'],
  SEGUNDO_TEMPO: ['SINCRONIZANDO', 'PAUSADO', 'PRIMEIRO_TEMPO', 'ENCERRADO'],
  ENCERRADO: ['SINCRONIZANDO', 'PRE_JOGO', 'PRIMEIRO_TEMPO', 'PAUSADO', 'SEGUNDO_TEMPO'],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const clampRealtimeSeconds = (seconds: number, period: MatchHalf): number =>
  clamp(
    Math.floor(seconds),
    0,
    period === '2T' ? HALF_RELATIVE_LAST_SECOND_2T : HALF_RELATIVE_LAST_SECOND_1T
  );

const clampPostmatchSeconds = (seconds: number, firstHalfLocked: boolean): number => {
  const clamped = clamp(Math.floor(seconds), 0, MATCH_ABSOLUTE_MAX_SECONDS);
  return firstHalfLocked ? Math.max(20 * 60, clamped) : clamped;
};

const formatClockTime = (seconds: number): string => {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const resolvePostmatchPeriod = (seconds: number, firstHalfLocked: boolean): MatchHalf =>
  firstHalfLocked ? '2T' : deriveHalfFromAbsoluteSeconds(seconds);

const resolvePhaseState = (period: MatchHalf): ClockState =>
  period === '2T' ? 'SEGUNDO_TEMPO' : 'PRIMEIRO_TEMPO';

export class ClockService {
  private snapshot: ClockSnapshot;

  constructor(mode: ClockMode) {
    this.snapshot = {
      mode,
      state: 'PRE_JOGO',
      period: '1T',
      currentTimeSeconds: 0,
      isRunning: false,
      firstHalfLocked: false,
    };
  }

  getSnapshot(): ClockSnapshot {
    return { ...this.snapshot };
  }

  reset(): ClockSnapshot {
    return this.commit({
      state: 'PRE_JOGO',
      period: '1T',
      currentTimeSeconds: 0,
      isRunning: false,
      firstHalfLocked: false,
    });
  }

  start(): ClockSnapshot {
    const nextState = this.snapshot.period === '2T' || this.snapshot.firstHalfLocked
      ? 'SEGUNDO_TEMPO'
      : 'PRIMEIRO_TEMPO';
    return this.commit({
      state: nextState,
      isRunning: true,
    });
  }

  pause(): ClockSnapshot {
    return this.commit({
      state: 'PAUSADO',
      isRunning: false,
    });
  }

  resume(): ClockSnapshot {
    const nextState = this.snapshot.period === '2T' || this.snapshot.firstHalfLocked
      ? 'SEGUNDO_TEMPO'
      : 'PRIMEIRO_TEMPO';
    return this.commit({
      state: nextState,
      isRunning: true,
    });
  }

  tick(deltaSeconds = 1): ClockSnapshot {
    if (!this.snapshot.isRunning || this.snapshot.state === 'ENCERRADO') {
      return this.getSnapshot();
    }

    const nextSeconds =
      this.snapshot.mode === 'postmatch'
        ? clampPostmatchSeconds(this.snapshot.currentTimeSeconds + deltaSeconds, this.snapshot.firstHalfLocked)
        : clampRealtimeSeconds(this.snapshot.currentTimeSeconds + deltaSeconds, this.snapshot.period);

    return this.commit({ currentTimeSeconds: nextSeconds });
  }

  syncTime(seconds: number, options: ClockSyncOptions = {}): ClockSnapshot {
    this.transitionTo('SINCRONIZANDO');

    const firstHalfLocked = options.firstHalfLocked ?? this.snapshot.firstHalfLocked;
    const period =
      this.snapshot.mode === 'postmatch'
        ? resolvePostmatchPeriod(seconds, firstHalfLocked)
        : options.period ?? this.snapshot.period;
    const currentTimeSeconds =
      this.snapshot.mode === 'postmatch'
        ? clampPostmatchSeconds(seconds, firstHalfLocked)
        : clampRealtimeSeconds(seconds, period);
    const nextState =
      options.state ??
      this.resolveStateAfterSync(period, firstHalfLocked, options.isRunning, currentTimeSeconds);

    return this.commit({
      state: nextState,
      period,
      currentTimeSeconds,
      isRunning: options.isRunning ?? this.snapshot.isRunning,
      firstHalfLocked,
    });
  }

  enterInterval(): ClockSnapshot {
    return this.commit({
      state: 'INTERVALO',
      isRunning: false,
    });
  }

  startSecondHalf(): ClockSnapshot {
    return this.commit({
      state: 'SEGUNDO_TEMPO',
      period: '2T',
      currentTimeSeconds: this.snapshot.mode === 'postmatch' ? 20 * 60 : 0,
      isRunning: false,
      firstHalfLocked: true,
    });
  }

  returnToFirstHalf(): ClockSnapshot {
    return this.commit({
      state: 'PRIMEIRO_TEMPO',
      period: '1T',
      currentTimeSeconds: 0,
      isRunning: false,
      firstHalfLocked: false,
    });
  }

  end(): ClockSnapshot {
    return this.commit({
      state: 'ENCERRADO',
      isRunning: false,
    });
  }

  formatTime(seconds = this.snapshot.currentTimeSeconds): string {
    return formatClockTime(seconds);
  }

  buildEventStamp(rawSeconds?: number, periodOverride?: MatchHalf): EventStamp {
    const effectiveSeconds = rawSeconds ?? this.snapshot.currentTimeSeconds;

    if (this.snapshot.mode === 'postmatch') {
      return absoluteSecondsToStored(effectiveSeconds);
    }

    const period = periodOverride ?? this.snapshot.period;
    return {
      period,
      time: clampRealtimeSeconds(effectiveSeconds, period),
    };
  }

  private resolveStateAfterSync(
    period: MatchHalf,
    firstHalfLocked: boolean,
    isRunningOverride?: boolean,
    currentTimeSeconds?: number
  ): ClockState {
    const isRunning = isRunningOverride ?? this.snapshot.isRunning;
    const effectiveSeconds = currentTimeSeconds ?? this.snapshot.currentTimeSeconds;

    if (this.snapshot.state === 'ENCERRADO') return 'ENCERRADO';
    if (this.snapshot.state === 'INTERVALO') return 'INTERVALO';
    if (this.snapshot.state === 'PAUSADO' && !isRunning) return 'PAUSADO';
    if (isRunning) return resolvePhaseState(period);

    if (this.snapshot.mode === 'postmatch') {
      return resolvePhaseState(period);
    }

    if (!firstHalfLocked && period === '1T' && effectiveSeconds === 0) {
      return 'PRE_JOGO';
    }

    return resolvePhaseState(period);
  }

  private transitionTo(nextState: ClockState): void {
    if (nextState === this.snapshot.state) return;
    const allowed = CLOCK_TRANSITIONS[this.snapshot.state];
    if (!allowed.includes(nextState)) {
      throw new Error(`Clock transition not allowed: ${this.snapshot.state} -> ${nextState}`);
    }
    this.snapshot = { ...this.snapshot, state: nextState };
  }

  private commit(partial: Partial<ClockSnapshot>): ClockSnapshot {
    const nextState = partial.state ?? this.snapshot.state;
    this.transitionTo(nextState);
    this.snapshot = {
      ...this.snapshot,
      ...partial,
      state: nextState,
    };
    return this.getSnapshot();
  }
}

export function getEventStamp(
  clockService: ClockService,
  rawSeconds?: number,
  periodOverride?: MatchHalf
): EventStamp {
  return clockService.buildEventStamp(rawSeconds, periodOverride);
}

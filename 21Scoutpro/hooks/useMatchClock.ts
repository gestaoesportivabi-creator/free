import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClockService,
  REGULATION_HALF_MINUTES,
  type ClockMode,
  type ClockSnapshot,
  type ClockState,
  type EventStamp,
  type ClockSyncOptions,
  getEventStamp as buildEventStamp,
} from '../services/clockService';
import type { MatchHalf } from '../utils/matchPeriod';

type PauseSource = 'manual' | 'event' | null;

interface RestorePoint {
  snapshot: ClockSnapshot;
  pauseSource: PauseSource;
}

interface HydrateClockOptions extends ClockSyncOptions {
  seconds: number;
}

interface SyncResult {
  ok: boolean;
  error?: string;
}

interface UseMatchClockOptions {
  mode: ClockMode;
}

interface UseMatchClockResult {
  snapshot: ClockSnapshot;
  formatTime: (seconds?: number) => string;
  hydrateClock: (options: HydrateClockOptions) => ClockSnapshot;
  iniciarPrimeiroTempo: () => SyncResult;
  pausar: () => SyncResult;
  pausarPorEvento: () => SyncResult;
  continuarPartida: () => SyncResult;
  encerrarPrimeiroTempo: () => SyncResult;
  iniciarSegundoTempo: () => SyncResult;
  encerrarPartida: () => SyncResult;
  retornarAoPrimeiroTempo: () => SyncResult;
  iniciarSincronizacao: () => SyncResult;
  confirmarSincronizacao: (minute: number, second: number) => SyncResult;
  cancelarSincronizacao: () => SyncResult;
  getEventStamp: (rawSeconds?: number, periodOverride?: MatchHalf) => EventStamp;
  isPausedByEvent: boolean;
  isSyncing: boolean;
  canRegisterRealtimeEvent: boolean;
}

const RUNNING_STATES = new Set<ClockState>(['PRIMEIRO_TEMPO', 'SEGUNDO_TEMPO']);

const buildError = (error: string): SyncResult => ({ ok: false, error });
const buildSuccess = (): SyncResult => ({ ok: true });

export function useMatchClock({ mode }: UseMatchClockOptions): UseMatchClockResult {
  const clockRef = useRef<ClockService>(new ClockService(mode));
  const [snapshot, setSnapshot] = useState<ClockSnapshot>(() => clockRef.current.getSnapshot());
  const snapshotRef = useRef<ClockSnapshot>(snapshot);
  const [pauseSource, setPauseSource] = useState<PauseSource>(null);
  const syncRestoreRef = useRef<RestorePoint | null>(null);

  const applySnapshot = useCallback((nextSnapshot: ClockSnapshot) => {
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, []);

  const setPauseSourceForState = useCallback((nextSnapshot: ClockSnapshot, nextPauseSource: PauseSource) => {
    if (nextSnapshot.state !== 'PAUSADO') {
      setPauseSource(null);
      return;
    }
    setPauseSource(nextPauseSource);
  }, []);

  const syncClock = useCallback((seconds: number, options: ClockSyncOptions = {}) => {
    const nextSnapshot = clockRef.current.syncTime(seconds, options);
    return applySnapshot(nextSnapshot);
  }, [applySnapshot]);

  const runClockCommand = useCallback((
    mutate: (clock: ClockService) => ClockSnapshot,
    nextPauseSource: PauseSource = null
  ) => {
    const nextSnapshot = mutate(clockRef.current);
    applySnapshot(nextSnapshot);
    setPauseSourceForState(nextSnapshot, nextPauseSource);
    return nextSnapshot;
  }, [applySnapshot, setPauseSourceForState]);

  useEffect(() => {
    clockRef.current = new ClockService(mode);
    const nextSnapshot = clockRef.current.getSnapshot();
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    setPauseSource(null);
    syncRestoreRef.current = null;
  }, [mode]);

  useEffect(() => {
    if (!snapshot.isRunning || !RUNNING_STATES.has(snapshot.state)) return;
    const interval = window.setInterval(() => {
      const nextSnapshot = clockRef.current.tick();
      applySnapshot(nextSnapshot);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [applySnapshot, snapshot.isRunning, snapshot.state]);

  const hydrateClock = useCallback((options: HydrateClockOptions) => {
    const nextSnapshot = syncClock(options.seconds, options);
    setPauseSourceForState(nextSnapshot, options.isRunning ? null : pauseSource);
    return nextSnapshot;
  }, [pauseSource, setPauseSourceForState, syncClock]);

  const formatTime = useCallback((seconds?: number) => {
    return clockRef.current.formatTime(seconds);
  }, []);

  const iniciarPrimeiroTempo = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state !== 'PRE_JOGO') {
      return buildError('A partida so pode ser iniciada a partir do pre-jogo.');
    }
    runClockCommand((clock) => clock.start(), null);
    return buildSuccess();
  }, [runClockCommand]);

  const pausar = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state === 'PAUSADO' && !current.isRunning) {
      setPauseSource('manual');
      return buildSuccess();
    }
    if (!current.isRunning || !RUNNING_STATES.has(current.state)) {
      return buildError('O cronometro so pode ser pausado enquanto a partida estiver em andamento.');
    }
    runClockCommand((clock) => clock.pause(), 'manual');
    return buildSuccess();
  }, [runClockCommand]);

  const pausarPorEvento = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state === 'PAUSADO' && !current.isRunning) {
      setPauseSource('event');
      return buildSuccess();
    }
    if (current.state === 'ENCERRADO' || current.state === 'SINCRONIZANDO' || current.state === 'INTERVALO') {
      return buildError('Nao e possivel pausar o cronometro por evento neste estado.');
    }
    runClockCommand((clock) => clock.pause(), 'event');
    return buildSuccess();
  }, [runClockCommand]);

  const continuarPartida = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state !== 'PAUSADO') {
      return buildError('A partida so pode ser retomada a partir do estado pausado.');
    }
    runClockCommand((clock) => clock.resume(), null);
    return buildSuccess();
  }, [runClockCommand]);

  const encerrarPrimeiroTempo = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.period !== '1T' || !['PRIMEIRO_TEMPO', 'PAUSADO'].includes(current.state)) {
      return buildError('O primeiro tempo so pode ser encerrado durante o proprio primeiro tempo.');
    }
    runClockCommand((clock) => clock.enterInterval(), null);
    return buildSuccess();
  }, [runClockCommand]);

  const iniciarSegundoTempo = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state !== 'INTERVALO') {
      return buildError('O segundo tempo so pode ser iniciado a partir do intervalo.');
    }
    runClockCommand((clock) => {
      clock.startSecondHalf();
      return clock.start();
    }, null);
    return buildSuccess();
  }, [runClockCommand]);

  const encerrarPartida = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.period !== '2T' || !['SEGUNDO_TEMPO', 'PAUSADO'].includes(current.state)) {
      return buildError('A partida so pode ser encerrada durante o segundo tempo.');
    }
    runClockCommand((clock) => clock.end(), null);
    return buildSuccess();
  }, [runClockCommand]);

  const retornarAoPrimeiroTempo = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.period !== '2T' || !['SEGUNDO_TEMPO', 'PAUSADO'].includes(current.state)) {
      return buildError('O retorno ao primeiro tempo so e permitido a partir do segundo tempo.');
    }
    runClockCommand((clock) => clock.returnToFirstHalf(), null);
    return buildSuccess();
  }, [runClockCommand]);

  const iniciarSincronizacao = useCallback((): SyncResult => {
    const current = snapshotRef.current;
    if (current.state === 'SINCRONIZANDO') {
      return buildError('A sincronizacao do cronometro ja esta aberta.');
    }
    if (current.state === 'ENCERRADO') {
      return buildError('Nao e possivel sincronizar o cronometro apos o encerramento da partida.');
    }
    syncRestoreRef.current = {
      snapshot: current,
      pauseSource,
    };
    const nextSnapshot = syncClock(current.currentTimeSeconds, {
      period: current.period,
      firstHalfLocked: current.firstHalfLocked,
      state: 'SINCRONIZANDO',
      isRunning: false,
    });
    setPauseSourceForState(nextSnapshot, null);
    return buildSuccess();
  }, [pauseSource, setPauseSourceForState, syncClock]);

  const restorePreviousSnapshot = useCallback((restorePoint: RestorePoint): ClockSnapshot => {
    return syncClock(restorePoint.snapshot.currentTimeSeconds, {
      period: restorePoint.snapshot.period,
      firstHalfLocked: restorePoint.snapshot.firstHalfLocked,
      state: restorePoint.snapshot.state,
      isRunning: restorePoint.snapshot.isRunning,
    });
  }, [syncClock]);

  const confirmarSincronizacao = useCallback((minute: number, second: number): SyncResult => {
    const restorePoint = syncRestoreRef.current;
    if (!restorePoint) {
      return buildError('Nenhuma sincronizacao esta em andamento.');
    }
    if (!Number.isInteger(minute) || !Number.isInteger(second)) {
      return buildError('Minuto e segundo devem ser valores numericos inteiros.');
    }
    if (minute < 0 || second < 0) {
      return buildError('Nao sao permitidos valores negativos na sincronizacao.');
    }
    if (second > 59) {
      return buildError('O campo de segundos deve ficar entre 0 e 59.');
    }
    if (minute >= REGULATION_HALF_MINUTES) {
      return buildError('O minuto informado e invalido para o periodo atual.');
    }

    const targetSeconds = minute * 60 + second;
    const previousSnapshot = restorePoint.snapshot;
    const nextSnapshot = syncClock(targetSeconds, {
      period: previousSnapshot.period,
      firstHalfLocked: previousSnapshot.firstHalfLocked,
      state: previousSnapshot.state,
      isRunning: previousSnapshot.isRunning,
    });

    setPauseSourceForState(nextSnapshot, previousSnapshot.isRunning ? null : restorePoint.pauseSource);
    syncRestoreRef.current = null;
    return buildSuccess();
  }, [setPauseSourceForState, syncClock]);

  const cancelarSincronizacao = useCallback((): SyncResult => {
    const restorePoint = syncRestoreRef.current;
    if (!restorePoint) {
      return buildError('Nenhuma sincronizacao esta em andamento.');
    }
    const restoredSnapshot = restorePreviousSnapshot(restorePoint);
    setPauseSourceForState(restoredSnapshot, restorePoint.pauseSource);
    syncRestoreRef.current = null;
    return buildSuccess();
  }, [restorePreviousSnapshot, setPauseSourceForState]);

  const getEventStamp = useCallback((rawSeconds?: number, periodOverride?: MatchHalf) => {
    return buildEventStamp(clockRef.current, rawSeconds, periodOverride);
  }, []);

  const canRegisterRealtimeEvent = useMemo(() => {
    if (mode !== 'realtime') return true;
    return snapshot.isRunning && RUNNING_STATES.has(snapshot.state);
  }, [mode, snapshot.isRunning, snapshot.state]);

  return {
    snapshot,
    formatTime,
    hydrateClock,
    iniciarPrimeiroTempo,
    pausar,
    pausarPorEvento,
    continuarPartida,
    encerrarPrimeiroTempo,
    iniciarSegundoTempo,
    encerrarPartida,
    retornarAoPrimeiroTempo,
    iniciarSincronizacao,
    confirmarSincronizacao,
    cancelarSincronizacao,
    getEventStamp,
    isPausedByEvent: snapshot.state === 'PAUSADO' && pauseSource === 'event',
    isSyncing: snapshot.state === 'SINCRONIZANDO',
    canRegisterRealtimeEvent,
  };
}

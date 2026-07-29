import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShellFinalizationFlow } from './collection-shell/ShellFinalizationFlow';
import { ShellOperationalHeader } from './collection-shell/ShellOperationalHeader';
import { ShellRecentEvents } from './collection-shell/ShellRecentEvents';
import { ShellStatusPanel } from './collection-shell/ShellStatusPanel';
import {
  FinalizationResult,
  ShellClockAction,
  ShellEligiblePlayer,
  ShellFoulSnapshot,
  ShellManualTime,
  ShellPeriodAction,
  ShellRecentEvent,
  ShellScoreSnapshot,
  ShellStep,
} from './collection-shell/types';

interface ShellMetricEntry {
  type: 'start' | 'interaction' | 'cancel' | 'confirm' | 'success' | 'error';
  mode: 'realtime' | 'postmatch';
  durationMs?: number;
  interactionCount?: number;
  detail?: string;
  createdAt: string;
}

declare global {
  interface Window {
    __scout21CollectionShellMetrics__?: ShellMetricEntry[];
  }
}

export interface CollectionShellExperimentalProps {
  mode: 'realtime' | 'postmatch';
  clockTimeLabel: string;
  clockStateLabel: string;
  currentPeriod: '1T' | '2T';
  score: ShellScoreSnapshot;
  fouls: ShellFoulSnapshot;
  eligiblePlayers: ShellEligiblePlayer[];
  recentEvents: ShellRecentEvent[];
  collectionStatusMessage: string;
  hasUnsavedChanges: boolean;
  finalizationEnabled: boolean;
  disabledReason?: string | null;
  showPausedAlert?: boolean;
  clockPrimaryAction?: ShellClockAction | null;
  onOpenClockSync?: (() => void) | null;
  postmatchPeriodAction?: ShellPeriodAction | null;
  manualTime?: ShellManualTime;
  onOpenLogs: () => void;
  onSave: () => void;
  onReturnToCurrentExperience?: (() => void) | null;
  experienceNotice?: string | null;
  onCancelCurrentFlow: () => void;
  onRegisterFinalization: (input: {
    playerId: string;
    result: FinalizationResult;
  }) => void | Promise<void>;
}

const SUCCESS_RESET_DELAY_MS = 900;

function isLocalMetricEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function pushLocalMetric(entry: Omit<ShellMetricEntry, 'createdAt'>): void {
  if (!isLocalMetricEnvironment() || typeof window === 'undefined') return;
  const nextEntry: ShellMetricEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };
  const bucket = window.__scout21CollectionShellMetrics__ ?? [];
  bucket.push(nextEntry);
  window.__scout21CollectionShellMetrics__ = bucket;
  console.info('[collection-shell]', nextEntry.type, {
    mode: nextEntry.mode,
    durationMs: nextEntry.durationMs,
    interactionCount: nextEntry.interactionCount,
    detail: nextEntry.detail,
  });
}

export const CollectionShellExperimental: React.FC<CollectionShellExperimentalProps> = ({
  mode,
  clockTimeLabel,
  clockStateLabel,
  currentPeriod,
  score,
  fouls,
  eligiblePlayers,
  recentEvents,
  collectionStatusMessage,
  hasUnsavedChanges,
  finalizationEnabled,
  disabledReason,
  showPausedAlert = false,
  clockPrimaryAction,
  onOpenClockSync,
  postmatchPeriodAction,
  manualTime,
  onOpenLogs,
  onSave,
  onReturnToCurrentExperience,
  experienceNotice,
  onCancelCurrentFlow,
  onRegisterFinalization,
}) => {
  const [step, setStep] = useState<ShellStep>('IDLE');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<FinalizationResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const flowStartTimeRef = useRef<number | null>(null);
  const interactionCountRef = useRef(0);
  const confirmInFlightRef = useRef(false);

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return eligiblePlayers.find((player) => player.id === selectedPlayerId) ?? null;
  }, [eligiblePlayers, selectedPlayerId]);

  const selectedResultLabel = useMemo(() => {
    switch (selectedResult) {
      case 'inside':
        return 'No gol';
      case 'outside':
        return 'Para fora';
      case 'blocked':
        return 'Bloqueada';
      default:
        return null;
    }
  }, [selectedResult]);

  useEffect(() => {
    if (step !== 'SUCCESS') return;
    const timer = window.setTimeout(() => {
      setStep('IDLE');
      setSelectedPlayerId(null);
      setSelectedResult(null);
      setLocalError(null);
    }, SUCCESS_RESET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  const registerInteraction = (detail: string) => {
    interactionCountRef.current += 1;
    pushLocalMetric({
      type: 'interaction',
      mode,
      detail,
      interactionCount: interactionCountRef.current,
    });
  };

  const resetFlow = (reason?: string) => {
    if (flowStartTimeRef.current != null) {
      pushLocalMetric({
        type: 'cancel',
        mode,
        detail: reason ?? 'cancelled',
        durationMs: Date.now() - flowStartTimeRef.current,
        interactionCount: interactionCountRef.current,
      });
    }
    flowStartTimeRef.current = null;
    interactionCountRef.current = 0;
    confirmInFlightRef.current = false;
    setStep('IDLE');
    setSelectedPlayerId(null);
    setSelectedResult(null);
    setLocalError(null);
    onCancelCurrentFlow();
  };

  const startFlow = () => {
    if (!finalizationEnabled) {
      setLocalError(disabledReason ?? 'A Finalizacao ainda nao pode ser registrada neste momento.');
      return;
    }
    onCancelCurrentFlow();
    flowStartTimeRef.current = Date.now();
    interactionCountRef.current = 1;
    setSelectedPlayerId(null);
    setSelectedResult(null);
    setLocalError(null);
    setStep('SELECTING_ATHLETE');
    pushLocalMetric({
      type: 'start',
      mode,
      interactionCount: interactionCountRef.current,
      detail: 'finalization',
    });
  };

  const handleBack = () => {
    registerInteraction('back');
    setLocalError(null);
    if (step === 'SELECTING_RESULT') {
      setSelectedResult(null);
      setStep('SELECTING_ATHLETE');
      return;
    }
    if (step === 'READY_TO_CONFIRM') {
      setStep('SELECTING_RESULT');
      return;
    }
    resetFlow('back-to-idle');
  };

  const handleConfirm = async () => {
    if (!selectedPlayerId || !selectedResult || confirmInFlightRef.current) {
      if (!selectedPlayerId || !selectedResult) {
        setLocalError('Selecione atleta e resultado antes de confirmar.');
      }
      return;
    }

    confirmInFlightRef.current = true;
    registerInteraction('confirm');
    setLocalError(null);
    setStep('CONFIRMING');

    try {
      await onRegisterFinalization({
        playerId: selectedPlayerId,
        result: selectedResult,
      });

      const durationMs =
        flowStartTimeRef.current != null ? Date.now() - flowStartTimeRef.current : undefined;

      pushLocalMetric({
        type: 'confirm',
        mode,
        interactionCount: interactionCountRef.current,
        durationMs,
        detail: selectedResult,
      });
      pushLocalMetric({
        type: 'success',
        mode,
        interactionCount: interactionCountRef.current,
        durationMs,
        detail: selectedResult,
      });

      flowStartTimeRef.current = null;
      interactionCountRef.current = 0;
      confirmInFlightRef.current = false;
      setStep('SUCCESS');
    } catch (error) {
      confirmInFlightRef.current = false;
      setStep('READY_TO_CONFIRM');
      setLocalError('Nao foi possivel registrar a Finalizacao. Tente novamente.');
      pushLocalMetric({
        type: 'error',
        mode,
        interactionCount: interactionCountRef.current,
        durationMs: flowStartTimeRef.current != null ? Date.now() - flowStartTimeRef.current : undefined,
        detail: error instanceof Error ? error.message : 'unknown-error',
      });
    }
  };

  const nextStepMessage = useMemo(() => {
    switch (step) {
      case 'SELECTING_ATHLETE':
        return 'Proximo passo: selecione o atleta responsavel pela Finalizacao.';
      case 'SELECTING_RESULT':
        return 'Proximo passo: escolha o resultado oficial da Finalizacao.';
      case 'READY_TO_CONFIRM':
        return 'Proximo passo: revise e confirme para registrar o evento.';
      case 'CONFIRMING':
        return 'Registrando Finalizacao...';
      case 'SUCCESS':
        return 'Finalizacao registrada com sucesso.';
      default:
        return 'Proximo passo: iniciar o fluxo de Finalizacao.';
    }
  }, [step]);

  const shellAlert =
    localError ||
    (!finalizationEnabled ? disabledReason ?? null : null) ||
    (showPausedAlert ? 'Cronometro pausado. Retome a partida para registrar novos eventos.' : null);

  return (
    <div
      data-testid="collection-shell-experimental"
      className="flex-1 min-h-0 overflow-hidden bg-black px-4 pb-4 pt-3"
    >
      <div className="grid h-full min-h-0 gap-3">
        <ShellOperationalHeader
          mode={mode}
          clockTimeLabel={clockTimeLabel}
          clockStateLabel={clockStateLabel}
          currentPeriod={currentPeriod}
          score={score}
          fouls={fouls}
          clockPrimaryAction={clockPrimaryAction}
          onOpenClockSync={onOpenClockSync}
          postmatchPeriodAction={postmatchPeriodAction}
          onOpenLogs={onOpenLogs}
          onSave={onSave}
          onReturnToCurrentExperience={onReturnToCurrentExperience}
        />

        <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.82fr)]">
          <ShellFinalizationFlow
            mode={mode}
            step={step}
            nextStepMessage={nextStepMessage}
            currentPeriod={currentPeriod}
            eligiblePlayers={eligiblePlayers}
            selectedPlayer={selectedPlayer}
            selectedResultLabel={selectedResultLabel}
            finalizationEnabled={finalizationEnabled}
            manualTime={manualTime}
            onStartFlow={startFlow}
            onPlayerSelect={(playerId) => {
              registerInteraction('player-selected');
              setSelectedPlayerId(playerId);
              setLocalError(null);
              setStep('SELECTING_RESULT');
            }}
            onResultSelect={(result) => {
              registerInteraction(`result-${result}`);
              setSelectedResult(result);
              setLocalError(null);
              setStep('READY_TO_CONFIRM');
            }}
            onBack={handleBack}
            onCancel={() => resetFlow('cancel-button')}
            onConfirm={handleConfirm}
            confirmDisabled={step !== 'READY_TO_CONFIRM' || confirmInFlightRef.current}
          />

          <aside className="flex min-h-0 flex-col gap-4">
            <ShellStatusPanel
              hasUnsavedChanges={hasUnsavedChanges}
              mode={mode}
              collectionStatusMessage={collectionStatusMessage}
              alertMessage={shellAlert}
              experienceNotice={experienceNotice}
            />
            <ShellRecentEvents recentEvents={recentEvents} />
          </aside>
        </div>
      </div>
    </div>
  );
};

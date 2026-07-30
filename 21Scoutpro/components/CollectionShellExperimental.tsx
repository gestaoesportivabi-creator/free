import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { ShellActionDeck } from './collection-shell/ShellActionDeck';
import { ShellAthleteRail } from './collection-shell/ShellAthleteRail';
import { ShellCommandBar } from './collection-shell/ShellCommandBar';
import { getEventSpecsForMode } from './collection-shell/eventSpecs';
import { ShellStage } from './collection-shell/ShellStage';
import { ShellTimelineStrip } from './collection-shell/ShellTimelineStrip';
import { pushShellMetric } from './collection-shell/metrics';
import {
  SharedEventInput,
  ShellClockAction,
  ShellEligiblePlayer,
  ShellFoulSnapshot,
  ShellPersistenceSnapshot,
  ShellRecentEvent,
  ShellScoreSnapshot,
} from './collection-shell/types';
import { useShellFeedback } from './collection-shell/useShellFeedback';
import { useShellFlow } from './collection-shell/useShellFlow';
import { useShellShortcuts } from './collection-shell/useShellShortcuts';

interface ActiveMetricFlow {
  eventId: string;
  inputMethod: 'touch' | 'keyboard' | 'preset';
  interactionCount: number;
  startedAt: number;
}

export interface CollectionShellExperimentalProps {
  mode: 'realtime' | 'postmatch';
  clockTimeLabel: string;
  clockStateLabel: string;
  currentPeriod: '1T' | '2T';
  eventTime: { seconds: number; period: '1T' | '2T' };
  score: ShellScoreSnapshot;
  fouls: ShellFoulSnapshot;
  eligiblePlayers: ShellEligiblePlayer[];
  benchPlayers: ShellEligiblePlayer[];
  stickyAthleteId: string | null;
  recentEvents: ShellRecentEvent[];
  latestEventCreatedAt?: number | null;
  hasUnsavedChanges: boolean;
  persistence: ShellPersistenceSnapshot;
  eventsEnabled: boolean;
  disabledReason?: string | null;
  clockPrimaryAction?: ShellClockAction | null;
  onOpenLogs: () => void;
  onSave: () => void;
  onReturnToCurrentExperience?: (() => void) | null;
  experienceNotice?: string | null;
  recoveryNotice?: string | null;
  reconciliationNotice?: string | null;
  onCancelCurrentFlow: () => void;
  onSelectStickyAthlete: (id: string | null) => void;
  onRegisterEvent: (input: SharedEventInput) => void | Promise<void>;
  onUndoEvent: (eventId: string) => void;
}

export const CollectionShellExperimental: React.FC<CollectionShellExperimentalProps> = ({
  mode,
  clockTimeLabel,
  clockStateLabel,
  currentPeriod,
  eventTime,
  score,
  fouls,
  eligiblePlayers,
  benchPlayers,
  stickyAthleteId,
  recentEvents,
  latestEventCreatedAt,
  hasUnsavedChanges,
  persistence,
  eventsEnabled,
  disabledReason,
  clockPrimaryAction,
  onOpenLogs,
  onSave,
  onReturnToCurrentExperience,
  experienceNotice,
  recoveryNotice,
  reconciliationNotice,
  onCancelCurrentFlow,
  onSelectStickyAthlete,
  onRegisterEvent,
  onUndoEvent,
}) => {
  const specs = useMemo(() => getEventSpecsForMode(mode), [mode]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [nextEventTime, setNextEventTime] = useState<{ seconds: number; period: '1T' | '2T' } | null>(null);
  const [isPortraitTablet, setIsPortraitTablet] = useState(false);
  const [isBelowRecommended, setIsBelowRecommended] = useState(false);
  const [politeAnnouncement, setPoliteAnnouncement] = useState('Shell de coleta pronto.');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');
  const metricFlowRef = useRef<ActiveMetricFlow | null>(null);
  const lastReportedErrorRef = useRef<string | null>(null);
  const { soundEnabled, setSoundEnabled, success: playSuccessFeedback } = useShellFeedback();
  const isAthleteEligible = useCallback(
    (step: { athleteRole?: 'goalkeeper' | 'bench' }, athleteId: string) => {
      if (!step.athleteRole) return true;
      if (step.athleteRole === 'bench') {
        return benchPlayers.some((candidate) => candidate.id === athleteId);
      }
      const athlete = eligiblePlayers.find((candidate) => candidate.id === athleteId);
      return step.athleteRole !== 'goalkeeper' || athlete?.isGoalkeeper === true;
    },
    [benchPlayers, eligiblePlayers]
  );
  const flow = useShellFlow({
    mode,
    stickyAthleteId,
    isAthleteEligible,
    onRegister: onRegisterEvent,
    onSuccess: (registeredSpec, _draft, durationMs) => {
      setNextEventTime(null);
      playSuccessFeedback();
      const metricFlow = metricFlowRef.current;
      pushShellMetric({
        type: 'success',
        mode,
        eventId: registeredSpec.id,
        durationMs,
        interactionCount: metricFlow?.interactionCount ?? 0,
        inputMethod: metricFlow?.inputMethod,
      });
      setAssertiveAnnouncement(`${registeredSpec.label} registrada com sucesso.`);
      metricFlowRef.current = null;
    },
  });

  const selectedAthlete = useMemo(() => {
    const id = flow.status === 'IDLE' ? stickyAthleteId : flow.draft?.playerId;
    return eligiblePlayers.find((player) => player.id === id) ?? null;
  }, [eligiblePlayers, flow.draft?.playerId, stickyAthleteId]);

  useEffect(() => {
    if (flow.status !== 'SUCCESS') return;
    const timer = window.setTimeout(flow.resetSuccess, 900);
    return () => window.clearTimeout(timer);
  }, [flow.resetSuccess, flow.status]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const portrait = window.matchMedia(
      '(orientation: portrait) and (min-width: 600px) and (max-width: 1024px)'
    );
    const belowRecommended = window.matchMedia('(max-width: 1023px)');
    const update = () => {
      setIsPortraitTablet(portrait.matches);
      setIsBelowRecommended(belowRecommended.matches && !portrait.matches);
    };
    update();
    portrait.addEventListener?.('change', update);
    belowRecommended.addEventListener?.('change', update);
    return () => {
      portrait.removeEventListener?.('change', update);
      belowRecommended.removeEventListener?.('change', update);
    };
  }, []);

  useEffect(() => {
    if (!showShortcuts) return;
    const dialog = document.querySelector<HTMLElement>('[data-testid="shell-shortcuts-dialog"]');
    const focusable = Array.from(
      dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, select, textarea') ?? []
    );
    focusable[0]?.focus();
    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowShortcuts(false);
        return;
      }
      if (event.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleDialogKeyboard);
    return () => window.removeEventListener('keydown', handleDialogKeyboard);
  }, [showShortcuts]);

  useEffect(() => {
    if (flow.status === 'STEP' && flow.currentStep) {
      setPoliteAnnouncement(
        `${flow.spec?.label ?? 'Evento'}. ${flow.currentStep.label}`
      );
      window.setTimeout(() => {
        const selector =
          flow.currentStep?.kind === 'ATHLETE' ||
          flow.currentStep?.kind === 'SECONDARY_ATHLETE'
            ? '[data-shell-athlete="true"]:not(:disabled)'
            : '[data-shell-option="true"]:not(:disabled)';
        document.querySelector<HTMLElement>(selector)?.focus();
      }, 0);
    } else if (flow.status === 'READY_TO_CONFIRM') {
      setPoliteAnnouncement(`${flow.spec?.label ?? 'Evento'} pronto para confirmar.`);
    } else if (flow.status === 'CONFIRMING') {
      setPoliteAnnouncement('Registrando evento.');
    }
  }, [flow.currentStep, flow.spec?.label, flow.status]);

  useEffect(() => {
    if (!flow.error || lastReportedErrorRef.current === flow.error) return;
    lastReportedErrorRef.current = flow.error;
    const metricFlow = metricFlowRef.current;
    pushShellMetric({
      type: 'error',
      mode,
      eventId: metricFlow?.eventId,
      durationMs: metricFlow ? Date.now() - metricFlow.startedAt : undefined,
      interactionCount: metricFlow?.interactionCount,
      inputMethod: metricFlow?.inputMethod,
      detail: flow.error,
    });
    setAssertiveAnnouncement(`Erro ao registrar evento: ${flow.error}`);
  }, [flow.error, mode]);

  const beginMetricFlow = (
    spec: (typeof specs)[number],
    inputMethod: ActiveMetricFlow['inputMethod'],
    interactionCount = 0
  ) => {
    metricFlowRef.current = {
      eventId: spec.id,
      inputMethod,
      interactionCount,
      startedAt: Date.now(),
    };
    lastReportedErrorRef.current = null;
    pushShellMetric({ type: 'start', mode, eventId: spec.id, inputMethod });
  };

  const trackInteraction = (detail?: string, type: 'interaction' | 'skip' = 'interaction') => {
    const active = metricFlowRef.current;
    if (active) active.interactionCount += 1;
    pushShellMetric({
      type,
      mode,
      eventId: active?.eventId,
      stepId: flow.currentStep?.id,
      inputMethod: active?.inputMethod,
      interactionCount: active?.interactionCount,
      detail,
    });
  };

  const startEvent = (
    spec: (typeof specs)[number],
    legacyCompatibility = false,
    inputMethod: ActiveMetricFlow['inputMethod'] = 'touch'
  ) => {
    if (!eventsEnabled) return;
    onCancelCurrentFlow();
    const previousMetricFlow = metricFlowRef.current;
    if (previousMetricFlow) {
      pushShellMetric({
        type: 'cancel',
        mode,
        eventId: previousMetricFlow.eventId,
        durationMs: Date.now() - previousMetricFlow.startedAt,
        interactionCount: previousMetricFlow.interactionCount,
        inputMethod: previousMetricFlow.inputMethod,
        detail: 'replaced-by-new-event',
      });
    }
    beginMetricFlow(spec, inputMethod);
    flow.start(spec, {
      forceReview: legacyCompatibility && !stickyAthleteId,
      patch: nextEventTime
        ? { timeOverride: nextEventTime.seconds, periodOverride: nextEventTime.period }
        : undefined,
    });
  };

  const selectAthlete = (id: string) => {
    if (
      flow.status === 'STEP' &&
      (flow.currentStep?.kind === 'ATHLETE' || flow.currentStep?.kind === 'SECONDARY_ATHLETE')
    ) {
      if (!isAthleteEligible(flow.currentStep, id)) return;
      if (flow.currentStep.kind === 'SECONDARY_ATHLETE' && flow.draft?.playerId === id) return;
      trackInteraction(id);
      if (flow.currentStep.kind === 'ATHLETE') onSelectStickyAthlete(id);
      flow.selectAthlete(id);
      return;
    }
    if (flow.status === 'STEP' && flow.spec) {
      onSelectStickyAthlete(id);
      flow.replaceAthlete(id, true);
      return;
    }
    onSelectStickyAthlete(stickyAthleteId === id ? null : id);
  };

  const undo = (inputMethod: 'touch' | 'keyboard' = 'touch') => {
    const latest = [...recentEvents].reverse()[0];
    if (!latest || !latestEventCreatedAt || Date.now() - latestEventCreatedAt > 30_000) return;
    onUndoEvent(latest.id);
    pushShellMetric({ type: 'undo', mode, eventId: latest.id, inputMethod });
    setAssertiveAnnouncement('Último evento desfeito.');
  };

  const confirmShellFlow = () => {
    trackInteraction('confirm');
    const active = metricFlowRef.current;
    pushShellMetric({
      type: 'confirm',
      mode,
      eventId: active?.eventId,
      interactionCount: active?.interactionCount,
      inputMethod: active?.inputMethod,
    });
    flow.confirm();
  };

  useShellShortcuts({
    enabled: !showShortcuts,
    inStep: flow.status === 'STEP',
    specs,
    athletes: [...eligiblePlayers, ...benchPlayers],
    options: flow.currentStep?.options ?? [],
    onStartEvent: (spec) => {
      pushShellMetric({ type: 'shortcut', mode, eventId: spec.id, inputMethod: 'keyboard' });
      startEvent(spec, false, 'keyboard');
    },
    onSelectAthlete: selectAthlete,
    onSelectOption: (option) => {
      trackInteraction(option.value);
      flow.chooseOption(option);
    },
    onEscape: flow.status === 'IDLE'
      ? () => undefined
      : () => {
          trackInteraction('back');
          flow.back();
        },
    onConfirm: confirmShellFlow,
    onSkip: flow.currentStep?.skipLabel
      ? () => {
          trackInteraction('__skip__', 'skip');
          flow.selectValue('__skip__');
        }
      : undefined,
    onUndo: () => undo('keyboard'),
    onClockToggle: clockPrimaryAction && !clockPrimaryAction.disabled ? clockPrimaryAction.onClick : undefined,
    onToggleOverlay: () => setShowShortcuts((value) => !value),
  });

  const displayStep =
    flow.status === 'STEP' && flow.currentStep?.kind === 'ATHLETE'
      ? 'SELECTING_ATHLETE'
      : flow.status === 'STEP'
        ? 'SELECTING_RESULT'
        : flow.status;

  if (isPortraitTablet) {
    return (
      <div data-testid="collection-shell-experimental" className="fixed inset-0 z-[400] grid place-items-center bg-black p-8 text-center">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="shell-orientation-title"
          aria-describedby="shell-orientation-description"
          data-testid="shell-portrait-blocker"
          className="max-w-md rounded-3xl border-2 border-cyan-400 bg-zinc-950 p-8 text-white"
        >
          <RotateCw size={48} className="mx-auto text-cyan-300" aria-hidden="true" />
          <h2 id="shell-orientation-title" className="mt-4 text-2xl font-black uppercase">
            Gire o tablet
          </h2>
          <p id="shell-orientation-description" className="mt-3 text-base leading-7 text-zinc-200">
            A coleta Shell exige orientação paisagem para manter atletas, ações e relógio visíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="collection-shell-experimental" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-testid="collection-shell-experimental"] *,
          [data-testid="collection-shell-experimental"] *::before,
          [data-testid="collection-shell-experimental"] *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="shell-live-polite">
        {politeAnnouncement}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" data-testid="shell-live-assertive">
        {assertiveAnnouncement}
      </div>
      <ShellCommandBar
        mode={mode}
        clockTimeLabel={clockTimeLabel}
        clockStateLabel={clockStateLabel}
        currentPeriod={currentPeriod}
        score={score}
        fouls={fouls}
        persistence={persistence}
        clockPrimaryAction={clockPrimaryAction}
        onOpenLogs={onOpenLogs}
        onSave={onSave}
        onReturnToCurrentExperience={onReturnToCurrentExperience}
        onToggleShortcuts={() => setShowShortcuts(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((value) => !value)}
      />
      <div className="flex min-h-0 flex-1 max-[1279px]:flex-col">
        <ShellAthleteRail
          athletes={eligiblePlayers}
          benchPlayers={benchPlayers}
          stickyAthleteId={stickyAthleteId}
          autoExpandBench={flow.currentStep?.athleteRole === 'bench'}
          onSelect={selectAthlete}
        />
        <ShellStage
          status={flow.status}
          displayStep={displayStep}
          spec={flow.spec}
          draft={flow.draft}
          step={flow.currentStep}
          stickyAthlete={selectedAthlete}
          lastEventText={[...recentEvents].reverse()[0]?.actionText}
          error={flow.error}
          eventTime={nextEventTime ?? eventTime}
          onChoose={(value) => {
            trackInteraction(value, value === '__skip__' ? 'skip' : 'interaction');
            const option = flow.currentStep?.options?.find((candidate) => candidate.value === value);
            if (option) flow.chooseOption(option);
            else flow.selectValue(value);
          }}
          onBack={() => {
            trackInteraction('back');
            flow.back();
          }}
          onCancel={() => {
            const active = metricFlowRef.current;
            pushShellMetric({
              type: 'cancel',
              mode,
              eventId: active?.eventId,
              durationMs: active ? Date.now() - active.startedAt : undefined,
              interactionCount: active?.interactionCount,
              inputMethod: active?.inputMethod,
            });
            metricFlowRef.current = null;
            flow.cancel();
            setPoliteAnnouncement('Fluxo cancelado.');
          }}
          onConfirm={confirmShellFlow}
          onSetTime={(seconds, period) => {
            setNextEventTime({ seconds, period });
            flow.setTimeOverride(seconds, period);
          }}
        />
      </div>
      <ShellActionDeck
        specs={specs}
        enabled={eventsEnabled}
        disabledReason={disabledReason}
        onStart={startEvent}
        onPreset={(spec, preset) => {
          if (!eventsEnabled) return;
          onCancelCurrentFlow();
          const previousMetricFlow = metricFlowRef.current;
          if (previousMetricFlow) {
            pushShellMetric({
              type: 'cancel',
              mode,
              eventId: previousMetricFlow.eventId,
              durationMs: Date.now() - previousMetricFlow.startedAt,
              interactionCount: previousMetricFlow.interactionCount,
              inputMethod: previousMetricFlow.inputMethod,
              detail: 'replaced-by-preset',
            });
          }
          pushShellMetric({ type: 'preset', mode, eventId: spec.id, inputMethod: 'preset', detail: preset.id });
          beginMetricFlow(spec, 'preset', 2);
          flow.start(spec, {
            patch: {
              ...preset.patch,
              ...(nextEventTime
                ? { timeOverride: nextEventTime.seconds, periodOverride: nextEventTime.period }
                : {}),
            },
          });
        }}
      />
      <ShellTimelineStrip recentEvents={recentEvents} latestEventCreatedAt={latestEventCreatedAt} onUndo={() => undo('touch')} onOpenLogs={onOpenLogs} />

      {experienceNotice && (
        <div data-testid="shell-experience-notice" className="fixed right-4 top-16 z-[240] rounded-xl border border-cyan-500/40 bg-zinc-950 px-4 py-3 text-xs text-cyan-100">
          {experienceNotice}
        </div>
      )}
      {recoveryNotice && (
        <div data-testid="shell-recovery-notice" className="fixed left-1/2 top-16 z-[240] -translate-x-1/2 rounded-xl border border-amber-500/40 bg-zinc-950 px-4 py-3 text-xs font-bold uppercase text-amber-100">
          {recoveryNotice}
        </div>
      )}
      {reconciliationNotice && (
        <div data-testid="shell-reconciliation-notice" className="fixed left-1/2 top-28 z-[240] -translate-x-1/2 rounded-xl border border-violet-500/40 bg-zinc-950 px-4 py-3 text-xs font-bold text-violet-100">
          {reconciliationNotice}
        </div>
      )}
      {isBelowRecommended && (
        <div data-testid="shell-viewport-warning" role="status" className="fixed bottom-16 left-1/2 z-[230] -translate-x-1/2 rounded-xl border border-amber-400 bg-zinc-950 px-4 py-3 text-xs font-bold text-amber-100">
          Viewport abaixo do recomendado. Use tablet em paisagem ou tela com pelo menos 1024px.
        </div>
      )}

      {showShortcuts && (
        <div data-testid="shell-shortcuts-dialog" className="fixed inset-0 z-[250] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Atalhos de teclado">
          <div className="max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-zinc-100">
            <div className="flex items-center justify-between gap-8">
              <h2 className="text-lg font-black uppercase">Atalhos</h2>
              <button type="button" onClick={() => setShowShortcuts(false)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold uppercase">Fechar</button>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              1–5 atletas · G Gol · F Finalização · L Falta · D Desarme · E Defesa · K Cartão · S Substituição · B Bloqueio · C Escanteio · P Pênalti · T Tiro livre · Z Zona de chute ·
              1–4 escolhem opções · 0 pula etapa opcional · Setas percorrem controles · Esc volta · Enter confirma · Cmd/Ctrl+Z desfaz · Espaço controla o relógio · ? abre esta ajuda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

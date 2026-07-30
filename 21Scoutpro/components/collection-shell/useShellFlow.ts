import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ShellChoiceOption,
  ShellEventDraft,
  ShellEventSpec,
  ShellFlowStep,
  SharedEventInput,
} from './types';

export type ShellFlowStatus = 'IDLE' | 'STEP' | 'READY_TO_CONFIRM' | 'CONFIRMING' | 'SUCCESS' | 'ERROR';

interface StartOptions {
  forceReview?: boolean;
  patch?: Partial<ShellEventDraft>;
}

interface UseShellFlowOptions {
  mode: 'realtime' | 'postmatch';
  stickyAthleteId: string | null;
  isAthleteEligible?: (step: ShellFlowStep, athleteId: string) => boolean;
  onRegister: (input: SharedEventInput) => void | Promise<void>;
  onSuccess?: (spec: ShellEventSpec, draft: ShellEventDraft, durationMs: number) => void;
}

function patchStep(
  draft: ShellEventDraft,
  step: ShellFlowStep,
  value: string
): ShellEventDraft {
  const choices = { ...draft.choices, [step.id]: value };
  if (step.kind === 'TEAM') {
    return {
      ...draft,
      team: value as 'for' | 'against',
      isOpponentGoal: value === 'against',
      playerId: value === 'against' ? undefined : draft.playerId,
      choices,
    };
  }
  if (step.kind === 'ZONE') {
    return { ...draft, zone: value === '__skip__' ? undefined : value, choices };
  }
  if (step.kind === 'SECONDARY_ATHLETE') {
    return { ...draft, secondaryPlayerId: value === '__skip__' ? undefined : value, choices };
  }
  if (step.kind === 'ATHLETE') return { ...draft, playerId: value, choices };
  if (step.field === 'cardType') {
    return { ...draft, cardType: value as ShellEventDraft['cardType'], choices };
  }
  if (step.field === 'goalMethod') return { ...draft, goalMethod: value, choices };
  if (step.field === 'wrongPassGeneratedTransition') {
    return { ...draft, wrongPassGeneratedTransition: value === 'true', choices };
  }
  return { ...draft, result: value, choices };
}

function hasStepValue(draft: ShellEventDraft, step: ShellFlowStep): boolean {
  if (Object.prototype.hasOwnProperty.call(draft.choices, step.id)) return true;
  if (step.kind === 'TEAM') return draft.team != null;
  if (step.kind === 'ATHLETE') return draft.playerId != null;
  if (step.kind === 'SECONDARY_ATHLETE') return draft.secondaryPlayerId != null;
  if (step.kind === 'ZONE') return draft.zone != null;
  if (step.field === 'cardType') return draft.cardType != null;
  if (step.field === 'goalMethod') return draft.goalMethod != null;
  if (step.field === 'wrongPassGeneratedTransition') {
    return draft.wrongPassGeneratedTransition != null;
  }
  return draft.result != null;
}

export function useShellFlow({
  mode,
  stickyAthleteId,
  isAthleteEligible,
  onRegister,
  onSuccess,
}: UseShellFlowOptions) {
  const [status, setStatus] = useState<ShellFlowStatus>('IDLE');
  const [spec, setSpec] = useState<ShellEventSpec | null>(null);
  const [draft, setDraft] = useState<ShellEventDraft | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<Array<{ draft: ShellEventDraft; stepIndex: number }>>([]);
  const startedAtRef = useRef(0);
  const forceReviewRef = useRef(false);
  const submittingRef = useRef(false);

  const currentStep = useMemo(
    () => (spec && stepIndex >= 0 ? spec.steps[stepIndex] ?? null : null),
    [spec, stepIndex]
  );

  const submit = useCallback(
    async (activeSpec: ShellEventSpec, activeDraft: ShellEventDraft) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setStatus('CONFIRMING');
      setError(null);
      try {
        await onRegister(activeSpec.toDomainInput(activeDraft));
        const durationMs = Date.now() - startedAtRef.current;
        setDraft(activeDraft);
        setStatus('SUCCESS');
        onSuccess?.(activeSpec, activeDraft, durationMs);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o evento.');
        setStatus('ERROR');
      } finally {
        submittingRef.current = false;
      }
    },
    [onRegister, onSuccess]
  );

  const advance = useCallback(
    (
      activeSpec: ShellEventSpec,
      activeDraft: ShellEventDraft,
      fromIndex: number
    ) => {
      let nextDraft = activeDraft;
      for (let index = fromIndex + 1; index < activeSpec.steps.length; index += 1) {
        const candidate = activeSpec.steps[index];
        if (candidate.disabledWhen?.(nextDraft) || candidate.skipWhen?.(nextDraft)) continue;
        if (
          hasStepValue(nextDraft, candidate) &&
          candidate.kind !== 'ATHLETE' &&
          candidate.kind !== 'SECONDARY_ATHLETE'
        ) {
          continue;
        }
        if (candidate.kind === 'ATHLETE' && nextDraft.playerId) {
          if (!isAthleteEligible || isAthleteEligible(candidate, nextDraft.playerId)) continue;
          nextDraft = { ...nextDraft, playerId: undefined };
        }
        if (candidate.kind === 'SECONDARY_ATHLETE' && hasStepValue(nextDraft, candidate)) continue;
        const validOptions = candidate.options?.filter(
          (option) => !candidate.disabledWhen?.(patchStep(nextDraft, candidate, option.value))
        );
        if (validOptions?.length === 1) {
          nextDraft = patchStep(nextDraft, candidate, validOptions[0].value);
          continue;
        }
        setDraft(nextDraft);
        setStepIndex(index);
        setStatus('STEP');
        return;
      }

      setDraft(nextDraft);
      setStepIndex(activeSpec.steps.length);
      if (activeSpec.requiresExplicitConfirm || forceReviewRef.current) {
        setStatus('READY_TO_CONFIRM');
        return;
      }
      void submit(activeSpec, nextDraft);
    },
    [isAthleteEligible, submit]
  );

  const start = useCallback(
    (nextSpec: ShellEventSpec, options?: StartOptions) => {
      const initialDraft: ShellEventDraft = {
        eventId: nextSpec.id,
        mode,
        playerId: stickyAthleteId ?? undefined,
        ...options?.patch,
        choices: { ...(options?.patch?.choices ?? {}) },
      };
      setSpec(nextSpec);
      setDraft(initialDraft);
      setError(null);
      setStepIndex(-1);
      historyRef.current = [];
      forceReviewRef.current = options?.forceReview === true;
      startedAtRef.current = Date.now();
      advance(nextSpec, initialDraft, -1);
    },
    [advance, mode, stickyAthleteId]
  );

  const selectValue = useCallback(
    (value: string) => {
      if (!spec || !draft || !currentStep) return;
      historyRef.current.push({ draft, stepIndex });
      const nextDraft = patchStep(draft, currentStep, value);
      advance(spec, nextDraft, stepIndex);
    },
    [advance, currentStep, draft, spec, stepIndex]
  );

  const selectAthlete = useCallback(
    (playerId: string) => selectValue(playerId),
    [selectValue]
  );

  const replaceAthlete = useCallback((playerId: string, requireReview = false) => {
    setDraft((current) => (current ? { ...current, playerId } : current));
    if (requireReview) forceReviewRef.current = true;
  }, []);

  const setTimeOverride = useCallback((timeOverride: number, periodOverride: '1T' | '2T') => {
    setDraft((current) => current ? { ...current, timeOverride, periodOverride } : current);
  }, []);

  const confirm = useCallback(() => {
    if (spec && draft) void submit(spec, draft);
  }, [draft, spec, submit]);

  const back = useCallback(() => {
    const previous = historyRef.current.pop();
    if (!previous) {
      setStatus('IDLE');
      setSpec(null);
      setDraft(null);
      setStepIndex(-1);
      return;
    }
    setDraft(previous.draft);
    setStepIndex(previous.stepIndex);
    setStatus('STEP');
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    historyRef.current = [];
    setStatus('IDLE');
    setSpec(null);
    setDraft(null);
    setStepIndex(-1);
    setError(null);
  }, []);

  const resetSuccess = useCallback(() => {
    setStatus('IDLE');
    setSpec(null);
    setDraft(null);
    setStepIndex(-1);
  }, []);

  const chooseOption = useCallback(
    (option: ShellChoiceOption) => selectValue(option.value),
    [selectValue]
  );

  return {
    status,
    spec,
    draft,
    currentStep,
    error,
    start,
    chooseOption,
    selectAthlete,
    selectValue,
    replaceAthlete,
    setTimeOverride,
    confirm,
    back,
    cancel,
    resetSuccess,
  };
}

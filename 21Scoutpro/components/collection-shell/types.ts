export type ShellStep =
  | 'IDLE'
  | 'SELECTING_ATHLETE'
  | 'SELECTING_RESULT'
  | 'READY_TO_CONFIRM'
  | 'CONFIRMING'
  | 'SUCCESS';

export type FinalizationResult = 'inside' | 'outside' | 'post' | 'blocked';

export type SemanticTone = 'goal' | 'finalization' | 'defensive' | 'infraction' | 'setPiece' | 'operational';
export type ShellMode = 'realtime' | 'postmatch';
export type ShellStepKind = 'TEAM' | 'ATHLETE' | 'SECONDARY_ATHLETE' | 'CHOICE' | 'ZONE' | 'TIME' | 'REVIEW';
export type ShellEventAction =
  | 'shot'
  | 'foul'
  | 'tackle'
  | 'save'
  | 'block'
  | 'corner'
  | 'goal'
  | 'card'
  | 'penalty'
  | 'freeKick'
  | 'pass'
  | 'keyPass'
  | 'assist'
  | 'lateral'
  | 'substitution';

export interface SharedEventInput {
  action: ShellEventAction;
  playerId?: string;
  secondaryPlayerId?: string;
  result?: string;
  team?: 'for' | 'against';
  cardType?: 'yellow' | 'secondYellow' | 'red';
  goalMethod?: string;
  isOpponentGoal?: boolean;
  wrongPassGeneratedTransition?: boolean;
  zone?: string;
  timeOverride?: number;
  periodOverride?: '1T' | '2T';
  recordedByUserId?: string;
  recordedByName?: string;
}

export interface ShellEventDraft {
  eventId: string;
  mode?: ShellMode;
  playerId?: string;
  secondaryPlayerId?: string;
  team?: 'for' | 'against';
  result?: string;
  cardType?: 'yellow' | 'secondYellow' | 'red';
  goalMethod?: string;
  isOpponentGoal?: boolean;
  wrongPassGeneratedTransition?: boolean;
  zone?: string;
  choices: Record<string, string>;
  timeOverride?: number;
  periodOverride?: '1T' | '2T';
}

export interface ShellChoiceOption {
  value: string;
  label: string;
  helper?: string;
  shortcut?: string;
  tone?: SemanticTone;
}

export interface ShellFlowStep {
  id: string;
  kind: ShellStepKind;
  label: string;
  optional?: boolean;
  athleteRole?: 'goalkeeper' | 'bench';
  field?: 'result' | 'cardType' | 'goalMethod' | 'wrongPassGeneratedTransition';
  skipLabel?: string;
  options?: ShellChoiceOption[];
  skipWhen?: (draft: ShellEventDraft) => boolean;
  disabledWhen?: (draft: ShellEventDraft) => boolean;
}

export interface ShellEventPreset {
  id: string;
  label: string;
  patch: Partial<ShellEventDraft>;
}

export interface ShellEventSpec {
  id: string;
  label: string;
  testId?: string;
  shortcut: string;
  classe: 'A' | 'B' | 'C' | 'D';
  tier: 'primary' | 'secondary' | 'overflow';
  modes: ShellMode[];
  tone: SemanticTone;
  requiresExplicitConfirm?: boolean;
  steps: ShellFlowStep[];
  presets?: ShellEventPreset[];
  toDomainInput: (draft: ShellEventDraft) => SharedEventInput;
}

export interface ShellEligiblePlayer {
  id: string;
  name: string;
  jerseyNumber?: string | number | null;
  position?: string | null;
  isGoalkeeper?: boolean;
  disabled?: boolean;
}

export interface ShellRecentEvent {
  id: string;
  timeLabel: string;
  playerName: string;
  actionText: string;
  zone?: string;
}

export interface ShellPersistenceSnapshot {
  state: 'saved' | 'saving' | 'queued';
  queuedCount?: number;
  lastSavedAt?: number;
  retryAt?: number;
}

export interface ShellClockAction {
  label: string;
  onClick: () => void;
  disabled: boolean;
  testId: string;
}

export interface ShellPeriodAction {
  label: string;
  onClick: () => void;
  testId: string;
}

export interface ShellScoreSnapshot {
  teamName: string;
  opponentName: string;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ShellFoulSnapshot {
  for: number;
  against: number;
}

export interface ShellManualTime {
  minute: number;
  second: number;
  onMinuteChange: (value: number) => void;
  onSecondChange: (value: number) => void;
}

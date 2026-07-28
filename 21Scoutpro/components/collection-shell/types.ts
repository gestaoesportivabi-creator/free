export type ShellStep =
  | 'IDLE'
  | 'SELECTING_ATHLETE'
  | 'SELECTING_RESULT'
  | 'READY_TO_CONFIRM'
  | 'CONFIRMING'
  | 'SUCCESS';

export type FinalizationResult = 'inside' | 'outside' | 'blocked';

export interface ShellEligiblePlayer {
  id: string;
  name: string;
  jerseyNumber?: string | number | null;
}

export interface ShellRecentEvent {
  id: string;
  timeLabel: string;
  playerName: string;
  actionText: string;
  zone?: string;
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

import React, { useEffect, useState } from 'react';
import { HelpCircle, List, Save, Volume2, VolumeX } from 'lucide-react';
import {
  ShellClockAction,
  ShellFoulSnapshot,
  ShellPersistenceSnapshot,
  ShellScoreSnapshot,
} from './types';

interface ShellCommandBarProps {
  mode: 'realtime' | 'postmatch';
  clockTimeLabel: string;
  clockStateLabel: string;
  currentPeriod: '1T' | '2T';
  score: ShellScoreSnapshot;
  fouls: ShellFoulSnapshot;
  persistence: ShellPersistenceSnapshot;
  clockPrimaryAction?: ShellClockAction | null;
  onOpenLogs: () => void;
  onSave: () => void;
  onReturnToCurrentExperience?: (() => void) | null;
  onToggleShortcuts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ShellCommandBar: React.FC<ShellCommandBarProps> = ({
  mode,
  clockTimeLabel,
  clockStateLabel,
  currentPeriod,
  score,
  fouls,
  persistence,
  clockPrimaryAction,
  onOpenLogs,
  onSave,
  onReturnToCurrentExperience,
  onToggleShortcuts,
  soundEnabled,
  onToggleSound,
}) => {
  const [, setClockTick] = useState(0);
  useEffect(() => {
    if (persistence.state !== 'saved' || !persistence.lastSavedAt) return;
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 5000);
    return () => window.clearInterval(timer);
  }, [persistence.lastSavedAt, persistence.state]);

  const savedSeconds = persistence.lastSavedAt
    ? Math.max(0, Math.floor((Date.now() - persistence.lastSavedAt) / 1000))
    : null;
  const persistenceLabel =
    persistence.state === 'queued'
      ? `⚠ ${persistence.queuedCount ?? 1} na fila`
      : persistence.state === 'saving'
        ? '⟳ salvando'
        : `☁ salvo${savedSeconds == null ? '' : ` ${savedSeconds}s`}`;

  return (
    <header className="flex h-14 min-h-14 items-center gap-2 border-b border-zinc-700 bg-zinc-950 px-2 xl:gap-4 xl:px-3">
      <span
        data-testid="shell-badge"
        className="shrink-0 rounded-full border border-cyan-300 bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100"
      >
        Shell experimental
      </span>
      <div className="flex shrink-0 items-baseline gap-2">
        <strong data-testid="shell-clock-time" className="font-mono text-xl tabular-nums text-white">
          {clockTimeLabel}
        </strong>
        <span data-testid="shell-clock-state" className="text-[10px] font-black uppercase text-emerald-300">
          {mode === 'postmatch' ? 'POS-JOGO' : clockStateLabel} · {currentPeriod}
        </span>
      </div>
      <div className="min-w-0 flex-1 truncate text-center text-sm font-black text-white">
        <span className="hidden text-zinc-300 xl:inline">{score.teamName} </span>
        <span data-testid="shell-score-us">{score.goalsFor}</span>
        <span className="px-2 text-zinc-600">×</span>
        <span data-testid="shell-score-opponent">{score.goalsAgainst}</span>{' '}
        <span className="hidden text-zinc-300 xl:inline"> {score.opponentName}</span>
      </div>
      <div className={`shrink-0 text-xs font-bold ${fouls.for >= 6 || fouls.against >= 6 ? 'text-red-300' : fouls.for >= 5 || fouls.against >= 5 ? 'text-amber-300' : 'text-zinc-300'}`}>
        FALTAS <span data-testid="shell-fouls-for">{fouls.for}</span>│<span data-testid="shell-fouls-against">{fouls.against}</span>
      </div>
      <span data-testid="shell-persistence-state" role="status" aria-live="polite" aria-atomic="true" className="hidden shrink-0 text-[10px] font-bold uppercase text-zinc-300 lg:inline">
        {persistenceLabel}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {onReturnToCurrentExperience && (
          <button
            type="button"
            onClick={onReturnToCurrentExperience}
            data-testid="shell-return-current"
            className="hidden min-h-11 rounded-lg border border-zinc-600 px-2 text-[10px] font-black uppercase text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 xl:block"
          >
            Interface atual
          </button>
        )}
        {clockPrimaryAction && (
          <button
            type="button"
            onClick={clockPrimaryAction.onClick}
            disabled={clockPrimaryAction.disabled}
            data-testid={clockPrimaryAction.testId}
            className="min-h-11 rounded-lg border border-emerald-400/80 px-2 text-[10px] font-black uppercase text-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50"
          >
            {clockPrimaryAction.label}
          </button>
        )}
        <button type="button" onClick={onToggleShortcuts} aria-label="Atalhos" aria-keyshortcuts="?" className="grid size-11 place-items-center rounded-lg text-zinc-100 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <HelpCircle size={18} />
        </button>
        <button type="button" onClick={onToggleSound} aria-label={soundEnabled ? 'Desligar som' : 'Ligar som'} aria-pressed={soundEnabled} className="grid size-11 place-items-center rounded-lg text-zinc-100 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button type="button" onClick={onSave} data-testid="shell-save" aria-label="Salvar incompleta" className="grid size-11 place-items-center rounded-lg text-zinc-100 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <Save size={18} />
        </button>
        <button type="button" onClick={onOpenLogs} data-testid="shell-open-log" aria-label="Log completo" className="grid size-11 place-items-center rounded-lg text-cyan-200 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <List size={18} />
        </button>
      </div>
    </header>
  );
};

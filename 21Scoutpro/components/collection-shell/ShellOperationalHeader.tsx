import React from 'react';
import { List, Target } from 'lucide-react';
import {
  ShellClockAction,
  ShellFoulSnapshot,
  ShellPeriodAction,
  ShellScoreSnapshot,
} from './types';

interface ShellOperationalHeaderProps {
  mode: 'realtime' | 'postmatch';
  clockTimeLabel: string;
  clockStateLabel: string;
  currentPeriod: '1T' | '2T';
  score: ShellScoreSnapshot;
  fouls: ShellFoulSnapshot;
  clockPrimaryAction?: ShellClockAction | null;
  onOpenClockSync?: (() => void) | null;
  postmatchPeriodAction?: ShellPeriodAction | null;
  onOpenLogs: () => void;
  onSave: () => void;
  onReturnToCurrentExperience?: (() => void) | null;
}

export const ShellOperationalHeader: React.FC<ShellOperationalHeaderProps> = ({
  mode,
  clockTimeLabel,
  clockStateLabel,
  currentPeriod,
  score,
  fouls,
  clockPrimaryAction,
  onOpenClockSync,
  postmatchPeriodAction,
  onOpenLogs,
  onSave,
  onReturnToCurrentExperience,
}) => {
  const clockStateText =
    mode === 'postmatch' ? `POS-JOGO · ${currentPeriod}` : `${clockStateLabel} · ${currentPeriod}`;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <Target size={14} />
            <span data-testid="shell-badge">Shell experimental</span>
          </div>
          <h2 className="mt-2 text-base font-black uppercase tracking-[0.08em] text-white sm:text-lg">
            Finalizacao · Evento {'->'} Atleta
          </h2>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onReturnToCurrentExperience ? (
            <button
              type="button"
              onClick={onReturnToCurrentExperience}
              data-testid="shell-return-current"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Voltar para interface atual
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            data-testid="shell-save"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Salvar incompleta
          </button>
          <button
            type="button"
            onClick={onOpenLogs}
            data-testid="shell-open-log"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200 transition-colors hover:bg-cyan-500/20"
          >
            <List size={14} />
            Log completo
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Tempo</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p
                data-testid="shell-clock-time"
                className="text-[1.9rem] font-black tabular-nums text-white"
              >
                {clockTimeLabel}
              </p>
              <p
                data-testid="shell-clock-state"
                className="text-right text-[10px] font-semibold uppercase leading-tight text-zinc-300"
              >
                {clockStateText}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Placar</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase text-zinc-400">{score.teamName}</p>
                <p data-testid="shell-score-us" className="text-3xl font-black text-cyan-300">
                  {score.goalsFor}
                </p>
              </div>
              <span className="pb-1 text-lg font-black text-zinc-600">x</span>
              <div className="min-w-0 text-right">
                <p className="truncate text-[10px] font-bold uppercase text-zinc-400">{score.opponentName}</p>
                <p data-testid="shell-score-opponent" className="text-3xl font-black text-red-300">
                  {score.goalsAgainst}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Faltas</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center">
                <p className="text-[10px] font-bold uppercase text-amber-200">Nossa</p>
                <p data-testid="shell-fouls-for" className="text-2xl font-black text-amber-100">
                  {fouls.for}
                </p>
              </div>
              <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-center">
                <p className="text-[10px] font-bold uppercase text-orange-200">Adv.</p>
                <p data-testid="shell-fouls-against" className="text-2xl font-black text-orange-100">
                  {fouls.against}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Controles</p>
              <p className="mt-1 text-[11px] text-zinc-400">
                {mode === 'postmatch'
                  ? 'Periodo manual compartilhado com o fluxo oficial.'
                  : 'ClockService oficial compartilhado com o fluxo atual.'}
              </p>
            </div>
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
              {mode === 'postmatch' ? 'pos-jogo' : 'realtime'}
            </span>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {clockPrimaryAction ? (
              <button
                type="button"
                onClick={clockPrimaryAction.onClick}
                disabled={clockPrimaryAction.disabled}
                data-testid={clockPrimaryAction.testId}
                className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] transition-colors ${
                  clockPrimaryAction.disabled
                    ? 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                }`}
              >
                {clockPrimaryAction.label}
              </button>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-[11px] font-bold uppercase text-zinc-500">
                Sem acao primaria
              </div>
            )}

            {mode === 'postmatch' && postmatchPeriodAction && (
              <button
                type="button"
                onClick={postmatchPeriodAction.onClick}
                data-testid={postmatchPeriodAction.testId}
                className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-sky-200 transition-colors hover:bg-sky-500/20"
              >
                {postmatchPeriodAction.label}
              </button>
            )}

            {mode === 'realtime' && onOpenClockSync && (
              <button
                type="button"
                onClick={onOpenClockSync}
                data-testid="shell-clock-sync"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Sincronizar relogio
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

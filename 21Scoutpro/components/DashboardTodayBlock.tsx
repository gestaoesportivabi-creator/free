import React from 'react';
import { Clock, Trophy, Target, AlertTriangle } from 'lucide-react';

export type CommitmentType = 'jogo' | 'treino' | null;
export type NextCommitmentInfo = {
  type: CommitmentType;
  label: string;
  competition?: string;
  countdown: { hours: number; minutes: number } | null;
} | null;

export type ActiveAlert = { kind: 'lesão'; count: number } | { kind: 'suspenso'; count: number } | { kind: 'pendurado'; count: number };

interface DashboardTodayBlockProps {
  nextCommitment: NextCommitmentInfo;
  focusOfDay: string;
  activeAlerts: ActiveAlert[];
}

export const DashboardTodayBlock: React.FC<DashboardTodayBlockProps> = ({
  nextCommitment,
  focusOfDay,
  activeAlerts,
}) => {
  return (
    <section
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-sm px-5 py-4 md:px-6 md:py-5"
      aria-label="Status operacional"
    >
      <h2 className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-semibold mb-4">
        Status operacional do dia
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <Target className="text-zinc-300" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Compromisso</p>
            <p className="text-white font-semibold text-sm mt-0.5">
              {nextCommitment?.type === 'jogo'
                ? 'Jogo'
                : nextCommitment?.type === 'treino'
                ? 'Treino'
                : '—'}
            </p>
            {nextCommitment?.label && (
              <p className="text-zinc-400 text-xs truncate">{nextCommitment.label}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <Clock className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tempo até</p>
            <p className="text-white font-semibold text-base mt-0.5">
              {nextCommitment?.countdown
                ? `${nextCommitment.countdown.hours > 0 ? `${nextCommitment.countdown.hours}h ` : ''}${nextCommitment.countdown.minutes}min`
                : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <Trophy className="text-zinc-300" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Foco do dia</p>
            <p className="text-white font-semibold text-sm mt-0.5 line-clamp-2">{focusOfDay || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Indicadores</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {activeAlerts.length === 0 ? (
                <span className="text-zinc-500 text-xs">Nenhum</span>
              ) : (
                activeAlerts.map((a, i) =>
                  a.kind === 'lesão' && a.count > 0 ? (
                    <span key={i} className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-[10px] font-medium border border-zinc-600">
                      {a.count} lesão{a.count !== 1 ? 'ões' : ''}
                    </span>
                  ) : a.kind === 'suspenso' && a.count > 0 ? (
                    <span key={i} className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-[10px] font-medium border border-zinc-600">
                      {a.count} susp.
                    </span>
                  ) : a.kind === 'pendurado' && a.count > 0 ? (
                    <span key={i} className="px-2 py-0.5 rounded bg-zinc-700 text-amber-200/90 text-[10px] font-medium border border-zinc-600">
                      {a.count} pend.
                    </span>
                  ) : null
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

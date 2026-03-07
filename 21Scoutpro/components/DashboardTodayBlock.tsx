import React from 'react';
import { Clock, Trophy, Target, AlertTriangle } from 'lucide-react';

export type CommitmentType = 'jogo' | 'treino' | null;
export type NextCommitmentInfo = {
  type: CommitmentType;
  label: string;
  /** Nome da atividade para exibir em "Compromisso" (Jogo, Treino, Musculação, etc.) */
  activityDisplay?: string;
  /** Horário do compromisso (HH:MM) para exibir em "Tempo até" */
  timeLabel?: string;
  competition?: string;
  countdown: { hours: number; minutes: number } | null;
} | null;

export type ActiveAlert = { kind: 'lesão'; count: number } | { kind: 'suspenso'; count: number } | { kind: 'pendurado'; count: number };

/** Resultado das últimas partidas (V=vitória, D=derrota, E=empate) para bolinhas no Indicadores */
export type LastMatchResults = ('V' | 'D' | 'E')[];

interface DashboardTodayBlockProps {
  nextCommitment: NextCommitmentInfo;
  focusOfDay: string;
  activeAlerts: ActiveAlert[];
  /** Últimas partidas (V/D/E) para bolinhas no card Indicadores */
  lastMatchResults?: LastMatchResults;
}

export const DashboardTodayBlock: React.FC<DashboardTodayBlockProps> = ({
  nextCommitment,
  focusOfDay,
  activeAlerts,
  lastMatchResults = [],
}) => {
  const hasResults = lastMatchResults.length > 0;
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
              {nextCommitment?.activityDisplay ?? (nextCommitment?.type === 'jogo' ? 'Jogo' : nextCommitment?.type === 'treino' ? 'Treino' : '—')}
            </p>
            {nextCommitment?.label && nextCommitment.type === 'jogo' && (
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
            {nextCommitment?.timeLabel && (
              <p className="text-zinc-500 text-[11px] mt-0.5">às {nextCommitment.timeLabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <Trophy className="text-zinc-300" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Foco do dia</p>
            <p className="text-white font-semibold text-sm mt-0.5 line-clamp-3 whitespace-pre-wrap">{focusOfDay || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Últimas partidas
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {hasResults ? (
                lastMatchResults.map((result, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    title={result === 'V' ? 'Vitória' : result === 'D' ? 'Derrota' : 'Empate'}
                    style={{
                      backgroundColor: result === 'V' ? '#22c55e' : result === 'D' ? '#ef4444' : '#e5e7eb',
                    }}
                  />
                ))
              ) : (
                <span className="text-zinc-500 text-xs">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

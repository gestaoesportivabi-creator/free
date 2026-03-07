import React from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Player } from '../types';
import { Championship } from '../types';

export type NextMatchInfo = {
  id?: string;
  date: string;
  time?: string;
  team?: string;
  opponent: string;
  competition?: string;
  dateTime?: Date;
} | null;

interface DashboardNextGameCardProps {
  nextMatch: NextMatchInfo;
  championships: Championship[];
  players: Player[];
  /** Nome do time vindo da aba Configurações */
  teamName?: string;
  /** URL do escudo vindo da aba Configurações */
  teamShieldUrl?: string;
}

export const DashboardNextGameCard: React.FC<DashboardNextGameCardProps> = ({
  nextMatch,
  teamName,
  teamShieldUrl,
}) => {
  if (!nextMatch) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-zinc-900/40 p-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-2">
          <Trophy className="text-zinc-500" size={14} />
          Próximo jogo
        </h3>
        <p className="text-zinc-500 text-xs">Nenhum jogo agendado.</p>
      </div>
    );
  }

  const dateLabel = nextMatch.date
    ? new Date(nextMatch.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    : '—';
  const timeLabel = nextMatch.time ? nextMatch.time.slice(0, 5) : '';

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 bg-emerald-950/15 p-4 shadow-sm">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-zinc-500" />
        Próximo jogo
      </h3>
      <div className="flex items-center gap-2 mb-3">
        {teamShieldUrl ? (
          <img src={teamShieldUrl} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded" aria-hidden />
        ) : null}
        <div className="min-w-0">
          <p className="text-white font-medium text-sm">
            {teamName || nextMatch.team || 'Time'} x {nextMatch.opponent}
          </p>
          <p className="text-zinc-400 text-[11px] mt-0.5 flex items-center gap-1.5">
            <Calendar size={12} /> {dateLabel} {timeLabel && `· ${timeLabel}`}
          </p>
          {nextMatch.competition && (
            <p className="text-zinc-500 text-[11px] mt-0.5">{nextMatch.competition}</p>
          )}
        </div>
      </div>
    </div>
  );
};

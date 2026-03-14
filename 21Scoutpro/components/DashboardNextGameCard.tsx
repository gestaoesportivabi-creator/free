import React from 'react';
import { Trophy, Calendar, MapPin } from 'lucide-react';
import { Player } from '../types';
import { Championship } from '../types';

export type NextMatchInfo = {
  id?: string;
  date: string;
  time?: string;
  team?: string;
  opponent: string;
  competition?: string;
  /** Mandante ou Visitante (tabela de campeonato) */
  location?: string;
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
      <div className="h-full rounded-lg border border-white/[0.08] bg-zinc-900/40 p-4 flex flex-col">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-3 shrink-0">
          <Trophy className="text-zinc-500" size={14} />
          Próximo jogo
        </h3>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <p className="text-zinc-500 text-sm text-center">Nenhum jogo agendado.</p>
        </div>
      </div>
    );
  }

  const dateLabel = nextMatch.date
    ? new Date(nextMatch.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    : '—';
  const timeLabel = nextMatch.time ? nextMatch.time.slice(0, 5) : '';
  const locationLabel = nextMatch.location && nextMatch.location.trim() ? nextMatch.location.trim() : null;

  return (
    <div className="h-full rounded-lg border border-white/[0.08] bg-zinc-900/60 bg-emerald-950/15 p-4 shadow-sm flex flex-col">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-3 shrink-0">
        <Trophy size={14} className="text-zinc-500" />
        Próximo jogo
      </h3>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {nextMatch.competition && nextMatch.competition.trim() && (
          <div className="rounded-lg bg-black/30 border border-white/[0.06] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Competição</p>
            <p className="text-white font-semibold text-sm mt-0.5 truncate" title={nextMatch.competition}>{nextMatch.competition}</p>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-lg bg-black/20 border border-white/[0.06] px-3 py-2.5 flex-1 min-h-0">
          {teamShieldUrl ? (
            <img src={teamShieldUrl} alt="" className="w-10 h-10 object-contain flex-shrink-0 rounded" aria-hidden />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm leading-tight">
              {teamName || nextMatch.team || 'Time'} x {nextMatch.opponent}
            </p>
            <p className="text-zinc-400 text-[11px] mt-1 flex items-center gap-1.5">
              <Calendar size={12} className="shrink-0" /> {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
            </p>
          </div>
        </div>
        {locationLabel && (
          <div className="flex items-center gap-2 rounded-lg bg-black/20 border border-white/[0.06] px-3 py-2">
            <MapPin size={14} className="text-zinc-500 shrink-0" />
            <span className="text-zinc-300 text-xs font-medium">{locationLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

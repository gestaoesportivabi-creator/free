import React, { useMemo } from 'react';
import { UserCheck, UserCog, UserX } from 'lucide-react';
import { Player } from '../types';
import { getChampionshipCards, getPlayerStatus } from '../utils/championshipCards';
import { Championship } from '../types';

type ChampionshipMatch = { competition?: string } | null;

interface DashboardSquadAvailabilityProps {
  players: Player[];
  nextMatch: ChampionshipMatch;
  championships: Championship[];
}

export const DashboardSquadAvailability: React.FC<DashboardSquadAvailabilityProps> = ({
  players,
  nextMatch,
  championships,
}) => {
  const { available, withRestriction, unavailable } = useMemo(() => {
    const available: Player[] = [];
    const withRestriction: Player[] = [];
    const unavailable: Player[] = [];

    let suspendedIds = new Set<string>();
    let penduradoIds = new Set<string>();
    if (nextMatch?.competition && championships?.length) {
      const champ = championships.find((c) => c.name === nextMatch.competition);
      if (champ?.suspensionRules) {
        const rules = champ.suspensionRules;
        const cards = getChampionshipCards(champ.id);
        players.forEach((p) => {
          const status = getPlayerStatus(champ.id, p.id, rules);
          if (status.suspended) suspendedIds.add(p.id);
          else if (status.pendurado) penduradoIds.add(p.id);
        });
      }
    }

    const hasActiveInjury = (p: Player): boolean => {
      if (!p.injuryHistory?.length) return false;
      return p.injuryHistory.some((inj) => !(inj.returnDateActual || inj.endDate));
    };

    players.forEach((p) => {
      if (suspendedIds.has(p.id) || hasActiveInjury(p)) {
        unavailable.push(p);
      } else if (penduradoIds.has(p.id)) {
        withRestriction.push(p);
      } else {
        available.push(p);
      }
    });

    return { available, withRestriction, unavailable };
  }, [players, nextMatch, championships]);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/40 p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold">Elenco disponível</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded border border-white/[0.08] bg-zinc-900/30 px-3 py-2.5 border-l-[3px] border-l-emerald-500/80">
          <div className="flex items-center gap-1.5 mb-1">
            <UserCheck className="text-zinc-500" size={14} />
            <span className="text-zinc-400 font-medium text-xs">Disponíveis</span>
          </div>
          <p className="text-base font-semibold text-white">{available.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate opacity-80">
            {available.slice(0, 3).map((p) => p.nickname || p.name).join(' · ')}
            {available.length > 3 ? ` +${available.length - 3}` : ''}
          </p>
        </div>
        <div className="rounded border border-white/[0.08] bg-zinc-900/30 px-3 py-2.5 border-l-[3px] border-l-amber-500/80">
          <div className="flex items-center gap-1.5 mb-1">
            <UserCog className="text-zinc-500" size={14} />
            <span className="text-zinc-400 font-medium text-xs">Com restrição</span>
          </div>
          <p className="text-base font-semibold text-white">{withRestriction.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate opacity-80">
            {withRestriction.length === 0
              ? 'Nenhum pendurado'
              : withRestriction.slice(0, 3).map((p) => p.nickname || p.name).join(' · ') + (withRestriction.length > 3 ? ` +${withRestriction.length - 3}` : '')}
          </p>
        </div>
        <div className="rounded border border-white/[0.08] bg-zinc-900/30 px-3 py-2.5 border-l-[3px] border-l-red-500/80">
          <div className="flex items-center gap-1.5 mb-1">
            <UserX className="text-zinc-500" size={14} />
            <span className="text-zinc-400 font-medium text-xs">Indisponíveis</span>
          </div>
          <p className="text-base font-semibold text-white">{unavailable.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate opacity-80">
            {unavailable.length === 0
              ? 'Nenhum'
              : unavailable.slice(0, 3).map((p) => p.nickname || p.name).join(' · ') + (unavailable.length > 3 ? ` +${unavailable.length - 3}` : '')}
          </p>
        </div>
      </div>
    </div>
  );
};

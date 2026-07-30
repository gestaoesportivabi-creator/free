import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Goal, Users } from 'lucide-react';
import { ShellEligiblePlayer } from './types';

interface ShellAthleteRailProps {
  athletes: ShellEligiblePlayer[];
  benchPlayers: ShellEligiblePlayer[];
  stickyAthleteId: string | null;
  autoExpandBench?: boolean;
  onSelect: (id: string) => void;
}

export const ShellAthleteRail: React.FC<ShellAthleteRailProps> = ({
  athletes,
  benchPlayers,
  stickyAthleteId,
  autoExpandBench = false,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (autoExpandBench) setExpanded(true);
  }, [autoExpandBench]);

  return (
    <aside
    aria-label="Atletas em quadra"
    className="flex min-h-0 w-[120px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-zinc-700 bg-zinc-950 p-2 max-[1279px]:h-[94px] max-[1279px]:w-full max-[1279px]:flex-row max-[1279px]:overflow-x-auto max-[1279px]:overflow-y-hidden max-[1279px]:border-b max-[1279px]:border-r-0"
  >
    {athletes.slice(0, 5).map((athlete) => {
      const selected = stickyAthleteId === athlete.id;
      return (
        <button
          key={athlete.id}
          type="button"
          disabled={athlete.disabled}
          onClick={() => onSelect(athlete.id)}
          data-testid={`shell-player-${athlete.id}`}
          data-shell-athlete="true"
          aria-pressed={selected}
          aria-label={`#${athlete.jerseyNumber ?? '?'} ${athlete.name}${athlete.isGoalkeeper ? ', goleiro' : ''}${selected ? ', atleta ativo' : ''}`}
          className={`relative min-h-[72px] shrink-0 rounded-xl border px-2 py-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
            selected
              ? 'border-2 border-cyan-400 bg-cyan-400/15 shadow-[0_0_18px_rgba(0,240,255,.24)]'
              : 'border-zinc-700 bg-black hover:border-zinc-500'
          } ${athlete.disabled ? 'cursor-not-allowed opacity-40' : ''} max-[1279px]:w-[112px]`}
        >
          {selected && <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-cyan-400" />}
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-lg font-black text-white">#{athlete.jerseyNumber ?? '?'}</span>
            {athlete.isGoalkeeper && <Goal size={14} className="text-cyan-300" aria-label="Goleiro" />}
          </div>
          <p className="truncate text-[11px] font-black uppercase text-zinc-100">{athlete.name}</p>
          <p className="truncate text-[10px] uppercase text-zinc-400">{athlete.position ?? 'Atleta'}</p>
        </button>
      );
    })}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        data-testid="shell-bench-toggle"
        aria-expanded={expanded}
        className="mt-auto flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-black px-2 text-[10px] font-bold uppercase text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 max-[1279px]:mt-0 max-[1279px]:w-24"
      >
        <Users size={14} /> Banco {benchPlayers.length}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && benchPlayers.map((athlete) => (
        <button
          key={`bench-${athlete.id}`}
          type="button"
          onClick={() => onSelect(athlete.id)}
          data-testid={`shell-bench-player-${athlete.id}`}
          data-shell-athlete="true"
          className="min-h-14 shrink-0 rounded-xl border border-zinc-600 bg-zinc-900 px-2 py-2 text-left hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 max-[1279px]:w-[112px]"
        >
          <span className="font-mono text-sm font-black text-white">#{athlete.jerseyNumber ?? '?'}</span>
          <p className="truncate text-[10px] font-black uppercase text-zinc-200">{athlete.name}</p>
        </button>
      ))}
    </aside>
  );
};

import React from 'react';
import { ShellRecentEvent } from './types';

interface ShellRecentEventsProps {
  recentEvents: ShellRecentEvent[];
}

export const ShellRecentEvents: React.FC<ShellRecentEventsProps> = ({ recentEvents }) => {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Ultimos eventos</p>
          <p className="mt-1 text-xs text-zinc-400">
            A shell nao duplica o log. Ela apenas resume os ultimos registros oficiais.
          </p>
        </div>
        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
          {recentEvents.length}
        </span>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-auto pr-1">
        {recentEvents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-black/30 px-4 py-6 text-center text-sm text-zinc-500">
            Nenhum evento registrado ainda.
          </div>
        )}

        {recentEvents.map((event) => (
          <div
            key={event.id}
            data-testid="shell-recent-event"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{event.actionText}</p>
              <span className="rounded-full border border-zinc-700 bg-black/40 px-2 py-1 text-[11px] font-bold text-zinc-300">
                {event.timeLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{event.playerName}</p>
            {event.zone && <p className="mt-1 text-[11px] font-bold uppercase text-zinc-500">{event.zone}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

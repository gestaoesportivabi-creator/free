import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ShellRecentEvent } from './types';

interface ShellTimelineStripProps {
  recentEvents: ShellRecentEvent[];
  latestEventCreatedAt?: number | null;
  onUndo: (eventId: string) => void;
  onOpenLogs: () => void;
}

const UNDO_WINDOW_MS = 30_000;

export const ShellTimelineStrip: React.FC<ShellTimelineStripProps> = ({
  recentEvents,
  latestEventCreatedAt,
  onUndo,
  onOpenLogs,
}) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const events = useMemo(() => [...recentEvents].reverse().slice(0, 5), [recentEvents]);
  const canUndo = Boolean(
    events[0] && latestEventCreatedAt && now - latestEventCreatedAt <= UNDO_WINDOW_MS
  );

  return (
    <footer className="flex h-14 min-h-14 items-center gap-2 overflow-x-auto border-t border-zinc-700 bg-black px-2" aria-label="Linha do tempo recente">
      {events.length === 0 && <span className="text-xs text-zinc-400">Nenhum evento registrado</span>}
      {events.map((event, index) => (
        <div key={event.id} data-testid="shell-recent-event" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs">
          <span className="font-mono text-zinc-400">{event.timeLabel}</span>
          <span className="max-w-44 truncate font-bold text-zinc-100">{event.playerName} · {event.actionText}</span>
          {index === 0 && (
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => onUndo(event.id)}
              aria-label="Desfazer último evento"
              data-testid="shell-undo"
              className="grid size-11 place-items-center rounded text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:text-zinc-600"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={onOpenLogs} className="ml-auto min-h-11 shrink-0 rounded-lg border border-zinc-600 px-3 text-xs font-black uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
        Log →
      </button>
    </footer>
  );
};

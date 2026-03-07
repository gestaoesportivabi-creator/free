import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { MatchRecord } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { WeeklySchedule } from '../types';

const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type StoredPse = Record<string, Record<string, number>>;

interface DashboardWeeklyTrendProps {
  matches: MatchRecord[];
  schedules: WeeklySchedule[];
  injuriesLast7Days: number;
}

type DayInfo = {
  date: string;
  label: string;
  games: number;
  result?: 'V' | 'D' | 'E';
  treinos: number;
  pseAvg: number | null;
};

function normalizeResult(r: string | undefined): 'V' | 'D' | 'E' | undefined {
  if (r === 'Vitória' || r === 'V') return 'V';
  if (r === 'Derrota' || r === 'D') return 'D';
  if (r === 'Empate' || r === 'E') return 'E';
  return undefined;
}

export const DashboardWeeklyTrend: React.FC<DashboardWeeklyTrendProps> = ({
  matches,
  schedules = [],
  injuriesLast7Days,
}) => {
  const [pseTreinos, setPseTreinos] = useState<StoredPse>({});

  useEffect(() => {
    try {
      const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (t) setPseTreinos(JSON.parse(t));
    } catch (_) {}
  }, []);

  const last7Days = useMemo(() => {
    const days: DayInfo[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      days.push({
        date: dateStr,
        label,
        games: 0,
        treinos: 0,
        pseAvg: null,
      });
    }
    return days;
  }, []);

  const weekData = useMemo(() => {
    const byDate = new Map<string, DayInfo>();
    last7Days.forEach((d) => byDate.set(d.date, { ...d }));

    matches.forEach((m) => {
      const dateStr = m.date ? new Date(m.date).toISOString().split('T')[0] : '';
      if (!dateStr || !byDate.has(dateStr)) return;
      const day = byDate.get(dateStr)!;
      day.games = 1;
      day.result = normalizeResult(m.result);
    });

    const activeSchedules = (Array.isArray(schedules) ? schedules : []).filter(
      (s) => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true') && s.days && Array.isArray(s.days)
    );
    activeSchedules.forEach((s) => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach((day) => {
          const date = (day as { date?: string }).date || '';
          const activity = (day as { activity?: string }).activity || '';
          if (!date || !byDate.has(date)) return;
          if (activity === 'Treino' || activity === 'Musculação') {
            const d = byDate.get(date)!;
            d.treinos += 1;
          }
        });
      } catch (_) {}
    });

    Object.entries(pseTreinos).forEach(([sessionKey, byPlayer]) => {
      const dateStr = sessionKey.split('_')[0];
      if (!dateStr || !byDate.has(dateStr)) return;
      const values = Object.values(byPlayer).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
      if (values.length === 0) return;
      const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
      const d = byDate.get(dateStr)!;
      d.pseAvg = d.pseAvg != null ? Math.round(((d.pseAvg + avg) / 2) * 10) / 10 : avg;
    });

    return Array.from(byDate.values());
  }, [last7Days, matches, schedules, pseTreinos]);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-5">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={14} className="text-zinc-400" />
        Tendência semanal
      </h3>
      <div className="flex items-end justify-between gap-1">
        {weekData.map((day, i) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="flex flex-col items-center gap-1 w-full">
              {day.games > 0 && (
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    day.result === 'V'
                      ? 'bg-emerald-500'
                      : day.result === 'D'
                      ? 'bg-red-500'
                      : day.result === 'E'
                      ? 'bg-amber-500'
                      : 'bg-zinc-500'
                  }`}
                  title={day.result === 'V' ? 'Vitória' : day.result === 'D' ? 'Derrota' : 'Empate'}
                />
              )}
              {day.treinos > 0 && (
                <span className="text-[10px] text-zinc-300 font-medium" title="Treinos">
                  {day.treinos}
                </span>
              )}
              {day.pseAvg != null && (
                <span className="text-[10px] text-zinc-400 font-medium" title="PSE médio">
                  {day.pseAvg}
                </span>
              )}
            </div>
            <span className="text-[9px] text-zinc-500 truncate w-full text-center">{day.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-700 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> V
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> E
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> D
        </span>
        {injuriesLast7Days > 0 && (
          <span className="text-red-400 font-medium">{injuriesLast7Days} lesão{injuriesLast7Days !== 1 ? 'ões' : ''} (7 dias)</span>
        )}
      </div>
    </div>
  );
};

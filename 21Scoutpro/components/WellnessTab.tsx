import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart, ChevronDown, ChevronRight } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { normalizeScheduleDays } from '../utils/scheduleUtils';

export const WELLNESS_STORAGE_KEY = 'scout21_wellness';

/** Chaves persistidas no localStorage (bem-estar diário) */
export const WELLNESS_DIMENSION_KEYS = ['stress', 'sono', 'humor', 'dor', 'satisfacao'] as const;

export const WELLNESS_DIMENSIONS = [
  { key: 'stress' as const, label: 'Nível de stress', emoji: '🧠' },
  { key: 'sono' as const, label: 'Qualidade do sono', emoji: '😴' },
  { key: 'humor' as const, label: 'Humor', emoji: '😊' },
  { key: 'dor' as const, label: 'Dor muscular', emoji: '🩹' },
  { key: 'satisfacao' as const, label: 'Satisfação', emoji: '✨' },
];

const SCALE_OPTIONS = [
  { value: 1, label: 'Muito ruim', color: 'bg-red-500' },
  { value: 2, label: 'Ruim', color: 'bg-orange-500' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-emerald-400' },
  { value: 5, label: 'Muito bom', color: 'bg-emerald-500' },
];

type CommitType = 'treino' | 'jogo' | 'musculacao';

const COMMIT_COLORS: Record<CommitType, string> = {
  treino: 'bg-blue-500',
  jogo: 'bg-emerald-500',
  musculacao: 'bg-violet-500',
};

type WellnessData = Record<string, Record<string, Record<string, number>>>;

interface WellnessTabProps {
  players: Player[];
  schedules?: WeeklySchedule[];
}

function buildCommitmentByDate(schedules: WeeklySchedule[]): Record<string, Set<CommitType>> {
  const map: Record<string, Set<CommitType>> = {};
  const add = (date: string, t: CommitType) => {
    if (!date || date.length < 10) return;
    const d = date.slice(0, 10);
    if (!map[d]) map[d] = new Set();
    map[d].add(t);
  };
  const active = schedules.filter(s => s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true');
  active.forEach(s => {
    normalizeScheduleDays(s).forEach(day => {
      const act = (day.activity || '').trim();
      if (act === 'Treino') add(day.date || '', 'treino');
      else if (act === 'Musculação') add(day.date || '', 'musculacao');
      else if (act === 'Jogo') add(day.date || '', 'jogo');
    });
  });
  return map;
}

function firstAllowedDate(commitmentByDate: Record<string, Set<CommitType>>, preferred: string): string {
  if (commitmentByDate[preferred]?.size) return preferred;
  const sorted = Object.keys(commitmentByDate).sort();
  if (sorted.length === 0) return preferred;
  const ge = sorted.find(d => d >= preferred);
  return ge ?? sorted[sorted.length - 1];
}

function toYMD(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export const WellnessTab: React.FC<WellnessTabProps> = ({ players, schedules = [] }) => {
  const [data, setData] = useState<WellnessData>({});
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const commitmentByDate = useMemo(() => buildCommitmentByDate(schedules), [schedules]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const keys = Object.keys(commitmentByDate);
    if (keys.length === 0) return;
    if (!commitmentByDate[selectedDate]?.size) {
      const next = firstAllowedDate(commitmentByDate, selectedDate);
      if (next !== selectedDate) setSelectedDate(next);
    }
  }, [commitmentByDate, selectedDate]);

  const save = (playerId: string, dimension: string, value: number) => {
    if (!commitmentByDate[selectedDate]?.size) return;
    setData(prev => {
      const next = { ...prev };
      if (!next[selectedDate]) next[selectedDate] = {};
      if (!next[selectedDate][playerId]) next[selectedDate][playerId] = {};
      next[selectedDate][playerId][dimension] = value;
      try {
        localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      window.dispatchEvent(new Event('wellness-updated'));
      return next;
    });
  };

  const activePlayers = useMemo(() => players.filter(p => !p.isTransferred), [players]);

  const selectedDayHasCommitment = Boolean(commitmentByDate[selectedDate]?.size);

  const getPlayerScore = useCallback(
    (playerId: string): number | null => {
      const pd = data[selectedDate]?.[playerId];
      if (!pd) return null;
      const vals = WELLNESS_DIMENSION_KEYS.map(k => pd[k]).filter((v): v is number => typeof v === 'number');
      if (vals.length === 0) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    },
    [data, selectedDate]
  );

  const getPlayerFilled = (playerId: string): number => {
    const pd = data[selectedDate]?.[playerId];
    if (!pd) return 0;
    return WELLNESS_DIMENSION_KEYS.filter(k => typeof pd[k] === 'number' && pd[k] >= 1).length;
  };

  const playerRadarRows = useCallback(
    (playerId: string) =>
      WELLNESS_DIMENSIONS.map(dim => {
        const v = data[selectedDate]?.[playerId]?.[dim.key];
        return {
          subject: dim.label.length > 14 ? dim.label.slice(0, 12) + '…' : dim.label,
          value: typeof v === 'number' ? v : 0,
          fullMark: 5,
        };
      }),
    [data, selectedDate]
  );

  const teamAvgScore = useMemo(() => {
    const scores: number[] = [];
    activePlayers.forEach(p => {
      const s = getPlayerScore(p.id);
      if (s !== null) scores.push(s);
    });
    return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  }, [activePlayers, getPlayerScore]);

  const scoreColor = (s: number | null) => {
    if (s === null) return 'text-zinc-500';
    if (s >= 4) return 'text-emerald-400';
    if (s >= 3) return 'text-amber-400';
    return 'text-red-400';
  };

  const monthLabel = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: { day: number; dateStr: string; inMonth: boolean }[] = [];
    const prevMonthDays = new Date(y, m, 0).getDate();
    for (let i = 0; i < startPad; i++) {
      const d = prevMonthDays - startPad + i + 1;
      const dt = new Date(y, m - 1, d);
      cells.push({
        day: d,
        dateStr: toYMD(dt),
        inMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m, d);
      cells.push({
        day: d,
        dateStr: toYMD(dt),
        inMonth: true,
      });
    }
    let nextM = 1;
    while (cells.length % 7 !== 0) {
      const dt = new Date(y, m + 1, nextM);
      cells.push({ day: nextM, dateStr: toYMD(dt), inMonth: false });
      nextM++;
    }
    return cells;
  }, [calendarMonth]);

  const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
                <Heart className="text-[#00f0ff]" /> Bem-Estar Diário
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-wider">
                5 indicadores · escala 1–5 · só em dias com Treino, Jogo ou Musculação na programação ativa
              </p>
            </div>
            {teamAvgScore !== null && selectedDayHasCommitment && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase mr-2">Média equipe (dia):</span>
                <span className={`font-black text-lg ${scoreColor(teamAvgScore)}`}>{teamAvgScore}</span>
                <span className="text-zinc-500 text-[10px]">/5</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                className="text-zinc-400 hover:text-white text-sm font-bold px-2"
                onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <span className="text-white font-black uppercase text-sm tracking-wide">{monthLabel}</span>
              <button
                type="button"
                className="text-zinc-400 hover:text-white text-sm font-bold px-2"
                onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500 font-bold uppercase mb-1">
              {weekdayLabels.map(w => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                const types = commitmentByDate[cell.dateStr];
                const hasCommit = types && types.size > 0;
                const isSelected = cell.dateStr === selectedDate;
                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    disabled={!hasCommit}
                    onClick={() => hasCommit && setSelectedDate(cell.dateStr)}
                    className={`relative min-h-[3rem] rounded-lg border text-sm font-bold transition-colors flex flex-col items-center justify-center gap-0.5 p-1
                      ${!cell.inMonth ? 'opacity-30 border-transparent text-zinc-600' : 'text-white'}
                      ${hasCommit ? 'border-zinc-700 hover:border-[#00f0ff]/50 hover:bg-zinc-900 cursor-pointer' : 'border-zinc-900 text-zinc-600 cursor-not-allowed'}
                      ${isSelected && hasCommit ? 'ring-2 ring-[#00f0ff] border-[#00f0ff]/60 bg-zinc-900' : ''}
                    `}
                  >
                    <span>{cell.day}</span>
                    {hasCommit && (
                      <span className="flex gap-0.5 justify-center flex-wrap">
                        {(['treino', 'jogo', 'musculacao'] as CommitType[]).map(t =>
                          types.has(t) ? (
                            <span key={t} className={`w-2 h-2 rounded-full ${COMMIT_COLORS[t]}`} title={t} />
                          ) : null
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-zinc-500 font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Treino
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Jogo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Musculação
              </span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs">
            Dia selecionado:{' '}
            <strong className="text-white">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            {!selectedDayHasCommitment && (
              <span className="text-amber-500 ml-2">— sem compromisso na programação; escolha um dia com bolinha.</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-black rounded-3xl border border-zinc-800 p-6 shadow-lg">
        <div className="space-y-2">
          {activePlayers.map(player => {
            const isExpanded = expandedPlayerId === player.id;
            const score = getPlayerScore(player.id);
            const filled = getPlayerFilled(player.id);
            const radarData = playerRadarRows(player.id);
            return (
              <div key={player.id} className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setExpandedPlayerId(prev => (prev === player.id ? null : player.id))}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                  <span className="text-white font-bold text-sm flex-1">{player.nickname || player.name}</span>
                  <span className="text-zinc-600 text-[10px] mr-2">
                    {filled}/{WELLNESS_DIMENSIONS.length}
                  </span>
                  {score !== null ? (
                    <span className={`font-black text-lg ${scoreColor(score)}`}>{score}</span>
                  ) : (
                    <span className="text-zinc-600 text-sm">—</span>
                  )}
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-zinc-800">
                    {!selectedDayHasCommitment ? (
                      <p className="text-amber-500 text-sm py-4 text-center font-bold">
                        Selecione um dia com Treino, Jogo ou Musculação no calendário para registrar o bem-estar.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {WELLNESS_DIMENSIONS.map(dim => {
                            const current = data[selectedDate]?.[player.id]?.[dim.key];
                            return (
                              <div key={dim.key} className="bg-black/50 rounded-xl p-3 border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">
                                  {dim.emoji} {dim.label}
                                </p>
                                <div className="flex gap-1">
                                  {SCALE_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => save(player.id, dim.key, opt.value)}
                                      className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                                        current === opt.value
                                          ? `${opt.color} text-white scale-105`
                                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                      }`}
                                      title={opt.label}
                                    >
                                      {opt.value}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="min-h-[260px] flex flex-col rounded-2xl border border-zinc-800 bg-black/40 p-3">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 text-center">Radar — {player.nickname || player.name}</p>
                          <div className="flex-1 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                                <PolarGrid stroke="#27272a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 9 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#000',
                                    borderColor: '#27272a',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                  }}
                                />
                                <Radar dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.22} strokeWidth={2} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { Player } from '../types';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const WELLNESS_STORAGE_KEY = 'scout21_wellness';

const DIMENSIONS = [
  { key: 'fadiga', label: 'Fadiga Muscular', emoji: '💪' },
  { key: 'sono', label: 'Qualidade do Sono', emoji: '😴' },
  { key: 'estresse', label: 'Nível de Estresse', emoji: '🧠' },
  { key: 'dor', label: 'Dor Muscular', emoji: '🩹' },
  { key: 'humor', label: 'Humor / Motivação', emoji: '😊' },
] as const;

const SCALE_OPTIONS = [
  { value: 1, label: 'Muito ruim', color: 'bg-red-500' },
  { value: 2, label: 'Ruim', color: 'bg-orange-500' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-emerald-400' },
  { value: 5, label: 'Muito bom', color: 'bg-emerald-500' },
];

type WellnessData = Record<string, Record<string, Record<string, number>>>;

interface WellnessTabProps {
  players: Player[];
}

export const WellnessTab: React.FC<WellnessTabProps> = ({ players }) => {
  const [data, setData] = useState<WellnessData>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'entry' | 'radar'>('entry');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const save = (playerId: string, dimension: string, value: number) => {
    setData(prev => {
      const next = { ...prev };
      if (!next[selectedDate]) next[selectedDate] = {};
      if (!next[selectedDate][playerId]) next[selectedDate][playerId] = {};
      next[selectedDate][playerId][dimension] = value;
      try { localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      window.dispatchEvent(new Event('wellness-updated'));
      return next;
    });
  };

  const activePlayers = useMemo(() => players.filter(p => !p.isTransferred), [players]);

  const getPlayerScore = (playerId: string): number | null => {
    const pd = data[selectedDate]?.[playerId];
    if (!pd) return null;
    const vals = Object.values(pd).filter(v => typeof v === 'number');
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const getPlayerFilled = (playerId: string): number => {
    const pd = data[selectedDate]?.[playerId];
    if (!pd) return 0;
    return Object.values(pd).filter(v => typeof v === 'number' && v >= 1).length;
  };

  const teamRadarData = useMemo(() => {
    return DIMENSIONS.map(dim => {
      const vals: number[] = [];
      activePlayers.forEach(p => {
        const v = data[selectedDate]?.[p.id]?.[dim.key];
        if (typeof v === 'number') vals.push(v);
      });
      const avg = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
      return { subject: dim.label, value: avg, fullMark: 5 };
    });
  }, [data, selectedDate, activePlayers]);

  const teamAvgScore = useMemo(() => {
    const scores: number[] = [];
    activePlayers.forEach(p => {
      const s = getPlayerScore(p.id);
      if (s !== null) scores.push(s);
    });
    return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  }, [data, selectedDate, activePlayers]);

  const scoreColor = (s: number | null) => {
    if (s === null) return 'text-zinc-500';
    if (s >= 4) return 'text-emerald-400';
    if (s >= 3) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
              <Heart className="text-[#00f0ff]" /> Bem-Estar Diário
            </h2>
            <p className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-wider">
              Wellness Score · 5 dimensões · Escala 1-5
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none" />
            <div className="flex gap-1">
              <button onClick={() => setViewMode('entry')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase ${viewMode === 'entry' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400'}`}>Coleta</button>
              <button onClick={() => setViewMode('radar')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase ${viewMode === 'radar' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400'}`}>Radar</button>
            </div>
            {teamAvgScore !== null && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase mr-2">Equipe:</span>
                <span className={`font-black text-lg ${scoreColor(teamAvgScore)}`}>{teamAvgScore}</span>
                <span className="text-zinc-500 text-[10px]">/5</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'radar' && (
        <div className="bg-black rounded-3xl border border-zinc-900 p-8 shadow-xl">
          <h3 className="text-white font-bold uppercase mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#00f0ff]" /> Radar Wellness da Equipe — {new Date(selectedDate).toLocaleDateString('pt-BR')}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={teamRadarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} />
                <Radar dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'entry' && (
        <div className="bg-black rounded-3xl border border-zinc-800 p-6 shadow-lg">
          <div className="space-y-2">
            {activePlayers.map(player => {
              const isExpanded = expandedPlayerId === player.id;
              const score = getPlayerScore(player.id);
              const filled = getPlayerFilled(player.id);
              return (
                <div key={player.id} className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                  <button
                    type="button"
                    onClick={() => setExpandedPlayerId(prev => prev === player.id ? null : player.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                    <span className="text-white font-bold text-sm flex-1">{player.nickname || player.name}</span>
                    <span className="text-zinc-600 text-[10px] mr-2">{filled}/{DIMENSIONS.length}</span>
                    {score !== null ? (
                      <span className={`font-black text-lg ${scoreColor(score)}`}>{score}</span>
                    ) : (
                      <span className="text-zinc-600 text-sm">—</span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {DIMENSIONS.map(dim => {
                          const current = data[selectedDate]?.[player.id]?.[dim.key];
                          return (
                            <div key={dim.key} className="bg-black/50 rounded-xl p-3 border border-zinc-800">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{dim.emoji} {dim.label}</p>
                              <div className="flex gap-1">
                                {SCALE_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => save(player.id, dim.key, opt.value)}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${current === opt.value ? `${opt.color} text-white scale-105` : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

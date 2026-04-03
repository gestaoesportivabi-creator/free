import React, { useMemo, useState, useEffect } from 'react';
import { Moon, ChevronDown, ChevronRight, Calendar, Trophy, Search } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { wellnessApi } from '../services/api';

export const QUALIDADE_SONO_STORAGE_KEY = 'scout21_qualidade_sono';

type StoredQualidadeSono = Record<string, Record<string, number>>; // eventKey -> playerId -> 1-5

export type ChampionshipMatchForSono = { id: string; date: string; opponent: string; competition?: string };

interface QualidadeSonoTabProps {
  schedules: WeeklySchedule[];
  championshipMatches: ChampionshipMatchForSono[];
  players: Player[];
}

function isMorningTime(timeStr: string): boolean {
  if (!timeStr || !timeStr.trim()) return false;
  const [h] = timeStr.split(':').map(Number);
  return (h ?? 0) < 12;
}

const EMOJIS = ['😫', '😴', '😐', '🙂', '😊'] as const; // 1 a 5 - rostos (estilo WhatsApp): muito ruim → muito bom
const LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom'] as const;

export interface SleepEvent {
  eventKey: string;
  date: string;
  type: 'treino' | 'jogo';
  label: string;
  sublabel?: string;
}

export const QualidadeSonoTab: React.FC<QualidadeSonoTabProps> = ({
  schedules = [],
  championshipMatches = [],
  players = [],
}) => {
  const [stored, setStored] = useState<StoredQualidadeSono>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeChampionshipMatches = Array.isArray(championshipMatches) ? championshipMatches : [];
  const safePlayers = Array.isArray(players) ? players : [];

  useEffect(() => {
    let mounted = true;
    const loadFromApi = async () => {
      try {
        const raw = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
        if (raw && mounted) setStored(JSON.parse(raw));

        const apiData = await wellnessApi.getAll('qualidade-sono');
        if (!mounted || !Array.isArray(apiData)) return;

        const newData: StoredQualidadeSono = {};
        apiData.forEach((item: any) => {
          // A data no backend é salva como timestamp, vamos padronizar pra o formato da string eventKey
          const date = new Date(item.data).toISOString().split('T')[0];
          // O frontend junta a string treino_YYYY-MM-DD
          const eventKey = `treino_${date}`; 
          
          if (!newData[eventKey]) newData[eventKey] = {};
          newData[eventKey][item.jogadorId] = item.valor;
        });

        if (raw) {
          const lData = JSON.parse(raw);
          for (const key of Object.keys(lData)) {
            if (newData[key]) lData[key] = { ...lData[key], ...newData[key] };
          }
          setStored(lData);
          localStorage.setItem(QUALIDADE_SONO_STORAGE_KEY, JSON.stringify(lData));
        } else {
          setStored(newData);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de Qualidade Sono:', err);
      }
    };
    loadFromApi();
    return () => { mounted = false; };
  }, []);

  const save = async (eventKey: string, playerId: string, value: number | '') => {
    setStored(prev => {
      const eventData = { ...(prev[eventKey] || {}) };
      if (value === '') delete eventData[playerId];
      else eventData[playerId] = value as number;
      const next = { ...prev, [eventKey]: eventData };
      try {
        localStorage.setItem(QUALIDADE_SONO_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    window.dispatchEvent(new Event('wellness-updated'));

    if (value !== '') {
      try {
        // Formato da key: treino_YYYY-MM-DD ou jogo_YYYY-MM-DD
        const datePart = eventKey.split('_')[1];
        await wellnessApi.saveBulk('qualidade-sono', [{
           equipeId: schedules[0]?.equipeId || 'default-equipe',
           data: datePart,
           jogadorId: playerId,
           value
        }]);
      } catch (err) {
        console.error('Falha ao salvar a qualidade do sono', err);
      }
    }
  };

  const events = useMemo((): SleepEvent[] => {
    const list: SleepEvent[] = [];
    const seen = new Set<string>();

    const active = safeSchedules.filter(
      s => s && (s.isActive === true || (s.isActive as unknown) === 'TRUE' || (s.isActive as unknown) === 'true')
    );
    active.forEach(s => {
      try {
        const flat = normalizeScheduleDays(s);
        if (!Array.isArray(flat)) return;
        flat.forEach(day => {
          const act = (day?.activity || '').trim();
          if (act !== 'Treino' && act !== 'Musculação') return;
          const date = day?.date || '';
          const time = day?.time || '00:00';
          if (!date || !isMorningTime(time)) return;
          const eventKey = `treino_${date}`;
          if (seen.has(eventKey)) return;
          seen.add(eventKey);
          list.push({
            eventKey,
            date,
            type: 'treino',
            label: `Noite anterior a ${new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
            sublabel: `Treino (manhã)`,
          });
        });
      } catch (_) {
        // ignorar schedule inválido
      }
    });

    safeChampionshipMatches.forEach(m => {
      if (!m || !m.date) return;
      const eventKey = `jogo_${m.date}`;
      if (seen.has(eventKey)) return;
      seen.add(eventKey);
      list.push({
        eventKey,
        date: m.date,
        type: 'jogo',
        label: `Noite anterior a ${new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        sublabel: `Jogo vs ${m.opponent || '—'}`,
      });
    });

    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [safeSchedules, safeChampionshipMatches]);

  const teamAverage = (eventKey: string): number | null => {
    const data = stored[eventKey];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 1 && v <= 5);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const activePlayers = useMemo(() => {
    const list = safePlayers.filter(p => p && !p.isTransferred);
    if (!playerSearch.trim()) return list;
    const q = playerSearch.toLowerCase();
    return list.filter(p => (p.nickname || p.name).toLowerCase().includes(q));
  }, [safePlayers, playerSearch]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (dateFrom && ev.date < dateFrom) return false;
      if (dateTo && ev.date > dateTo) return false;
      return true;
    });
  }, [events, dateFrom, dateTo]);

  if (events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
          <div className="flex items-center justify-center flex-col py-16">
            <Moon size={64} className="text-indigo-400 mb-6 opacity-50" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-4">
              Qualidade de sono
            </h2>
            <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
              Cadastre <strong>treinos pela manhã</strong> na Programação e/ou <strong>jogos</strong> na
              Tabela de Campeonato para avaliar a noite de sono anterior de cada atleta (1 a 5).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide mb-2">
          <Moon className="text-[#00f0ff]" /> Qualidade de sono
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-4">
          Escala 1–5 emojis — quanto maior, melhor a noite.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-500" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs" />
            <span className="text-zinc-600 text-xs">até</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs" />
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" value={playerSearch} onChange={e => setPlayerSearch(e.target.value)} placeholder="Buscar atleta..." className="bg-zinc-800 border border-zinc-700 rounded pl-6 pr-2 py-1 text-white text-xs w-32" />
          </div>
        </div>

        <div className="space-y-2">
          {filteredEvents.map(ev => {
            const isExpanded = expandedKey === ev.eventKey;
            const avg = teamAverage(ev.eventKey);
            const totalPlayers = safePlayers.filter(p => p && !p.isTransferred).length;
            const filledCount = (() => {
              const d = stored[ev.eventKey];
              if (!d) return 0;
              return Object.values(d).filter(v => typeof v === 'number' && v >= 1 && v <= 5).length;
            })();
            return (
              <div
                key={ev.eventKey}
                className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50"
              >
                <button
                  type="button"
                  onClick={() => setExpandedKey(prev => (prev === ev.eventKey ? null : ev.eventKey))}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight size={20} className="text-zinc-500 flex-shrink-0" />
                  )}
                  {ev.type === 'treino' ? (
                    <Calendar size={18} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Trophy size={18} className="text-amber-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{ev.label}</p>
                    {ev.sublabel && (
                      <p className="text-zinc-500 text-xs truncate">{ev.sublabel}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 font-bold flex-shrink-0">{filledCount}/{totalPlayers}</span>
                  <div className="flex-shrink-0">
                    {avg != null ? (
                      <span
                        className={`font-black text-lg ${
                          ev.type === 'treino' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {avg}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-sm">—</span>
                    )}
                    <span className="text-zinc-500 text-[10px] ml-1 uppercase">média</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">
                      Qualidade do sono (1 = muito ruim, 5 = muito bom)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {activePlayers.map(player => {
                        const value = stored[ev.eventKey]?.[player.id];
                        return (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 bg-black/50 rounded-xl px-3 py-2 border border-zinc-800"
                          >
                            <span
                              className="text-xs text-white truncate flex-1"
                              title={player.nickname || player.name}
                            >
                              {player.nickname || player.name}
                            </span>
                            <select
                              value={value ?? ''}
                              onChange={e => {
                                const raw = e.target.value;
                                if (raw === '') save(ev.eventKey, player.id, '');
                                else {
                                  const v = parseInt(raw, 10);
                                  if (v >= 1 && v <= 5) save(ev.eventKey, player.id, v);
                                }
                              }}
                              className="flex-shrink-0 w-full max-w-[8rem] bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1.5 text-white text-sm font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="">Selecionar</option>
                              {(EMOJIS as unknown as string[]).map((emoji, idx) => {
                                const score = idx + 1;
                                return (
                                  <option key={score} value={score}>
                                    {emoji} {LABELS[idx]}
                                  </option>
                                );
                              })}
                            </select>
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
    </div>
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';

const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type Period = 'matutino' | 'vespertino' | 'noturno';

function getPeriodFromTime(timeStr: string): Period {
  if (!timeStr || !timeStr.trim()) return 'vespertino';
  const [h, m] = timeStr.split(':').map(Number);
  const hours = (h || 0) + (m || 0) / 60;
  if (hours < 12) return 'matutino';
  if (hours < 18) return 'vespertino';
  return 'noturno';
}

function periodLabel(p: Period): string {
  return p === 'matutino' ? 'Matutino' : p === 'vespertino' ? 'Vespertino' : 'Noturno';
}

export interface TrainingSessionRow {
  sessionKey: string;
  date: string;
  time: string;
  activity: string;
  period: Period;
}

interface PseTreinosTabProps {
  schedules: WeeklySchedule[];
  players: Player[];
}

type StoredPseTreinos = Record<string, Record<string, number>>; // sessionKey -> playerId -> PSE

export const PseTreinosTab: React.FC<PseTreinosTabProps> = ({ schedules, players }) => {
  const [stored, setStored] = useState<StoredPseTreinos>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const save = (sessionKey: string, playerId: string, value: number | '') => {
    setStored(prev => {
      const sessionData = { ...(prev[sessionKey] || {}) };
      if (value === '') delete sessionData[playerId];
      else sessionData[playerId] = value;
      const next = { ...prev, [sessionKey]: sessionData };
      try { localStorage.setItem(PSE_TREINOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const sessions = useMemo((): TrainingSessionRow[] => {
    const active = schedules.filter(s => s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true');
    const list: TrainingSessionRow[] = [];
    const seen = new Set<string>();
    active.forEach(s => {
      const flat = normalizeScheduleDays(s);
      flat.forEach(day => {
        const act = (day.activity || '').trim();
        if (act !== 'Treino' && act !== 'Musculação') return;
        const date = day.date || '';
        const time = day.time || '00:00';
        const sessionKey = `${date}_${time}_${act}`;
        if (!date || seen.has(sessionKey)) return;
        seen.add(sessionKey);
        list.push({
          sessionKey,
          date,
          time,
          activity: act,
          period: getPeriodFromTime(time),
        });
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return list;
  }, [schedules]);

  const teamAverage = (sessionKey: string): number | null => {
    const data = stored[sessionKey];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const activePlayers = useMemo(() => players.filter(p => !p.isTransferred), [players]);

  if (sessions.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
          <div className="flex items-center justify-center flex-col py-16">
            <Calendar size={64} className="text-[#10b981] mb-6 opacity-50" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Média PSE (Treinos)</h2>
            <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
              Ative uma <strong>Programação</strong> (aba Programação) com atividades <strong>Treino</strong> ou <strong>Musculação</strong> para preencher a PSE por sessão.
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
          <Activity className="text-[#10b981]" /> Média PSE (Treinos)
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-6">
          Sessões da programação ativa (Treino ou Musculação). Período pelo horário de início. Preencha a PSE (0-10) por atleta. A média da equipe aparece no Monitoramento Fisiológico.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-500 uppercase text-xs tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-3">Data</th>
                <th className="p-3">Horário</th>
                <th className="p-3">Período</th>
                <th className="p-3">Atividade</th>
                <th className="p-3 text-center">Média equipe</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300 divide-y divide-zinc-800">
              {sessions.map((session) => {
                const isExpanded = expandedKey === session.sessionKey;
                const avg = teamAverage(session.sessionKey);
                return (
                  <React.Fragment key={session.sessionKey}>
                    <tr
                      className="hover:bg-zinc-900/50 cursor-pointer"
                      onClick={() => setExpandedKey(prev => prev === session.sessionKey ? null : session.sessionKey)}
                    >
                      <td className="p-3">
                        {isExpanded ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                      </td>
                      <td className="p-3 font-medium text-white">
                        {new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-3">{session.time || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          session.period === 'matutino' ? 'bg-amber-500/20 text-amber-400' :
                          session.period === 'vespertino' ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {periodLabel(session.period)}
                        </span>
                      </td>
                      <td className="p-3">{session.activity}</td>
                      <td className="p-3 text-center">
                        {avg != null ? <span className="text-[#10b981] font-black">{avg}</span> : <span className="text-zinc-600">—</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0 bg-zinc-900/70">
                          <div className="p-4 border-t border-zinc-800">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">PSE por atleta (0-10)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {activePlayers.map((player) => (
                                <div key={player.id} className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2 border border-zinc-800">
                                  <span className="text-xs text-white truncate flex-1" title={player.nickname || player.name}>
                                    {player.nickname || player.name}
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    value={stored[session.sessionKey]?.[player.id] ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                                      if (v === '' || (!Number.isNaN(v) && v >= 0 && v <= 10)) {
                                        save(session.sessionKey, player.id, v === '' ? '' : v);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs text-center"
                                    placeholder="PSE"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

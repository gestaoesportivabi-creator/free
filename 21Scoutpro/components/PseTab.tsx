import React, { useMemo, useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, Calendar, Trophy } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
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

type PseEvent =
  | { type: 'treino'; eventKey: string; date: string; time: string; activity: string; period: Period }
  | { type: 'jogo'; eventKey: string; date: string; time?: string; opponent: string; competition?: string };

type ChampionshipMatchForPse = { id: string; date: string; time?: string; opponent: string; competition?: string };

interface PseTabProps {
  schedules: WeeklySchedule[];
  championshipMatches: ChampionshipMatchForPse[];
  players: Player[];
}

type StoredPseJogos = Record<string, Record<string, number>>;
type StoredPseTreinos = Record<string, Record<string, number>>;

export const PseTab: React.FC<PseTabProps> = ({
  schedules = [],
  championshipMatches = [],
  players = [],
}) => {
  const [pseJogos, setPseJogos] = useState<StoredPseJogos>({});
  const [pseTreinos, setPseTreinos] = useState<StoredPseTreinos>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
      if (j) setPseJogos(JSON.parse(j));
      const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (t) setPseTreinos(JSON.parse(t));
    } catch (_) {}
  }, []);

  const saveJogo = (matchId: string, playerId: string, value: number | '') => {
    setPseJogos(prev => {
      const next = { ...prev, [matchId]: { ...(prev[matchId] || {}) } };
      if (value === '') delete next[matchId][playerId];
      else next[matchId][playerId] = value;
      try { localStorage.setItem(PSE_JOGOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const saveTreino = (sessionKey: string, playerId: string, value: number | '') => {
    setPseTreinos(prev => {
      const next = { ...prev, [sessionKey]: { ...(prev[sessionKey] || {}) } };
      if (value === '') delete next[sessionKey][playerId];
      else next[sessionKey][playerId] = value;
      try { localStorage.setItem(PSE_TREINOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const events = useMemo((): PseEvent[] => {
    const list: PseEvent[] = [];
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      s => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
    );
    const seenTreino = new Set<string>();
    active.forEach(s => {
      try {
        const flat = normalizeScheduleDays(s);
        if (!Array.isArray(flat)) return;
        flat.forEach(day => {
          const act = (day?.activity || '').trim();
          if (act !== 'Treino' && act !== 'Musculação') return;
          const date = day?.date || '';
          const time = day?.time || '00:00';
          const sessionKey = `${date}_${time}_${act}`;
          if (!date || seenTreino.has(sessionKey)) return;
          seenTreino.add(sessionKey);
          list.push({
            type: 'treino',
            eventKey: sessionKey,
            date,
            time,
            activity: act,
            period: getPeriodFromTime(time),
          });
        });
      } catch (_) {}
    });
    (Array.isArray(championshipMatches) ? championshipMatches : []).forEach(m => {
      if (!m?.id || !m?.date) return;
      list.push({
        type: 'jogo',
        eventKey: m.id,
        date: m.date,
        time: m.time,
        opponent: m.opponent || '—',
        competition: m.competition,
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    return list;
  }, [schedules, championshipMatches]);

  const teamAverage = (ev: PseEvent): number | null => {
    const data = ev.type === 'jogo' ? pseJogos[ev.eventKey] : pseTreinos[ev.eventKey];
    if (!data) return null;
    const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const getStoredValue = (ev: PseEvent, playerId: string): number | '' => {
    const data = ev.type === 'jogo' ? pseJogos[ev.eventKey] : pseTreinos[ev.eventKey];
    const v = data?.[playerId];
    return v != null && v >= 0 && v <= 10 ? v : '';
  };

  const saveValue = (ev: PseEvent, playerId: string, value: number | '') => {
    if (ev.type === 'jogo') saveJogo(ev.eventKey, playerId, value);
    else saveTreino(ev.eventKey, playerId, value);
  };

  const activePlayers = useMemo(() => (Array.isArray(players) ? players : []).filter(p => p && !p.isTransferred), [players]);

  if (events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
          <div className="flex items-center justify-center flex-col py-16">
            <Activity size={64} className="text-[#10b981] mb-6 opacity-50" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-4">PSE (Treinos e Jogos)</h2>
            <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
              Cadastre <strong>treinos</strong> na Programação (Treino ou Musculação) e/ou <strong>jogos</strong> na
              Tabela de Campeonato para preencher a PSE (0-10) de cada atleta.
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
          <Activity className="text-[#10b981]" /> PSE (Treinos e Jogos)
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-6">
          Preencha a PSE (0-10) por atleta em cada treino ou jogo. Treinos vêm da programação ativa; jogos da tabela de campeonato. A média da equipe aparece no Monitoramento Fisiológico.
        </p>

        <div className="space-y-2">
          {events.map(ev => {
            const isExpanded = expandedKey === ev.eventKey;
            const avg = teamAverage(ev);
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
                    <p className="text-white font-bold text-sm">
                      {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {ev.type === 'treino' ? ` · ${ev.activity}` : ` · vs ${ev.opponent}`}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {ev.type === 'treino'
                        ? `${ev.time || '—'} · ${periodLabel(ev.period)}`
                        : (ev.competition || '—')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${ev.type === 'treino' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {ev.type === 'treino' ? 'Treino' : 'Jogo'}
                  </span>
                  <div className="flex-shrink-0">
                    {avg != null ? (
                      <span className={`font-black text-lg ${ev.type === 'treino' ? 'text-emerald-400' : 'text-amber-400'}`}>
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
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">PSE por atleta (0-10)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {activePlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 bg-black/50 rounded-xl px-3 py-2 border border-zinc-800"
                        >
                          <span className="text-xs text-white truncate flex-1" title={player.nickname || player.name}>
                            {player.nickname || player.name}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={getStoredValue(ev, player.id)}
                            onChange={e => {
                              const raw = e.target.value;
                              if (raw === '') saveValue(ev, player.id, '');
                              else {
                                const v = parseFloat(raw);
                                if (!Number.isNaN(v) && v >= 0 && v <= 10) saveValue(ev, player.id, v);
                              }
                            }}
                            onClick={e => e.stopPropagation()}
                            className="w-14 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs text-center"
                            placeholder="PSE"
                          />
                        </div>
                      ))}
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

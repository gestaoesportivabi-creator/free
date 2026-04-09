import React, { useMemo, useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, Calendar, Trophy, Search, ChevronsUpDown } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { wellnessApi } from '../services/api';

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

function mergeNestedRecord(
  base: Record<string, Record<string, number>>,
  incoming: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = { ...base };
  Object.entries(incoming).forEach(([eventKey, playerMap]) => {
    out[eventKey] = { ...(out[eventKey] || {}), ...playerMap };
  });
  return out;
}

export const PseTab: React.FC<PseTabProps> = ({
  schedules = [],
  championshipMatches = [],
  players = [],
}) => {
  const [pseJogos, setPseJogos] = useState<StoredPseJogos>({});
  const [pseTreinos, setPseTreinos] = useState<StoredPseTreinos>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const rawJ = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
        const localJogos: StoredPseJogos = rawJ ? JSON.parse(rawJ) : {};
        if (mounted && Object.keys(localJogos).length > 0) setPseJogos(localJogos);
        const rawT = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
        const localTreinos: StoredPseTreinos = rawT ? JSON.parse(rawT) : {};
        if (mounted && Object.keys(localTreinos).length > 0) setPseTreinos(localTreinos);

        const [apiJogos, apiTreinos] = await Promise.all([
          wellnessApi.getAll('pse-jogo'),
          wellnessApi.getAll('pse-treino'),
        ]);
        if (!mounted) return;

        if (Array.isArray(apiJogos) && apiJogos.length > 0) {
          const jogosData: StoredPseJogos = {};
          apiJogos.forEach((item: any) => {
            if (!jogosData[item.jogoId]) jogosData[item.jogoId] = {};
            jogosData[item.jogoId][item.jogadorId] = item.valor;
          });
          const mergedJogos = mergeNestedRecord(jogosData, localJogos);
          setPseJogos(mergedJogos);
          try { localStorage.setItem(PSE_JOGOS_STORAGE_KEY, JSON.stringify(mergedJogos)); } catch (_) {}
        }

        if (Array.isArray(apiTreinos) && apiTreinos.length > 0) {
          const treinosApi: StoredPseTreinos = {};
          apiTreinos.forEach((item: any) => {
            const yyyyMmDd = new Date(item.data).toISOString().split('T')[0];
            if (!treinosApi[yyyyMmDd]) treinosApi[yyyyMmDd] = {};
            treinosApi[yyyyMmDd][item.jogadorId] = item.valor;
          });
          if (Object.keys(localTreinos).length > 0) {
            const local = { ...localTreinos };
            for (const key of Object.keys(local)) {
              const dt = key.split('_')[0];
              if (treinosApi[dt]) local[key] = { ...local[key], ...treinosApi[dt] };
            }
            setPseTreinos(local);
            try { localStorage.setItem(PSE_TREINOS_STORAGE_KEY, JSON.stringify(local)); } catch (_) {}
          } else {
            setPseTreinos(treinosApi);
            try { localStorage.setItem(PSE_TREINOS_STORAGE_KEY, JSON.stringify(treinosApi)); } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Erro ao carregar PSE:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const saveJogo = async (matchId: string, playerId: string, value: number | '') => {
    setPseJogos(prev => {
      const next = { ...prev, [matchId]: { ...(prev[matchId] || {}) } };
      if (value === '') delete next[matchId][playerId];
      else next[matchId][playerId] = value;
      try { localStorage.setItem(PSE_JOGOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    window.dispatchEvent(new Event('wellness-updated'));
    if (value !== '') {
      try {
        await wellnessApi.saveBulk('pse-jogo', [{ jogoId: matchId, jogadorId: playerId, value }]);
      } catch (err) { console.error('Erro ao salvar PSE Jogo:', err); }
    }
  };

  const saveTreino = async (sessionKey: string, playerId: string, value: number | '') => {
    setPseTreinos(prev => {
      const next = { ...prev, [sessionKey]: { ...(prev[sessionKey] || {}) } };
      if (value === '') delete next[sessionKey][playerId];
      else next[sessionKey][playerId] = value;
      try { localStorage.setItem(PSE_TREINOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    window.dispatchEvent(new Event('wellness-updated'));
    if (value !== '') {
      try {
        const datePart = sessionKey.split('_')[0];
        await wellnessApi.saveBulk('pse-treino', [{
          equipeId: schedules[0]?.equipeId || 'default-equipe',
          data: datePart,
          jogadorId: playerId,
          value,
        }]);
      } catch (err) { console.error('Erro ao salvar PSE Treino:', err); }
    }
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

  const resolveEventData = (ev: PseEvent): Record<string, number> | undefined => {
    if (ev.type === 'jogo') return pseJogos[ev.eventKey];
    const direct = pseTreinos[ev.eventKey];
    if (direct) return direct;
    const datePart = ev.eventKey.split('_')[0];
    if (!datePart) return undefined;
    const dateOnly = pseTreinos[datePart];
    if (dateOnly) return dateOnly;
    const fallbackKey = Object.keys(pseTreinos).find(k => k.startsWith(`${datePart}_`));
    return fallbackKey ? pseTreinos[fallbackKey] : undefined;
  };

  const teamAverage = (ev: PseEvent): number | null => {
    const data = resolveEventData(ev);
    if (!data) return null;
    const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const getStoredValue = (ev: PseEvent, playerId: string): number | '' => {
    const data = resolveEventData(ev);
    const v = data?.[playerId];
    return v != null && v >= 0 && v <= 10 ? v : '';
  };

  const saveValue = (ev: PseEvent, playerId: string, value: number | '') => {
    if (ev.type === 'jogo') saveJogo(ev.eventKey, playerId, value);
    else saveTreino(ev.eventKey, playerId, value);
  };

  const activePlayers = useMemo(() => {
    const list = (Array.isArray(players) ? players : []).filter(p => p && !p.isTransferred);
    if (!playerSearch.trim()) return list;
    const q = playerSearch.toLowerCase();
    return list.filter(p => (p.nickname || p.name).toLowerCase().includes(q));
  }, [players, playerSearch]);

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
          <Activity className="text-[#00f0ff]" /> PSE (Treinos e Jogos)
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-4">
          Preencha a PSE (0-10) por atleta em cada treino ou jogo. A média da equipe aparece no Monitoramento Fisiológico.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-500" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs" placeholder="De" />
            <span className="text-zinc-600 text-xs">até</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs" placeholder="Até" />
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" value={playerSearch} onChange={e => setPlayerSearch(e.target.value)} placeholder="Buscar atleta..." className="bg-zinc-800 border border-zinc-700 rounded pl-6 pr-2 py-1 text-white text-xs w-32" />
          </div>
          <button onClick={() => setExpandedKey(expandedKey ? null : filteredEvents[0]?.eventKey || null)} className="ml-auto flex items-center gap-1 bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-zinc-700">
            <ChevronsUpDown size={12} /> Expandir
          </button>
        </div>

        <div className="space-y-2">
          {filteredEvents.map(ev => {
            const isExpanded = expandedKey === ev.eventKey;
            const avg = teamAverage(ev);
            const totalPlayers = (Array.isArray(players) ? players : []).filter(p => p && !p.isTransferred).length;
            const filledCount = (() => {
              const d = ev.type === 'jogo' ? pseJogos[ev.eventKey] : pseTreinos[ev.eventKey];
              if (!d) return 0;
              return Object.values(d).filter(v => typeof v === 'number' && v >= 0 && v <= 10).length;
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
                  <span className="text-[10px] text-zinc-600 font-bold flex-shrink-0">{filledCount}/{totalPlayers}</span>
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
                      {activePlayers.map(player => {
                        const val = getStoredValue(ev, player.id);
                        const valNum = typeof val === 'number' ? val : -1;
                        const inputBg = valNum >= 0 && valNum <= 3 ? 'bg-emerald-900/50 border-emerald-700' : valNum > 3 && valNum <= 6 ? 'bg-amber-900/40 border-amber-700' : valNum > 6 ? 'bg-red-900/40 border-red-700' : 'bg-zinc-800 border-zinc-600';
                        return (
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
                            value={val}
                            onChange={e => {
                              const raw = e.target.value;
                              if (raw === '') saveValue(ev, player.id, '');
                              else {
                                const v = parseFloat(raw);
                                if (!Number.isNaN(v) && v >= 0 && v <= 10) saveValue(ev, player.id, v);
                              }
                            }}
                            onClick={e => e.stopPropagation()}
                            className={`w-14 ${inputBg} rounded px-2 py-1 text-white text-xs text-center`}
                            placeholder="PSE"
                          />
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

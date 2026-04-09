import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, Calendar, Trophy, Search, ChevronsUpDown } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { wellnessApi } from '../services/api';

const PSR_JOGOS_STORAGE_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_STORAGE_KEY = 'scout21_psr_treinos';

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

type PsrEvent =
  | { type: 'treino'; eventKey: string; date: string; time: string; activity: string; period: Period }
  | { type: 'jogo'; eventKey: string; date: string; time?: string; opponent: string; competition?: string };

type ChampionshipMatchForPsr = { id: string; date: string; time?: string; opponent: string; competition?: string };

interface PsrTabProps {
  schedules: WeeklySchedule[];
  championshipMatches: ChampionshipMatchForPsr[];
  players: Player[];
}

type StoredPsrJogos = Record<string, Record<string, number>>;
type StoredPsrTreinos = Record<string, Record<string, number>>;

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

export const PsrTab: React.FC<PsrTabProps> = ({
  schedules = [],
  championshipMatches = [],
  players = [],
}) => {
  const [psrJogos, setPsrJogos] = useState<StoredPsrJogos>({});
  const [psrTreinos, setPsrTreinos] = useState<StoredPsrTreinos>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadFromApi = async () => {
      try {
        const lpj = localStorage.getItem(PSR_JOGOS_STORAGE_KEY);
        const localJogos: StoredPsrJogos = lpj ? JSON.parse(lpj) : {};
        if (mounted && Object.keys(localJogos).length > 0) setPsrJogos(localJogos);
        const lpt = localStorage.getItem(PSR_TREINOS_STORAGE_KEY);
        const localTreinos: StoredPsrTreinos = lpt ? JSON.parse(lpt) : {};
        if (mounted && Object.keys(localTreinos).length > 0) setPsrTreinos(localTreinos);

        const [apiJogos, apiTreinos] = await Promise.all([
          wellnessApi.getAll('psr-jogo'),
          wellnessApi.getAll('psr-treino')
        ]);

        if (!mounted) return;

        // Jogos
        if (Array.isArray(apiJogos) && apiJogos.length > 0) {
          const newJogos: StoredPsrJogos = {};
          apiJogos.forEach((item: any) => {
            if (!newJogos[item.jogoId]) newJogos[item.jogoId] = {};
            newJogos[item.jogoId][item.jogadorId] = item.valor;
          });
          const mergedJogos = mergeNestedRecord(newJogos, localJogos);
          setPsrJogos(mergedJogos);
          localStorage.setItem(PSR_JOGOS_STORAGE_KEY, JSON.stringify(mergedJogos));
        }

        // Treinos
        if (Array.isArray(apiTreinos) && apiTreinos.length > 0) {
          const newTreinos: StoredPsrTreinos = {};
          apiTreinos.forEach((item: any) => {
             const key = new Date(item.data).toISOString().split('T')[0];
             if (!newTreinos[key]) newTreinos[key] = {};
             newTreinos[key][item.jogadorId] = item.valor;
          });
          
          if (Object.keys(localTreinos).length > 0) {
            const merged = { ...localTreinos };
            for (const key of Object.keys(merged)) {
              const dt = key.split('_')[0];
              if (newTreinos[dt]) merged[key] = { ...merged[key], ...newTreinos[dt] };
            }
            setPsrTreinos(merged);
            localStorage.setItem(PSR_TREINOS_STORAGE_KEY, JSON.stringify(merged));
          } else {
             setPsrTreinos(newTreinos);
             localStorage.setItem(PSR_TREINOS_STORAGE_KEY, JSON.stringify(newTreinos));
          }
        }

      } catch (err) {
        console.error('Erro ao buscar dados de PSR:', err);
      }
    };
    loadFromApi();
    return () => { mounted = false; };
  }, []);

  const saveJogo = async (matchId: string, playerId: string, value: number | '') => {
    setPsrJogos(prev => {
      const next = { ...prev, [matchId]: { ...(prev[matchId] || {}) } };
      if (value === '') delete next[matchId][playerId];
      else next[matchId][playerId] = value as number;
      try { localStorage.setItem(PSR_JOGOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    window.dispatchEvent(new Event('wellness-updated'));

    if (value !== '') {
      try {
        await wellnessApi.saveBulk('psr-jogo', [{
          jogoId: matchId,
          jogadorId: playerId,
          value
        }]);
      } catch (e) {
        console.error('Falha ao salvar PSR jogo', e);
      }
    }
  };

  const saveTreino = async (sessionKey: string, playerId: string, value: number | '') => {
    setPsrTreinos(prev => {
      const next = { ...prev, [sessionKey]: { ...(prev[sessionKey] || {}) } };
      if (value === '') delete next[sessionKey][playerId];
      else next[sessionKey][playerId] = value as number;
      try { localStorage.setItem(PSR_TREINOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    window.dispatchEvent(new Event('wellness-updated'));

    if (value !== '') {
      try {
        const datePart = sessionKey.split('_')[0];
        await wellnessApi.saveBulk('psr-treino', [{
          equipeId: schedules[0]?.equipeId || 'default-equipe',
          data: datePart,
          jogadorId: playerId,
          value
        }]);
      } catch (e) {
         console.error('Falha ao salvar PSR treino', e);
      }
    }
  };

  const events = useMemo((): PsrEvent[] => {
    const list: PsrEvent[] = [];
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      s => s && (s.isActive === true || (s.isActive as unknown) === 'TRUE' || (s.isActive as unknown) === 'true')
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

  const resolveEventData = (ev: PsrEvent): Record<string, number> | undefined => {
    if (ev.type === 'jogo') return psrJogos[ev.eventKey];
    const direct = psrTreinos[ev.eventKey];
    if (direct) return direct;
    const datePart = ev.eventKey.split('_')[0];
    if (!datePart) return undefined;
    const dateOnly = psrTreinos[datePart];
    if (dateOnly) return dateOnly;
    const fallbackKey = Object.keys(psrTreinos).find(k => k.startsWith(`${datePart}_`));
    return fallbackKey ? psrTreinos[fallbackKey] : undefined;
  };

  const teamAverage = (ev: PsrEvent): number | null => {
    const data = resolveEventData(ev);
    if (!data) return null;
    const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const getStoredValue = (ev: PsrEvent, playerId: string): number | '' => {
    const data = resolveEventData(ev);
    const v = data?.[playerId];
    return v != null && v >= 0 && v <= 10 ? v : '';
  };

  const saveValue = (ev: PsrEvent, playerId: string, value: number | '') => {
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
            <RefreshCw size={64} className="text-sky-500 mb-6 opacity-50" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-4">PSR (Treinos e Jogos)</h2>
            <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
              Cadastre <strong>treinos</strong> na Programação (Treino ou Musculação) e/ou <strong>jogos</strong> na
              Tabela de Campeonato para preencher a PSR (0-10) de cada atleta. Quanto mais perto de 10, melhor a recuperação.
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
          <RefreshCw className="text-[#00f0ff]" /> PSR (Treinos e Jogos)
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-4">
          PSR (0-10) por atleta. Quanto mais perto de 10, melhor a recuperação.
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
            const avg = teamAverage(ev);
            const totalPlayers = (Array.isArray(players) ? players : []).filter(p => p && !p.isTransferred).length;
            const filledCount = (() => {
              const d = ev.type === 'jogo' ? psrJogos[ev.eventKey] : psrTreinos[ev.eventKey];
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
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">PSR por atleta (0-10, mais perto de 10 = melhor recuperado)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {activePlayers.map(player => {
                        const val = getStoredValue(ev, player.id);
                        const valNum = typeof val === 'number' ? val : -1;
                        const inputBg = valNum >= 7 ? 'bg-emerald-900/50 border-emerald-700' : valNum >= 4 ? 'bg-amber-900/40 border-amber-700' : valNum >= 0 ? 'bg-red-900/40 border-red-700' : 'bg-zinc-800 border-zinc-600';
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
                            placeholder="PSR"
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

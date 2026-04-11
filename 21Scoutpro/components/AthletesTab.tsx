import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Filter, ChevronDown, ChevronUp, Dumbbell, Ruler, Shield, AlertTriangle, HeartPulse, X } from 'lucide-react';
import { Player, PhysicalAssessment, Position } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WELLNESS_DIMENSION_KEYS } from './WellnessTab';

const PSE_TREINOS_KEY = 'scout21_pse_treinos';
const PSE_JOGOS_KEY = 'scout21_pse_jogos';
const PSR_TREINOS_KEY = 'scout21_psr_treinos';
const PSR_JOGOS_KEY = 'scout21_psr_jogos';
const QUALIDADE_SONO_KEY = 'scout21_qualidade_sono';
const WELLNESS_KEY = 'scout21_wellness';

/** Alinha com Bem-Estar Diário: stress/dor quanto menor melhor → entram na média como (6−valor). */
function comparableWellnessDayAvg(wToday: Record<string, number> | undefined): number | null {
  if (!wToday) return null;
  const parts: number[] = [];
  for (const k of WELLNESS_DIMENSION_KEYS) {
    const v = wToday[k];
    if (typeof v !== 'number') continue;
    parts.push(k === 'stress' || k === 'dor' ? 6 - v : v);
  }
  if (parts.length === 0) return null;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
}

interface AthletesTabProps {
  players: Player[];
  assessments: PhysicalAssessment[];
}

const POSITION_COLORS: Record<Position, string> = {
  Goleiro: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Fixo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Ala: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Pivô': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const FOOT_LABEL: Record<string, string> = {
  Destro: 'D',
  Canhoto: 'C',
  Ambidestro: 'A',
};

export const AthletesTab: React.FC<AthletesTabProps> = ({ players, assessments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('Todas');
  const [showTransferred, setShowTransferred] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [pseTreinos, setPseTreinos] = useState<Record<string, Record<string, number>>>({});
  const [pseJogos, setPseJogos] = useState<Record<string, Record<string, number>>>({});
  const [psrTreinos, setPsrTreinos] = useState<Record<string, Record<string, number>>>({});
  const [psrJogos, setPsrJogos] = useState<Record<string, Record<string, number>>>({});
  const [sonoStored, setSonoStored] = useState<Record<string, Record<string, number>>>({});
  const [wellnessStored, setWellnessStored] = useState<Record<string, Record<string, Record<string, number>>>>({});

  useEffect(() => {
    const load = () => {
      try {
        const pt = localStorage.getItem(PSE_TREINOS_KEY); if (pt) setPseTreinos(JSON.parse(pt));
        const pj = localStorage.getItem(PSE_JOGOS_KEY); if (pj) setPseJogos(JSON.parse(pj));
        const rt = localStorage.getItem(PSR_TREINOS_KEY); if (rt) setPsrTreinos(JSON.parse(rt));
        const rj = localStorage.getItem(PSR_JOGOS_KEY); if (rj) setPsrJogos(JSON.parse(rj));
        const s = localStorage.getItem(QUALIDADE_SONO_KEY); if (s) setSonoStored(JSON.parse(s));
        const w = localStorage.getItem(WELLNESS_KEY); if (w) setWellnessStored(JSON.parse(w));
      } catch (_) {}
    };
    load();
    window.addEventListener('wellness-updated', load);
    window.addEventListener('storage', load);
    return () => { window.removeEventListener('wellness-updated', load); window.removeEventListener('storage', load); };
  }, []);

  const getLastValues = (playerId: string) => {
    const pseVals: { date: string; value: number }[] = [];
    Object.entries(pseTreinos).forEach(([key, data]) => {
      const v = data[playerId];
      if (typeof v === 'number') pseVals.push({ date: key.split('_')[0], value: v });
    });
    Object.entries(pseJogos).forEach(([, data]) => {
      const v = data[playerId];
      if (typeof v === 'number') pseVals.push({ date: '', value: v });
    });
    pseVals.sort((a, b) => b.date.localeCompare(a.date));

    const psrVals: { date: string; value: number }[] = [];
    Object.entries(psrTreinos).forEach(([key, data]) => {
      const v = data[playerId];
      if (typeof v === 'number') psrVals.push({ date: key.split('_')[0], value: v });
    });
    Object.entries(psrJogos).forEach(([, data]) => {
      const v = data[playerId];
      if (typeof v === 'number') psrVals.push({ date: '', value: v });
    });
    psrVals.sort((a, b) => b.date.localeCompare(a.date));

    const sonoVals: number[] = [];
    Object.values(sonoStored).forEach(data => {
      const v = data[playerId];
      if (typeof v === 'number') sonoVals.push(v);
    });

    let wellnessScore: number | null = null;
    const todayStr = new Date().toISOString().split('T')[0];
    const wToday = wellnessStored[todayStr]?.[playerId];
    wellnessScore = comparableWellnessDayAvg(wToday);

    return {
      lastPse: pseVals.length > 0 ? pseVals[0].value : null,
      lastPsr: psrVals.length > 0 ? psrVals[0].value : null,
      lastSono: sonoVals.length > 0 ? sonoVals[sonoVals.length - 1] : null,
      wellnessScore,
      pseHistory: pseVals.slice(0, 14).reverse(),
    };
  };

  const getLatestAssessment = (playerId: string) => {
    const playerAssessments = assessments
      .filter(a => a.playerId === playerId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return playerAssessments[0] || null;
  };

  const getActiveInjuries = (player: Player) => {
    if (!player.injuryHistory?.length) return [];
    return player.injuryHistory.filter(i => !i.endDate || new Date(i.endDate) >= new Date());
  };

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        if (!showTransferred && p.isTransferred) return false;
        if (positionFilter !== 'Todas' && p.position !== positionFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = (p.name?.toLowerCase().includes(q)) ||
            (p.nickname?.toLowerCase().includes(q)) ||
            (String(p.jerseyNumber) === q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isTransferred && !b.isTransferred) return 1;
        if (!a.isTransferred && b.isTransferred) return -1;
        return a.jerseyNumber - b.jerseyNumber;
      });
  }, [players, searchQuery, positionFilter, showTransferred]);

  const activeCount = players.filter(p => !p.isTransferred).length;
  const injuredCount = players.filter(p => !p.isTransferred && getActiveInjuries(p).length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md rounded-3xl border border-zinc-900 shadow-lg p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
              <Users className="text-[#00f0ff]" /> Atletas — Visão Fisiológica
            </h2>
            <p className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-wider">
              {activeCount} ativos · {injuredCount} lesionados · {players.length} total
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar atleta..."
                className="bg-black/50 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white text-sm outline-none w-44 focus:border-[#00f0ff]/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center bg-black/50 border border-zinc-800 rounded-xl px-3">
              <Filter size={14} className="text-[#00f0ff] mr-2" />
              <select
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                className="bg-transparent text-white text-sm py-2 outline-none cursor-pointer font-medium"
              >
                <option value="Todas">Todas Posições</option>
                <option value="Goleiro">Goleiro</option>
                <option value="Fixo">Fixo</option>
                <option value="Ala">Ala</option>
                <option value="Pivô">Pivô</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTransferred}
                onChange={e => setShowTransferred(e.target.checked)}
                className="accent-[#00f0ff] w-3.5 h-3.5"
              />
              Transferidos
            </label>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold">Nenhum atleta encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPlayers.map(player => {
            const activeInjuries = getActiveInjuries(player);
            const latestAssessment = getLatestAssessment(player.id);
            const bf = (latestAssessment as any)?.bodyFatPercent ?? latestAssessment?.bodyFat ?? null;
            const imc = player.weight && player.height ? (player.weight / Math.pow(player.height / 100, 2)).toFixed(1) : null;
            const maxLoadsCount = player.maxLoads?.length ?? 0;
            const lv = getLastValues(player.id);
            const isExpanded = expandedId === player.id;
            const isTransferred = player.isTransferred;

            return (
              <div
                key={player.id}
                className={`bg-black rounded-2xl border transition-all ${isTransferred ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800 hover:border-zinc-600'} ${isExpanded ? 'border-[#00f0ff]/30' : ''}`}
              >
                {/* Card header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(prev => prev === player.id ? null : player.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Photo / Initial */}
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-2xl">{(player.nickname || player.name).charAt(0)}</span>
                      </div>
                    )}

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-black text-base uppercase tracking-wide truncate">{player.nickname || player.name}</h3>
                        <span className="text-zinc-600 text-xs font-bold">#{player.jerseyNumber}</span>
                        {isTransferred && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-bold uppercase">Transferido</span>
                        )}
                      </div>
                      {player.nickname && player.nickname !== player.name && (
                        <p className="text-zinc-500 text-xs truncate">{player.name}</p>
                      )}

                      {/* Badges row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${POSITION_COLORS[player.position]}`}>
                          {player.position}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Pé {player.dominantFoot}
                        </span>
                        {player.age > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {player.age} anos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: health status + chevron */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {activeInjuries.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] text-red-400 font-bold uppercase">Lesionado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Disponível</span>
                        </div>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                    <MiniStat label="Altura" value={player.height ? `${player.height}cm` : '—'} />
                    <MiniStat label="Peso" value={player.weight ? `${player.weight}kg` : '—'} />
                    <MiniStat label="IMC" value={imc || '—'} />
                    <MiniStat label="% Gord." value={bf != null ? `${bf}%` : '—'} accent={bf != null} />
                    <MiniStat label="PSE" value={lv.lastPse != null ? String(lv.lastPse) : '—'} accent={lv.lastPse != null} />
                    <MiniStat label="Wellness" value={lv.wellnessScore != null ? String(lv.wellnessScore) : '—'} accent={lv.wellnessScore != null} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-5">
                    {/* Dados pessoais */}
                    <div>
                      <p className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest mb-3">Dados Pessoais</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailField label="Nome completo" value={player.name} />
                        <DetailField label="Apelido" value={player.nickname || '—'} />
                        <DetailField label="Camisa" value={`#${player.jerseyNumber}`} />
                        <DetailField label="Posição" value={player.position} />
                        <DetailField label="Pé dominante" value={player.dominantFoot} />
                        <DetailField label="Idade" value={player.age > 0 ? `${player.age} anos` : '—'} />
                        <DetailField label="Data nasc." value={player.birthDate ? new Date(player.birthDate).toLocaleDateString('pt-BR') : '—'} />
                        <DetailField label="Último clube" value={player.lastClub || '—'} />
                        <DetailField label="Altura" value={player.height ? `${player.height} cm` : '—'} />
                        <DetailField label="Peso" value={player.weight ? `${player.weight} kg` : '—'} />
                        <DetailField label="IMC" value={imc ? String(imc) : '—'} />
                        {isTransferred && <DetailField label="Transferido em" value={player.transferDate ? new Date(player.transferDate).toLocaleDateString('pt-BR') : 'Sim'} />}
                      </div>
                    </div>

                    {/* Indicadores fisiológicos */}
                    <div>
                      <p className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest mb-3">Indicadores Fisiológicos</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <IndicatorCard label="Último PSE" value={lv.lastPse} max={10} colorFn={v => v <= 3 ? 'text-emerald-400' : v <= 6 ? 'text-amber-400' : 'text-red-400'} />
                        <IndicatorCard label="Último PSR" value={lv.lastPsr} max={10} colorFn={v => v >= 7 ? 'text-emerald-400' : v >= 4 ? 'text-amber-400' : 'text-red-400'} />
                        <IndicatorCard label="Último Sono" value={lv.lastSono} max={5} colorFn={v => v >= 4 ? 'text-emerald-400' : v >= 3 ? 'text-amber-400' : 'text-red-400'} />
                        <IndicatorCard label="Wellness" value={lv.wellnessScore} max={5} colorFn={v => v >= 4 ? 'text-emerald-400' : v >= 3 ? 'text-amber-400' : 'text-red-400'} />
                        <IndicatorCard label="% Gordura" value={bf} colorFn={v => v <= 12 ? 'text-emerald-400' : v <= 18 ? 'text-amber-400' : 'text-red-400'} suffix="%" />
                      </div>
                    </div>

                    {/* PSE mini-chart */}
                    {lv.pseHistory.length > 2 && (
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Evolução PSE (últimas sessões)</p>
                        <div className="h-32 bg-zinc-900/30 rounded-xl p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lv.pseHistory.map(h => ({ date: h.date ? new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?', pse: h.value }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                              <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 9 }} />
                              <YAxis domain={[0, 10]} hide />
                              <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                              <Line type="monotone" dataKey="pse" stroke="#ccff00" strokeWidth={2} dot={{ fill: '#ccff00', r: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Avaliação física */}
                    {latestAssessment && (
                      <div>
                        <p className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest mb-3">Última Avaliação Física</p>
                        <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-[10px] font-bold">{new Date(latestAssessment.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-[#00f0ff] font-black text-lg">{bf != null ? `${bf}%` : '—'} <span className="text-[10px] text-zinc-500 font-bold">Gordura</span></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lesões */}
                    {player.injuryHistory && player.injuryHistory.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest mb-3">Histórico de Lesões ({player.injuryHistory.length})</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {player.injuryHistory.sort((a, b) => new Date(b.date || b.startDate).getTime() - new Date(a.date || a.startDate).getTime()).map(inj => {
                            const isActive = !inj.endDate || new Date(inj.endDate) >= new Date();
                            return (
                              <div key={inj.id} className="flex items-center gap-3 bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-bold truncate">{inj.type} — {inj.location} ({inj.side})</p>
                                  <p className="text-zinc-500 text-[10px]">{new Date(inj.date || inj.startDate).toLocaleDateString('pt-BR')} · {inj.origin} · {inj.severity}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase flex-shrink-0 ${isActive ? 'text-red-400' : 'text-zinc-600'}`}>
                                  {isActive ? 'Ativa' : `${inj.daysOut ?? '?'}d`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cargas máximas */}
                    {maxLoadsCount > 0 && (
                      <div>
                        <p className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest mb-3">Cargas Máximas ({maxLoadsCount})</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {player.maxLoads!.map(ml => (
                            <div key={ml.id} className="bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800">
                              <p className="text-white text-xs font-bold truncate">{ml.exerciseName}</p>
                              <p className="text-[#00f0ff] font-black text-sm">{ml.value} <span className="text-zinc-500 text-[10px]">{ml.loadType === 'Kg' ? 'kg' : 'reps'}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="bg-zinc-900/50 rounded-lg px-2 py-1.5 text-center">
    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">{label}</p>
    <p className={`text-xs font-black mt-0.5 ${accent ? 'text-[#00f0ff]' : 'text-white'}`}>{value}</p>
  </div>
);

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-zinc-900/30 rounded-lg px-3 py-2 border border-zinc-800/50">
    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
    <p className="text-white text-xs font-bold mt-0.5 truncate">{value}</p>
  </div>
);

const IndicatorCard: React.FC<{
  label: string;
  value: number | null;
  max?: number;
  colorFn: (v: number) => string;
  suffix?: string;
}> = ({ label, value, max, colorFn, suffix }) => (
  <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{label}</p>
    {value != null ? (
      <p className={`text-xl font-black ${colorFn(value)}`}>
        {value}{suffix || ''}{max ? <span className="text-zinc-600 text-[10px]">/{max}</span> : null}
      </p>
    ) : (
      <p className="text-xl font-black text-zinc-700">—</p>
    )}
  </div>
);

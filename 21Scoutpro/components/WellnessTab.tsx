import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Brain, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { wellnessApi } from '../services/api';
import { resolveEquipeIdFromSchedules } from '../utils/resolveEquipeId';

export const WELLNESS_STORAGE_KEY = 'scout21_wellness';

/** Chaves persistidas no localStorage (bem-estar diário) */
export const WELLNESS_DIMENSION_KEYS = ['stress', 'sono', 'humor', 'dor', 'satisfacao'] as const;

export type WellnessDimensionKey = (typeof WELLNESS_DIMENSION_KEYS)[number];

/** Metas de bem-estar (escala 1–5) para comparação no radar de monitoramento fisiológico. */
export const WELLNESS_IDEAL_VALUES: Record<WellnessDimensionKey, number> = {
  stress: 2,
  sono: 5,
  humor: 5,
  dor: 2.5,
  satisfacao: 5,
};

export const WELLNESS_DIMENSIONS = [
  { key: 'stress' as const, label: 'Nível de stress', emoji: '🧠' },
  { key: 'sono' as const, label: 'Qualidade do sono', emoji: '😴' },
  { key: 'humor' as const, label: 'Humor/Motivação', emoji: '😊' },
  { key: 'dor' as const, label: 'Dor muscular', emoji: '🩹' },
  { key: 'satisfacao' as const, label: 'Satisfação', emoji: '✨' },
];

/** Escala visual: quanto maior o valor (1→5), melhor o indicador (ex.: sono, humor). */
const SCALE_HIGHER_IS_BETTER = [
  { value: 1, label: 'Muito ruim', color: 'bg-red-500' },
  { value: 2, label: 'Ruim', color: 'bg-orange-500' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-emerald-400' },
  { value: 5, label: 'Muito bom', color: 'bg-emerald-500' },
];

/**
 * Stress e dor muscular: quanto menor o valor na escala, melhor → 1 = verde, 5 = vermelho.
 * (Mesmos rótulos da escala; só a cor do botão reflete “melhor nota”.)
 */
const SCALE_LOWER_IS_BETTER = [
  { value: 1, label: 'Muito ruim', color: 'bg-emerald-500' },
  { value: 2, label: 'Ruim', color: 'bg-emerald-400' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-orange-500' },
  { value: 5, label: 'Muito bom', color: 'bg-red-500' },
];

const LOWER_IS_BETTER_DIMS = new Set<WellnessDimensionKey>(['stress', 'dor']);

function scaleOptionsForDimension(dimKey: WellnessDimensionKey) {
  return LOWER_IS_BETTER_DIMS.has(dimKey) ? SCALE_LOWER_IS_BETTER : SCALE_HIGHER_IS_BETTER;
}

/** Converte cada dimensão para “quanto maior melhor” (1–5) para média e cor de resumo. */
function toComparableWellnessScore(dimKey: WellnessDimensionKey, raw: number): number {
  if (LOWER_IS_BETTER_DIMS.has(dimKey)) return 6 - raw;
  return raw;
}

type CommitType = 'treino' | 'jogo' | 'musculacao';

const COMMIT_LABELS: Record<CommitType, string> = {
  treino: 'Treino',
  jogo: 'Jogo',
  musculacao: 'Musculação',
};

type WellnessData = Record<string, Record<string, Record<string, number>>>;

function mergeWellnessData(base: WellnessData, incoming: WellnessData): WellnessData {
  const out: WellnessData = { ...base };
  Object.entries(incoming).forEach(([date, byPlayer]) => {
    out[date] = { ...(out[date] || {}) };
    Object.entries(byPlayer).forEach(([playerId, dims]) => {
      out[date][playerId] = { ...(out[date][playerId] || {}), ...dims };
    });
  });
  return out;
}

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

export const WellnessTab: React.FC<WellnessTabProps> = ({ players, schedules = [] }) => {
  const [data, setData] = useState<WellnessData>({});
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [savedAtByDate, setSavedAtByDate] = useState<Record<string, string>>({});

  const commitmentByDate = useMemo(() => buildCommitmentByDate(schedules), [schedules]);

  const commitmentDateBounds = useMemo(() => {
    const sorted = Object.keys(commitmentByDate).sort();
    if (sorted.length === 0) return { min: undefined as string | undefined, max: undefined as string | undefined };
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [commitmentByDate]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (_) {}

    let mounted = true;
    const loadApi = async () => {
      try {
        const rows = await wellnessApi.getAll('bem-estar-diario');
        if (!mounted || !Array.isArray(rows) || rows.length === 0) return;
        const apiData: WellnessData = {};
        rows.forEach((row: any) => {
          const date = String(row.data || '').slice(0, 10);
          const playerId = String(row.jogador_id || row.jogadorId || '');
          if (!date || !playerId) return;
          if (!apiData[date]) apiData[date] = {};
          apiData[date][playerId] = {
            stress: typeof row.nivel_stress === 'number' ? row.nivel_stress : 0,
            sono: typeof row.qual_sono === 'number' ? row.qual_sono : 0,
            humor: typeof row.humor_mot === 'number' ? row.humor_mot : 0,
            dor: typeof row.dor_muscular === 'number' ? row.dor_muscular : 0,
            satisfacao: typeof row.satisfacao === 'number' ? row.satisfacao : 0,
          };
        });
        setData(prev => {
          const merged = mergeWellnessData(apiData, prev);
          try {
            localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      } catch (err) {
        console.error('Erro ao carregar bem-estar diário da API:', err);
      }
    };
    loadApi();
    return () => {
      mounted = false;
    };
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
      const parts = WELLNESS_DIMENSION_KEYS.map(k => {
        const v = pd[k];
        if (typeof v !== 'number') return null;
        return toComparableWellnessScore(k, v);
      }).filter((v): v is number => v != null);
      if (parts.length === 0) return null;
      return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
    },
    [data, selectedDate]
  );

  const getPlayerFilled = (playerId: string): number => {
    const pd = data[selectedDate]?.[playerId];
    if (!pd) return 0;
    return WELLNESS_DIMENSION_KEYS.filter(k => typeof pd[k] === 'number' && pd[k] >= 1).length;
  };

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

  const selectedCommitTypes = commitmentByDate[selectedDate];
  const selectedCommitList = selectedCommitTypes
    ? (['treino', 'jogo', 'musculacao'] as CommitType[]).filter(t => selectedCommitTypes.has(t))
    : [];

  const saveSelectedDateToApi = async () => {
    if (!selectedDayHasCommitment) {
      alert('Escolha uma data com compromisso para salvar.');
      return;
    }
    const equipeId = resolveEquipeIdFromSchedules(schedules);
    if (!equipeId) {
      alert('Não foi possível identificar a equipe da programação para sincronizar os dados.');
      return;
    }
    const items = activePlayers
      .map(player => {
        const d = data[selectedDate]?.[player.id];
        if (!d) return null;
        const hasAny = WELLNESS_DIMENSION_KEYS.some(k => typeof d[k] === 'number' && d[k] >= 1 && d[k] <= 5);
        if (!hasAny) return null;
        return {
          equipeId,
          data: selectedDate,
          jogadorId: player.id,
          stress: typeof d.stress === 'number' ? d.stress : null,
          sono: typeof d.sono === 'number' ? d.sono : null,
          humor: typeof d.humor === 'number' ? d.humor : null,
          dor: typeof d.dor === 'number' ? d.dor : null,
          satisfacao: typeof d.satisfacao === 'number' ? d.satisfacao : null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
    if (items.length === 0) {
      alert('Não há registros preenchidos para salvar nesta data.');
      return;
    }
    try {
      setSavingDate(selectedDate);
      await wellnessApi.saveBulk('bem-estar-diario', items);
      setSavedAtByDate(prev => ({
        ...prev,
        [selectedDate]: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
      alert('Bem-estar diário salvo com sucesso e sincronizado para outros dispositivos.');
    } catch (err) {
      console.error('Erro ao salvar bem-estar diário:', err);
      alert('Falha ao salvar no servidor. Os dados continuam no navegador e podem ser salvos novamente.');
    } finally {
      setSavingDate(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
                <Brain className="text-[#00f0ff]" /> Bem-Estar Diário
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-wider">
                5 indicadores · escala 1–5 · só em dias com Treino, Jogo ou Musculação na programação ativa
              </p>
              <p className="text-zinc-600 text-[11px] mt-2 max-w-xl">
                Stress e dor muscular: quanto menor o valor, melhor (1 = melhor). Demais indicadores: quanto maior, melhor (5 = melhor). Após preencher, use o botão "Salvar dia" para sincronizar no servidor e manter os dados entre dispositivos.
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

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
            <label htmlFor="wellness-date" className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
              Data (calendário do sistema)
            </label>
            <input
              id="wellness-date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={commitmentDateBounds.min}
              max={commitmentDateBounds.max}
              className="w-full max-w-xs rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white font-bold text-sm [color-scheme:dark] focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
            />
            {selectedCommitList.length > 0 && (
              <p className="text-[11px] text-zinc-400">
                Compromissos neste dia:{' '}
                <span className="text-zinc-200 font-semibold">
                  {selectedCommitList.map(t => COMMIT_LABELS[t]).join(' · ')}
                </span>
              </p>
            )}
            <p className="text-[10px] text-zinc-600 uppercase font-bold">
              Só é possível registrar bem-estar em dias com Treino, Jogo ou Musculação na programação ativa. Se escolher outro dia, a data ajusta para o dia válido mais próximo.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={saveSelectedDateToApi}
                disabled={!selectedDayHasCommitment || savingDate === selectedDate}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-900/30 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-800/40 disabled:opacity-50"
              >
                <Save size={13} />
                {savingDate === selectedDate ? 'Salvando...' : 'Salvar dia'}
              </button>
              {savedAtByDate[selectedDate] && (
                <span className="text-[10px] font-bold uppercase text-emerald-400">
                  Salvo {savedAtByDate[selectedDate]}
                </span>
              )}
            </div>
          </div>

          <p className="text-zinc-400 text-xs">
            Dia selecionado:{' '}
            <strong className="text-white">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            {!selectedDayHasCommitment && Object.keys(commitmentByDate).length > 0 && (
              <span className="text-amber-500 ml-2">— sem compromisso na programação nesta data.</span>
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
                        Escolha uma data com Treino, Jogo ou Musculação na programação para registrar o bem-estar.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {WELLNESS_DIMENSIONS.map(dim => {
                          const current = data[selectedDate]?.[player.id]?.[dim.key];
                          return (
                            <div key={dim.key} className="bg-black/50 rounded-xl p-3 border border-zinc-800">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">
                                {dim.emoji} {dim.label}
                              </p>
                              <div className="flex gap-1">
                                {scaleOptionsForDimension(dim.key).map(opt => (
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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Brain, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { wellnessApi } from '../services/api';
import { resolveEquipeIdFromSchedules } from '../utils/resolveEquipeId';
import { INJURY_LOCATIONS_BY_TYPE, WELLNESS_PAIN_SIDE_OPTIONS, WELLNESS_PAIN_TYPE_OPTIONS } from '../utils/injuryLocations';

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

type WellnessPlayerEntry = Partial<Record<WellnessDimensionKey, number>> & {
  painType?: string;
  painLocation?: string;
  painSide?: string;
  painLocations?: string[];
  painDetails?: Array<{ type: string; location: string; side: string }>;
};
type WellnessData = Record<string, Record<string, WellnessPlayerEntry>>;

type PainDetail = { type: string; location: string; side: string };
const DEFAULT_PAIN_DETAIL: PainDetail = { type: 'Muscular', location: '', side: 'N/A' };

function parsePainLocationsFromObservacoes(observacoes: unknown): string[] {
  if (typeof observacoes !== 'string' || !observacoes.trim()) return [];
  try {
    const parsed = JSON.parse(observacoes);
    const list = parsed?.painLocations;
    if (!Array.isArray(list)) return [];
    return list.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  } catch {
    return [];
  }
}

function parsePainMetaFromObservacoes(observacoes: unknown): { type?: string; location?: string; side?: string } {
  if (typeof observacoes !== 'string' || !observacoes.trim()) return {};
  try {
    const parsed = JSON.parse(observacoes);
    return {
      type: typeof parsed?.painType === 'string' ? parsed.painType : undefined,
      location: typeof parsed?.painLocation === 'string' ? parsed.painLocation : undefined,
      side: typeof parsed?.painSide === 'string' ? parsed.painSide : undefined,
    };
  } catch {
    return {};
  }
}

function parsePainDetailsFromObservacoes(observacoes: unknown): PainDetail[] {
  if (typeof observacoes !== 'string' || !observacoes.trim()) return [];
  try {
    const parsed = JSON.parse(observacoes);
    if (Array.isArray(parsed?.painDetails)) {
      return parsed.painDetails
        .filter((d: any) => d && typeof d === 'object')
        .map((d: any) => ({
          type: typeof d.type === 'string' ? d.type : 'Muscular',
          location: typeof d.location === 'string' ? d.location : '',
          side: typeof d.side === 'string' ? d.side : 'N/A',
        }));
    }
  } catch {
    return [];
  }
  return [];
}

function normalizedPainDetails(entry: WellnessPlayerEntry | undefined): PainDetail[] {
  if (!entry) return [DEFAULT_PAIN_DETAIL];
  if (Array.isArray(entry.painDetails) && entry.painDetails.length > 0) {
    return entry.painDetails.map((d) => ({
      type: d.type || 'Muscular',
      location: d.location || '',
      side: d.side || 'N/A',
    }));
  }
  const fallbackLocation =
    (typeof entry.painLocation === 'string' ? entry.painLocation : '')
    || (Array.isArray(entry.painLocations) ? entry.painLocations[0] || '' : '');
  if (entry.painType || fallbackLocation || entry.painSide) {
    return [{
      type: entry.painType || 'Muscular',
      location: fallbackLocation,
      side: entry.painSide || 'N/A',
    }];
  }
  return [DEFAULT_PAIN_DETAIL];
}

function buildObservacoesPayload(entry: WellnessPlayerEntry): string | null {
  const painLocations = Array.isArray(entry.painLocations)
    ? entry.painLocations.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];
  const painType = typeof entry.painType === 'string' ? entry.painType : undefined;
  const painLocation = typeof entry.painLocation === 'string' ? entry.painLocation : undefined;
  const painSide = typeof entry.painSide === 'string' ? entry.painSide : undefined;
  const painDetails = Array.isArray(entry.painDetails)
    ? entry.painDetails
      .filter((d) => d && (d.type || d.location || d.side))
      .map((d) => ({
        type: d.type || 'Muscular',
        location: d.location || '',
        side: d.side || 'N/A',
      }))
    : [];
  if (!painType && !painLocation && !painSide && painLocations.length === 0 && painDetails.length === 0) return null;
  return JSON.stringify({
    painType,
    painLocation,
    painSide,
    painLocations: painLocations.length > 0 ? painLocations : undefined,
    painDetails: painDetails.length > 0 ? painDetails : undefined,
  });
}

interface WellnessTabProps {
  players: Player[];
  schedules?: WeeklySchedule[];
}

function mergeWellnessData(base: WellnessData, incoming: WellnessData): WellnessData {
  const out: WellnessData = { ...base };
  Object.entries(incoming).forEach(([date, byPlayer]) => {
    out[date] = { ...(out[date] || {}), ...(byPlayer || {}) };
    Object.entries(byPlayer || {}).forEach(([playerId, dimensions]) => {
      out[date][playerId] = { ...(out[date][playerId] || {}), ...(dimensions || {}) };
    });
  });
  return out;
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
    let mounted = true;
    try {
      const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
      const localData: WellnessData = raw ? JSON.parse(raw) : {};
      if (mounted) setData(localData);
      wellnessApi.getAll('bem-estar-diario')
        .then((apiRows: any[]) => {
          if (!mounted || !Array.isArray(apiRows)) return;
          const fromApi: WellnessData = {};
          apiRows.forEach((row) => {
            const date = new Date(row.data).toISOString().split('T')[0];
            const playerId = String(row.jogador_id || '');
            if (!date || !playerId) return;
            if (!fromApi[date]) fromApi[date] = {};
            const painMeta = parsePainMetaFromObservacoes(row.observacoes);
            fromApi[date][playerId] = {
              stress: row.nivel_stress ?? undefined,
              sono: row.qual_sono ?? undefined,
              humor: row.humor_mot ?? undefined,
              dor: row.dor_muscular ?? undefined,
              satisfacao: row.satisfacao ?? undefined,
              painType: painMeta.type,
              painLocation: painMeta.location,
              painSide: painMeta.side,
              painLocations: parsePainLocationsFromObservacoes(row.observacoes),
              painDetails: parsePainDetailsFromObservacoes(row.observacoes),
            };
          });
          const merged = mergeWellnessData(fromApi, localData);
          setData(merged);
          try { localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(merged)); } catch (_) {}
        })
        .catch((err) => console.error('Erro ao carregar bem-estar diário:', err));
    } catch (_) {}
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const keys = Object.keys(commitmentByDate);
    if (keys.length === 0) return;
    if (!commitmentByDate[selectedDate]?.size) {
      const next = firstAllowedDate(commitmentByDate, selectedDate);
      if (next !== selectedDate) setSelectedDate(next);
    }
  }, [commitmentByDate, selectedDate]);

  const save = (playerId: string, dimension: WellnessDimensionKey, value: number) => {
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

  const setPainMeta = (
    playerId: string,
    patch: Partial<Pick<WellnessPlayerEntry, 'painType' | 'painLocation' | 'painSide'>>
  ) => {
    if (!commitmentByDate[selectedDate]?.size) return;
    setData(prev => {
      const next = { ...prev };
      if (!next[selectedDate]) next[selectedDate] = {};
      if (!next[selectedDate][playerId]) next[selectedDate][playerId] = {};
      next[selectedDate][playerId] = {
        ...next[selectedDate][playerId],
        ...patch,
      };
      try {
        localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      window.dispatchEvent(new Event('wellness-updated'));
      return next;
    });
  };

  const setPainDetails = (playerId: string, nextDetails: PainDetail[]) => {
    if (!commitmentByDate[selectedDate]?.size) return;
    setData(prev => {
      const next = { ...prev };
      if (!next[selectedDate]) next[selectedDate] = {};
      if (!next[selectedDate][playerId]) next[selectedDate][playerId] = {};
      next[selectedDate][playerId] = {
        ...next[selectedDate][playerId],
        painDetails: nextDetails,
      };
      try {
        localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      window.dispatchEvent(new Event('wellness-updated'));
      return next;
    });
  };

  const saveSelectedDateToApi = async () => {
    try {
      if (!selectedDayHasCommitment) {
        alert('Selecione um dia com compromisso para salvar no servidor.');
        return;
      }
      const equipeId = resolveEquipeIdFromSchedules(schedules);
      if (!equipeId) {
        alert('Não foi possível salvar no servidor: equipe não identificada na programação.');
        return;
      }
      const byPlayer = data[selectedDate] || {};
      const items = Object.entries(byPlayer).map(([jogadorId, values]) => ({
        equipeId,
        jogadorId,
        data: selectedDate,
        nivel_stress: values.stress ?? null,
        qual_sono: values.sono ?? null,
        humor_mot: values.humor ?? null,
        dor_muscular: values.dor ?? null,
        satisfacao: values.satisfacao ?? null,
        observacoes: buildObservacoesPayload(values),
      })).filter(item =>
        [item.nivel_stress, item.qual_sono, item.humor_mot, item.dor_muscular, item.satisfacao]
          .some(v => typeof v === 'number')
      );

      if (items.length === 0) {
        alert('Nenhum dado preenchido para salvar neste dia.');
        return;
      }

      setSavingDate(selectedDate);
      await wellnessApi.saveBulk('bem-estar-diario', items);
      setSavedAtByDate(prev => ({ ...prev, [selectedDate]: new Date().toLocaleTimeString('pt-BR') }));
      window.dispatchEvent(new Event('wellness-updated'));
    } catch (err) {
      console.error('Erro ao salvar bem-estar diário no servidor:', err);
      alert('Falha ao salvar no servidor. Os dados continuam no navegador e podem ser salvos novamente.');
    } finally {
      setSavingDate(null);
    }
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

  const averageByIndicator = useMemo(() => {
    const out: Record<WellnessDimensionKey, number | null> = {
      stress: null,
      sono: null,
      humor: null,
      dor: null,
      satisfacao: null,
    };
    WELLNESS_DIMENSION_KEYS.forEach((key) => {
      const values = activePlayers
        .map((p) => data[selectedDate]?.[p.id]?.[key])
        .filter((v): v is number => typeof v === 'number');
      out[key] = values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
    });
    return out;
  }, [activePlayers, data, selectedDate]);

  const painLocationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const playersWithPainResponse = activePlayers.filter((player) => {
      const entry = data[selectedDate]?.[player.id];
      return Boolean(entry && typeof entry.dor === 'number');
    });
    const denominator = Math.max(playersWithPainResponse.length, 1);
    playersWithPainResponse.forEach((player) => {
      const entry = data[selectedDate]?.[player.id];
      if (!entry || typeof entry.dor !== 'number') return;
      const details = normalizedPainDetails(entry);
      const unique = Array.from(new Set(details.map((d) => d.location).filter((loc) => Boolean(loc && loc.trim()))));
      unique.forEach((loc) => {
        counts[loc] = (counts[loc] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / denominator) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [activePlayers, data, selectedDate]);

  const multipleDiscomfortStats = useMemo(() => {
    const affectedAthletes = activePlayers.filter((player) => {
      const entry = data[selectedDate]?.[player.id];
      if (!entry || typeof entry.dor !== 'number') return false;
      const details = normalizedPainDetails(entry);
      const filled = details.filter((d) => d.location && d.location.trim().length > 0);
      return filled.length > 1;
    }).length;
    const rosterCount = Math.max(activePlayers.length, 1);
    return {
      count: affectedAthletes,
      percentage: Math.round((affectedAthletes / rosterCount) * 100),
    };
  }, [activePlayers, data, selectedDate]);

  const scoreColor = (s: number | null) => {
    if (s === null) return 'text-zinc-500';
    if (s >= 4) return 'text-emerald-400';
    if (s >= 3) return 'text-amber-400';
    return 'text-red-400';
  };

  const indicatorAvgColor = (dim: WellnessDimensionKey, value: number | null) => {
    if (value === null) return 'text-zinc-500';
    if (LOWER_IS_BETTER_DIMS.has(dim)) {
      if (value <= 2) return 'text-emerald-400';
      if (value <= 3) return 'text-amber-400';
      return 'text-red-400';
    }
    if (value >= 4) return 'text-emerald-400';
    if (value >= 3) return 'text-amber-400';
    return 'text-red-400';
  };

  const selectedCommitTypes = commitmentByDate[selectedDate];
  const selectedCommitList = selectedCommitTypes
    ? (['treino', 'jogo', 'musculacao'] as CommitType[]).filter(t => selectedCommitTypes.has(t))
    : [];

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
                Stress e dor muscular: quanto menor o valor, melhor (1 = melhor). Demais indicadores: quanto maior, melhor (5 = melhor). Depois de preencher, use o botão <strong>Salvar dia</strong> para enviar ao servidor.
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

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={saveSelectedDateToApi}
              disabled={savingDate === selectedDate}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide transition-colors ${
                savingDate === selectedDate
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25'
              }`}
            >
              <Save size={14} />
              {savingDate === selectedDate ? 'Salvando...' : 'Salvar dia'}
            </button>
          </div>
          {savedAtByDate[selectedDate] && (
            <p className="text-[11px] text-emerald-400 text-right -mt-3">
              Dia salvo no servidor às {savedAtByDate[selectedDate]}.
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {WELLNESS_DIMENSIONS.map((dim) => (
              <div key={dim.key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{dim.label}</p>
                <p className={`text-base font-black ${indicatorAvgColor(dim.key, averageByIndicator[dim.key])}`}>
                  {averageByIndicator[dim.key] != null ? averageByIndicator[dim.key] : '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">
              Alerta · dor muscular por local (base: respostas preenchidas)
            </p>
            {painLocationStats.length === 0 ? (
              <p className="text-[11px] text-zinc-500">Sem locais de dor apontados no dia selecionado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {painLocationStats.slice(0, 8).map((item) => (
                  <span key={item.location} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-semibold">
                    {item.location}: {item.count} atleta(s) ({item.percentage}%)
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-amber-300">
              Atletas com mais de 1 desconforto muscular: {multipleDiscomfortStats.count} ({multipleDiscomfortStats.percentage}% do elenco)
            </p>
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
                          const details = normalizedPainDetails(data[selectedDate]?.[player.id]);
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
                              {dim.key === 'dor' && typeof current === 'number' && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                    Detalhamento da dor (aba médica)
                                  </p>
                                  {details.map((detail, idx) => {
                                    const locationOptions = INJURY_LOCATIONS_BY_TYPE[detail.type] || INJURY_LOCATIONS_BY_TYPE.Outros;
                                    return (
                                      <div key={`${player.id}-${idx}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                                        <div>
                                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Tipo</label>
                                          <select
                                            value={detail.type}
                                            onChange={(e) => {
                                              const nextType = e.target.value;
                                              const nextOptions = INJURY_LOCATIONS_BY_TYPE[nextType] || INJURY_LOCATIONS_BY_TYPE.Outros;
                                              const nextLocation = nextOptions.includes(detail.location) ? detail.location : '';
                                              const next = [...details];
                                              next[idx] = { ...next[idx], type: nextType, location: nextLocation };
                                              setPainDetails(player.id, next);
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                                          >
                                            {WELLNESS_PAIN_TYPE_OPTIONS.map((type) => (
                                              <option key={type} value={type}>{type}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Local</label>
                                          <select
                                            value={detail.location}
                                            onChange={(e) => {
                                              const next = [...details];
                                              next[idx] = { ...next[idx], location: e.target.value };
                                              setPainDetails(player.id, next);
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                                          >
                                            <option value="">Selecione</option>
                                            {locationOptions.map((location) => (
                                              <option key={location} value={location}>{location}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Lado do corpo</label>
                                          <select
                                            value={detail.side}
                                            onChange={(e) => {
                                              const next = [...details];
                                              next[idx] = { ...next[idx], side: e.target.value };
                                              setPainDetails(player.id, next);
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                                          >
                                            {WELLNESS_PAIN_SIDE_OPTIONS.map((side) => (
                                              <option key={side} value={side}>{side}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...details, { ...DEFAULT_PAIN_DETAIL }];
                                            setPainDetails(player.id, next);
                                          }}
                                          className="h-[34px] px-3 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] text-sm font-black"
                                          title="Adicionar outro desconforto"
                                        >
                                          +
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
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

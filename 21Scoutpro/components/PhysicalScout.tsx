import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import html2canvas from 'html2canvas';
import { Activity, Brain, HeartPulse, AlertTriangle, Printer, Rotate3d, UserMinus, RefreshCw, Shield, Users } from 'lucide-react';
import { ExpandableCard } from './ExpandableCard';
import { MatchRecord, Player, WeeklySchedule, InjuryRecord } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { exportPhysiologyPdf, PhysiologyPdfData } from '../utils/exportPhysiologyPdf';
import { WELLNESS_STORAGE_KEY, WELLNESS_DIMENSIONS } from './WellnessTab';

const TRAINING_PSE_STORAGE_KEY = 'scout21_training_pse';
const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const PSR_JOGOS_STORAGE_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_STORAGE_KEY = 'scout21_psr_treinos';
type ChampionshipMatch = { id: string; date: string; time?: string; opponent: string; competition?: string };
type StoredPseJogos = Record<string, Record<string, number>>;
type StoredPseTreinos = Record<string, Record<string, number>>;
type StoredPsrJogos = Record<string, Record<string, number>>;
type StoredPsrTreinos = Record<string, Record<string, number>>;
type StoredWellness = Record<string, Record<string, Record<string, number>>>;

function enumerateDatesInclusive(from: string, to: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const end = new Date(ty, tm - 1, td);
  const cur = new Date(fy, fm - 1, fd);
  while (cur <= end) {
    out.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    );
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

interface PhysicalScoutProps {
    matches: MatchRecord[];
    players: Player[];
    schedules?: WeeklySchedule[];
    championshipMatches?: ChampionshipMatch[];
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** Alinhado ao Scout Coletivo: partida com coleta finalizada (não disponível / não executada / em andamento). */
function isMatchNotExecutedForPhysiology(match: MatchRecord): boolean {
  if (!match.teamStats) return true;
  const ts = match.teamStats;
  return (
    ts.goals === 0 &&
    ts.assists === 0 &&
    ts.passesCorrect === 0 &&
    ts.passesWrong === 0 &&
    ts.shotsOnTarget === 0 &&
    ts.shotsOffTarget === 0 &&
    ts.tacklesWithBall === 0 &&
    ts.tacklesWithoutBall === 0 &&
    ts.tacklesCounterAttack === 0 &&
    ts.transitionErrors === 0 &&
    Object.keys(match.playerStats || {}).length === 0
  );
}

function isMatchFinishedForPhysiology(match: MatchRecord): boolean {
  if (match.status === 'encerrado') return true;
  if (match.status === 'disponivel' || match.status === 'nao_executado' || match.status === 'em_andamento') return false;
  if (match.status == null && isMatchNotExecutedForPhysiology(match)) return false;
  return true;
}

/**
 * Atleta fora por lesão neste dia: lesão já iniciada, sem data de retorno prevista,
 * e ainda sem alta (retorno real / endDate) até o dia do jogo — mede jogos sem elenco completo (1 jogo = no máx. 1).
 */
function injuryWasOpenWithoutPredictedReturnOnMatchDay(inj: InjuryRecord, matchDay: string): boolean {
  const start = (inj.startDate || inj.date || '').slice(0, 10);
  if (!start || start.length < 10 || start > matchDay) return false;
  const pred = (inj.returnDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(pred)) return false;
  const closed = (inj.returnDateActual || inj.endDate || '').trim().slice(0, 10);
  if (closed.length >= 10 && closed <= matchDay) return false;
  return true;
}

export const PhysicalScout: React.FC<PhysicalScoutProps> = ({ matches, players, schedules = [], championshipMatches = [] }) => {
  const dr0 = defaultDateRange();
  const [dateFrom, setDateFrom] = useState(dr0.from);
  const [dateTo, setDateTo] = useState(dr0.to);
  /** vazio = média da equipe; caso contrário dados só desse atleta (Elenco) */
  const [playerFilterId, setPlayerFilterId] = useState('');
  const [trainingPse, setTrainingPse] = useState<Record<string, number>>({});
  const [pseJogosStored, setPseJogosStored] = useState<StoredPseJogos>({});
  const [pseTreinosStored, setPseTreinosStored] = useState<StoredPseTreinos>({});
  const [psrJogosStored, setPsrJogosStored] = useState<StoredPsrJogos>({});
  const [psrTreinosStored, setPsrTreinosStored] = useState<StoredPsrTreinos>({});
  const [wellnessStored, setWellnessStored] = useState<StoredWellness>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAINING_PSE_STORAGE_KEY);
      if (raw) setTrainingPse(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
      if (raw) setPseJogosStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (raw) setPseTreinosStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const j = localStorage.getItem(PSR_JOGOS_STORAGE_KEY);
      if (j) setPsrJogosStored(JSON.parse(j));
      const t = localStorage.getItem(PSR_TREINOS_STORAGE_KEY);
      if (t) setPsrTreinosStored(JSON.parse(t));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const loadWellness = () => {
      try {
        const w = localStorage.getItem(WELLNESS_STORAGE_KEY);
        if (w) setWellnessStored(JSON.parse(w));
      } catch (_) {}
    };
    loadWellness();
    window.addEventListener('wellness-updated', loadWellness);
    return () => window.removeEventListener('wellness-updated', loadWellness);
  }, []);

  // Recarregar dados das abas PSE, PSR e Bem-estar quando a tab for exibida (para atualizar após preencher nas outras abas)
  useEffect(() => {
    const onStorage = () => {
      try {
        const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
        if (j) setPseJogosStored(JSON.parse(j));
        const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
        if (t) setPseTreinosStored(JSON.parse(t));
        const pj = localStorage.getItem(PSR_JOGOS_STORAGE_KEY);
        if (pj) setPsrJogosStored(JSON.parse(pj));
        const pt = localStorage.getItem(PSR_TREINOS_STORAGE_KEY);
        if (pt) setPsrTreinosStored(JSON.parse(pt));
        const w = localStorage.getItem(WELLNESS_STORAGE_KEY);
        if (w) setWellnessStored(JSON.parse(w));
      } catch (_) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveTrainingPse = (updates: Record<string, number>) => {
    setTrainingPse(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(TRAINING_PSE_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const dateInRange = useCallback((dateStr: string) => {
    const day = (dateStr || '').slice(0, 10);
    if (!day || day.length < 10) return false;
    return day >= dateFrom && day <= dateTo;
  }, [dateFrom, dateTo]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => dateInRange(m.date));
  }, [matches, dateInRange]);

  const filteredChampionshipMatches = useMemo(
    () => championshipMatches.filter(m => dateInRange(m.date)),
    [championshipMatches, dateInRange]
  );

  // Datas de treinos a partir da Programação (aba Programação)
  const trainingDatesFromSchedules = useMemo(() => {
    const active = schedules.filter(s => s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true');
    const datesSet = new Set<string>();
    active.forEach(s => {
      const flat = normalizeScheduleDays(s);
      flat.forEach(day => {
        if (day.activity === 'Treino' && day.date) datesSet.add(day.date);
      });
    });
    return Array.from(datesSet).sort();
  }, [schedules]);

  // Sessões de treino/musculação (igual à aba Média PSE Treinos): data + horário + período para média da equipe
  const trainingSessionsForChart = useMemo(() => {
    const active = schedules.filter(s => s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true');
    const list: { sessionKey: string; date: string; time: string; activity: string }[] = [];
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
        list.push({ sessionKey, date, time, activity: act });
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return list;
  }, [schedules]);

  const teamAveragePseJogos = (matchId: string): number | null => {
    const data = pseJogosStored[matchId];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const teamAveragePseTreinos = (sessionKey: string): number | null => {
    const data = pseTreinosStored[sessionKey];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const teamAveragePsrJogos = (matchId: string): number | null => {
    const data = psrJogosStored[matchId];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const teamAveragePsrTreinos = (sessionKey: string): number | null => {
    const data = psrTreinosStored[sessionKey];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  // Lesões no período (data de início dentro do intervalo); opcionalmente só do atleta filtrado
  const filteredInjuries = useMemo(() => {
    const out: InjuryRecord[] = [];
    const roster = playerFilterId ? players.filter(p => p.id === playerFilterId) : players;
    roster.forEach(player => {
      (player.injuryHistory || []).forEach(injury => {
        const startRaw = injury.startDate || injury.date;
        if (!startRaw) return;
        const day = String(startRaw).slice(0, 10);
        if (!dateInRange(day)) return;
        out.push(injury);
      });
    });
    return out;
  }, [players, dateInRange, playerFilterId]);

  const filteredTraining = useMemo(() => {
    return trainingDatesFromSchedules
      .filter(date => dateInRange(date))
      .map(date => ({ date, avgRpe: trainingPse[date] ?? undefined }));
  }, [trainingDatesFromSchedules, trainingPse, dateInRange]);

  // Dados do gráfico PSE (Treinos): média da equipe ou valor do atleta por sessão
  const rpeTrainingDataFromSessions = useMemo(() => {
    return trainingSessionsForChart
      .filter(s => dateInRange(s.date))
      .map(s => {
        let rpe: number | null = null;
        if (playerFilterId) {
          const v = pseTreinosStored[s.sessionKey]?.[playerFilterId];
          rpe = typeof v === 'number' ? v : null;
        } else {
          rpe = teamAveragePseTreinos(s.sessionKey);
        }
        const dateLabel = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const hour = s.time ? s.time.slice(0, 5) : '';
        const label = hour ? `${dateLabel} ${hour}` : dateLabel;
        return {
          date: label,
          dateKey: s.date,
          rpe: rpe ?? 0,
          type: 'Treino' as const,
          hasData: !playerFilterId || rpe !== null,
        };
      })
      .filter(row => row.hasData);
  }, [trainingSessionsForChart, dateInRange, pseTreinosStored, playerFilterId]);

  const stats = useMemo(() => {
    let avgRpeMatch: string | number = 0;
    let totalMatches = filteredMatches.length;
    if (championshipMatches.length > 0) {
      const filtered = filteredChampionshipMatches;
      let values: number[] = [];
      if (playerFilterId) {
        values = filtered
          .map(m => pseJogosStored[m.id]?.[playerFilterId])
          .filter((v): v is number => typeof v === 'number');
      } else {
        values = filtered
          .map(m => teamAveragePseJogos(m.id) ?? matches.find(s => s.date === m.date)?.teamStats?.rpeMatch)
          .filter((v): v is number => v != null && typeof v === 'number');
      }
      totalMatches = filtered.length;
      avgRpeMatch = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
    } else {
      if (playerFilterId) {
        const vals = filteredMatches
          .map(m => pseJogosStored[m.id]?.[playerFilterId])
          .filter((v): v is number => typeof v === 'number');
        totalMatches = filteredMatches.length;
        avgRpeMatch = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
      } else {
        const totalRpe = filteredMatches.reduce((acc, curr) => acc + (curr.teamStats.rpeMatch || 0), 0);
        avgRpeMatch = totalMatches > 0 ? (totalRpe / totalMatches).toFixed(1) : 0;
      }
    }

    const rosterForAbsence =
      playerFilterId !== ''
        ? players.filter(p => p.id === playerFilterId && !p.isTransferred)
        : players.filter(p => !p.isTransferred);

    const matchHasSquadAbsence = (matchDay: string) =>
      rosterForAbsence.some(player =>
        (player.injuryHistory || []).some(inj => injuryWasOpenWithoutPredictedReturnOnMatchDay(inj, matchDay))
      );

    let matchesWithAbsence = 0;
    if (championshipMatches.length > 0) {
      filteredChampionshipMatches.forEach(cm => {
        const day = cm.date.slice(0, 10);
        const saved =
          matches.find(s => s.date === cm.date && s.opponent === cm.opponent) ?? matches.find(s => s.date === cm.date);
        if (!saved || !isMatchFinishedForPhysiology(saved)) return;
        if (matchHasSquadAbsence(day)) matchesWithAbsence++;
      });
    } else {
      filteredMatches.forEach(match => {
        if (!isMatchFinishedForPhysiology(match)) return;
        const day = match.date.slice(0, 10);
        if (matchHasSquadAbsence(day)) matchesWithAbsence++;
      });
    }

    // Contar lesões por origem
    const injuriesByOrigin = {
      treino: filteredInjuries.filter(i => i.origin === 'Treino').length,
      jogo: filteredInjuries.filter(i => i.origin === 'Jogo').length,
      outros: filteredInjuries.filter(i => i.origin === 'Outros' || !i.origin).length // Lesões sem origem vão para "Outros"
    };

    return {
      totalMatches,
      avgRpeMatch,
      totalInjuries: filteredInjuries.length,
      matchesWithAbsence,
      injuriesByOrigin
    };
  }, [
    filteredMatches,
    filteredInjuries,
    championshipMatches,
    filteredChampionshipMatches,
    matches,
    players,
    pseJogosStored,
    playerFilterId,
  ]);

  // Evolução PSE (Jogos): média da equipe ou valor do atleta; só jogos no intervalo de datas
  const rpeMatchData = useMemo(() => {
    if (championshipMatches.length > 0) {
      const sorted = [...filteredChampionshipMatches].sort((a, b) => a.date.localeCompare(b.date));
      return sorted
        .map(m => {
          const saved = matches.find(s => s.date === m.date);
          let rpe: number;
          if (playerFilterId) {
            const v = pseJogosStored[m.id]?.[playerFilterId];
            if (typeof v !== 'number') return null;
            rpe = v;
          } else {
            const teamAvg = teamAveragePseJogos(m.id);
            rpe = teamAvg ?? saved?.teamStats?.rpeMatch ?? 0;
          }
          return {
            date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            rpe,
            opponent: m.opponent,
            result: saved?.result
          };
        })
        .filter((row): row is NonNullable<typeof row> => row != null);
    }
    return filteredMatches
      .map(m => {
        if (playerFilterId) {
          const v = pseJogosStored[m.id]?.[playerFilterId];
          if (typeof v !== 'number') return null;
          return {
            date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            rpe: v,
            opponent: m.opponent,
            result: m.result
          };
        }
        return {
          date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          rpe: m.teamStats.rpeMatch ?? 0,
          opponent: m.opponent,
          result: m.result
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [championshipMatches, matches, filteredMatches, filteredChampionshipMatches, pseJogosStored, playerFilterId]);

  const rpeTrainingData = trainingSessionsForChart.length > 0
    ? rpeTrainingDataFromSessions
    : filteredTraining.map(t => ({
        date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dateKey: t.date,
        rpe: t.avgRpe ?? 0,
        type: 'Treino'
      }));

  // Evolução PSR (Jogos)
  const psrMatchData = useMemo(() => {
    if (championshipMatches.length === 0) return [];
    const sorted = [...filteredChampionshipMatches].sort((a, b) => a.date.localeCompare(b.date));
    return sorted
      .map(m => {
        let val: number | null = null;
        if (playerFilterId) {
          const v = psrJogosStored[m.id]?.[playerFilterId];
          val = typeof v === 'number' ? v : null;
        } else {
          val = teamAveragePsrJogos(m.id);
        }
        if (val == null) return null;
        return {
          date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          rpe: val,
          opponent: m.opponent
        };
      })
      .filter((v): v is NonNullable<typeof v> => v != null);
  }, [championshipMatches, filteredChampionshipMatches, psrJogosStored, playerFilterId]);

  // PSR (Treinos)
  const psrTrainingDataFromSessions = useMemo(() => {
    return trainingSessionsForChart
      .filter(s => dateInRange(s.date))
      .map(s => {
        let rpe: number | null = null;
        if (playerFilterId) {
          const v = psrTreinosStored[s.sessionKey]?.[playerFilterId];
          rpe = typeof v === 'number' ? v : null;
        } else {
          rpe = teamAveragePsrTreinos(s.sessionKey);
        }
        const dateLabel = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const hour = s.time ? s.time.slice(0, 5) : '';
        const label = hour ? `${dateLabel} ${hour}` : dateLabel;
        return {
          date: label,
          dateKey: s.date,
          rpe: rpe ?? 0,
          type: 'Treino' as const,
          hasData: !playerFilterId || rpe !== null,
        };
      })
      .filter(row => row.hasData);
  }, [trainingSessionsForChart, dateInRange, psrTreinosStored, playerFilterId]);

  const psrTrainingData = trainingSessionsForChart.length > 0 ? psrTrainingDataFromSessions : [];

  /** Média por indicador no período (mesma lógica das linhas antigas: por dia, equipe ou atleta; depois média no período). */
  const wellnessRadarPeriod = useMemo(() => {
    const roster = players.filter(p => !p.isTransferred);
    const dates = enumerateDatesInclusive(dateFrom, dateTo);
    return WELLNESS_DIMENSIONS.map(dim => {
      const dailyValues: number[] = [];
      for (const dateStr of dates) {
        const dayMap = wellnessStored[dateStr];
        if (!dayMap) continue;
        if (playerFilterId) {
          const v = dayMap[playerFilterId]?.[dim.key];
          if (typeof v === 'number') dailyValues.push(v);
        } else {
          const vals = roster
            .map(p => dayMap[p.id]?.[dim.key])
            .filter((x): x is number => typeof x === 'number');
          if (vals.length > 0) {
            dailyValues.push(Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10);
          }
        }
      }
      const avg =
        dailyValues.length > 0
          ? Math.round((dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length) * 10) / 10
          : null;
      const shortLabel = dim.label.length > 18 ? `${dim.label.slice(0, 16)}…` : dim.label;
      return {
        key: dim.key,
        subject: dim.label,
        shortLabel,
        value: avg ?? 0,
        avg,
        avgLabel: avg != null ? `Ø ${avg}` : '—',
        fullMark: 5,
      };
    });
  }, [wellnessStored, dateFrom, dateTo, playerFilterId, players]);

  const hasWellnessRadarData = wellnessRadarPeriod.some(r => r.avg !== null);

  const avgOf = (values: number[]): number | null => {
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };
  const avgRpeMatchChart = useMemo(() => avgOf(rpeMatchData.map(d => d.rpe)), [rpeMatchData]);
  const avgRpeTrainingChart = useMemo(() => avgOf(rpeTrainingData.map(d => d.rpe)), [rpeTrainingData]);
  const avgPsrMatchChart = useMemo(() => avgOf(psrMatchData.map(d => d.rpe)), [psrMatchData]);
  const avgPsrTrainingChart = useMemo(() => avgOf(psrTrainingData.map(d => d.rpe)), [psrTrainingData]);
  const avgWellnessKpi = useMemo(
    () => avgOf(wellnessRadarPeriod.map(r => r.avg).filter((v): v is number => v != null)),
    [wellnessRadarPeriod]
  );

  const injuryTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInjuries.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredInjuries]);

  // Contagem por lado do corpo: usa o campo side do cadastro de atleta (Direito | Esquerdo | Bilateral | N/A)
  const injurySideData = useMemo(() => {
    let direito = 0;
    let esquerdo = 0;

    filteredInjuries.forEach((i: InjuryRecord) => {
      const side = i.side ?? (() => {
        // Fallback para dados antigos sem side: inferir pelo texto de location
        const loc = (i.location || '').toLowerCase();
        if (loc.includes('direito') || loc.includes('direita')) return 'Direito';
        if (loc.includes('esquerdo') || loc.includes('esquerda')) return 'Esquerdo';
        if (loc.includes('bilateral')) return 'Bilateral';
        return null;
      })();
      if (side === 'Direito') direito++;
      else if (side === 'Esquerdo') esquerdo++;
      else if (side === 'Bilateral') {
        direito++;
        esquerdo++;
      }
      // N/A ou sem side: não soma em nenhum card
    });

    return { direito, esquerdo };
  }, [filteredInjuries]);

  // P1: ACWR (Acute:Chronic Workload Ratio) per athlete
  type AcwrEntry = { playerId: string; name: string; nickname: string; position: string; acwr: number | null; acute: number; chronic: number; risk: 'green' | 'yellow' | 'red' | 'none' };

  const acwrData = useMemo((): AcwrEntry[] => {
    const acuteStartStr = (() => {
      const t = new Date(dateTo + 'T12:00:00');
      t.setDate(t.getDate() - 7);
      const s = t.toISOString().slice(0, 10);
      return s > dateFrom ? s : dateFrom;
    })();
    const chronicStartStr = (() => {
      const t = new Date(dateTo + 'T12:00:00');
      t.setDate(t.getDate() - 28);
      const s = t.toISOString().slice(0, 10);
      return s > dateFrom ? s : dateFrom;
    })();

    const allDates: { date: string; data: Record<string, number> }[] = [];
    Object.entries(pseTreinosStored).forEach(([key, data]) => {
      const datePart = key.split('_')[0];
      if (datePart && dateInRange(datePart)) allDates.push({ date: datePart, data });
    });
    Object.entries(pseJogosStored).forEach(([_matchId, data]) => {
      const match = championshipMatches.find(m => m.id === _matchId);
      if (match && dateInRange(match.date)) allDates.push({ date: match.date, data });
    });

    const activePlayers = players.filter(p => !p.isTransferred);
    const playersForAcwr = playerFilterId ? activePlayers.filter(p => p.id === playerFilterId) : activePlayers;

    return playersForAcwr.map(p => {
      let acute = 0, acuteCount = 0, chronic = 0, chronicCount = 0;
      allDates.forEach(({ date, data }) => {
        const val = data[p.id];
        if (typeof val !== 'number' || val < 0) return;
        if (date >= acuteStartStr && date <= dateTo) {
          acute += val;
          acuteCount++;
        }
        if (date >= chronicStartStr && date <= dateTo) {
          chronic += val;
          chronicCount++;
        }
      });
      const acuteAvg = acuteCount > 0 ? acute / acuteCount : 0;
      const chronicAvg = chronicCount > 0 ? chronic / chronicCount : 0;
      const acwr = chronicAvg > 0 ? Math.round((acuteAvg / chronicAvg) * 100) / 100 : null;
      let risk: AcwrEntry['risk'] = 'none';
      if (acwr !== null) {
        if (acwr >= 0.8 && acwr <= 1.3) risk = 'green';
        else if (acwr > 1.3 && acwr <= 1.5) risk = 'yellow';
        else risk = 'red';
      }
      return { playerId: p.id, name: p.name, nickname: p.nickname, position: p.position, acwr, acute: Math.round(acuteAvg * 10) / 10, chronic: Math.round(chronicAvg * 10) / 10, risk };
    }).sort((a, b) => {
      const riskOrder = { red: 0, yellow: 1, green: 2, none: 3 };
      return riskOrder[a.risk] - riskOrder[b.risk];
    });
  }, [players, pseTreinosStored, pseJogosStored, championshipMatches, dateFrom, dateTo, playerFilterId]);

  const handlePrint = async () => {
    try {
      const playerLabel = playerFilterId
        ? (players.find(pl => pl.id === playerFilterId)?.name ?? playerFilterId)
        : 'Equipe (média)';
      let heatmapImageDataUrl: string | null = null;
      try {
        const heatmapEl = document.getElementById('physiology-heatmap-capture');
        if (heatmapEl) {
          const canvas = await html2canvas(heatmapEl, { backgroundColor: '#000000', scale: 2, useCORS: true });
          heatmapImageDataUrl = canvas.toDataURL('image/png');
        }
      } catch (_) {}
      const pdfData: PhysiologyPdfData = {
        teamName: (() => {
          try {
            const raw = localStorage.getItem('scout21_overview_team');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.teamName || undefined;
          } catch {
            return undefined;
          }
        })(),
        teamShieldUrl: (() => {
          try {
            const raw = localStorage.getItem('scout21_overview_team');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.teamShieldUrl || undefined;
          } catch {
            return undefined;
          }
        })(),
        filters: {
          dateFrom,
          dateTo,
          playerLabel,
        },
        kpis: {
          avgWellness: avgWellnessKpi ?? '—',
          injuriesByOrigin: stats.injuriesByOrigin,
          totalInjuries: stats.totalInjuries,
          matchesWithAbsence: stats.matchesWithAbsence,
        },
        pseMatchData: rpeMatchData,
        pseTrainingData: rpeTrainingData,
        psrMatchData,
        psrTrainingData,
        wellnessRadarData: wellnessRadarPeriod.map(r => ({ subject: r.subject, avg: r.avg })),
        injuryTypeData,
        injurySideData,
        acwrRows: acwrData
          .filter(a => a.acwr !== null)
          .map(a => ({
            name: a.nickname || a.name,
            position: a.position,
            acute: a.acute,
            chronic: a.chronic,
            acwr: a.acwr as number,
            risk: a.risk,
          })),
        heatmapImageDataUrl,
      };
      await exportPhysiologyPdf(pdfData);
    } catch (err) {
      console.error('Erro ao gerar PDF de fisiologia:', err);
      window.print();
    }
  };
  
  const rosterPlayers = useMemo(() => players.filter(p => !p.isTransferred), [players]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:p-0 print:space-y-4">
      
      <div id="physiology-export-content" className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md rounded-3xl border border-zinc-900 shadow-lg p-5 print:static print:bg-white print:border-none print:shadow-none print:p-0 print:mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 print:text-black uppercase tracking-wide">
              <HeartPulse className="text-[#00f0ff] print:text-black" /> 
              Departamento de Fisiologia
            </h2>
            <p className="text-zinc-500 text-xs mt-1 print:text-gray-600 font-bold uppercase tracking-wider">
              {stats.totalInjuries} lesões · {stats.totalMatches} jogos (período) · {rosterPlayers.length} atletas no elenco
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto print:hidden">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Data inicial</label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Data final</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                  <Users size={12} /> Atleta (Elenco)
                </label>
                <select
                  value={playerFilterId}
                  onChange={e => setPlayerFilterId(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                >
                  <option value="">Equipe — médias</option>
                  {rosterPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#00f0ff] hover:bg-[#00d4e0] text-black px-4 py-2 font-bold transition-colors uppercase tracking-wider rounded-xl text-sm"
              >
                <Printer size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4 print:gap-4">
        <div className="bg-black rounded-2xl border border-zinc-900 border-l-4 border-l-[#ccff00] p-5 print:border-gray-200">
          <KPICardInner
            title="Média de Bem-Estar"
            value={avgWellnessKpi ?? '—'}
            icon={Brain}
            color="text-[#ccff00]"
            sub={playerFilterId ? 'Atleta no período · 1–5' : 'Equipe no período · 1–5'}
          />
        </div>
        <div className="bg-black rounded-2xl border border-zinc-900 border-l-4 border-l-[#00f0ff] p-5 print:border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest print:text-gray-500 mb-3">Lesões por Origem</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-white text-base font-black print:text-black">Treino: {stats.injuriesByOrigin.treino}</span>
                </div>
                <span className="text-zinc-700">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white text-base font-black print:text-black">Jogo: {stats.injuriesByOrigin.jogo}</span>
                </div>
                <span className="text-zinc-700">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-white text-base font-black print:text-black">Outros: {stats.injuriesByOrigin.outros}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-xl ml-3">
              <AlertTriangle size={24} className="text-[#00f0ff]" />
            </div>
          </div>
        </div>
        <div className="bg-black rounded-2xl border border-zinc-900 border-l-4 border-l-[#ff0055] p-5 print:border-gray-200">
          <KPICardInner title="Lesões (período)" value={stats.totalInjuries} icon={AlertTriangle} color="text-[#ff0055]" sub={playerFilterId ? 'Atleta filtrado' : 'Todos os atletas'} />
        </div>
        <div className="bg-black rounded-2xl border border-zinc-900 border-l-4 border-l-orange-500 p-5 print:border-gray-200">
          <KPICardInner title="Jogos com Desfalque" value={stats.matchesWithAbsence} icon={UserMinus} color="text-orange-500" sub="Jogos finalizados com ≥1 lesão ativa sem retorno previsto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
        <ExpandableCard title="Evolução PSE (Jogos)" icon={Activity} headerColor="text-[#00f0ff]">
           <p className="text-xs text-zinc-500 mb-2 font-medium">
             {playerFilterId ? 'PSE do atleta por jogo no período. ' : 'Média da equipe por jogo no período. '}
             Preencha na aba <strong>PSE (Treinos e Jogos)</strong>.
           </p>
           <div className="flex justify-end mb-2">
             <span className="text-[10px] font-bold uppercase text-zinc-400">Média: <strong className="text-[#ccff00]">{avgRpeMatchChart ?? '—'}</strong></span>
           </div>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeMatchData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12, fontFamily: 'Calibri'}} />
                    <YAxis domain={[0, 12]} stroke="#666" hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }}
                        cursor={{stroke: '#ccff00'}}
                    />
                    <Area type="monotone" dataKey="rpe" fill="#ccff00" fillOpacity={0.25} stroke="none" />
                    <Line 
                        type="monotone" 
                        dataKey="rpe" 
                        stroke="#ccff00" 
                        strokeWidth={1.5} 
                        dot={{fill: '#ccff00', r: 4}} 
                        activeDot={{r: 6}} 
                        name="PSE Média equipe"
                    >
                        <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Calibri" />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>

        <ExpandableCard title="Média PSE (Treinos)" icon={Activity} headerColor="text-[#00f0ff]">
           <p className="text-xs text-zinc-500 mb-2 font-medium">
             {playerFilterId ? 'PSE do atleta por sessão no período. ' : 'Média da equipe por sessão no período. '}
             Preencha na aba <strong>PSE (Treinos e Jogos)</strong>.
           </p>
           <div className="flex justify-end mb-2">
             <span className="text-[10px] font-bold uppercase text-zinc-400">Média: <strong className="text-emerald-400">{avgRpeTrainingChart ?? '—'}</strong></span>
           </div>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeTrainingData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12, fontFamily: 'Calibri'}} />
                    <YAxis domain={[0, 12]} stroke="#666" hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="rpe" fill="#10b981" fillOpacity={0.25} stroke="none" />
                    <Line 
                        type="monotone" 
                        dataKey="rpe" 
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={{fill: '#10b981', r: 4}}
                        name="PSE Média equipe"
                    >
                         <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Calibri" />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
        <ExpandableCard title="Evolução PSR (Jogos)" icon={RefreshCw} headerColor="text-[#00f0ff]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">
            {playerFilterId ? 'PSR do atleta por jogo no período. ' : 'Média da equipe por jogo no período. '}
            Quanto mais perto de 10, melhor a recuperação. Preencha na aba <strong>PSR (Treinos e Jogos)</strong>.
          </p>
          <div className="flex justify-end mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Média: <strong className="text-sky-400">{avgPsrMatchChart ?? '—'}</strong></span>
          </div>
          {psrMatchData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={psrMatchData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12, fontFamily: 'Calibri' }} />
                  <YAxis domain={[0, 12]} stroke="#666" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }} cursor={{ stroke: '#38bdf8' }} />
                  <Area type="monotone" dataKey="rpe" fill="#38bdf8" fillOpacity={0.25} stroke="none" />
                  <Line type="monotone" dataKey="rpe" stroke="#38bdf8" strokeWidth={1.5} dot={{ fill: '#38bdf8', r: 4 }} activeDot={{ r: 6 }} name="PSR Média equipe">
                    <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Calibri" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-8">Preencha a PSR nos jogos na aba <strong>PSR (Treinos e Jogos)</strong> para ver a evolução.</p>
          )}
        </ExpandableCard>

        <ExpandableCard title="Média PSR (Treinos)" icon={RefreshCw} headerColor="text-[#00f0ff]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">
            {playerFilterId ? 'PSR do atleta por sessão no período. ' : 'Média da equipe por sessão no período. '}
            Mais perto de 10 = melhor recuperado. Preencha na aba <strong>PSR (Treinos e Jogos)</strong>.
          </p>
          <div className="flex justify-end mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Média: <strong className="text-cyan-400">{avgPsrTrainingChart ?? '—'}</strong></span>
          </div>
          {psrTrainingData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={psrTrainingData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12, fontFamily: 'Calibri' }} />
                  <YAxis domain={[0, 12]} stroke="#666" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="rpe" fill="#0ea5e9" fillOpacity={0.25} stroke="none" />
                  <Line type="monotone" dataKey="rpe" stroke="#0ea5e9" strokeWidth={1.5} dot={{ fill: '#0ea5e9', r: 4 }} name="PSR Média equipe">
                    <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Calibri" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-8">Preencha a PSR nos treinos na aba <strong>PSR (Treinos e Jogos)</strong> para ver a evolução.</p>
          )}
        </ExpandableCard>
      </div>

      <div className="space-y-4 print:break-inside-avoid">
        <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2 px-1 print:text-black">
          <Brain className="text-[#00f0ff] print:text-black" /> Bem-estar diário
        </h3>
        <p className="text-xs text-zinc-500 -mt-2 px-1 print:text-gray-600">
          Radar com a <strong className="text-zinc-400">média de cada indicador</strong> no período (escala 1–5), alinhado aos filtros de data e atleta. Fonte: aba{' '}
          <strong className="text-zinc-400">Bem-Estar Diário</strong>. Nos eixos: nome do indicador e média (Ø).
        </p>
        <ExpandableCard title="Radar — médias do período" icon={Brain} headerColor="text-fuchsia-400">
          {hasWellnessRadarData ? (
            <div className="h-[min(420px,70vw)] w-full max-w-2xl mx-auto min-h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={wellnessRadarPeriod} cx="50%" cy="52%" outerRadius="68%">
                  <PolarGrid stroke="#27272a" />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'Calibri' }}
                    stroke="#3f3f46"
                  />
                  <PolarAngleAxis
                    dataKey="shortLabel"
                    tick={({ x, y, payload, textAnchor }) => {
                      const row = wellnessRadarPeriod.find(r => r.shortLabel === payload.value);
                      if (!row) return <g />;
                      const ta = textAnchor === 'end' ? 'end' : textAnchor === 'start' ? 'start' : 'middle';
                      return (
                        <text x={x} y={y} textAnchor={ta} fill="#a1a1aa" fontSize={9} fontFamily="Calibri">
                          <tspan x={x} dy={0}>
                            {row.shortLabel}
                          </tspan>
                          <tspan x={x} dy={12} fill="#00f0ff" fontWeight="bold" fontSize={10}>
                            {row.avgLabel}
                          </tspan>
                        </text>
                      );
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000',
                      borderColor: '#27272a',
                      color: '#fff',
                      fontFamily: 'Calibri',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, _name: string, item: { payload?: { subject?: string; avgLabel?: string } }) => [
                      item?.payload?.avgLabel ?? String(value),
                      item?.payload?.subject ?? 'Indicador',
                    ]}
                  />
                  <Radar
                    name="Média no período"
                    dataKey="value"
                    stroke="#00f0ff"
                    fill="#00f0ff"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#00f0ff', strokeWidth: 0 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
          {hasWellnessRadarData && (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-500 border-t border-zinc-800 pt-4 font-medium">
              {wellnessRadarPeriod.map(r => (
                <li key={r.key} className="flex justify-between gap-2 border-b border-zinc-800/60 pb-1.5 sm:border-0 sm:pb-0">
                  <span className="text-zinc-300">{r.subject}</span>
                  <span className="text-[#00f0ff] font-black tabular-nums">{r.avgLabel}</span>
                </li>
              ))}
            </ul>
          )}
          {!hasWellnessRadarData && (
            <p className="text-zinc-500 text-sm py-10 text-center">
              Sem dados no período. Preencha na aba <strong>Bem-Estar Diário</strong> em dias com Treino, Jogo ou Musculação na programação.
            </p>
          )}
        </ExpandableCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
        <ExpandableCard title="Distribuição por Tipo" icon={AlertTriangle} headerColor="text-[#00f0ff]">
           <p className="text-xs text-zinc-500 mb-4 font-medium">Lesões com data de início no período selecionado.</p>
           <div className="h-96 min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={injuryTypeData} 
                    layout="vertical" 
                    margin={{left: 30, right: 30, top: 10, bottom: 10}}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#666" allowDecimals={false} hide />
                    <YAxis dataKey="name" type="category" stroke="#71717a" width={80} tick={{fontFamily: 'Calibri', fontSize: 14}} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} name="Ocorrências" fill="#52525b">
                      <LabelList dataKey="value" position="right" fill="#fff" fontSize={14} fontWeight="bold" fontFamily="Calibri" />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           
           {/* Cards de contagem por lado */}
           <div className="grid grid-cols-2 gap-4 mt-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/50 rounded-lg flex items-center justify-center">
                   <span className="text-blue-400 font-black text-lg">D</span>
                 </div>
                 <div>
                   <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Lado Direito</p>
                   <p className="text-white text-2xl font-black mt-1">{injurySideData.direito}</p>
                 </div>
               </div>
               <span className="text-zinc-600 text-xs font-medium">{injurySideData.direito === 1 ? 'lesão' : 'lesões'}</span>
             </div>
             
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-600/20 border border-red-500/50 rounded-lg flex items-center justify-center">
                   <span className="text-red-400 font-black text-lg">E</span>
                 </div>
                 <div>
                   <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Lado Esquerdo</p>
                   <p className="text-white text-2xl font-black mt-1">{injurySideData.esquerdo}</p>
                 </div>
               </div>
               <span className="text-zinc-600 text-xs font-medium">{injurySideData.esquerdo === 1 ? 'lesão' : 'lesões'}</span>
             </div>
           </div>
        </ExpandableCard>

        <ExpandableCard title="Mapa de Calor (Heatmap)" icon={AlertTriangle} headerColor="text-[#00f0ff]">
           <div className="flex flex-col h-full">
               <div className="mb-4 flex justify-end">
                    <span className="text-xs text-white font-black tracking-wider bg-zinc-800 border border-zinc-600 px-3 py-1 rounded-full uppercase">
                        {playerFilterId ? (players.find(p => p.id === playerFilterId)?.nickname || players.find(p => p.id === playerFilterId)?.name || 'Atleta') : 'Equipe'}
                    </span>
               </div>
               
              <div id="physiology-heatmap-capture" className="flex-1 flex items-center justify-center bg-black border border-zinc-800 rounded-2xl print:bg-gray-50 print:border-gray-200 p-8 relative overflow-visible min-h-[500px]">
                    <MuscleBodyMap injuries={filteredInjuries} />
               </div>
           </div>
        </ExpandableCard>
      </div>

      {/* ACWR reposicionado abaixo do mapa de calor */}
      <ExpandableCard title="ACWR — Risco de Lesão por Atleta" icon={Shield} headerColor="text-[#00f0ff]">
        <p className="text-xs text-zinc-500 mb-4 font-medium">
          Razão Carga Aguda (7d) / Crônica (28d). <strong>Verde</strong> 0.8–1.3 (seguro), <strong>Amarelo</strong> 1.3–1.5 (atenção), <strong>Vermelho</strong> &gt;1.5 ou &lt;0.8 (risco elevado).
        </p>
        {acwrData.filter(a => a.acwr !== null).length === 0 ? (
          <p className="text-zinc-500 text-sm py-6 text-center">Preencha PSE em treinos e jogos para calcular o ACWR dos atletas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">Atleta</th>
                  <th className="text-left text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">Posição</th>
                  <th className="text-center text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">Aguda (7d)</th>
                  <th className="text-center text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">Crônica (28d)</th>
                  <th className="text-center text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">ACWR</th>
                  <th className="text-center text-zinc-500 text-[10px] uppercase tracking-wider py-2 px-3">Risco</th>
                </tr>
              </thead>
              <tbody>
                {acwrData.filter(a => a.acwr !== null).map(a => (
                  <tr key={a.playerId} className="border-b border-zinc-900/50 hover:bg-zinc-900/30 cursor-pointer transition-colors" onClick={() => setPlayerFilterId(prev => prev === a.playerId ? '' : a.playerId)}>
                    <td className="py-2.5 px-3 text-white font-bold">{a.nickname || a.name}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{a.position}</td>
                    <td className="py-2.5 px-3 text-center text-white">{a.acute}</td>
                    <td className="py-2.5 px-3 text-center text-white">{a.chronic}</td>
                    <td className="py-2.5 px-3 text-center font-black text-lg">{a.acwr}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${a.risk === 'green' ? 'bg-emerald-500' : a.risk === 'yellow' ? 'bg-amber-400' : 'bg-red-500'}`} />
                      <span className={`ml-2 text-xs font-bold ${a.risk === 'green' ? 'text-emerald-400' : a.risk === 'yellow' ? 'text-amber-400' : 'text-red-400'}`}>
                        {a.risk === 'green' ? 'Seguro' : a.risk === 'yellow' ? 'Atenção' : 'Risco'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ExpandableCard>

    </div>
  );
};

const KPICardInner: React.FC<{ title: string; value: string | number; icon: any; color: string; sub: string }> = ({ title, value, icon: Icon, color, sub }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest print:text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-white mt-2 print:text-black">{value}</p>
            <p className="text-zinc-600 text-[10px] mt-1 print:text-gray-400 font-medium uppercase">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl`} style={{ background: 'rgba(0,0,0,0.3)' }}>
            <Icon size={24} className={color} />
        </div>
    </div>
);

interface InjuryBodyMapProps {
    injuries: InjuryRecord[];
}

type InjurySideKind = 'Direito' | 'Esquerdo' | 'Bilateral' | 'N/A';
type OutwardDir = 'left' | 'right' | 'up' | 'down';

const HEATMAP_BODY_POINTS: Record<string, { front: [number, number] | null; back: [number, number] | null }> = {
    Cabeça: { front: [50, 8], back: [50, 8] },
    Face: { front: [50, 12], back: null },
    Ombro: { front: [28, 22], back: [28, 22] },
    'Coxa Anterior': { front: [42, 55], back: null },
    'Coxa Posterior': { front: null, back: [42, 55] },
    Panturrilha: { front: null, back: [40, 80] },
    Tornozelo: { front: [40, 88], back: [40, 88] },
    Joelho: { front: [38, 68], back: null },
    Adutor: { front: [47, 52], back: null },
    Costas: { front: null, back: [50, 35] },
    Pé: { front: [38, 94], back: [38, 94] },
};

function normalizeHeatmapLocation(location: string): string {
    const normalized = location
        .toLowerCase()
        .replace(/\s*(direito|direita|esquerdo|esquerda)\s*/gi, '')
        .trim();
    const locationMap: Record<string, string> = {
        'coxa posterior': 'Coxa Posterior',
        'coxa anterior': 'Coxa Anterior',
        tornozelo: 'Tornozelo',
        joelho: 'Joelho',
        adutor: 'Adutor',
        panturrilha: 'Panturrilha',
        ombro: 'Ombro',
        pé: 'Pé',
        pe: 'Pé',
        face: 'Face',
        cabeça: 'Cabeça',
        cabeca: 'Cabeça',
        costas: 'Costas',
        tórax: 'Costas',
        torax: 'Costas',
        lombar: 'Costas',
    };
    return locationMap[normalized] || location;
}

function inferSideFromLocationText(location: string): 'Direito' | 'Esquerdo' | null {
    const l = location.toLowerCase();
    if (/\b(direito|direita)\b/.test(l)) return 'Direito';
    if (/\b(esquerdo|esquerda)\b/.test(l)) return 'Esquerdo';
    return null;
}

function effectiveInjurySide(inj: InjuryRecord): InjurySideKind {
    if (inj.side === 'Bilateral') return 'Bilateral';
    if (inj.side === 'Direito' || inj.side === 'Esquerdo') return inj.side;
    const fromText = inferSideFromLocationText(inj.location);
    if (fromText) return fromText;
    return inj.side === 'N/A' || !inj.side ? 'N/A' : inj.side;
}

function isLateralRegion(base: string, view: 'front' | 'back'): boolean {
    if (base === 'Cabeça' || base === 'Face' || base === 'Costas') return false;
    const frontLateral = new Set(['Ombro', 'Joelho', 'Tornozelo', 'Pé', 'Coxa Anterior', 'Adutor']);
    const backLateral = new Set(['Ombro', 'Tornozelo', 'Pé', 'Coxa Posterior', 'Panturrilha']);
    return view === 'front' ? frontLateral.has(base) : backLateral.has(base);
}

function anchorForRegion(
    base: string,
    view: 'front' | 'back',
    side: InjurySideKind
): [number, number] | null {
    const bp = HEATMAP_BODY_POINTS[base];
    if (!bp) return null;
    const c = view === 'front' ? bp.front : bp.back;
    if (!c) return null;
    const [xRef, y] = c;
    if (!isLateralRegion(base, view)) return [c[0], y];
    const xLeft = Math.min(xRef, 100 - xRef);
    const xRight = Math.max(xRef, 100 - xRef);
    if (side === 'Bilateral' || side === 'N/A') return [50, y];
    return side === 'Direito' ? [xLeft, y] : [xRight, y];
}

function outwardDirection(x: number, y: number): OutwardDir {
    if (x < 50) return 'left';
    if (x > 50) return 'right';
    if (y < 38) return 'up';
    return 'down';
}

function heatmapLabelForSide(base: string, side: InjurySideKind): string {
    if (side === 'Bilateral') return base;
    if (side === 'N/A') return base;
    return `${base} (${side})`;
}

interface HeatCalloutProps {
    x: number;
    y: number;
    outward: OutwardDir;
    regionLabel: string;
    count: number;
}

const HeatCallout: React.FC<HeatCalloutProps> = ({ x, y, outward, regionLabel, count }) => {
    const lineLen = 38;
    const stroke = '#ef4444';
    const countText = `${count} ${count === 1 ? 'lesão' : 'lesões'}`;

    const lineAndHead = (() => {
        switch (outward) {
            case 'left':
                return (
                    <>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
                            style={{ right: 0, width: lineLen, background: stroke }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
                            style={{
                                right: lineLen,
                                borderTop: '5px solid transparent',
                                borderBottom: '5px solid transparent',
                                borderRight: `7px solid ${stroke}`,
                            }}
                        />
                    </>
                );
            case 'right':
                return (
                    <>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
                            style={{ left: 0, width: lineLen, background: stroke }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
                            style={{
                                left: lineLen,
                                borderTop: '5px solid transparent',
                                borderBottom: '5px solid transparent',
                                borderLeft: `7px solid ${stroke}`,
                            }}
                        />
                    </>
                );
            case 'up':
                return (
                    <>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-0.5 rounded-full"
                            style={{ bottom: 0, height: lineLen, background: stroke }}
                        />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                                bottom: lineLen,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderBottom: `7px solid ${stroke}`,
                            }}
                        />
                    </>
                );
            default:
                return (
                    <>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-0.5 rounded-full"
                            style={{ top: 0, height: lineLen, background: stroke }}
                        />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                                top: lineLen,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: `7px solid ${stroke}`,
                            }}
                        />
                    </>
                );
        }
    })();

    const labelBlock = (
        <div
            className="absolute z-[11] flex flex-col gap-0.5"
            style={{
                textAlign: outward === 'left' ? 'right' : outward === 'right' ? 'left' : 'center',
                ...(outward === 'left'
                    ? { right: lineLen + 10, top: '50%', transform: 'translateY(-50%)' }
                    : outward === 'right'
                      ? { left: lineLen + 10, top: '50%', transform: 'translateY(-50%)' }
                      : outward === 'up'
                        ? { bottom: lineLen + 10, left: '50%', transform: 'translateX(-50%)' }
                        : { top: lineLen + 10, left: '50%', transform: 'translateX(-50%)' }),
            }}
        >
            <span
                className="text-[11px] font-black leading-tight whitespace-nowrap"
                style={{ color: '#facc15', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
            >
                {regionLabel}
            </span>
            <span
                className="text-[10px] font-bold leading-tight whitespace-nowrap"
                style={{ color: 'rgba(248, 113, 113, 0.85)', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
                {countText}
            </span>
        </div>
    );

    return (
        <div
            className="absolute pointer-events-none z-10"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                width: 1,
                height: 1,
            }}
        >
            <div className="absolute inset-0 w-px h-px">
                {lineAndHead}
                {labelBlock}
            </div>
        </div>
    );
};

function buildHeatmapSpots(injuries: InjuryRecord[], view: 'front' | 'back'): HeatCalloutProps[] {
    const tallies = new Map<string, { base: string; side: InjurySideKind; count: number }>();

    injuries.forEach(inj => {
        const base = normalizeHeatmapLocation(inj.location);
        const bp = HEATMAP_BODY_POINTS[base];
        if (!bp) return;
        const coords = view === 'front' ? bp.front : bp.back;
        if (!coords) return;

        const side = effectiveInjurySide(inj);
        const key = `${base}::${side}`;
        const prev = tallies.get(key);
        if (prev) prev.count += 1;
        else tallies.set(key, { base, side, count: 1 });
    });

    const spots: HeatCalloutProps[] = [];
    tallies.forEach(({ base, side, count }) => {
        const anchor = anchorForRegion(base, view, side);
        if (!anchor) return;
        const [ax, ay] = anchor;
        spots.push({
            x: ax,
            y: ay,
            outward: outwardDirection(ax, ay),
            regionLabel: heatmapLabelForSide(base, side),
            count,
        });
    });

    spots.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
    return spots;
}

const MuscleBodyMap: React.FC<InjuryBodyMapProps> = ({ injuries }) => {
    const [view, setView] = useState<'front' | 'back'>('front');

    const spotsFront = useMemo(() => buildHeatmapSpots(injuries, 'front'), [injuries]);
    const spotsBack = useMemo(() => buildHeatmapSpots(injuries, 'back'), [injuries]);

    const toggleView = () => {
        setView(prev => (prev === 'front' ? 'back' : 'front'));
    };

    return (
        <div className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-center group perspective-1000">
            <p className="absolute top-3 left-3 z-30 text-[10px] sm:text-xs text-white font-black uppercase tracking-widest max-w-[min(100%,220px)] leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                Frequência de lesões por região
            </p>
            <button
                type="button"
                onClick={toggleView}
                className="absolute top-3 right-3 z-30 bg-zinc-900 text-white p-2 shadow-lg border border-zinc-700 rounded-xl transition-all hover:bg-zinc-800 flex items-center gap-2 text-xs font-bold uppercase"
            >
                <Rotate3d size={18} className="text-[#10b981]" />
                {view === 'front' ? 'Costas' : 'Frente'}
            </button>
            <div className={`relative w-[300px] h-[600px] scale-100 md:scale-110 overflow-visible`}>
                <div
                    className={`absolute inset-0 flex justify-center transition-opacity duration-500 ${view === 'back' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="relative w-full h-full">
                        <img
                            src="/anatomy-front.png.png"
                            alt="Corpo humano - Vista frontal anatômica"
                            className="w-full h-full object-contain filter brightness-90 contrast-105"
                            onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://upload.wikimedia.org/wikipedia/commons/0/03/Gray1217.png';
                                target.onerror = () => {
                                    target.src = '/anatomy-front.svg';
                                };
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
                        <div className="absolute inset-0 w-full h-full overflow-visible">
                            {spotsFront.map((s, idx) => (
                                <HeatCallout key={`f-${s.regionLabel}-${s.x}-${s.y}-${idx}`} {...s} />
                            ))}
                        </div>
                    </div>
                </div>
                <div
                    className={`absolute inset-0 flex justify-center transition-opacity duration-500 ${view === 'front' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="relative w-full h-full">
                        <img
                            src="/anatomy-back.png.png"
                            alt="Corpo humano - Vista posterior anatômica"
                            className="w-full h-full object-contain filter brightness-90 contrast-105"
                            onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Gray1218.png';
                                target.onerror = () => {
                                    target.src = '/anatomy-back.svg';
                                };
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
                        <div className="absolute inset-0 w-full h-full overflow-visible">
                            {spotsBack.map((s, idx) => (
                                <HeatCallout key={`b-${s.regionLabel}-${s.x}-${s.y}-${idx}`} {...s} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
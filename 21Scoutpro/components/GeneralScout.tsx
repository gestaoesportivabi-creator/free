import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Filter, Trophy, AlertCircle, ShieldAlert, Gauge, Activity, PieChart as PieChartIcon, BarChart3, Clock, Target, Goal, BookOpen, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { SportConfig, MatchRecord, Player } from '../types';
import { ExpandableCard } from './ExpandableCard';

interface GeneralScoutProps {
  config: SportConfig;
  matches: MatchRecord[];
  players?: Player[];
}

/** Objeto final do quarteto para exibição (Análise de Quarteto de Linha) */
export interface QuartetDisplay {
  atletas: Array<{ id: string; apelido: string; foto_url: string }>;
  tempo_total: number;
  gols_feitos: number;
  gols_tomados: number;
  metodo_gol_mais_recorrente: string;
  metodo_gol_tomado_mais_recorrente: string;
  chutes_dentro: number;
  chutes_fora: number;
  passes_certos: number;
  passes_errados: number;
  faltas_sofridas: number;
  faltas_feitas: number;
  desarmes_com_posse: number;
  desarmes_sem_posse: number;
  posse_media: number;
  ipq_total: number;
  ipq_ofensivo: number;
  ipq_defensivo: number;
  _raw?: unknown;
  _min?: number;
}

const MONTHS = [
  { value: 'Todos', label: 'Todos os Meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

export const GeneralScout: React.FC<GeneralScoutProps> = ({ config, matches, players = [] }) => {
  const [compFilter, setCompFilter] = useState<string>('Todas');
  const [opponentFilter, setOpponentFilter] = useState<string>('Todos');
  const [locationFilter, setLocationFilter] = useState<string>('Todos');
  const [monthFilter, setMonthFilter] = useState<string>('Todos');

  // Filtros responsivos: quando competição muda, resetar outros filtros
  const handleCompFilterChange = (value: string) => {
    setCompFilter(value);
    setMonthFilter('Todos');
    setOpponentFilter('Todos');
  };

  // Calcular opções de filtros baseado na competição selecionada
  const availableMonths = useMemo(() => {
    if (compFilter === 'Todas') {
      return MONTHS;
    }
    const compMatches = matches.filter(m => m.competition === compFilter && m.teamStats);
    const monthsSet = new Set<string>();
    compMatches.forEach(m => {
      const matchDate = new Date(m.date);
      monthsSet.add(matchDate.getMonth().toString());
    });
    return MONTHS.filter(m => m.value === 'Todos' || monthsSet.has(m.value));
  }, [compFilter, matches]);

  const availableOpponents = useMemo(() => {
    if (compFilter === 'Todas' && monthFilter === 'Todos') {
      return Array.from(new Set(matches.map(m => m.opponent)));
    }
    const filtered = matches.filter(m => {
      if (!m.teamStats) return false;
      if (compFilter !== 'Todas' && m.competition !== compFilter) return false;
      if (monthFilter !== 'Todos') {
        const matchDate = new Date(m.date);
        if (matchDate.getMonth().toString() !== monthFilter) return false;
      }
      return true;
    });
    return Array.from(new Set(filtered.map(m => m.opponent)));
  }, [compFilter, monthFilter, matches]);

  // BLUE COLOR PALETTE
  const COLORS = {
    blue: '#00f0ff',    // Cyan Blue (escudo)
    blueLight: '#60a5fa', // Light Blue
    blueMedium: '#3b82f6', // Medium Blue
    blueDark: '#2563eb', // Dark Blue
    blueDarker: '#1e40af', // Darker Blue
    blueCyan: '#0ea5e9', // Cyan Blue
    slate: '#71717a',   // Zinc
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Validar se o match tem estrutura válida
      if (!m || !m.teamStats) {
        console.warn('⚠️ Match inválido ignorado:', m);
        return false;
      }
      
      const matchDate = new Date(m.date);
      if (compFilter !== 'Todas' && m.competition !== compFilter) return false;
      if (monthFilter !== 'Todos' && matchDate.getMonth().toString() !== monthFilter) return false;
      if (opponentFilter !== 'Todos' && m.opponent !== opponentFilter) return false;
      if (locationFilter !== 'Todos' && m.location !== locationFilter) return false;
      return true;
    });
  }, [compFilter, opponentFilter, locationFilter, monthFilter, matches]);

  // KPIs
  const stats = useMemo(() => {
    const acc = filteredMatches.reduce((acc, curr) => {
      // Validar se teamStats existe antes de acessar
      if (!curr || !curr.teamStats) {
        console.warn('⚠️ Match sem teamStats encontrado:', curr);
        return acc;
      }

      acc.totalGames += 1;
      acc.wins += curr.result === 'Vitória' ? 1 : 0;
      acc.losses += curr.result === 'Derrota' ? 1 : 0;
      acc.draws += curr.result === 'Empate' ? 1 : 0;
      acc.totalMinutes += curr.teamStats.minutesPlayed || 0;
      acc.goalsConceded += curr.teamStats.goalsConceded || 0;
      acc.goalsScored += curr.teamStats.goals || 0;
      
      acc.passesCorrect += curr.teamStats.passesCorrect || 0;
      acc.passesWrong += curr.teamStats.passesWrong || 0;
      acc.shotsOn += curr.teamStats.shotsOnTarget || 0;
      acc.shotsOff += curr.teamStats.shotsOffTarget || 0;
      
      acc.wrongPassesTransition += curr.teamStats.wrongPassesTransition || 0;
      acc.tacklesCounterAttack += curr.teamStats.tacklesCounterAttack || 0;
      acc.tacklesWithBall += curr.teamStats.tacklesWithBall || 0;
      acc.tacklesWithoutBall += curr.teamStats.tacklesWithoutBall || 0;
      
      acc.tacklesTotal += ((curr.teamStats.tacklesWithBall || 0) + (curr.teamStats.tacklesWithoutBall || 0));
      
      acc.yellowCards += curr.teamStats.yellowCards || 0;
      acc.redCards += curr.teamStats.redCards || 0;

      acc.goalsScoredOpen += curr.teamStats.goalsScoredOpenPlay || 0;
      acc.goalsScoredSet += curr.teamStats.goalsScoredSetPiece || 0;
      
      acc.goalsConcededOpen += curr.teamStats.goalsConcededOpenPlay || 0;
      acc.goalsConcededSet += curr.teamStats.goalsConcededSetPiece || 0;

      // Agregar métodos de gols
      if (curr.teamStats.goalMethodsScored) {
        Object.entries(curr.teamStats.goalMethodsScored).forEach(([method, count]) => {
          acc.goalMethodsScored[method] = (acc.goalMethodsScored[method] || 0) + count;
        });
      }
      if (curr.teamStats.goalMethodsConceded) {
        Object.entries(curr.teamStats.goalMethodsConceded).forEach(([method, count]) => {
          acc.goalMethodsConceded[method] = (acc.goalMethodsConceded[method] || 0) + count;
        });
      }
      
      return acc;
    }, {
      totalGames: 0, wins: 0, losses: 0, draws: 0, totalMinutes: 0, goalsConceded: 0, goalsScored: 0,
      passesCorrect: 0, passesWrong: 0, shotsOn: 0, shotsOff: 0,
      wrongPassesTransition: 0, tacklesCounterAttack: 0, tacklesWithBall: 0, tacklesWithoutBall: 0, tacklesTotal: 0,
      yellowCards: 0, redCards: 0,
      goalsScoredOpen: 0, goalsScoredSet: 0,
      goalsConcededOpen: 0, goalsConcededSet: 0,
      goalMethodsScored: {} as Record<string, number>,
      goalMethodsConceded: {} as Record<string, number>
    });

    return {
      ...acc,
      avgGoalsConceded: acc.totalGames > 0 ? (acc.goalsConceded / acc.totalGames).toFixed(1) : 0,
      avgGoalsScored: acc.totalGames > 0 ? (acc.goalsScored / acc.totalGames).toFixed(1) : 0,
      avgTacklesPerGame: acc.totalGames > 0 ? (acc.tacklesTotal / acc.totalGames).toFixed(1) : 0,
      goalMethodsScored: acc.goalMethodsScored,
      goalMethodsConceded: acc.goalMethodsConceded
    };
  }, [filteredMatches]);

  // Função auxiliar para converter tempo (ex: "12:43" ou "12:43 (1T)") em minutos totais
  const parseTimeToMinutes = (timeStr: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Remover período se existir (ex: "12:43 (1T)" -> "12:43")
    const cleanTime = timeStr.split('(')[0].trim();
    
    // Extrair minutos e segundos (formato MM:SS ou M:SS)
    const parts = cleanTime.split(':');
    if (parts.length !== 2) {
      // Tentar como número simples (apenas minutos)
      const minutesOnly = parseInt(cleanTime, 10);
      if (!isNaN(minutesOnly)) {
        // Se tem período, ajustar; senão, assumir primeiro tempo
        if (timeStr.includes('(2T)') || timeStr.includes('2T')) {
          return minutesOnly + 20; // Segundo tempo começa em 20 minutos (futsal)
        } else if (timeStr.includes('(ET)') || timeStr.includes('ET')) {
          return minutesOnly + 40; // Prorrogação começa em 40 minutos
        }
        return minutesOnly; // Primeiro tempo
      }
      return null;
    }
    
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    if (isNaN(minutes)) return null;
    
    // Em futsal: 1T = 0-20min, 2T = 20-40min
    // Se o tempo contém período, ajustar
    if (timeStr.includes('(1T)') || timeStr.includes('1T')) {
      // Primeiro tempo: minutos diretos (0-20)
      return minutes;
    } else if (timeStr.includes('(2T)') || timeStr.includes('2T')) {
      // Segundo tempo: minutos + 20 (20-40)
      return minutes + 20;
    } else if (timeStr.includes('(ET)') || timeStr.includes('ET')) {
      // Prorrogação: minutos + 40 (40+)
      return minutes + 40;
    }
    
    // Se não tem período, usar heurística baseada no valor dos minutos
    // Em futsal, se minutos > 20, provavelmente é segundo tempo
    if (minutes > 20 && minutes <= 40) {
      return minutes; // Já está no segundo tempo
    } else if (minutes > 40) {
      return minutes; // Prorrogação ou erro, mas manter o valor
    }
    
    // Primeiro tempo (0-20)
    return minutes;
  };

  // Time Period Data - Faixa de 00:00 a 50:00 dividida de 5 em 5 minutos
  const timePeriodData = useMemo(() => {
    // Criar períodos de 5 em 5 minutos de 00:00 a 50:00
    const periods: string[] = [];
    for (let i = 0; i <= 50; i += 5) {
      const start = `${i.toString().padStart(2, '0')}:00`;
      const end = i === 50 ? '50:00' : `${(i + 5).toString().padStart(2, '0')}:00`;
      periods.push(`${start}-${end}`);
    }
    
    // Contar gols reais por período
    const scoredCounts = new Array(periods.length).fill(0);
    const concededCounts = new Array(periods.length).fill(0);
    
    // Processar gols feitos
    filteredMatches.forEach(match => {
      if (!match.teamStats || !match.teamStats.goalTimes) return;
      
      match.teamStats.goalTimes.forEach(goalTime => {
        const minutes = parseTimeToMinutes(goalTime.time);
        if (minutes !== null && minutes >= 0 && minutes <= 50) {
          // Encontrar em qual período de 5 minutos o gol cai
          // Períodos: 0-5 (índice 0), 5-10 (índice 1), 10-15 (índice 2), etc.
          // Para minutos 10-14, deve cair no período 10:00-15:00 (índice 2)
          const periodIndex = Math.floor(minutes / 5);
          if (periodIndex >= 0 && periodIndex < periods.length) {
            scoredCounts[periodIndex]++;
            // Debug log
            console.log(`⚽ Gol feito: ${goalTime.time} → ${minutes}min → Período ${periodIndex} (${periods[periodIndex]})`);
          }
        } else {
          console.warn(`⚠️ Tempo de gol inválido: ${goalTime.time} → ${minutes}min`);
        }
      });
    });
    
    // Processar gols tomados
    filteredMatches.forEach(match => {
      if (!match.teamStats || !match.teamStats.goalsConcededTimes) return;
      
      match.teamStats.goalsConcededTimes.forEach(goalConceded => {
        const minutes = parseTimeToMinutes(goalConceded.time);
        if (minutes !== null && minutes >= 0 && minutes <= 50) {
          // Encontrar em qual período de 5 minutos o gol cai
          const periodIndex = Math.floor(minutes / 5);
          if (periodIndex >= 0 && periodIndex < periods.length) {
            concededCounts[periodIndex]++;
            // Debug log
            console.log(`🚫 Gol tomado: ${goalConceded.time} → ${minutes}min → Período ${periodIndex} (${periods[periodIndex]})`);
          }
        } else {
          console.warn(`⚠️ Tempo de gol tomado inválido: ${goalConceded.time} → ${minutes}min`);
        }
      });
    });
    
    // Criar distribuição com valores reais
    const scoredDist = periods.map((p, i) => ({
        period: p,
        value: scoredCounts[i]
    }));
    
    const concededDist = periods.map((p, i) => ({
        period: p,
        value: concededCounts[i]
    }));

    // Calcular total de gols para porcentagem
    const totalScored = scoredCounts.reduce((sum, count) => sum + count, 0);
    const totalConceded = concededCounts.reduce((sum, count) => sum + count, 0);

    // Encontrar período com mais gols
    const maxScoredPeriod = scoredDist.reduce((max, curr) => curr.value > max.value ? curr : max, scoredDist[0]);
    const maxConcededPeriod = concededDist.reduce((max, curr) => curr.value > max.value ? curr : max, concededDist[0]);
    
    const scoredPercentage = totalScored > 0 
      ? ((maxScoredPeriod.value / totalScored) * 100).toFixed(2)
      : '0.00';
    const concededPercentage = totalConceded > 0
      ? ((maxConcededPeriod.value / totalConceded) * 100).toFixed(2)
      : '0.00';

    return { 
      scoredDist, 
      concededDist,
      maxScoredPeriod: { period: maxScoredPeriod.period, percentage: scoredPercentage },
      maxConcededPeriod: { period: maxConcededPeriod.period, percentage: concededPercentage }
    };
  }, [filteredMatches]);

  const chartData = useMemo(() => {
    return filteredMatches.map(match => ({
      name: match.opponent,
      wrongPassesTransition: match.teamStats.wrongPassesTransition,
      tacklesCounterAttack: match.teamStats.tacklesCounterAttack,
      tacklesWithBall: match.teamStats.tacklesWithBall,
      tacklesWithoutBall: match.teamStats.tacklesWithoutBall,
      passesCorrect: match.teamStats.passesCorrect,
      passesWrong: match.teamStats.passesWrong,
      shotsOn: match.teamStats.shotsOnTarget,
      shotsOff: match.teamStats.shotsOffTarget,
      result: match.result
    }));
  }, [filteredMatches]);
  
  // Dados de métodos de gol (usando goalMethodsScored/Conceded)
  const goalMethodsScoredData = useMemo(() => {
    const methods = stats.goalMethodsScored || {};
    const total = Object.values(methods).reduce((sum, val) => sum + val, 0);
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.value - a.value);
  }, [stats.goalMethodsScored]);

  const goalMethodsConcededData = useMemo(() => {
    const methods = stats.goalMethodsConceded || {};
    const total = Object.values(methods).reduce((sum, val) => sum + val, 0);
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.value - a.value);
  }, [stats.goalMethodsConceded]);

  // Fallback para dados antigos (Bola Rolando/Bola Parada)
  const originScoredData = goalMethodsScoredData.length > 0 
    ? goalMethodsScoredData
    : [
        { name: 'Bola Rolando', value: stats.goalsScoredOpen, percentage: '0.0' },
        { name: 'Bola Parada', value: stats.goalsScoredSet, percentage: '0.0' },
      ];
  
  const originConcededData = goalMethodsConcededData.length > 0
    ? goalMethodsConcededData
    : [
        { name: 'Bola Rolando', value: stats.goalsConcededOpen, percentage: '0.0' },
        { name: 'Bola Parada', value: stats.goalsConcededSet, percentage: '0.0' },
      ];

  // --- Análise de Quartetos de Linha (IPQ – Índice de Performance do Quarteto) ---
  const QUARTET_MATCH_DURATION_SEC = 40 * 60; // 40 min
  const QUARTET_PERIOD_SEC = 20 * 60; // 20 min
  const MIN_QUARTET_MINUTES = 3; // Regra mínima: >= 3 min juntos

  const parseEventTimeToSeconds = (timeStr: string, period: '1T' | '2T'): number => {
    const parts = timeStr.trim().split(':');
    const mm = parseInt(parts[0], 10) || 0;
    const ss = parseInt(parts[1], 10) || 0;
    const sec = mm * 60 + ss;
    return period === '1T' ? sec : QUARTET_PERIOD_SEC + sec;
  };

  const getQuartetKey = (ids: string[]): string => [...ids].map(id => String(id).trim()).sort().join(',');

  type QuartetAgg = {
    playerIds: string[];
    tempo_total_seg: number;
    gols_feitos: number;
    gols_tomados: number;
    metodo_gol_mais_recorrente: string;
    metodo_gol_tomado_mais_recorrente: string;
    chutes_dentro: number;
    chutes_fora: number;
    passes_certos: number;
    passes_errados: number;
    faltas_sofridas: number;
    faltas_feitas: number;
    desarmes_com_posse: number;
    desarmes_sem_posse: number;
    posse_seg_com: number;
    posse_seg_sem: number;
    goalMethodsScored: Record<string, number>;
    goalMethodsConceded: Record<string, number>;
  };

  const quartetAnalysis = useMemo(() => {
    const agg = new Map<string, QuartetAgg>();

    const ensureQuartet = (key: string, playerIds: string[]) => {
      if (!agg.has(key)) {
        agg.set(key, {
          playerIds: [...playerIds],
          tempo_total_seg: 0,
          gols_feitos: 0,
          gols_tomados: 0,
          metodo_gol_mais_recorrente: '',
          metodo_gol_tomado_mais_recorrente: '',
          chutes_dentro: 0,
          chutes_fora: 0,
          passes_certos: 0,
          passes_errados: 0,
          faltas_sofridas: 0,
          faltas_feitas: 0,
          desarmes_com_posse: 0,
          desarmes_sem_posse: 0,
          posse_seg_com: 0,
          posse_seg_sem: 0,
          goalMethodsScored: {},
          goalMethodsConceded: {},
        });
      }
    };

    filteredMatches.forEach(match => {
      if (!match.lineup?.players || match.lineup.players.length < 5) return;
      const lineup = match.lineup.players.map(id => String(id).trim());
      const gkId = lineup[0];
      let currentQuartet = lineup.slice(1).sort();
      const subs = (match.substitutionHistory || []).slice().sort((a, b) => {
        const ta = a.period === '1T' ? a.time : QUARTET_PERIOD_SEC + a.time;
        const tb = b.period === '1T' ? b.time : QUARTET_PERIOD_SEC + b.time;
        return ta - tb;
      });

      const segments: { start: number; end: number; quartet: string[] }[] = [];
      let lastT = 0;
      for (const sub of subs) {
        const t = sub.period === '1T' ? sub.time : QUARTET_PERIOD_SEC + sub.time;
        if (t <= lastT) continue;
        const outId = String(sub.playerOutId).trim();
        if (outId === gkId) continue;
        if (!currentQuartet.includes(outId)) continue;
        segments.push({ start: lastT, end: t, quartet: [...currentQuartet] });
        currentQuartet = currentQuartet.map(id => (id === outId ? String(sub.playerInId).trim() : id)).sort();
        lastT = t;
      }
      segments.push({ start: lastT, end: QUARTET_MATCH_DURATION_SEC, quartet: currentQuartet });

      const matchWith = match.possessionSecondsWith ?? 0;
      const matchWithout = match.possessionSecondsWithout ?? 0;
      segments.forEach(seg => {
        const key = getQuartetKey(seg.quartet);
        ensureQuartet(key, seg.quartet);
        const rec = agg.get(key)!;
        const segDuration = seg.end - seg.start;
        rec.tempo_total_seg += segDuration;
        const fraction = segDuration / QUARTET_MATCH_DURATION_SEC;
        rec.posse_seg_com += fraction * matchWith;
        rec.posse_seg_sem += fraction * matchWithout;
      });

      const log = match.postMatchEventLog || [];
      log.forEach(ev => {
        const eventSec = parseEventTimeToSeconds(ev.time, ev.period);
        const seg = segments.find(s => eventSec >= s.start && eventSec < s.end);
        if (!seg) return;
        const key = getQuartetKey(seg.quartet);
        const rec = agg.get(key);
        if (!rec) return;
        const inQuartet = seg.quartet.includes(String(ev.playerId).trim());

        if (ev.action === 'goal') {
          if (ev.isOpponentGoal) {
            rec.gols_tomados += 1;
            const method = ev.goalMethod || ev.subtipo || '—';
            rec.goalMethodsConceded[method] = (rec.goalMethodsConceded[method] || 0) + 1;
          } else {
            rec.gols_feitos += 1;
            const method = ev.goalMethod || ev.subtipo || '—';
            rec.goalMethodsScored[method] = (rec.goalMethodsScored[method] || 0) + 1;
          }
        } else if (ev.action === 'passCorrect' && inQuartet) rec.passes_certos += 1;
        else if (ev.action === 'passWrong' && inQuartet) rec.passes_errados += 1;
        else if (ev.action === 'shotOn' && inQuartet) rec.chutes_dentro += 1;
        else if (ev.action === 'shotOff' && inQuartet) rec.chutes_fora += 1;
        else if (ev.action === 'tackleWithBall' && inQuartet) rec.desarmes_com_posse += 1;
        else if ((ev.action === 'tackleWithoutBall' || ev.action === 'tackleCounter') && inQuartet) rec.desarmes_sem_posse += 1;
        else if (ev.action === 'falta') {
          if (ev.foulTeam === 'for' && inQuartet) rec.faltas_feitas += 1;
          if (ev.foulTeam === 'against') rec.faltas_sofridas += 1;
        }
      });
    });

    const tempoMin = (q: QuartetAgg) => q.tempo_total_seg / 60;
    const list = Array.from(agg.values()).filter(q => tempoMin(q) >= MIN_QUARTET_MINUTES);

    if (list.length === 0) {
      return { highPerformance: [], lowPerformance: [], players };
    }

    // IPQ Ofensivo bruto = (gols*4 + chutes_dentro*1.5 + passes_certos*0.05 + desarmes_com_posse*1) / tempo_min
    const ipqOfensivoBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      if (min <= 0) return 0;
      return ((q.gols_feitos * 4) + (q.chutes_dentro * 1.5) + (q.passes_certos * 0.05) + (q.desarmes_com_posse * 1)) / min;
    };
    // IPQ Defensivo bruto = (gols_tomados*-4 + faltas_feitas*-1 + passes_errados*-0.05 + chutes_fora*-0.5) / tempo_min → exibição = bruto * -1
    const ipqDefensivoBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      if (min <= 0) return 0;
      return ((q.gols_tomados * -4) + (q.faltas_feitas * -1) + (q.passes_errados * -0.05) + (q.chutes_fora * -0.5)) / min;
    };
    // IPQ Total bruto = ipq_ofensivo + ipq_defensivo + (faltas_sofridas*0.5 / tempo_min)
    const ipqTotalBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      return ipqOfensivoBruto(q) + ipqDefensivoBruto(q) + (min > 0 ? (q.faltas_sofridas * 0.5) / min : 0);
    };

    list.sort((a, b) => ipqTotalBruto(b) - ipqTotalBruto(a));

    const ofensivoValues = list.map(ipqOfensivoBruto);
    const defensivoExibicaoValues = list.map(q => ipqDefensivoBruto(q) * -1);
    const totalValues = list.map(ipqTotalBruto);

    const normalize = (vals: number[]) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min;
      return vals.map(v => range === 0 ? 100 : ((v - min) / range) * 100);
    };

    const ipqOfensivoNorm = normalize(ofensivoValues);
    const ipqDefensivoNorm = normalize(defensivoExibicaoValues);
    const ipqTotalNorm = normalize(totalValues);

    const metodoMaisRecorrente = (m: Record<string, number>) => {
      const ent = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
      return ent ? ent[0] : '—';
    };

    const buildQuartet = (q: QuartetAgg, idx: number): QuartetDisplay => {
      const min = tempoMin(q);
      const totalPosse = q.posse_seg_com + q.posse_seg_sem;
      const posse_media = totalPosse > 0 ? Math.round((q.posse_seg_com / totalPosse) * 100) : 0;
      return {
        atletas: q.playerIds.map(id => {
          const p = players.find(x => String(x.id).trim() === String(id).trim());
          return {
            id: String(id).trim(),
            apelido: p?.nickname?.trim() || p?.name?.trim() || '—',
            foto_url: p?.photoUrl || '',
          };
        }),
        tempo_total: q.tempo_total_seg,
        gols_feitos: q.gols_feitos,
        gols_tomados: q.gols_tomados,
        metodo_gol_mais_recorrente: metodoMaisRecorrente(q.goalMethodsScored),
        metodo_gol_tomado_mais_recorrente: metodoMaisRecorrente(q.goalMethodsConceded),
        chutes_dentro: q.chutes_dentro,
        chutes_fora: q.chutes_fora,
        passes_certos: q.passes_certos,
        passes_errados: q.passes_errados,
        faltas_sofridas: q.faltas_sofridas,
        faltas_feitas: q.faltas_feitas,
        desarmes_com_posse: q.desarmes_com_posse,
        desarmes_sem_posse: q.desarmes_sem_posse,
        posse_media,
        ipq_total: Math.round(ipqTotalNorm[idx]),
        ipq_ofensivo: Math.round(ipqOfensivoNorm[idx]),
        ipq_defensivo: Math.round(ipqDefensivoNorm[idx]),
        _raw: q,
        _min: min,
      };
    };

    const highPerformance = list.slice(0, 3).map((q, i) => buildQuartet(q, i));
    const lowPerformance = list.slice(-3).reverse().map((q, i) => buildQuartet(q, list.length - 1 - i));

    return { highPerformance, lowPerformance, players };
  }, [filteredMatches, players]);

  // Cores para gráficos de rosca (expandir conforme necessário) - Tons de Azul
  const PIE_COLORS = [COLORS.blue, COLORS.blueLight, COLORS.blueMedium, COLORS.blueDark, COLORS.blueDarker, COLORS.blueCyan, COLORS.slate];
  const PIE_COLORS_CONCEDED = [COLORS.blueDarker, COLORS.blueDark, COLORS.blueMedium, COLORS.blue, COLORS.blueLight, COLORS.blueCyan, COLORS.slate];

  const TACKLE_TARGET = 60;
  const currentTackles = parseFloat(stats.avgTacklesPerGame.toString());
  const percentage = Math.min((currentTackles / TACKLE_TARGET) * 100, 100);
  const percentageDisplay = Math.round((currentTackles / TACKLE_TARGET) * 100);
  
  // Logic for Speedometer Color - Tons de Azul
  let gaugeColor = COLORS.blue;
  if (percentageDisplay < 75) gaugeColor = '#ef4444'; // Red (mantido para erro)
  else if (percentageDisplay <= 90) gaugeColor = COLORS.blueDark; // Dark Blue
  else if (percentageDisplay <= 99) gaugeColor = COLORS.blueMedium; // Medium Blue
  else gaugeColor = COLORS.blue; // Cyan Blue (>= 100%)

  const gaugeData = [
    { name: 'Conquistado', value: percentage },
    { name: 'Restante', value: 100 - percentage }
  ];

  // Posse de bola (dados do jogo após coleta encerrada: possessionSecondsWith / possessionSecondsWithout)
  const possessionDonutData = useMemo(() => {
    let totalWith = 0;
    let totalWithout = 0;
    filteredMatches.forEach(m => {
      const w = m.possessionSecondsWith ?? 0;
      const wo = m.possessionSecondsWithout ?? 0;
      totalWith += w;
      totalWithout += wo;
    });
    const total = totalWith + totalWithout;
    if (total <= 0) return null;
    const pctUs = (totalWith / total) * 100;
    const pctOpp = (totalWithout / total) * 100;
    return [
      { name: 'Nossa equipe', value: Math.round(pctUs * 10) / 10, fill: COLORS.blue },
      { name: 'Adversário', value: Math.round(pctOpp * 10) / 10, fill: COLORS.slate }
    ];
  }, [filteredMatches]);

  const hasPossessionData = useMemo(() => 
    filteredMatches.some(m => (m.possessionSecondsWith ?? 0) + (m.possessionSecondsWithout ?? 0) > 0),
    [filteredMatches]
  );

  // Styles
  const tooltipStyle = { backgroundColor: '#000', borderColor: '#333', color: '#fff', fontFamily: 'Poppins', borderRadius: '8px', fontSize: '14px' };
  const axisStyle = { fontSize: 12, fontFamily: 'Poppins', fill: '#a1a1aa', fontWeight: 'bold' };
  const labelStyle = { fill: '#fff', fontSize: 12, fontWeight: 'bold', fontFamily: 'Poppins' };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Control Bar - Black Piano */}
      <div className="bg-black p-5 rounded-3xl border border-zinc-900 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-end">
        <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide mb-1">
            <Filter className="text-[#00f0ff]" size={16} /> Filtros de Dados
            </h2>
            <p className="text-xs text-zinc-500 font-bold">Selecione os parâmetros para análise.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <Select 
            value={compFilter} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCompFilterChange(e.target.value)}
            options={[{value: 'Todas', label: 'Todas Competições'}, ...Array.from(new Set(matches.map(m => m.competition).filter(Boolean))).map(comp => ({value: comp, label: comp}))]}
          />
           <Select 
            value={monthFilter} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMonthFilter(e.target.value)}
            options={availableMonths.map(m => ({value: m.value, label: m.label}))}
          />
          <Select 
            value={opponentFilter} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOpponentFilter(e.target.value)}
            options={[{value: 'Todos', label: 'Todos Adversários'}, ...availableOpponents.map(op => ({value: op, label: op}))]}
          />
          <Select 
            value={locationFilter} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocationFilter(e.target.value)}
            options={[{value: 'Todos', label: 'Todos Locais'}, {value: 'Mandante', label: 'Mandante'}, {value: 'Visitante', label: 'Visitante'}]}
          />
        </div>
      </div>

      {/* KPI Cards - Shaded Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total de Jogos" value={stats.totalGames} icon={Trophy} color="text-[#00f0ff]" bg="bg-[#00f0ff]/10 border-[#00f0ff]/20" />
        <KPICard title="Vitórias" value={stats.wins} icon={Trophy} color="text-[#60a5fa]" bg="bg-[#60a5fa]/10 border-[#60a5fa]/20" />
        <KPICard title="Derrotas" value={stats.losses} icon={AlertCircle} color="text-[#2563eb]" bg="bg-[#2563eb]/10 border-[#2563eb]/20" />
        <KPICard title="Empates" value={stats.draws} icon={Flag} color="text-[#3b82f6]" bg="bg-[#3b82f6]/10 border-[#3b82f6]/20" />
        
        <KPICard title="Gols Feitos (Méd)" value={stats.avgGoalsScored} icon={Goal} color="text-[#60a5fa]" bg="bg-[#60a5fa]/10 border-[#60a5fa]/20" />
        <KPICard title="Gols Sofridos (Méd)" value={stats.avgGoalsConceded} icon={ShieldAlert} color="text-[#2563eb]" bg="bg-[#2563eb]/10 border-[#2563eb]/20" />
        
        {/* Cards de porcentagem de tempo que mais é feito/tomado gol */}
        <KPICard 
          title="Período Mais Produtivo" 
          value={`${timePeriodData.maxScoredPeriod.percentage}%`} 
          subtitle={`${timePeriodData.maxScoredPeriod.period}`}
          icon={Clock} 
          color="text-[#60a5fa]" 
          bg="bg-[#60a5fa]/10 border-[#60a5fa]/20" 
        />
        <KPICard 
          title="Período Mais Vulnerável" 
          value={`${timePeriodData.maxConcededPeriod.percentage}%`} 
          subtitle={`${timePeriodData.maxConcededPeriod.period}`}
          icon={ShieldAlert} 
          color="text-[#2563eb]" 
          bg="bg-[#2563eb]/10 border-[#2563eb]/20" 
        />
      </div>

       {/* Meta de Desarmes + Posse de Bola (lado a lado) */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meta de Desarmes por Jogo - Speedometer */}
            <ExpandableCard noPadding headerColor="text-[#ccff00]">
                <div className="h-48 w-full flex flex-col md:flex-row items-center justify-between px-8 py-4 gap-8 bg-zinc-950/50">
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                             <Gauge size={32} className="text-[#00f0ff]" />
                             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Meta de Desarmes por Jogo</h2>
                         </div>
                         <p className="text-zinc-500 font-bold text-sm max-w-md">
                             Monitoramento em tempo real da performance defensiva em relação ao objetivo estipulado pela comissão técnica.
                         </p>
                    </div>

                    <div className="flex items-center gap-12 flex-1 justify-end">
                        <div className="text-right">
                             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Resultado Atual</p>
                             <div className="flex items-baseline justify-end gap-1">
                                <p className={`text-5xl font-black tracking-tighter`} style={{ color: gaugeColor }}>
                                    {stats.avgTacklesPerGame}
                                </p>
                             </div>
                        </div>

                        <div className="h-32 w-64 relative pb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="80%" 
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius="75%"
                                        outerRadius="100%"
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill={gaugeColor} />
                                        <Cell fill="#18181b" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-2xl block mb-1">
                                    {percentageDisplay >= 100 ? '🚀' : percentageDisplay >= 75 ? '🔥' : '⚠️'}
                                </span>
                                <span className="text-white font-black text-xl">{percentageDisplay}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ExpandableCard>

            {/* Posse de Bola - Donut (dados do jogo após coleta encerrada) */}
            <ExpandableCard title="Posse de Bola" icon={PieChartIcon} headerColor="text-[#00f0ff]">
                <p className="text-xs text-zinc-500 mb-4 font-medium">Distribuição da posse nos jogos com coleta encerrada (tempo com bola vs adversário).</p>
                {hasPossessionData && possessionDonutData ? (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-56 w-56 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={possessionDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius="50%"
                            outerRadius="85%"
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                            label={({ name, value }) => `${name} ${value}%`}
                          >
                            {possessionDonutData.map((entry, index) => (
                              <Cell key={`posse-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, '']} contentStyle={tooltipStyle} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      {possessionDonutData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                          <span className="text-zinc-300 font-medium">{entry.name}</span>
                          <span className="text-white font-bold">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm py-8 text-center">Nenhum dado de posse disponível. A posse é registrada na coleta em tempo real (Dados do Jogo) e aparece aqui após a partida encerrada.</p>
                )}
            </ExpandableCard>
       </div>

      {/* Distribution of Table Stats */}
      <h3 className="text-white font-bold uppercase tracking-widest text-sm pl-2 border-l-4 border-[#00f0ff]">Distribuição de Estatísticas da Tabela</h3>
      
      {/* Passes & Shots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ExpandableCard title="Passes Certos vs Errados" icon={BarChart3} headerColor="text-blue-400">
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="passesCorrect" name="Passes Certos" fill={COLORS.blue} stackId="a">
                        <LabelList dataKey="passesCorrect" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="passesWrong" name="Passes Errados" fill="#ef4444" stackId="a">
                        <LabelList dataKey="passesWrong" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           {/* Tabela de estatísticas por jogador */}
           <PlayerStatsTable matches={filteredMatches} statType="passes" players={players} />
        </ExpandableCard>

        <ExpandableCard title="Chutes no Gol vs Fora" icon={BarChart3} headerColor="text-purple-400">
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="shotsOn" name="No Gol" fill={COLORS.blueMedium}>
                        <LabelList dataKey="shotsOn" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="shotsOff" name="Pra Fora" fill={COLORS.slate}>
                        <LabelList dataKey="shotsOff" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           {/* Tabela de estatísticas por jogador */}
           <PlayerStatsTable matches={filteredMatches} statType="shots" players={players} />
        </ExpandableCard>
      </div>

      {/* Defensive Stats (Tackles & Errors) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ExpandableCard title="Tipos de Desarme" icon={BarChart3} headerColor="text-emerald-400">
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="tacklesWithBall" name="Com Posse" fill={COLORS.blueLight}>
                        <LabelList dataKey="tacklesWithBall" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="tacklesWithoutBall" name="Sem Posse" fill={COLORS.blueDark}>
                        <LabelList dataKey="tacklesWithoutBall" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="tacklesCounterAttack" name="Contra-Ataque" fill={COLORS.blue}>
                        <LabelList dataKey="tacklesCounterAttack" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           {/* Tabela de estatísticas por jogador */}
           <PlayerStatsTable matches={filteredMatches} statType="tackles" players={players} />
        </ExpandableCard>

        <ExpandableCard title="Erros Críticos (Transição)" icon={BarChart3} headerColor="text-[#ff0055]">
           <SimpleColumnChart data={chartData} dataKey="wrongPassesTransition" fill={COLORS.rose} axisStyle={axisStyle} tooltipStyle={tooltipStyle} labelStyle={labelStyle} />
        </ExpandableCard>
      </div>

      {/* Análise de Quarteto de Linha (IPQ) */}
      <h3 className="text-white font-bold uppercase tracking-widest text-sm pl-2 border-l-4 border-[#00f0ff]">Análise de Quarteto de Linha</h3>
      <div className="mb-6 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
        <p className="text-zinc-300 text-sm font-medium leading-relaxed">
          O <strong className="text-white">IPQ (Índice de Performance do Quarteto)</strong> mede a eficiência coletiva dos quatro atletas enquanto estiveram juntos em quadra. O sistema gera três indicadores: <strong className="text-blue-400">IPQ Ofensivo</strong> (produção ofensiva e geração de jogo), <strong className="text-red-400">IPQ Defensivo</strong> (solidez defensiva e controle de erros) e <strong className="text-purple-400">IPQ Total</strong> (ataque, defesa e disciplina). Todos são normalizados de 0 a 100 — quanto maior, melhor. Apenas quartetos com pelo menos 3 minutos juntos são considerados.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpandableCard title="Quarteto Alta performance" icon={Trophy} headerColor="text-[#ccff00]">
          <div className="space-y-6">
            {quartetAnalysis.highPerformance.length === 0 ? (
              <p className="text-zinc-500 text-sm py-6 text-center">Nenhum quarteto com pelo menos 3 minutos juntos nas partidas filtradas. Use partidas com escalação e scout salvos.</p>
            ) : (
              quartetAnalysis.highPerformance.map((q, idx) => (
                <QuartetCard key={idx} quarteto={q} rank={idx + 1} variant="high" />
              ))
            )}
          </div>
        </ExpandableCard>
        <ExpandableCard title="Quarteto Baixa performance" icon={AlertCircle} headerColor="text-[#ff0055]">
          <div className="space-y-6">
            {quartetAnalysis.lowPerformance.length === 0 ? (
              <p className="text-zinc-500 text-sm py-6 text-center">Nenhum quarteto com pelo menos 3 minutos juntos nas partidas filtradas. Use partidas com escalação e scout salvos.</p>
            ) : (
              quartetAnalysis.lowPerformance.map((q, idx) => (
                <QuartetCard key={idx} quarteto={q} rank={idx + 1} variant="low" />
              ))
            )}
          </div>
        </ExpandableCard>
      </div>

      {/* Row: Goals by Time Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpandableCard title="Gols Feitos por Período" icon={Clock} headerColor="text-[#ccff00]">
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timePeriodData.scoredDist} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={true} />
                    <XAxis dataKey="period" stroke="#71717a" tick={axisStyle} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#71717a" tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{stroke: COLORS.blue, strokeWidth: 1}} />
                    <Area type="monotone" dataKey="value" fill={COLORS.blue} fillOpacity={0.25} stroke="none" />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS.blue} 
                        strokeWidth={1.5} 
                        dot={{fill: COLORS.blue, r: 4}}
                        activeDot={{r: 6}}
                        name="Gols Feitos"
                    >
                        <LabelList dataKey="value" position="top" fill="#fff" fontSize={14} fontWeight="bold" dy={-25} />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
           {/* Cartão com porcentagem do maior número de gols feitos por período */}
           <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
             <p className="text-white text-sm font-bold">
               <span className="text-[#ccff00]">{timePeriodData.maxScoredPeriod.percentage}%</span> dos gols feitos saíram no período de <span className="text-[#ccff00]">{timePeriodData.maxScoredPeriod.period}</span>
             </p>
           </div>
        </ExpandableCard>

        <ExpandableCard title="Gols Tomados por Período" icon={Clock} headerColor="text-[#ff0055]">
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timePeriodData.concededDist} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={true} />
                    <XAxis dataKey="period" stroke="#71717a" tick={axisStyle} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#71717a" tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{stroke: COLORS.rose, strokeWidth: 1}} />
                    <Area type="monotone" dataKey="value" fill={COLORS.rose} fillOpacity={0.25} stroke="none" />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS.rose} 
                        strokeWidth={1.5} 
                        dot={{fill: COLORS.rose, r: 4}}
                        activeDot={{r: 6}}
                        name="Gols Tomados"
                    >
                        <LabelList dataKey="value" position="top" fill="#fff" fontSize={14} fontWeight="bold" dy={-25} />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
           {/* Cartão com porcentagem do maior número de gols tomados por período */}
           <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
             <p className="text-white text-sm font-bold">
               <span className="text-[#ff0055]">{timePeriodData.maxConcededPeriod.percentage}%</span> dos gols tomados saíram no período de <span className="text-[#ff0055]">{timePeriodData.maxConcededPeriod.period}</span>
             </p>
           </div>
        </ExpandableCard>
      </div>

      {/* Row 3: Donut Charts - Métodos de Gol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpandableCard title={`Métodos de ${config.labels.goals} Marcado`} icon={PieChartIcon} headerColor="text-white">
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                    <Pie
                        data={originScoredData}
                        cx="50%"
                        cy="40%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, value, percentage}) => `${name}: ${value} (${percentage}%)`}
                    >
                        {originScoredData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string, props: any) => [
                        `${value} (${props.payload.percentage}%)`,
                        name
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{color: '#a1a1aa', fontSize: '12px', fontFamily: 'Poppins', paddingTop: '20px'}} />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>

        <ExpandableCard title={`Métodos de ${config.labels.goals} Tomado`} icon={PieChartIcon} headerColor="text-white">
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                    <Pie
                        data={originConcededData}
                        cx="50%"
                        cy="40%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, value, percentage}) => `${name}: ${value} (${percentage}%)`}
                    >
                        {originConcededData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS_CONCEDED[index % PIE_COLORS_CONCEDED.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string, props: any) => [
                        `${value} (${props.payload.percentage}%)`,
                        name
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{color: '#a1a1aa', fontSize: '12px', fontFamily: 'Poppins', paddingTop: '20px'}} />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>
      </div>
    </div>
  );
};

// UI Components
const Select: React.FC<{value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: any[]}> = ({value, onChange, options}) => (
    <div className="relative">
        <select 
            value={value} 
            onChange={onChange}
            className="w-full bg-black border border-zinc-800 text-white py-2.5 px-3 rounded-lg focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none text-xs font-bold appearance-none uppercase"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-3 top-3 pointer-events-none">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    </div>
);

const KPICard: React.FC<{title: string, value: number | string, subtitle?: string, icon: any, color: string, bg?: string}> = ({title, value, subtitle, icon: Icon, color, bg = "bg-black border-zinc-900"}) => (
    <div className={`rounded-3xl p-5 flex items-center justify-between shadow-lg transition-colors border ${bg}`}>
        <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-black text-white italic">{value}</p>
            {subtitle && <p className="text-xs text-zinc-500 font-bold mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-zinc-950/50 border border-zinc-900 ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

// Componente de tabela de estatísticas por jogador
const PlayerStatsTable: React.FC<{matches: MatchRecord[], statType: 'passes' | 'shots' | 'tackles', players: Player[]}> = ({matches, statType, players}) => {
  const playerStats = useMemo(() => {
    const statsMap = new Map<string, {name: string, correct: number, wrong: number, total: number}>();
    
    matches.forEach(match => {
      if (!match.playerStats) return;
      
      Object.entries(match.playerStats).forEach(([playerId, pStats]) => {
        // Normalizar ID para comparação (string, trim)
        const normalizedPlayerId = String(playerId).trim();
        
        // Buscar nome do jogador (comparar IDs normalizados)
        const player = players.find(p => String(p.id).trim() === normalizedPlayerId);
        const playerName = player ? player.name : normalizedPlayerId;
        
        if (!statsMap.has(normalizedPlayerId)) {
          statsMap.set(normalizedPlayerId, {name: playerName, correct: 0, wrong: 0, total: 0});
        }
        const stats = statsMap.get(normalizedPlayerId)!;
        
        if (statType === 'passes') {
          stats.correct += pStats.passesCorrect || 0;
          stats.wrong += pStats.passesWrong || 0;
          stats.total += (pStats.passesCorrect || 0) + (pStats.passesWrong || 0);
        } else if (statType === 'shots') {
          stats.correct += pStats.shotsOnTarget || 0;
          stats.wrong += pStats.shotsOffTarget || 0;
          stats.total += (pStats.shotsOnTarget || 0) + (pStats.shotsOffTarget || 0);
        } else if (statType === 'tackles') {
          stats.correct += (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0);
          stats.wrong += pStats.tacklesCounterAttack || 0;
          stats.total += (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0) + (pStats.tacklesCounterAttack || 0);
        }
      });
    });
    
    return Array.from(statsMap.values())
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [matches, statType, players]);

  if (playerStats.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
      <h4 className="text-white text-xs font-bold uppercase mb-3 tracking-wider">
        Top 10 Jogadores - {statType === 'passes' ? 'Passes' : statType === 'shots' ? 'Chutes' : 'Desarmes'}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-2 text-zinc-400 font-bold uppercase">Jogador</th>
              <th className="text-right py-2 text-zinc-400 font-bold uppercase">
                {statType === 'passes' ? 'Certos' : statType === 'shots' ? 'No Gol' : 'Total'}
              </th>
              <th className="text-right py-2 text-zinc-400 font-bold uppercase">
                {statType === 'passes' ? 'Errados' : statType === 'shots' ? 'Fora' : 'Contra-Ataque'}
              </th>
              <th className="text-right py-2 text-zinc-400 font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stat, idx) => (
              <tr key={idx} className="border-b border-zinc-900/50">
                <td className="py-2 text-white font-bold">{stat.name}</td>
                <td className="py-2 text-right text-[#10b981] font-bold">{stat.correct}</td>
                <td className="py-2 text-right text-[#ff0055] font-bold">{stat.wrong}</td>
                <td className="py-2 text-right text-zinc-300 font-bold">{stat.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SimpleColumnChart: React.FC<{ data: any[], dataKey: string, fill: string, axisStyle: any, tooltipStyle: any, labelStyle: any }> = ({ data, dataKey, fill, axisStyle, tooltipStyle, labelStyle }) => {
  return (
    <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} interval={0} />
            <YAxis hide />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} barSize={40} fill={fill}>
                <LabelList dataKey={dataKey} position="top" {...labelStyle} dy={-10} />
            </Bar>
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

const formatTempoJuntos = (segundos: number): string => {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}m ${s}s`;
};

const QuartetCard: React.FC<{
  quarteto: QuartetDisplay;
  rank: number;
  variant: 'high' | 'low';
}> = ({ quarteto, rank, variant }) => {
  const [expanded, setExpanded] = useState(false);
  const min = quarteto._min ?? (quarteto.tempo_total / 60);
  const perMin = (v: number) => (min > 0 ? (v / min).toFixed(2) : '0');

  return (
    <div className={`rounded-xl border p-4 ${variant === 'high' ? 'border-[#ccff00]/40 bg-[#ccff00]/5' : 'border-[#ff0055]/40 bg-[#ff0055]/5'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-lg font-black ${variant === 'high' ? 'text-[#ccff00]' : 'text-[#ff0055]'}`}>#{rank}</span>
        <span className="text-zinc-400 text-xs font-bold">Quarteto de linha</span>
      </div>

      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {quarteto.atletas.map(a => (
          <div key={a.id} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex-shrink-0">
              {a.foto_url ? (
                <img src={a.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                  {a.apelido.slice(0, 2) || '?'}
                </div>
              )}
            </div>
            <span className="text-white text-xs font-bold mt-1.5 truncate max-w-[72px] text-center">{a.apelido}</span>
          </div>
        ))}
      </div>

      <p className="text-zinc-400 text-xs mb-3">Tempo juntos: <span className="text-white font-bold">{formatTempoJuntos(quarteto.tempo_total)}</span></p>

      <div className="flex gap-4 mb-4 flex-wrap">
        <span className="text-zinc-400 text-xs">IPQ Total: <strong className="text-white">{quarteto.ipq_total}</strong></span>
        <span className="text-blue-400 text-xs">IPQ Ofensivo: <strong>{quarteto.ipq_ofensivo}</strong></span>
        <span className="text-red-400 text-xs">IPQ Defensivo: <strong>{quarteto.ipq_defensivo}</strong></span>
      </div>

      <div className="space-y-1 text-xs mb-4">
        <p className="text-zinc-300">⚽ {quarteto.gols_feitos} gols feitos &nbsp; 🥅 {quarteto.gols_tomados} gols tomados</p>
        <p className="text-zinc-300">📊 Posse média: {quarteto.posse_media}%</p>
        <p className="text-zinc-300">🔥 Método de gol mais recorrente: {quarteto.metodo_gol_mais_recorrente}</p>
        <p className="text-zinc-300">🛑 Método de gol tomado mais recorrente: {quarteto.metodo_gol_tomado_mais_recorrente}</p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Ocultar métricas' : 'Ver todas as métricas'}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="col-span-2 text-zinc-500 font-bold mb-1">Métricas brutas e por minuto</div>
          <span className="text-zinc-500">Tempo total</span>
          <span className="text-white font-bold text-right">{formatTempoJuntos(quarteto.tempo_total)}</span>
          <span className="text-zinc-500">Gols feitos</span>
          <span className="text-white font-bold text-right">{quarteto.gols_feitos} ({perMin(quarteto.gols_feitos)}/min)</span>
          <span className="text-zinc-500">Gols tomados</span>
          <span className="text-white font-bold text-right">{quarteto.gols_tomados} ({perMin(quarteto.gols_tomados)}/min)</span>
          <span className="text-zinc-500">Chutes dentro</span>
          <span className="text-white font-bold text-right">{quarteto.chutes_dentro} ({perMin(quarteto.chutes_dentro)}/min)</span>
          <span className="text-zinc-500">Chutes fora</span>
          <span className="text-white font-bold text-right">{quarteto.chutes_fora} ({perMin(quarteto.chutes_fora)}/min)</span>
          <span className="text-zinc-500">Passes certos</span>
          <span className="text-white font-bold text-right">{quarteto.passes_certos} ({perMin(quarteto.passes_certos)}/min)</span>
          <span className="text-zinc-500">Passes errados</span>
          <span className="text-white font-bold text-right">{quarteto.passes_errados} ({perMin(quarteto.passes_errados)}/min)</span>
          <span className="text-zinc-500">Desarmes com posse</span>
          <span className="text-white font-bold text-right">{quarteto.desarmes_com_posse} ({perMin(quarteto.desarmes_com_posse)}/min)</span>
          <span className="text-zinc-500">Desarmes sem posse</span>
          <span className="text-white font-bold text-right">{quarteto.desarmes_sem_posse} ({perMin(quarteto.desarmes_sem_posse)}/min)</span>
          <span className="text-zinc-500">Faltas sofridas</span>
          <span className="text-white font-bold text-right">{quarteto.faltas_sofridas} ({perMin(quarteto.faltas_sofridas)}/min)</span>
          <span className="text-zinc-500">Faltas feitas</span>
          <span className="text-white font-bold text-right">{quarteto.faltas_feitas} ({perMin(quarteto.faltas_feitas)}/min)</span>
          <span className="text-zinc-500">Método gol feito</span>
          <span className="text-white font-bold text-right">{quarteto.metodo_gol_mais_recorrente}</span>
          <span className="text-zinc-500">Método gol tomado</span>
          <span className="text-white font-bold text-right">{quarteto.metodo_gol_tomado_mais_recorrente}</span>
          <span className="text-zinc-500">Posse média</span>
          <span className="text-white font-bold text-right">{quarteto.posse_media}%</span>
        </div>
      )}
    </div>
  );
};

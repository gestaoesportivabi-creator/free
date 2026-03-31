import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Filter, Trophy, AlertCircle, ShieldAlert, Gauge, Activity, PieChart as PieChartIcon, BarChart3, Clock, Target, Goal, BookOpen, Flag, ChevronDown, ChevronUp, Lock, FileDown, Info } from 'lucide-react';
import { SportConfig, MatchRecord, Player } from '../types';
import { ExpandableCard } from './ExpandableCard';
import { exportScoutToPdf } from '../utils/exportScoutPdf';
import { buildPlayerTop10ForPdf } from '../utils/scoutPlayerStatsHelpers';
import { postMatchEventClockToAbsoluteSeconds, type MatchHalf } from '../utils/matchPeriod';

interface GeneralScoutProps {
  config: SportConfig;
  matches: MatchRecord[];
  players?: Player[];
  /** Plano Essencial: bloqueia gráfico de posse */
  isFreePlan?: boolean;
}


/** Faixas de 5 min (0–50 min) para gols por período — legendas do eixo X */
const GOAL_BY_PERIOD_LABELS = [
  '00:00 - 05:00',
  '05:01 - 10:00',
  '10:01 - 15:00',
  '15:01 - 20:00',
  '20:01 - 25:00',
  '25:01 - 30:00',
  '30:01 - 35:00',
  '35:01 - 40:00',
  '40:01 - 45:00',
  '45:01 - 50:00',
] as const;

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

function getOpponentShotsFromLog(match: MatchRecord): {
  shotsOnTarget: number;
  shotsOffTarget: number;
  savesSimple: number;
  savesHard: number;
} {
  const log = Array.isArray(match.postMatchEventLog) ? match.postMatchEventLog : [];
  let simple = 0;
  let hard = 0;
  let outside = 0;
  for (const e of log as any[]) {
    if (e?.action !== 'save') continue;
    const difficultyRaw = String(e?.subtipo ?? e?.details?.saveDifficulty ?? e?.result ?? '').trim().toLowerCase();
    const difficulty = difficultyRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (difficulty === 'simple') simple += 1;
    else if (difficulty === 'dificil' || difficulty === 'hard') hard += 1;
    else if (difficulty === 'pra fora' || difficulty === 'outside') outside += 1;
  }
  return {
    shotsOnTarget: simple + hard,
    shotsOffTarget: outside,
    savesSimple: simple,
    savesHard: hard,
  };
}

export const GeneralScout: React.FC<GeneralScoutProps> = ({ config, matches, players = [], isFreePlan = false }) => {
  const [compFilter, setCompFilter] = useState<string>('Todas');
  const [opponentFilter, setOpponentFilter] = useState<string>('Todos');
  const [locationFilter, setLocationFilter] = useState<string>('Todos');
  const [monthFilter, setMonthFilter] = useState<string>('Todos');
  const [pdfExporting, setPdfExporting] = useState(false);

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

  // BLUE COLOR PALETTE + accent
  const COLORS = {
    blue: '#00f0ff',    // Cyan Blue (escudo)
    blueLight: '#60a5fa', // Light Blue
    blueMedium: '#3b82f6', // Medium Blue
    blueDark: '#2563eb', // Dark Blue
    blueDarker: '#1e40af', // Darker Blue
    blueCyan: '#0ea5e9', // Cyan Blue
    slate: '#71717a',   // Zinc
    rose: '#ff0055',    // Erros / transição
    green: '#22c55e',   // Gols por período + passes certos (barras)
    /** Contra-ataque em Tipos de Desarme — mais escuro que Sem Posse */
    tackleCounterDark: '#1e3a8a',
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
      const gf = curr.goalsFor ?? curr.teamStats.goals ?? 0;
      const ga = curr.goalsAgainst ?? curr.teamStats.goalsConceded ?? 0;
      const r = curr.result as string;
      const resolved = (r === 'V' || r === 'Vitória') ? 'V'
        : (r === 'D' || r === 'Derrota') ? 'D'
        : (r === 'E' || r === 'Empate') ? 'E'
        : gf > ga ? 'V' : ga > gf ? 'D' : 'E';
      acc.wins += resolved === 'V' ? 1 : 0;
      acc.losses += resolved === 'D' ? 1 : 0;
      acc.draws += resolved === 'E' ? 1 : 0;
      acc.totalMinutes += curr.teamStats.minutesPlayed || 0;
      acc.goalsConceded += curr.teamStats.goalsConceded || 0;
      acc.goalsScored += curr.teamStats.goals || 0;
      
      acc.passesCorrect += curr.teamStats.passesCorrect || 0;
      acc.passesWrong += curr.teamStats.passesWrong || 0;
      acc.shotsOn += curr.teamStats.shotsOnTarget || 0;
      acc.shotsOff += curr.teamStats.shotsOffTarget || 0;
      acc.shotsShootZone += curr.teamStats.shotsShootZone || 0;
      const oppShots = getOpponentShotsFromLog(curr);
      acc.opponentShotsOn += oppShots.shotsOnTarget;
      acc.opponentShotsOff += oppShots.shotsOffTarget;
      acc.savesSimple += oppShots.savesSimple;
      acc.savesHard += oppShots.savesHard;
      
      acc.wrongPassesTransition += curr.teamStats.transitionErrors ?? (curr.teamStats as any).wrongPassesTransition ?? 0;
      const tacklesCounter = curr.teamStats.tacklesCounterAttack || 0;
      const tacklesWith = curr.teamStats.tacklesWithBall || 0;
      const tacklesWithout = curr.teamStats.tacklesWithoutBall || 0;
      acc.tacklesCounterAttack += tacklesCounter;
      acc.tacklesWithBall += tacklesWith;
      acc.tacklesWithoutBall += tacklesWithout;
      
      acc.tacklesTotal += (tacklesWith + tacklesWithout + tacklesCounter);
      
      acc.yellowCards += curr.teamStats.yellowCards || 0;
      acc.redCards += curr.teamStats.redCards || 0;

      // Classificação manual de Origem do Gol baseada nos métodos (mais confiável no front)
      const SET_PIECE_METHODS = ['ESCANTEIO', 'FALTAS', 'PÊNALTI', 'TIRO LIVRE', 'LATERAIS'];

      // Agregar métodos de gols e calcular origem
      if (curr.teamStats.goalMethodsScored) {
        Object.entries(curr.teamStats.goalMethodsScored).forEach(([method, count]) => {
          let normalizedMethod = method.trim().toUpperCase();
          if (normalizedMethod === 'ROUBADA DE BOLA NA PRIMEIRA LINHA') {
            normalizedMethod = 'MARCAÇÃO ALTA';
          }
          
          acc.goalMethodsScored[normalizedMethod] = (acc.goalMethodsScored[normalizedMethod] || 0) + count;
          
          if (SET_PIECE_METHODS.includes(normalizedMethod)) {
            acc.goalsScoredSet += count;
          } else {
            acc.goalsScoredOpen += count;
          }
        });
      }

      if (curr.teamStats.goalMethodsConceded) {
        Object.entries(curr.teamStats.goalMethodsConceded).forEach(([method, count]) => {
          let normalizedMethod = method.trim().toUpperCase();
          if (normalizedMethod === 'ROUBADA DE BOLA NA PRIMEIRA LINHA') {
            normalizedMethod = 'MARCAÇÃO ALTA';
          }
          
          acc.goalMethodsConceded[normalizedMethod] = (acc.goalMethodsConceded[normalizedMethod] || 0) + count;
          
          if (SET_PIECE_METHODS.includes(normalizedMethod)) {
            acc.goalsConcededSet += count;
          } else {
            acc.goalsConcededOpen += count;
          }
        });
      }
      
      return acc;
    }, {
      totalGames: 0, wins: 0, losses: 0, draws: 0, totalMinutes: 0, goalsConceded: 0, goalsScored: 0,
      passesCorrect: 0, passesWrong: 0, shotsOn: 0, shotsOff: 0, shotsShootZone: 0,
      opponentShotsOn: 0, opponentShotsOff: 0, savesSimple: 0, savesHard: 0,
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

  /** Minuto absoluto do jogo (0–50) para eixos 5 em 5 min. Respeita sufixo "(1T)"/"(2T)" e legado de relógio na planilha. */
  const parseGoalTimeToAbsoluteMinutes = (timeStr: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const paren = timeStr.match(/\(([12])T\)\s*$/i);
    if (paren) {
      const clockPart = timeStr.slice(0, timeStr.indexOf('(')).trim();
      const period = (paren[1] === '2' ? '2T' : '1T') as MatchHalf;
      const absSec = postMatchEventClockToAbsoluteSeconds(clockPart, period);
      return Math.floor(absSec / 60);
    }
    const cleanTime = timeStr.split('(')[0].trim();
    const parts = cleanTime.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      if (!isNaN(minutes)) return minutes;
    }
    const minutesOnly = parseInt(cleanTime, 10);
    return !isNaN(minutesOnly) ? minutesOnly : null;
  };

  /** Segundos absolutos no jogo (0 … ~50 min) a partir do texto do relógio — para faixas de 5 min. */
  const parseGoalTimeToTotalSeconds = (timeStr: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const paren = timeStr.match(/\(([12])T\)\s*$/i);
    if (paren) {
      const clockPart = timeStr.slice(0, timeStr.indexOf('(')).trim();
      const period = (paren[1] === '2' ? '2T' : '1T') as MatchHalf;
      return postMatchEventClockToAbsoluteSeconds(clockPart, period);
    }
    const cleanTime = timeStr.split('(')[0].trim();
    const parts = cleanTime.split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const sec = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(sec) && sec >= 0 && sec <= 59) return m * 60 + sec;
    }
    const mOnly = parseInt(cleanTime, 10);
    return !isNaN(mOnly) ? mOnly * 60 : null;
  };

  /** Índice 0–9 em GOAL_BY_PERIOD_LABELS; primeiro bloco [0, 5:00], depois a cada 5 min (ex.: 45:01–50:00). */
  const goalPeriodIndexFromTotalSeconds = (tSec: number): number | null => {
    if (!Number.isFinite(tSec) || tSec < 0) return null;
    const maxSec = 50 * 60;
    if (tSec > maxSec) return null;
    if (tSec <= 300) return 0;
    return Math.min(9, Math.floor((tSec - 1) / 300));
  };

  // Time Period Data — 10 faixas de 5 min (00:00–50:00)
  const timePeriodData = useMemo(() => {
    const periods = [...GOAL_BY_PERIOD_LABELS];
    const scoredCounts = new Array(periods.length).fill(0);
    const concededCounts = new Array(periods.length).fill(0);

    filteredMatches.forEach(match => {
      if (!match.teamStats || !match.teamStats.goalTimes) return;
      match.teamStats.goalTimes.forEach(goalTime => {
        const tSec = parseGoalTimeToTotalSeconds(goalTime.time);
        if (tSec === null) return;
        const periodIndex = goalPeriodIndexFromTotalSeconds(tSec);
        if (periodIndex !== null) scoredCounts[periodIndex]++;
      });
    });

    filteredMatches.forEach(match => {
      if (!match.teamStats || !match.teamStats.goalsConcededTimes) return;
      match.teamStats.goalsConcededTimes.forEach(goalConceded => {
        const tSec = parseGoalTimeToTotalSeconds(goalConceded.time);
        if (tSec === null) return;
        const periodIndex = goalPeriodIndexFromTotalSeconds(tSec);
        if (periodIndex !== null) concededCounts[periodIndex]++;
      });
    });
    
    // Máximo por chart para destacar o período com mais gols (label amarelo)
    const maxScoredValue = scoredCounts.length ? Math.max(...scoredCounts) : 0;
    const maxConcededValue = concededCounts.length ? Math.max(...concededCounts) : 0;

    // Criar distribuição com valores reais; labelTop = valor acima (não-max), labelBottom = valor abaixo (só no período com mais gols)
    const scoredDist = periods.map((p, i) => {
      const val = scoredCounts[i];
      const isMax = val === maxScoredValue && maxScoredValue > 0;
      return {
        period: p,
        value: val,
        isMax,
        labelTop: isMax ? '' : val,
        labelBottom: isMax ? val : ''
      };
    });

    const concededDist = periods.map((p, i) => {
      const val = concededCounts[i];
      const isMax = val === maxConcededValue && maxConcededValue > 0;
      return {
        period: p,
        value: val,
        isMax,
        labelTop: isMax ? '' : val,
        labelBottom: isMax ? val : ''
      };
    });

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
      ...(() => {
        const opp = getOpponentShotsFromLog(match);
        return {
          opponentShotsOn: opp.shotsOnTarget,
          opponentShotsOff: opp.shotsOffTarget,
          savesSimple: opp.savesSimple,
          savesHard: opp.savesHard,
        };
      })(),
      name: match.opponent,
      transitionErrors: match.teamStats.transitionErrors ?? (match.teamStats as any).wrongPassesTransition ?? 0,
      tacklesCounterAttack: match.teamStats.tacklesCounterAttack ?? 0,
      tacklesWithBall: match.teamStats.tacklesWithBall ?? 0,
      tacklesWithoutBall: match.teamStats.tacklesWithoutBall ?? 0,
      passesCorrect: match.teamStats.passesCorrect ?? 0,
      passesWrong: match.teamStats.passesWrong ?? 0,
      shotsOn: match.teamStats.shotsOnTarget ?? 0,
      shotsOff: match.teamStats.shotsOffTarget ?? 0,
      shotsShootZone: match.teamStats.shotsShootZone ?? 0,
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

  // Dados de origem do gol (Bola Rolando vs Bola Parada)
  const goalOriginScoredData = useMemo(() => {
    const total = stats.goalsScored || 0;
    return [
      { name: 'Bola Rolando', value: stats.goalsScoredOpen, percentage: total > 0 ? ((stats.goalsScoredOpen / total) * 100).toFixed(1) : '0.0' },
      { name: 'Bola Parada', value: stats.goalsScoredSet, percentage: total > 0 ? ((stats.goalsScoredSet / total) * 100).toFixed(1) : '0.0' },
    ];
  }, [stats.goalsScored, stats.goalsScoredOpen, stats.goalsScoredSet]);

  const goalOriginConcededData = useMemo(() => {
    const total = stats.goalsConceded || 0;
    return [
      { name: 'Bola Rolando', value: stats.goalsConcededOpen, percentage: total > 0 ? ((stats.goalsConcededOpen / total) * 100).toFixed(1) : '0.0' },
      { name: 'Bola Parada', value: stats.goalsConcededSet, percentage: total > 0 ? ((stats.goalsConcededSet / total) * 100).toFixed(1) : '0.0' },
    ];
  }, [stats.goalsConceded, stats.goalsConcededOpen, stats.goalsConcededSet]);

  // Fallback para dados antigos (Bola Rolando/Bola Parada) - Mantido para compatibilidade se necessário em outros lugares
  const originScoredData = goalMethodsScoredData.length > 0 
    ? goalMethodsScoredData
    : goalOriginScoredData;
  
  const originConcededData = goalMethodsConcededData.length > 0
    ? goalMethodsConcededData
    : goalOriginConcededData;


  // Cores para gráficos de rosca (expandir conforme necessário) - Tons de Azul
  const PIE_COLORS = [COLORS.blue, COLORS.blueLight, COLORS.blueMedium, COLORS.blueDark, COLORS.blueDarker, COLORS.blueCyan, COLORS.slate];
  // Métodos Detalhados Gols Marcados - cores mais escuras
  const PIE_COLORS_SCORED_DARK = ['#0099a3', '#4a8de8', '#2d6ad8', '#1d4fd6', '#16338c', '#0a8bc4', '#5a5a62'];
  const PIE_COLORS_CONCEDED = [COLORS.blueDarker, COLORS.blueDark, COLORS.blueMedium, COLORS.blue, COLORS.blueLight, COLORS.blueCyan, COLORS.slate];

  // Meta de desarmes = só partidas realizadas e salvas (com teamStats) que têm meta definida
  // Porcentagem = desarmes dessas partidas / soma das metas dessas partidas
  const gaugeMeta = useMemo(() => {
    let targetSum = 0;
    let tacklesSum = 0;
    filteredMatches.forEach(m => {
      if (!m.scoreTarget || !m.teamStats) return;
      const num = parseFloat(m.scoreTarget.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || num <= 0) return;
      targetSum += num;
      const t = (m.teamStats.tacklesWithBall || 0) + (m.teamStats.tacklesWithoutBall || 0) + (m.teamStats.tacklesCounterAttack || 0);
      tacklesSum += t;
    });
    const hasTarget = targetSum > 0;
    const pct = hasTarget ? (tacklesSum / targetSum) * 100 : 0;
    return {
      TACKLE_TARGET: targetSum,
      totalTackles: tacklesSum,
      hasTackleTarget: hasTarget,
      percentage: Math.min(pct, 100),
      percentageDisplay: hasTarget ? pct.toFixed(2) : '0.00',
    };
  }, [filteredMatches]);

  const TACKLE_TARGET = gaugeMeta.TACKLE_TARGET;
  const totalTackles = gaugeMeta.totalTackles;
  const hasTackleTarget = gaugeMeta.hasTackleTarget;
  const percentage = gaugeMeta.percentage;
  const percentageDisplay = gaugeMeta.percentageDisplay;
  const percentageDisplayNum = parseFloat(percentageDisplay);

  // Logic for Speedometer Color - Tons de Azul
  let gaugeColor = COLORS.blue;
  if (percentageDisplayNum < 75) gaugeColor = '#ef4444'; // Red (mantido para erro)
  else if (percentageDisplayNum <= 90) gaugeColor = COLORS.blueDark; // Dark Blue
  else if (percentageDisplayNum <= 99) gaugeColor = COLORS.blueMedium; // Medium Blue
  else gaugeColor = COLORS.blue; // Cyan Blue (>= 100%)

  const gaugeData = [
    { name: 'Conquistado', value: percentage },
    { name: 'Restante', value: 100 - percentage }
  ];

  // Alerta: partidas em que a meta foi alcançada e quantas resultaram em vitória
  const tackleTargetAlert = useMemo(() => {
    const matchesWithTarget: Array<{ achieved: boolean; victory: boolean }> = [];
    filteredMatches.forEach(m => {
      if (!m.scoreTarget || !m.teamStats) return;
      const num = parseFloat(m.scoreTarget.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || num <= 0) return;
      const tackles = (m.teamStats.tacklesWithBall || 0) + (m.teamStats.tacklesWithoutBall || 0) + (m.teamStats.tacklesCounterAttack || 0);
      const achieved = tackles >= num;
      const r = m.result as string;
      const victory = (r === 'V' || r === 'Vitória');
      matchesWithTarget.push({ achieved, victory });
    });
    const total = matchesWithTarget.length;
    const achievedCount = matchesWithTarget.filter(x => x.achieved).length;
    const achievedAndVictory = matchesWithTarget.filter(x => x.achieved && x.victory).length;
    return { total, achievedCount, achievedAndVictory };
  }, [filteredMatches]);

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

  // Fonte padrão para legendas e rótulos de dados em todos os gráficos do Scout Coletivo
  const CHART_FONT = 'Calibri';
  const CHART_FONT_SIZE = 12;
  const legendLabelStyle = { fontFamily: CHART_FONT, fontSize: CHART_FONT_SIZE, fontWeight: 'normal', fontStyle: 'normal' };

  const tooltipStyle = { backgroundColor: '#000', borderColor: '#333', color: '#fff', fontFamily: CHART_FONT, borderRadius: '8px', fontSize: '14px' };
  const axisStyle = { fontSize: CHART_FONT_SIZE, fontFamily: CHART_FONT, fill: '#a1a1aa', fontWeight: 'normal', fontStyle: 'normal' };
  const labelStyle = { fill: '#fff', fontSize: CHART_FONT_SIZE, fontWeight: 'normal', fontFamily: CHART_FONT };

  return (
    <div className="space-y-8 animate-fade-in pb-10 min-w-0 overflow-x-hidden">
      
      {/* Control Bar - Black Piano */}
      <div className="bg-black p-5 rounded-3xl border border-zinc-900 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-end">
        <div>
            <h2 className="text-sm text-white flex items-center gap-2 uppercase tracking-wide mb-1 scout-card-title">
            <Filter className="text-[#00f0ff]" size={16} /> Filtros de Dados
            </h2>
            <p className="text-xs text-zinc-500" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>Selecione os parâmetros para análise.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-end">
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
        <button
          type="button"
          onClick={async () => {
            setPdfExporting(true);
            try {
              const teamSettings = (() => {
                try {
                  const raw = localStorage.getItem('scout21_settings_current_team');
                  if (!raw) return {};
                  const d = JSON.parse(raw);
                  return { teamShieldUrl: d.shieldUrl || '', teamName: d.teamName || '' };
                } catch {
                  return {};
                }
              })();
              const pl = players || [];
              await exportScoutToPdf({
                filters: {
                  compFilter,
                  monthFilter,
                  opponentFilter,
                  locationFilter,
                },
                teamShieldUrl: teamSettings.teamShieldUrl || undefined,
                teamName: teamSettings.teamName || undefined,
                playerTables: {
                  passes: buildPlayerTop10ForPdf(filteredMatches, pl, 'passes'),
                  shots: buildPlayerTop10ForPdf(filteredMatches, pl, 'shots'),
                  tackles: buildPlayerTop10ForPdf(filteredMatches, pl, 'tackles'),
                  criticalErrors: buildPlayerTop10ForPdf(filteredMatches, pl, 'criticalErrors'),
                },
                stats,
                timePeriodData: {
                  maxScoredPeriod: timePeriodData.maxScoredPeriod,
                  maxConcededPeriod: timePeriodData.maxConcededPeriod,
                  scoredDist: timePeriodData.scoredDist.map(({ period, value }) => ({ period, value })),
                  concededDist: timePeriodData.concededDist.map(({ period, value }) => ({ period, value })),
                },
                chartData,
                goalMethodsScoredData,
                goalMethodsConcededData,
                goalOriginScoredData,
                goalOriginConcededData,
                gaugeData: {
                  percentageDisplay,
                  totalTackles,
                  tackleTarget: TACKLE_TARGET,
                  hasTackleTarget,
                },
              });
            } catch (err) {
              console.error('Erro ao exportar PDF:', err);
              alert('Erro ao gerar PDF. Tente novamente.');
            } finally {
              setPdfExporting(false);
            }
          }}
          disabled={pdfExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#00f0ff] hover:bg-[#00d4e6] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold uppercase text-xs rounded-xl transition-colors shrink-0"
        >
          <FileDown size={16} />
          {pdfExporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </button>
        </div>
      </div>

      {/* Conteúdo do Scout Coletivo */}
      <div id="scout-coletivo-export-content" className="space-y-8">
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
                <div className="min-h-48 w-full flex flex-col lg:flex-row lg:items-center justify-between px-6 py-6 gap-6 bg-zinc-950/50">
                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                         <div className="flex items-center gap-3">
                             <Gauge size={32} className="text-[#00f0ff] shrink-0" />
                             <h2 className="text-xl md:text-2xl text-white uppercase tracking-tighter scout-card-title-black-italic">Meta de Desarmes por Jogo</h2>
                         </div>
                         <p className="text-zinc-500 text-sm max-w-md" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
                             A porcentagem é calculada em relação às metas definidas nas partidas já realizadas e salvas. {hasTackleTarget ? `Meta total: ${Math.round(TACKLE_TARGET)} desarmes.` : 'Cadastre metas nas partidas para acompanhar.'}
                         </p>
                         {hasTackleTarget && tackleTargetAlert.total > 0 && (
                           <div className="flex items-start gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/50">
                             <Info size={18} className="text-[#00f0ff] shrink-0 mt-0.5" />
                             <p className="text-sm text-zinc-300" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
                               {tackleTargetAlert.total === 1 ? (
                                 tackleTargetAlert.achievedCount === 1 ? (
                                   tackleTargetAlert.achievedAndVictory === 1
                                     ? 'Nesta partida, a meta de desarmes foi alcançada e o resultado foi vitória.'
                                     : 'Nesta partida, a meta de desarmes foi alcançada, porém o resultado não foi vitória.'
                                 ) : 'Nesta partida, a meta de desarmes não foi alcançada.'
                               ) : (
                                 <>Em total de <span className="text-white font-medium">{tackleTargetAlert.total}</span> partidas salvas (com meta definida), a meta de desarmes foi alcançada em <span className="text-[#00f0ff] font-medium">{tackleTargetAlert.achievedCount}</span> delas, porém somente <span className="text-[#22c55e] font-medium">{tackleTargetAlert.achievedAndVictory}</span> resultaram em vitória.</>
                               )}
                             </p>
                           </div>
                         )}
                    </div>

                    <div className="flex items-center gap-6 lg:gap-8 shrink-0">
                        <div className="text-right">
                             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>Desarmes realizados</p>
                             <p className={`text-4xl md:text-5xl font-black tracking-tighter`} style={{ color: gaugeColor }}>
                                 {totalTackles}
                             </p>
                             {hasTackleTarget && (
                               <p className="text-[10px] text-zinc-500 mt-1" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
                                 Meta: {Math.round(TACKLE_TARGET)}
                               </p>
                             )}
                        </div>

                        <div className="h-32 w-40 shrink-0 relative pb-2">
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
                                    {hasTackleTarget ? (percentageDisplayNum >= 100 ? '🚀' : percentageDisplayNum >= 75 ? '🔥' : '⚠️') : '—'}
                                </span>
                                <span className="text-white font-black text-xl">{hasTackleTarget ? `${percentageDisplay}%` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ExpandableCard>

            {/* Posse de Bola - bloqueado no plano free */}
            <ExpandableCard title="Posse de Bola" icon={PieChartIcon} headerColor="text-[#00f0ff]" titleBlackItalic>
                {isFreePlan ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center">
                    <Lock className="w-12 h-12 text-zinc-500 mb-4" strokeWidth={1.5} />
                    <p className="text-zinc-400 text-sm max-w-md">
                      Em breve, estamos desenvolvendo. Entre em contato para mais informações.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500 mb-4" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>Distribuição da posse nos jogos com coleta encerrada (tempo com bola vs adversário).</p>
                    {hasPossessionData && possessionDonutData ? (
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="h-56 w-56 max-w-full flex-shrink-0">
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
                              <Tooltip formatter={(value: number) => [`${value}%`, '']} contentStyle={tooltipStyle} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff' }} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-2 text-sm">
                          {possessionDonutData.map((entry, i) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                              <span className="text-zinc-300" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>{entry.name}</span>
                              <span className="text-white" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>{entry.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm py-8 text-center" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>Nenhum dado de posse disponível. A posse é registrada na coleta em tempo real (Dados do Jogo) e aparece aqui após a partida encerrada.</p>
                    )}
                  </>
                )}
            </ExpandableCard>
       </div>

      {/* Distribution of Table Stats */}
      <h3 className="text-white uppercase tracking-widest text-sm pl-2 border-l-4 border-[#00f0ff] scout-card-title">Distribuição de Estatísticas da Tabela</h3>
      
      {/* Passes & Shots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ExpandableCard
          title="Passes Certos vs Errados"
          icon={BarChart3}
          headerColor="text-green-400"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{(stats.passesCorrect || 0) + (stats.passesWrong || 0)}</span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={legendLabelStyle}
                      formatter={(value: string) => {
                        if (value === 'Passes Certos') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Passes Certos ({stats.passesCorrect || 0})</span>;
                        }
                        if (value === 'Passes Errados') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Passes Errados ({stats.passesWrong || 0})</span>;
                        }
                        return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                      }}
                    />
                    <Bar dataKey="passesCorrect" name="Passes Certos" fill={COLORS.green} stackId="a">
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

        <ExpandableCard
          title="Erros Críticos (Transição)"
          icon={BarChart3}
          headerColor="text-[#ff0055]"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{stats.wrongPassesTransition || 0}</span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 25, right: 0, left: 0, bottom: 0 }} barCategoryGap="15%" barGap={8}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                 <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} interval={0} />
                 <YAxis hide />
                 <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} />
                 <Legend
                   wrapperStyle={legendLabelStyle}
                   formatter={(value: string) => {
                     if (value === 'Passes errados') {
                       return <span className="text-zinc-300" style={legendLabelStyle}>Passes errados ({stats.passesWrong || 0})</span>;
                     }
                     if (value === 'Geraram transição') {
                       return <span className="text-zinc-300" style={legendLabelStyle}>Geraram transição ({stats.wrongPassesTransition || 0})</span>;
                     }
                     return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                   }}
                 />
                 <Bar dataKey="passesWrong" name="Passes errados" radius={[6, 6, 0, 0]} barSize={32} fill={COLORS.slate} fillOpacity={0.9}>
                   <LabelList dataKey="passesWrong" position="top" {...labelStyle} dy={-10} />
                 </Bar>
                 <Bar dataKey="transitionErrors" name="Geraram transição" radius={[6, 6, 0, 0]} barSize={32} fill={COLORS.rose}>
                   <LabelList dataKey="transitionErrors" position="top" {...labelStyle} dy={-10} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           <PlayerStatsTable matches={filteredMatches} statType="criticalErrors" players={players} />
        </ExpandableCard>
      </div>

      {/* Defensive Stats (Tackles & Errors) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ExpandableCard
          title="Tipos de Desarme"
          icon={BarChart3}
          headerColor="text-emerald-400"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{stats.tacklesTotal || 0}</span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={legendLabelStyle}
                      formatter={(value: string) => {
                        if (value === 'Com Posse') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Com Posse ({stats.tacklesWithBall || 0})</span>;
                        }
                        if (value === 'Sem Posse') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Sem Posse ({stats.tacklesWithoutBall || 0})</span>;
                        }
                        if (value === 'Contra-Ataque') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Contra-Ataque ({stats.tacklesCounterAttack || 0})</span>;
                        }
                        return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                      }}
                    />
                    <Bar dataKey="tacklesWithBall" name="Com Posse" fill={COLORS.blueLight}>
                        <LabelList dataKey="tacklesWithBall" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="tacklesWithoutBall" name="Sem Posse" fill={COLORS.blueDark}>
                        <LabelList dataKey="tacklesWithoutBall" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="tacklesCounterAttack" name="Contra-Ataque" fill={COLORS.tackleCounterDark}>
                        <LabelList dataKey="tacklesCounterAttack" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           {/* Tabela de estatísticas por jogador */}
           <PlayerStatsTable matches={filteredMatches} statType="tackles" players={players} />
        </ExpandableCard>

        <ExpandableCard
          title="Defesas"
          icon={BarChart3}
          headerColor="text-purple-400"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{(stats.savesSimple || 0) + (stats.savesHard || 0)}</span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={legendLabelStyle}
                    formatter={(value: string) => {
                      if (value === 'Fácil') {
                        return <span className="text-zinc-300" style={legendLabelStyle}>Fácil ({stats.savesSimple || 0})</span>;
                      }
                      if (value === 'Difícil') {
                        return <span className="text-zinc-300" style={legendLabelStyle}>Difícil ({stats.savesHard || 0})</span>;
                      }
                      return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                    }}
                  />
                  <Bar dataKey="savesSimple" name="Fácil" fill={COLORS.blueCyan}>
                      <LabelList dataKey="savesSimple" position="inside" {...labelStyle} />
                  </Bar>
                  <Bar dataKey="savesHard" name="Difícil" fill={COLORS.blueDarker}>
                      <LabelList dataKey="savesHard" position="inside" {...labelStyle} />
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>
      </div>

      {/* Finalizações (nossas) + Finalizações do adversário */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <ExpandableCard
          title="Finalizações"
          icon={BarChart3}
          headerColor="text-purple-400"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total:{' '}
              <span className="text-white">
                {(stats.shotsOn || 0) + (stats.shotsOff || 0) + (stats.shotsShootZone || 0)}
              </span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={legendLabelStyle}
                      formatter={(value: string) => {
                        if (value === 'No Gol') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>No Gol ({stats.shotsOn || 0})</span>;
                        }
                        if (value === 'Pra Fora') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Pra Fora ({stats.shotsOff || 0})</span>;
                        }
                        if (value === 'Bloqueado') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Bloqueado ({stats.shotsShootZone || 0})</span>;
                        }
                        return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                      }}
                    />
                    <Bar dataKey="shotsOn" name="No Gol" stackId="shots" fill={COLORS.blueMedium}>
                        <LabelList dataKey="shotsOn" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="shotsOff" name="Pra Fora" stackId="shots" fill={COLORS.slate}>
                        <LabelList dataKey="shotsOff" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="shotsShootZone" name="Bloqueado" stackId="shots" fill="#f59e0b">
                        <LabelList dataKey="shotsShootZone" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
           <PlayerStatsTable matches={filteredMatches} statType="shots" players={players} />
        </ExpandableCard>

        <ExpandableCard
          title="Finalizações Adversário"
          icon={BarChart3}
          headerColor="text-red-400"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{(stats.opponentShotsOn || 0) + (stats.opponentShotsOff || 0)}</span>
            </span>
          }
        >
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={axisStyle} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={legendLabelStyle}
                      formatter={(value: string) => {
                        if (value === 'No Gol') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>No Gol ({stats.opponentShotsOn || 0})</span>;
                        }
                        if (value === 'Pra Fora') {
                          return <span className="text-zinc-300" style={legendLabelStyle}>Pra Fora ({stats.opponentShotsOff || 0})</span>;
                        }
                        return <span className="text-zinc-300" style={legendLabelStyle}>{value}</span>;
                      }}
                    />
                    <Bar dataKey="opponentShotsOn" name="No Gol" fill="#ef4444">
                        <LabelList dataKey="opponentShotsOn" position="inside" {...labelStyle} />
                    </Bar>
                    <Bar dataKey="opponentShotsOff" name="Pra Fora" fill={COLORS.slate}>
                        <LabelList dataKey="opponentShotsOff" position="inside" {...labelStyle} />
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>
      </div>

      {/* Row: Goals by Time Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpandableCard title="Gols Feitos por Período" icon={Clock} headerColor="text-[#22c55e]" scoutTitleStyle>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timePeriodData.scoredDist} margin={{ top: 20, right: 30, left: 10, bottom: 72 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={true} />
                    <XAxis dataKey="period" stroke="#71717a" tick={{ ...axisStyle, fontSize: 10 }} angle={-40} textAnchor="end" height={68} interval={0} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} cursor={{stroke: COLORS.green, strokeWidth: 1}} />
                    <Area type="monotone" dataKey="value" fill={COLORS.green} fillOpacity={0.25} stroke="none" />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS.green} 
                        strokeWidth={1.5} 
                        dot={{fill: COLORS.green, r: 4}}
                        activeDot={{r: 6}}
                        name="Gols Feitos"
                    >
                        {/* Rótulos acima da linha (demais períodos) */}
                        <LabelList dataKey="labelTop" position="top" fill="#fff" fontSize={14} fontWeight="normal" fontFamily={CHART_FONT} dy={-25} />
                        {/* Rótulo abaixo da linha só no período com mais gols (amarelo) */}
                        <LabelList dataKey="labelBottom" position="bottom" fill="#eab308" fontSize={14} fontWeight="normal" fontFamily={CHART_FONT} dy={18} />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
           {/* Cartão com porcentagem do maior número de gols feitos por período */}
           <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
             <p className="text-white text-sm" style={legendLabelStyle}>
               <span className="text-[#22c55e]">{timePeriodData.maxScoredPeriod.percentage}%</span> dos gols feitos saíram no período de <span className="text-[#22c55e]">{timePeriodData.maxScoredPeriod.period}</span>
             </p>
           </div>
        </ExpandableCard>

        <ExpandableCard title="Gols Tomados por Período" icon={Clock} headerColor="text-[#ff0055]" scoutTitleStyle>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timePeriodData.concededDist} margin={{ top: 20, right: 30, left: 10, bottom: 72 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={true} />
                    <XAxis dataKey="period" stroke="#71717a" tick={{ ...axisStyle, fontSize: 10 }} angle={-40} textAnchor="end" height={68} interval={0} />
                    <YAxis hide />
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
                        {/* Rótulos acima da linha (demais períodos) */}
                        <LabelList dataKey="labelTop" position="top" fill="#fff" fontSize={14} fontWeight="normal" fontFamily={CHART_FONT} dy={-25} />
                        {/* Rótulo abaixo da linha só no período com mais gols (amarelo) */}
                        <LabelList dataKey="labelBottom" position="bottom" fill="#eab308" fontSize={14} fontWeight="normal" fontFamily={CHART_FONT} dy={18} />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
           {/* Cartão com porcentagem do maior número de gols tomados por período */}
           <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
             <p className="text-white text-sm" style={legendLabelStyle}>
               <span className="text-[#ff0055]">{timePeriodData.maxConcededPeriod.percentage}%</span> dos gols tomados saíram no período de <span className="text-[#ff0055]">{timePeriodData.maxConcededPeriod.period}</span>
             </p>
           </div>
        </ExpandableCard>
      </div>

      {/* Row 3: Donut Charts - gráfico ocupa todo o espaço; legenda em lista no canto esquerdo do rodapé */}
      <div className="flex flex-col gap-6 w-full">
        <ExpandableCard
          title={`Métodos de ${config.labels.goals} Marcado`}
          icon={PieChartIcon}
          headerColor="text-white"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{originScoredData.reduce((s, e) => s + (e.value ?? 0), 0)}</span>
            </span>
          }
        >
        <div className="flex flex-col lg:flex-row min-h-0 w-full gap-6 p-4">
             {/* Gráfico 1: Métodos Detalhados */}
             <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-[320px] bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
               <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 text-center shrink-0 scout-card-title">Métodos Detalhados</h4>
               <div className="flex-1 min-h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                          data={goalMethodsScoredData.map((entry, i) => ({ ...entry, fill: PIE_COLORS_SCORED_DARK[i % PIE_COLORS_SCORED_DARK.length] }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          isAnimationActive={true}
                      >
                          {goalMethodsScoredData.map((entry, index) => (
                              <Cell key={`cell-scored-${index}`} fill={PIE_COLORS_SCORED_DARK[index % PIE_COLORS_SCORED_DARK.length]} stroke="#fff" strokeWidth={1} />
                          ))}
                          <LabelList dataKey="percentage" position="outside" fill="#ffffff" stroke="none" fontSize={10} fontFamily={CHART_FONT} formatter={(v: string) => `${v}%`} />
                      </Pie>
                      <Tooltip
                        contentStyle={{ ...tooltipStyle, color: '#ffffff', border: '1px solid #52525b' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
                      />
                  </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="shrink-0 mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 items-center">
                 {goalMethodsScoredData.map((entry, index) => (
                   <div key={`leg-scored-${index}`} className="flex items-center gap-1.5 min-w-0">
                     <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS_SCORED_DARK[index % PIE_COLORS_SCORED_DARK.length] }} />
                     <span className="text-zinc-400 text-[10px] truncate uppercase" style={legendLabelStyle} title={entry.name}>{entry.name}</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Gráfico 2: Origem (Bola Rolando vs Parada) */}
             <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-[320px] bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
               <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 text-center shrink-0 scout-card-title">Origem do Gol</h4>
               <div className="flex-1 min-h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                          data={goalOriginScoredData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          isAnimationActive={true}
                      >
                          <Cell fill={COLORS.blue} stroke="#fff" strokeWidth={1} />
                          <Cell fill={COLORS.slate} stroke="#fff" strokeWidth={1} />
                          <LabelList dataKey="percentage" position="outside" fill="#ffffff" stroke="none" fontSize={12} fontFamily={CHART_FONT} formatter={(v: string) => `${v}%`} />
                      </Pie>
                      <Tooltip
                        contentStyle={{ ...tooltipStyle, color: '#ffffff', border: '1px solid #52525b' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
                      />
                  </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="shrink-0 mt-4 flex justify-center gap-6 items-center">
                 <div className="flex items-center gap-2">
                   <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                   <span className="text-white text-xs uppercase tracking-tighter" style={legendLabelStyle}>Bola Rolando</span>
                   <span className="text-zinc-500 text-xs" style={legendLabelStyle}>{stats.goalsScoredOpen}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.slate }} />
                   <span className="text-white text-xs uppercase tracking-tighter" style={legendLabelStyle}>Bola Parada</span>
                   <span className="text-zinc-500 text-xs" style={legendLabelStyle}>{stats.goalsScoredSet}</span>
                 </div>
               </div>
             </div>
           </div>
        </ExpandableCard>

        <ExpandableCard
          title={`Métodos de ${config.labels.goals} Tomado`}
          icon={PieChartIcon}
          headerColor="text-white"
          scoutTitleStyle
          headerRight={
            <span className="text-zinc-400 text-xs uppercase tracking-wider" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>
              Total: <span className="text-white">{originConcededData.reduce((s, e) => s + (e.value ?? 0), 0)}</span>
            </span>
          }
        >
        <div className="flex flex-col lg:flex-row min-h-0 w-full gap-6 p-4">
             {/* Gráfico 1: Métodos Detalhados */}
             <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-[320px] bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
               <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 text-center shrink-0 scout-card-title">Métodos Detalhados</h4>
               <div className="flex-1 min-h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                          data={goalMethodsConcededData.map((entry, i) => ({ ...entry, fill: PIE_COLORS_CONCEDED[i % PIE_COLORS_CONCEDED.length] }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          isAnimationActive={true}
                      >
                          {goalMethodsConcededData.map((entry, index) => (
                              <Cell key={`cell-conceded-${index}`} fill={PIE_COLORS_CONCEDED[index % PIE_COLORS_CONCEDED.length]} stroke="#fff" strokeWidth={1} />
                          ))}
                          <LabelList dataKey="percentage" position="outside" fill="#ffffff" stroke="none" fontSize={10} fontFamily={CHART_FONT} formatter={(v: string) => `${v}%`} />
                      </Pie>
                      <Tooltip
                        contentStyle={{ ...tooltipStyle, color: '#ffffff', border: '1px solid #52525b' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
                      />
                  </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="shrink-0 mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 items-center">
                 {goalMethodsConcededData.map((entry, index) => (
                   <div key={`leg-conceded-${index}`} className="flex items-center gap-1.5 min-w-0">
                     <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS_CONCEDED[index % PIE_COLORS_CONCEDED.length] }} />
                     <span className="text-zinc-400 text-[10px] truncate uppercase" style={legendLabelStyle} title={entry.name}>{entry.name}</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Gráfico 2: Origem (Bola Rolando vs Parada) */}
             <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-[320px] bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
               <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 text-center shrink-0 scout-card-title">Origem do Gol</h4>
               <div className="flex-1 min-h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                          data={goalOriginConcededData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          isAnimationActive={true}
                      >
                          <Cell fill={COLORS.blueDarker} stroke="#fff" strokeWidth={1} />
                          <Cell fill={COLORS.slate} stroke="#fff" strokeWidth={1} />
                          <LabelList dataKey="percentage" position="outside" fill="#ffffff" stroke="none" fontSize={12} fontFamily={CHART_FONT} formatter={(v: string) => `${v}%`} />
                      </Pie>
                      <Tooltip
                        contentStyle={{ ...tooltipStyle, color: '#ffffff', border: '1px solid #52525b' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
                      />
                  </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="shrink-0 mt-4 flex justify-center gap-6 items-center">
                 <div className="flex items-center gap-2">
                   <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.blueDarker }} />
                   <span className="text-white text-xs uppercase tracking-tighter" style={legendLabelStyle}>Bola Rolando</span>
                   <span className="text-zinc-500 text-xs" style={legendLabelStyle}>{stats.goalsConcededOpen}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.slate }} />
                   <span className="text-white text-xs uppercase tracking-tighter" style={legendLabelStyle}>Bola Parada</span>
                   <span className="text-zinc-500 text-xs" style={legendLabelStyle}>{stats.goalsConcededSet}</span>
                 </div>
               </div>
             </div>
           </div>
        </ExpandableCard>
      </div>
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
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1 scout-card-title">{title}</p>
            <p className="text-3xl font-black text-white italic">{value}</p>
            {subtitle && <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' }}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-zinc-950/50 border border-zinc-900 ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

// Componente de tabela de estatísticas por jogador
const PlayerStatsTable: React.FC<{matches: MatchRecord[], statType: 'passes' | 'shots' | 'tackles' | 'criticalErrors', players: Player[]}> = ({matches, statType, players}) => {
  const playerStats = useMemo(() => {
    const statsMap = new Map<string, { name: string; correct: number; wrong: number; blocked?: number; total: number }>();

    matches.forEach(match => {
      if (!match.playerStats) return;

      Object.entries(match.playerStats).forEach(([playerId, pStats]) => {
        // Normalizar ID para comparação (string, trim)
        const normalizedPlayerId = String(playerId).trim();

        // Buscar nome do jogador (comparar IDs normalizados)
        const player = players.find(p => String(p.id).trim() === normalizedPlayerId);
        const playerName = player ? player.name : normalizedPlayerId;

        if (!statsMap.has(normalizedPlayerId)) {
          statsMap.set(normalizedPlayerId, { name: playerName, correct: 0, wrong: 0, total: 0 });
        }
        const stats = statsMap.get(normalizedPlayerId)!;

        if (statType === 'passes') {
          stats.correct += pStats.passesCorrect || 0;
          stats.wrong += pStats.passesWrong || 0;
          stats.total += (pStats.passesCorrect || 0) + (pStats.passesWrong || 0);
        } else if (statType === 'shots') {
          const on = pStats.shotsOnTarget || 0;
          const off = pStats.shotsOffTarget || 0;
          const blk = pStats.shotsShootZone || 0;
          stats.correct += on;
          stats.wrong += off;
          stats.blocked = (stats.blocked ?? 0) + blk;
          stats.total += on + off + blk;
        } else if (statType === 'tackles') {
          stats.correct += (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0);
          stats.wrong += pStats.tacklesCounterAttack || 0;
          stats.total += (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0) + (pStats.tacklesCounterAttack || 0);
        } else if (statType === 'criticalErrors') {
          // Comparativo: total de passes errados vs quantos geraram transição
          const totalWrong = pStats.passesWrong || 0;
          const transition =
            (pStats as any).wrongPassesTransition ??
            (pStats as any).transitionErrors ??
            0;

          // Coluna verde: passes errados (comparativo)
          stats.correct += totalWrong;

          // Coluna vermelha: passes errados que geraram transição
          stats.wrong += transition;

          // Total/ordenação: apenas erros que geraram transição
          stats.total += transition;
        }
      });
    });
    
    return Array.from(statsMap.values())
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [matches, statType, players]);

  if (playerStats.length === 0) return null;

  const legendStyle = { fontFamily: 'Calibri', fontWeight: 'normal', fontStyle: 'normal' };
  return (
    <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
      <h4 className="text-white text-xs uppercase mb-3 tracking-wider" style={legendStyle}>
        Top 10 Jogadores - {statType === 'passes' ? 'Passes' : statType === 'shots' ? 'Finalizações' : statType === 'tackles' ? 'Desarmes' : 'Erros Críticos'}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-2 text-zinc-400 uppercase" style={legendStyle}>Jogador</th>
              <th className="text-right py-2 text-zinc-400 uppercase" style={legendStyle}>
                {statType === 'passes'
                  ? 'Certos'
                  : statType === 'shots'
                    ? 'No Gol'
                    : statType === 'tackles'
                      ? 'Total'
                      : 'Passes Errados'}
              </th>
              <th className="text-right py-2 text-zinc-400 uppercase" style={legendStyle}>
                {statType === 'passes'
                  ? 'Errados'
                  : statType === 'shots'
                    ? 'Fora'
                    : statType === 'tackles'
                      ? 'Contra-Ataque'
                      : 'Geraram Transição'}
              </th>
              {statType === 'shots' && (
                <th className="text-right py-2 text-zinc-400 uppercase" style={legendStyle}>
                  Bloqueado
                </th>
              )}
              <th className="text-right py-2 text-zinc-400 uppercase" style={legendStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stat, idx) => (
              <tr key={idx} className="border-b border-zinc-900/50">
                <td className="py-2 text-white" style={legendStyle}>{stat.name}</td>
                <td className="py-2 text-right text-[#10b981]" style={legendStyle}>{stat.correct}</td>
                <td className="py-2 text-right text-[#ff0055]" style={legendStyle}>{stat.wrong}</td>
                {statType === 'shots' && (
                  <td className="py-2 text-right text-amber-400" style={legendStyle}>{stat.blocked ?? 0}</td>
                )}
                <td className="py-2 text-right text-zinc-300" style={legendStyle}>{stat.total}</td>
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


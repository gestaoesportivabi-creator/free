import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Activity, HeartPulse, Clock, AlertTriangle, Printer, Rotate3d, UserMinus, Moon, RefreshCw, TrendingUp, Shield, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { ExpandableCard } from './ExpandableCard';
import { MatchRecord, Player, WeeklySchedule, InjuryRecord } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { exportPhysiologyPdf, PhysiologyPdfData } from '../utils/exportPhysiologyPdf';

const TRAINING_PSE_STORAGE_KEY = 'scout21_training_pse';
const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const PSR_JOGOS_STORAGE_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_STORAGE_KEY = 'scout21_psr_treinos';
const QUALIDADE_SONO_STORAGE_KEY = 'scout21_qualidade_sono';

type StoredQualidadeSono = Record<string, Record<string, number>>;

type ChampionshipMatch = { id: string; date: string; time?: string; opponent: string; competition?: string };
type StoredPseJogos = Record<string, Record<string, number>>;
type StoredPseTreinos = Record<string, Record<string, number>>;
type StoredPsrJogos = Record<string, Record<string, number>>;
type StoredPsrTreinos = Record<string, Record<string, number>>;

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
  const [qualidadeSonoStored, setQualidadeSonoStored] = useState<StoredQualidadeSono>({});

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
    try {
      const raw = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (raw) setQualidadeSonoStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  // Recarregar dados das abas PSE, PSR e Qualidade de sono quando a tab for exibida (para atualizar após preencher nas outras abas)
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
        const q = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
        if (q) setQualidadeSonoStored(JSON.parse(q));
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

    let matchesWithAbsence = 0;
    filteredMatches.forEach(match => {
        const matchDate = new Date(match.date);
        const hasAbsence = filteredInjuries.some(inj => {
            const injDate = new Date(inj.date);
            const endDate = inj.endDate ? new Date(inj.endDate) : new Date();
            if (!inj.endDate) {
                // Se não tem data de fim, calcular baseado em daysOut
                const calculatedEnd = new Date(injDate);
                calculatedEnd.setDate(calculatedEnd.getDate() + inj.daysOut);
                return matchDate >= injDate && matchDate <= calculatedEnd;
            }
            return matchDate >= injDate && matchDate <= endDate;
        });
        if(hasAbsence) matchesWithAbsence++;
    });

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
  }, [filteredMatches, filteredInjuries, championshipMatches, filteredChampionshipMatches, matches, pseJogosStored, playerFilterId]);

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

  // Qualidade de sono: eventos = noite anterior a treino (manhã) + noite anterior a jogo
  const sleepChartData = useMemo(() => {
    const list: { name: string; media: number; type: 'treino' | 'jogo'; eventKey: string }[] = [];
    const seen = new Set<string>();

    const active = schedules.filter(s => s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true');
    active.forEach(s => {
      const flat = normalizeScheduleDays(s);
      flat.forEach(day => {
        const act = (day.activity || '').trim();
        if (act !== 'Treino' && act !== 'Musculação') return;
        const date = day.date || '';
        const time = day.time || '00:00';
        const [h] = time.split(':').map(Number);
        if (!date || (h ?? 0) >= 12) return;
        const eventKey = `treino_${date}`;
        if (seen.has(eventKey)) return;
        seen.add(eventKey);
        const data = qualidadeSonoStored[eventKey];
        const values = data ? Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5) : [];
        const media = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
        list.push({
          name: `${new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} Treino`,
          media,
          type: 'treino',
          eventKey,
        });
      });
    });

    championshipMatches.forEach(m => {
      const eventKey = `jogo_${m.date}`;
      if (seen.has(eventKey)) return;
      seen.add(eventKey);
      const data = qualidadeSonoStored[eventKey];
      const values = data ? Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5) : [];
      const media = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
      list.push({
        name: `${new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} Jogo`,
        media,
        type: 'jogo',
        eventKey,
      });
    });

    list.sort((a, b) => {
      const dateA = a.eventKey.replace('treino_', '').replace('jogo_', '');
      const dateB = b.eventKey.replace('treino_', '').replace('jogo_', '');
      return dateA.localeCompare(dateB);
    });

    return list
      .filter(item => {
        const d = item.eventKey.replace('treino_', '').replace('jogo_', '');
        return dateInRange(d);
      })
      .map(item => {
        if (!playerFilterId) return item;
        const v = qualidadeSonoStored[item.eventKey]?.[playerFilterId];
        const media = typeof v === 'number' ? v : 0;
        return { ...item, media };
      })
      .filter(item => !playerFilterId || item.media > 0);
  }, [schedules, championshipMatches, qualidadeSonoStored, dateInRange, playerFilterId]);

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
      const pdfData: PhysiologyPdfData = {
        filters: {
          dateFrom,
          dateTo,
          playerLabel,
        },
        kpis: {
          avgPseMatch: stats.avgRpeMatch,
          injuriesByOrigin: stats.injuriesByOrigin,
          totalInjuries: stats.totalInjuries,
          matchesWithAbsence: stats.matchesWithAbsence,
        },
        pseMatchData: rpeMatchData,
        pseTrainingData: rpeTrainingData,
        psrMatchData,
        psrTrainingData,
        sleepChartData,
        injuryTypeData,
        injurySideData,
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
            title="Média PSE (Jogos)"
            value={stats.avgRpeMatch}
            icon={Activity}
            color="text-[#ccff00]"
            sub={playerFilterId ? 'Atleta no período · 0–10' : 'Equipe no período · 0–10'}
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
          <KPICardInner title="Jogos com Desfalque" value={stats.matchesWithAbsence} icon={UserMinus} color="text-orange-500" sub="Time desfalcado por lesão" />
        </div>
      </div>

      {/* P1: ACWR - Risco de Lesão */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
        <ExpandableCard title="Evolução PSE (Jogos)" icon={Activity} headerColor="text-[#00f0ff]">
           <p className="text-xs text-zinc-500 mb-2 font-medium">
             {playerFilterId ? 'PSE do atleta por jogo no período. ' : 'Média da equipe por jogo no período. '}
             Preencha na aba <strong>PSE (Treinos e Jogos)</strong>.
           </p>
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

      {sleepChartData.length > 0 && (
        <ExpandableCard title="Média qualidade de sono da equipe" icon={Moon} headerColor="text-[#00f0ff]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">
            {playerFilterId ? 'Qualidade de sono do atleta nas noites do período. ' : 'Média da equipe por noite no período. '}
            Noites anteriores a treino (manhã) e a jogos. Preencha na aba <strong>Qualidade de sono</strong>. Escala 1–5.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepChartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11, fontFamily: 'Calibri' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 5]} stroke="#666" tick={{ fontSize: 12, fontFamily: 'Calibri' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Calibri', borderRadius: '8px' }} formatter={(value: number) => [value, 'Média']} />
                <Bar dataKey="media" radius={[4, 4, 0, 0]} barSize={32} name="Média sono">
                  {sleepChartData.map((entry, index) => (
                    <Cell key={`sono-${index}`} fill={entry.type === 'treino' ? '#10b981' : '#eab308'} />
                  ))}
                  <LabelList dataKey="media" position="top" fill="#fff" fontSize={14} fontFamily="Calibri" fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-3 text-xs">
            <span className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-3 rounded bg-emerald-500" /> Treino (manhã)</span>
            <span className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-3 rounded bg-amber-500" /> Jogo</span>
          </div>
        </ExpandableCard>
      )}

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
               
               <div className="flex-1 flex items-center justify-center bg-black border border-zinc-800 rounded-2xl print:bg-gray-50 print:border-gray-200 p-8 relative overflow-visible min-h-[500px]">
                    <MuscleBodyMap injuries={filteredInjuries} />
               </div>
           </div>
        </ExpandableCard>
      </div>

      {/* P2: Painel Individual do Atleta */}
      {playerFilterId && (() => {
        const athlete = players.find(p => p.id === playerFilterId);
        if (!athlete) return null;
        const acwrInfo = acwrData.find(a => a.playerId === playerFilterId);
        const athleteInjuries = (athlete.injuryHistory || []).sort((a, b) => new Date(b.date || b.startDate).getTime() - new Date(a.date || a.startDate).getTime());
        const activeInjuries = athleteInjuries.filter(i => !i.endDate || new Date(i.endDate) >= new Date());

        const pseHistory: { date: string; value: number }[] = [];
        const psrHistory: { date: string; value: number }[] = [];
        const sonoHistory: { date: string; value: number }[] = [];

        Object.entries(pseTreinosStored).forEach(([key, data]) => {
          const datePart = key.split('_')[0];
          if (!dateInRange(datePart)) return;
          const v = data[playerFilterId];
          if (typeof v === 'number') pseHistory.push({ date: datePart, value: v });
        });
        Object.entries(pseJogosStored).forEach(([matchId, data]) => {
          const v = data[playerFilterId];
          const m = championshipMatches.find(cm => cm.id === matchId);
          if (typeof v === 'number' && m && dateInRange(m.date)) pseHistory.push({ date: m.date, value: v });
        });
        pseHistory.sort((a, b) => a.date.localeCompare(b.date));

        Object.entries(psrTreinosStored).forEach(([key, data]) => {
          const datePart = key.split('_')[0];
          if (!dateInRange(datePart)) return;
          const v = data[playerFilterId];
          if (typeof v === 'number') psrHistory.push({ date: datePart, value: v });
        });
        Object.entries(psrJogosStored).forEach(([matchId, data]) => {
          const v = data[playerFilterId];
          const m = championshipMatches.find(cm => cm.id === matchId);
          if (typeof v === 'number' && m && dateInRange(m.date)) psrHistory.push({ date: m.date, value: v });
        });
        psrHistory.sort((a, b) => a.date.localeCompare(b.date));

        Object.entries(qualidadeSonoStored).forEach(([key, data]) => {
          const raw = key.replace(/^treino_/, '').replace(/^jogo_/, '');
          const d = raw.length >= 10 ? raw.slice(0, 10) : key.split(/_(.*)/)[1] || key;
          if (!dateInRange(d)) return;
          const v = data[playerFilterId];
          if (typeof v === 'number') sonoHistory.push({ date: d, value: v });
        });
        sonoHistory.sort((a, b) => a.date.localeCompare(b.date));

        const lastPse = pseHistory.length > 0 ? pseHistory[pseHistory.length - 1].value : null;
        const lastPsr = psrHistory.length > 0 ? psrHistory[psrHistory.length - 1].value : null;
        const lastSono = sonoHistory.length > 0 ? sonoHistory[sonoHistory.length - 1].value : null;
        const last7Pse = pseHistory.slice(-7);
        const avg7Pse = last7Pse.length > 0 ? Math.round((last7Pse.reduce((a, b) => a + b.value, 0) / last7Pse.length) * 10) / 10 : null;

        const chartData = pseHistory.slice(-14).map(p => {
          const lbl = new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const psr = psrHistory.find(r => r.date === p.date);
          return { date: lbl, pse: p.value, psr: psr?.value ?? null };
        });

        return (
          <div className="bg-black rounded-3xl border border-zinc-800 p-6 shadow-xl animate-fade-in print:hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.name} className="w-14 h-14 rounded-xl object-cover border-2 border-[#00f0ff]/30" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-xl">{(athlete.nickname || athlete.name).charAt(0)}</div>
                )}
                <div>
                  <h3 className="text-white font-black text-xl uppercase tracking-wide">{athlete.nickname || athlete.name}</h3>
                  <p className="text-zinc-500 text-xs font-bold">{athlete.position} · #{athlete.jerseyNumber} · {athlete.age} anos</p>
                </div>
              </div>
              <button type="button" onClick={() => setPlayerFilterId('')} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800 text-xs font-bold uppercase">Limpar atleta ✕</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">ACWR</p>
                <p className={`text-2xl font-black mt-1 ${acwrInfo?.risk === 'green' ? 'text-emerald-400' : acwrInfo?.risk === 'yellow' ? 'text-amber-400' : acwrInfo?.risk === 'red' ? 'text-red-400' : 'text-zinc-500'}`}>{acwrInfo?.acwr ?? '—'}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">PSE (7d)</p>
                <p className="text-2xl font-black text-[#ccff00] mt-1">{avg7Pse ?? '—'}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Último PSR</p>
                <p className="text-2xl font-black text-sky-400 mt-1">{lastPsr ?? '—'}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Último Sono</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{lastSono ?? '—'}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Lesões Ativas</p>
                <p className={`text-2xl font-black mt-1 ${activeInjuries.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{activeInjuries.length}</p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Evolução PSE / PSR (últimas 14 sessões)</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 10]} stroke="#666" hide />
                      <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="pse" stroke="#ccff00" strokeWidth={2} dot={{ fill: '#ccff00', r: 3 }} name="PSE" />
                      <Line type="monotone" dataKey="psr" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }} name="PSR" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {athleteInjuries.length > 0 && (
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">Histórico de Lesões & Return-to-Play</p>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {athleteInjuries.map(inj => {
                    const isActive = !inj.endDate || new Date(inj.endDate) >= new Date();
                    const startD = new Date(inj.date || inj.startDate);
                    const daysElapsed = Math.floor((Date.now() - startD.getTime()) / 86400000);
                    const totalDays = inj.daysOut || 14;
                    const rtpPhases = ['Repouso', 'Exercícios leves', 'Treino parcial', 'Treino completo', 'Liberado'];
                    let currentPhase = 4;
                    if (isActive) {
                      const progress = daysElapsed / totalDays;
                      if (progress < 0.2) currentPhase = 0;
                      else if (progress < 0.4) currentPhase = 1;
                      else if (progress < 0.7) currentPhase = 2;
                      else if (progress < 1.0) currentPhase = 3;
                      else currentPhase = 4;
                    }
                    const estReturn = new Date(startD);
                    estReturn.setDate(estReturn.getDate() + totalDays);

                    return (
                      <div key={inj.id} className="bg-zinc-900/50 rounded-xl px-4 py-3 border border-zinc-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold">{inj.type} — {inj.location} ({inj.side})</p>
                            <p className="text-zinc-500 text-[10px]">{startD.toLocaleDateString('pt-BR')} · {inj.origin} · {inj.severity} · {inj.daysOut ?? '?'} dias previstos</p>
                          </div>
                          {!isActive && <span className="text-[10px] text-emerald-400 font-bold uppercase px-2 py-0.5 bg-emerald-500/10 rounded">Recuperado</span>}
                          {isActive && <span className="text-[10px] text-red-400 font-bold uppercase px-2 py-0.5 bg-red-500/10 rounded">Ativa</span>}
                        </div>
                        {isActive && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1 mb-1.5">
                              {rtpPhases.map((phase, idx) => (
                                <div key={phase} className="flex-1 flex flex-col items-center">
                                  <div className={`w-full h-1.5 rounded-full ${idx <= currentPhase ? (idx < currentPhase ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-zinc-800'}`} />
                                  <span className={`text-[8px] mt-0.5 ${idx === currentPhase ? 'text-amber-400 font-bold' : 'text-zinc-600'}`}>{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-amber-400 font-bold">Fase {currentPhase + 1}: {rtpPhases[currentPhase]}</span>
                              <span className="text-[10px] text-zinc-500">Retorno est.: {estReturn.toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

const MuscleBodyMap: React.FC<InjuryBodyMapProps> = ({ injuries }) => {
    const [view, setView] = useState<'front' | 'back'>('front');

    // Função para normalizar nomes de localização (remove Direito/Esquerdo e mapeia para nomes genéricos)
    const normalizeLocation = (location: string): string => {
        // Primeiro, normaliza removendo acentos e convertendo para minúsculas
        const normalized = location.toLowerCase()
            .replace(/\s*(direito|direita|esquerdo|esquerda)\s*/gi, '')
            .trim();
        
        // Mapeamento de variações para nomes padrão (exatos como estão no bodyPoints)
        const locationMap: Record<string, string> = {
            'coxa posterior': 'Coxa Posterior',
            'coxa anterior': 'Coxa Anterior',
            'tornozelo': 'Tornozelo',
            'joelho': 'Joelho',
            'adutor': 'Adutor',
            'panturrilha': 'Panturrilha',
            'ombro': 'Ombro',
            'pé': 'Pé',
            'pe': 'Pé', // sem acento
            'face': 'Face',
            'cabeça': 'Cabeça',
            'cabeca': 'Cabeça', // sem acento
            'costas': 'Costas',
            'tórax': 'Costas',
            'torax': 'Costas', // sem acento
            'lombar': 'Costas',
        };
        
        const mapped = locationMap[normalized];
        return mapped || location;
    };

    // Definir bodyPoints ANTES do useMemo para poder ser referenciado
    const bodyPoints: Record<string, { front: [number, number] | null, back: [number, number] | null }> = {
        'Cabeça': { front: [50, 8], back: [50, 8] },
        'Face': { front: [50, 12], back: null },
        'Ombro': { front: [28, 22], back: [28, 22] }, 
        'Coxa Anterior': { front: [42, 55], back: null },
        'Coxa Posterior': { front: null, back: [42, 55] },
        'Panturrilha': { front: null, back: [40, 80] },
        'Tornozelo': { front: [40, 88], back: [40, 88] },
        'Joelho': { front: [38, 68], back: null },
        'Adutor': { front: [47, 52], back: null },
        'Costas': { front: null, back: [50, 35] },
        'Pé': { front: [38, 94], back: [38, 94] },
    };

    const locationCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        injuries.forEach(i => {
            const normalized = normalizeLocation(i.location);
            counts[normalized] = (counts[normalized] || 0) + 1;
        });
        return counts;
    }, [injuries]);

    const toggleView = () => {
        setView(prev => prev === 'front' ? 'back' : 'front');
    };

    return (
        <div className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-center group perspective-1000">
            <button 
                onClick={toggleView}
                className="absolute top-4 right-4 z-20 bg-zinc-900 text-white p-2 shadow-lg border border-zinc-700 rounded-xl transition-all hover:bg-zinc-800 flex items-center gap-2 text-xs font-bold uppercase"
            >
                <Rotate3d size={18} className="text-[#10b981]" />
                {view === 'front' ? 'Costas' : 'Frente'}
            </button>
            <div className={`relative w-[300px] h-[600px] scale-100 md:scale-110 overflow-visible`}>
                 <div className={`absolute inset-0 flex justify-center transition-opacity duration-500 ${view === 'back' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                   <div className="relative w-full h-full">
                        <img 
                            src="/anatomy-front.png.png" 
                            alt="Corpo humano - Vista frontal anatômica"
                            className="w-full h-full object-contain filter brightness-90 contrast-105"
                            onError={(e) => {
                                // Fallback para imagem online se a local não carregar
                                const target = e.target as HTMLImageElement;
                                target.src = "https://upload.wikimedia.org/wikipedia/commons/0/03/Gray1217.png";
                                target.onerror = () => {
                                    // Se ambas falharem, tenta SVG
                                    target.src = "/anatomy-front.svg";
                                };
                            }}
                        />
                        {/* Overlay para melhor contraste */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>
                        {/* Mapa de Calor e Flechas de Informação */}
                        <div className="absolute inset-0 w-full h-full overflow-visible">
                            {Object.entries(bodyPoints).map(([location, coords]) => {
                                const count = locationCounts[location as any] || 0;
                                // Filtrar: anterior só mostra de frente, posterior não mostra de frente
                                if (count === 0 || !coords.front) return null;
                                if (location === 'Coxa Posterior' || location === 'Panturrilha' || location === 'Costas') return null; // Posterior não mostra de frente
                                
                                const [x, y] = coords.front;
                                const renderPoints = [[x, y]];
                                if (['Ombro', 'Joelho', 'Tornozelo', 'Coxa Anterior', 'Pé', 'Adutor'].includes(location)) {
                                    renderPoints.push([100 - x, y]);
                                }
                                return renderPoints.map((pt, i) => {
                                    const baseSize = 35; 
                                    const growthFactor = 20; 
                                    const size = baseSize + (count * growthFactor); 
                                    const opacity = (Math.min(0.6 + (count * 0.1), 0.9)) * 0.5;
                                    // Determinar posição da flecha (lado esquerdo ou direito)
                                    const arrowSide = pt[0] < 50 ? 'left' : 'right';
                                    const offsetX = arrowSide === 'left' ? -60 : 60;
                                    const arrowDirection = arrowSide === 'left' ? 'right' : 'left';
                                    
                                    return (
                                        <div key={`${location}-${i}`} className="absolute pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                                            {/* Removido: Mapa de calor - apenas flecha do lado de fora conforme solicitado */}
                                            
                                            {/* Flecha fina apontando para o local (do lado de fora da imagem) */}
                                            <div 
                                                className="absolute"
                                                style={{ 
                                                    left: `${pt[0]}%`,
                                                    top: `${pt[1]}%`,
                                                    transform: `translate(${arrowSide === 'left' ? '-100%' : '0'}, -50%)`,
                                                    zIndex: 10
                                                }}
                                            >
                                                {/* Linha da flecha */}
                                                <div 
                                                    className="absolute bg-red-500"
                                                    style={{
                                                        width: '40px',
                                                        height: '2px',
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '0' : 'auto',
                                                        right: arrowSide === 'right' ? '0' : 'auto',
                                                        transform: 'translateY(-50%)',
                                                        transformOrigin: arrowSide === 'left' ? 'right center' : 'left center'
                                                    }}
                                                ></div>
                                                {/* Ponta da flecha */}
                                                <div 
                                                    className="absolute"
                                                    style={{
                                                        width: 0,
                                                        height: 0,
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '0' : 'auto',
                                                        right: arrowSide === 'right' ? '0' : 'auto',
                                                        transform: 'translateY(-50%)',
                                                        borderTop: '4px solid transparent',
                                                        borderBottom: '4px solid transparent',
                                                        [arrowSide === 'left' ? 'borderRight' : 'borderLeft']: '6px solid #ef4444'
                                                    }}
                                                ></div>
                                                {/* Texto com quantidade e nome */}
                                                <div 
                                                    className="absolute text-white whitespace-nowrap"
                                                    style={{
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '-80px' : '50px',
                                                        transform: 'translateY(-50%)',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        textShadow: '0 0 4px rgba(0,0,0,0.8)'
                                                    }}
                                                >
                                                    <div className="text-red-400">{location}</div>
                                                    <div className="text-red-300 text-[10px]">{count} {count === 1 ? 'lesão' : 'lesões'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </div>
                </div>
                <div className={`absolute inset-0 flex justify-center transition-opacity duration-500 ${view === 'front' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                   <div className="relative w-full h-full">
                        <img 
                            src="/anatomy-back.png.png" 
                            alt="Corpo humano - Vista posterior anatômica"
                            className="w-full h-full object-contain filter brightness-90 contrast-105"
                            onError={(e) => {
                                // Fallback para imagem online se a local não carregar
                                const target = e.target as HTMLImageElement;
                                target.src = "https://upload.wikimedia.org/wikipedia/commons/9/9e/Gray1218.png";
                                target.onerror = () => {
                                    // Se ambas falharem, tenta SVG
                                    target.src = "/anatomy-back.svg";
                                };
                            }}
                        />
                        {/* Overlay para melhor contraste */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>
                        {/* Mapa de Calor e Flechas de Informação */}
                        <div className="absolute inset-0 w-full h-full overflow-visible">
                            {Object.entries(bodyPoints).map(([location, coords]) => {
                                const count = locationCounts[location as any] || 0;
                                // Filtrar: posterior só mostra de costa, anterior não mostra de costa
                                if (count === 0 || !coords.back) return null;
                                if (location === 'Coxa Anterior' || location === 'Joelho' || location === 'Adutor' || location === 'Face') return null; // Anterior não mostra de costa
                                
                                const [x, y] = coords.back;
                                const renderPoints = [[x, y]];
                                if (['Ombro', 'Panturrilha', 'Tornozelo', 'Coxa Posterior', 'Pé'].includes(location)) {
                                    renderPoints.push([100 - x, y]);
                                }
                                return renderPoints.map((pt, i) => {
                                    const baseSize = 35; 
                                    const growthFactor = 20;
                                    const size = baseSize + (count * growthFactor); 
                                    const opacity = (Math.min(0.6 + (count * 0.1), 0.9)) * 0.5;
                                    // Determinar posição da flecha (lado esquerdo ou direito)
                                    const arrowSide = pt[0] < 50 ? 'left' : 'right';
                                    const offsetX = arrowSide === 'left' ? -60 : 60;
                                    
                                    return (
                                        <div key={`${location}-back-${i}`} className="absolute pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                                            {/* Removido: Mapa de calor - apenas flecha do lado de fora conforme solicitado */}
                                            
                                            {/* Flecha fina apontando para o local (do lado de fora da imagem) */}
                                            <div 
                                                className="absolute"
                                                style={{ 
                                                    left: `${pt[0]}%`,
                                                    top: `${pt[1]}%`,
                                                    transform: `translate(${arrowSide === 'left' ? '-100%' : '0'}, -50%)`,
                                                    zIndex: 10
                                                }}
                                            >
                                                {/* Linha da flecha */}
                                                <div 
                                                    className="absolute bg-red-500"
                                                    style={{
                                                        width: '40px',
                                                        height: '2px',
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '0' : 'auto',
                                                        right: arrowSide === 'right' ? '0' : 'auto',
                                                        transform: 'translateY(-50%)',
                                                        transformOrigin: arrowSide === 'left' ? 'right center' : 'left center'
                                                    }}
                                                ></div>
                                                {/* Ponta da flecha */}
                                                <div 
                                                    className="absolute"
                                                    style={{
                                                        width: 0,
                                                        height: 0,
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '0' : 'auto',
                                                        right: arrowSide === 'right' ? '0' : 'auto',
                                                        transform: 'translateY(-50%)',
                                                        borderTop: '4px solid transparent',
                                                        borderBottom: '4px solid transparent',
                                                        [arrowSide === 'left' ? 'borderRight' : 'borderLeft']: '6px solid #ef4444'
                                                    }}
                                                ></div>
                                                {/* Texto com quantidade e nome */}
                                                <div 
                                                    className="absolute text-white whitespace-nowrap"
                                                    style={{
                                                        top: '50%',
                                                        left: arrowSide === 'left' ? '-80px' : '50px',
                                                        transform: 'translateY(-50%)',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        textShadow: '0 0 4px rgba(0,0,0,0.8)'
                                                    }}
                                                >
                                                    <div className="text-red-400">{location}</div>
                                                    <div className="text-red-300 text-[10px]">{count} {count === 1 ? 'lesão' : 'lesões'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <span className="text-red-500">Frequência de lesões por região</span>
            </div>
        </div>
    );
};
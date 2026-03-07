import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Activity, HeartPulse, Clock, AlertTriangle, Printer, Rotate3d, Filter, UserMinus, Moon } from 'lucide-react';
import { ExpandableCard } from './ExpandableCard';
import { MatchRecord, Player, WeeklySchedule, InjuryRecord } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';

const TRAINING_PSE_STORAGE_KEY = 'scout21_training_pse';
const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const QUALIDADE_SONO_STORAGE_KEY = 'scout21_qualidade_sono';

type StoredQualidadeSono = Record<string, Record<string, number>>;

type ChampionshipMatch = { id: string; date: string; time?: string; opponent: string; competition?: string };
type StoredPseJogos = Record<string, Record<string, number>>;
type StoredPseTreinos = Record<string, Record<string, number>>;

interface PhysicalScoutProps {
    matches: MatchRecord[];
    players: Player[];
    schedules?: WeeklySchedule[];
    championshipMatches?: ChampionshipMatch[];
}

export const PhysicalScout: React.FC<PhysicalScoutProps> = ({ matches, players, schedules = [], championshipMatches = [] }) => {
  const [injuryFilter, setInjuryFilter] = useState<string>('Todos');
  const [monthFilter, setMonthFilter] = useState<string>('Todos');
  const [compFilter, setCompFilter] = useState<string>('Todas');
  const [trainingPse, setTrainingPse] = useState<Record<string, number>>({});
  const [pseJogosStored, setPseJogosStored] = useState<StoredPseJogos>({});
  const [pseTreinosStored, setPseTreinosStored] = useState<StoredPseTreinos>({});
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
      const raw = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (raw) setQualidadeSonoStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  // Recarregar dados das abas PSE e Qualidade de sono quando a tab for exibida (para atualizar após preencher nas outras abas)
  useEffect(() => {
    const onStorage = () => {
      try {
        const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
        if (j) setPseJogosStored(JSON.parse(j));
        const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
        if (t) setPseTreinosStored(JSON.parse(t));
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

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
        const matchMonth = monthFilter === 'Todos' || new Date(m.date).getMonth().toString() === monthFilter;
        const matchComp = compFilter === 'Todas' || m.competition === compFilter;
        return matchMonth && matchComp;
    });
  }, [monthFilter, compFilter, matches]);

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

  // Usar dados reais de lesões dos jogadores (injuryHistory)
  const filteredInjuries = useMemo(() => {
    const allInjuries: InjuryRecord[] = [];
    // Coletar todas as lesões dos jogadores
    players.forEach(player => {
      if (player.injuryHistory && player.injuryHistory.length > 0) {
        player.injuryHistory.forEach(injury => {
          allInjuries.push(injury);
        });
      }
    });
    
    return allInjuries.filter(i => {
        const date = new Date(i.date);
        const matchMonth = monthFilter === 'Todos' || date.getMonth().toString() === monthFilter;
        const matchType = injuryFilter === 'Todos' || i.type === injuryFilter;
        return matchMonth && matchType;
    });
  }, [injuryFilter, monthFilter, players]);

  const filteredTraining = useMemo(() => {
    const list = trainingDatesFromSchedules
      .map(date => ({ date, avgRpe: trainingPse[date] ?? undefined }))
      .filter(t => monthFilter === 'Todos' || new Date(t.date).getMonth().toString() === monthFilter);
    return list;
  }, [monthFilter, trainingDatesFromSchedules, trainingPse]);

  // Dados do gráfico Média PSE (Treinos): média da equipe por sessão (aba Média PSE Treinos); fallback por data
  const rpeTrainingDataFromSessions = useMemo(() => {
    return trainingSessionsForChart
      .filter(s => monthFilter === 'Todos' || new Date(s.date).getMonth().toString() === monthFilter)
      .map(s => {
        const teamAvg = teamAveragePseTreinos(s.sessionKey);
        const dateLabel = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const hour = s.time ? s.time.slice(0, 5) : '';
        const label = hour ? `${dateLabel} ${hour}` : dateLabel;
        return {
          date: label,
          dateKey: s.date,
          rpe: teamAvg ?? 0,
          type: 'Treino'
        };
      });
  }, [trainingSessionsForChart, monthFilter, pseTreinosStored]);

  const stats = useMemo(() => {
    let avgRpeMatch: string | number = 0;
    let totalMatches = filteredMatches.length;
    if (championshipMatches.length > 0) {
      const filtered = championshipMatches
        .filter(m => monthFilter === 'Todos' || new Date(m.date).getMonth().toString() === monthFilter)
        .filter(m => compFilter === 'Todas' || m.competition === compFilter);
      const values = filtered
        .map(m => teamAveragePseJogos(m.id) ?? matches.find(s => s.date === m.date)?.teamStats?.rpeMatch)
        .filter((v): v is number => v != null && typeof v === 'number');
      totalMatches = filtered.length;
      avgRpeMatch = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
    } else {
      const totalRpe = filteredMatches.reduce((acc, curr) => acc + (curr.teamStats.rpeMatch || 0), 0);
      avgRpeMatch = totalMatches > 0 ? (totalRpe / totalMatches).toFixed(1) : 0;
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
  }, [filteredMatches, filteredInjuries, championshipMatches, monthFilter, compFilter, matches, pseJogosStored]);

  // Evolução PSE (Jogos): média da equipe a partir da aba Evolução PSE (Jogos); fallback para partidas salvas
  const rpeMatchData = useMemo(() => {
    if (championshipMatches.length > 0) {
      const sorted = [...championshipMatches].sort((a, b) => a.date.localeCompare(b.date));
      return sorted
        .filter(m => monthFilter === 'Todos' || new Date(m.date).getMonth().toString() === monthFilter)
        .filter(m => compFilter === 'Todas' || m.competition === compFilter)
        .map(m => {
          const teamAvg = teamAveragePseJogos(m.id);
          const saved = matches.find(s => s.date === m.date);
          const rpe = teamAvg ?? saved?.teamStats?.rpeMatch ?? 0;
          return {
            date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            rpe,
            opponent: m.opponent,
            result: saved?.result
          };
        });
    }
    return filteredMatches.map(m => ({
      date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      rpe: m.teamStats.rpeMatch ?? 0,
      opponent: m.opponent,
      result: m.result
    }));
  }, [championshipMatches, matches, filteredMatches, monthFilter, compFilter, pseJogosStored]);

  const rpeTrainingData = trainingSessionsForChart.length > 0
    ? rpeTrainingDataFromSessions
    : filteredTraining.map(t => ({
        date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dateKey: t.date,
        rpe: t.avgRpe ?? 0,
        type: 'Treino'
      }));

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
    return list;
  }, [schedules, championshipMatches, qualidadeSonoStored]);

  const injuryTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInjuries.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [monthFilter]);

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

  const handlePrint = () => {
    window.print();
  };
  
  const handleBarClick = (data: any) => {
      if (data && data.name) {
          setInjuryFilter(data.name === injuryFilter ? 'Todos' : data.name);
      }
  };

  const injuryTypes = ['Todos', 'Muscular', 'Trauma', 'Articular', 'Outros'];

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:p-0 print:space-y-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black p-6 rounded-3xl shadow-lg border border-zinc-800 print:border-none print:shadow-none print:p-0 print:mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 print:text-black italic uppercase tracking-tighter">
            <HeartPulse className="text-[#10b981] print:text-black" /> 
            Departamento de Fisiologia
          </h2>
          <p className="text-zinc-500 text-sm mt-1 print:text-gray-600 font-medium">Relatório de Carga & Mapa de Lesões</p>
        </div>
        
        <div className="flex gap-4 print:hidden">
            <div className="flex items-center bg-zinc-950/50 border border-zinc-800 px-3 rounded-xl">
                 <Filter size={16} className="text-zinc-500 mr-2"/>
                 
                 <select 
                    value={compFilter}
                    onChange={(e) => setCompFilter(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 outline-none cursor-pointer font-medium mr-4 border-r border-zinc-800 pr-4"
                >
                    <option value="Todas">Todas Competições</option>
                    <option value="Copa Santa Catarina">Copa SC</option>
                    <option value="Série Prata">Série Prata</option>
                    <option value="JASC">JASC</option>
                </select>

                 <select 
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 outline-none cursor-pointer font-medium mr-4 border-r border-zinc-800 pr-4"
                >
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>

                <select 
                    value={injuryFilter}
                    onChange={(e) => setInjuryFilter(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 outline-none cursor-pointer font-medium"
                >
                    {injuryTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#34d399] text-white px-4 py-2 font-bold transition-colors uppercase tracking-wider rounded-xl"
            >
            <Printer size={20} />
            PDF
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <ExpandableCard noPadding headerColor='text-[#ccff00]'>
            <KPICardInner 
                title="Média PSE (Jogos)" 
                value={stats.avgRpeMatch} 
                icon={Activity} 
                color="text-[#ccff00]" 
                sub="Escala 0-10"
            />
        </ExpandableCard>
        <ExpandableCard noPadding headerColor='text-[#10b981]'>
            <div className="p-6 h-full flex flex-col justify-center bg-black/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest print:text-gray-500 mb-3">Lesões por Origem</p>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                <span className="text-white text-lg font-black print:text-black">Treino: {stats.injuriesByOrigin.treino}</span>
                            </div>
                            <span className="text-zinc-600 text-xl font-bold">|</span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                <span className="text-white text-lg font-black print:text-black">Jogo: {stats.injuriesByOrigin.jogo}</span>
                            </div>
                            <span className="text-zinc-600 text-xl font-bold">|</span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                <span className="text-white text-lg font-black print:text-black">Outros: {stats.injuriesByOrigin.outros}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`p-4 bg-black border border-zinc-800 rounded-xl print:bg-gray-100 shadow-sm ml-4`}>
                        <AlertTriangle size={28} className="text-[#10b981]" />
                    </div>
                </div>
            </div>
        </ExpandableCard>
        <ExpandableCard noPadding headerColor='text-[#ff0055]'>
            <KPICardInner 
                title="Lesões (Filtro)" 
                value={stats.totalInjuries} 
                icon={AlertTriangle} 
                color="text-[#ff0055]" 
                sub={injuryFilter === 'Todos' ? 'Total Temporada' : `Tipo: ${injuryFilter}`}
            />
        </ExpandableCard>
        <ExpandableCard noPadding headerColor='text-[#7000ff]'>
            <KPICardInner 
                title="Jogos com Desfalque" 
                value={stats.matchesWithAbsence} 
                icon={UserMinus} 
                color="text-orange-500" 
                sub="Time desfalcado por lesão"
            />
        </ExpandableCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
        <ExpandableCard title="Evolução PSE (Jogos)" icon={Activity} headerColor="text-[#ccff00]">
           <p className="text-xs text-zinc-500 mb-2 font-medium">Média geral da equipe por jogo. Preencha na aba <strong>PSE (Treinos e Jogos)</strong>.</p>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeMatchData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12, fontFamily: 'Poppins'}} />
                    <YAxis domain={[0, 12]} stroke="#666" hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Poppins', borderRadius: '8px' }}
                        cursor={{stroke: '#ccff00'}}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="rpe" 
                        stroke="#ccff00" 
                        strokeWidth={4} 
                        dot={{fill: '#ccff00', r: 5}} 
                        activeDot={{r: 8}} 
                        name="PSE Média equipe"
                    >
                        <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Poppins" />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>

        <ExpandableCard title="Média PSE (Treinos)" icon={Activity} headerColor="text-[#10b981]">
           <p className="text-xs text-zinc-500 mb-2 font-medium">Média geral da equipe por sessão (Treino ou Musculação). Preencha na aba <strong>PSE (Treinos e Jogos)</strong>.</p>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeTrainingData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12, fontFamily: 'Poppins'}} />
                    <YAxis domain={[0, 12]} stroke="#666" hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Poppins', borderRadius: '8px' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="rpe" 
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{fill: '#10b981', r: 5}}
                        name="PSE Média equipe"
                    >
                         <LabelList dataKey="rpe" position="top" fill="#fff" fontSize={14} fontFamily="Poppins" />
                    </Line>
                </LineChart>
             </ResponsiveContainer>
           </div>
        </ExpandableCard>
      </div>

      {sleepChartData.length > 0 && (
        <ExpandableCard title="Média qualidade de sono da equipe" icon={Moon} headerColor="text-indigo-400">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Noites anteriores a treino (manhã) e a jogos. Preencha na aba <strong>Qualidade de sono</strong>. Escala 1-5.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepChartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11, fontFamily: 'Poppins' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 5]} stroke="#666" tick={{ fontSize: 12, fontFamily: 'Poppins' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Poppins', borderRadius: '8px' }} formatter={(value: number) => [value, 'Média']} />
                <Bar dataKey="media" radius={[4, 4, 0, 0]} barSize={32} name="Média sono">
                  {sleepChartData.map((entry, index) => (
                    <Cell key={`sono-${index}`} fill={entry.type === 'treino' ? '#10b981' : '#eab308'} />
                  ))}
                  <LabelList dataKey="media" position="top" fill="#fff" fontSize={14} fontFamily="Poppins" fontWeight="bold" />
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
        <ExpandableCard title="Distribuição por Tipo" icon={AlertTriangle} headerColor="text-[#ff0055]">
           <p className="text-xs text-zinc-500 mb-4 font-medium">Clique na barra para filtrar o mapa corporal.</p>
           <div className="h-96 min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={injuryTypeData} 
                    layout="vertical" 
                    margin={{left: 30, right: 30, top: 10, bottom: 10}}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#666" allowDecimals={false} hide />
                    <YAxis dataKey="name" type="category" stroke="#71717a" width={80} tick={{fontFamily: 'Poppins', fontSize: 14}} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: 'Poppins', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} name="Ocorrências">
                      {injuryTypeData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === injuryFilter ? '#ff0055' : '#27272a'} 
                            stroke={entry.name === injuryFilter ? '#fff' : 'none'}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" fill="#fff" fontSize={14} fontWeight="bold" fontFamily="Poppins" />
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

        <ExpandableCard title="Mapa de Calor (Heatmap)" icon={AlertTriangle} headerColor="text-red-600">
           <div className="flex flex-col h-full">
               <div className="mb-4 flex justify-end">
                    <span className="text-xs text-white font-black tracking-wider bg-red-600 px-3 py-1 rounded-full uppercase">
                        {injuryFilter}
                    </span>
               </div>
               
               <div className="flex-1 flex items-center justify-center bg-black border border-zinc-800 rounded-2xl print:bg-gray-50 print:border-gray-200 p-8 relative overflow-visible min-h-[500px]">
                    <MuscleBodyMap injuries={filteredInjuries} />
               </div>
           </div>
        </ExpandableCard>
      </div>

    </div>
  );
};

const KPICardInner: React.FC<{ title: string; value: string | number; icon: any; color: string; sub: string }> = ({ title, value, icon: Icon, color, sub }) => (
    <div className="p-6 h-full flex flex-col justify-center bg-black/50">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest print:text-gray-500">{title}</p>
                <p className="text-4xl font-bold text-white mt-2 print:text-black">{value}</p>
                <p className="text-zinc-600 text-[10px] mt-1 print:text-gray-400 font-medium uppercase">{sub}</p>
            </div>
            <div className={`p-4 bg-black border border-zinc-800 rounded-xl print:bg-gray-100 shadow-sm`}>
                <Icon size={28} className={color.replace('text-', 'text-')} />
            </div>
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
                <span className="text-red-500">Intensidade por raio e cor</span>
            </div>
        </div>
    );
};
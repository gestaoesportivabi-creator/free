import React, { useMemo, useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { GeneralScout } from './components/GeneralScout';
import { IndividualScout } from './components/IndividualScout';
import { PhysicalScout } from './components/PhysicalScout';
import { PhysicalAssessmentTab } from './components/PhysicalAssessment'; 
import { VideoScout } from './components/VideoScout';
import { Settings } from './components/Settings';
import { ScoutTable } from './components/ScoutTable';
import { TeamManagement } from './components/TeamManagement';
import { StatsRanking } from './components/StatsRanking';
import { Schedule } from './components/Schedule';
import { Academia } from './components/Academia';
import { PseTab } from './components/PseTab';
import { QualidadeSonoTab } from './components/QualidadeSonoTab';
import { LoadingMessage } from './components/LoadingMessage';
import { ChampionshipTable, ChampionshipMatch } from './components/ChampionshipTable';
import { SuspensionsAlert } from './components/SuspensionsAlert';
import { InjuredPlayersAlert } from './components/InjuredPlayersAlert';
import { TabBackgroundWrapper } from './components/TabBackgroundWrapper';
import { ManagementReport } from './components/ManagementReport';
import { NextMatchAlert } from './components/NextMatchAlert';
import { RealtimeScoutPage } from './components/RealtimeScoutPage';
import { DashboardTodayBlock } from './components/DashboardTodayBlock';
import { DashboardSquadAvailability } from './components/DashboardSquadAvailability';
import { DashboardNextGameCard } from './components/DashboardNextGameCard';
import { DashboardConditionCard } from './components/DashboardConditionCard';
import { SPORT_CONFIGS } from './constants';
import { BarChart3, FileText, Clock, Trophy, Ambulance, UserX, UserCheck } from 'lucide-react';
import { User, MatchRecord, Player, PhysicalAssessment, WeeklySchedule, StatTargets, PlayerTimeControl, Team, Championship } from './types';
import { playersApi, matchesApi, assessmentsApi, schedulesApi, competitionsApi, statTargetsApi, timeControlsApi, championshipMatchesApi, teamsApi } from './services/api';
import { normalizeScheduleDays } from './utils/scheduleUtils';
import { getChampionshipCards, getPlayerStatus } from './utils/championshipCards';

const SLIDES = [
    {
        img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop",
        quote: "A força do time está em cada membro. A força de cada membro é o time.",
        author: "Phil Jackson"
    },
    {
        img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070&auto=format&fit=crop",
        quote: "A disciplina é a ponte entre metas e realizações.",
        author: "Jim Rohn"
    },
    {
        img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop",
        quote: "Concentre-se em onde você quer chegar, não no que você teme.",
        author: "Tony Robbins"
    },
    {
        img: "https://images.unsplash.com/photo-1517466787929-bc90951d0528?q=80&w=2070&auto=format&fit=crop",
        quote: "Não diminua a meta. Aumente o esforço.",
        author: "Mentalidade de Elite"
    },
    {
        img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop",
        quote: "Os vencedores nunca desistem, e os que desistem nunca vencem.",
        author: "Vince Lombardi"
    },
    {
        img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop",
        quote: "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta.",
        author: "Winston Churchill"
    },
    {
        img: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=2070&auto=format&fit=crop",
        quote: "O trabalho em equipe faz o sonho funcionar.",
        author: "Michael Jordan"
    },
    {
        img: "https://images.unsplash.com/photo-1594736797933-d0cbc3dc5bdb?q=80&w=2070&auto=format&fit=crop",
        quote: "A excelência não é um ato, mas um hábito.",
        author: "Aristóteles"
    }
];

export default function App() {
  // Route state: 'landing' | 'login' | 'register' | 'app'
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  
  // User Session (Not persisted for security in this demo, but could be)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scoutWindowOpen, setScoutWindowOpen] = useState(false); // true quando a janela Scout da Partida está aberta (para esconder a sidebar)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Persisted States - Inicializados vazios, serão carregados da API
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [competitions, setCompetitions] = useState<string[]>([]);
  const [timeControls, setTimeControls] = useState<PlayerTimeControl[]>([]);
  const [championshipMatches, setChampionshipMatches] = useState<ChampionshipMatch[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Stats Targets State
  const [statTargets, setStatTargets] = useState<StatTargets>({
      goals: 3,
      assists: 3,
      passesCorrect: 30,
      passesWrong: 5,
      shotsOn: 8,
      shotsOff: 5,
      tacklesPossession: 10,
      tacklesNoPossession: 10,
      tacklesCounter: 5,
      transitionError: 2
  });
  
  const config = SPORT_CONFIGS['futsal'];

  const normalizeResult = (result: MatchRecord['result'] | string | undefined) => {
    if (result === 'Vitória' || result === 'V') return 'V';
    if (result === 'Derrota' || result === 'D') return 'D';
    if (result === 'Empate' || result === 'E') return 'E';
    return undefined;
  };

  const overviewStats = useMemo(() => {
    const totals = matches.reduce(
      (acc, match) => {
        const normalizedResult = normalizeResult(match.result);
        acc.totalGames += 1;
        if (normalizedResult === 'V') acc.wins += 1;
        if (normalizedResult === 'D') acc.losses += 1;
        if (normalizedResult === 'E') acc.draws += 1;

        if (match.playerStats) {
          Object.entries(match.playerStats).forEach(([playerId, stats]) => {
            if (!stats) return;
            const goals = stats.goals || 0;
            if (goals <= 0) return;
            acc.goalsByPlayer.set(playerId, (acc.goalsByPlayer.get(playerId) || 0) + goals);
          });
        }

        return acc;
      },
      {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsByPlayer: new Map<string, number>()
      }
    );

    let topScorerId: string | null = null;
    let topScorerGoals = 0;
    totals.goalsByPlayer.forEach((goals, playerId) => {
      if (goals > topScorerGoals) {
        topScorerGoals = goals;
        topScorerId = playerId;
      }
    });

    const topScorerName =
      topScorerId ? players.find(player => player.id === topScorerId)?.name || 'Atleta' : '—';

    const now = new Date();
    const year = now.getFullYear();
    const injuriesThisYear = players.reduce((acc, player) => {
      const injuries = player.injuryHistory || [];
      injuries.forEach(injury => {
        const dateValue =
          injury.startDate || injury.date || injury.endDate || injury.returnDate || injury.returnDateActual;
        if (!dateValue) return;
        const injuryDate = new Date(dateValue);
        if (!Number.isNaN(injuryDate.getTime()) && injuryDate.getFullYear() === year) {
          acc += 1;
        }
      });
      return acc;
    }, 0);

    const upcomingMatches = championshipMatches
      .map(match => ({
        ...match,
        dateTime: new Date(`${match.date}T${match.time || '00:00'}`)
      }))
      .filter(match => !Number.isNaN(match.dateTime.getTime()) && match.dateTime >= now)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const nextMatch = upcomingMatches[0];

    return {
      totalAthletes: players.length,
      totalGames: totals.totalGames,
      wins: totals.wins,
      losses: totals.losses,
      draws: totals.draws,
      topScorerName,
      topScorerGoals,
      injuriesThisYear,
      currentYear: year,
      nextMatch
    };
  }, [matches, players, championshipMatches]);

  // Atualizar a cada minuto para contagem regressiva ao vivo
  const [liveNow, setLiveNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setLiveNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Próximo compromisso: o mais próximo entre próximo jogo e próximo treino (hoje/futuro)
  const nextCommitment = useMemo(() => {
    const now = liveNow;
    const todayStr = now.toISOString().split('T')[0];

    const candidates: { dateTime: Date; type: 'jogo' | 'treino'; label: string; competition?: string }[] = [];

    if (overviewStats.nextMatch) {
      const m = overviewStats.nextMatch;
      const [y, mo, d] = (m.date || '').split('-').map(Number);
      const [h = 0, min = 0] = (m.time || '00:00').split(':').map(Number);
      const dt = new Date(y, (mo || 1) - 1, d || 0, h, min);
      if (!Number.isNaN(dt.getTime()) && dt >= now) {
        candidates.push({
          dateTime: dt,
          type: 'jogo',
          label: `${m.team || 'Time'} x ${m.opponent || 'Adversário'}`,
          competition: m.competition
        });
      }
    }

    const activeSchedules = (schedules || []).filter(
      s => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true') && s.days && Array.isArray(s.days)
    );
    activeSchedules.forEach(s => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach(day => {
          const date = (day as { date?: string }).date || '';
          const time = (day as { time?: string }).time || '00:00';
          const activity = (day as { activity?: string }).activity || '';
          if (!date || date < todayStr) return;
          const [h = 0, m = 0] = time.split(':').map(Number);
          const dt = new Date(date + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
          if (Number.isNaN(dt.getTime()) || dt < now) return;
          candidates.push({
            dateTime: dt,
            type: 'treino',
            label: activity || 'Treino'
          });
        });
      } catch (_) {}
    });

    candidates.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    const first = candidates[0];
    if (!first) return null;
    const diff = first.dateTime.getTime() - now.getTime();
    const within24h = diff > 0 && diff <= 24 * 60 * 60 * 1000;
    const hours = within24h ? Math.floor(diff / (1000 * 60 * 60)) : null;
    const minutes = within24h ? Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)) : null;
    return { ...first, countdown: hours != null && minutes != null ? { hours, minutes } : null };
  }, [overviewStats.nextMatch, schedules, liveNow]);

  // Contagens para alertas resumidos (lesões ativas, suspensos, pendurados)
  const dashboardAlertCounts = useMemo(() => {
    const injuredCount = players.filter(p => {
      if (!p.injuryHistory?.length) return false;
      return p.injuryHistory.some(inj => !(inj.returnDateActual || inj.endDate));
    }).length;

    let suspendedCount = 0;
    let penduradosCount = 0;
    const nextMatch = overviewStats.nextMatch;
    if (nextMatch?.competition && championships?.length) {
      const champ = championships.find(c => c.name === nextMatch.competition);
      if (champ?.suspensionRules) {
        const rules = champ.suspensionRules;
        const cards = getChampionshipCards(champ.id);
        players.forEach(p => {
          const status = getPlayerStatus(champ.id, p.id, rules);
          if (status.suspended) suspendedCount++;
          else if (status.pendurado) penduradosCount++;
        });
      }
    }
    return { injuredCount, suspendedCount, penduradosCount };
  }, [players, overviewStats.nextMatch, championships]);

  // Foco do dia: preparação para próximo jogo ou atividade do dia (treino)
  const focusOfDay = useMemo(() => {
    if (nextCommitment?.type === 'jogo') {
      const opp = overviewStats.nextMatch?.opponent || 'próximo jogo';
      return `Preparação para ${opp}`;
    }
    if (nextCommitment?.type === 'treino') {
      return nextCommitment.label || 'Treino';
    }
    const todayStr = liveNow.toISOString().split('T')[0];
    const activeSchedules = (schedules || []).filter(
      s => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true') && s.days && Array.isArray(s.days)
    );
    for (const s of activeSchedules) {
      try {
        const flat = normalizeScheduleDays(s);
        const today = flat.find((d: { date?: string }) => d.date === todayStr);
        if (today && (today as { activity?: string }).activity) {
          return (today as { activity: string }).activity;
        }
      } catch (_) {}
    }
    return 'Dia sem compromisso registrado';
  }, [nextCommitment, overviewStats.nextMatch, schedules, liveNow]);

  // Lesões com início nos últimos 7 dias (para tendência semanal)
  const injuriesLast7Days = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let count = 0;
    players.forEach(p => {
      (p.injuryHistory || []).forEach(inj => {
        const dateValue = inj.startDate || inj.date;
        if (!dateValue) return;
        const d = new Date(dateValue);
        if (!Number.isNaN(d.getTime()) && d >= sevenDaysAgo && d <= now) count++;
      });
    });
    return count;
  }, [players]);

  const StatCard = ({ label, value, helper, highlight = false }: StatCardProps) => (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/50 p-3 min-h-0 flex flex-col justify-center">
      <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-medium">{label}</p>
      <p className={`mt-1 text-base font-medium ${highlight ? 'text-slate-400' : 'text-zinc-300'}`}>
        {value}
      </p>
      {helper && <p className="mt-0.5 text-[11px] text-zinc-500">{helper}</p>}
    </div>
  );

  const formatMatchDate = (dateTime?: Date) => {
    if (!dateTime || Number.isNaN(dateTime.getTime())) return 'Sem data definida';
    const dateLabel = dateTime.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
    const timeLabel = dateTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateLabel} • ${timeLabel}`;
  };

  // Carregar dados da API quando o componente monta E quando o usuário faz login
  useEffect(() => {
    // Só carregar dados se o usuário estiver logado
    if (!currentUser) {
      console.log('⏸️ Usuário não logado, pulando carregamento de dados');
      // NÃO setar isInitializing(false) aqui — o efeito de restauração de sessão cuida disso.
      // Setar aqui causava uma corrida: isInitializing ficava false antes do fetch do profile completar,
      // fazendo o efeito de URL empurrar "/" antes da sessão ser restaurada.
      return;
    }
    
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔄 Carregando dados da API...');
        console.log('👤 Usuário logado:', currentUser?.email);
        console.log('🔑 Token presente:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
          console.error('❌ Token não encontrado no localStorage!');
          return;
        }
        
        // FASE 1: Carregar dados críticos primeiro (players, matches, teams)
        console.log('🚀 Fase 1: Carregando dados críticos...');
        const [playersData, matchesData, teamsData] = await Promise.allSettled([
          playersApi.getAll().catch(err => { console.error('❌ Erro ao carregar players:', err); return []; }),
          matchesApi.getAll().catch(err => { console.error('❌ Erro ao carregar matches:', err); return []; }),
          teamsApi.getAll().catch(err => { console.error('❌ Erro ao carregar teams:', err); return []; })
        ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

        // Atualizar UI: merge players da API com players salvos localmente (fallback)
        const apiPlayers = playersData as Player[];
        const localPlayers = JSON.parse(localStorage.getItem('scout21_players_local') || '[]');
        const apiIds = new Set(apiPlayers.map(p => p.id));
        const localOnly = localPlayers.filter((p: Player) => !apiIds.has(p.id));
        setPlayers([...apiPlayers, ...localOnly]);
        
        // Validar matches antes de definir - garantir que todos tenham teamStats válido
        const validMatches = (matchesData as MatchRecord[]).filter(m => {
          if (!m || !m.teamStats) {
            console.warn('⚠️ Match inválido removido ao carregar:', m);
            return false;
          }
          return true;
        });
        setMatches(validMatches);
        setTeams(teamsData as Team[]);
        
        console.log('✅ Fase 1 concluída:', {
          players: playersData.length,
          matches: validMatches.length,
          teams: teamsData.length,
        });

        // FASE 2: Carregar dados importantes em background (não bloqueia UI)
        // Programação: carregar apenas do localStorage (salvamento local)
        setTimeout(async () => {
          console.log('🚀 Fase 2: Carregando dados importantes...');
          const localSchedules = JSON.parse(localStorage.getItem('scout21_schedules_local') || '[]');
          const validSchedules = localSchedules
            .filter((s: WeeklySchedule) => s && s.id)
            .map((s: WeeklySchedule) => ({
              ...s,
              days: Array.isArray(s.days) ? s.days : (s.days ? [s.days] : []),
              isActive: s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true'
            }))
            .sort((a: WeeklySchedule, b: WeeklySchedule) => {
              if (a.isActive && !b.isActive) return -1;
              if (!a.isActive && b.isActive) return 1;
              const aCreated = a.createdAt || 0;
              const bCreated = b.createdAt || 0;
              return bCreated - aCreated;
            });
          setSchedules(validSchedules);

          const [competitionsData, championshipMatchesData] = await Promise.allSettled([
            competitionsApi.getAll().catch(err => { console.error('❌ Erro ao carregar competitions:', err); return []; }),
            championshipMatchesApi.getAll().catch(err => { console.error('❌ Erro ao carregar championshipMatches:', err); return []; })
          ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));
          
          setCompetitions((competitionsData as string[]).length > 0 ? (competitionsData as string[]) : []);
          setChampionshipMatches((championshipMatchesData as ChampionshipMatch[]).length > 0 ? (championshipMatchesData as ChampionshipMatch[]) : []);
          
          console.log('✅ Fase 2 concluída:', {
            schedules: validSchedules.length,
            competitions: (competitionsData as string[]).length,
            championshipMatches: (championshipMatchesData as ChampionshipMatch[]).length,
          });
        }, 100);

        // FASE 3: Carregar dados secundários em background
        setTimeout(async () => {
          console.log('🚀 Fase 3: Carregando dados secundários...');
          const [assessmentsData, statTargetsData] = await Promise.allSettled([
            assessmentsApi.getAll().catch(err => { console.error('❌ Erro ao carregar assessments:', err); return []; }),
            statTargetsApi.getAll().catch(err => { console.error('❌ Erro ao carregar statTargets:', err); return []; })
          ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

          setAssessments(assessmentsData as PhysicalAssessment[]);
          
          if ((statTargetsData as StatTargets[]).length > 0 && (statTargetsData as StatTargets[])[0]) {
            setStatTargets((statTargetsData as StatTargets[])[0]);
          }
          
          console.log('✅ Fase 3 concluída:', {
            assessments: assessmentsData.length,
            statTargets: statTargetsData.length,
          });
        }, 300);
        
        // TimeControls não tem getAll(), será carregado por jogo quando necessário
        setTimeControls([]);
        
        // Campeonatos: carregar do localStorage
        const savedChampionships = JSON.parse(localStorage.getItem('championships') || '[]');
        setChampionships(savedChampionships);
        
        console.log('✅ Dados críticos carregados com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao carregar dados da API:', error);
        // Fallback: carregar players e schedules salvos localmente
        const localPlayers = JSON.parse(localStorage.getItem('scout21_players_local') || '[]');
        const localSchedules = JSON.parse(localStorage.getItem('scout21_schedules_local') || '[]');
        setPlayers(localPlayers);
        setMatches([]);
        setAssessments([]);
        setSchedules(localSchedules);
        setCompetitions([]);
        setChampionshipMatches([]);
        console.warn('⚠️ Erro ao carregar dados da API. Sistema iniciado sem dados.');
      }
    };

    loadData();
  }, [currentUser]); // Executar quando o usuário fizer login ou mudar

  // Clean up old schedules (older than 30 days) on mount
  useEffect(() => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    setSchedules(prev => {
        const validSchedules = prev.filter(s => {
            // If legacy schedule without createdAt, keep it or default to now (let's keep it to be safe)
            const created = s.createdAt || now; 
            return (now - created) < thirtyDaysInMs;
        });
        
        // Update local storage if items were removed
        if (validSchedules.length !== prev.length) {
            console.log("Auto-deleted expired schedules");
        }
        return validSchedules;
    });
  }, []);

  // Carousel Timer
  useEffect(() => {
    if (activeTab === 'dashboard') {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleLogin = (user: User) => {
      console.log('🔐 handleLogin chamado com usuário:', user);
      console.log('🔑 Token no localStorage:', localStorage.getItem('token') ? 'PRESENTE' : 'AUSENTE');
      setCurrentUser(user);
      setActiveTab('dashboard'); 
      console.log('✅ currentUser atualizado, useEffect deve ser disparado');
  };

  const handleTabChange = (tab: string) => {
      setIsLoading(true);
      setActiveTab(tab);
      // Simulate loading time
      setTimeout(() => {
          setIsLoading(false);
      }, 500);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              alert('Você precisa estar autenticado para atualizar o perfil.');
              return;
          }

          const { getApiUrl } = await import('./config');
          
          const response = await fetch(`${getApiUrl()}/auth/profile`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(updatedData),
          });

          const result = await response.json();

          if (result.success && result.data) {
              // Atualizar estado local com dados retornados
              if (currentUser) {
                  const updatedUser: User = {
                      ...currentUser,
                      name: result.data.name,
                      email: result.data.email,
                      photoUrl: result.data.photoUrl,
                      role: result.data.role === 'TECNICO' ? 'Treinador' : result.data.role,
                  };
                  setCurrentUser(updatedUser);
              }
          } else {
              alert(result.error || 'Erro ao atualizar perfil. Tente novamente.');
          }
      } catch (error) {
          console.error('Erro ao atualizar perfil:', error);
          alert('Erro de conexão ao atualizar perfil. Verifique se o backend está rodando.');
      }
  };

  const handleSaveMatch = async (newMatch: MatchRecord) => {
      try {
        // Validar match antes de salvar
        if (!newMatch || !newMatch.teamStats) {
          console.error('❌ Erro: Match inválido ao salvar:', newMatch);
          alert("Erro: Dados da partida incompletos. Verifique o console para mais detalhes.");
          return;
        }

        console.log('💾 Iniciando salvamento da partida:', {
          id: newMatch.id,
          competition: newMatch.competition,
          opponent: newMatch.opponent,
          date: newMatch.date,
          hasTeamStats: !!newMatch.teamStats,
          playerStatsCount: Object.keys(newMatch.playerStats || {}).length
        });

        const saved = await matchesApi.create(newMatch);
        console.log('💾 Resposta do salvamento:', saved);
        
        if (saved) {
          // Atualizar cartões por campeonato (se partida vinculada a campeonato)
          if (saved.competition && saved.playerStats) {
            try {
              const savedChampionships = JSON.parse(localStorage.getItem('championships') || '[]');
              const championship = savedChampionships.find((c: any) => c.name === saved.competition);
              if (championship?.id && championship?.suspensionRules) {
                const { updateCardsFromMatch } = await import('./utils/championshipCards');
                const playerStatsForCards: Record<string, { yellowCards?: number; redCards?: number }> = {};
                Object.entries(saved.playerStats || {}).forEach(([playerId, stats]: [string, any]) => {
                  playerStatsForCards[playerId] = {
                    yellowCards: stats.yellowCards ?? 0,
                    redCards: stats.redCards ?? 0,
                  };
                });
                updateCardsFromMatch(championship.id, playerStatsForCards, championship.suspensionRules);
              }
            } catch (e) {
              console.warn('Erro ao atualizar cartões do campeonato:', e);
            }
          }
          // Validar match salvo antes de adicionar à lista
          if (saved.teamStats) {
            setMatches(prev => [...prev, saved]);
            console.log('✅ Partida salva e adicionada à lista local');
            alert("Partida salva com sucesso! Os dados foram atualizados no sistema.");
            setActiveTab('general');
          } else {
            console.error('❌ Erro: Match salvo sem teamStats:', saved);
            alert("Partida salva, mas com dados incompletos. Verifique o console.");
          }
        } else {
          console.error('❌ Erro: Resposta do salvamento foi null/undefined');
          alert("Erro ao salvar a partida no servidor. Verifique sua conexão e tente novamente. Os dados NÃO foram gravados.");
        }
      } catch (error) {
        console.error('❌ Erro ao salvar partida:', error);
        if (error instanceof Error) {
          console.error('Detalhes do erro:', error.message, error.stack);
        }
        alert("Erro ao salvar partida no servidor. Os dados NÃO foram gravados. Verifique o console (F12) para mais detalhes.");
      }
  };

  const PLAYERS_LOCAL_KEY = 'scout21_players_local';

  const handleAddPlayer = async (newPlayer: Player) => {
      try {
        const saved = await playersApi.create(newPlayer);
        if (saved) {
          setPlayers(prev => [...prev, saved]);
          alert("Atleta cadastrado com sucesso!");
        } else {
          if (import.meta.env.PROD) {
            alert("Não foi possível salvar o atleta no servidor. Verifique sua conexão e as variáveis de ambiente (DATABASE_URL) em produção. Os dados não foram gravados.");
          } else {
            const localPlayers = JSON.parse(localStorage.getItem(PLAYERS_LOCAL_KEY) || '[]');
            const playerWithId = { ...newPlayer, id: newPlayer.id || `p${Date.now()}` };
            localPlayers.push(playerWithId);
            localStorage.setItem(PLAYERS_LOCAL_KEY, JSON.stringify(localPlayers));
            setPlayers(prev => [...prev, playerWithId]);
            alert("Atleta cadastrado localmente (backend indisponível).");
          }
        }
      } catch (error) {
        if (import.meta.env.PROD) {
          console.error('Erro ao criar atleta:', error);
          alert("Erro ao salvar atleta no servidor. Os dados não foram gravados. Verifique o console (F12) e as variáveis de ambiente em produção.");
        } else {
          console.warn('Backend indisponível, salvando localmente:', error);
          const localPlayers = JSON.parse(localStorage.getItem(PLAYERS_LOCAL_KEY) || '[]');
          const playerWithId = { ...newPlayer, id: newPlayer.id || `p${Date.now()}` };
          localPlayers.push(playerWithId);
          localStorage.setItem(PLAYERS_LOCAL_KEY, JSON.stringify(localPlayers));
          setPlayers(prev => [...prev, playerWithId]);
          alert("Atleta cadastrado localmente (backend indisponível).");
        }
      }
  };

  // Function to handle updates (edit, transfer, injury)
  const handleUpdatePlayer = async (updatedPlayer: Player) => {
      try {
        const saved = await playersApi.update(updatedPlayer.id, updatedPlayer);
        if (saved) {
          setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? saved : p));
          alert("Dados do atleta atualizados com sucesso!");
        } else {
          if (import.meta.env.PROD) {
            alert("Não foi possível atualizar o atleta no servidor. Os dados não foram gravados.");
          } else {
            const localPlayers = JSON.parse(localStorage.getItem(PLAYERS_LOCAL_KEY) || '[]');
            const idx = localPlayers.findIndex((p: Player) => p.id === updatedPlayer.id);
            if (idx >= 0) {
              localPlayers[idx] = updatedPlayer;
            } else {
              localPlayers.push(updatedPlayer);
            }
            localStorage.setItem(PLAYERS_LOCAL_KEY, JSON.stringify(localPlayers));
            setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
            alert("Dados do atleta atualizados localmente (backend indisponível).");
          }
        }
      } catch (error) {
        if (import.meta.env.PROD) {
          console.error('Erro ao atualizar atleta:', error);
          alert("Erro ao atualizar atleta no servidor. Os dados não foram gravados.");
        } else {
          console.warn('Backend indisponível, atualizando localmente:', error);
          const localPlayers = JSON.parse(localStorage.getItem(PLAYERS_LOCAL_KEY) || '[]');
          const idx = localPlayers.findIndex((p: Player) => p.id === updatedPlayer.id);
          if (idx >= 0) {
            localPlayers[idx] = updatedPlayer;
          } else {
            localPlayers.push(updatedPlayer);
          }
          localStorage.setItem(PLAYERS_LOCAL_KEY, JSON.stringify(localPlayers));
          setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
          alert("Dados do atleta atualizados localmente (backend indisponível).");
        }
      }
  };

  const handleDeletePlayer = async (player: Player) => {
    try {
      await playersApi.delete(player.id);
      setPlayers(prev => prev.filter(p => p.id !== player.id));
      alert("Cadastro do atleta excluído com sucesso.");
    } catch (error) {
      console.error('Erro ao excluir atleta:', error);
      alert("Erro ao excluir atleta. Tente novamente.");
    }
  };

  const handleSaveAssessment = async (newAssessment: PhysicalAssessment) => {
      try {
        const saved = await assessmentsApi.create(newAssessment);
        if (saved) {
          setAssessments(prev => [...prev, saved]);
        }
      } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
      }
  };

  const handleAddTeam = async (newTeam: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      const saved = await teamsApi.create(newTeam);
      if (saved) {
        setTeams(prev => [...prev, saved]);
        return saved;
      }
      return null;
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      return null;
    }
  };

  const handleUpdateTeam = async (updatedTeam: Team) => {
    try {
      const saved = await teamsApi.update(updatedTeam.id, updatedTeam);
      if (saved) {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? saved : t));
        return saved;
      }
      return null;
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      return null;
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const success = await teamsApi.delete(teamId);
      if (success) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      return false;
    }
  };

  const SCHEDULES_LOCAL_KEY = 'scout21_schedules_local';

  const handleSaveSchedule = async (newSchedule: WeeklySchedule) => {
      try {
        // Garantir que days seja um array válido
        if (!newSchedule.days || !Array.isArray(newSchedule.days)) {
          alert('Erro: A programação não possui dias configurados.');
          return;
        }
        
        // Normalizar datas para formato YYYY-MM-DD (sem hora/timezone)
        const normalizeDate = (dateStr: string): string => {
          if (!dateStr) return dateStr;
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          const datePart = dateStr.split('T')[0].split(' ')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
          try {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch {
            return dateStr;
          }
        };
        
        const normalizedSchedule = {
          ...newSchedule,
          startDate: normalizeDate(newSchedule.startDate),
          endDate: normalizeDate(newSchedule.endDate),
          createdAt: newSchedule.createdAt || Date.now()
        };
        
        const localSchedules = JSON.parse(localStorage.getItem(SCHEDULES_LOCAL_KEY) || '[]');
        const exists = localSchedules.find((s: WeeklySchedule) => s.id === normalizedSchedule.id);
        
        let updatedSchedules;
        if (exists) {
          updatedSchedules = localSchedules.map((s: WeeklySchedule) => 
            s.id === normalizedSchedule.id ? normalizedSchedule : s
          );
          alert('Programação atualizada com sucesso!');
        } else {
          updatedSchedules = [normalizedSchedule, ...localSchedules];
          alert('Programação salva com sucesso! Ela ficará disponível por 30 dias.');
        }
        
        localStorage.setItem(SCHEDULES_LOCAL_KEY, JSON.stringify(updatedSchedules));
        setSchedules(updatedSchedules);
      } catch (error) {
        console.error('❌ Erro ao salvar programação:', error);
        alert('Erro ao salvar programação. Verifique o console para mais detalhes.');
      }
  };

  const handleDeleteSchedule = async (id: string) => {
      const schedule = schedules.find(s => s.id === id);
      if (!schedule) return;
      
      const confirmDelete = window.confirm(`Tem certeza que deseja deletar a programação "${schedule.title}"?\n\nEsta ação não pode ser desfeita.`);
      if (!confirmDelete) return;
      
      try {
        const localSchedules = JSON.parse(localStorage.getItem(SCHEDULES_LOCAL_KEY) || '[]');
        const updatedSchedules = localSchedules.filter((s: WeeklySchedule) => s.id !== id);
        localStorage.setItem(SCHEDULES_LOCAL_KEY, JSON.stringify(updatedSchedules));
        setSchedules(updatedSchedules);
        alert('Programação deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar programação:', error);
        alert('Erro ao deletar programação. Tente novamente.');
      }
  };

  const handleToggleScheduleActive = async (id: string) => {
      try {
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) return;
        
        const newActiveState = !schedule.isActive;
        const localSchedules = JSON.parse(localStorage.getItem(SCHEDULES_LOCAL_KEY) || '[]');
        const updatedSchedules = localSchedules.map((s: WeeklySchedule) => ({
          ...s,
          isActive: s.id === id ? newActiveState : false,
          days: s.days ?? []
        }));
        localStorage.setItem(SCHEDULES_LOCAL_KEY, JSON.stringify(updatedSchedules));
        setSchedules(updatedSchedules);
        
        if (newActiveState) {
          alert(`✅ Programação "${schedule.title}" marcada como ATIVA!\n\nEsta programação será considerada para exibir alertas na Visão Geral.`);
        } else {
          alert(`Programação "${schedule.title}" desativada.`);
        }
      } catch (error) {
        console.error('Erro ao atualizar programação:', error);
        alert('Erro ao atualizar programação. Tente novamente.');
      }
  };

  // Restaurar sessão ao carregar/atualizar: se houver token, buscar perfil e manter na plataforma.
  // Se restaurar com sucesso, não chamar setIsInitializing(false) aqui — loadData fará isso após carregar os dados (uma única tela de loading).
  useEffect(() => {
    let cancelled = false;
    let restored = false;
    const path = window.location.pathname;
    const token = localStorage.getItem('token');

    const setRouteFromPath = () => {
      if (path === '/registro' || path === '/register') setCurrentRoute('register');
      else if (path === '/login') setCurrentRoute('login');
      else if (path === '/dashboard') setCurrentRoute('login');
      else if (path === '/' || path === '') setCurrentRoute('landing');
    };

    const run = async () => {
      if (!token) {
        setRouteFromPath();
        setIsInitializing(false);
        return;
      }
      try {
        const { getApiUrl } = await import('./config');
        const response = await fetch(`${getApiUrl()}/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result = await response.json();
        if (cancelled) return;
        if (result.success && result.data) {
          const u = result.data;
          setCurrentUser({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role === 'TECNICO' ? 'Treinador' : u.role,
            photoUrl: u.photoUrl,
          });
          setCurrentRoute('app');
          setIsInitializing(false);
          restored = true;
        } else {
          localStorage.removeItem('token');
          setRouteFromPath();
        }
      } catch {
        if (cancelled) return;
        localStorage.removeItem('token');
        setRouteFromPath();
      } finally {
        if (!cancelled && !restored) setIsInitializing(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  // Update URL when route changes (skip while initializing to avoid overwriting the current URL before session restore)
  useEffect(() => {
    if (isInitializing) return;
    if (currentRoute === 'register') {
      window.history.pushState({}, '', '/registro');
    } else if (currentRoute === 'login') {
      window.history.pushState({}, '', '/login');
    } else if (currentRoute === 'landing') {
      window.history.pushState({}, '', '/');
    } else if (currentRoute === 'app') {
      window.history.pushState({}, '', '/dashboard');
    }
  }, [currentRoute, isInitializing]);

  // Redirecionar para login se estiver na rota 'app' mas não tiver usuário
  useEffect(() => {
    if (currentRoute === 'app' && !currentUser) {
      setCurrentRoute('login');
    }
  }, [currentRoute, currentUser]);

  // Handle login with route change
  const handleLoginWithRoute = (user: User) => {
    handleLogin(user);
    setCurrentRoute('app');
  };

  // Mostrar loading enquanto inicializa (ANTES das verificações de rota para evitar flash da landing page)
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar landing page
  if (currentRoute === 'landing') {
    return <LandingPage 
      onGetStarted={() => {
        console.log('🚀 Redirecionando para /registro');
        setCurrentRoute('register');
      }}
      onGoToLogin={() => {
        console.log('🔑 Redirecionando para /login');
        setCurrentRoute('login');
      }}
    />;
  }

  // Mostrar página de registro
  if (currentRoute === 'register') {
    return <Login 
      onLogin={handleLoginWithRoute} 
      initialMode="register"
      onSwitchToLogin={() => setCurrentRoute('login')}
      onSwitchToRegister={() => setCurrentRoute('register')}
      onBackToHome={() => setCurrentRoute('landing')}
    />;
  }

  if (currentRoute === 'login') {
    return <Login 
      onLogin={handleLoginWithRoute}
      initialMode="login"
      onSwitchToRegister={() => setCurrentRoute('register')}
      onBackToHome={() => setCurrentRoute('landing')}
    />;
  }

  // Se estiver na rota 'app' mas não tiver usuário, mostrar loading
  if (currentRoute === 'app' && !currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Handlers para Settings
  const handleUpdateTargets = async (targets: StatTargets) => {
    try {
      const existing = await statTargetsApi.getAll();
      const targetId = existing.length > 0 ? existing[0].id || 'default' : 'default';
      
      await statTargetsApi.update(targetId, targets);
      setStatTargets(targets);
    } catch (error) {
      console.error('Erro ao atualizar metas:', error);
      setStatTargets(targets); // Atualizar localmente mesmo com erro
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return (
          <TabBackgroundWrapper>
            <TeamManagement 
              players={players} 
              onAddPlayer={handleAddPlayer} 
              onUpdatePlayer={handleUpdatePlayer}
              onDeletePlayer={handleDeletePlayer}
              config={config} 
            />
          </TabBackgroundWrapper>
        );
      case 'ranking': 
        return (
          <TabBackgroundWrapper>
            <StatsRanking players={players} matches={matches} />
          </TabBackgroundWrapper>
        ); 
      case 'general':
        return <GeneralScout config={config} matches={matches} players={players} />; 
      case 'individual':
        return (
          <TabBackgroundWrapper>
            <IndividualScout config={config} currentUser={currentUser} matches={matches} players={players} timeControls={timeControls} />
          </TabBackgroundWrapper>
        );
      case 'physical':
        return (
          <TabBackgroundWrapper>
            <PhysicalScout matches={matches} players={players} schedules={schedules} championshipMatches={championshipMatches} />
          </TabBackgroundWrapper>
        );
      case 'assessment': 
        return (
          <TabBackgroundWrapper>
            <PhysicalAssessmentTab players={players} assessments={assessments} onSaveAssessment={handleSaveAssessment} />
          </TabBackgroundWrapper>
        );
      case 'video':
        return (
          <TabBackgroundWrapper>
            <VideoScout config={config} matches={matches} players={players} />
          </TabBackgroundWrapper>
        );
      case 'schedule': // New Case
        return (
          <TabBackgroundWrapper>
            <Schedule 
              schedules={schedules} 
              onSaveSchedule={handleSaveSchedule} 
              onDeleteSchedule={handleDeleteSchedule}
              onToggleActive={handleToggleScheduleActive}
            />
          </TabBackgroundWrapper>
        );
      case 'championship':
        return (
          <TabBackgroundWrapper>
            <ChampionshipTable
            matches={championshipMatches}
            competitions={competitions}
            championships={championships}
            allMatches={matches}
            onSaveChampionship={(championship) => {
              setChampionships(prev => {
                const updated = prev.filter(c => c.id !== championship.id);
                updated.push(championship);
                localStorage.setItem('championships', JSON.stringify(updated));
                return updated;
              });
            }}
            onSave={async (match) => {
              try {
                if (match.id && championshipMatches.find(m => m.id === match.id)) {
                  // Atualizar
                  const updated = await championshipMatchesApi.update(match.id, match);
                  if (updated) {
                    setChampionshipMatches(prev => prev.map(m => m.id === match.id ? updated : m));
                  }
                } else {
                  // Criar
                  const saved = await championshipMatchesApi.create(match);
                  if (saved) {
                    setChampionshipMatches(prev => [...prev, saved]);
                  }
                }
              } catch (error) {
                console.error('Erro ao salvar partida do campeonato:', error);
                alert('Erro ao salvar partida. Verifique o console.');
              }
            }}
            onDelete={async (id) => {
              try {
                const success = await championshipMatchesApi.delete(id);
                if (success) {
                  setChampionshipMatches(prev => prev.filter(m => m.id !== id));
                }
              } catch (error) {
                console.error('Erro ao deletar partida do campeonato:', error);
                alert('Erro ao deletar partida. Verifique o console.');
              }
            }}
            onUseForInput={(match) => {
              // Navegar para Input de Dados e preencher automaticamente
              setActiveTab('table');
              // Armazenar o match selecionado para uso no ScoutTable com todos os dados
              (window as any).selectedChampionshipMatch = {
                date: match.date,
                opponent: match.opponent,
                competition: match.competition,
                location: match.location,
                scoreTarget: match.scoreTarget,
                time: match.time
              };
            }}
            onRefresh={async () => {
              try {
                console.log('🔄 Recarregando dados da planilha...');
                const data = await championshipMatchesApi.getAll();
                setChampionshipMatches(data);
                console.log('✅ Dados recarregados da planilha:', data.length, 'partidas');
                alert(`Dados recarregados! ${data.length} partida(s) encontrada(s).`);
              } catch (error) {
                console.error('❌ Erro ao recarregar dados:', error);
                alert('Erro ao recarregar dados. Verifique o console para mais detalhes.');
              }
            }}
            />
          </TabBackgroundWrapper>
        );
      case 'table':
        return (
          <TabBackgroundWrapper>
            <ScoutTable 
          onSave={handleSaveMatch} 
          players={players} 
          competitions={competitions} 
          matches={matches}
          initialData={(window as any).selectedChampionshipMatch}
          onInitialDataUsed={() => {
            delete (window as any).selectedChampionshipMatch;
          }}
          championshipMatches={championshipMatches}
          teams={teams}
          currentUser={currentUser}
          onScoutWindowOpenChange={setScoutWindowOpen}
            />
          </TabBackgroundWrapper>
        );
      case 'pse':
        return (
          <TabBackgroundWrapper>
            <PseTab schedules={schedules} championshipMatches={championshipMatches} players={players} />
          </TabBackgroundWrapper>
        );
      case 'qualidade-sono':
        return (
          <TabBackgroundWrapper>
            <QualidadeSonoTab schedules={schedules} championshipMatches={championshipMatches} players={players} />
          </TabBackgroundWrapper>
        );
      case 'academia':
        return (
          <TabBackgroundWrapper>
            <Academia schedules={schedules} players={players} />
          </TabBackgroundWrapper>
        );
      case 'management-report':
        return (
          <TabBackgroundWrapper>
            <ManagementReport 
              players={players} 
              matches={matches} 
              assessments={assessments}
              timeControls={timeControls}
            />
          </TabBackgroundWrapper>
        );
      case 'settings':
        return (
          <TabBackgroundWrapper>
            <Settings 
              currentUser={currentUser} 
              onUpdateUser={handleUpdateUser}
              statTargets={statTargets}
              onUpdateTargets={handleUpdateTargets}
            />
          </TabBackgroundWrapper>
        );
      case 'dashboard':
      default: {
        const nextCommitmentForToday: import('./components/DashboardTodayBlock').NextCommitmentInfo = nextCommitment
          ? {
              type: nextCommitment.type,
              label: nextCommitment.label,
              competition: nextCommitment.competition,
              countdown: nextCommitment.countdown,
            }
          : null;
        const activeAlertsForToday: import('./components/DashboardTodayBlock').ActiveAlert[] = [];
        if (dashboardAlertCounts.injuredCount > 0) activeAlertsForToday.push({ kind: 'lesão', count: dashboardAlertCounts.injuredCount });
        if (dashboardAlertCounts.suspendedCount > 0) activeAlertsForToday.push({ kind: 'suspenso', count: dashboardAlertCounts.suspendedCount });
        if (dashboardAlertCounts.penduradosCount > 0) activeAlertsForToday.push({ kind: 'pendurado', count: dashboardAlertCounts.penduradosCount });

        return (
          <div className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-sm animate-fade-in">
            <div className="flex flex-col gap-8">
              <header className="border-b border-zinc-800 pb-4">
                <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 font-medium">Visão geral</span>
                <h1
                  className="mt-1 text-xl md:text-2xl text-white uppercase font-black italic"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: '1px', color: '#FFFFFF' }}
                >
                  CENTRAL DE INFOMAÇÕES
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Indicadores e status operacional do clube.</p>
              </header>

              {/* 1. Bloco fixo HOJE NO CLUBE */}
              <DashboardTodayBlock
                nextCommitment={nextCommitmentForToday}
                focusOfDay={focusOfDay}
                activeAlerts={activeAlertsForToday}
              />

              {/* 1. Riscos e desfalques */}
              <section className="space-y-4" aria-label="Riscos e desfalques">
                <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 font-bold">Riscos e desfalques</p>
                <div className="flex flex-col gap-3">
                  <InjuredPlayersAlert players={players} />
                  {overviewStats.nextMatch && (
                    <SuspensionsAlert
                      nextMatch={overviewStats.nextMatch}
                      championships={championships}
                      players={players}
                    />
                  )}
                  {!overviewStats.nextMatch && dashboardAlertCounts.injuredCount === 0 && (
                    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/50 px-4 py-3 text-zinc-500 text-xs">
                      Sem lesões ou suspensões no momento.
                    </div>
                  )}
                </div>
              </section>

              {/* 2. Condição física da equipe */}
              <DashboardConditionCard schedules={schedules} championshipMatches={championshipMatches} />

              {/* 3. Elenco disponível + Próximo jogo */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DashboardSquadAvailability
                    players={players}
                    nextMatch={overviewStats.nextMatch}
                    championships={championships}
                  />
                </div>
                <div>
                  <DashboardNextGameCard
                    nextMatch={overviewStats.nextMatch}
                    championships={championships}
                    players={players}
                  />
                </div>
              </section>

              {/* 4. Indicadores gerais */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Indicadores gerais">
                <StatCard label="Atletas" value={overviewStats.totalAthletes} helper={overviewStats.totalAthletes > 0 ? 'Cadastros' : '—'} />
                <StatCard label="Jogos" value={overviewStats.totalGames} helper={`V ${overviewStats.wins} · D ${overviewStats.losses}`} highlight={overviewStats.totalGames > 0} />
                <StatCard label="Artilheiro" value={overviewStats.topScorerName} helper={overviewStats.topScorerGoals > 0 ? `${overviewStats.topScorerGoals} gols` : '—'} />
                <StatCard label="Lesões no ano" value={overviewStats.injuriesThisYear} helper={String(overviewStats.currentYear)} />
              </section>

              {/* 7. Ações principais no rodapé */}
              <footer className="flex flex-wrap gap-3 pt-4 border-t border-zinc-700">
                <button
                  onClick={() => handleTabChange('general')}
                  className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700"
                >
                  <BarChart3 size={14} />
                  Scout Coletivo
                </button>
                <button
                  onClick={() => handleTabChange('management-report')}
                  className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700"
                >
                  <FileText size={14} />
                  Relatório Gerencial
                </button>
              </footer>
            </div>
          </div>
        );
      }
    }
  };

  // Se não estiver na rota 'app', renderizar sem Sidebar
  if (currentRoute !== 'app') {
    // Landing, login ou register - já renderizado acima
    return null; // Os returns acima já cobrem esses casos
  }

  // Rota 'app' - renderizar com Sidebar (escondida quando a janela Scout da Partida está aberta)
  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans">
      {!scoutWindowOpen && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onLogout={() => {
            console.log('👋 Logout - Voltando para home');
            localStorage.removeItem('token');
            setCurrentUser(null);
            setCurrentRoute('landing');
          }}
          currentUser={currentUser}
        />
      )}
      <main className={`flex-1 p-6 overflow-y-auto h-screen scroll-smooth print:ml-0 print:p-0 ${scoutWindowOpen ? 'ml-0' : 'ml-64'}`}>
        {isLoading ? <LoadingMessage activeTab={activeTab} /> : renderContent()}
      </main>
    </div>
  );
}
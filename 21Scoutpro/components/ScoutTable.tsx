import React, { useState, useEffect, useMemo } from 'react';
import { Table, Printer, Trash2, Save, ChevronDown, ChevronUp, X, Minus, Clock, Goal, Shield, Zap, AlertTriangle, ArrowRightLeft, Target, Users, Activity, Gauge, Square, ArrowUpDown, Calendar, ArrowLeft, Play, Pause, RotateCcw, Ambulance, Ban } from 'lucide-react';
import { MatchRecord, MatchStats, Player, PlayerTimeControl, Team, Championship } from '../types';
import { getPlayerPhysiologyForMatch } from '../utils/playerPhysiologyForMatch';
import { getChampionshipCards, getPlayerStatus } from '../utils/championshipCards';
import { timeControlsApi } from '../services/api';
import { TimeSelectionModal } from './TimeSelectionModal';
import { MatchTypeModal, MatchType } from './MatchTypeModal';
import { MatchScoutingWindow } from './MatchScoutingWindow';
import { CollectionTypeSelector, CollectionType } from './CollectionTypeSelector';
import { PostMatchCollectionSheet } from './PostMatchCollectionSheet';

interface GoalTime {
    id: string;
    time: string;
    method: string; // Método do gol
}

interface GoalConceded {
    id: string;
    time: string;
    method: string; // Método do gol tomado
}

interface ScoutEntry {
    id: string;
    date: string;
    athleteId: string;
    athleteName: string;
    jerseyNumber: number | string;
    position: string;
    status: 'Ativo' | 'Suspenso' | 'Lesionado';
    goals: number;
    goalTimes: GoalTime[]; // Array para múltiplos gols
    assists: number;
    passesCorrect: number;
    passesWrong: number;
    shotsOn: number;
    shotsOff: number;
    tacklesPossession: number;
    tacklesNoPossession: number;
    tacklesCounter: number;
    transitionError: number;
    card: 'Nenhum' | 'Amarelo' | 'Vermelho' | 'Amarelo/Vermelho' | 'Amarelo/Amarelo/Vermelho';
    rpe: number;
}

// Lista de métodos de gol
const GOAL_METHODS = [
    'Contra Ataque',
    'Escanteio',
    'Penalti',
    'Falta',
    'Lateral',
    'Roubada de Bola 1 linha',
    'Bola Rolando'
];


// Campos de lesão removidos do Input de Dados - agora apenas na Gestão de Equipe

interface ChampionshipMatch {
    id: string;
    date: string;
    time: string;
    opponent: string;
    competition: string;
    location?: string;
    scoreTarget?: string;
}

type CalendarMatchItem = (MatchRecord & { type: 'saved' }) | (ChampionshipMatch & { type: 'scheduled' });

interface ScoutTableProps {
    onSave?: (match: MatchRecord) => void;
    players: Player[];
    competitions: string[];
    matches?: MatchRecord[];
    initialData?: { date: string; opponent: string; competition: string; location?: string; scoreTarget?: string; time?: string };
    onInitialDataUsed?: () => void;
    championshipMatches?: ChampionshipMatch[];
    schedules?: { days?: unknown[]; isActive?: unknown }[];
    teams?: Team[];
}

export const ScoutTable: React.FC<ScoutTableProps> = ({ onSave, players, competitions, matches = [], initialData, onInitialDataUsed, championshipMatches = [], schedules = [], teams = [] }) => {
    // Debug: log initialData quando recebido
    useEffect(() => {
        if (initialData) {
            console.log('🔍 ScoutTable recebeu initialData:', initialData);
            console.log('🔍 Competition no initialData:', initialData?.competition);
        }
    }, [initialData]);
    
    // Estado para controlar quais partidas estão expandidas
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
    const [isCreatingNew, setIsCreatingNew] = useState(false); // Inicialmente calendário; form ao clicar em partida ou Nova Partida
    const [savedMatchId, setSavedMatchId] = useState<string | null>(null); // ID da partida salva
    const [isViewMode, setIsViewMode] = useState(false); // Modo visualização (após salvar)
    const [showMatchTypeModal, setShowMatchTypeModal] = useState(false); // Modal de tipo de partida
    const [showScoutingWindow, setShowScoutingWindow] = useState(false); // Janela de coleta
    const [selectedMatchType, setSelectedMatchType] = useState<MatchType>('normal');
    const [selectedExtraTimeMinutes, setSelectedExtraTimeMinutes] = useState<number>(5);
    const [selectedScheduledMatch, setSelectedScheduledMatch] = useState<ChampionshipMatch | null>(null); // Partida programada selecionada
    const [selectedPlayersForMatch, setSelectedPlayersForMatch] = useState<Set<string>>(new Set()); // IDs dos jogadores selecionados
    const [preparationMatchType, setPreparationMatchType] = useState<MatchType>('normal'); // Tipo de partida para preparação
    const [preparationExtraTimeMinutes, setPreparationExtraTimeMinutes] = useState<number>(5); // Minutos de acréscimo
    const [showStartScoutConfirmation, setShowStartScoutConfirmation] = useState<boolean>(false); // Modal de confirmação
    const [collectionType, setCollectionType] = useState<'realtime' | 'postmatch' | null>(null); // Tipo de coleta (null = seletor)
    const [showPostMatchSheet, setShowPostMatchSheet] = useState<boolean>(false); // Planilha pós-jogo
    const [showRealtimePrepForSavedMatch, setShowRealtimePrepForSavedMatch] = useState<boolean>(false); // Preparação tempo real para partida salva (seleção de atletas antes de abrir aba)
    const [preparationAthleteFilter, setPreparationAthleteFilter] = useState<'goleiros' | 'linha'>('goleiros'); // Goleiros | Atletas de linha na preparação

    // Calendário: filtro de datas (default: mês atual) e modo de visualização
    const [startDate, setStartDate] = useState<string>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    });
    const [viewMode, setViewMode] = useState<'calendar' | 'form' | 'analysis'>('calendar');
    const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
    
    // Header state for the Match Record - tudo neutro por padrão
    const [opponent, setOpponent] = useState('');
    const [competition, setCompetition] = useState(''); // Vazio por padrão
    const [location, setLocation] = useState(''); // Vazio por padrão (Mandante/Visitante/vazio)
    const [scoreTarget, setScoreTarget] = useState(''); // Meta de pontuação esperada
    const [matchResult, setMatchResult] = useState<'Vitória' | 'Derrota' | 'Empate' | 'Sem informação'>('Sem informação');
    const [goalsConceded, setGoalsConceded] = useState<GoalConceded[]>([]); // Array de gols tomados com tempo e método
    const [goalsConcededSaved, setGoalsConcededSaved] = useState(false); // Flag para indicar se gols tomados foram salvos
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null); // Jogador selecionado para registrar estatísticas
    
    // Estados do cronômetro
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // em segundos
    
    // Estados para jogadores em quadra (seleção manual)
    const [playersInField, setPlayersInField] = useState<Set<string>>(new Set());
    
    // Estados para Entradas e Saídas (TimeControl integrado)
    const [timeControls, setTimeControls] = useState<PlayerTimeControl[]>([]);
    const [isLoadingTimeControls, setIsLoadingTimeControls] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [timeModalType, setTimeModalType] = useState<'entry' | 'exit'>('entry');
    const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

    const [entries, setEntries] = useState<ScoutEntry[]>([
        {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            athleteId: '',
            athleteName: '',
            jerseyNumber: '',
            position: '',
            status: 'Ativo',
            goals: 0,
            goalTimes: [],
            assists: 0,
            passesCorrect: 0,
            passesWrong: 0,
            shotsOn: 0,
            shotsOff: 0,
            tacklesPossession: 0,
            tacklesNoPossession: 0,
            tacklesCounter: 0,
            transitionError: 0,
            card: 'Nenhum',
            rpe: 5,
        }
    ]);

    // Carregar players quando a lista mudar (para incluir novos atletas)
    useEffect(() => {
        console.log('📋 Players atualizados no ScoutTable:', players.length, 'atletas');
        console.log('📋 IDs dos players:', players.map(p => ({ id: String(p.id).trim(), name: p.name })));
    }, [players]);

    // Auto-preenchimento: Trazer todos os atletas ativos quando não houver entries válidas (quando vem da gestão de equipe ou ao abrir a aba)
    useEffect(() => {
        // Só executar se não houver initialData (para não sobrescrever dados da tabela de campeonato)
        if (initialData) return;
        
        // Verificar se há entries válidas (com atleta selecionado)
        const hasValidEntries = entries.some(e => e.athleteId && e.athleteId.trim() !== '');
        
        // Se já tem entries válidas, não fazer nada
        if (hasValidEntries) return;
        
        // Se não tem players, não fazer nada
        if (!players || players.length === 0) return;
        
        // Obter jogadores ativos (não suspensos, não lesionados)
        const activePlayers = players.filter(p => {
            // Verificar se tem status e se está ativo
            if ((p as any).status) {
                return (p as any).status === 'Ativo';
            }
            // Se não tem status definido, considerar ativo
            return true;
        });
        
        // Se não há jogadores ativos, não fazer nada
        if (activePlayers.length === 0) return;
        
        // Criar entries para todos os jogadores ativos
        const currentDate = entries[0]?.date || new Date().toISOString().split('T')[0];
        const newEntries = activePlayers.map((player, index) => ({
            id: `${Date.now()}-${index}`,
            date: currentDate,
            athleteId: String(player.id).trim(),
            athleteName: player.name,
            jerseyNumber: player.jerseyNumber,
            position: player.position,
            status: 'Ativo' as const,
            goals: 0,
            goalTimes: [],
            assists: 0,
            passesCorrect: 0,
            passesWrong: 0,
            shotsOn: 0,
            shotsOff: 0,
            tacklesPossession: 0,
            tacklesNoPossession: 0,
            tacklesCounter: 0,
            transitionError: 0,
            card: 'Nenhum' as const,
            rpe: 5,
        }));
        
        // Só atualizar se realmente criou entries novas (mais que a entrada vazia inicial)
        if (newEntries.length > 0) {
            console.log('✅ Preenchendo automaticamente com', newEntries.length, 'atletas ativos da gestão de equipe');
            setEntries(newEntries);
        }
    }, [players, initialData]); // Dependências: players e initialData (não incluir entries para evitar loop)

    // Cronômetro - atualizar tempo quando estiver rodando
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (timerRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerRunning]);

    // Função para formatar tempo do cronômetro (MM:SS)
    const formatTimerTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Função para formatar tempo do cronômetro para registro de eventos (MM:SS)
    const formatEventTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Calcular resultado automaticamente baseado em gols feitos vs tomados
    useEffect(() => {
        const totalGoalsScored = entries.reduce((sum, entry) => sum + entry.goals, 0);
        const totalGoalsConceded = goalsConceded.length;
        
        if (totalGoalsScored > totalGoalsConceded) {
            setMatchResult('Vitória');
        } else if (totalGoalsConceded > totalGoalsScored) {
            setMatchResult('Derrota');
        } else {
            setMatchResult('Empate');
        }
    }, [entries.map(e => e.goals).join(','), goalsConceded.length]);

    // Função para obter o próximo jogo programado
    const getNextScheduledMatch = (): ChampionshipMatch | null => {
        if (!championshipMatches || championshipMatches.length === 0) return null;
        
        const now = new Date();
        const currentTime = now.getTime();
        
        // Filtrar partidas futuras
        const futureMatches = championshipMatches.filter(match => {
            if (!match.date || !match.time) return false;
            
            try {
                const matchDateStr = match.date;
                const matchTimeStr = match.time;
                
                // Parsear data (formato YYYY-MM-DD)
                const [year, month, day] = matchDateStr.split('-').map(Number);
                
                // Parsear hora (formato HH:MM)
                let hours = 0;
                let minutes = 0;
                
                if (matchTimeStr.includes(':')) {
                    const [h, m] = matchTimeStr.split(':').map(Number);
                    hours = h || 0;
                    minutes = m || 0;
                } else {
                    try {
                        const timeDate = new Date(matchTimeStr);
                        if (!isNaN(timeDate.getTime())) {
                            hours = timeDate.getHours();
                            minutes = timeDate.getMinutes();
                        }
                    } catch {
                        hours = 20;
                        minutes = 0;
                    }
                }
                
                const matchDateTime = new Date(year, month - 1, day, hours, minutes);
                const matchTime = matchDateTime.getTime();
                
                return matchTime > currentTime;
            } catch (error) {
                console.warn('Erro ao processar data/hora da partida:', match, error);
                return false;
            }
        });
        
        if (futureMatches.length === 0) return null;
        
        // Ordenar por data e hora (mais próxima primeiro)
        futureMatches.sort((a, b) => {
            try {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }
                
                // Se mesma data, ordenar por hora
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                
                const [hA, mA] = timeA.split(':').map(Number);
                const [hB, mB] = timeB.split(':').map(Number);
                
                const timeAValue = (hA || 0) * 60 + (mA || 0);
                const timeBValue = (hB || 0) * 60 + (mB || 0);
                
                return timeAValue - timeBValue;
            } catch {
                return 0;
            }
        });
        
        return futureMatches[0];
    };
    
    // Carregamento automático do próximo jogo programado
    useEffect(() => {
        // Só executar se não houver initialData (para não sobrescrever dados manualmente selecionados)
        if (initialData) return;
        
        // Só executar se não houver dados já preenchidos
        if (opponent.trim() !== '' || competition.trim() !== '') return;
        
        // Só executar se não estiver em modo visualização
        if (isViewMode) return;
        
        // Só executar uma vez ao montar o componente (quando entries está vazio ou tem apenas entrada vazia)
        const hasValidEntries = entries.some(e => e.athleteId && e.athleteId.trim() !== '');
        if (hasValidEntries) return;
        
        const nextMatch = getNextScheduledMatch();
        if (!nextMatch) return;
        
        console.log('✅ Carregando automaticamente próximo jogo:', nextMatch);
        
        // Preencher dados do próximo jogo
        if (nextMatch.competition && nextMatch.competition.trim() !== '') {
            setCompetition(nextMatch.competition);
        }
        
        if (nextMatch.opponent && nextMatch.opponent.trim() !== '') {
            setOpponent(nextMatch.opponent);
        }
        
        if (nextMatch.location && nextMatch.location.trim() !== '') {
            setLocation(nextMatch.location);
        } else {
            setLocation('Mandante');
        }
        
        if (nextMatch.scoreTarget && nextMatch.scoreTarget.trim() !== '') {
            setScoreTarget(nextMatch.scoreTarget);
        }
        
        // Preencher data e hora
        if (nextMatch.date) {
            const newEntries = entries.length > 0 ? entries.map((entry, index) => ({
                ...entry,
                date: nextMatch.date,
                id: index === 0 ? entry.id : Date.now().toString() + index
            })) : [{
                id: Date.now().toString(),
                date: nextMatch.date,
                athleteId: '',
                athleteName: '',
                jerseyNumber: '',
                position: '',
                status: 'Ativo' as const,
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: 'Nenhum' as const,
                rpe: 5,
            }];
            setEntries(newEntries);
        }
        
        // Preencher atletas ativos
        const activePlayers = players.filter(p => {
            if ((p as any).status) {
                return (p as any).status === 'Ativo';
            }
            return true;
        });
        
        if (activePlayers.length > 0 && nextMatch.date) {
            const newEntries = activePlayers.map((player, index) => ({
                id: `${Date.now()}-auto-${index}`,
                date: nextMatch.date,
                athleteId: String(player.id).trim(),
                athleteName: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                status: 'Ativo' as const,
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: 'Nenhum' as const,
                rpe: 5,
            }));
            setEntries(newEntries);
            setIsCreatingNew(true);
        }
    }, [championshipMatches, players, initialData, isViewMode]); // Executar quando championshipMatches ou players mudarem
    
    // Preencher automaticamente quando initialData for fornecido (vindo da Tabela de Campeonato)
    useEffect(() => {
        if (initialData) {
            console.log('📋 initialData recebido:', initialData);
            console.log('📋 Competition no initialData:', initialData.competition);
            
            // Preencher dados do header - garantir que competition seja preenchida
            if (initialData.competition && initialData.competition.trim() !== '') {
                console.log('✅ Preenchendo competition:', initialData.competition);
                setCompetition(initialData.competition);
            } else {
                console.warn('⚠️ Competition não encontrada ou vazia no initialData');
            }
            
            if (initialData.opponent && initialData.opponent.trim() !== '') {
                setOpponent(initialData.opponent);
            }
            
            // Preencher location se disponível
            if (initialData.location && initialData.location.trim() !== '') {
                setLocation(initialData.location);
            } else {
                setLocation('Mandante'); // Padrão
            }
            
            // Preencher scoreTarget se disponível
            if (initialData.scoreTarget && initialData.scoreTarget.trim() !== '') {
                setScoreTarget(initialData.scoreTarget);
            }
            
            // Preencher data
            const formattedDate = initialData.date;
            
            // Obter jogadores ativos (não suspensos, não lesionados)
            const activePlayers = players.filter(p => {
                // Verificar se tem status e se está ativo
                if ((p as any).status) {
                    return (p as any).status === 'Ativo';
                }
                // Se não tem status definido, considerar ativo
                return true;
            });

            // Criar entries para todos os jogadores ativos
            const newEntries = activePlayers.map((player, index) => ({
                id: `${Date.now()}-${index}`,
                date: formattedDate,
                athleteId: String(player.id).trim(),
                athleteName: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                status: 'Ativo' as const,
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: 'Nenhum' as const,
                rpe: 5,
            }));

            setEntries(newEntries);
            setIsCreatingNew(true); // Abrir formulário de criação
            setViewMode('form'); // Exibir formulário ao vir da Tabela de Campeonato
            
            // Notificar que os dados foram usados (após um pequeno delay para garantir que os estados foram atualizados)
            setTimeout(() => {
                if (onInitialDataUsed) {
                    onInitialDataUsed();
                }
            }, 100);
        }
    }, [initialData, players, onInitialDataUsed]);

    // Auto-preenchimento baseado na data atual: se a data do input corresponder a uma partida da tabela de campeonato
    useEffect(() => {
        // Só executar se não houver initialData (para não sobrescrever dados manualmente selecionados)
        if (initialData) return;
        
        // Só executar se não houver dados já preenchidos (opponent ou competition vazios indicam que não foi preenchido)
        if (opponent.trim() !== '' && competition.trim() !== '') return;
        
        if (!championshipMatches || championshipMatches.length === 0) return;
        if (entries.length === 0) return;
        
        const currentDate = entries[0].date; // Data atual do input
        if (!currentDate) return;
        
        // Função para normalizar datas (remover horário e comparar apenas data)
        const normalizeDate = (dateStr: string): string => {
            if (!dateStr) return '';
            // Se já está no formato YYYY-MM-DD, retorna diretamente
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            // Tenta parsear como Date e retornar no formato YYYY-MM-DD
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            } catch {
                return '';
            }
        };
        
        const normalizedCurrentDate = normalizeDate(currentDate);
        if (!normalizedCurrentDate) return;
        
        // Procurar partida na tabela de campeonato com a mesma data
        const matchingMatch = championshipMatches.find(match => {
            const normalizedMatchDate = normalizeDate(match.date);
            return normalizedMatchDate === normalizedCurrentDate;
        });
        
        if (matchingMatch) {
            console.log('✅ Partida da tabela de campeonato encontrada para a data atual:', matchingMatch);
            console.log('📋 Competition da partida:', matchingMatch.competition);
            
            // Preencher dados automaticamente (garantir que competition seja preenchida sempre que houver)
            if (matchingMatch.competition && matchingMatch.competition.trim() !== '') {
                console.log('✅ Preenchendo competition automaticamente:', matchingMatch.competition);
                setCompetition(matchingMatch.competition);
            } else {
                console.warn('⚠️ Competition não encontrada ou vazia na partida:', matchingMatch);
            }
            
            // Preencher opponent apenas se não estiver preenchido
            if (matchingMatch.opponent && matchingMatch.opponent.trim() !== '' && opponent.trim() === '') {
                setOpponent(matchingMatch.opponent);
            }
            
            // Preencher location apenas se não estiver preenchido
            if (location.trim() === '' && matchingMatch.location) {
                setLocation(matchingMatch.location);
            } else if (location.trim() === '') {
                setLocation('Mandante'); // Padrão apenas se location estiver vazio
            }
            
            // Preencher scoreTarget se disponível
            if (matchingMatch.scoreTarget && matchingMatch.scoreTarget.trim() !== '' && scoreTarget.trim() === '') {
                setScoreTarget(matchingMatch.scoreTarget);
            }
            
            // Preencher atletas ativos se ainda não houver entries válidas
            const hasValidEntries = entries.some(e => e.athleteId && e.athleteId.trim() !== '');
            if (!hasValidEntries && players.length > 0) {
                const activePlayers = players.filter(p => (p as any).status === 'Ativo');
                if (activePlayers.length > 0) {
                    const newEntries = activePlayers.map((player, index) => ({
                        id: `${Date.now()}-auto-${index}`,
                        date: normalizedCurrentDate,
                        athleteId: String(player.id).trim(),
                        athleteName: player.name,
                        jerseyNumber: player.jerseyNumber,
                        position: player.position,
                        status: 'Ativo' as const,
                        goals: 0,
                        goalTimes: [],
                        assists: 0,
                        passesCorrect: 0,
                        passesWrong: 0,
                        shotsOn: 0,
                        shotsOff: 0,
                        tacklesPossession: 0,
                        tacklesNoPossession: 0,
                        tacklesCounter: 0,
                        transitionError: 0,
                        card: 'Nenhum' as const,
                        rpe: 5,
                    }));
                    console.log('✅ Preenchendo automaticamente com', newEntries.length, 'atletas ativos da tabela de campeonato');
                    setEntries(newEntries);
                }
            }
        } else {
            console.log('ℹ️ Nenhuma partida encontrada na tabela de campeonato para a data:', normalizedCurrentDate);
        }
    }, [entries, championshipMatches, initialData, opponent, competition, location]);

    // Função para determinar o período do gol (1T ou 2T) baseado no minuto
    const getGoalPeriod = (timeString: string): string => {
        if (!timeString || timeString.trim() === '') return '-';
        
        const trimmedTime = timeString.trim();
        
        // Remover parênteses e período se já existir (ex: "12:43 (1T)" -> "12:43")
        const cleanTime = trimmedTime.replace(/\s*\([12]T\)/gi, '').trim();
        
        // Formato esperado: "MM:SS" ou "M:SS" ou apenas número "MM"
        const timeParts = cleanTime.split(':');
        let minutes = 0;
        
        if (timeParts.length === 2) {
            // Formato "MM:SS" ou "M:SS"
            minutes = parseInt(timeParts[0]) || 0;
        } else if (timeParts.length === 1) {
            // Formato apenas número (minutos)
            minutes = parseInt(timeParts[0]) || 0;
        }
        
        // Em futsal: 1T = 0-20min, 2T = 21-40min
        // Se o minuto for > 0 e <= 20, é 1T; se for > 20 e <= 40, é 2T
        if (minutes > 0 && minutes <= 20) {
            return `${cleanTime} (1T)`;
        } else if (minutes > 20 && minutes <= 40) {
            return `${cleanTime} (2T)`;
        } else if (minutes === 0) {
            // Se for 0, não sabemos o período ainda
            return cleanTime;
        } else {
            // Se passar de 40min, pode ser prorrogação ou erro de digitação
            return `${cleanTime} (ET)`;
        }
    };

    const handlePlayerSelect = (index: number, playerId: string) => {
        console.log('🔍 handlePlayerSelect chamado:', { index, playerId, totalPlayers: players.length });
        
        if (!playerId || playerId === '' || playerId === 'Selecione...') {
            // Se seleção foi limpa, resetar campos
            console.log('🔄 Limpando seleção do atleta');
            const newEntries = [...entries];
            newEntries[index] = {
                ...newEntries[index],
                athleteId: '',
                athleteName: '',
                jerseyNumber: '',
                position: ''
            };
            setEntries(newEntries);
            return;
        }

        // Normalizar IDs para comparação (remover espaços e converter para string)
        const normalizedPlayerId = String(playerId).trim();
        
        console.log('🔍 Buscando atleta com ID normalizado:', normalizedPlayerId);
        console.log('📋 Lista de players disponíveis:', players.map(p => ({ 
            id: p.id, 
            idType: typeof p.id, 
            idString: String(p.id).trim(),
            name: p.name 
        })));
        
        // Tentar encontrar o player de várias formas
        let player = players.find(p => {
            const pId = String(p.id).trim();
            const normalized = normalizedPlayerId;
            const match = pId === normalized;
            if (match) {
                console.log('✅ Match encontrado!', { playerId: p.id, normalized: pId, selected: normalized });
            }
            return match;
        });
        
        // Se não encontrou por comparação exata, tentar comparação mais flexível
        if (!player) {
            console.log('⚠️ Não encontrado por comparação exata, tentando comparação flexível...');
            player = players.find(p => {
                const pId = String(p.id).trim();
                const normalized = normalizedPlayerId;
                // Tentar comparar como número também
                const asNumber = !isNaN(Number(pId)) && !isNaN(Number(normalized));
                if (asNumber) {
                    return Number(pId) === Number(normalized);
                }
                return false;
            });
        }
        
        // Se ainda não encontrou, tentar por nome (caso o ID esteja errado mas o nome esteja correto)
        if (!player) {
            console.log('⚠️ Não encontrado por ID, tentando por nome...');
            const selectElement = document.querySelector(`select[data-entry-index="${index}"]`) as HTMLSelectElement;
            if (selectElement) {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const playerName = selectedOption.text;
                console.log('🔍 Tentando encontrar por nome:', playerName);
                player = players.find(p => p.name === playerName);
            }
        }
        
        const newEntries = [...entries];
        
        console.log('📊 Resultado da busca:', {
            selectedId: normalizedPlayerId,
            found: player ? {
                id: player.id,
                name: player.name,
                jerseyNumber: player.jerseyNumber
            } : null,
            totalPlayers: players.length
        });
        
        if (player) {
            const finalId = String(player.id).trim();
            newEntries[index] = {
                ...newEntries[index],
                athleteId: finalId, // Garantir que o ID seja string normalizado
                athleteName: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position
            };
            console.log('✅ Atleta selecionado com sucesso!', {
                id: finalId,
                name: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position
            });
        } else {
            console.error('❌ ERRO: Atleta não encontrado!', {
                searchedId: normalizedPlayerId,
                availableIds: players.map(p => String(p.id).trim()),
                availableNames: players.map(p => p.name)
            });
            alert(`Erro: Atleta não encontrado no sistema.\n\nID procurado: "${normalizedPlayerId}"\n\nPor favor, verifique se o atleta está cadastrado corretamente.`);
            // Limpar seleção inválida
            newEntries[index] = {
                ...newEntries[index],
                athleteId: '',
                athleteName: '',
                jerseyNumber: '',
                position: ''
            };
        }
        setEntries(newEntries);
    };

    const updateEntry = (index: number, field: keyof ScoutEntry, value: any) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    // Funções helper para incrementar/decrementar estatísticas rapidamente (uso em tempo real)
    const incrementStat = (index: number, field: keyof ScoutEntry, max: number = 100) => {
        const newEntries = [...entries];
        const currentValue = (newEntries[index][field] as number) || 0;
        // RPE tem limite máximo de 10
        const maxValue = field === 'rpe' ? 10 : max;
        if (currentValue < maxValue) {
            newEntries[index] = { ...newEntries[index], [field]: currentValue + 1 };
            setEntries(newEntries);
        }
    };

    const decrementStat = (index: number, field: keyof ScoutEntry, min: number = 0) => {
        const newEntries = [...entries];
        const currentValue = (newEntries[index][field] as number) || 0;
        if (currentValue > min) {
            newEntries[index] = { ...newEntries[index], [field]: currentValue - 1 };
            setEntries(newEntries);
        }
    };

    // Função para registrar estatística via botão (método dinâmico)
    const handleStatButtonClick = (statField: keyof ScoutEntry) => {
        if (isViewMode) {
            alert('A partida está salva e bloqueada para edição.');
            return;
        }
        if (!selectedPlayerId) {
            alert('Selecione um jogador primeiro!');
            return;
        }

        // Caso especial: GOL - registrar com tempo do cronômetro
        if (statField === 'goals') {
            const currentTime = formatEventTime(elapsedTime);
            // Encontrar o índice do entry correspondente ao jogador selecionado
            let entryIndex = entries.findIndex(e => String(e.athleteId).trim() === String(selectedPlayerId).trim());
            
            if (entryIndex === -1) {
                // Se não encontrar, criar um novo entry
                const player = players.find(p => String(p.id).trim() === String(selectedPlayerId).trim());
                if (!player) return;

                const newEntry: ScoutEntry = {
                    id: Date.now().toString(),
                    date: entries[0]?.date || new Date().toISOString().split('T')[0],
                    athleteId: String(player.id).trim(),
                    athleteName: player.name,
                    jerseyNumber: player.jerseyNumber,
                    position: player.position,
                    status: 'Ativo',
                    goals: 1,
                    goalTimes: [{
                        id: Date.now().toString(),
                        time: currentTime,
                        method: '' // Método pode ser adicionado depois se necessário
                    }],
                    assists: 0,
                    passesCorrect: 0,
                    passesWrong: 0,
                    shotsOn: 0,
                    shotsOff: 0,
                    tacklesPossession: 0,
                    tacklesNoPossession: 0,
                    tacklesCounter: 0,
                    transitionError: 0,
                    card: 'Nenhum',
                    rpe: 5,
                };
                setEntries([...entries, newEntry]);
            } else {
                // Adicionar gol com tempo do cronômetro ao entry existente
                const newEntries = [...entries];
                const newGoalTime: GoalTime = {
                    id: Date.now().toString(),
                    time: currentTime,
                    method: '' // Método pode ser adicionado depois se necessário
                };
                newEntries[entryIndex].goalTimes = [...newEntries[entryIndex].goalTimes, newGoalTime];
                newEntries[entryIndex].goals = newEntries[entryIndex].goalTimes.length;
                setEntries(newEntries);
            }
            return; // Já registrou o gol, não precisa incrementar mais
        }

        // Encontrar o índice do entry correspondente ao jogador selecionado
        let entryIndex = entries.findIndex(e => String(e.athleteId).trim() === String(selectedPlayerId).trim());
        
        if (entryIndex === -1) {
            // Se não encontrar, criar um novo entry
            const player = players.find(p => String(p.id).trim() === String(selectedPlayerId).trim());
            if (!player) return;

            const newEntry: ScoutEntry = {
                id: Date.now().toString(),
                date: entries[0]?.date || new Date().toISOString().split('T')[0],
                athleteId: String(player.id).trim(),
                athleteName: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                status: 'Ativo',
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: 'Nenhum',
                rpe: 5,
            };
            // Para RPE, valor inicial é 5, para outras estatísticas é 1
            (newEntry as unknown as Record<string, number | string>)[statField] = statField === 'rpe' ? 5 : 1;
            setEntries([...entries, newEntry]);
        } else {
            // Incrementar a estatística do jogador selecionado
            incrementStat(entryIndex, statField);
        }
    };

    // Função para decrementar estatística específica
    const handleStatButtonDecrement = (statField: keyof ScoutEntry) => {
        if (isViewMode || !selectedPlayerId) {
            return;
        }

        // Encontrar o índice do entry correspondente ao jogador selecionado
        const entryIndex = entries.findIndex(e => String(e.athleteId).trim() === String(selectedPlayerId).trim());
        
        if (entryIndex === -1) return;

        // Decrementar a estatística específica
        decrementStat(entryIndex, statField);
    };

    // Função para registrar cartão (amarelo ou vermelho)
    const handleCardClick = (cardType: 'Amarelo' | 'Vermelho') => {
        if (isViewMode) {
            alert('A partida está salva e bloqueada para edição.');
            return;
        }
        if (!selectedPlayerId) {
            alert('Selecione um jogador primeiro!');
            return;
        }

        // Encontrar o índice do entry correspondente ao jogador selecionado
        let entryIndex = entries.findIndex(e => String(e.athleteId).trim() === String(selectedPlayerId).trim());
        
        if (entryIndex === -1) {
            // Se não encontrar, criar um novo entry
            const player = players.find(p => String(p.id).trim() === String(selectedPlayerId).trim());
            if (!player) return;

            const newEntry: ScoutEntry = {
                id: Date.now().toString(),
                date: entries[0]?.date || new Date().toISOString().split('T')[0],
                athleteId: String(player.id).trim(),
                athleteName: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                status: 'Ativo',
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: cardType === 'Amarelo' ? 'Amarelo' : 'Vermelho',
                rpe: 5,
            };
            setEntries([...entries, newEntry]);
        } else {
            // Atualizar cartão do jogador selecionado
            const newEntries = [...entries];
            const currentCard = newEntries[entryIndex].card;
            
            // Lógica de cartões com conversão automática de 2 amarelos = vermelho
            if (cardType === 'Amarelo') {
                if (currentCard === 'Nenhum') {
                    newEntries[entryIndex].card = 'Amarelo';
                } else if (currentCard === 'Amarelo') {
                    // 2 amarelos = vermelho automático
                    newEntries[entryIndex].card = 'Amarelo/Amarelo/Vermelho';
                    alert(`⚠️ ${newEntries[entryIndex].athleteName} recebeu 2 cartões amarelos e foi automaticamente expulso!`);
                } else if (currentCard === 'Amarelo/Vermelho' || currentCard === 'Amarelo/Amarelo/Vermelho') {
                    // Já tem vermelho, não pode receber mais amarelos
                    alert('Este jogador já foi expulso e não pode receber mais cartões.');
                    return;
                } else if (currentCard === 'Vermelho') {
                    // Já tem vermelho direto, não pode receber amarelo
                    alert('Este jogador já foi expulso e não pode receber mais cartões.');
                    return;
                } else {
                    newEntries[entryIndex].card = 'Amarelo';
                }
            } else if (cardType === 'Vermelho') {
                if (currentCard === 'Nenhum') {
                    newEntries[entryIndex].card = 'Vermelho';
                } else if (currentCard === 'Amarelo') {
                    newEntries[entryIndex].card = 'Amarelo/Vermelho';
                } else if (currentCard === 'Amarelo/Vermelho' || currentCard === 'Amarelo/Amarelo/Vermelho' || currentCard === 'Vermelho') {
                    // Já tem vermelho, não pode receber mais
                    alert('Este jogador já foi expulso e não pode receber mais cartões.');
                    return;
                } else {
                    newEntries[entryIndex].card = 'Vermelho';
                }
            }
            
            setEntries(newEntries);
        }
    };


    const addGoalTime = (index: number) => {
        const newEntries = [...entries];
        const newGoalTime: GoalTime = {
            id: Date.now().toString(),
            time: '',
            method: ''
        };
        newEntries[index].goalTimes = [...newEntries[index].goalTimes, newGoalTime];
        // Atualizar contador de gols
        newEntries[index].goals = newEntries[index].goalTimes.length;
        setEntries(newEntries);
    };

    const removeGoalTime = (entryIndex: number, goalTimeId: string) => {
        const newEntries = [...entries];
        newEntries[entryIndex].goalTimes = newEntries[entryIndex].goalTimes.filter(gt => gt.id !== goalTimeId);
        // Atualizar contador de gols
        newEntries[entryIndex].goals = newEntries[entryIndex].goalTimes.length;
        setEntries(newEntries);
    };

    const updateGoalTime = (entryIndex: number, goalTimeId: string, time: string) => {
        const newEntries = [...entries];
        const goalTime = newEntries[entryIndex].goalTimes.find(gt => gt.id === goalTimeId);
        if (goalTime) {
            goalTime.time = time;
            setEntries(newEntries);
        }
    };

    const updateGoalMethod = (entryIndex: number, goalTimeId: string, method: string) => {
        const newEntries = [...entries];
        const goalTime = newEntries[entryIndex].goalTimes.find(gt => gt.id === goalTimeId);
        if (goalTime) {
            goalTime.method = method;
            setEntries(newEntries);
        }
    };

    const addGoalConceded = () => {
        const currentTime = formatEventTime(elapsedTime);
        const newGoalConceded: GoalConceded = {
            id: Date.now().toString() + Math.random(),
            time: currentTime, // Usar tempo atual do cronômetro
            method: ''
        };
        setGoalsConceded([...goalsConceded, newGoalConceded]);
        // Resetar flag quando novo gol é adicionado
        setGoalsConcededSaved(false);
    };

    const removeGoalConceded = (goalConcededId: string) => {
        const newGoalsConceded = goalsConceded.filter(gc => gc.id !== goalConcededId);
        setGoalsConceded(newGoalsConceded);
        // Resetar flag quando gol é removido
        setGoalsConcededSaved(false);
    };

    const updateGoalConcededTime = (goalConcededId: string, time: string) => {
        const newGoalsConceded = goalsConceded.map(gc => 
            gc.id === goalConcededId ? { ...gc, time } : gc
        );
        setGoalsConceded(newGoalsConceded);
        // Resetar flag quando tempo é alterado
        if (goalsConcededSaved) {
            setGoalsConcededSaved(false);
        }
    };

    const updateGoalConcededMethod = (goalConcededId: string, method: string) => {
        const newGoalsConceded = goalsConceded.map(gc => 
            gc.id === goalConcededId ? { ...gc, method } : gc
        );
        setGoalsConceded(newGoalsConceded);
        // Resetar flag quando método é alterado
        if (goalsConcededSaved) {
            setGoalsConcededSaved(false);
        }
    };

    const handleSaveGoalsConceded = () => {
        // Validar que pelo menos um gol tomado tem tempo preenchido
        const hasValidGoals = goalsConceded.some(gc => gc.time && gc.time.trim() !== '');
        
        if (goalsConceded.length > 0 && !hasValidGoals) {
            alert("Por favor, preencha pelo menos o minuto de um gol tomado antes de salvar.");
            return;
        }

        // Validar que todos os gols com tempo têm método
        const goalsWithoutMethod = goalsConceded.filter(gc => gc.time && gc.time.trim() !== '' && (!gc.method || gc.method.trim() === ''));
        if (goalsWithoutMethod.length > 0) {
            const confirmSave = confirm(`${goalsWithoutMethod.length} gol(is) tomado(s) não tem método selecionado. Deseja salvar mesmo assim?`);
            if (!confirmSave) {
                return;
            }
        }

        setGoalsConcededSaved(true);
        alert(`✅ ${goalsConceded.length} gol(is) tomado(s) salvo(s) com sucesso! Agora você pode salvar a partida completa.`);
    };

    // Funções para gerenciar Entradas e Saídas (TimeControl)
    const loadTimeControls = async (matchId: string) => {
        if (!matchId) return;
        try {
            setIsLoadingTimeControls(true);
            const existing = await timeControlsApi.getByMatchId(matchId);
            setTimeControls(existing);
            setCurrentMatchId(matchId);
        } catch (error) {
            console.error('Erro ao carregar controles de tempo:', error);
            setTimeControls([]);
        } finally {
            setIsLoadingTimeControls(false);
        }
    };

    const handleTimeModalConfirm = (minute: number, second: number) => {
        if (!selectedPlayerId || !currentMatchId) return;
        
        const timeString = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
        
        setTimeControls(prev => {
            const existing = prev.find(tc => tc.playerId === selectedPlayerId && tc.matchId === currentMatchId);
            
            if (existing) {
                // Atualizar time control existente
                const updated = { ...existing };
                if (timeModalType === 'entry') {
                    // Adicionar nova entrada
                    const lastEntry = updated.timeEntries[updated.timeEntries.length - 1];
                    if (lastEntry && !lastEntry.entryTime) {
                        // Preencher entrada vazia
                        lastEntry.entryTime = timeString;
                    } else {
                        // Adicionar nova entrada
                        updated.timeEntries.push({ entryTime: timeString, exitTime: undefined });
                    }
                } else {
                    // Adicionar saída na última entrada sem saída
                    const lastEntry = updated.timeEntries[updated.timeEntries.length - 1];
                    if (lastEntry && lastEntry.entryTime && !lastEntry.exitTime) {
                        lastEntry.exitTime = timeString;
                    }
                }
                return prev.map(tc => tc.id === existing.id ? updated : tc);
            } else {
                // Criar novo time control
                const player = players.find(p => String(p.id).trim() === selectedPlayerId);
                if (!player) return prev;
                
                const newTimeControl: PlayerTimeControl = {
                    id: `${currentMatchId}-${selectedPlayerId}`,
                    matchId: currentMatchId,
                    playerId: selectedPlayerId,
                    timeEntries: timeModalType === 'entry' 
                        ? [{ entryTime: timeString, exitTime: undefined }]
                        : [{ entryTime: '', exitTime: timeString }],
                    totalTime: 0
                };
                return [...prev, newTimeControl];
            }
        });
    };

    const handleSaveTimeControls = async () => {
        if (!currentMatchId || timeControls.length === 0) {
            alert('Nenhum controle de tempo para salvar.');
            return;
        }

        try {
            await timeControlsApi.saveForMatch(currentMatchId, timeControls);
            alert(`✅ ${timeControls.length} controle(s) de tempo salvo(s) com sucesso!`);
        } catch (error) {
            console.error('Erro ao salvar controles de tempo:', error);
            alert('❌ Erro ao salvar controles de tempo. Verifique o console.');
        }
    };

    const handleEntryButtonClick = () => {
        if (!selectedPlayerId) {
            alert('Selecione um jogador primeiro.');
            return;
        }
        if (!currentMatchId) {
            alert('Salve a partida primeiro para registrar entradas e saídas.');
            return;
        }
        setTimeModalType('entry');
        setShowTimeModal(true);
    };

    const handleExitButtonClick = () => {
        if (!selectedPlayerId) {
            alert('Selecione um jogador primeiro.');
            return;
        }
        if (!currentMatchId) {
            alert('Salve a partida primeiro para registrar entradas e saídas.');
            return;
        }
        setTimeModalType('exit');
        setShowTimeModal(true);
    };

    const addRow = () => {
        const lastEntry = entries[entries.length - 1];
        setEntries([...entries, { 
            ...lastEntry, 
            id: Date.now().toString(), 
            athleteId: '', 
            athleteName: '', 
            jerseyNumber: '', 
            position: '', 
            goals: 0, 
            goalTimes: [],
            assists: 0, 
            passesCorrect: 0, 
            passesWrong: 0, 
            shotsOn: 0, 
            shotsOff: 0, 
            tacklesPossession: 0, 
            tacklesNoPossession: 0, 
            tacklesCounter: 0, 
            transitionError: 0, 
            card: 'Nenhum', 
            rpe: 5
        }]);
    };

    const removeRow = (index: number) => {
        if (entries.length > 1) {
            setEntries(entries.filter((_, i) => i !== index));
        }
    };

    const toggleMatchExpanded = (matchId: string) => {
        setExpandedMatches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(matchId)) {
                newSet.delete(matchId);
            } else {
                newSet.add(matchId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        if (!opponent) {
            alert("Por favor, informe o adversário.");
            return;
        }

        if (!competition) {
            alert("Por favor, selecione a competição.");
            return;
        }

        if (!location) {
            alert("Por favor, selecione o local (Mandante/Visitante).");
            return;
        }

        // Validar que há pelo menos um atleta válido (com ID E nome)
        const hasValidEntries = entries.some(entry => 
            entry.athleteId && entry.athleteId.trim() !== '' && 
            entry.athleteName && entry.athleteName.trim() !== ''
        );
        if (!hasValidEntries) {
            alert("Por favor, selecione pelo menos um atleta válido antes de salvar.");
            return;
        }

        // Validar que gols tomados foram salvos (se houver gols tomados)
        if (goalsConceded.length > 0 && !goalsConcededSaved) {
            alert("Por favor, clique em 'Salvar Gols Tomados' antes de salvar a partida completa.");
            return;
        }

        // Verificar regras de suspensão do campeonato (avisos informativos)
        const suspensionWarnings: string[] = [];
        if (competition) {
            // Carregar campeonatos do localStorage
            const savedChampionships = JSON.parse(localStorage.getItem('championships') || '[]');
            const championship = savedChampionships.find((c: any) => c.name === competition);
            
            if (championship && championship.suspensionRules) {
                const rules = championship.suspensionRules;
                
                // Contar cartões por jogador nesta partida
                entries.forEach(entry => {
                    if (!entry.athleteId || !entry.athleteName) return;
                    
                    const yellowCards = entry.card.includes('Amarelo') ? 1 : 0;
                    const redCards = entry.card.includes('Vermelho') ? 1 : 0;
                    
                    // Verificar se jogador recebeu cartão vermelho
                    if (redCards > 0) {
                        suspensionWarnings.push(
                            `⚠️ ${entry.athleteName} recebeu cartão vermelho e será suspenso por ${rules.redCardSuspension} jogo(s)`
                        );
                    }
                    
                    // Verificar acumulação de amarelos (se houver histórico)
                    // Nota: Para uma implementação completa, seria necessário rastrear histórico de cartões
                    // Por enquanto, apenas avisar sobre cartões nesta partida
                    if (yellowCards > 0 && rules.yellowCardsForSuspension) {
                        const remaining = rules.yellowCardsForSuspension - yellowCards;
                        if (remaining <= 1) {
                            suspensionWarnings.push(
                                `⚠️ ${entry.athleteName} está próximo da suspensão por acumulação de amarelos (${yellowCards}/${rules.yellowCardsForSuspension})`
                            );
                        }
                    }
                });
            }
        }
        
        // Mostrar avisos se houver (não bloqueia o salvamento)
        if (suspensionWarnings.length > 0) {
            const warningsText = suspensionWarnings.join('\n');
            alert(`Avisos de Suspensão:\n\n${warningsText}\n\nVocê pode continuar salvando a partida.`);
        }

        if (!onSave) {
            console.error('❌ Erro: onSave não está definido');
            alert("Erro: Função de salvamento não disponível. Recarregue a página.");
            return;
        }

        // Aggregate Team Stats
        const teamStats: MatchStats = entries.reduce((acc, entry) => {
            acc.goals += entry.goals;
            acc.assists += entry.assists;
            acc.passesCorrect += entry.passesCorrect;
            acc.passesWrong += entry.passesWrong;
            acc.shotsOnTarget += entry.shotsOn;
            acc.shotsOffTarget += entry.shotsOff;
            acc.tacklesWithBall += entry.tacklesPossession;
            acc.tacklesWithoutBall += entry.tacklesNoPossession;
            acc.tacklesCounterAttack += entry.tacklesCounter;
            acc.transitionErrors += entry.transitionError;
            
            // Cards logic
            if (entry.card !== 'Nenhum') {
                if (entry.card.includes('Amarelo')) acc.yellowCards = (acc.yellowCards ?? 0) + 1;
                if (entry.card.includes('Vermelho')) acc.redCards = (acc.redCards ?? 0) + 1;
            }
            
            // Accumulate RPE for average
            acc.rpeMatch = (acc.rpeMatch ?? 0) + entry.rpe;

            return acc;
        }, {
            goals: 0,
            assists: 0,
            passesCorrect: 0,
            passesWrong: 0,
            shotsOnTarget: 0,
            shotsOffTarget: 0,
            tacklesWithBall: 0,
            tacklesWithoutBall: 0,
            tacklesCounterAttack: 0,
            transitionErrors: 0,
            minutesPlayed: 40,
            goalsConceded: goalsConceded.length,
            yellowCards: 0,
            redCards: 0,
            rpeMatch: 0,
            goalsScoredOpenPlay: 0,
            goalsScoredSetPiece: 0,
            goalsConcededOpenPlay: 0,
            goalsConcededSetPiece: 0,
        } as MatchStats);

        // Finalize averages
        teamStats.rpeMatch = parseFloat(((teamStats.rpeMatch ?? 0) / entries.length).toFixed(1));
        
        // Processar métodos dos gols feitos
        const goalMethodsScored: Record<string, number> = {};
        entries.forEach(entry => {
            entry.goalTimes.forEach(goalTime => {
                if (goalTime.method && goalTime.method.trim() !== '') {
                    goalMethodsScored[goalTime.method] = (goalMethodsScored[goalTime.method] || 0) + 1;
                }
            });
        });
        teamStats.goalMethodsScored = goalMethodsScored;
        
        // Processar métodos dos gols tomados
        const goalMethodsConceded: Record<string, number> = {};
        goalsConceded.forEach(goalConceded => {
            if (goalConceded.method && goalConceded.method.trim() !== '') {
                goalMethodsConceded[goalConceded.method] = (goalMethodsConceded[goalConceded.method] || 0) + 1;
            }
        });
        teamStats.goalMethodsConceded = goalMethodsConceded;
        
        // Atualizar total de gols tomados baseado no array
        teamStats.goalsConceded = goalsConceded.length;
        
        // Calcular resultado automaticamente baseado em gols feitos vs tomados
        const totalGoalsScored = teamStats.goals;
        const totalGoalsConceded = goalsConceded.length;
        let calculatedResult: 'Vitória' | 'Derrota' | 'Empate' = 'Empate';
        if (totalGoalsScored > totalGoalsConceded) {
            calculatedResult = 'Vitória';
        } else if (totalGoalsConceded > totalGoalsScored) {
            calculatedResult = 'Derrota';
        } else {
            calculatedResult = 'Empate';
        }
        
        // Salvar tempos reais dos gols feitos (agregar de todos os jogadores)
        // Salvar com período formatado para facilitar o parse depois
        const allGoalTimes: Array<{ time: string; method?: string }> = [];
        entries.forEach(entry => {
            entry.goalTimes.forEach(goalTime => {
                if (goalTime.time && goalTime.time.trim() !== '') {
                    // Formatar o tempo com período antes de salvar
                    const formattedTime = getGoalPeriod(goalTime.time);
                    allGoalTimes.push({
                        time: formattedTime,
                        method: goalTime.method && goalTime.method.trim() !== '' ? goalTime.method.trim() : undefined
                    });
                }
            });
        });
        teamStats.goalTimes = allGoalTimes.length > 0 ? allGoalTimes : undefined;
        
        // Salvar tempos reais dos gols tomados (com período formatado)
        const allGoalsConcededTimes: Array<{ time: string; method?: string }> = [];
        goalsConceded.forEach(goalConceded => {
            if (goalConceded.time && goalConceded.time.trim() !== '') {
                // Formatar o tempo com período antes de salvar
                const formattedTime = getGoalPeriod(goalConceded.time);
                allGoalsConcededTimes.push({
                    time: formattedTime,
                    method: goalConceded.method && goalConceded.method.trim() !== '' ? goalConceded.method.trim() : undefined
                });
            }
        });
        teamStats.goalsConcededTimes = allGoalsConcededTimes.length > 0 ? allGoalsConcededTimes : undefined;
        
        // Simple heuristic for origin breakdown (mantido para compatibilidade)
        teamStats.goalsScoredOpenPlay = teamStats.goals;
        teamStats.goalsConcededOpenPlay = goalsConceded.length;

        // Create Player Stats Map
        const playerStats: Record<string, MatchStats> = {};
        entries.forEach(entry => {
            // Validar que há um athleteId válido E que o atleta foi encontrado (tem nome)
            if (entry.athleteId && entry.athleteId.trim() !== '' && entry.athleteName && entry.athleteName.trim() !== '') {
                // Normalizar ID do atleta
                const normalizedPlayerId = String(entry.athleteId).trim();
                
                // Processar métodos dos gols feitos por este jogador individualmente
                const playerGoalMethodsScored: Record<string, number> = {};
                entry.goalTimes.forEach(goalTime => {
                    if (goalTime.method && goalTime.method.trim() !== '') {
                        playerGoalMethodsScored[goalTime.method] = (playerGoalMethodsScored[goalTime.method] || 0) + 1;
                    }
                });
                
                // Criar objeto playerStats com todas as informações do Input de Dados
                const playerStat: MatchStats = {
                    goals: entry.goals,
                    assists: entry.assists,
                    passesCorrect: entry.passesCorrect,
                    passesWrong: entry.passesWrong,
                    shotsOnTarget: entry.shotsOn,
                    shotsOffTarget: entry.shotsOff,
                    tacklesWithBall: entry.tacklesPossession,
                    tacklesWithoutBall: entry.tacklesNoPossession,
                    tacklesCounterAttack: entry.tacklesCounter,
                    transitionErrors: entry.transitionError,
                    minutesPlayed: 40,
                    goalsConceded: 0,
                    yellowCards: entry.card.includes('Amarelo') ? 1 : 0,
                    redCards: entry.card.includes('Vermelho') ? 1 : 0,
                    rpeMatch: entry.rpe,
                    goalsScoredOpenPlay: entry.goals,
                    goalsScoredSetPiece: 0,
                    goalsConcededOpenPlay: 0,
                    goalsConcededSetPiece: 0,
                    goalMethodsScored: Object.keys(playerGoalMethodsScored).length > 0 ? playerGoalMethodsScored : undefined,
                    goalMethodsConceded: undefined // Gols tomados são do time, não individuais
                };
                
                // Adicionar informações adicionais do jogador para uso no TimeControl
                // (usando type assertion para adicionar campos extras que não estão no tipo MatchStats)
                (playerStat as any).playerName = entry.athleteName;
                (playerStat as any).position = entry.position;
                (playerStat as any).jerseyNumber = entry.jerseyNumber;
                
                playerStats[normalizedPlayerId] = playerStat;
            }
        });

        // Validar que teamStats está completo antes de salvar
        if (!teamStats || typeof teamStats.minutesPlayed === 'undefined') {
            console.error('❌ Erro: teamStats inválido:', teamStats);
            alert('Erro ao preparar dados para salvamento. Verifique o console para mais detalhes.');
            return;
        }

        const newMatch: MatchRecord = {
            id: Date.now().toString(),
            competition: competition,
            date: entries[0].date,
            goalsFor: teamStats.goals,
            goalsAgainst: goalsConceded.length,
            opponent: opponent,
            result: calculatedResult === 'Vitória' ? 'V' : calculatedResult === 'Derrota' ? 'D' : 'E',
            teamStats: teamStats,
            playerStats: playerStats
        };

        console.log('💾 Salvando partida:', {
            id: newMatch.id,
            competition: newMatch.competition,
            opponent: newMatch.opponent,
            teamStats: {
                goals: teamStats.goals,
                goalsConceded: teamStats.goalsConceded,
                minutesPlayed: teamStats.minutesPlayed
            },
            hasPlayerStats: Object.keys(playerStats).length > 0,
            playerStatsKeys: Object.keys(playerStats),
            playerStatsCount: Object.keys(playerStats).length,
            goalMethodsScored: teamStats.goalMethodsScored,
            goalMethodsConceded: teamStats.goalMethodsConceded,
            entriesWithAthleteId: entries.filter(e => e.athleteId && e.athleteId.trim() !== '').length
        });

        try {
        onSave(newMatch);
        
        // Definir match ID atual e carregar time controls
        setCurrentMatchId(newMatch.id);
        loadTimeControls(newMatch.id);
        
        // Bloquear para edição após salvar
        setSavedMatchId(newMatch.id);
        setIsViewMode(true);
        setIsCreatingNew(false);
        setExpandedMatches(new Set([newMatch.id])); // Expandir a partida recém-salva
        
            // Reset necessary fields apenas se salvamento for bem-sucedido
        setOpponent('');
            setCompetition('');
            setLocation('');
            setMatchResult('Sem informação');
            setGoalsConceded([]);
            setGoalsConcededSaved(false);
            
            // Limpar entries mas manter pelo menos uma linha
            setEntries([{
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                athleteId: '',
                athleteName: '',
                jerseyNumber: '',
                position: '',
                status: 'Ativo',
                goals: 0,
                goalTimes: [],
                assists: 0,
                passesCorrect: 0,
                passesWrong: 0,
                shotsOn: 0,
                shotsOff: 0,
                tacklesPossession: 0,
                tacklesNoPossession: 0,
                tacklesCounter: 0,
                transitionError: 0,
                card: 'Nenhum',
                rpe: 5
            }]);
        } catch (error) {
            console.error('❌ Erro ao salvar partida:', error);
            alert('Erro ao salvar partida. Verifique o console para mais detalhes.');
        }
    };

    // Formatar data para exibição
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };
    
    // Calcular placar em tempo real
    const totalGoalsScored = useMemo(() => {
        return entries.reduce((sum, entry) => sum + entry.goals, 0);
    }, [entries]);
    
    const totalGoalsConceded = goalsConceded.length;
    const scoreDifference = totalGoalsScored - totalGoalsConceded;
    
    // Mensagem de status baseada no placar
    const getScoreMessage = () => {
        if (scoreDifference > 0) {
            return { text: 'Vantagem', color: 'text-green-400', bgColor: 'bg-green-400/20', borderColor: 'border-green-400' };
        } else if (scoreDifference === 0) {
            return { text: 'Empatado', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', borderColor: 'border-yellow-400' };
        } else {
            return { text: 'Desvantagem', color: 'text-red-400', bgColor: 'bg-red-400/20', borderColor: 'border-red-400' };
        }
    };
    
    const scoreMessage = getScoreMessage();
    const teamName = teams.length > 0 ? teams[0].nome : 'Nossa Equipe';

    // Função para verificar se uma partida não foi executada
    const isMatchNotExecuted = (match: MatchRecord | null): boolean => {
        if (!match) return false;
        
        // Verificar se é uma partida programada que foi salva mas não executada
        // Uma partida não executada tem teamStats zerados ou inexistentes
        if (!match.teamStats) return true;
        
        // Verificar se todas as estatísticas principais estão zeradas
        const hasNoStats = 
            match.teamStats.goals === 0 &&
            match.teamStats.assists === 0 &&
            match.teamStats.passesCorrect === 0 &&
            match.teamStats.passesWrong === 0 &&
            match.teamStats.shotsOnTarget === 0 &&
            match.teamStats.shotsOffTarget === 0 &&
            match.teamStats.tacklesWithBall === 0 &&
            match.teamStats.tacklesWithoutBall === 0 &&
            match.teamStats.tacklesCounterAttack === 0 &&
            match.teamStats.transitionErrors === 0 &&
            Object.keys(match.playerStats || {}).length === 0;
        
        return hasNoStats;
    };

    // Função para determinar o status da partida
    const getMatchStatus = (item: CalendarMatchItem): 'programada' | 'incompleto' | 'finalizado' => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const matchDate = new Date(item.date);
        matchDate.setHours(0, 0, 0, 0);
        
        const isPast = matchDate <= now;
        
        if (item.type === 'scheduled') {
            if (isPast) {
                const hasMatchRecord = matches.find(m => {
                    const mDate = new Date(m.date);
                    mDate.setHours(0, 0, 0, 0);
                    return mDate.getTime() === matchDate.getTime() &&
                           m.opponent === item.opponent;
                });
                return hasMatchRecord ? 'finalizado' : 'incompleto';
            }
            return 'programada';
        }
        
        if (item.type === 'saved') {
            const match = item as MatchRecord;
            const hasData = 
                match.teamStats &&
                (match.teamStats.goals > 0 ||
                 (match.teamStats.goalsConceded ?? 0) > 0 ||
                 Object.keys(match.playerStats || {}).length > 0);
            
            return hasData ? 'finalizado' : 'incompleto';
        }
        
        return 'programada';
    };

    // Partidas unificadas (salvas + programadas) filtradas por intervalo de datas
    const filteredMatches = useMemo((): CalendarMatchItem[] => {
        const saved: CalendarMatchItem[] = matches.map((m) => ({ ...m, type: 'saved' as const }));
        const scheduled: CalendarMatchItem[] = championshipMatches.map((m) => ({ ...m, type: 'scheduled' as const }));
        const all: CalendarMatchItem[] = [...saved, ...scheduled];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return all
            .filter((match) => {
                const matchDate = new Date(match.date);
                matchDate.setHours(12, 0, 0, 0);
                return matchDate >= start && matchDate <= end;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [matches, championshipMatches, startDate, endDate]);

    const handleResetToCurrentMonth = () => {
        const now = new Date();
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    };

    const handleMatchClick = (item: CalendarMatchItem) => {
        setCollectionType(null);
        setShowPostMatchSheet(false);
        if (item.type === 'saved') {
            const m = item as MatchRecord;
            setSelectedMatch(m);
            setSelectedScheduledMatch(null);
            setViewMode('analysis');
        } else {
            const cm = item as ChampionshipMatch & { type: 'scheduled' };
            setSelectedScheduledMatch(cm);
            setSelectedMatch(null);
            setSelectedPlayersForMatch(new Set());
            setPreparationMatchType('normal');
            setPreparationExtraTimeMinutes(5);
            setViewMode('analysis');
        }
    };

    // Função helper para verificar se é partida programada
    const isScheduledMatch = (): boolean => {
        return selectedScheduledMatch !== null;
    };

    const handleBackToCalendar = () => {
        setViewMode('calendar');
        setSelectedMatch(null);
        setSelectedScheduledMatch(null);
        setSelectedPlayersForMatch(new Set());
        setSavedMatchId(null);
        setIsViewMode(false);
        setIsCreatingNew(false);
        setSelectedPlayerId(null);
        setCurrentMatchId(null);
        setOpponent('');
        setCompetition('');
        setLocation('');
        setScoreTarget('');
        setMatchResult('Sem informação');
        setGoalsConceded([]);
        setGoalsConcededSaved(false);
        setCollectionType(null);
        setShowPostMatchSheet(false);
        setShowScoutingWindow(false);
        setShowMatchTypeModal(false);
        setShowStartScoutConfirmation(false);
        setEntries([{
            id: '1',
            date: new Date().toISOString().split('T')[0],
            athleteId: '',
            athleteName: '',
            jerseyNumber: '',
            position: '',
            status: 'Ativo',
            goals: 0,
            goalTimes: [],
            assists: 0,
            passesCorrect: 0,
            passesWrong: 0,
            shotsOn: 0,
            shotsOff: 0,
            tacklesPossession: 0,
            tacklesNoPossession: 0,
            tacklesCounter: 0,
            transitionError: 0,
            card: 'Nenhum',
            rpe: 5,
        }]);
    };
    
    // Lesão ativa = sem data de retorno real nem alta (em recuperação)
    const isPlayerInjured = (player: Player): boolean => {
        if (!player.injuryHistory || player.injuryHistory.length === 0) return false;
        return player.injuryHistory.some(injury => !(injury.returnDateActual || injury.endDate));
    };

    // Preparação: fisiologia (PSE/PSR/Sono) e status de suspenso/pendurado por campeonato
    const preparationData = useMemo(() => {
        const championships: Championship[] = [];
        try {
            const raw = localStorage.getItem('championships');
            if (raw) championships.push(...JSON.parse(raw));
        } catch (_) {}
        const match = selectedScheduledMatch;
        if (!match || !players.length) {
            return { physiology: {} as Record<string, { psrMatchDay: number | null; pseAfterLastTraining: number | null; sleepMatchDay: number | null }>, suspendedIds: new Set<string>(), penduradoIds: new Set<string>() };
        }
        const playerIds = players.map(p => p.id);
        const physiology = getPlayerPhysiologyForMatch(match.date, playerIds, schedules, championshipMatches);
        const suspendedIds = new Set<string>();
        const penduradoIds = new Set<string>();
        if (match.competition && championships.length) {
            const champ = championships.find((c: Championship) => c.name === match.competition);
            if (champ?.suspensionRules) {
                const rules = champ.suspensionRules;
                players.forEach((p) => {
                    const status = getPlayerStatus(champ.id, p.id, rules);
                    if (status.suspended) suspendedIds.add(p.id);
                    else if (status.pendurado) penduradoIds.add(p.id);
                });
            }
        }
        return { physiology, suspendedIds, penduradoIds };
    }, [selectedScheduledMatch, players, schedules, championshipMatches]);

    // Mesmo para preparação de partida salva (tempo real)
    const preparationDataSavedMatch = useMemo(() => {
        const championships: Championship[] = [];
        try {
            const raw = localStorage.getItem('championships');
            if (raw) championships.push(...JSON.parse(raw));
        } catch (_) {}
        const match = selectedMatch;
        if (!match || !players.length) {
            return { physiology: {} as Record<string, { psrMatchDay: number | null; pseAfterLastTraining: number | null; sleepMatchDay: number | null }>, suspendedIds: new Set<string>(), penduradoIds: new Set<string>() };
        }
        const playerIds = players.map(p => p.id);
        const physiology = getPlayerPhysiologyForMatch(match.date, playerIds, schedules, championshipMatches);
        const suspendedIds = new Set<string>();
        const penduradoIds = new Set<string>();
        if (match.competition && championships.length) {
            const champ = championships.find((c: Championship) => c.name === match.competition);
            if (champ?.suspensionRules) {
                const rules = champ.suspensionRules;
                players.forEach((p) => {
                    const status = getPlayerStatus(champ.id, p.id, rules);
                    if (status.suspended) suspendedIds.add(p.id);
                    else if (status.pendurado) penduradoIds.add(p.id);
                });
            }
        }
        return { physiology, suspendedIds, penduradoIds };
    }, [selectedMatch, players, schedules, championshipMatches]);
    
    const isPlayerSuspended = (playerId: string): boolean => {
        const entry = entries.find(e => String(e.athleteId).trim() === String(playerId).trim());
        if (!entry) return false;
        // Suspenso se recebeu vermelho ou 2 amarelos
        return entry.card.includes('Vermelho') || entry.card === 'Amarelo/Amarelo/Vermelho';
    };
    
    const getYellowCardCount = (playerId: string): number => {
        const entry = entries.find(e => String(e.athleteId).trim() === String(playerId).trim());
        if (!entry) return 0;
        if (entry.card === 'Amarelo') return 1;
        if (entry.card === 'Amarelo/Vermelho' || entry.card === 'Amarelo/Amarelo/Vermelho') return 2;
        return 0;
    };

    // Componente helper para botões de estatística
    const StatButton: React.FC<{ label: string; color: string; icon: any; onClick: () => void; onDecrement?: () => void; value: number }> = ({ label, color, icon: Icon, onClick, onDecrement, value }) => (
        <div className="relative">
            <button 
                onClick={onClick}
                className={`${color} border p-4 font-bold uppercase tracking-tight text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center gap-2 rounded-xl min-h-[100px] w-full`}
            >
                <Icon size={24} strokeWidth={3} />
                <span>{label}</span>
                <span className="text-2xl font-black">{value}</span>
            </button>
            {onDecrement && value > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDecrement();
                    }}
                    className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg z-10 transition-all hover:scale-110 active:scale-95"
                    title="Diminuir"
                >
                    <Minus size={12} strokeWidth={3} />
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {viewMode === 'calendar' && (
                <div className="space-y-6" lang="pt-BR">
                    <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide mb-6">
                            <Calendar className="text-[#00f0ff]" size={28} /> Calendário de Jogos
                        </h2>
                        <div className="flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Data inicial</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    lang="pt-BR"
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Data final</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    lang="pt-BR"
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                                />
                            </div>
                            <button
                                onClick={handleResetToCurrentMonth}
                                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl transition-colors"
                            >
                                Mês atual
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMatches.map((item) => (
                            <button
                                key={item.type === 'saved' ? item.id : `sched-${item.id}`}
                                type="button"
                                onClick={() => handleMatchClick(item)}
                                className="bg-black rounded-2xl border-2 border-zinc-900 p-4 text-left hover:border-[#00f0ff]/50 hover:bg-zinc-950 transition-all cursor-pointer shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                        (() => {
                                            const status = getMatchStatus(item);
                                            if (status === 'programada') return 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50';
                                            if (status === 'incompleto') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
                                            if (status === 'finalizado') return 'bg-red-500/20 text-red-400 border border-red-500/50';
                                            return 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/50';
                                        })()
                                    }`}>
                                        {(() => {
                                            const status = getMatchStatus(item);
                                            if (status === 'programada') return 'Programada';
                                            if (status === 'incompleto') return 'Incompleto';
                                            if (status === 'finalizado') return 'Finalizado';
                                            return 'N/A';
                                        })()}
                                    </span>
                                    <span className="text-zinc-500 text-xs font-bold">{formatDate(item.date)}</span>
                                </div>
                                <p className="text-white font-bold text-sm truncate">{item.opponent || '-'}</p>
                                <p className="text-zinc-500 text-xs mt-1 truncate">{item.competition || '-'}</p>
                                {item.type === 'scheduled' && (item as ChampionshipMatch).time && (
                                    <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {(item as ChampionshipMatch).time}
                                    </p>
                                )}
                                {item.type === 'saved' && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-xs font-bold ${(item as MatchRecord).result === 'V' ? 'text-green-400' : (item as MatchRecord).result === 'D' ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {(item as MatchRecord).result === 'V' ? 'Vitória' : (item as MatchRecord).result === 'D' ? 'Derrota' : 'Empate'}
                                        </span>
                                        <span className="text-zinc-500 text-xs">
                                            {(item as MatchRecord).goalsFor} x {(item as MatchRecord).goalsAgainst}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    {filteredMatches.length === 0 && (
                        <div className="text-center py-12 text-zinc-500 bg-black/50 rounded-2xl border border-zinc-900">
                            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="font-bold text-sm">Nenhuma partida no período</p>
                            <p className="text-xs mt-1">Ajuste as datas para visualizar as partidas</p>
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'analysis' && (
                <>
                    {/* Seletor de tipo de coleta — primeira tela para programada ou salva não executada */}
                    {isScheduledMatch() && selectedScheduledMatch && collectionType === null && !showPostMatchSheet && (
                        <CollectionTypeSelector
                            matchContext={{
                                date: selectedScheduledMatch.date,
                                opponent: selectedScheduledMatch.opponent || '',
                                competition: selectedScheduledMatch.competition,
                            }}
                            onSelect={(type: CollectionType) => setCollectionType(type)}
                            onBack={handleBackToCalendar}
                        />
                    )}
                    {!isScheduledMatch() && selectedMatch && isMatchNotExecuted(selectedMatch) && !showPostMatchSheet && !showRealtimePrepForSavedMatch && (
                        <CollectionTypeSelector
                            matchContext={{
                                date: selectedMatch.date,
                                opponent: selectedMatch.opponent || '',
                                competition: selectedMatch.competition,
                            }}
                            onSelect={(type: CollectionType) => {
                                if (type === 'realtime') {
                                    setShowMatchTypeModal(true);
                                } else {
                                    setShowPostMatchSheet(true);
                                }
                            }}
                            onBack={handleBackToCalendar}
                        />
                    )}

                    {/* Preparação tempo real — partida salva (não executada): seleção de atletas antes de abrir a nova aba */}
                    {!isScheduledMatch() && selectedMatch && isMatchNotExecuted(selectedMatch) && showRealtimePrepForSavedMatch && (
                        <div className="space-y-6 animate-fade-in pb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                    <Target className="text-[#00f0ff]" size={28} /> Preparação da Partida — Tempo Real
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowRealtimePrepForSavedMatch(false)}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={16} /> Voltar
                                </button>
                            </div>

                            <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                                    <Calendar className="text-[#00f0ff]" size={16} /> Informações da Partida
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</span>
                                        <p className="text-white font-bold text-sm">{formatDate(selectedMatch.date)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</span>
                                        <p className="text-white font-bold text-sm">{selectedMatch.opponent || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Competição</span>
                                        <p className="text-white font-bold text-sm">{selectedMatch.competition || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Tipo de Partida</span>
                                        <p className="text-white font-bold text-sm">
                                            {selectedMatchType === 'normal' && 'Partida Normal'}
                                            {selectedMatchType === 'extraTime' && `Com Acréscimo (${selectedExtraTimeMinutes ?? 5} min)`}
                                            {selectedMatchType === 'penalties' && 'Direto para Pênaltis'}
                                            {selectedMatchType === 'extraTimePenalties' && `Acréscimo + Pênaltis (${selectedExtraTimeMinutes ?? 5} min)`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 p-6 shadow-lg">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                                        <Users className="text-[#00f0ff]" size={16} /> Selecionar Atletas
                                    </h3>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('goleiros')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'goleiros' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Goleiros</button>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('linha')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'linha' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Atletas de linha</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const list = preparationAthleteFilter === 'goleiros' ? (players || []).filter(p => p.position === 'Goleiro') : (players || []).filter(p => p.position !== 'Goleiro');
                                            const newSet = new Set(selectedPlayersForMatch);
                                            list.forEach(p => {
                                                if (!isPlayerInjured(p) && !preparationDataSavedMatch.suspendedIds.has(p.id)) newSet.add(String(p.id).trim());
                                            });
                                            setSelectedPlayersForMatch(newSet);
                                        }}
                                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-zinc-700 text-[#00f0ff] hover:bg-zinc-600 transition-colors"
                                    >
                                        Selecionar todos
                                    </button>
                                </div>
                                <p className="text-zinc-400 text-xs mb-3">Suspensos (borda vermelha), lesão ativa (ambulância, borda laranja) e pendurados (alerta, borda amarela). Clique no card para selecionar.</p>
                                <div className="max-h-[24rem] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {((preparationAthleteFilter === 'goleiros' ? (players || []).filter(p => p.position === 'Goleiro') : (players || []).filter(p => p.position !== 'Goleiro'))).map((player) => {
                                        const id = String(player.id).trim();
                                        const isSelected = selectedPlayersForMatch.has(id);
                                        const injured = isPlayerInjured(player);
                                        const suspended = preparationDataSavedMatch.suspendedIds.has(player.id);
                                        const pendurado = preparationDataSavedMatch.penduradoIds.has(player.id);
                                        const unavailable = injured || suspended;
                                        const ph = preparationDataSavedMatch.physiology[id] ?? { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null };
                                        const baseBorderClass = suspended ? 'border-red-500' : injured ? 'border-orange-500' : pendurado ? 'border-amber-500' : 'border-zinc-700 hover:border-[#00f0ff]/50';
                                        const borderClass = isSelected ? 'border border-emerald-400' : `border ${baseBorderClass}`;
                                        const nickname = (player.nickname && player.nickname.trim()) ? player.nickname.trim() : '';
                                        return (
                                            <label key={player.id} className={`flex flex-row items-stretch gap-2 p-2 rounded-lg border transition-colors bg-zinc-900/90 min-w-[240px] ${unavailable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} ${borderClass}`}>
                                                <input type="checkbox" checked={isSelected} disabled={unavailable} onChange={(e) => { if (unavailable) return; const newSet = new Set(selectedPlayersForMatch); if (e.target.checked) newSet.add(id); else newSet.delete(id); setSelectedPlayersForMatch(newSet); }} className="sr-only" />
                                                <div className="flex-shrink-0 flex items-center">
                                                    {player.photoUrl ? <img src={player.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-zinc-700" aria-hidden /> : <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#00f0ff] font-bold text-sm">{player.jerseyNumber}</div>}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-0.5">
                                                    <p className={`font-bold text-xs truncate w-full text-center ${unavailable ? 'text-zinc-400' : 'text-white'}`} title={nickname || player.name}>{nickname || player.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-medium" title={`Camisa ${player.jerseyNumber}`}>#{player.jerseyNumber}</p>
                                                </div>
                                                <div className="flex flex-col items-end justify-between gap-0.5 flex-shrink-0">
                                                    <div className="flex flex-col gap-0 text-[10px] text-right">
                                                        <span className="text-zinc-400">PSE <span className="text-[#00f0ff] font-bold text-xs">{ph.pseAfterLastTraining != null ? ph.pseAfterLastTraining : '—'}</span></span>
                                                        <span className="text-zinc-400">PSR <span className="text-[#00f0ff] font-bold text-xs">{ph.psrMatchDay != null ? ph.psrMatchDay : '—'}</span></span>
                                                        <span className="text-zinc-400">Sono <span className="text-[#00f0ff] font-bold text-xs">{ph.sleepMatchDay != null ? ph.sleepMatchDay : '—'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                                                        {suspended && <span className="p-0.5 rounded bg-red-600/90" title="Suspenso"><Ban size={10} className="text-white" /></span>}
                                                        {injured && <span className="p-0.5 rounded bg-orange-500/90" title="Lesão ativa"><Ambulance size={10} className="text-white" /></span>}
                                                        {pendurado && !suspended && !injured && <span className="p-0.5 rounded bg-amber-500/90" title="Pendurado"><AlertTriangle size={10} className="text-white" /></span>}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {((preparationAthleteFilter === 'goleiros' ? (players || []).filter(p => p.position === 'Goleiro') : (players || []).filter(p => p.position !== 'Goleiro'))).length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogador nesta categoria</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedPlayersForMatch.size === 0) return;
                                        const realtimeScoutData = {
                                            matchId: selectedMatch.id,
                                            date: selectedMatch.date,
                                            opponent: selectedMatch.opponent || '',
                                            competition: selectedMatch.competition,
                                            players: players || [],
                                            teams: teams || [],
                                            matchType: selectedMatchType,
                                            extraTimeMinutes: selectedExtraTimeMinutes ?? 5,
                                            selectedPlayerIds: Array.from(selectedPlayersForMatch),
                                        };
                                        localStorage.setItem('realtimeScoutData', JSON.stringify(realtimeScoutData));
                                        window.open('/scout-realtime', '_blank');
                                        setShowRealtimePrepForSavedMatch(false);
                                    }}
                                    disabled={selectedPlayersForMatch.size === 0}
                                    className="flex-1 px-6 py-4 bg-[#00f0ff] hover:bg-[#00d9e6] text-black font-black uppercase text-sm rounded-xl transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    <Target size={20} /> Iniciar Scout da Partida (abre em nova aba)
                                </button>
                            </div>
                            {selectedPlayersForMatch.size === 0 && (
                                <p className="text-amber-400 text-xs text-center">Selecione pelo menos um atleta para abrir o scout em nova aba.</p>
                            )}
                        </div>
                    )}

                    {/* Interface de Preparação para Partida Programada — tempo real */}
                    {isScheduledMatch() && selectedScheduledMatch && collectionType === 'realtime' && !showPostMatchSheet && (
                        <div className="space-y-6 animate-fade-in pb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                    <Target className="text-[#00f0ff]" size={28} /> Preparação da Partida
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleBackToCalendar}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={16} /> Voltar ao Calendário
                                </button>
                            </div>

                            <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                                    <Calendar className="text-[#00f0ff]" size={16} /> Informações da Partida
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</span>
                                        <p className="text-white font-bold text-sm">{formatDate(selectedScheduledMatch.date)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</span>
                                        <p className="text-white font-bold text-sm">{selectedScheduledMatch.opponent || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Competição</span>
                                        <p className="text-white font-bold text-sm">{selectedScheduledMatch.competition || '-'}</p>
                                    </div>
                                    {selectedScheduledMatch.time && (
                                        <div>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Horário</span>
                                            <p className="text-white font-bold text-sm">{selectedScheduledMatch.time}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 p-6 shadow-lg">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                                        <Users className="text-[#00f0ff]" size={16} /> Selecionar Atletas
                                    </h3>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('goleiros')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'goleiros' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Goleiros</button>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('linha')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'linha' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Atletas de linha</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const list = preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro');
                                            const newSet = new Set(selectedPlayersForMatch);
                                            list.forEach(p => {
                                                if (!isPlayerInjured(p) && !preparationData.suspendedIds.has(p.id)) newSet.add(String(p.id).trim());
                                            });
                                            setSelectedPlayersForMatch(newSet);
                                        }}
                                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-zinc-700 text-[#00f0ff] hover:bg-zinc-600 transition-colors"
                                    >
                                        Selecionar todos
                                    </button>
                                </div>
                                <p className="text-zinc-400 text-xs mb-3">Suspensos (borda vermelha), lesão ativa (ambulância, borda laranja) e pendurados (alerta, borda amarela). Clique no card para selecionar.</p>
                                <div className="max-h-[24rem] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {(preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro')).map((player) => {
                                        const id = String(player.id).trim();
                                        const isSelected = selectedPlayersForMatch.has(id);
                                        const injured = isPlayerInjured(player);
                                        const suspended = preparationData.suspendedIds.has(player.id);
                                        const pendurado = preparationData.penduradoIds.has(player.id);
                                        const unavailable = injured || suspended;
                                        const ph = preparationData.physiology[id] ?? { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null };
                                        const baseBorderClass = suspended ? 'border-red-500' : injured ? 'border-orange-500' : pendurado ? 'border-amber-500' : 'border-zinc-700 hover:border-[#00f0ff]/50';
                                        const borderClass = isSelected ? 'border border-emerald-400' : `border ${baseBorderClass}`;
                                        const nickname = (player.nickname && player.nickname.trim()) ? player.nickname.trim() : '';
                                        return (
                                            <label key={player.id} className={`flex flex-row items-stretch gap-2 p-2 rounded-lg border transition-colors bg-zinc-900/90 min-w-[240px] ${unavailable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} ${borderClass}`}>
                                                <input type="checkbox" checked={isSelected} disabled={unavailable} onChange={(e) => { if (unavailable) return; const newSet = new Set(selectedPlayersForMatch); if (e.target.checked) newSet.add(id); else newSet.delete(id); setSelectedPlayersForMatch(newSet); }} className="sr-only" />
                                                <div className="flex-shrink-0 flex items-center">
                                                    {player.photoUrl ? <img src={player.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-zinc-700" aria-hidden /> : <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#00f0ff] font-bold text-sm">{player.jerseyNumber}</div>}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-0.5">
                                                    <p className={`font-bold text-xs truncate w-full text-center ${unavailable ? 'text-zinc-400' : 'text-white'}`} title={nickname || player.name}>{nickname || player.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-medium" title={`Camisa ${player.jerseyNumber}`}>#{player.jerseyNumber}</p>
                                                </div>
                                                <div className="flex flex-col items-end justify-between gap-0.5 flex-shrink-0">
                                                    <div className="flex flex-col gap-0 text-[10px] text-right">
                                                        <span className="text-zinc-400">PSE <span className="text-[#00f0ff] font-bold text-xs">{ph.pseAfterLastTraining != null ? ph.pseAfterLastTraining : '—'}</span></span>
                                                        <span className="text-zinc-400">PSR <span className="text-[#00f0ff] font-bold text-xs">{ph.psrMatchDay != null ? ph.psrMatchDay : '—'}</span></span>
                                                        <span className="text-zinc-400">Sono <span className="text-[#00f0ff] font-bold text-xs">{ph.sleepMatchDay != null ? ph.sleepMatchDay : '—'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                                                        {suspended && <span className="p-0.5 rounded bg-red-600/90" title="Suspenso"><Ban size={10} className="text-white" /></span>}
                                                        {injured && <span className="p-0.5 rounded bg-orange-500/90" title="Lesão ativa"><Ambulance size={10} className="text-white" /></span>}
                                                        {pendurado && !suspended && !injured && <span className="p-0.5 rounded bg-amber-500/90" title="Pendurado"><AlertTriangle size={10} className="text-white" /></span>}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {(preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro')).length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogador nesta categoria</p>}
                            </div>

                            <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 p-6 shadow-lg">
                                <h3 className="text-white font-bold uppercase text-sm mb-3 flex items-center gap-2">
                                    <Clock className="text-[#00f0ff]" size={16} /> Tipo de Partida
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer ${preparationMatchType === 'normal' ? 'bg-[#00f0ff]/10 border-[#00f0ff]' : 'bg-zinc-900 border-zinc-700 hover:border-[#00f0ff]/50'}`}>
                                        <input type="radio" name="preparationMatchType" value="normal" checked={preparationMatchType === 'normal'} onChange={() => setPreparationMatchType('normal')} className="w-4 h-4 text-[#00f0ff] border-zinc-600 focus:ring-[#00f0ff] focus:ring-2" />
                                        <div className="min-w-0">
                                            <div className="text-white font-bold text-xs">Normal</div>
                                            <div className="text-zinc-500 text-[10px]">2×20 min</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer ${preparationMatchType === 'extraTime' ? 'bg-[#00f0ff]/10 border-[#00f0ff]' : 'bg-zinc-900 border-zinc-700 hover:border-[#00f0ff]/50'}`}>
                                        <input type="radio" name="preparationMatchType" value="extraTime" checked={preparationMatchType === 'extraTime'} onChange={() => setPreparationMatchType('extraTime')} className="w-4 h-4 text-[#00f0ff] border-zinc-600 focus:ring-[#00f0ff] focus:ring-2" />
                                        <div className="min-w-0">
                                            <div className="text-white font-bold text-xs">Acréscimo</div>
                                            <div className="text-zinc-500 text-[10px]">+ tempo extra</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer ${preparationMatchType === 'penalties' ? 'bg-[#00f0ff]/10 border-[#00f0ff]' : 'bg-zinc-900 border-zinc-700 hover:border-[#00f0ff]/50'}`}>
                                        <input type="radio" name="preparationMatchType" value="penalties" checked={preparationMatchType === 'penalties'} onChange={() => setPreparationMatchType('penalties')} className="w-4 h-4 text-[#00f0ff] border-zinc-600 focus:ring-[#00f0ff] focus:ring-2" />
                                        <div className="min-w-0">
                                            <div className="text-white font-bold text-xs">Pênaltis</div>
                                            <div className="text-zinc-500 text-[10px]">Direto pênaltis</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer ${preparationMatchType === 'extraTimePenalties' ? 'bg-[#00f0ff]/10 border-[#00f0ff]' : 'bg-zinc-900 border-zinc-700 hover:border-[#00f0ff]/50'}`}>
                                        <input type="radio" name="preparationMatchType" value="extraTimePenalties" checked={preparationMatchType === 'extraTimePenalties'} onChange={() => setPreparationMatchType('extraTimePenalties')} className="w-4 h-4 text-[#00f0ff] border-zinc-600 focus:ring-[#00f0ff] focus:ring-2" />
                                        <div className="min-w-0">
                                            <div className="text-white font-bold text-xs">Acr. + Pên.</div>
                                            <div className="text-zinc-500 text-[10px]">Extra + pênaltis</div>
                                        </div>
                                    </label>
                                </div>
                                {(preparationMatchType === 'extraTime' || preparationMatchType === 'extraTimePenalties') && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <label className="text-zinc-400 text-xs font-bold uppercase">Min. acréscimo</label>
                                        <input type="number" min={1} max={30} value={preparationExtraTimeMinutes} onChange={(e) => setPreparationExtraTimeMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))} className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:border-[#00f0ff]" />
                                        <span className="text-zinc-500 text-xs">min</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowStartScoutConfirmation(true)}
                                    disabled={selectedPlayersForMatch.size === 0}
                                    className={`flex items-center gap-2 font-black uppercase text-sm px-6 py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] ${
                                        selectedPlayersForMatch.size === 0
                                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                            : 'bg-[#00f0ff] hover:bg-[#00d9e6] text-black'
                                    }`}
                                >
                                    <Play size={18} /> Iniciar Scout da Partida
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pós-jogo: seleção de atletas (só programada) — depois da partida */}
                    {isScheduledMatch() && selectedScheduledMatch && collectionType === 'postmatch' && !showPostMatchSheet && (
                        <div className="space-y-6 animate-fade-in pb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                    <Target className="text-[#00f0ff]" size={28} /> Depois da Partida — Selecionar Atletas
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleBackToCalendar}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={16} /> Voltar ao Calendário
                                </button>
                            </div>

                            <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                                    <Calendar className="text-[#00f0ff]" size={16} /> Partida
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</span>
                                        <p className="text-white font-bold text-sm">{formatDate(selectedScheduledMatch.date)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</span>
                                        <p className="text-white font-bold text-sm">{selectedScheduledMatch.opponent || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Competição</span>
                                        <p className="text-white font-bold text-sm">{selectedScheduledMatch.competition || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800 p-6 shadow-lg">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                                        <Users className="text-[#00f0ff]" size={16} /> Selecionar Atletas
                                    </h3>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('goleiros')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'goleiros' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Goleiros</button>
                                    <button type="button" onClick={() => setPreparationAthleteFilter('linha')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${preparationAthleteFilter === 'linha' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Atletas de linha</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const list = preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro');
                                            const newSet = new Set(selectedPlayersForMatch);
                                            list.forEach(p => {
                                                if (!isPlayerInjured(p) && !preparationData.suspendedIds.has(p.id)) newSet.add(String(p.id).trim());
                                            });
                                            setSelectedPlayersForMatch(newSet);
                                        }}
                                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-zinc-700 text-[#00f0ff] hover:bg-zinc-600 transition-colors"
                                    >
                                        Selecionar todos
                                    </button>
                                </div>
                                <p className="text-zinc-400 text-xs mb-3">Suspensos (borda vermelha), lesão ativa (ambulância, borda laranja) e pendurados (alerta, borda amarela). Clique no card para selecionar.</p>
                                <div className="max-h-[24rem] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {(preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro')).map((player) => {
                                        const id = String(player.id).trim();
                                        const isSelected = selectedPlayersForMatch.has(id);
                                        const injured = isPlayerInjured(player);
                                        const suspended = preparationData.suspendedIds.has(player.id);
                                        const pendurado = preparationData.penduradoIds.has(player.id);
                                        const unavailable = injured || suspended;
                                        const ph = preparationData.physiology[id] ?? { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null };
                                        const baseBorderClass = suspended ? 'border-red-500' : injured ? 'border-orange-500' : pendurado ? 'border-amber-500' : 'border-zinc-700 hover:border-[#00f0ff]/50';
                                        const borderClass = isSelected ? 'border border-emerald-400' : `border ${baseBorderClass}`;
                                        const nickname = (player.nickname && player.nickname.trim()) ? player.nickname.trim() : '';
                                        return (
                                            <label key={player.id} className={`flex flex-row items-stretch gap-2 p-2 rounded-lg border transition-colors bg-zinc-900/90 min-w-[240px] ${unavailable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} ${borderClass}`}>
                                                <input type="checkbox" checked={isSelected} disabled={unavailable} onChange={(e) => { if (unavailable) return; const newSet = new Set(selectedPlayersForMatch); if (e.target.checked) newSet.add(id); else newSet.delete(id); setSelectedPlayersForMatch(newSet); }} className="sr-only" />
                                                <div className="flex-shrink-0 flex items-center">
                                                    {player.photoUrl ? <img src={player.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-zinc-700" aria-hidden /> : <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#00f0ff] font-bold text-sm">{player.jerseyNumber}</div>}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-0.5">
                                                    <p className={`font-bold text-xs truncate w-full text-center ${unavailable ? 'text-zinc-400' : 'text-white'}`} title={nickname || player.name}>{nickname || player.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-medium" title={`Camisa ${player.jerseyNumber}`}>#{player.jerseyNumber}</p>
                                                </div>
                                                <div className="flex flex-col items-end justify-between gap-0.5 flex-shrink-0">
                                                    <div className="flex flex-col gap-0 text-[10px] text-right">
                                                        <span className="text-zinc-400">PSE <span className="text-[#00f0ff] font-bold text-xs">{ph.pseAfterLastTraining != null ? ph.pseAfterLastTraining : '—'}</span></span>
                                                        <span className="text-zinc-400">PSR <span className="text-[#00f0ff] font-bold text-xs">{ph.psrMatchDay != null ? ph.psrMatchDay : '—'}</span></span>
                                                        <span className="text-zinc-400">Sono <span className="text-[#00f0ff] font-bold text-xs">{ph.sleepMatchDay != null ? ph.sleepMatchDay : '—'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                                                        {suspended && <span className="p-0.5 rounded bg-red-600/90" title="Suspenso"><Ban size={10} className="text-white" /></span>}
                                                        {injured && <span className="p-0.5 rounded bg-orange-500/90" title="Lesão ativa"><Ambulance size={10} className="text-white" /></span>}
                                                        {pendurado && !suspended && !injured && <span className="p-0.5 rounded bg-amber-500/90" title="Pendurado"><AlertTriangle size={10} className="text-white" /></span>}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {(preparationAthleteFilter === 'goleiros' ? players.filter(p => p.position === 'Goleiro') : players.filter(p => p.position !== 'Goleiro')).length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogador nesta categoria</p>}
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowPostMatchSheet(true)}
                                    disabled={selectedPlayersForMatch.size === 0}
                                    className={`flex items-center gap-2 font-black uppercase text-sm px-6 py-3 rounded-xl transition-colors ${
                                        selectedPlayersForMatch.size === 0
                                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                            : 'bg-[#00f0ff] hover:bg-[#00d9e6] text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                    }`}
                                >
                                    Continuar para planilha
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Planilha pós-jogo */}
                    {showPostMatchSheet && (isScheduledMatch() ? selectedScheduledMatch : selectedMatch) && (
                        <PostMatchCollectionSheet
                            match={
                                isScheduledMatch() && selectedScheduledMatch
                                    ? {
                                          id: `sched-${selectedScheduledMatch.id}`,
                                          opponent: selectedScheduledMatch.opponent || '',
                                          date: selectedScheduledMatch.date,
                                          competition: selectedScheduledMatch.competition,
                                      }
                                    : selectedMatch!
                            }
                            players={
                                isScheduledMatch()
                                    ? players.filter((p) => selectedPlayersForMatch.has(String(p.id).trim()))
                                    : (() => {
                                          const m = selectedMatch!;
                                          const ids = Object.keys(m.playerStats || {});
                                          if (ids.length > 0) {
                                              return players.filter((p) => ids.includes(String(p.id).trim()));
                                          }
                                          return players;
                                      })()
                            }
                            onSave={(saved) => {
                                onSave?.(saved);
                                handleBackToCalendar();
                            }}
                            onBack={handleBackToCalendar}
                        />
                    )}

                    {/* Interface de Análise para Partida Salva (apenas executadas) */}
                    {!isScheduledMatch() && selectedMatch && !isMatchNotExecuted(selectedMatch) && (
                        <div className="space-y-6 animate-fade-in pb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                    <Target className="text-[#00f0ff]" size={28} /> Análise da Partida
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleBackToCalendar}
                                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <ArrowLeft size={16} /> Voltar ao Calendário
                                    </button>
                                </div>
                            </div>

                    {/* Resultado do Jogo (baseado no card) */}
                    <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</span>
                                <p className="text-white font-bold text-sm">{formatDate(selectedMatch.date)}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</span>
                                <p className="text-white font-bold text-sm">{selectedMatch.opponent}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Competição</span>
                                <p className="text-white font-bold text-sm">{selectedMatch.competition || '-'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Resultado</span>
                                <p className={`font-bold text-sm ${selectedMatch.result === 'V' ? 'text-green-400' : selectedMatch.result === 'D' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {selectedMatch.result === 'V' ? 'Vitória' : selectedMatch.result === 'D' ? 'Derrota' : 'Empate'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Placar destacado */}
                        <div className="mt-6 text-center">
                            <div className="flex items-center justify-center gap-6">
                                <div>
                                    <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Nossa Equipe</p>
                                    <p className="text-[#00f0ff] text-5xl font-black">{selectedMatch.goalsFor}</p>
                                </div>
                                <div className="text-zinc-600 text-3xl font-black">x</div>
                                <div>
                                    <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Adversário</p>
                                    <p className="text-red-400 text-5xl font-black">{selectedMatch.goalsAgainst}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informações Básicas */}
                    <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                        <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                            <Clock className="text-[#00f0ff]" size={16} /> Informações do Jogo
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Local</span>
                                <p className="text-white text-sm font-bold">{(selectedMatch as any).location || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas Resumidas da Equipe */}
                    <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
                        <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                            <Activity className="text-[#00f0ff]" size={16} /> Estatísticas da Equipe
                        </h3>
                        {selectedMatch.teamStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Gols</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.goals}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Assistências</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.assists}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Passes Corretos</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.passesCorrect}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Passes Errados</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.passesWrong}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Chutes no Gol</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.shotsOnTarget}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Chutes Fora</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.shotsOffTarget}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Desarmes (c/ Bola)</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.tacklesWithBall}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Desarmes (s/ Bola)</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.tacklesWithoutBall}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Desarmes (C/A)</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.tacklesCounterAttack}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Erros Transição</span>
                                    <p className="text-white text-2xl font-black">{selectedMatch.teamStats.transitionErrors}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

                    {/* Modal de Confirmação para Iniciar Scout */}
                    {showStartScoutConfirmation && selectedScheduledMatch && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <Play className="text-[#00f0ff]" size={24} />
                                        <h3 className="text-xl font-black text-white uppercase tracking-wide">Confirmar Início do Scout</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowStartScoutConfirmation(false)}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-zinc-500 hover:text-white" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <p className="text-zinc-400 text-sm mb-6">
                                        Confirme os dados antes de iniciar a coleta:
                                    </p>

                                    {/* Resumo da Partida */}
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
                                        <h4 className="text-white font-bold text-sm mb-3 uppercase">Partida</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-zinc-400">Adversário:</span>
                                                <span className="text-white font-bold">{selectedScheduledMatch.opponent || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-400">Data:</span>
                                                <span className="text-white font-bold">{formatDate(selectedScheduledMatch.date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-400">Competição:</span>
                                                <span className="text-white font-bold">{selectedScheduledMatch.competition || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumo do Tipo de Partida */}
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
                                        <h4 className="text-white font-bold text-sm mb-3 uppercase">Tipo de Partida</h4>
                                        <p className="text-white text-sm">
                                            {preparationMatchType === 'normal' && 'Partida Normal (dois tempos de 20 minutos)'}
                                            {preparationMatchType === 'extraTime' && `Com Acréscimo (${preparationExtraTimeMinutes} minutos)`}
                                            {preparationMatchType === 'penalties' && 'Direto para Pênaltis'}
                                            {preparationMatchType === 'extraTimePenalties' && `Acréscimo + Pênaltis (${preparationExtraTimeMinutes} minutos)`}
                                        </p>
                                    </div>

                                    {/* Resumo dos Atletas Selecionados */}
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
                                        <h4 className="text-white font-bold text-sm mb-3 uppercase">
                                            Atletas Selecionados ({selectedPlayersForMatch.size})
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {Array.from(selectedPlayersForMatch).map((playerId) => {
                                                const player = players.find(p => String(p.id).trim() === playerId);
                                                if (!player) return null;
                                                return (
                                                    <div key={playerId} className="text-sm text-zinc-300">
                                                        #{player.jerseyNumber} {player.name} ({player.position})
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowStartScoutConfirmation(false)}
                                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs rounded-xl transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedPlayersForMatch.size === 0) return;
                                                const realtimeScoutData = {
                                                    matchId: selectedScheduledMatch.id,
                                                    date: selectedScheduledMatch.date,
                                                    opponent: selectedScheduledMatch.opponent || '',
                                                    competition: selectedScheduledMatch.competition,
                                                    players: players || [],
                                                    teams: teams || [],
                                                    matchType: preparationMatchType,
                                                    extraTimeMinutes: preparationExtraTimeMinutes,
                                                    selectedPlayerIds: Array.from(selectedPlayersForMatch),
                                                };
                                                localStorage.setItem('realtimeScoutData', JSON.stringify(realtimeScoutData));
                                                window.open('/scout-realtime', '_blank');
                                                setShowStartScoutConfirmation(false);
                                            }}
                                            disabled={selectedPlayersForMatch.size === 0}
                                            className="flex-1 px-4 py-3 bg-[#00f0ff] hover:bg-[#00d9e6] text-black font-black uppercase text-xs rounded-xl transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            Confirmar e Iniciar
                                        </button>
                                    </div>
                                    {selectedPlayersForMatch.size === 0 && (
                                        <p className="text-amber-400 text-xs text-center mt-3">Selecione pelo menos um atleta para iniciar o scout.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {viewMode === 'form' && (
                <>
            {/* Badge de Partida Salva */}
            {isViewMode && savedMatchId && (
                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <Save className="text-green-400" size={20} />
                        <span className="text-green-400 font-black text-sm uppercase">Partida Salva - Modo Visualização</span>
                    </div>
                    <p className="text-zinc-400 text-xs text-center mt-2">Esta partida está bloqueada para edição. Nenhuma alteração pode ser feita.</p>
                </div>
            )}
            
            {/* Formulário de Nova Partida / Input de Dados */}
                    {/* Cronômetro */}
                    <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg mb-6">
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Cronômetro</p>
                                <p className="text-[#00f0ff] text-6xl font-black font-mono">{formatTimerTime(elapsedTime)}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setTimerRunning(!timerRunning)}
                                    className="flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#60a5fa] text-black font-bold uppercase text-sm px-6 py-3 rounded-xl transition-colors"
                                >
                                    {timerRunning ? <Pause size={20} /> : <Play size={20} />}
                                    {timerRunning ? 'Pausar' : 'Iniciar'}
                                </button>
                                <button
                                    onClick={() => {
                                        setTimerRunning(false);
                                        setElapsedTime(0);
                                    }}
                                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-sm px-6 py-3 rounded-xl transition-colors"
                                >
                                    <RotateCcw size={20} />
                                    Resetar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Placar Centralizado */}
                    {opponent && (
                        <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-[#00f0ff]/30 rounded-3xl p-6 shadow-2xl mb-6">
                            <div className="flex flex-col items-center justify-center">
                                {/* Nomes das Equipes */}
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="text-center">
                                        <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Nossa Equipe</p>
                                        <p className="text-white text-xl font-black">{teamName}</p>
                                    </div>
                                    <div className="text-[#00f0ff] text-3xl font-black">X</div>
                                    <div className="text-center">
                                        <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Adversário</p>
                                        <p className="text-white text-xl font-black">{opponent}</p>
                                    </div>
                                </div>
                                
                                {/* Placar */}
                                <div className="flex items-center justify-center gap-6 mb-4">
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Gols Feitos</p>
                                        <p className="text-[#00f0ff] text-5xl font-black">{totalGoalsScored}</p>
                                    </div>
                                    <div className="text-zinc-600 text-2xl font-black">-</div>
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Gols Tomados</p>
                                        <p className="text-red-400 text-5xl font-black">{totalGoalsConceded}</p>
                                    </div>
                                </div>
                                
                                {/* Mensagem de Status */}
                                <div className={`${scoreMessage.bgColor} ${scoreMessage.borderColor} border-2 rounded-xl px-6 py-2 ${scoreMessage.color} font-black text-sm uppercase`}>
                                    {scoreMessage.text}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Header / Controls */}
                    <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <button
                            type="button"
                            onClick={handleBackToCalendar}
                            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={16} /> Voltar ao Calendário
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Table className="text-[#00f0ff]" /> Input de Dados (Tempo Real)
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold mt-1">Preenchimento manual para controle e alimentação do sistema.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex gap-2">
                        {isCreatingNew ? (
                            <>
                                <button 
                                    onClick={handleSave}
                                    disabled={isViewMode}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-zinc-800 disabled:opacity-50 text-black disabled:text-zinc-500 px-4 py-2 font-bold uppercase text-xs rounded-xl transition-colors h-[34px] shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:shadow-none"
                                >
                                    <Save size={16} /> Salvar no Sistema
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Interface Dinâmica - Jogadores em Quadra + Estatísticas */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Coluna de Jogadores em Quadra (Lado Esquerdo) */}
                <div className="lg:col-span-1 bg-black rounded-3xl border border-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                            <Users size={16} className="text-[#00f0ff]" /> Jogadores em Quadra
                        </h3>
                    </div>
                    
                    {/* Lista de todos os jogadores para seleção manual */}
                    <div className="mb-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                        <p className="text-zinc-400 text-[10px] font-bold uppercase mb-2">Selecionar Jogadores:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {players.filter(p => (p as any).status === 'Ativo' || !(p as any).status).map(player => {
                                const isInField = playersInField.has(String(player.id).trim());
                                return (
                                    <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={isInField}
                                            onChange={(e) => {
                                                const newSet = new Set(playersInField);
                                                if (e.target.checked) {
                                                    newSet.add(String(player.id).trim());
                                                } else {
                                                    newSet.delete(String(player.id).trim());
                                                    // Se remover da quadra e estava selecionado, limpar seleção
                                                    if (selectedPlayerId === String(player.id).trim()) {
                                                        setSelectedPlayerId(null);
                                                    }
                                                }
                                                setPlayersInField(newSet);
                                            }}
                                            className="w-4 h-4 text-[#00f0ff] bg-zinc-900 border-zinc-700 rounded focus:ring-[#00f0ff]"
                                        />
                                        <span className="text-white text-xs font-bold">#{player.jerseyNumber} {player.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Lista de jogadores em quadra */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {Array.from(playersInField).length === 0 ? (
                            <div className="text-center py-8 text-zinc-600 text-xs">
                                <p>Nenhum jogador selecionado</p>
                                <p className="mt-2 text-[10px]">Marque os jogadores acima</p>
                            </div>
                        ) : (
                            players.filter(p => playersInField.has(String(p.id).trim())).map(player => {
                                const entry = entries.find(e => String(e.athleteId).trim() === String(player.id).trim());
                                const isSelected = selectedPlayerId === String(player.id).trim();
                                const isInjured = isPlayerInjured(player);
                                const isSuspended = isPlayerSuspended(player.id);
                                const yellowCards = getYellowCardCount(player.id);
                                const isDisabled = isSuspended || isInjured;
                                
                                return (
                                    <button
                                        key={player.id}
                                        onClick={() => {
                                            if (isViewMode) return;
                                            setSelectedPlayerId(String(player.id).trim());
                                        }}
                                        disabled={isViewMode}
                                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                            isSelected 
                                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_20px_rgba(0,240,255,0.5)]' 
                                                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                                        } ${isDisabled ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isSelected ? 'border-[#00f0ff]' : 'border-zinc-700'} bg-zinc-900 flex-shrink-0`}>
                                                {player.photoUrl ? (
                                                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                                                        {player.name?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{player.name}</p>
                                                <p className="text-zinc-400 text-xs">#{player.jerseyNumber} • {player.position}</p>
                                                {entry && (
                                                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                                                        {entry.goals > 0 && <span className="text-[#ccff00] font-bold">⚽{entry.goals}</span>}
                                                        {entry.assists > 0 && <span className="text-blue-400 font-bold">🎯{entry.assists}</span>}
                                                        {yellowCards > 0 && <span className="text-yellow-400 font-bold">🟨{yellowCards}</span>}
                                                        {entry.card.includes('Vermelho') && <span className="text-red-400 font-bold">🟥</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Botões de Estatísticas (Lado Direito) */}
                <div className="lg:col-span-3 bg-black rounded-3xl border border-zinc-900 p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                        <Target size={16} className="text-[#00f0ff]" /> Estatísticas
                        {selectedPlayerId && (
                            <span className="text-zinc-500 text-xs font-normal">
                                (Selecionado: {players.find(p => String(p.id).trim() === selectedPlayerId)?.name})
                            </span>
                        )}
                    </h3>
                    
                    {!selectedPlayerId && (
                        <div className="text-center py-12 text-zinc-500">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm font-bold">Selecione um jogador para começar</p>
                            <p className="text-xs mt-2">Clique em um jogador em quadra à esquerda</p>
                        </div>
                    )}

                    {selectedPlayerId && (() => {
                        const currentEntry = entries.find(e => String(e.athleteId).trim() === selectedPlayerId);
                        return (
                            <>
                            {/* Botões ENTRADA/SAÍDA grandes */}
                            {currentMatchId && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        onClick={handleEntryButtonClick}
                                        className="bg-green-600 hover:bg-green-500 text-white font-black uppercase text-lg py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <ArrowUpDown size={24} />
                                        ENTRADA
                                    </button>
                                    <button
                                        onClick={handleExitButtonClick}
                                        className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-lg py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <ArrowUpDown size={24} />
                                        SAÍDA
                                    </button>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Gols */}
                                <StatButton 
                                    label="GOL" 
                                    color="bg-white text-black border-white" 
                                    icon={Goal} 
                                    onClick={() => handleStatButtonClick('goals')}
                                    onDecrement={() => handleStatButtonDecrement('goals')}
                                    value={currentEntry?.goals || 0}
                                />
                                
                                {/* Assistências */}
                                <StatButton 
                                    label="ASSISTÊNCIA" 
                                    color="bg-blue-600 text-white border-blue-600" 
                                    icon={Target} 
                                    onClick={() => handleStatButtonClick('assists')}
                                    onDecrement={() => handleStatButtonDecrement('assists')}
                                    value={currentEntry?.assists || 0}
                                />
                                
                                {/* Passes Certos */}
                                <StatButton 
                                    label="PASSE CERTO" 
                                    color="bg-[#00f0ff] text-black border-[#00f0ff]" 
                                    icon={Target} 
                                    onClick={() => handleStatButtonClick('passesCorrect')}
                                    onDecrement={() => handleStatButtonDecrement('passesCorrect')}
                                    value={currentEntry?.passesCorrect || 0}
                                />
                                
                                {/* Chutes no Gol */}
                                <StatButton 
                                    label="CHUTE NO GOL" 
                                    color="bg-[#ccff00] text-black border-[#ccff00]" 
                                    icon={Target} 
                                    onClick={() => handleStatButtonClick('shotsOn')}
                                    onDecrement={() => handleStatButtonDecrement('shotsOn')}
                                    value={currentEntry?.shotsOn || 0}
                                />
                                
                                {/* Desarme com Posse */}
                                <StatButton 
                                    label="DESARME (POSSE)" 
                                    color="bg-emerald-500 text-white border-emerald-500" 
                                    icon={Shield} 
                                    onClick={() => handleStatButtonClick('tacklesPossession')}
                                    onDecrement={() => handleStatButtonDecrement('tacklesPossession')}
                                    value={currentEntry?.tacklesPossession || 0}
                                />
                                
                                {/* Desarme sem Posse */}
                                <StatButton 
                                    label="DESARME (S/POSSE)" 
                                    color="bg-yellow-500 text-black border-yellow-500" 
                                    icon={Shield} 
                                    onClick={() => handleStatButtonClick('tacklesNoPossession')}
                                    onDecrement={() => handleStatButtonDecrement('tacklesNoPossession')}
                                    value={currentEntry?.tacklesNoPossession || 0}
                                />
                                
                                {/* Desarme Contra-Ataque */}
                                <StatButton 
                                    label="DESARME (C/A)" 
                                    color="bg-green-600 text-white border-green-600" 
                                    icon={Zap} 
                                    onClick={() => handleStatButtonClick('tacklesCounter')}
                                    onDecrement={() => handleStatButtonDecrement('tacklesCounter')}
                                    value={currentEntry?.tacklesCounter || 0}
                                />
                                
                                {/* Passes Errados */}
                                <StatButton 
                                    label="PASSE ERRADO" 
                                    color="bg-red-600 text-white border-red-600" 
                                    icon={AlertTriangle} 
                                    onClick={() => handleStatButtonClick('passesWrong')}
                                    onDecrement={() => handleStatButtonDecrement('passesWrong')}
                                    value={currentEntry?.passesWrong || 0}
                                />
                                
                                {/* Chutes para Fora */}
                                <StatButton 
                                    label="CHUTE P/ FORA" 
                                    color="bg-orange-600 text-white border-orange-600" 
                                    icon={Target} 
                                    onClick={() => handleStatButtonClick('shotsOff')}
                                    onDecrement={() => handleStatButtonDecrement('shotsOff')}
                                    value={currentEntry?.shotsOff || 0}
                                />
                                
                                {/* Erro de Transição */}
                                <StatButton 
                                    label="ERRO TRANSIÇÃO" 
                                    color="bg-red-700 text-white border-red-700" 
                                    icon={ArrowRightLeft} 
                                    onClick={() => handleStatButtonClick('transitionError')}
                                    onDecrement={() => handleStatButtonDecrement('transitionError')}
                                    value={currentEntry?.transitionError || 0}
                                />
                                
                                {/* RPE - Percepção Subjetiva de Esforço */}
                                <StatButton 
                                    label="RPE (0-10)" 
                                    color="bg-purple-600 text-white border-purple-600" 
                                    icon={Activity} 
                                    onClick={() => handleStatButtonClick('rpe')}
                                    onDecrement={() => handleStatButtonDecrement('rpe')}
                                    value={currentEntry?.rpe || 5}
                                />
                                
                                {/* Cartão Amarelo */}
                                <button 
                                    onClick={() => handleCardClick('Amarelo')}
                                    className={`bg-yellow-500 text-black border-yellow-500 border p-4 font-bold uppercase tracking-tight text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center gap-2 rounded-xl min-h-[100px] ${
                                        currentEntry?.card?.includes('Amarelo') ? 'ring-4 ring-yellow-300' : ''
                                    }`}
                                >
                                    <Square size={24} strokeWidth={3} />
                                    <span>CARTÃO AMARELO</span>
                                    <span className="text-2xl font-black">
                                        {currentEntry?.card === 'Amarelo' ? '1' : 
                                         currentEntry?.card === 'Amarelo/Vermelho' || currentEntry?.card === 'Amarelo/Amarelo/Vermelho' ? '2' : '0'}
                                    </span>
                                </button>
                                
                                {/* Cartão Vermelho */}
                                <button 
                                    onClick={() => handleCardClick('Vermelho')}
                                    className={`bg-red-600 text-white border-red-600 border p-4 font-bold uppercase tracking-tight text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center gap-2 rounded-xl min-h-[100px] ${
                                        currentEntry?.card?.includes('Vermelho') ? 'ring-4 ring-red-400' : ''
                                    }`}
                                >
                                    <Square size={24} strokeWidth={3} />
                                    <span>CARTÃO VERMELHO</span>
                                    <span className="text-2xl font-black">
                                        {currentEntry?.card?.includes('Vermelho') ? '1' : '0'}
                                    </span>
                                </button>
                            </div>

                        </>
                        );
                    })()}
                </div>
            </div>

            {/* Bottom Row - Goals Conceded Input for Match Record */}
            <div className="mt-4 print:border border-zinc-800 p-4 rounded-3xl bg-black">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-white font-bold uppercase text-xs">Gols Tomados:</h3>
                        {goalsConcededSaved && goalsConceded.length > 0 && (
                            <span className="text-[#00f0ff] text-[10px] font-bold uppercase flex items-center gap-1">
                                ✓ Salvos
                            </span>
                        )}
                    </div>
                <div className="flex items-center gap-4">
                        <span className="text-zinc-400 text-[10px] font-bold uppercase">Total:</span>
                        <span className="text-white text-lg font-black">{goalsConceded.length}</span>
                        <button 
                            onClick={addGoalConceded}
                            className="text-[#ff0055] hover:text-[#ff3377] text-xs font-black px-2 py-1 border border-[#ff0055]/30 rounded hover:border-[#ff0055] transition-colors"
                            title="Adicionar gol tomado"
                        >
                            + Adicionar Gol
                        </button>
                    </div>
                </div>
                
                {goalsConceded.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {goalsConceded.map((goalConceded, idx) => (
                            <div key={goalConceded.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Gol {idx + 1}</span>
                                    {goalsConceded.length > 1 && (
                                        <button 
                                            onClick={() => removeGoalConceded(goalConceded.id)}
                                            className="text-red-400 hover:text-red-300 text-xs font-black"
                                            title="Remover gol"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Tempo:</label>
                                        <input
                                            type="text"
                                            value={goalConceded.time || ''}
                                            onChange={e => updateGoalConcededTime(goalConceded.id, e.target.value)}
                                            placeholder="MM:SS"
                                            className="bg-black border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-[#ff0055] text-xs font-mono"
                                        />
                                        <button
                                            onClick={() => {
                                                const currentTime = formatEventTime(elapsedTime);
                                                updateGoalConcededTime(goalConceded.id, currentTime);
                                            }}
                                            className="text-[#00f0ff] hover:text-[#60a5fa] text-[9px] font-bold uppercase mt-1"
                                        >
                                            Usar tempo do cronômetro
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Método:</label>
                                        <select
                                            value={goalConceded.method || ''}
                                            onChange={e => updateGoalConcededMethod(goalConceded.id, e.target.value)}
                                            className="bg-black border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-[#ff0055] text-xs"
                                        >
                                            <option value="">Selecione...</option>
                                            {GOAL_METHODS.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-600 text-sm">
                        <p>Nenhum gol tomado registrado.</p>
                        <p className="text-[10px] mt-2">Clique em "+ Adicionar Gol" para começar.</p>
                    </div>
                )}
                
                {goalsConceded.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                        <button 
                            onClick={handleSaveGoalsConceded}
                            className={`flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs rounded-xl transition-colors ${
                                goalsConcededSaved 
                                    ? 'bg-[#00f0ff] hover:bg-[#60a5fa] text-black' 
                                    : 'bg-[#ff0055] hover:bg-[#ff3377] text-white'
                            }`}
                        >
                            <Save size={16} /> 
                            {goalsConcededSaved ? 'Gols Tomados Salvos ✓' : 'Salvar Gols Tomados'}
                        </button>
                </div>
                )}
            </div>

            {/* Seção de Entradas e Saídas */}
            {currentMatchId && (
                <div className="mt-6 bg-black rounded-3xl border border-zinc-900 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ArrowUpDown className="text-[#00f0ff]" size={20} />
                            <h3 className="text-white font-bold uppercase text-sm">Entradas e Saídas</h3>
                        </div>
                        <button
                            onClick={handleSaveTimeControls}
                            className="flex items-center gap-2 bg-[#00f0ff] hover:bg-[#60a5fa] text-black px-4 py-2 font-bold uppercase text-xs rounded-xl transition-colors"
                        >
                            <Save size={16} /> Salvar Tempos
                        </button>
                    </div>

                    {isLoadingTimeControls ? (
                        <div className="text-center py-8 text-zinc-500">
                            <p>Carregando controles de tempo...</p>
                        </div>
                    ) : timeControls.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <p className="text-sm">Nenhum controle de tempo registrado.</p>
                            <p className="text-xs mt-2">Use os botões ENTRADA/SAÍDA acima para registrar tempos.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950 text-[10px] text-zinc-400 uppercase tracking-wider font-bold border-b border-zinc-800">
                                        <th className="p-3 border-r border-zinc-900">Jogador</th>
                                        <th className="p-3 border-r border-zinc-900">Entradas/Saídas</th>
                                        <th className="p-3 text-center">Tempo Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeControls.map((tc) => {
                                        const player = players.find(p => String(p.id).trim() === tc.playerId);
                                        const parseTime = (timeStr: string): number => {
                                            if (!timeStr) return 0;
                                            const parts = timeStr.split(':');
                                            if (parts.length !== 2) return 0;
                                            const minutes = parseInt(parts[0], 10) || 0;
                                            const seconds = parseInt(parts[1], 10) || 0;
                                            return minutes + (seconds / 60);
                                        };
                                        
                                        const calculateTotal = () => {
                                            let total = 0;
                                            tc.timeEntries.forEach(entry => {
                                                if (entry.entryTime && entry.exitTime) {
                                                    const entryMin = parseTime(entry.entryTime);
                                                    const exitMin = parseTime(entry.exitTime);
                                                    if (exitMin > entryMin) {
                                                        total += exitMin - entryMin;
                                                    }
                                                }
                                            });
                                            return total;
                                        };
                                        
                                        const totalTime = calculateTotal();
                                        const formatTime = (minutes: number): string => {
                                            const mins = Math.floor(minutes);
                                            const secs = Math.round((minutes - mins) * 60);
                                            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                                        };

                                        return (
                                            <tr key={tc.id} className="border-b border-zinc-900 hover:bg-zinc-950">
                                                <td className="p-3 border-r border-zinc-900 text-white text-xs font-bold">
                                                    {player?.name || 'Jogador não encontrado'}
                                                </td>
                                                <td className="p-3 border-r border-zinc-900">
                                                    <div className="flex flex-col gap-1">
                                                        {tc.timeEntries.map((entry, idx) => (
                                                            <div key={idx} className="text-xs text-zinc-400">
                                                                {entry.entryTime || '--'} → {entry.exitTime || '--'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-white text-xs font-bold">
                                                    {formatTime(totalTime)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
                </>
            )}

            {/* Modal de Seleção de Tempo */}
            <TimeSelectionModal
                isOpen={showTimeModal}
                onClose={() => setShowTimeModal(false)}
                onConfirm={handleTimeModalConfirm}
                title={timeModalType === 'entry' ? 'Registrar Entrada' : 'Registrar Saída'}
            />

            {/* Modal de Tipo de Partida */}
            <MatchTypeModal
                isOpen={showMatchTypeModal}
                onClose={() => setShowMatchTypeModal(false)}
                onConfirm={(matchType, extraTimeMinutes) => {
                    setSelectedMatchType(matchType);
                    if (extraTimeMinutes) {
                        setSelectedExtraTimeMinutes(extraTimeMinutes);
                    }
                    setShowMatchTypeModal(false);
                    // Partida salva: não abrir aba ainda — exibir tela de seleção de atletas; só depois abrir a nova aba
                    if (selectedMatch) {
                        setShowRealtimePrepForSavedMatch(true);
                    }
                }}
            />

            {/* Janela de Coleta da Partida */}
            {selectedMatch && (
                <MatchScoutingWindow
                    isOpen={showScoutingWindow}
                    onClose={() => {
                        setShowScoutingWindow(false);
                        setSelectedMatchType('normal');
                        setSelectedExtraTimeMinutes(5);
                        setSelectedPlayersForMatch(new Set());
                    }}
                    match={selectedMatch}
                    players={players || []}
                    teams={teams || []}
                    matchType={selectedMatchType}
                    extraTimeMinutes={selectedExtraTimeMinutes}
                    selectedPlayerIds={isScheduledMatch() && selectedPlayersForMatch ? Array.from(selectedPlayersForMatch) : undefined}
                />
            )}
        </div>
    );
};

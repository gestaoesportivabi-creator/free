import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Play, Pause, Square, Users, ArrowRightLeft, Goal, AlertTriangle, Clock, List, ArrowLeft } from 'lucide-react';
import { MatchRecord, MatchStats, Player, Team, PostMatchEvent, PostMatchAction } from '../types';
import { MatchType } from './MatchTypeModal';

/** Formata dígitos para MM:SS (ex.: "0100" → "01:00"). */
function formatDigitsToMMSS(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  if (d.length === 1) return `00:0${d}`;
  if (d.length === 2) return `${d}:`;
  if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Converte MM:SS ou dígitos (ex.: "0125") para segundos. */
function parseManualTimeToSeconds(input: string): number | null {
  const d = input.trim().replace(/\D/g, '');
  if (d.length === 0) return null;
  if (d.length === 1) {
    const sec = parseInt(d[0], 10);
    return sec >= 0 && sec <= 59 ? sec : null;
  }
  if (d.length === 2) {
    const m = parseInt(d, 10);
    return m >= 0 && m <= 59 ? m * 60 : null;
  }
  if (d.length === 3) {
    const m = parseInt(d[0], 10);
    const sec = parseInt(d.slice(1), 10);
    return (m >= 0 && m <= 59 && sec >= 0 && sec <= 59) ? m * 60 + sec : null;
  }
  const m = parseInt(d.slice(0, 2), 10);
  const sec = parseInt(d.slice(2, 4), 10);
  return (m >= 0 && m <= 59 && sec >= 0 && sec <= 59) ? m * 60 + sec : null;
}

interface MatchScoutingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchRecord;
  players: Player[];
  teams: Team[];
  matchType: MatchType;
  extraTimeMinutes?: number;
  selectedPlayerIds?: string[]; // IDs dos jogadores selecionados
  mode?: 'realtime' | 'postmatch'; // postmatch = tempo manual, sem cronômetro
  onSave?: (match: MatchRecord) => void; // Chamado em postmatch ao encerrar coleta
  /** Usuário que está registrando as ações (para auditoria: quem fez/registrou cada ação) */
  recordedByUser?: { id?: string; name: string };
  /** Quando true, ocupa todo o viewport (ex.: sidebar foi escondida pelo app) */
  takeFullWidth?: boolean;
}

type LateralResult = 'defesaDireita' | 'defesaEsquerda' | 'ataqueDireita' | 'ataqueEsquerda';

interface MatchEvent {
  id: string;
  type: 'pass' | 'shot' | 'foul' | 'goal' | 'card' | 'tackle' | 'save' | 'block' | 'corner' | 'freeKick' | 'penalty' | 'lateral';
  playerId?: string;
  playerName?: string;
  time: number; // segundos
  period: '1T' | '2T'; // Período em que ocorreu
  result?: 'correct' | 'wrong' | 'inside' | 'outside' | 'post' | 'blocked' | 'normal' | 'contra' | 'withBall' | 'withoutBall' | 'counter' | 'goal' | 'saved' | 'noGoal' | LateralResult;
  cardType?: 'yellow' | 'secondYellow' | 'red';
  isOpponentGoal?: boolean; // true se for gol do adversário
  passToPlayerId?: string; // ID do jogador que recebeu o passe
  passToPlayerName?: string; // Nome do jogador que recebeu o passe
  tipo: string; // Tipo da ação para análise (ex: "Passe", "Finalização", "Gol")
  subtipo: string; // Subtipo da ação (ex: "Certo", "No gol", "A favor")
  details?: any;
  // Campos para falta com zona
  foulZone?: 'ataque' | 'defesa';
  /** Falta cometida por nossa equipe ('for') ou pelo adversário ('against') */
  foulTeam?: 'for' | 'against';
  // Campos para tiro livre e pênalti
  kickerId?: string; // ID do cobrador (tiro livre/pênalti)
  kickerName?: string; // Nome do cobrador
  isForUs?: boolean; // true se tiro livre/pênalti a favor
}

export const MatchScoutingWindow: React.FC<MatchScoutingWindowProps> = ({
  isOpen,
  onClose,
  match,
  players,
  teams,
  matchType,
  extraTimeMinutes = 5,
  selectedPlayerIds,
  mode = 'realtime',
  onSave,
  recordedByUser,
  takeFullWidth,
}) => {
  const isPostmatch = mode === 'postmatch';
  const [matchTime, setMatchTime] = useState<number>(0); // tempo em segundos
  const [manualTimeInput, setManualTimeInput] = useState<string>(''); // postmatch: dígitos MMSS
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMatchEnded, setIsMatchEnded] = useState<boolean>(false);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [showSubstitutions, setShowSubstitutions] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null); // ID do jogador selecionado para ação
  const [goalsFor, setGoalsFor] = useState<number>(0); // Gols da nossa equipe
  const [goalsAgainst, setGoalsAgainst] = useState<number>(0); // Gols do adversário
  const [foulsForCount, setFoulsForCount] = useState<number>(0); // Faltas nossa equipe (máx. 5)
  const [foulsAgainstCount, setFoulsAgainstCount] = useState<number>(0); // Faltas adversário (máx. 5)
  const [showGoalTeamSelection, setShowGoalTeamSelection] = useState<boolean>(false); // Modal para escolher gol nosso ou adversário
  const [showGoalOurOptions, setShowGoalOurOptions] = useState<boolean>(false); // Modal para escolher autor do gol nosso ou gol contra
  const [showGoalConfirmation, setShowGoalConfirmation] = useState<boolean>(false); // Modal de confirmação de gol
  const [showCardOptions, setShowCardOptions] = useState<boolean>(false); // Controla exibição de opções de cartão
  const [pendingGoalType, setPendingGoalType] = useState<'normal' | 'contra' | null>(null); // Tipo de gol pendente (normal = nosso, contra = adversário marcou)
  const [pendingGoalIsOpponent, setPendingGoalIsOpponent] = useState<boolean>(false); // Se o gol é do adversário
  const [pendingGoalPlayerId, setPendingGoalPlayerId] = useState<string | null>(null); // ID do jogador autor do gol (se gol nosso)
  const [pendingGoalTime, setPendingGoalTime] = useState<number | null>(null); // Tempo capturado quando GOL foi clicado
  const [goalStep, setGoalStep] = useState<'team' | 'author' | 'confirm' | null>(null); // Fluxo inline do gol
  
  // Estado para rastrear cartões por jogador
  const [playerCards, setPlayerCards] = useState<Record<string, Array<'yellow' | 'secondYellow' | 'red'>>>({});
  
  // Estados para escalação e controle de partida
  const [showLineupModal, setShowLineupModal] = useState<boolean>(false);
  const [lineupPlayers, setLineupPlayers] = useState<string[]>([]); // Array de 5 IDs - primeiro é goleiro
  const [benchPlayers, setBenchPlayers] = useState<string[]>([]); // IDs dos jogadores no banco
  const [ballPossessionStart, setBallPossessionStart] = useState<'us' | 'opponent' | null>(null);
  const [isMatchStarted, setIsMatchStarted] = useState<boolean>(false);
  
  // Estados para sistema de passes com relacionamento
  const [showPassReceiverSelection, setShowPassReceiverSelection] = useState<boolean>(false);
  const [pendingPassResult, setPendingPassResult] = useState<'correct' | 'wrong' | null>(null);
  const [pendingPassEventId, setPendingPassEventId] = useState<string | null>(null);
  const [pendingPassSenderId, setPendingPassSenderId] = useState<string | null>(null); // ID do passador aguardando receptor
  
  // Estados para período e posse
  const [currentPeriod, setCurrentPeriod] = useState<'1T' | '2T'>('1T');
  const [ballPossessionNow, setBallPossessionNow] = useState<'com' | 'sem'>('com');
  const ballPossessionNowRef = useRef<'com' | 'sem'>(ballPossessionNow);
  useEffect(() => { ballPossessionNowRef.current = ballPossessionNow; }, [ballPossessionNow]);
  const [possessionSecondsWith, setPossessionSecondsWith] = useState<number>(0);
  const [possessionSecondsWithout, setPossessionSecondsWithout] = useState<number>(0);
  const [showIntervalAnalysis, setShowIntervalAnalysis] = useState<boolean>(false);
  
  // Estado para goleiro atual (fixo ou goleiro linha)
  const [currentGoalkeeperId, setCurrentGoalkeeperId] = useState<string | null>(null);
  
  // Estados para rastreamento de substituições
  const [substitutionHistory, setSubstitutionHistory] = useState<Array<{
    playerOutId: string;
    playerInId: string;
    time: number;
    period: '1T' | '2T';
  }>>([]);
  const [substitutionCounts, setSubstitutionCounts] = useState<Record<string, number>>({});
  
  // Estado de expulsão: time joga com um a menos até 1 min ou gol adversário; então pode repor no slot
  const [expulsionState, setExpulsionState] = useState<{
    expelledPlayerId: string;
    expelledAtTime: number;
    period: '1T' | '2T';
  } | null>(null);
  const [showExpulsionReplacementSelection, setShowExpulsionReplacementSelection] = useState<boolean>(false);
  
  // Estados para confirmação de falta com zona
  const [showFoulConfirmation, setShowFoulConfirmation] = useState<boolean>(false);
  const [pendingFoulZone, setPendingFoulZone] = useState<'ataque' | 'defesa' | null>(null);

  // Estado para setor da bola (Ataque/Defesa - Esquerda/Direita) - usado por Falta, Lateral, Escanteio
  const [ballSector, setBallSector] = useState<LateralResult | null>(null);

  // Tela de logs (eventos em tabela editável)
  const [showLogsView, setShowLogsView] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ time: number; period: '1T' | '2T'; type: MatchEvent['type']; result?: MatchEvent['result']; cardType?: MatchEvent['cardType']; foulTeam?: 'for' | 'against' } | null>(null);
  const [editTimeInput, setEditTimeInput] = useState<string>('');
  
  // Estados para tiro livre e pênalti (fluxo inline)
  const [showFreeKickTeamSelection, setShowFreeKickTeamSelection] = useState<boolean>(false);
  const [showFreeKickKickerSelection, setShowFreeKickKickerSelection] = useState<boolean>(false);
  const [showFreeKickResult, setShowFreeKickResult] = useState<boolean>(false);
  const [pendingFreeKickTeam, setPendingFreeKickTeam] = useState<'for' | 'against' | null>(null);
  const [pendingFreeKickKickerId, setPendingFreeKickKickerId] = useState<string | null>(null);
  const [freeKickStep, setFreeKickStep] = useState<'team' | 'kicker' | 'result' | null>(null);
  const [penaltyStep, setPenaltyStep] = useState<'team' | 'kicker' | 'result' | null>(null);
  
  const [showPenaltyTeamSelection, setShowPenaltyTeamSelection] = useState<boolean>(false);
  const [showPenaltyKickerSelection, setShowPenaltyKickerSelection] = useState<boolean>(false);
  const [showPenaltyResult, setShowPenaltyResult] = useState<boolean>(false);
  const [pendingPenaltyTeam, setPendingPenaltyTeam] = useState<'for' | 'against' | null>(null);
  const [pendingPenaltyKickerId, setPendingPenaltyKickerId] = useState<string | null>(null);

  const teamName = teams && teams.length > 0 ? teams[0].nome : 'Nossa Equipe';
  
  // Funções para gerenciar frequência de substituições em localStorage
  const loadSubstitutionFrequency = (): Record<string, number> => {
    try {
      const stored = localStorage.getItem('substitutionFrequency');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  
  const updateSubstitutionFrequency = (history: Array<{ playerOutId: string; playerInId: string }>) => {
    try {
      const frequency = loadSubstitutionFrequency();
      history.forEach(sub => {
        frequency[sub.playerOutId] = (frequency[sub.playerOutId] || 0) + 1;
        frequency[sub.playerInId] = (frequency[sub.playerInId] || 0) + 1;
      });
      localStorage.setItem('substitutionFrequency', JSON.stringify(frequency));
    } catch (error) {
      console.error('Erro ao atualizar frequência de substituições:', error);
    }
  };

  // Mapeamento ação → tipo + subtipo para análise
  const getTipoSubtipo = (type: MatchEvent['type'], result?: MatchEvent['result'], cardType?: MatchEvent['cardType']): { tipo: string; subtipo: string } => {
    switch (type) {
      case 'pass':
        return { tipo: 'Passe', subtipo: result === 'correct' ? 'Certo' : 'Errado' };
      case 'shot':
        if (result === 'inside') return { tipo: 'Finalização', subtipo: 'No gol' };
        if (result === 'outside') return { tipo: 'Finalização', subtipo: 'Pra fora' };
        if (result === 'post') return { tipo: 'Finalização', subtipo: 'Trave' };
        if (result === 'blocked') return { tipo: 'Finalização', subtipo: 'Bloqueado' };
        return { tipo: 'Finalização', subtipo: '' };
      case 'foul':
        if (result === 'defesaDireita') return { tipo: 'Falta', subtipo: 'Defesa - Direita' };
        if (result === 'defesaEsquerda') return { tipo: 'Falta', subtipo: 'Defesa - Esquerda' };
        if (result === 'ataqueDireita') return { tipo: 'Falta', subtipo: 'Ataque - Direita' };
        if (result === 'ataqueEsquerda') return { tipo: 'Falta', subtipo: 'Ataque - Esquerda' };
        return { tipo: 'Falta', subtipo: '' };
      case 'goal':
        if (result === 'contra') return { tipo: 'Gol', subtipo: 'Contra' };
        return { tipo: 'Gol', subtipo: 'A favor' };
      case 'card':
        if (cardType === 'yellow') return { tipo: 'Cartão', subtipo: 'Amarelo' };
        if (cardType === 'secondYellow') return { tipo: 'Cartão', subtipo: 'Segundo Amarelo' };
        if (cardType === 'red') return { tipo: 'Cartão', subtipo: 'Vermelho' };
        return { tipo: 'Cartão', subtipo: '' };
      case 'tackle':
        if (result === 'withBall') return { tipo: 'Desarme', subtipo: 'Com posse' };
        if (result === 'withoutBall') return { tipo: 'Desarme', subtipo: 'Sem posse' };
        if (result === 'counter') return { tipo: 'Desarme', subtipo: 'Contra-ataque' };
        return { tipo: 'Desarme', subtipo: '' };
      case 'save':
        return { tipo: 'Defesa', subtipo: 'Defesa' };
      case 'block':
        return { tipo: 'Bloqueio', subtipo: 'Bloqueio' };
      case 'corner':
        if (result === 'defesaDireita') return { tipo: 'Escanteio', subtipo: 'Defesa - Direita' };
        if (result === 'defesaEsquerda') return { tipo: 'Escanteio', subtipo: 'Defesa - Esquerda' };
        if (result === 'ataqueDireita') return { tipo: 'Escanteio', subtipo: 'Ataque - Direita' };
        if (result === 'ataqueEsquerda') return { tipo: 'Escanteio', subtipo: 'Ataque - Esquerda' };
        return { tipo: 'Escanteio', subtipo: 'Escanteio' };
      case 'freeKick':
        if (result === 'goal') return { tipo: 'Tiro Livre', subtipo: 'Gol' };
        if (result === 'saved') return { tipo: 'Tiro Livre', subtipo: 'Defendido' };
        if (result === 'outside') return { tipo: 'Tiro Livre', subtipo: 'Pra fora' };
        if (result === 'post') return { tipo: 'Tiro Livre', subtipo: 'Trave' };
        if (result === 'noGoal') return { tipo: 'Tiro Livre', subtipo: 'Não gol' };
        return { tipo: 'Tiro Livre', subtipo: '' };
      case 'penalty':
        if (result === 'goal') return { tipo: 'Pênalti', subtipo: 'Gol' };
        if (result === 'saved') return { tipo: 'Pênalti', subtipo: 'Defendido' };
        if (result === 'outside') return { tipo: 'Pênalti', subtipo: 'Pra fora' };
        if (result === 'post') return { tipo: 'Pênalti', subtipo: 'Trave' };
        if (result === 'noGoal') return { tipo: 'Pênalti', subtipo: 'Não gol' };
        return { tipo: 'Pênalti', subtipo: '' };
      case 'lateral':
        if (result === 'defesaDireita') return { tipo: 'Lateral', subtipo: 'Defesa - Direita' };
        if (result === 'defesaEsquerda') return { tipo: 'Lateral', subtipo: 'Defesa - Esquerda' };
        if (result === 'ataqueDireita') return { tipo: 'Lateral', subtipo: 'Ataque - Direita' };
        if (result === 'ataqueEsquerda') return { tipo: 'Lateral', subtipo: 'Ataque - Esquerda' };
        return { tipo: 'Lateral', subtipo: '' };
      default:
        return { tipo: type, subtipo: '' };
    }
  };

  // Opções de tipo de ação para a tela de logs (value = MatchEvent['type'])
  const EVENT_TYPE_OPTIONS: { value: MatchEvent['type']; label: string }[] = [
    { value: 'pass', label: 'Passe' },
    { value: 'shot', label: 'Finalização' },
    { value: 'foul', label: 'Falta' },
    { value: 'goal', label: 'Gol' },
    { value: 'card', label: 'Cartão' },
    { value: 'tackle', label: 'Desarme' },
    { value: 'save', label: 'Defesa' },
    { value: 'block', label: 'Bloqueio' },
    { value: 'corner', label: 'Escanteio' },
    { value: 'freeKick', label: 'Tiro Livre' },
    { value: 'penalty', label: 'Pênalti' },
    { value: 'lateral', label: 'Lateral' },
  ];

  // Opções de subtipo por tipo (para selects na edição de logs)
  const getSubtypeOptions = (type: MatchEvent['type']): { value: string; result?: MatchEvent['result']; cardType?: MatchEvent['cardType'] }[] => {
    switch (type) {
      case 'pass':
        return [{ value: 'Certo', result: 'correct' }, { value: 'Errado', result: 'wrong' }];
      case 'shot':
        return [{ value: 'No gol', result: 'inside' }, { value: 'Pra fora', result: 'outside' }, { value: 'Trave', result: 'post' }, { value: 'Bloqueado', result: 'blocked' }];
      case 'foul':
      case 'corner':
      case 'lateral':
        return [
          { value: 'Defesa - Direita', result: 'defesaDireita' },
          { value: 'Defesa - Esquerda', result: 'defesaEsquerda' },
          { value: 'Ataque - Direita', result: 'ataqueDireita' },
          { value: 'Ataque - Esquerda', result: 'ataqueEsquerda' },
        ];
      case 'goal':
        return [{ value: 'A favor', result: 'normal' }, { value: 'Contra', result: 'contra' }];
      case 'card':
        return [{ value: 'Amarelo', cardType: 'yellow' }, { value: 'Segundo Amarelo', cardType: 'secondYellow' }, { value: 'Vermelho', cardType: 'red' }];
      case 'tackle':
        return [{ value: 'Com posse', result: 'withBall' }, { value: 'Sem posse', result: 'withoutBall' }, { value: 'Contra-ataque', result: 'counter' }];
      case 'freeKick':
      case 'penalty':
        return [{ value: 'Gol', result: 'goal' }, { value: 'Defendido', result: 'saved' }, { value: 'Pra fora', result: 'outside' }, { value: 'Trave', result: 'post' }, { value: 'Não gol', result: 'noGoal' }];
      default:
        return [];
    }
  };

  // Tempo a usar ao registrar evento (cronômetro ou manual)
  const getTimeForEvent = (): number | null => {
    if (isPostmatch) {
      return parseManualTimeToSeconds(manualTimeInput);
    }
    return matchTime;
  };

  // Inicializar modal de escalação quando janela abrir (apenas realtime)
  useEffect(() => {
    if (!isOpen) return;
    if (isPostmatch) {
      // Postmatch: pular lineup, usar selectedPlayerIds como jogadores ativos
      const ids = selectedPlayerIds && selectedPlayerIds.length > 0
        ? selectedPlayerIds
        : players.map(p => String(p.id).trim());
      setActivePlayers(players.filter(p => ids.includes(String(p.id).trim())));
      setLineupPlayers(ids);
      setBenchPlayers([]);
      setIsMatchStarted(true);
      setShowLineupModal(false);
      return;
    }
    if (!isMatchStarted && !showLineupModal) {
      if (selectedPlayerIds && selectedPlayerIds.length > 0) {
        setBenchPlayers([...selectedPlayerIds]);
        setLineupPlayers([]);
        setShowLineupModal(true);
      } else if (players && players.length > 0) {
        const allPlayerIds = players.map(p => String(p.id).trim());
        setBenchPlayers(allPlayerIds);
        setLineupPlayers([]);
        setShowLineupModal(true);
      }
    }
  }, [isOpen, isMatchStarted, isPostmatch, selectedPlayerIds, players]);

  // Atualizar jogadores ativos baseado na escalação (apenas realtime)
  useEffect(() => {
    if (!isOpen || isPostmatch) return;
    if (players && players.length > 0 && lineupPlayers.length > 0) {
      const active = players.filter(p => lineupPlayers.includes(String(p.id).trim()));
      setActivePlayers(active);
    } else if (lineupPlayers.length === 0) {
      setActivePlayers([]);
    }
  }, [isOpen, isPostmatch, players, lineupPlayers]);

  // Cronômetro e acúmulo de tempo com/sem posse
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isMatchEnded) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
        if (ballPossessionNowRef.current === 'com') {
          setPossessionSecondsWith(prev => prev + 1);
        } else {
          setPossessionSecondsWithout(prev => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isMatchEnded]);

  // Formatar tempo (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Recalcular placar e faltas a partir de matchEvents (usado após edição na tela de logs)
  const recalcGoalsAndFoulsFromEvents = (events: MatchEvent[]) => {
    let goalsForCalc = 0;
    let goalsAgainstCalc = 0;
    let foulsForCalc = 0;
    let foulsAgainstCalc = 0;
    for (const e of events) {
      if (e.type === 'goal') {
        if (e.isOpponentGoal) goalsAgainstCalc += 1;
        else goalsForCalc += 1;
      } else if (e.type === 'foul') {
        if (e.foulTeam === 'against') foulsAgainstCalc += 1;
        else foulsForCalc += 1; // 'for' ou legado sem foulTeam
      }
    }
    setGoalsFor(goalsForCalc);
    setGoalsAgainst(goalsAgainstCalc);
    setFoulsForCount(foulsForCalc);
    setFoulsAgainstCount(foulsAgainstCalc);
  };

  // Toggle cronômetro
  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Encerrar tempo (1T → análise intervalo, 2T → fim de jogo)
  const handleEndTime = () => {
    if (matchTime >= 20 * 60) {
      setIsRunning(false);

      if (currentPeriod === '1T') {
        setFoulsForCount(0);
        setFoulsAgainstCount(0);
        setShowIntervalAnalysis(true);
      } else {
        // Segundo tempo: encerrar partida
        setIsMatchEnded(true);
      }
    }
  };
  
  // Iniciar segundo tempo
  const handleStartSecondHalf = () => {
    setCurrentPeriod('2T');
    setMatchTime(0); // Zerar cronômetro para 2º tempo
    setShowIntervalAnalysis(false);
    // Posse inicial do 2º tempo: oposto do início do 1º
    setBallPossessionNow(ballPossessionStart === 'us' ? 'sem' : 'com');
  };

  // Processar dualidades dos eventos (opcional: filtrar por período, ex. só 1T)
  const processPlayerRelationships = (events?: MatchEvent[]) => {
    const list = events ?? matchEvents;
    const relationships: { [playerId1: string]: { [playerId2: string]: { passes: number; assists: number } } } = {};
    
    list.forEach(event => {
      if (event.type === 'pass' && event.passToPlayerId && event.playerId && event.result === 'correct') {
        const player1Id = String(event.playerId).trim();
        const player2Id = String(event.passToPlayerId).trim();
        
        // Garantir ordem consistente (menor ID primeiro)
        const [id1, id2] = player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id];
        
        if (!relationships[id1]) {
          relationships[id1] = {};
        }
        if (!relationships[id1][id2]) {
          relationships[id1][id2] = { passes: 0, assists: 0 };
        }
        
        relationships[id1][id2].passes += 1;
        
        // Verificar se foi assistência
        if (event.details?.isAssist) {
          relationships[id1][id2].assists += 1;
        }
      }
    });
    
    return relationships;
  };

  const emptyStats = (): MatchStats => ({
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
    passesTransition: 0,
    passesProgression: 0,
    shotsShootZone: 0,
    fouls: 0,
    saves: 0,
  });

  const formatTimeToMMSS = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const matchEventToPostMatchAction = (e: MatchEvent): PostMatchAction | null => {
    switch (e.type) {
      case 'goal': return 'goal';
      case 'pass': return e.result === 'correct' ? 'passCorrect' : 'passWrong';
      case 'shot':
        if (e.result === 'inside') return 'shotOn';
        if (e.result === 'outside') return 'shotOff';
        if (e.result === 'blocked') return 'shotZonaChute';
        return 'shotOn';
      case 'foul': return 'falta';
      case 'tackle':
        if (e.result === 'withBall') return 'tackleWithBall';
        if (e.result === 'withoutBall') return 'tackleWithoutBall';
        if (e.result === 'counter') return 'tackleCounter';
        return 'tackleWithBall';
      case 'save': return 'save';
      default: return null;
    }
  };

  const convertMatchEventsToMatchRecord = (events: MatchEvent[]): MatchRecord => {
    const teamStats = emptyStats();
    const playerStats: Record<string, MatchStats> = {};
    const postMatchEventLog: PostMatchEvent[] = [];
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const e of events) {
      const action = matchEventToPostMatchAction(e);
      if (!action || !e.playerId) continue;

      const playerId = String(e.playerId).trim();
      if (!playerStats[playerId]) playerStats[playerId] = emptyStats();
      const ps = playerStats[playerId];

      const timeStr = formatTimeToMMSS(e.time);

      if (action === 'goal') {
        ps.goals += 1;
        teamStats.goals += 1;
        if (e.isOpponentGoal) goalsAgainst += 1;
        else goalsFor += 1;
      } else if (action === 'passCorrect') {
        ps.passesCorrect += 1;
        teamStats.passesCorrect += 1;
      } else if (action === 'passWrong') {
        ps.passesWrong += 1;
        teamStats.passesWrong += 1;
      } else if (action === 'shotOn') {
        ps.shotsOnTarget += 1;
        teamStats.shotsOnTarget += 1;
      } else if (action === 'shotOff') {
        ps.shotsOffTarget += 1;
        teamStats.shotsOffTarget += 1;
      } else if (action === 'shotZonaChute') {
        ps.shotsShootZone = (ps.shotsShootZone ?? 0) + 1;
        teamStats.shotsShootZone = (teamStats.shotsShootZone ?? 0) + 1;
      } else if (action === 'falta') {
        teamStats.fouls = (teamStats.fouls ?? 0) + 1; // total (nosso + adversário)
        if (e.foulTeam !== 'against') {
          ps.fouls = (ps.fouls ?? 0) + 1; // faltas nossa equipe atribuídas ao jogador
        }
      } else if (action === 'tackleWithBall') {
        ps.tacklesWithBall += 1;
        teamStats.tacklesWithBall += 1;
      } else if (action === 'tackleWithoutBall') {
        ps.tacklesWithoutBall += 1;
        teamStats.tacklesWithoutBall += 1;
      } else if (action === 'tackleCounter') {
        ps.tacklesCounterAttack += 1;
        teamStats.tacklesCounterAttack += 1;
      } else if (action === 'save') {
        ps.saves = (ps.saves ?? 0) + 1;
        teamStats.saves = (teamStats.saves ?? 0) + 1;
      }

      const postEvent: PostMatchEvent = {
        id: e.id,
        time: timeStr,
        period: e.period,
        playerId,
        action,
        tipo: e.tipo,
        subtipo: e.subtipo,
      };
      if (e.playerName) postEvent.playerName = e.playerName;
      if ((action === 'passCorrect' || action === 'passWrong') && e.passToPlayerId) {
        postEvent.passToPlayerId = String(e.passToPlayerId).trim();
        if (e.passToPlayerName) postEvent.passToPlayerName = e.passToPlayerName;
      }
      const lateralToZone: Record<string, 'AT_ESQ' | 'AT_DIR' | 'DF_ESQ' | 'DF_DIR'> = {
        ataqueEsquerda: 'AT_ESQ',
        ataqueDireita: 'AT_DIR',
        defesaEsquerda: 'DF_ESQ',
        defesaDireita: 'DF_DIR',
      };
      if (e.result && lateralToZone[e.result]) postEvent.zone = lateralToZone[e.result];
      if (recordedByUser) {
        postEvent.recordedByUserId = recordedByUser.id;
        postEvent.recordedByName = recordedByUser.name;
      }
      postMatchEventLog.push(postEvent);
    }

    const playerRelationships = processPlayerRelationships();

    const result: 'V' | 'D' | 'E' = goalsFor > goalsAgainst ? 'V' : goalsAgainst > goalsFor ? 'D' : 'E';
    return {
      id: match.id,
      opponent: match.opponent,
      date: match.date,
      result,
      goalsFor,
      goalsAgainst,
      competition: match.competition,
      playerStats,
      teamStats,
      postMatchEventLog,
      playerRelationships: Object.keys(playerRelationships).length > 0 ? playerRelationships : undefined,
    };
  };

  // Encerrar coleta
  const handleEndCollection = () => {
    const canEnd = isPostmatch ? matchEvents.length >= 1 : isMatchEnded;
    if (!canEnd) return;

    if (isPostmatch && onSave) {
      const savedMatch = convertMatchEventsToMatchRecord(matchEvents);
      savedMatch.status = 'encerrado';
      onSave(savedMatch);
      onClose();
      return;
    }

    // Realtime: montar MatchRecord completo e salvar sempre ao encerrar (mesmo com zero eventos)
    if (substitutionHistory.length > 0) {
      updateSubstitutionFrequency(substitutionHistory);
    }
    if (onSave) {
      const savedMatch = convertMatchEventsToMatchRecord(matchEvents);
      savedMatch.status = 'encerrado';
      savedMatch.lineup = lineupPlayers.length > 0 && ballPossessionStart
        ? { players: lineupPlayers, bench: benchPlayers, ballPossessionStart }
        : undefined;
      savedMatch.substitutionHistory = substitutionHistory.length > 0 ? substitutionHistory : undefined;
      savedMatch.possessionSecondsWith = possessionSecondsWith;
      savedMatch.possessionSecondsWithout = possessionSecondsWithout;
      onSave(savedMatch);
    }
    onClose();
  };

  // Confirmar escalação e iniciar partida
  const handleConfirmLineup = () => {
    if (lineupPlayers.length !== 5) {
      alert('Por favor, selecione exatamente 5 jogadores para a escalação.');
      return;
    }

    const goalkeeperCount = lineupPlayers.filter((id) => {
      const p = players.find((x) => String(x.id).trim() === id);
      return p?.position === 'Goleiro';
    }).length;
    if (goalkeeperCount > 1) {
      alert(
        'A escalação não pode ter mais de um goleiro em quadra. No futsal, apenas um goleiro pode estar em campo por vez.'
      );
      return;
    }

    if (!ballPossessionStart) {
      alert('Por favor, selecione quem começou com a bola.');
      return;
    }

    setIsMatchStarted(true);
    setShowLineupModal(false);
    // Inicializar goleiro atual (primeiro da escalação)
    if (lineupPlayers.length > 0) {
      setCurrentGoalkeeperId(lineupPlayers[0]);
    }
    // Inicializar posse conforme início
    setBallPossessionNow(ballPossessionStart === 'us' ? 'com' : 'sem');
    // Cronômetro permanece zerado e parado; usuário clica em Iniciar para começar
  };

  // Adicionar jogador à escalação
  const handleAddToLineup = (playerId: string) => {
    if (lineupPlayers.length >= 5) {
      alert('Máximo de 5 jogadores em quadra. Remova um jogador primeiro.');
      return;
    }

    const player = players.find((p) => String(p.id).trim() === playerId);
    if (player?.position === 'Goleiro') {
      const hasGoalkeeper = lineupPlayers.some((id) => {
        const p = players.find((x) => String(x.id).trim() === id);
        return p?.position === 'Goleiro';
      });
      if (hasGoalkeeper) {
        alert(
          'Já há um goleiro em quadra. No futsal, apenas um goleiro pode estar em campo por vez. Durante o jogo, um jogador de linha pode assumir a função (goleiro linha).'
        );
        return;
      }
    }

    setLineupPlayers((prev) => [...prev, playerId]);
    setBenchPlayers((prev) => prev.filter((id) => id !== playerId));
  };

  // Remover jogador da escalação
  const handleRemoveFromLineup = (playerId: string) => {
    setLineupPlayers(prev => prev.filter(id => id !== playerId));
    setBenchPlayers(prev => [...prev, playerId]);
  };

  // Selecionar ação
  const handleSelectAction = (action: string) => {
    if (!isMatchStarted) {
      alert('A partida ainda não foi iniciada. Complete a escalação primeiro.');
      return;
    }
    
    // Bloquear comandos quando tempo está parado (exceto GOL e substituições) - apenas em realtime
    if (!isPostmatch && !isRunning && action !== 'goal') {
      alert('O cronômetro está parado. Inicie o cronômetro para registrar ações.');
      return;
    }
    
    // Em postmatch, validar tempo manual antes de registrar
    if (isPostmatch && action !== 'goal') {
      const t = getTimeForEvent();
      if (t === null) {
        alert('Informe o tempo (apenas números, ex.: 0100 para 01:00, 125 para 01:25).');
        return;
      }
    }
    
    if (!selectedPlayerId) {
      alert('Por favor, selecione um jogador primeiro.');
      return;
    }
    
    // Se já há passe pendente e clicou em Passe novamente, cancelar
    if (action === 'pass' && pendingPassEventId) {
      setMatchEvents(prev => prev.filter(e => e.id !== pendingPassEventId));
      setPendingPassEventId(null);
      setPendingPassSenderId(null);
      setPendingPassResult(null);
      setSelectedAction(null);
      return;
    }
    
    setSelectedAction(action);
    
    // Se for falta, definir zona como pendente (opções inline, sem modal)
    if (action === 'foul') {
      setPendingFoulZone(null);
    }
  };
  
  // Registrar desarme
  const handleRegisterTackle = (result: 'withBall' | 'withoutBall' | 'counter') => {
    if (!selectedPlayerId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('tackle', result);
    const newEvent: MatchEvent = {
      id: `tackle-${Date.now()}`,
      type: 'tackle',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);

    // Retomar cronômetro (desarme = bola em jogo)
    if (!isRunning) {
      setIsRunning(true);
    }

    setBallPossessionNow('com');
    setSelectedAction(null);
  };

  // Registrar defesa (apenas para goleiro atual)
  const handleRegisterSave = () => {
    if (!selectedPlayerId || selectedPlayerId !== currentGoalkeeperId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('save');
    const newEvent: MatchEvent = {
      id: `save-${Date.now()}`,
      type: 'save',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Retomar cronômetro (defesa = bola em jogo)
    if (!isRunning) {
      setIsRunning(true);
    }
    
    setSelectedAction(null);
  };
  
  // Registrar bloqueio
  const handleRegisterBlock = () => {
    if (!selectedPlayerId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('block');
    const newEvent: MatchEvent = {
      id: `block-${Date.now()}`,
      type: 'block',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Retomar cronômetro (bloqueio = bola em jogo)
    if (!isRunning) {
      setIsRunning(true);
    }
    
    setSelectedAction(null);
  };

  // Registrar falta: Nosso ou Adversário. Cronômetro já parado ao clicar em FALTA.
  const handleRegisterFoul = (team: 'for' | 'against') => {
    if (!selectedPlayerId) return;

    if (team === 'for' && foulsForCount >= 5) {
      alert('Limite de 5 faltas (nosso) atingido. Use a opção "Tiro Livre" para faltas adicionais.');
      return;
    }
    if (team === 'against' && foulsAgainstCount >= 5) {
      alert('Limite de 5 faltas (adversário) atingido. Use a opção "Tiro Livre" para faltas adicionais.');
      return;
    }

    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const subtipoText = team === 'for' ? 'Nosso' : 'Adversário';
    const newEvent: MatchEvent = {
      id: `foul-${Date.now()}`,
      type: 'foul',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      tipo: 'Falta',
      subtipo: subtipoText,
      foulTeam: team,
    };

    setMatchEvents(prev => [...prev, newEvent]);

    if (team === 'for') {
      setFoulsForCount(prev => prev + 1);
    } else {
      setFoulsAgainstCount(prev => prev + 1);
    }

    setSelectedAction(null);
  };

  // Registrar resultado de passe
  const handleRegisterPass = (result: 'correct' | 'wrong') => {
    if (!selectedPlayerId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('pass', result);
    const eventId = `pass-${Date.now()}`;
    const newEvent: MatchEvent = {
      id: eventId,
      type: 'pass',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Se passe foi correto, aguardar próximo jogador selecionado como receptor
    if (result === 'correct') {
      setPendingPassSenderId(selectedPlayerId);
      setPendingPassEventId(eventId);
      setPendingPassResult('correct');
      // Retomar cronômetro (passe certo = bola em jogo)
      if (!isRunning) {
        setIsRunning(true);
      }
    } else {
      // Passe errado: posse de bola passa para o adversário (sem posse)
      setBallPossessionNow('sem');
      setSelectedAction(null);
    }
  };

  // Confirmar receptor do passe (chamado quando usuário seleciona próximo jogador)
  const handleConfirmPassReceiver = (receiverId: string) => {
    if (!pendingPassEventId || !receiverId || !pendingPassSenderId) return;
    
    // Não permitir que o passador seja o receptor
    if (receiverId === pendingPassSenderId) {
      return;
    }
    
    const receiver = activePlayers.find(p => String(p.id).trim() === receiverId);
    
    // Atualizar evento com receptor
    setMatchEvents(prev => prev.map(event => {
      if (event.id === pendingPassEventId) {
        return {
          ...event,
          passToPlayerId: receiverId,
          passToPlayerName: receiver?.name || '',
        };
      }
      return event;
    }));
    
    // Limpar estado pendente e atualizar jogador selecionado para o receptor
    setPendingPassResult(null);
    setPendingPassEventId(null);
    setPendingPassSenderId(null);
    setSelectedAction(null);
    setSelectedPlayerId(receiverId); // Receptor vira o jogador selecionado
  };

  // Registrar resultado de chute
  const handleRegisterShot = (result: 'inside' | 'outside' | 'post' | 'blocked') => {
    if (!selectedPlayerId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('shot', result);
    const newEvent: MatchEvent = {
      id: `shot-${Date.now()}`,
      type: 'shot',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Parar cronômetro se chute pra fora
    if (result === 'outside') {
      setIsRunning(false);
    } else {
      // Retomar cronômetro se não for pra fora (bola em jogo)
      if (!isRunning) {
        setIsRunning(true);
      }
    }
    
    setSelectedAction(null);
  };
  
  // Registrar escanteio (zone opcional: Defesa/Ataque - Esquerda/Direita)
  const handleRegisterCorner = (zone?: LateralResult) => {
    if (!selectedPlayerId) return;
    setIsRunning(false);

    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('corner', zone);
    const newEvent: MatchEvent = {
      id: `corner-${Date.now()}`,
      type: 'corner',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      ...(zone && { result: zone }),
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    setSelectedAction(null);
  };

  // Registrar lateral (cronômetro já parado ao clicar em LATERAL)
  const handleRegisterLateral = (subtipo: LateralResult) => {
    if (!selectedPlayerId) return;

    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo: subtipoText } = getTipoSubtipo('lateral', subtipo);
    const newEvent: MatchEvent = {
      id: `lateral-${Date.now()}`,
      type: 'lateral',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result: subtipo,
      tipo,
      subtipo: subtipoText,
    };

    setMatchEvents(prev => [...prev, newEvent]);
    setSelectedAction(null);
  };

  // Encontrar último passe antes do gol
  const findLastPassBeforeGoal = (goalTime: number): MatchEvent | null => {
    const timeWindow = 5; // 5 segundos antes do gol
    const passes = matchEvents
      .filter(e => 
        e.type === 'pass' && 
        e.result === 'correct' && 
        e.passToPlayerId && 
        e.time <= goalTime && 
        e.time >= goalTime - timeWindow
      )
      .sort((a, b) => b.time - a.time);
    
    return passes.length > 0 ? passes[0] : null;
  };

  // Registrar gol
  const handleRegisterGoal = (goalType: 'normal' | 'contra', isOpponent: boolean = false, playerId: string | null = null) => {
    const player = playerId ? activePlayers.find(p => String(p.id).trim() === playerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('goal', goalType);
    // Usar o tempo capturado quando GOL foi clicado, ou matchTime como fallback
    const goalTime = pendingGoalTime !== null ? pendingGoalTime : matchTime;
    const newEvent: MatchEvent = {
      id: `goal-${Date.now()}`,
      type: 'goal',
      playerId: playerId || undefined,
      playerName: player?.name || (isOpponent ? 'Adversário' : 'Gol Contra'),
      time: goalTime,
      period: currentPeriod,
      result: goalType,
      isOpponentGoal: isOpponent,
      tipo,
      subtipo,
    };
    
    // Verificar se houve passe que resultou em gol (assistência)
    if (!isOpponent && playerId && goalType === 'normal') {
      const lastPass = findLastPassBeforeGoal(goalTime);
      if (lastPass && lastPass.passToPlayerId === playerId) {
        // Marcar o evento de passe como assistência
        setMatchEvents(prev => prev.map(event => {
          if (event.id === lastPass.id) {
            return {
              ...event,
              details: { ...event.details, isAssist: true, goalEventId: newEvent.id },
            };
          }
          return event;
        }));
      }
    }
    
    setMatchEvents(prev => [...prev, newEvent]);
    if (isOpponent) {
      setGoalsAgainst(prev => prev + 1);
    } else {
      setGoalsFor(prev => prev + 1);
    }
    
    // Cronômetro já foi parado quando GOL foi clicado, mas garantir que está parado
    setIsRunning(false);
    
    setShowGoalConfirmation(false);
    setPendingGoalType(null);
    setPendingGoalIsOpponent(false);
    setPendingGoalPlayerId(null);
    setPendingGoalTime(null);
    setGoalStep(null); // Limpar fluxo inline
  };
  
  // Registrar tiro livre
  const handleRegisterFreeKick = (team: 'for' | 'against', kickerId: string | null, result: 'goal' | 'saved' | 'outside' | 'post' | 'noGoal') => {
    const kicker = kickerId ? activePlayers.find(p => String(p.id).trim() === kickerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('freeKick', result);
    const newEvent: MatchEvent = {
      id: `freekick-${Date.now()}`,
      type: 'freeKick',
      playerId: kickerId || undefined,
      playerName: kicker?.name || (team === 'against' ? 'Adversário' : 'Nossa Equipe'),
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result,
      tipo,
      subtipo,
      isForUs: team === 'for',
      kickerId: kickerId || undefined,
      kickerName: kicker?.name || undefined,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Atualizar placar se for gol
    if (result === 'goal') {
      if (team === 'for') {
        setGoalsFor(prev => prev + 1);
      } else {
        setGoalsAgainst(prev => prev + 1);
      }
    }
    
    // Parar cronômetro
    setIsRunning(false);
    
    // Retomar se resultado indica bola em jogo (exceto gol e não gol)
    if (result !== 'goal' && result !== 'noGoal') {
      // Retomar após breve pausa (defendido, pra fora, trave = bola volta ao jogo)
      setTimeout(() => {
        if (!isMatchEnded) {
          setIsRunning(true);
        }
      }, 1000);
    }
    
    setShowFreeKickTeamSelection(false);
    setShowFreeKickKickerSelection(false);
    setShowFreeKickResult(false);
    setPendingFreeKickTeam(null);
    setPendingFreeKickKickerId(null);
    setFreeKickStep(null);
    setSelectedAction(null);
  };
  
  // Registrar pênalti
  const handleRegisterPenalty = (team: 'for' | 'against', kickerId: string | null, result: 'goal' | 'saved' | 'outside' | 'post' | 'noGoal') => {
    const kicker = kickerId ? activePlayers.find(p => String(p.id).trim() === kickerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('penalty', result);
    const newEvent: MatchEvent = {
      id: `penalty-${Date.now()}`,
      type: 'penalty',
      playerId: kickerId || undefined,
      playerName: kicker?.name || (team === 'against' ? 'Adversário' : 'Nossa Equipe'),
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      result,
      tipo,
      subtipo,
      isForUs: team === 'for',
      kickerId: kickerId || undefined,
      kickerName: kicker?.name || undefined,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Atualizar placar se for gol
    if (result === 'goal') {
      if (team === 'for') {
        setGoalsFor(prev => prev + 1);
      } else {
        setGoalsAgainst(prev => prev + 1);
      }
    }
    
    // Parar cronômetro
    setIsRunning(false);
    
    // Retomar se resultado indica bola em jogo (exceto gol e não gol)
    if (result !== 'goal' && result !== 'noGoal') {
      setTimeout(() => {
        if (!isMatchEnded) {
          setIsRunning(true);
        }
      }, 1000);
    }
    
    setShowPenaltyTeamSelection(false);
    setShowPenaltyKickerSelection(false);
    setShowPenaltyResult(false);
    setPendingPenaltyTeam(null);
    setPendingPenaltyKickerId(null);
    setPenaltyStep(null);
    setSelectedAction(null);
  };

  // Verificar se jogador deve ser expulso
  const checkPlayerExpulsion = (playerId: string): boolean => {
    const cards = playerCards[playerId] || [];
    const yellowCount = cards.filter(c => c === 'yellow').length;
    const hasSecondYellow = cards.some(c => c === 'secondYellow');
    const hasRed = cards.some(c => c === 'red');
    
    return yellowCount >= 2 || hasSecondYellow || hasRed;
  };

  // Registrar cartão
  const handleRegisterCard = (cardType: 'yellow' | 'secondYellow' | 'red') => {
    if (!selectedPlayerId) return;
    
    const player = activePlayers.find(p => String(p.id).trim() === selectedPlayerId);
    const { tipo, subtipo } = getTipoSubtipo('card', undefined, cardType);
    const newEvent: MatchEvent = {
      id: `card-${Date.now()}`,
      type: 'card',
      playerId: selectedPlayerId,
      playerName: player?.name || '',
      time: (getTimeForEvent() ?? matchTime),
      period: currentPeriod,
      cardType,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Adicionar cartão ao histórico do jogador
    setPlayerCards(prev => {
      const updatedCards = [...(prev[selectedPlayerId] || []), cardType];
      return {
        ...prev,
        [selectedPlayerId]: updatedCards,
      };
    });
    
    // Verificar expulsão após atualizar cartões (usar useEffect ou verificação imediata)
    const currentCards = [...(playerCards[selectedPlayerId] || []), cardType];
    const yellowCount = currentCards.filter(c => c === 'yellow').length;
    const hasSecondYellow = currentCards.some(c => c === 'secondYellow');
    const hasRed = currentCards.some(c => c === 'red');
    const isExpelled = yellowCount >= 2 || hasSecondYellow || hasRed;
    
    if (isExpelled) {
      // Remover jogador da escalação (time fica com um a menos); não colocar no banco
      if (lineupPlayers.includes(selectedPlayerId)) {
        const newLineup = lineupPlayers.filter(id => id !== selectedPlayerId);
        setLineupPlayers(newLineup);
        // Não adicionar expulso ao banco: slot de expulsão até 1 min ou gol adversário
        
        // Se goleiro foi expulso, atualizar currentGoalkeeperId
        if (selectedPlayerId === currentGoalkeeperId) {
          if (newLineup.length > 0) {
            setCurrentGoalkeeperId(newLineup[0]);
          } else {
            setCurrentGoalkeeperId(null);
          }
        }
        
        // Registrar slot de expulsão: pode repor após 1 min (cronômetro) ou gol do adversário
        setExpulsionState({
          expelledPlayerId: selectedPlayerId,
          expelledAtTime: matchTime,
          period: currentPeriod,
        });
      }
      
      // activePlayers é derivado de lineupPlayers no useEffect, então já reflete 4 em quadra
      
      alert(`⚠️ ${player?.name || 'Jogador'} foi expulso. Time joga com um a menos até 1 min ou gol adversário.`);
    }
    
    setSelectedAction(null);
    setSelectedPlayerId(null); // Limpar seleção após registrar cartão
  };

  // Repor slot de expulsão: jogador do banco entra no lugar do expulso (após 1 min ou gol adversário)
  const handleReplaceExpulsionSlot = (playerInId: string) => {
    if (!expulsionState) return;
    const playerOutId = expulsionState.expelledPlayerId;
    setSubstitutionHistory((prev) => [
      ...prev,
      { playerOutId, playerInId, time: getTimeForEvent() ?? matchTime, period: currentPeriod },
    ]);
    setSubstitutionCounts((prev) => ({
      ...prev,
      [playerOutId]: (prev[playerOutId] || 0) + 1,
      [playerInId]: (prev[playerInId] || 0) + 1,
    }));
    updateSubstitutionFrequency([{ playerOutId, playerInId }]);
    setLineupPlayers((prev) => [...prev, playerInId]);
    setBenchPlayers((prev) => prev.filter((id) => id !== playerInId));
    setExpulsionState(null);
    setShowExpulsionReplacementSelection(false);
  };

  // Mapeamento LateralResult -> rótulo zona (AT ESQ, AT DIR, DF ESQ, DF DIR)
  const lateralToZoneLabel: Record<string, string> = {
    ataqueEsquerda: 'AT ESQ',
    ataqueDireita: 'AT DIR',
    defesaEsquerda: 'DF ESQ',
    defesaDireita: 'DF DIR',
  };

  // Últimos 3 comandos para log
  const lastThreeEvents = useMemo(() => {
    return [...matchEvents].reverse().slice(0, 3).reverse();
  }, [matchEvents]);

  // Linhas de exibição para "Últimos comandos": passes viram duas linhas (quem deu / quem recebeu)
  const lastCommandDisplayLines = useMemo(() => {
    const lines: Array<{ key: string; time: number; playerName: string; actionText: string; zone?: string }> = [];
    for (const event of lastThreeEvents) {
      const zone = event.result && lateralToZoneLabel[event.result] ? lateralToZoneLabel[event.result] : undefined;
      const isPassWithReceiver = event.type === 'pass' && event.passToPlayerId && event.passToPlayerName;
      if (isPassWithReceiver) {
        lines.push({
          key: `${event.id}-passer`,
          time: event.time,
          playerName: event.playerName || 'N/A',
          actionText: event.tipo + (event.subtipo ? ` ${event.subtipo}` : ''),
          zone,
        });
        lines.push({
          key: `${event.id}-receiver`,
          time: event.time,
          playerName: event.passToPlayerName || 'N/A',
          actionText: 'Recebeu passe',
          zone,
        });
      } else {
        lines.push({
          key: event.id,
          time: event.time,
          playerName: event.playerName || 'N/A',
          actionText: event.tipo + (event.subtipo ? ` ${event.subtipo}` : ''),
          zone,
        });
      }
    }
    return lines;
  }, [lastThreeEvents]);

  // Jogadores do banco ordenados por frequência de substituições
  const isBlockedByPenalty = !!penaltyStep;

  const sortedBenchPlayers = useMemo(() => {
    const frequency = loadSubstitutionFrequency();
    return [...benchPlayers].sort((a, b) => {
      const freqA = frequency[a] || 0;
      const freqB = frequency[b] || 0;
      return freqB - freqA; // Mais frequentes primeiro
    });
  }, [benchPlayers]);

  // Pode repor no slot de expulsão: 1 min (no mesmo período) ou gol do adversário após expulsão
  const canReplaceAfterExpulsion = useMemo(() => {
    if (!expulsionState) return false;
    const oneMinuteElapsed =
      currentPeriod === expulsionState.period &&
      matchTime >= expulsionState.expelledAtTime + 60;
    const opponentScoredAfterExpulsion = matchEvents.some(
      (e) =>
        e.type === 'goal' &&
        e.isOpponentGoal &&
        ((e.period === expulsionState.period && e.time >= expulsionState.expelledAtTime) ||
          (expulsionState.period === '1T' && e.period === '2T'))
    );
    return oneMinuteElapsed || opponentScoredAfterExpulsion;
  }, [expulsionState, matchTime, currentPeriod, matchEvents]);

  // Segundos restantes para poder repor (no mesmo período); null se já pode ou outro critério
  const expulsionCountdownSeconds = useMemo(() => {
    if (!expulsionState || canReplaceAfterExpulsion) return null;
    if (currentPeriod !== expulsionState.period) return null;
    const elapsed = matchTime - expulsionState.expelledAtTime;
    const remaining = 60 - elapsed;
    return remaining <= 0 ? 0 : remaining;
  }, [expulsionState, matchTime, currentPeriod, canReplaceAfterExpulsion]);

  // Estatísticas do 1º tempo (apenas eventos com period === '1T')
  const firstHalfStats = useMemo(() => {
    const e1t = matchEvents.filter(e => e.period === '1T');
    return {
      shots: e1t.filter(e => e.type === 'shot').length,
      corners: e1t.filter(e => e.type === 'corner').length,
      saves: e1t.filter(e => e.type === 'save').length,
      fouls: e1t.filter(e => e.type === 'foul').length,
      cards: e1t.filter(e => e.type === 'card').length,
    };
  }, [matchEvents]);

  // Relação entre jogadores e passes no 1º tempo (duplas, jogadores, certo/errado)
  const firstHalfPassData = useMemo(() => {
    const e1t = matchEvents.filter(e => e.period === '1T');
    const passesCorrect = e1t.filter(e => e.type === 'pass' && e.result === 'correct').length;
    const passesWrong = e1t.filter(e => e.type === 'pass' && e.result === 'wrong').length;
    const relationships = processPlayerRelationships(e1t);
    const getPlayerName = (id: string) => players.find(p => String(p.id).trim() === id)?.name ?? id;

    const duplasList: { id1: string; id2: string; passes: number; name1: string; name2: string }[] = [];
    Object.keys(relationships).forEach(id1 => {
      Object.keys(relationships[id1]).forEach(id2 => {
        duplasList.push({
          id1,
          id2,
          passes: relationships[id1][id2].passes,
          name1: getPlayerName(id1),
          name2: getPlayerName(id2),
        });
      });
    });
    duplasList.sort((a, b) => b.passes - a.passes);
    const duplasTop = duplasList.slice(0, 10);

    const playerTotals: Record<string, { given: number; received: number }> = {};
    e1t.forEach(event => {
      if (event.type !== 'pass' || !event.playerId) return;
      const fromId = String(event.playerId).trim();
      const toId = event.passToPlayerId ? String(event.passToPlayerId).trim() : null;
      if (!playerTotals[fromId]) playerTotals[fromId] = { given: 0, received: 0 };
      playerTotals[fromId].given += 1;
      if (toId) {
        if (!playerTotals[toId]) playerTotals[toId] = { given: 0, received: 0 };
        playerTotals[toId].received += 1;
      }
    });
    const playersList = Object.entries(playerTotals).map(([playerId, v]) => ({
      playerId,
      name: getPlayerName(playerId),
      totalPasses: v.given + v.received,
      given: v.given,
      received: v.received,
    }));
    playersList.sort((a, b) => b.totalPasses - a.totalPasses);
    const playersTop = playersList.slice(0, 10);

    const mostCorrectPassesPlayer = (() => {
      const byPlayer: Record<string, number> = {};
      e1t.forEach(e => {
        if (e.type === 'pass' && e.result === 'correct' && e.playerId) {
          const id = String(e.playerId).trim();
          byPlayer[id] = (byPlayer[id] ?? 0) + 1;
        }
      });
      const entries = Object.entries(byPlayer).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) return null;
      return { playerId: entries[0][0], name: getPlayerName(entries[0][0]), count: entries[0][1] };
    })();

    return { passesCorrect, passesWrong, duplasTop, playersTop, mostCorrectPassesPlayer };
  }, [matchEvents, players]);

  if (!isOpen) return null;

  const canEndTime = matchTime >= 20 * 60;

  const isRealtimePage = window.location.pathname === '/scout-realtime';
  const useFullViewport = isRealtimePage || takeFullWidth;
  return (
    <div className={`fixed z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in overflow-hidden p-0 ${
      useFullViewport ? 'inset-0' : 'left-[16rem] top-0 right-0 bottom-0'
    }`}>
      <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
        
        {/* Header com fechar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            Scout da Partida
          </h2>
          <button
            onClick={onClose}
            className="bg-zinc-900 hover:bg-zinc-800 text-white p-2 rounded-full transition-colors border border-zinc-700"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* DADOS DA PARTIDA - equipes, placar, faltas e encerrar */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-2">
          <p className="text-zinc-500 text-[10px] font-bold uppercase mb-2 text-center">DADOS DA PARTIDA</p>
          <div className="flex items-center justify-between gap-2">
            {/* Nome das Equipes */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="text-center">
                <p className="text-zinc-400 text-[10px] font-bold uppercase mb-0.5">Nossa Equipe</p>
                <p className="text-[#00f0ff] text-sm font-black truncate max-w-[120px]">{teamName}</p>
              </div>
              <div className="text-zinc-600 text-sm font-black">vs</div>
              <div className="text-center">
                <p className="text-zinc-400 text-[10px] font-bold uppercase mb-0.5">Adversário</p>
                <p className="text-red-400 text-sm font-black truncate max-w-[120px]">{match.opponent}</p>
              </div>
            </div>

            {/* Placar (Apenas Exibição) */}
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-zinc-400 text-[10px] font-bold uppercase">Placar</p>
              <div className="flex items-center gap-2">
                <p className="text-[#00f0ff] text-lg font-black font-mono">{goalsFor}</p>
                <span className="text-zinc-600 text-lg font-black">x</span>
                <p className="text-red-400 text-lg font-black font-mono">{goalsAgainst}</p>
              </div>
            </div>

            {/* Contador de Faltas (Nosso e Adv), Botão Logs e Botão Encerrar */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                {/* Faltas Nosso */}
                <div className={`rounded-lg px-2 py-1 border-2 transition-all ${
                  foulsForCount >= 5
                    ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                    : foulsForCount >= 4
                    ? 'bg-orange-500/20 border-orange-300'
                    : foulsForCount >= 3
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-orange-500/10 border-orange-500'
                }`}>
                  <p className={`text-[9px] font-bold uppercase mb-0.5 ${
                    foulsForCount >= 5 ? 'text-red-400' : foulsForCount >= 4 ? 'text-orange-300' : foulsForCount >= 3 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>Faltas Nosso</p>
                  <p className={`text-base font-black text-center ${
                    foulsForCount >= 5 ? 'text-red-400' : foulsForCount >= 4 ? 'text-orange-300' : foulsForCount >= 3 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>{Math.min(foulsForCount, 5)}</p>
                  {foulsForCount >= 5 && (
                    <p className="text-red-400 text-[8px] font-bold uppercase mt-0.5">Tiro Livre</p>
                  )}
                </div>
                {/* Faltas Adv */}
                <div className={`rounded-lg px-2 py-1 border-2 transition-all ${
                  foulsAgainstCount >= 5
                    ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                    : foulsAgainstCount >= 4
                    ? 'bg-orange-500/20 border-orange-300'
                    : foulsAgainstCount >= 3
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-orange-500/10 border-orange-500'
                }`}>
                  <p className={`text-[9px] font-bold uppercase mb-0.5 ${
                    foulsAgainstCount >= 5 ? 'text-red-400' : foulsAgainstCount >= 4 ? 'text-orange-300' : foulsAgainstCount >= 3 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>Faltas Adv</p>
                  <p className={`text-base font-black text-center ${
                    foulsAgainstCount >= 5 ? 'text-red-400' : foulsAgainstCount >= 4 ? 'text-orange-300' : foulsAgainstCount >= 3 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>{Math.min(foulsAgainstCount, 5)}</p>
                  {foulsAgainstCount >= 5 && (
                    <p className="text-red-400 text-[8px] font-bold uppercase mt-0.5">Tiro Livre</p>
                  )}
                </div>
                {/* Botão Logs */}
                <button
                  type="button"
                  onClick={() => setShowLogsView(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#00f0ff]/50 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-[10px] font-bold uppercase transition-colors"
                >
                  <List size={14} /> Logs
                </button>
              </div>
              
              {/* Botão Encerrar Coleta */}
              <button
                onClick={handleEndCollection}
                disabled={isPostmatch ? matchEvents.length < 1 : !isMatchEnded}
                className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                  (isPostmatch && matchEvents.length >= 1) || isMatchEnded
                    ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500 text-red-400 cursor-pointer'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
                }`}
              >
                Encerrar Coleta
              </button>
            </div>
          </div>
          {/* Tempo com posse e porcentagem (apenas tempo real com cronômetro) */}
          {!isPostmatch && (
            <div className="mt-2 pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase">Com posse:</span>
                <span className="text-green-400 font-mono font-bold">{formatTime(possessionSecondsWith)}</span>
                <span className="text-zinc-400">
                  ({possessionSecondsWith + possessionSecondsWithout > 0
                    ? ((possessionSecondsWith / (possessionSecondsWith + possessionSecondsWithout)) * 100).toFixed(1)
                    : '0'}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase">Sem posse:</span>
                <span className="text-red-400 font-mono font-bold">{formatTime(possessionSecondsWithout)}</span>
                <span className="text-zinc-400">
                  ({possessionSecondsWith + possessionSecondsWithout > 0
                    ? ((possessionSecondsWithout / (possessionSecondsWith + possessionSecondsWithout)) * 100).toFixed(1)
                    : '0'}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {showLogsView ? (
          /* Tela de Logs do jogo */
          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-white font-bold uppercase text-lg">Logs do jogo</h2>
              <button
                type="button"
                onClick={() => { setShowLogsView(false); setEditingEventId(null); setEditDraft(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 text-sm font-bold uppercase transition-colors"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border-2 border-zinc-800 bg-zinc-950">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-900 border-b-2 border-zinc-700 z-10">
                  <tr>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Tempo</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Período</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Jogador</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Ação</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Subtipo / Resultado</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Receptor</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...matchEvents]
                    .sort((a, b) => (a.period !== b.period ? (a.period === '1T' ? -1 : 1) : a.time - b.time))
                    .map((event) => {
                      const isEditing = editingEventId === event.id;
                      const draft = isEditing ? editDraft : null;
                      const subtypeOpts = draft ? getSubtypeOptions(draft.type) : [];
                      return (
                        <tr key={event.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                          <td className="p-2">
                            {isEditing && draft ? (
                              <input
                                type="text"
                                value={editTimeInput}
                                onChange={(e) => setEditTimeInput(e.target.value)}
                                placeholder="MM:SS"
                                className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm font-mono"
                              />
                            ) : (
                              <span className="text-zinc-300 font-mono text-sm">{formatTime(event.time)}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing && draft ? (
                              <select
                                value={draft.period}
                                onChange={(e) => setEditDraft(prev => prev ? { ...prev, period: e.target.value as '1T' | '2T' } : null)}
                                className="px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm"
                              >
                                <option value="1T">1T</option>
                                <option value="2T">2T</option>
                              </select>
                            ) : (
                              <span className="text-zinc-300 text-sm">{event.period}</span>
                            )}
                          </td>
                          <td className="p-2">
                            <span className="text-white text-sm">{event.playerName ?? '—'}</span>
                          </td>
                          <td className="p-2">
                            {isEditing && draft ? (
                              <select
                                value={draft.type}
                                onChange={(e) => {
                                  const t = e.target.value as MatchEvent['type'];
                                  setEditDraft(prev => prev ? { ...prev, type: t, result: undefined, cardType: undefined, foulTeam: t === 'foul' ? 'for' : undefined } : null);
                                }}
                                className="px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm min-w-[120px]"
                              >
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[#00f0ff] text-sm">{event.tipo}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing && draft ? (
                              draft.type === 'foul' ? (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditDraft(prev => prev ? { ...prev, foulTeam: 'for', result: undefined } : null)}
                                    className={`px-2 py-1 rounded text-xs font-bold ${draft.foulTeam === 'for' ? 'bg-[#00f0ff]/30 border border-[#00f0ff] text-[#00f0ff]' : 'bg-zinc-800 border border-zinc-600 text-zinc-400 hover:border-[#00f0ff]/50'}`}
                                  >
                                    Nosso
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditDraft(prev => prev ? { ...prev, foulTeam: 'against', result: undefined } : null)}
                                    className={`px-2 py-1 rounded text-xs font-bold ${draft.foulTeam === 'against' ? 'bg-red-500/30 border border-red-500 text-red-400' : 'bg-zinc-800 border border-zinc-600 text-zinc-400 hover:border-red-500/50'}`}
                                  >
                                    Adv
                                  </button>
                                </div>
                              ) : subtypeOpts.length > 0 ? (
                                <select
                                  value={draft.type === 'card'
                                    ? (draft.cardType ?? '')
                                    : (draft.result ?? '')}
                                  onChange={(e) => {
                                    const opt = subtypeOpts.find(o =>
                                      (draft.type === 'card' ? o.cardType === e.target.value : o.result === e.target.value)
                                    );
                                    if (!opt) return;
                                    setEditDraft(prev => prev ? {
                                      ...prev,
                                      result: opt.result,
                                      cardType: opt.cardType,
                                    } : null);
                                  }}
                                  className="px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm min-w-[140px]"
                                >
                                  {subtypeOpts.map((opt) => (
                                    <option key={opt.value} value={(draft.type === 'card' ? opt.cardType : opt.result) ?? ''}>
                                      {opt.value}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-zinc-500 text-sm">—</span>
                              )
                            ) : (
                              <span className="text-zinc-400 text-sm">{event.subtipo || '—'}</span>
                            )}
                          </td>
                          <td className="p-2">
                            <span className="text-zinc-400 text-sm">{event.type === 'pass' ? (event.passToPlayerName ?? '—') : '—'}</span>
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sec = parseManualTimeToSeconds(editTimeInput);
                                    if (sec === null || !editDraft) return;
                                    const tipo = editDraft.type === 'foul' ? 'Falta' : getTipoSubtipo(editDraft.type, editDraft.result, editDraft.cardType).tipo;
                                    const subtipo = editDraft.type === 'foul' ? (editDraft.foulTeam === 'against' ? 'Adversário' : 'Nosso') : getTipoSubtipo(editDraft.type, editDraft.result, editDraft.cardType).subtipo;
                                    const updatedEvents = matchEvents.map(e => e.id === editingEventId ? {
                                      ...e,
                                      time: sec,
                                      period: editDraft.period,
                                      type: editDraft.type,
                                      result: editDraft.result,
                                      cardType: editDraft.cardType,
                                      foulTeam: editDraft.foulTeam,
                                      tipo,
                                      subtipo,
                                      isOpponentGoal: editDraft.type === 'goal' && editDraft.result === 'contra',
                                    } : e);
                                    setMatchEvents(updatedEvents);
                                    recalcGoalsAndFoulsFromEvents(updatedEvents);
                                    setEditingEventId(null);
                                    setEditDraft(null);
                                  }}
                                  className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingEventId(null); setEditDraft(null); }}
                                  className="px-2 py-1 rounded bg-zinc-600 hover:bg-zinc-500 text-white text-xs font-bold"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEventId(event.id);
                                  setEditDraft({
                                    time: event.time,
                                    period: event.period,
                                    type: event.type,
                                    result: event.result,
                                    cardType: event.cardType,
                                    foulTeam: event.type === 'foul' ? (event.foulTeam ?? 'for') : undefined,
                                  });
                                  setEditTimeInput(formatTime(event.time));
                                }}
                                className="px-2 py-1 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/30 text-xs font-bold"
                              >
                                Editar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {matchEvents.length === 0 && (
                <p className="p-6 text-zinc-500 text-center text-sm">Nenhum evento registrado.</p>
              )}
            </div>
          </div>
        ) : (
        <>
        {/* Corpo Principal - Painéis Esquerdo e Direito */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Painel Esquerdo - Seleção de Jogador */}
          <div className={`w-56 rounded-2xl p-3 flex flex-col border-2 shrink-0 ${
            goalStep === 'author' && !pendingGoalIsOpponent
              ? 'bg-green-500/10 border-green-500'
              : 'bg-black border-zinc-800'
          }`}>
            <h3 className="text-white font-bold uppercase text-sm mb-4 text-center">
              {goalStep === 'author' && !pendingGoalIsOpponent ? 'SELECIONAR AUTOR DO GOL' : 'SELECIONAR JOGADOR'}
            </h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto">
              {!isMatchStarted ? (
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-3 text-center">
                  <p className="text-yellow-400 text-xs font-bold">Complete a escalação para iniciar</p>
                </div>
              ) : showSubstitutions ? (
                // Modo Substituição: lista única com banco primeiro, depois quadra
                <>
                  <p className="text-zinc-400 text-xs font-bold uppercase mb-3 text-center">
                    {selectedPlayerId ? 'Selecione jogador do banco para entrar' : 'Clique no jogador em quadra para sair'}
                  </p>
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {/* Jogadores do banco (primeiro) - ordenados por frequência */}
                    {sortedBenchPlayers.map((playerId) => {
                      const player = players.find(p => String(p.id).trim() === playerId);
                      if (!player) return null;
                      const frequency = loadSubstitutionFrequency();
                      const subCount = frequency[playerId] || 0;
                      return (
                        <button
                          key={playerId}
                          onClick={() => {
                            if (selectedPlayerId && lineupPlayers.includes(selectedPlayerId)) {
                              // Fazer substituição
                              const playerOutId = selectedPlayerId;
                              const playerInId = playerId;
                              
                              // Verificar se goleiro está saindo
                              const isGoalkeeperOut = playerOutId === currentGoalkeeperId;
                              
                              // Registrar substituição no histórico
                              const substitution = {
                                playerOutId,
                                playerInId,
                                time: (getTimeForEvent() ?? matchTime),
                                period: currentPeriod,
                              };
                              setSubstitutionHistory(prev => [...prev, substitution]);
                              
                              // Atualizar contadores
                              setSubstitutionCounts(prev => ({
                                ...prev,
                                [playerOutId]: (prev[playerOutId] || 0) + 1,
                                [playerInId]: (prev[playerInId] || 0) + 1,
                              }));
                              
                              // Atualizar escalação
                              setLineupPlayers(prev => prev.map(id => id === playerOutId ? playerInId : id));
                              setBenchPlayers(prev => {
                                const newBench = [...prev.filter(id => id !== playerInId), playerOutId];
                                return newBench;
                              });
                              
                              // Se goleiro saiu, o jogador que entrou vira goleiro linha
                              if (isGoalkeeperOut) {
                                setCurrentGoalkeeperId(playerInId);
                              }
                              
                              // Limpar seleção e sair do modo substituição
                              setSelectedPlayerId(null);
                              setShowSubstitutions(false);
                            } else {
                              alert('Selecione primeiro um jogador em quadra para sair.');
                            }
                          }}
                          className={`w-full rounded-xl p-3 text-left transition-all ${
                            selectedPlayerId && lineupPlayers.includes(selectedPlayerId)
                              ? 'bg-green-500/20 border-2 border-green-500 hover:border-green-400'
                              : 'bg-green-500/10 border-2 border-green-500/50 hover:border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-white font-bold text-sm">
                              {player.name} - {player.jerseyNumber}
                              {selectedPlayerId && lineupPlayers.includes(selectedPlayerId) && ' (ENTRANDO)'}
                            </p>
                            {subCount > 0 && (
                              <span className="text-green-400 text-[10px] font-bold bg-green-500/20 px-2 py-0.5 rounded">
                                {subCount}x
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-500 text-[10px] mt-1">BANCO</p>
                        </button>
                      );
                    })}
                    
                    {/* Separador visual */}
                    {benchPlayers.length > 0 && lineupPlayers.length > 0 && (
                      <div className="border-t border-zinc-800 my-3">
                        <p className="text-zinc-600 text-xs font-bold uppercase text-center py-2">EM QUADRA</p>
                      </div>
                    )}
                    
                    {/* Jogadores em quadra (depois) */}
                    {lineupPlayers.map((playerId) => {
                      const player = players.find(p => String(p.id).trim() === playerId);
                      if (!player) return null;
                      const isGoalkeeper = playerId === currentGoalkeeperId;
                      return (
                        <button
                          key={playerId}
                          onClick={() => {
                            // Selecionar jogador para sair
                            setSelectedPlayerId(playerId);
                          }}
                          className={`w-full rounded-xl p-3 text-left transition-all ${
                            selectedPlayerId === playerId
                              ? 'bg-red-500/20 border-4 border-red-500'
                              : 'bg-zinc-900 border-2 border-zinc-700 hover:border-red-500'
                          }`}
                        >
                          <p className="text-white font-bold text-sm">
                            {isGoalkeeper && '🥅 '}{player.name} - {player.jerseyNumber}
                            {selectedPlayerId === playerId && ' (SAINDO)'}
                          </p>
                          <p className="text-zinc-500 text-[10px] mt-1">QUADRA</p>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setShowSubstitutions(false);
                      setSelectedPlayerId(null);
                    }}
                    className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold uppercase text-xs rounded-xl p-3 transition-colors"
                  >
                    Cancelar Substituição
                  </button>
                </>
              ) : showExpulsionReplacementSelection && expulsionState ? (
                <>
                  <p className="text-zinc-400 text-xs font-bold uppercase mb-3 text-center">
                    Quem entra no lugar do expulso?
                  </p>
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {sortedBenchPlayers.map((playerId) => {
                      const player = players.find(p => String(p.id).trim() === playerId);
                      if (!player) return null;
                      return (
                        <button
                          key={playerId}
                          onClick={() => handleReplaceExpulsionSlot(playerId)}
                          className="w-full rounded-xl p-3 text-left bg-green-500/20 border-2 border-green-500 hover:border-green-400 transition-all"
                        >
                          <p className="text-white font-bold text-sm">{player.name} - {player.jerseyNumber}</p>
                          <p className="text-zinc-500 text-[10px] mt-1">BANCO (ENTRANDO)</p>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowExpulsionReplacementSelection(false)}
                    className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold uppercase text-xs rounded-xl p-3 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : expulsionState ? (
                <>
                  {activePlayers.map((player) => {
                    const isSelected = selectedPlayerId === String(player.id).trim();
                    const isGoalkeeper = String(player.id).trim() === currentGoalkeeperId;
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          if (!isMatchStarted) return;
                          const clickedPlayerId = String(player.id).trim();
                          if (goalStep === 'author' && !pendingGoalIsOpponent) {
                            handleRegisterGoal('normal', false, clickedPlayerId);
                            setSelectedAction(null);
                            return;
                          }
                          if (pendingPassEventId && pendingPassSenderId && clickedPlayerId !== pendingPassSenderId) {
                            handleConfirmPassReceiver(clickedPlayerId);
                          } else {
                            setSelectedPlayerId(clickedPlayerId);
                            if (pendingPassEventId) {
                              setMatchEvents(prev => prev.filter(e => e.id !== pendingPassEventId));
                              setPendingPassEventId(null);
                              setPendingPassSenderId(null);
                              setPendingPassResult(null);
                              setSelectedAction(null);
                            }
                          }
                        }}
                        disabled={!isMatchStarted}
                        className={`w-full rounded-xl p-3 text-left transition-all ${
                          !isMatchStarted
                            ? 'bg-zinc-800 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed'
                            : goalStep === 'author' && !pendingGoalIsOpponent
                            ? 'bg-green-500/20 border-2 border-green-500 hover:border-green-400'
                            : isSelected
                            ? 'bg-[#00f0ff]/20 border-4 border-[#00f0ff]'
                            : pendingPassEventId && String(player.id).trim() !== pendingPassSenderId
                            ? 'bg-yellow-500/20 border-2 border-yellow-500 hover:border-yellow-400'
                            : 'bg-green-500/10 border-2 border-green-500 hover:border-green-400'
                        }`}
                      >
                        <p className="text-white font-bold text-sm">
                          {isGoalkeeper && '🥅 '}{player.name} - {player.jerseyNumber}
                          {goalStep === 'author' && !pendingGoalIsOpponent && ' (autor do gol)'}
                          {goalStep !== 'author' && pendingPassEventId && String(player.id).trim() !== pendingPassSenderId && ' (receber passe)'}
                        </p>
                      </button>
                    );
                  })}
                  <div className="rounded-xl p-3 border-2 border-red-500 bg-red-500/10 text-left">
                    <p className="text-red-400 font-bold text-sm">
                      🟥 Expulso: {players.find(p => String(p.id).trim() === expulsionState.expelledPlayerId)?.name ?? 'Jogador'}
                    </p>
                    {canReplaceAfterExpulsion ? (
                      <button
                        onClick={() => setShowExpulsionReplacementSelection(true)}
                        className="mt-2 w-full py-2 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        Substituir – escolher jogador
                      </button>
                    ) : (
                      <p className="text-zinc-400 text-xs mt-2">
                        {expulsionCountdownSeconds !== null && currentPeriod === expulsionState.period
                          ? `Pode substituir em 0:${String(expulsionCountdownSeconds).padStart(2, '0')}`
                          : 'Aguarde 1 min ou gol adversário'}
                      </p>
                    )}
                  </div>
                </>
              ) : activePlayers && activePlayers.length > 0 ? (
                activePlayers.map((player) => {
                  const isSelected = selectedPlayerId === String(player.id).trim();
                  const isGoalkeeper = String(player.id).trim() === currentGoalkeeperId;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (!isMatchStarted) return;
                        const clickedPlayerId = String(player.id).trim();

                        // Se aguardando autor do gol nosso, registrar gol imediatamente ao clicar no jogador
                        if (goalStep === 'author' && !pendingGoalIsOpponent) {
                          handleRegisterGoal('normal', false, clickedPlayerId);
                          setSelectedAction(null);
                          return;
                        }

                        // Se há passe pendente, completar o passe
                        if (pendingPassEventId && pendingPassSenderId && clickedPlayerId !== pendingPassSenderId) {
                          handleConfirmPassReceiver(clickedPlayerId);
                        } else {
                          // Seleção normal de jogador
                          setSelectedPlayerId(clickedPlayerId);
                          // Se havia passe pendente e clicou no mesmo jogador ou cancelou, limpar
                          if (pendingPassEventId) {
                            setMatchEvents(prev => prev.filter(e => e.id !== pendingPassEventId));
                            setPendingPassEventId(null);
                            setPendingPassSenderId(null);
                            setPendingPassResult(null);
                            setSelectedAction(null);
                          }
                        }
                      }}
                      disabled={!isMatchStarted}
                      className={`w-full rounded-xl p-3 text-left transition-all ${
                        !isMatchStarted
                          ? 'bg-zinc-800 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed'
                          : goalStep === 'author' && !pendingGoalIsOpponent
                          ? 'bg-green-500/20 border-2 border-green-500 hover:border-green-400'
                          : isSelected
                          ? 'bg-[#00f0ff]/20 border-4 border-[#00f0ff]'
                          : pendingPassEventId && String(player.id).trim() !== pendingPassSenderId
                          ? 'bg-yellow-500/20 border-2 border-yellow-500 hover:border-yellow-400'
                          : 'bg-green-500/10 border-2 border-green-500 hover:border-green-400'
                      }`}
                    >
                      <p className="text-white font-bold text-sm">
                        {isGoalkeeper && '🥅 '}{player.name} - {player.jerseyNumber}
                        {goalStep === 'author' && !pendingGoalIsOpponent && ' (autor do gol)'}
                        {goalStep !== 'author' && pendingPassEventId && String(player.id).trim() !== pendingPassSenderId && ' (receber passe)'}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="bg-green-500/10 border-2 border-green-500 rounded-xl p-3 text-center">
                  <p className="text-zinc-500 text-xs">Nenhum jogador ativo</p>
                </div>
              )}
            </div>

            {/* Botão Substituições */}
            <button
              onClick={() => {
                if (!isRunning) {
                  setShowSubstitutions(true);
                } else {
                  alert('Pare o cronômetro para fazer substituições.');
                }
              }}
              disabled={isRunning}
              className={`mt-4 w-full rounded-xl p-3 font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-zinc-800 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed'
                  : 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
              }`}
            >
              <ArrowRightLeft size={16} />
              SUBSTITUIÇÕES
            </button>
          </div>

          {/* Painel Direito - Ações/Eventos */}
          <div className="flex-1 bg-black border-2 border-blue-500 rounded-3xl p-4 flex flex-col min-h-0">
            {/* Mensagem se jogador não selecionado */}
            {!selectedPlayerId && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                <p className="text-yellow-400 text-xs font-bold text-center">
                  Selecione um jogador no painel esquerdo para registrar ações
                </p>
              </div>
            )}

            {/* Área Principal de Ações */}
            <div className="flex-1 border-2 border-zinc-800 rounded-xl p-4 flex flex-col min-h-0">
              {/* Parte superior (~20%): zona reservada para opções de Passe/Chute/Falta/Cartão */}
              <div className="flex-[2] min-h-0 overflow-auto flex-shrink-0">
              {/* Opções para Passe - ACIMA dos botões */}
              {selectedAction === 'pass' && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-2 font-bold uppercase">Resultado do Passe</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRegisterPass('correct')}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Certo
                    </button>
                    <button
                      onClick={() => handleRegisterPass('wrong')}
                      className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Errado
                    </button>
                  </div>
                </div>
              )}

              {/* Opções para Chute - ACIMA dos botões */}
              {selectedAction === 'shot' && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-2 font-bold uppercase">Resultado do Chute</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRegisterShot('inside')}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Dentro
                    </button>
                    <button
                      onClick={() => handleRegisterShot('outside')}
                      className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Fora
                    </button>
                    <button
                      onClick={() => handleRegisterShot('post')}
                      className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
                    >
                      Trave
                    </button>
                    <button
                      onClick={() => handleRegisterShot('blocked')}
                      className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors"
                    >
                      Bloqueado
                    </button>
                  </div>
                </div>
              )}

              {/* Opções para Falta: Nosso ou Adversário */}
              {selectedAction === 'foul' && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-2 font-bold uppercase">Quem cometeu a falta?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRegisterFoul('for')}
                      disabled={foulsForCount >= 5}
                      className={`px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors ${
                        foulsForCount >= 5
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                          : 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/30'
                      }`}
                    >
                      Nosso
                      {foulsForCount >= 5 && <span className="block text-[9px] mt-1">Tiro Livre</span>}
                    </button>
                    <button
                      onClick={() => handleRegisterFoul('against')}
                      disabled={foulsAgainstCount >= 5}
                      className={`px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors ${
                        foulsAgainstCount >= 5
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                          : 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      Adversário
                      {foulsAgainstCount >= 5 && <span className="block text-[9px] mt-1">Tiro Livre</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* Opções para Lateral/Escanteio - 2 botões compostos (Ataque Esq|Dir, Defesa Esq|Dir) */}
              {(selectedAction === 'lateral' || selectedAction === 'corner') && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-2 font-bold uppercase">
                    {selectedAction === 'lateral' ? 'Tipo de Lateral' : 'Tipo de Escanteio'}
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex rounded-lg overflow-hidden border-2 border-green-500">
                      <button
                        onClick={() => {
                          const zone: LateralResult = 'ataqueEsquerda';
                          if (selectedAction === 'lateral') handleRegisterLateral(zone);
                          else handleRegisterCorner(zone);
                        }}
                        className="flex-1 px-2 py-3 bg-green-500/20 text-green-400 font-bold uppercase text-[10px] hover:bg-green-500/30 transition-colors border-r border-green-500/50"
                      >
                        Esq
                      </button>
                      <button
                        onClick={() => {
                          const zone: LateralResult = 'ataqueDireita';
                          if (selectedAction === 'lateral') handleRegisterLateral(zone);
                          else handleRegisterCorner(zone);
                        }}
                        className="flex-1 px-2 py-3 bg-green-500/20 text-green-400 font-bold uppercase text-[10px] hover:bg-green-500/30 transition-colors"
                      >
                        Dir
                      </button>
                    </div>
                    <div className="flex-1 flex rounded-lg overflow-hidden border-2 border-zinc-500">
                      <button
                        onClick={() => {
                          const zone: LateralResult = 'defesaEsquerda';
                          if (selectedAction === 'lateral') handleRegisterLateral(zone);
                          else handleRegisterCorner(zone);
                        }}
                        className="flex-1 px-2 py-3 bg-zinc-500/20 text-zinc-400 font-bold uppercase text-[10px] hover:bg-zinc-500/30 transition-colors border-r border-zinc-500/50"
                      >
                        Esq
                      </button>
                      <button
                        onClick={() => {
                          const zone: LateralResult = 'defesaDireita';
                          if (selectedAction === 'lateral') handleRegisterLateral(zone);
                          else handleRegisterCorner(zone);
                        }}
                        className="flex-1 px-2 py-3 bg-zinc-500/20 text-zinc-400 font-bold uppercase text-[10px] hover:bg-zinc-500/30 transition-colors"
                      >
                        Dir
                      </button>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-[9px] mt-1 text-center">Ataque | Defesa</p>
                </div>
              )}

              {/* Opções para Cartão - inline (amarelo, 2º amarelo, vermelho) */}
              {selectedAction === 'card' && selectedPlayerId && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Tipo de Cartão</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleRegisterCard('yellow')}
                      className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
                    >
                      Amarelo
                    </button>
                    <button
                      onClick={() => handleRegisterCard('secondYellow')}
                      className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors"
                    >
                      2º Amarelo
                    </button>
                    <button
                      onClick={() => handleRegisterCard('red')}
                      className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Vermelho
                    </button>
                  </div>
                </div>
              )}

              {/* Opções para Desarme - parte superior */}
              {selectedAction === 'tackle' && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-2 font-bold uppercase">Tipo de Desarme</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRegisterTackle('withBall')}
                      className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Com Posse
                    </button>
                    <button
                      onClick={() => handleRegisterTackle('withoutBall')}
                      className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Sem Posse
                    </button>
                    <button
                      onClick={() => handleRegisterTackle('counter')}
                      className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Contra-ataque
                    </button>
                  </div>
                </div>
              )}

              {/* Opções para Defesa - parte superior */}
              {selectedAction === 'save' && selectedPlayerId && selectedPlayerId === currentGoalkeeperId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <button
                    onClick={handleRegisterSave}
                    className="w-full px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30 transition-colors"
                  >
                    Registrar Defesa
                  </button>
                </div>
              )}

              {/* Opções para Bloqueio - parte superior */}
              {selectedAction === 'block' && selectedPlayerId && (
                <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <button
                    onClick={handleRegisterBlock}
                    className="w-full px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    Registrar Bloqueio
                  </button>
                </div>
              )}

              {/* Fluxo inline do Gol (equipe → autor → confirmar) */}
              {goalStep === 'team' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setPendingGoalIsOpponent(false);
                        setGoalStep('author');
                      }}
                      className="flex-1 min-w-0 px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Gol Nosso
                    </button>
                    <button
                      onClick={() => {
                        setPendingGoalIsOpponent(true);
                        setPendingGoalType('normal');
                        setGoalStep('confirm');
                      }}
                      className="flex-1 min-w-0 px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Gol Adversário
                    </button>
                    <button
                      onClick={() => {
                        setGoalStep(null);
                        setPendingGoalTime(null);
                      }}
                      className="flex-1 min-w-0 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {goalStep === 'author' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPendingGoalPlayerId(null);
                        setPendingGoalType('contra');
                        setGoalStep('confirm');
                      }}
                      className="flex-1 min-w-0 px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Gol Contra
                    </button>
                    <button
                      onClick={() => {
                        setGoalStep('team');
                        setPendingGoalPlayerId(null);
                        setPendingGoalType(null);
                      }}
                      className="flex-1 min-w-0 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {goalStep === 'confirm' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleRegisterGoal(
                          pendingGoalType || 'normal',
                          pendingGoalIsOpponent,
                          pendingGoalPlayerId
                        )
                      }
                      className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs rounded-lg transition-colors whitespace-nowrap"
                    >
                      Confirmar Gol
                    </button>
                    <button
                      onClick={() => {
                        setGoalStep(null);
                        setPendingGoalType(null);
                        setPendingGoalIsOpponent(false);
                        setPendingGoalPlayerId(null);
                        setPendingGoalTime(null);
                      }}
                      className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Fluxo inline - Tiro Livre */}
              {freeKickStep === 'team' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Tiro Livre - Qual equipe?</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => {
                        setPendingFreeKickTeam('for');
                        setFreeKickStep('kicker');
                      }}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      A Favor (Nossa Equipe)
                    </button>
                    <button
                      onClick={() => {
                        setPendingFreeKickTeam('against');
                        setFreeKickStep('result');
                      }}
                      className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Contra (Adversário)
                    </button>
                  </div>
                  <button
                    onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Selecionar cobrador</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                    {activePlayers?.length ? activePlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => {
                          setPendingFreeKickKickerId(String(player.id).trim());
                          setFreeKickStep('result');
                        }}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-lg hover:border-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        #{player.jerseyNumber} {player.name}
                      </button>
                    )) : (
                      <p className="text-zinc-500 text-xs text-center py-2">Nenhum jogador ativo</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setFreeKickStep('team'); setPendingFreeKickKickerId(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              )}
              {freeKickStep === 'result' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Resultado do Tiro Livre</p>
                  {pendingFreeKickTeam === 'for' ? (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button onClick={() => handleRegisterFreeKick('for', pendingFreeKickKickerId, 'goal')} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30">Gol</button>
                      <button onClick={() => handleRegisterFreeKick('for', pendingFreeKickKickerId, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30">Defendido</button>
                      <button onClick={() => handleRegisterFreeKick('for', pendingFreeKickKickerId, 'outside')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30">Pra Fora</button>
                      <button onClick={() => handleRegisterFreeKick('for', pendingFreeKickKickerId, 'post')} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30">Trave</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <button onClick={() => handleRegisterFreeKick('against', null, 'goal')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30">Gol Adversário</button>
                      <button onClick={() => handleRegisterFreeKick('against', null, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30">Defesa</button>
                      <button onClick={() => handleRegisterFreeKick('against', null, 'noGoal')} className="px-4 py-3 bg-zinc-500/20 border-2 border-zinc-500 text-zinc-400 font-bold uppercase text-xs rounded-lg hover:bg-zinc-500/30">Não Gol</button>
                    </div>
                  )}
                  <button
                    onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); setPendingFreeKickKickerId(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Fluxo inline - Pênalti */}
              {penaltyStep === 'team' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Pênalti - Qual equipe?</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => {
                        setPendingPenaltyTeam('for');
                        setPenaltyStep('kicker');
                      }}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      A Favor (Nossa Equipe)
                    </button>
                    <button
                      onClick={() => {
                        setPendingPenaltyTeam('against');
                        setPenaltyStep('result');
                      }}
                      className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Contra (Adversário)
                    </button>
                  </div>
                  <button
                    onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {penaltyStep === 'kicker' && pendingPenaltyTeam === 'for' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Selecionar cobrador</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                    {activePlayers?.length ? activePlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => {
                          setPendingPenaltyKickerId(String(player.id).trim());
                          setPenaltyStep('result');
                        }}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-colors text-left"
                      >
                        #{player.jerseyNumber} {player.name}
                      </button>
                    )) : (
                      <p className="text-zinc-500 text-xs text-center py-2">Nenhum jogador ativo</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setPenaltyStep('team'); setPendingPenaltyKickerId(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              )}
              {penaltyStep === 'result' && (
                <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs mb-3 font-bold uppercase">Resultado do Pênalti</p>
                  {pendingPenaltyTeam === 'for' ? (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'goal')} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30">Gol</button>
                      <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30">Defendido</button>
                      <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'outside')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30">Pra Fora</button>
                      <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'post')} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30">Trave</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <button onClick={() => handleRegisterPenalty('against', null, 'goal')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30">Gol Adversário</button>
                      <button onClick={() => handleRegisterPenalty('against', null, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30">Defesa</button>
                      <button onClick={() => handleRegisterPenalty('against', null, 'noGoal')} className="px-4 py-3 bg-zinc-500/20 border-2 border-zinc-500 text-zinc-400 font-bold uppercase text-xs rounded-lg hover:bg-zinc-500/30">Não Gol</button>
                    </div>
                  )}
                  <button
                    onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); setPendingPenaltyKickerId(null); }}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              </div>
              {/* Fim da parte superior reservada */}

              {!isMatchStarted ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl">
                    <p className="text-yellow-400 text-sm font-bold uppercase mb-2">
                      Partida não iniciada
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Complete a escalação para habilitar os comandos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-[8] flex flex-col gap-2 min-h-0 flex-1">
                  {/* Setor da bola: AT ESQ | AT DIR e DF ESQ | DF DIR */}
                  <div className="flex gap-3 flex-1 min-h-0">
                    <div className="flex-1 flex rounded-lg overflow-hidden border-2 border-green-500 min-h-0">
                      <button
                        onClick={() => setBallSector('ataqueEsquerda')}
                        className={`flex-1 min-h-0 px-3 py-4 text-xs font-bold uppercase transition-colors border-r border-green-500/50 ${
                          ballSector === 'ataqueEsquerda' ? 'bg-green-500/30 text-green-400' : 'bg-green-500/10 text-green-400/80 hover:bg-green-500/20'
                        }`}
                      >
                        AT ESQ
                      </button>
                      <button
                        onClick={() => setBallSector('ataqueDireita')}
                        className={`flex-1 min-h-0 px-3 py-4 text-xs font-bold uppercase transition-colors ${
                          ballSector === 'ataqueDireita' ? 'bg-green-500/30 text-green-400' : 'bg-green-500/10 text-green-400/80 hover:bg-green-500/20'
                        }`}
                      >
                        AT DIR
                      </button>
                    </div>
                    <div className="flex-1 flex rounded-lg overflow-hidden border-2 border-zinc-500 min-h-0">
                      <button
                        onClick={() => setBallSector('defesaEsquerda')}
                        className={`flex-1 min-h-0 px-3 py-4 text-xs font-bold uppercase transition-colors border-r border-zinc-500/50 ${
                          ballSector === 'defesaEsquerda' ? 'bg-zinc-500/30 text-zinc-300' : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                        }`}
                      >
                        DF ESQ
                      </button>
                      <button
                        onClick={() => setBallSector('defesaDireita')}
                        className={`flex-1 min-h-0 px-3 py-4 text-xs font-bold uppercase transition-colors ${
                          ballSector === 'defesaDireita' ? 'bg-zinc-500/30 text-zinc-300' : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                        }`}
                      >
                        DF DIR
                      </button>
                    </div>
                  </div>

                  {/* Sem posse | GOL | Com posse - três botões iguais em uma linha */}
                  <div className="flex gap-3 flex-1 min-h-0">
                    <button
                      onClick={() => setBallPossessionNow('sem')}
                      disabled={isBlockedByPenalty}
                      className={`flex-1 min-h-0 px-4 py-4 rounded-xl border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          : ballPossessionNow === 'sem'
                          ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      Sem posse
                    </button>
                    <button
                      onClick={() => {
                        if (!isMatchStarted || isBlockedByPenalty) return;
                        const t = getTimeForEvent();
                        if (isPostmatch && t === null) {
                          alert('Informe o tempo antes de registrar o gol (ex.: 0100 para 01:00).');
                          return;
                        }
                        if (!isPostmatch) setIsRunning(false);
                        setPendingGoalTime(isPostmatch ? t! : matchTime);
                        setGoalStep('team');
                        setPendingGoalIsOpponent(false);
                        setPendingGoalType(null);
                        setPendingGoalPlayerId(null);
                      }}
                      disabled={!isMatchStarted || isBlockedByPenalty}
                      className={`flex-1 min-h-0 px-4 py-4 rounded-xl border-2 font-black uppercase text-base transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        isMatchStarted && !isBlockedByPenalty
                          ? 'bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-zinc-700'
                      }`}
                    >
                      <Goal size={22} />
                      GOL
                    </button>
                    <button
                      onClick={() => setBallPossessionNow('com')}
                      disabled={isBlockedByPenalty}
                      className={`flex-1 min-h-0 px-4 py-4 rounded-xl border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          : ballPossessionNow === 'com'
                          ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      Com posse
                    </button>
                  </div>

                  {/* Layout - FALTA/ESCANTEIO | TEMPO | PASSE/CHUTE - ocupa 80%, tamanhos similares, cronômetro maior */}
                  <div className="flex-[3] flex flex-col min-h-0 gap-3">
                    {/* Linha central: FALTA/ESCANTEIO | TEMPO (maior) | PASSE/CHUTE */}
                    <div className="flex-1 flex items-stretch justify-center gap-3 min-h-0">
                      {/* Esquerda - Vertical: FALTA, ESCANTEIO - tamanhos similares */}
                      <div className="flex flex-col gap-2 flex-1 min-w-0 min-h-0">
                        <button
                          onClick={() => {
                            if (!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                            if (isPostmatch && getTimeForEvent() === null) {
                              alert('Informe o tempo (ex.: 0100 para 01:00).');
                              return;
                            }
                            if (!isPostmatch && selectedAction !== 'foul') setIsRunning(false);
                            handleSelectAction('foul');
                          }}
                          disabled={!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                          className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                            !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : selectedAction === 'foul'
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                              : 'bg-zinc-900 border-orange-500/50 text-zinc-400 hover:border-orange-500'
                          }`}
                        >
                          FALTA
                        </button>
                        <button
                          onClick={() => {
                            if (!isMatchStarted) {
                              alert('A partida ainda não foi iniciada. Complete a escalação primeiro.');
                              return;
                            }
                            if (!isPostmatch && !isRunning) {
                              alert('O cronômetro está parado. Inicie o cronômetro para registrar ações.');
                              return;
                            }
                            if (isPostmatch && getTimeForEvent() === null) {
                              alert('Informe o tempo (ex.: 0100 para 01:00).');
                              return;
                            }
                            if (!selectedPlayerId) {
                              alert('Por favor, selecione um jogador primeiro.');
                              return;
                            }
                            if (ballSector) {
                              handleRegisterCorner(ballSector);
                            } else {
                              setSelectedAction(selectedAction === 'corner' ? null : 'corner');
                            }
                          }}
                          disabled={!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                          className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                            !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : selectedAction === 'corner'
                              ? 'bg-cyan-500/30 border-cyan-500 text-cyan-400'
                              : 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                          }`}
                        >
                          ESCANTEIO
                        </button>
                      </div>

                      {/* TEMPO - Centro: cronômetro (realtime) - MAIOR que os outros botões */}
                      <div className="flex flex-col items-center justify-center gap-1 flex-[2] min-w-0 min-h-0">
                        {isPostmatch ? (
                          <div className="w-full h-full min-h-[80px] py-4 px-4 rounded-xl border-2 border-zinc-600 bg-zinc-900/50 flex flex-col items-center justify-center gap-1">
                            <label className="text-zinc-400 text-[10px] font-bold uppercase">Tempo (MM:SS)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="ex. 0125"
                              value={formatDigitsToMMSS(manualTimeInput)}
                              onChange={(e) => setManualTimeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              className="w-full max-w-[100px] bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-white text-lg font-black font-mono text-center outline-none focus:border-[#00f0ff] tabular-nums"
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleToggleTimer}
                              className={`w-full h-full min-h-[80px] py-4 px-4 rounded-xl border-2 font-black font-mono text-3xl transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                                isRunning
                                  ? 'border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                            >
                              {isRunning ? <Pause size={28} /> : <Play size={28} />}
                              {formatTime(matchTime)}
                            </button>
                            {canEndTime && !isMatchEnded && (
                              <button
                                onClick={handleEndTime}
                                className="w-full px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 text-[10px] font-bold uppercase rounded-lg transition-colors"
                              >
                                Encerrar Tempo
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Direita - Vertical: COM posse = PASSE/CHUTE; SEM posse = DESARME/DEFESA - tamanhos similares */}
                      <div className="flex flex-col gap-2 flex-1 min-w-0 min-h-0">
                        {ballPossessionNow === 'com' ? (
                          <>
                            <button
                              onClick={() => handleSelectAction('pass')}
                              disabled={!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                                !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'pass'
                                  ? 'bg-black border-zinc-600 text-white'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              PASSE
                            </button>
                            <button
                              onClick={() => handleSelectAction('shot')}
                              disabled={!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                                !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'shot'
                                  ? 'bg-red-500/20 border-red-500 text-red-400'
                                  : 'bg-zinc-900 border-red-500/50 text-zinc-400 hover:border-red-500'
                              }`}
                            >
                              CHUTE
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectAction('tackle')}
                              disabled={!selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                                !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'tackle'
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                  : 'bg-zinc-900 border-blue-500/50 text-zinc-400 hover:border-blue-500'
                              }`}
                            >
                              DESARME
                            </button>
                            <button
                              onClick={() => handleSelectAction('save')}
                              disabled={!selectedPlayerId || selectedPlayerId !== currentGoalkeeperId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                                !selectedPlayerId || selectedPlayerId !== currentGoalkeeperId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'save'
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                  : 'bg-zinc-900 border-purple-500/50 text-zinc-400 hover:border-purple-500'
                              }`}
                            >
                              DEFESA
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Linha inferior: PÊNALTI, TIRO LIVRE, LATERAL, CARTÃO - tamanhos similares */}
                    <div className="grid grid-cols-4 gap-3 shrink-0 min-h-[56px]">
                      <button
                        onClick={() => {
                          if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                          if (isPostmatch && getTimeForEvent() === null) {
                            alert('Informe o tempo (ex.: 0100 para 01:00).');
                            return;
                          }
                          if (!isPostmatch) setIsRunning(false);
                          setPenaltyStep('team');
                          setPendingPenaltyTeam(null);
                          setPendingPenaltyKickerId(null);
                          setSelectedAction(null);
                        }}
                        disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          (!isPostmatch && !isRunning) || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : penaltyStep ? 'bg-purple-500/30 border-purple-500 text-purple-400'
                            : 'bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500/30'
                        }`}
                      >
                        PÊNALTI
                      </button>
                      <button
                        onClick={() => {
                          if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                          if (foulsForCount < 5 && foulsAgainstCount < 5) {
                            return; // Habilitado quando pelo menos um lado tem 5 faltas
                          }
                          if (isPostmatch && getTimeForEvent() === null) {
                            alert('Informe o tempo (ex.: 0100 para 01:00).');
                            return;
                          }
                          if (!isPostmatch) setIsRunning(false);
                          setFreeKickStep('team');
                          setPendingFreeKickTeam(null);
                          setPendingFreeKickKickerId(null);
                          setSelectedAction(null);
                        }}
                        disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty || (foulsForCount < 5 && foulsAgainstCount < 5)}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          (!isPostmatch && !isRunning) || isBlockedByPenalty || (foulsForCount < 5 && foulsAgainstCount < 5)
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : freeKickStep ? 'bg-red-500/30 border-red-500 text-red-400'
                            : 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        }`}
                      >
                        TIRO LIVRE
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) {
                            alert('A partida ainda não foi iniciada. Complete a escalação primeiro.');
                            return;
                          }
                          if (!selectedPlayerId) {
                            alert('Por favor, selecione um jogador primeiro.');
                            return;
                          }
                          if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                          if (isPostmatch && getTimeForEvent() === null) {
                            alert('Informe o tempo (ex.: 0100 para 01:00).');
                            return;
                          }
                          if (!isPostmatch && selectedAction !== 'lateral') setIsRunning(false);
                          if (ballSector) {
                            handleRegisterLateral(ballSector);
                          } else {
                            setSelectedAction(selectedAction === 'lateral' ? null : 'lateral');
                          }
                        }}
                        disabled={!isMatchStarted || !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || !selectedPlayerId || (!isPostmatch && !isRunning) || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : selectedAction === 'lateral'
                            ? 'bg-cyan-500/30 border-cyan-500 text-cyan-400'
                            : 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                        }`}
                      >
                        LATERAL
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) {
                            alert('A partida ainda não foi iniciada. Complete a escalação primeiro.');
                            return;
                          }
                          if (!selectedPlayerId) {
                            alert('Por favor, selecione um jogador primeiro.');
                            return;
                          }
                          if (isBlockedByPenalty) return;
                          setSelectedAction(selectedAction === 'card' ? null : 'card');
                        }}
                        disabled={!isMatchStarted || !selectedPlayerId || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || !selectedPlayerId || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : selectedAction === 'card'
                            ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400'
                            : 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
                        }`}
                      >
                        CARTÃO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}

        {/* Log dos últimos comandos - Parte inferior da tela - tamanho fixo */}
        <div className="h-[48px] min-h-[48px] max-h-[48px] bg-zinc-950 border-t border-zinc-800 px-3 py-2 flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 text-xs w-full h-full">
            <p className="text-zinc-500 font-bold uppercase shrink-0">Últimos comandos:</p>
            <div className="flex-1 flex gap-2 overflow-hidden min-w-0">
              {lastCommandDisplayLines.length > 0 ? (
                lastCommandDisplayLines.slice(-5).map((line) => (
                  <div
                    key={line.key}
                    className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded shrink-0 min-w-0 overflow-hidden"
                  >
                    <span className="text-zinc-400 font-mono shrink-0">{formatTime(line.time)}</span>
                    <span className="text-white font-bold truncate">{line.playerName}</span>
                    <span className="text-[#00f0ff] truncate">{line.actionText}</span>
                    {line.zone && <span className="text-zinc-500 shrink-0">{line.zone}</span>}
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-xs truncate">Nenhum comando registrado ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Escalação Inicial */}
        {showLineupModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                  <Users className="text-[#00f0ff]" size={24} />
                  Escalação Inicial
                </h3>
                <button
                  onClick={() => {
                    if (isMatchStarted) {
                      setShowLineupModal(false);
                    }
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  disabled={!isMatchStarted}
                >
                  <X size={20} className="text-zinc-500 hover:text-white" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <p className="text-zinc-400 text-sm mb-4">
                    Selecione 5 jogadores: 1 goleiro (slot abaixo) e 4 jogadores de linha. Durante o jogo, um jogador de
                    linha pode assumir a função de goleiro (goleiro linha).
                  </p>
                  
                  {/* Escalação (5 jogadores) */}
                  <div className="mb-6">
                    <h4 className="text-white font-bold uppercase text-sm mb-3">
                      Jogadores em Quadra ({lineupPlayers.length}/5)
                    </h4>
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const playerId = lineupPlayers[index];
                        const player = playerId ? players.find(p => String(p.id).trim() === playerId) : null;
                        return (
                          <div
                            key={index}
                            className={`border-2 rounded-xl p-3 min-h-[120px] flex flex-col items-center justify-center ${
                              player
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10'
                                : 'border-zinc-700 bg-zinc-950 border-dashed'
                            }`}
                          >
                            {player ? (
                              <>
                                <p className="text-[#00f0ff] text-xs font-bold mb-1">
                                  {index === 0 ? '🥅 GOLEIRO' : `Jogador ${index}`}
                                </p>
                                <p className="text-white font-bold text-sm text-center">
                                  #{player.jerseyNumber}
                                </p>
                                <p className="text-zinc-400 text-xs text-center truncate w-full">
                                  {player.name}
                                </p>
                                <button
                                  onClick={() => handleRemoveFromLineup(playerId)}
                                  className="mt-2 text-red-400 hover:text-red-300 text-xs"
                                >
                                  Remover
                                </button>
                              </>
                            ) : (
                              <p className="text-zinc-600 text-xs text-center">Vazio</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banco de Reservas */}
                  <div className="mb-6">
                    <h4 className="text-white font-bold uppercase text-sm mb-3">
                      Banco de Reservas ({benchPlayers.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {benchPlayers.map((playerId) => {
                        const player = players.find((p) => String(p.id).trim() === playerId);
                        if (!player) return null;
                        const hasGoalkeeperOnField = lineupPlayers.some((id) => {
                          const p = players.find((x) => String(x.id).trim() === id);
                          return p?.position === 'Goleiro';
                        });
                        const isGoalkeeper = player.position === 'Goleiro';
                        const isGoalkeeperDisabled = isGoalkeeper && hasGoalkeeperOnField;
                        const isDisabled = lineupPlayers.length >= 5 || isGoalkeeperDisabled;
                        const title = isGoalkeeperDisabled
                          ? 'Já há um goleiro em quadra. Apenas um goleiro pode estar em campo por vez.'
                          : undefined;
                        return (
                          <button
                            key={playerId}
                            onClick={() => handleAddToLineup(playerId)}
                            disabled={isDisabled}
                            title={title}
                            className={`p-3 rounded-lg border-2 text-left transition-colors ${
                              isDisabled
                                ? 'border-zinc-700 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                : 'border-zinc-800 bg-zinc-950 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10'
                            }`}
                          >
                            <p className="text-white font-bold text-xs">
                              #{player.jerseyNumber} {player.name}
                            </p>
                            <p className="text-zinc-500 text-[10px]">{player.position}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quem começou com a bola */}
                  <div className="mb-6">
                    <h4 className="text-white font-bold uppercase text-sm mb-3">
                      Quem começou com a bola?
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setBallPossessionStart('us')}
                        className={`px-6 py-4 rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          ballPossessionStart === 'us'
                            ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Nossa Equipe
                      </button>
                      <button
                        onClick={() => setBallPossessionStart('opponent')}
                        className={`px-6 py-4 rounded-xl border-2 font-bold uppercase text-sm transition-colors ${
                          ballPossessionStart === 'opponent'
                            ? 'bg-red-500/20 border-red-500 text-red-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        Adversário
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                {(() => {
                  const goalkeeperCount = lineupPlayers.filter((id) => {
                    const p = players.find((x) => String(x.id).trim() === id);
                    return p?.position === 'Goleiro';
                  }).length;
                  const lineupValid = lineupPlayers.length === 5 && goalkeeperCount <= 1 && ballPossessionStart;
                  return (
                    <button
                      onClick={handleConfirmLineup}
                      disabled={!lineupValid}
                      className={`px-6 py-3 rounded-xl font-black uppercase text-sm transition-colors ${
                        lineupValid ? 'bg-[#00f0ff] hover:bg-[#00d9e6] text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      Confirmar Escalação e Iniciar Partida
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Análise para Intervalo */}
        {showIntervalAnalysis && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                  <Clock className="text-yellow-500" size={24} />
                  Análise para Intervalo - 1º Tempo
                </h3>
                <button
                  onClick={() => setShowIntervalAnalysis(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-zinc-500 hover:text-white" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Placar */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Placar</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-center">
                        <p className="text-zinc-500 text-xs mb-1">Nossa Equipe</p>
                        <p className="text-[#00f0ff] text-3xl font-black">{goalsFor}</p>
                      </div>
                      <span className="text-zinc-600 text-2xl font-black">x</span>
                      <div className="flex-1 text-center">
                        <p className="text-zinc-500 text-xs mb-1">Adversário</p>
                        <p className="text-red-400 text-3xl font-black">{goalsAgainst}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas do 1º tempo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Chutes</p>
                      <p className="text-[#00f0ff] text-2xl font-black">{firstHalfStats.shots}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Escanteios</p>
                      <p className="text-amber-400 text-2xl font-black">{firstHalfStats.corners}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Defesas</p>
                      <p className="text-purple-400 text-2xl font-black">{firstHalfStats.saves}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Faltas</p>
                      <p className="text-orange-400 text-2xl font-black">{firstHalfStats.fouls}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Cartões</p>
                      <p className="text-yellow-400 text-2xl font-black">{firstHalfStats.cards}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Tempo</p>
                      <p className="text-red-400 text-2xl font-black font-mono">{formatTime(matchTime)}</p>
                    </div>
                  </div>

                  {/* Relação entre jogadores - Passes no 1º tempo */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase">Relação entre jogadores (passes no 1º tempo)</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-zinc-300">Passes certos: <strong className="text-green-400">{firstHalfPassData.passesCorrect}</strong></span>
                      <span className="text-zinc-300">Passes errados: <strong className="text-red-400">{firstHalfPassData.passesWrong}</strong></span>
                      {firstHalfPassData.mostCorrectPassesPlayer && (
                        <span className="text-zinc-300">Maior volume de passes certos: <strong className="text-[#00f0ff]">{firstHalfPassData.mostCorrectPassesPlayer.name}</strong> ({firstHalfPassData.mostCorrectPassesPlayer.count})</span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Duplas com mais troca de passes</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {firstHalfPassData.duplasTop.length === 0 ? (
                            <p className="text-zinc-600 text-xs">Nenhuma dupla com passes no 1º tempo</p>
                          ) : (
                            firstHalfPassData.duplasTop.map((d, i) => (
                              <div key={`${d.id1}-${d.id2}`} className="flex justify-between items-center py-1 px-2 bg-zinc-900 rounded text-xs">
                                <span className="text-white truncate">{d.name1} – {d.name2}</span>
                                <span className="text-[#00f0ff] font-bold shrink-0 ml-2">{d.passes}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Jogadores que mais trocaram passes</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {firstHalfPassData.playersTop.length === 0 ? (
                            <p className="text-zinc-600 text-xs">Nenhum passe no 1º tempo</p>
                          ) : (
                            firstHalfPassData.playersTop.map((p) => (
                              <div key={p.playerId} className="flex justify-between items-center py-1 px-2 bg-zinc-900 rounded text-xs">
                                <span className="text-white truncate">{p.name}</span>
                                <span className="text-[#00f0ff] font-bold shrink-0 ml-2">{p.totalPasses} <span className="text-zinc-500 font-normal">(dados: {p.given} / rec.: {p.received})</span></span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Últimos eventos */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-3">Últimos eventos</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {matchEvents
                        .filter(e => e.period === '1T')
                        .slice(-10)
                        .reverse()
                        .flatMap((event) => {
                          const zone = event.result && lateralToZoneLabel[event.result] ? lateralToZoneLabel[event.result] : undefined;
                          const isPassWithReceiver = event.type === 'pass' && event.passToPlayerId && event.passToPlayerName;
                          if (isPassWithReceiver) {
                            return [
                              <div
                                key={`${event.id}-passer`}
                                className="flex items-center gap-3 px-3 py-2 bg-zinc-900 rounded-lg text-xs"
                              >
                                <span className="text-zinc-400 font-mono min-w-[50px]">{formatTime(event.time)}</span>
                                <span className="text-white font-bold">{event.playerName || 'N/A'}</span>
                                <span className="text-[#00f0ff]">{event.tipo}</span>
                                {event.subtipo && (
                                  <>
                                    <span className="text-zinc-500">-</span>
                                    <span className="text-zinc-400">{event.subtipo}</span>
                                  </>
                                )}
                                {zone && <span className="text-zinc-500 ml-1">{zone}</span>}
                              </div>,
                              <div
                                key={`${event.id}-receiver`}
                                className="flex items-center gap-3 px-3 py-2 bg-zinc-900 rounded-lg text-xs"
                              >
                                <span className="text-zinc-400 font-mono min-w-[50px]">{formatTime(event.time)}</span>
                                <span className="text-white font-bold">{event.passToPlayerName || 'N/A'}</span>
                                <span className="text-[#00f0ff]">Recebeu passe</span>
                                {zone && <span className="text-zinc-500 ml-1">{zone}</span>}
                              </div>,
                            ];
                          }
                          return [
                            <div
                              key={event.id}
                              className="flex items-center gap-3 px-3 py-2 bg-zinc-900 rounded-lg text-xs"
                            >
                              <span className="text-zinc-400 font-mono min-w-[50px]">{formatTime(event.time)}</span>
                              <span className="text-white font-bold">{event.playerName || 'N/A'}</span>
                              <span className="text-[#00f0ff]">{event.tipo}</span>
                              {event.subtipo && (
                                <>
                                  <span className="text-zinc-500">-</span>
                                  <span className="text-zinc-400">{event.subtipo}</span>
                                </>
                              )}
                              {zone && <span className="text-zinc-500 ml-1">{zone}</span>}
                            </div>,
                          ];
                        })}
                      {matchEvents.filter(e => e.period === '1T').length === 0 && (
                        <p className="text-zinc-600 text-xs text-center py-4">Nenhum evento registrado</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowIntervalAnalysis(false)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-sm rounded-xl transition-colors"
                >
                  Continuar Análise
                </button>
                <button
                  onClick={handleStartSecondHalf}
                  className="px-6 py-3 bg-[#00f0ff] hover:bg-[#00d9e6] text-black font-black uppercase text-sm rounded-xl transition-colors"
                >
                  Iniciar 2º Tempo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

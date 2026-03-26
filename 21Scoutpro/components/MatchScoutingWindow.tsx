import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Play, Pause, Square, Users, ArrowRightLeft, Goal, AlertTriangle, Clock, List, ArrowLeft, Target, Zap, Shield, UserRound, CornerDownRight, MoveHorizontal, Flag, CircleDot, Circle, Hand, ShieldOff } from 'lucide-react';
import { MatchRecord, MatchStats, Player, Team, PostMatchEvent, PostMatchAction } from '../types';
import { MatchType } from './MatchTypeModal';
import { HALF_RELATIVE_MAX_SECONDS, absoluteSecondsToStored, canonicalizePostMatchEventClock, deriveHalfFromAbsoluteSeconds, storedToAbsoluteSeconds, type MatchHalf } from '../utils/matchPeriod';

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

/** Converte string "MM:SS" para segundos. */
function parseMMSSToSeconds(s: string): number {
  const trimmed = s.trim();
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const m = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(sec) && m >= 0 && sec >= 0 && sec <= 59) return m * 60 + sec;
  }
  const fromDigits = parseManualTimeToSeconds(trimmed);
  return fromDigits ?? 0;
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
  onSave?: (match: MatchRecord, options?: { source?: 'manual' | 'autosave' }) => void | Promise<void>;
  /** Usuário que está registrando as ações (para auditoria: quem fez/registrou cada ação) */
  recordedByUser?: { id?: string; name: string };
  /** Quando true, ocupa todo o viewport (ex.: sidebar foi escondida pelo app) */
  takeFullWidth?: boolean;
  /** Quando true, alinha à esquerda com sidebar retraída (64px); quando false, com sidebar expandida (256px) */
  sidebarRetracted?: boolean;
}

type LateralResult = 'defesaDireita' | 'defesaEsquerda' | 'ataqueDireita' | 'ataqueEsquerda';

/** Faixas de minuto para gráfico de períodos (scout coletivo). Tempo relativo à metade armazenada em `period` (0–20 min por metade). */
function getGoalPeriod(period: '1T' | '2T', timeSeconds: number): number {
  // period === '1T': buckets 1–4 (0–20 min relativos)
  if (period === '1T') {
    if (timeSeconds <= 5 * 60) return 1;
    if (timeSeconds <= 10 * 60) return 2;
    if (timeSeconds <= 15 * 60) return 3;
    return 4;
  }
  // period === '2T': buckets 5–8 (0–20 min relativos ao 2T)
  if (period === '2T') {
    if (timeSeconds <= 5 * 60) return 5;
    if (timeSeconds <= 10 * 60) return 6;
    if (timeSeconds <= 15 * 60) return 7;
    return 8;
  }
  return 1;
}

const GOAL_METHODS_OUR = [
  'Ataque', 'Contra Ataque', 'Defesa de goleiro linha', 'Ataque de Goleiro Linha', 'Escanteio', 'Laterais', 'Faltas', 'Tiro Livre', 'Pênalti', 'MARCAÇÃO ALTA',
];
const GOAL_METHODS_CONCEDED = [
  'Ataque', 'Contra Ataque', 'Defesa de goleiro linha', 'Ataque de Goleiro Linha', 'Escanteio', 'Laterais', 'Faltas', 'Tiro Livre', 'Pênalti', 'Perda de bola na primeira linha da defesa',
];

const BOLA_PARADA_METHODS = ['Escanteio', 'Laterais', 'Faltas', 'Tiro Livre', 'Pênalti'];

/** Métodos em que não há assistência (fluxo gol nosso). */
const GOAL_METHODS_NO_ASSIST: ReadonlyArray<string> = ['Pênalti', 'Tiro Livre'];

/** Ícone e cor de fundo viva por método de gol (futsal) */
const GOAL_METHOD_UI: Record<string, { icon: React.ReactNode; bg: string; border: string; hover: string; text: string }> = {
  'Ataque': { icon: <Target size={16} />, bg: 'bg-blue-500/20', border: 'border-blue-500/50', hover: 'hover:bg-blue-500', text: 'text-blue-400 hover:text-white' },
  'Contra Ataque': { icon: <Zap size={16} />, bg: 'bg-amber-500/20', border: 'border-amber-500/50', hover: 'hover:bg-amber-500', text: 'text-amber-400 hover:text-black' },
  'Defesa de goleiro linha': { icon: <Shield size={16} />, bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', hover: 'hover:bg-indigo-600', text: 'text-indigo-400 hover:text-white' },
  'Ataque de Goleiro Linha': { icon: <UserRound size={16} />, bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', hover: 'hover:bg-cyan-600', text: 'text-cyan-400 hover:text-black' },
  'Escanteio': { icon: <CornerDownRight size={16} />, bg: 'bg-orange-500/20', border: 'border-orange-500/50', hover: 'hover:bg-orange-600', text: 'text-orange-400 hover:text-white' },
  'Laterais': { icon: <MoveHorizontal size={16} />, bg: 'bg-lime-500/20', border: 'border-lime-500/50', hover: 'hover:bg-lime-600', text: 'text-lime-400 hover:text-black' },
  'Faltas': { icon: <Flag size={16} />, bg: 'bg-red-500/20', border: 'border-red-500/50', hover: 'hover:bg-red-600', text: 'text-red-400 hover:text-white' },
  'Tiro Livre': { icon: <CircleDot size={16} />, bg: 'bg-violet-500/20', border: 'border-violet-500/50', hover: 'hover:bg-violet-600', text: 'text-violet-400 hover:text-white' },
  'Pênalti': { icon: <Circle size={16} />, bg: 'bg-rose-500/20', border: 'border-rose-500/50', hover: 'hover:bg-rose-600', text: 'text-rose-400 hover:text-white' },
  'MARCAÇÃO ALTA': { icon: <Hand size={16} />, bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', hover: 'hover:bg-emerald-600', text: 'text-emerald-400 hover:text-white' },
  'Perda de bola na primeira linha da defesa': { icon: <ShieldOff size={16} />, bg: 'bg-red-600/20', border: 'border-red-600/50', hover: 'hover:bg-red-700', text: 'text-red-400 hover:text-white' },
  'Gol Contra': { icon: <ShieldOff size={16} />, bg: 'bg-amber-500/20', border: 'border-amber-500/50', hover: 'hover:bg-amber-500', text: 'text-amber-400 hover:text-black' },
};

// Jogador "fake" para o adversário — usado apenas para contabilizar gols sofridos e métodos de gols do adversário
const OPPONENT_FAKE_PLAYER_ID = 'OPPONENT_TEAM';
const OPPONENT_FAKE_PLAYER_NAME = 'Adversário';

interface MatchEvent {
  id: string;
  type: 'pass' | 'shot' | 'foul' | 'goal' | 'card' | 'tackle' | 'save' | 'block' | 'corner' | 'freeKick' | 'penalty' | 'lateral';
  playerId?: string;
  playerName?: string;
  time: number; // segundos
  period: '1T' | '2T'; // Período em que ocorreu
  result?: 'correct' | 'wrong' | 'inside' | 'outside' | 'post' | 'blocked' | 'normal' | 'contra' | 'withBall' | 'withoutBall' | 'counter' | 'goal' | 'saved' | 'noGoal' | 'simple' | 'hard' | LateralResult;
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
  /** Método do gol (ataque, contra-ataque, escanteio, etc.) */
  goalMethod?: string;
  /** ID do jogador que deu a assistência (só para gol nosso) */
  assistPlayerId?: string;
  /** Nome do jogador que deu a assistência */
  assistPlayerName?: string;
  /** Período do gol (1–10) para gráfico de períodos no scout coletivo */
  goalPeriod?: number;
  /** Passe errado que gerou transição (para gráfico Erros Críticos) */
  wrongPassGeneratedTransition?: boolean;
}

/** Converte PostMatchEvent[] (do banco/API) para MatchEvent[] (estado da janela de coleta). */
function postMatchEventLogToMatchEvents(log: PostMatchEvent[], players: Player[]): MatchEvent[] {
  const playerById = new Map(players.map(p => [String(p.id).trim(), p]));
  const zoneToResult: Record<string, LateralResult> = {
    'AT_ESQ': 'ataqueEsquerda',
    'AT_DIR': 'ataqueDireita',
    'DF_ESQ': 'defesaEsquerda',
    'DF_DIR': 'defesaDireita',
  };

  return log.map(pe => {
    const { time: timeSeconds, period: normalizedPeriod } = canonicalizePostMatchEventClock(pe.time, pe.period);
    let type: MatchEvent['type'];
    let result: MatchEvent['result'] | undefined;

    switch (pe.action) {
      case 'goal':
        type = 'goal';
        break;
      case 'passCorrect':
        type = 'pass';
        result = 'correct';
        break;
      case 'passWrong':
        type = 'pass';
        result = 'wrong';
        break;
      case 'passTransicao':
      case 'passProgressao':
        type = 'pass';
        result = 'correct';
        break;
      case 'shotOn':
        type = 'shot';
        result = 'inside';
        break;
      case 'shotOff':
        type = 'shot';
        result = 'outside';
        break;
      case 'shotZonaChute':
        type = 'shot';
        result = 'blocked';
        break;
      case 'falta':
        type = 'foul';
        break;
      case 'tackleWithBall':
        type = 'tackle';
        result = 'withBall';
        break;
      case 'tackleWithoutBall':
        type = 'tackle';
        result = 'withoutBall';
        break;
      case 'tackleCounter':
        type = 'tackle';
        result = 'counter';
        break;
      case 'save':
        type = 'save';
        break;
      case 'assist':
        type = 'goal';
        break;
      default:
        type = 'pass';
        result = 'correct';
    }

    const playerId = pe.playerId === OPPONENT_FAKE_PLAYER_ID ? OPPONENT_FAKE_PLAYER_ID : String(pe.playerId).trim();
    const playerName = pe.playerName ?? (playerId === OPPONENT_FAKE_PLAYER_ID ? OPPONENT_FAKE_PLAYER_NAME : playerById.get(playerId)?.name);

    const event: MatchEvent = {
      id: pe.id,
      type,
      playerId,
      playerName,
      time: timeSeconds,
      period: normalizedPeriod,
      tipo: pe.tipo,
      subtipo: pe.subtipo,
    };
    if (result !== undefined) event.result = result;
    if (pe.passToPlayerId) {
      event.passToPlayerId = String(pe.passToPlayerId).trim();
      event.passToPlayerName = pe.passToPlayerName ?? playerById.get(event.passToPlayerId)?.name;
    }
    if (pe.zone && zoneToResult[pe.zone]) event.result = zoneToResult[pe.zone];
    if (pe.goalMethod) event.goalMethod = pe.goalMethod;
    if (pe.isOpponentGoal === true || (pe.action === 'goal' && pe.subtipo === 'Contra')) {
      event.isOpponentGoal = true;
      event.result = 'contra';
    }
    if (pe.assistPlayerId) {
      event.assistPlayerId = String(pe.assistPlayerId).trim();
      event.assistPlayerName = pe.assistPlayerName ?? playerById.get(event.assistPlayerId)?.name;
    }
    if (pe.foulTeam) event.foulTeam = pe.foulTeam;
    if (pe.wrongPassGeneratedTransition !== undefined) event.wrongPassGeneratedTransition = pe.wrongPassGeneratedTransition;

    return event;
  });
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
  sidebarRetracted = false,
}) => {
  const isPostmatch = mode === 'postmatch';
  const [matchTime, setMatchTime] = useState<number>(0); // tempo em segundos
  const [manualMinute, setManualMinute] = useState<number>(0); // postmatch: minuto 0–20
  const [manualSecond, setManualSecond] = useState<number>(0); // postmatch: segundo 0–59
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
  const [goalConfirmEditingTime, setGoalConfirmEditingTime] = useState<boolean>(false); // Toggle editar tempo no popup confirmar
  const [goalStep, setGoalStep] = useState<'team' | 'author' | 'assist' | 'method' | 'confirm' | null>(null); // Fluxo inline do gol
  const [pendingGoalMethod, setPendingGoalMethod] = useState<string | null>(null); // Método do gol (para nosso ou tomado)
  const [pendingAssistPlayerId, setPendingAssistPlayerId] = useState<string | null>(null); // ID do assistente (null = sem assistência)
  
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
  
  // Estado de expulsão: time joga com um a menos até 2 min (cronometrados) ou gol adversário; então pode repor no slot
  const EXPULSION_WAIT_SECONDS = 120; // 2 minutos cronometrados
  const [expulsionState, setExpulsionState] = useState<{
    expelledPlayerId: string;
    expelledAtTime: number;
    period: '1T' | '2T';
  } | null>(null);
  const [showExpulsionReplacementSelection, setShowExpulsionReplacementSelection] = useState<boolean>(false);
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveInFlightRef = useRef<boolean>(false);
  const autosaveQueuedRef = useRef<boolean>(false);
  const autosaveSkipRef = useRef<boolean>(true);
  const lastAutosaveSignatureRef = useRef<string>('');
  
  // Estados para confirmação de falta com zona
  const [showFoulConfirmation, setShowFoulConfirmation] = useState<boolean>(false);
  const [pendingFoulZone, setPendingFoulZone] = useState<'ataque' | 'defesa' | null>(null);

  // Tela de logs (eventos em tabela editável)
  const [showLogsView, setShowLogsView] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ time: number; period: '1T' | '2T'; type: MatchEvent['type']; result?: MatchEvent['result']; cardType?: MatchEvent['cardType']; foulTeam?: 'for' | 'against'; playerId?: string | null; playerName?: string | null; assistPlayerId?: string | null; assistPlayerName?: string | null } | null>(null);
  const [editTimeInput, setEditTimeInput] = useState<string>('');
  
  // Estados para tiro livre e pênalti (fluxo inline)
  const [showFreeKickTeamSelection, setShowFreeKickTeamSelection] = useState<boolean>(false);
  const [showFreeKickKickerSelection, setShowFreeKickKickerSelection] = useState<boolean>(false);
  const [showFreeKickResult, setShowFreeKickResult] = useState<boolean>(false);
  const [pendingFreeKickTeam, setPendingFreeKickTeam] = useState<'for' | 'against' | null>(null);
  const [pendingFreeKickKickerId, setPendingFreeKickKickerId] = useState<string | null>(null);
  /** Após escolher Defesa/Pra fora (a favor): abre modal de cobrador antes de registrar */
  const [pendingFreeKickResultToRegister, setPendingFreeKickResultToRegister] = useState<'saved' | 'outside' | 'noGoal' | null>(null);
  const [freeKickStep, setFreeKickStep] = useState<'team' | 'kicker' | 'result' | null>(null);
  const [penaltyStep, setPenaltyStep] = useState<'team' | 'kicker' | 'result' | null>(null);
  
  const [showPenaltyTeamSelection, setShowPenaltyTeamSelection] = useState<boolean>(false);

  // Novo fluxo: Ação → Detalhes (popup) → Jogador (popup central) → Tempo (popup se necessário)
  type ActionFlowStep = 'details' | 'wrongPassTransition' | 'player' | 'goalkeeper' | 'time' | null;
  const [actionFlow, setActionFlow] = useState<{
    step: ActionFlowStep;
    action: string | null;
    details: string | null;
    selectedPlayerId?: string | null;
    cardType?: 'yellow' | 'secondYellow' | 'red';
    foulTeam?: 'for' | 'against';
    zone?: LateralResult;
    pendingTime?: number;
    /** Passe errado: true = gerou transição, false = não gerou */
    wrongPassTransition?: boolean;
  } | null>(null);
  const [showPenaltyKickerSelection, setShowPenaltyKickerSelection] = useState<boolean>(false);
  const [isManualSaving, setIsManualSaving] = useState<boolean>(false);
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
        if (result === 'simple') return { tipo: 'Defesa', subtipo: 'Simples' };
        if (result === 'hard') return { tipo: 'Defesa', subtipo: 'Difícil' };
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

  // Helpers para o novo fluxo action-first
  const needsDetails = (action: string): boolean => {
    switch (action) {
      case 'pass': case 'shot': case 'foul': case 'tackle': case 'card': case 'save':
        return true;
      case 'lateral': case 'corner': case 'block':
        return false;
      default:
        return false;
    }
  };

  const startActionFlow = (action: string) => {
    const step = needsDetails(action) ? 'details' as const : 'player' as const;
    const flow = { step, action, details: null as string | null };

    // Escanteio e Lateral: sempre popup central para escolher o jogador (sem atalho com seleção na lista)
    if (action === 'lateral' || action === 'corner') {
      setActionFlow({ ...flow, step: 'player' as const });
      return;
    }

    setActionFlow(flow as any);
  };

  const advanceActionFlowToPlayer = (details: string | null, extra?: { cardType?: 'yellow' | 'secondYellow' | 'red'; foulTeam?: 'for' | 'against'; zone?: LateralResult; wrongPassTransition?: boolean }) => {
    if (!actionFlow) return;
    // Falta do adversário: só contabiliza; não abre popup com lista dos nossos jogadores
    if (actionFlow.action === 'foul' && extra?.foulTeam === 'against') {
      executeActionFlow(
        { ...actionFlow, step: 'details', details, foulTeam: 'against', ...extra },
        OPPONENT_FAKE_PLAYER_ID
      );
      return;
    }
    setActionFlow({ ...actionFlow, step: 'player' as const, details, ...extra });
  };

  /** Escolha de jogador no modal central do actionFlow (substitui clique na lista lateral). */
  const handleActionFlowPlayerPick = (clickedPlayerId: string) => {
    if (!actionFlow?.action) return;
    if (needsTimePopup()) {
      setActionFlow(prev =>
        prev
          ? {
              ...prev,
              step: 'time' as const,
              selectedPlayerId: clickedPlayerId,
              pendingTime: getTimeForEvent() ?? matchTime ?? 0,
              details: prev.details ?? null,
              wrongPassTransition: prev.wrongPassTransition,
            }
          : null
      );
    } else {
      completeActionFlowWithPlayer(clickedPlayerId);
    }
  };

  const handleActionFlowPlayerModalBack = () => {
    if (!actionFlow?.action) return;
    if (needsDetails(actionFlow.action)) {
      setActionFlow(prev => (prev ? { ...prev, step: 'details' as const, selectedPlayerId: undefined } : null));
    } else {
      cancelActionFlow();
    }
  };

  const cancelActionFlow = () => {
    setActionFlow(null);
    setSelectedAction(null);
  };

  const needsTimePopup = (): boolean =>
    isPostmatch && manualMinute === 0 && manualSecond === 0;

  /** Tempo relativo à metade + period técnico; pós-jogo: `rawSeconds` é minuto absoluto 0–40. */
  const eventTimeAndPeriod = (rawSeconds: number, periodOverride?: MatchHalf): { time: number; period: MatchHalf } => {
    if (isPostmatch) {
      return absoluteSecondsToStored(rawSeconds);
    }
    const clampedRelative = Math.max(0, Math.min(rawSeconds, HALF_RELATIVE_MAX_SECONDS));
    return { time: clampedRelative, period: periodOverride ?? currentPeriod };
  };

  const executeActionFlow = (
    flow: NonNullable<typeof actionFlow>,
    playerId: string,
    timeOverride?: number,
    periodOverride?: '1T' | '2T'
  ) => {
    if (!flow?.action) return;
    const rawT = timeOverride ?? getTimeForEvent() ?? matchTime;

    const run = () => {
      switch (flow.action) {
        case 'pass': {
          const isWrong = flow.details === 'wrong';
          const generatedTransition = isWrong ? (flow.wrongPassTransition === true) : undefined;
          handleRegisterPass(flow.details as 'correct' | 'wrong', playerId, rawT, periodOverride, generatedTransition);
          break;
        }
        case 'shot':
          handleRegisterShot(flow.details as 'inside' | 'outside' | 'post' | 'blocked', playerId, rawT, periodOverride);
          break;
        case 'foul':
          handleRegisterFoul(flow.foulTeam ?? 'for', playerId, rawT, periodOverride);
          break;
        case 'tackle':
          handleRegisterTackle(flow.details as 'withBall' | 'withoutBall' | 'counter', playerId, rawT, periodOverride);
          break;
        case 'card':
          handleRegisterCard(flow.cardType ?? 'yellow', playerId, rawT, periodOverride);
          break;
        case 'save':
          handleRegisterSave(flow.details as 'simple' | 'hard', playerId, rawT, periodOverride);
          break;
        case 'lateral':
          handleRegisterLateral(flow.zone, playerId, rawT, periodOverride);
          break;
        case 'corner':
          handleRegisterCorner(flow.zone, playerId, rawT, periodOverride);
          break;
        case 'block':
          handleRegisterBlock(playerId, rawT, periodOverride);
          break;
        default:
          break;
      }
      cancelActionFlow();
    };

    run();
  };

  const completeActionFlowWithPlayer = (
    playerId: string,
    timeOverride?: number,
    periodOverride?: '1T' | '2T'
  ) => {
    if (!actionFlow?.action) return;
    executeActionFlow(actionFlow, playerId, timeOverride, periodOverride);
  };

  /** Após Defesa fácil/difícil: escolhe goleiro no popup; pós-jogo sem tempo abre o passo `time`. */
  const completeSaveAfterGoalkeeperPick = (flow: NonNullable<typeof actionFlow>, gkId: string) => {
    if (flow.action !== 'save' || (flow.details !== 'simple' && flow.details !== 'hard')) return;
    if (needsTimePopup()) {
      setActionFlow({ ...flow, step: 'time', selectedPlayerId: gkId, pendingTime: getTimeForEvent() ?? matchTime ?? 0 });
    } else {
      executeActionFlow(flow, gkId);
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
      return manualMinute * 60 + manualSecond;
    }
    return matchTime;
  };

  // Pós-jogo: metade técnica deriva só do relógio informado (sem select de período).
  useEffect(() => {
    if (!isPostmatch) return;
    setCurrentPeriod(deriveHalfFromAbsoluteSeconds(manualMinute * 60 + manualSecond));
  }, [isPostmatch, manualMinute, manualSecond]);

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
      // Definir goleiro atual: primeiro goleiro na lista de ativos, ou primeiro da lista
      if (ids.length > 0) {
        const gkId = ids.find(id => players.find(p => String(p.id).trim() === id)?.position === 'Goleiro') ?? ids[0];
        setCurrentGoalkeeperId(gkId);
      }
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

  // Atualizar jogadores ativos baseado na escalação; goleiro (primeiro da escalação) sempre primeiro na lista
  useEffect(() => {
    if (!isOpen || isPostmatch) return;
    if (players && players.length > 0 && lineupPlayers.length > 0) {
      const active = lineupPlayers
        .map(id => players.find(p => String(p.id).trim() === id))
        .filter((p): p is Player => p != null);
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
        if (e.isOpponentGoal || e.result === 'contra') goalsAgainstCalc += 1;
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

  // Faltas por período: exibição e regra dos 5 vinculadas ao período selecionado (botão central de tempo)
  /** Goleiros em quadra para o popup após Defesa fácil/difícil (titulares + goleiro linha ativo; fallback: todos em quadra). */
  const saveGoalkeeperOptions = useMemo(() => {
    let fromGk = activePlayers.filter(p => p.position === 'Goleiro');
    const ck = currentGoalkeeperId ? String(currentGoalkeeperId).trim() : '';
    if (ck && !fromGk.some(p => String(p.id).trim() === ck)) {
      const lineGk = activePlayers.find(p => String(p.id).trim() === ck);
      if (lineGk) fromGk = [...fromGk, lineGk];
    }
    const isFallback = fromGk.length === 0 && activePlayers.length > 0;
    const players = isFallback ? [...activePlayers] : fromGk;
    const sorted = [...players].sort((a, b) => {
      if (ck) {
        const aFirst = String(a.id).trim() === ck ? -1 : 0;
        const bFirst = String(b.id).trim() === ck ? -1 : 0;
        if (aFirst !== bFirst) return aFirst - bFirst;
      }
      return (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0);
    });
    return { players: sorted, isFallback };
  }, [activePlayers, currentGoalkeeperId]);

  const { foulsFor1T, foulsFor2T, foulsAgainst1T, foulsAgainst2T } = useMemo(() => {
    let f1 = 0, f2 = 0, a1 = 0, a2 = 0;
    for (const e of matchEvents) {
      if (e.type !== 'foul') continue;
      if (e.foulTeam === 'against') {
        if (e.period === '1T') a1++; else a2++;
      } else {
        if (e.period === '1T') f1++; else f2++;
      }
    }
    return { foulsFor1T: f1, foulsFor2T: f2, foulsAgainst1T: a1, foulsAgainst2T: a2 };
  }, [matchEvents]);
  const foulsForCurrentPeriod = currentPeriod === '1T' ? foulsFor1T : foulsFor2T;
  const foulsAgainstCurrentPeriod = currentPeriod === '1T' ? foulsAgainst1T : foulsAgainst2T;

  // Carregar eventos da partida ao abrir (postmatch ou partida incompleta com log salvo)
  useEffect(() => {
    if (!isOpen || !match.postMatchEventLog?.length) return;
    const converted = postMatchEventLogToMatchEvents(match.postMatchEventLog, players);
    setMatchEvents(converted);
    recalcGoalsAndFoulsFromEvents(converted);
    if (!isPostmatch) {
      setLineupPlayers(match.lineup?.players ?? []);
      setBenchPlayers(match.lineup?.bench ?? []);
      if (match.lineup?.ballPossessionStart) {
        setBallPossessionStart(match.lineup.ballPossessionStart);
      }
      setSubstitutionHistory(match.substitutionHistory ?? []);
    }
    autosaveSkipRef.current = true;
    queueMicrotask(() => {
      autosaveSkipRef.current = false;
      try {
        const initialSnapshot = JSON.stringify(buildMatchSnapshot('em_andamento'));
        lastAutosaveSignatureRef.current = initialSnapshot;
      } catch (_) {}
    });
  }, [isOpen, match?.id, match?.postMatchEventLog, match?.lineup, match?.substitutionHistory, players]);

  // Toggle cronômetro
  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Encerrar tempo (primeira metade → modal de intervalo; segunda metade → fim de jogo)
  const handleEndTime = () => {
    if (matchTime >= 20 * 60) {
      setIsRunning(false);

      if (currentPeriod === '1T') {
        setShowIntervalAnalysis(true);
      } else {
        // Segunda metade: encerrar partida
        setIsMatchEnded(true);
      }
    }
  };
  
  // Iniciar segundo tempo
  const handleStartSecondHalf = () => {
    setCurrentPeriod('2T');
    setMatchTime(0); // Zerar cronômetro para a segunda metade
    setShowIntervalAnalysis(false);
    // Posse inicial após o intervalo: oposta à escolha no início da partida
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

    // Armazenar tempos reais dos gols feitos e tomados para os gráficos de período
    const goalTimes: Array<{ time: string; method?: string }> = [];
    const goalsConcededTimes: Array<{ time: string; method?: string }> = [];

    for (const e of events) {
      // Cartões: atualizar yellowCards/redCards em playerStats (não têm PostMatchAction)
      if (e.type === 'card' && e.playerId) {
        const playerId = String(e.playerId).trim();
        if (!playerStats[playerId]) playerStats[playerId] = emptyStats();
        const ps = playerStats[playerId];
        if (e.cardType === 'yellow') {
          ps.yellowCards = (ps.yellowCards ?? 0) + 1;
        } else if (e.cardType === 'secondYellow') {
          ps.yellowCards = (ps.yellowCards ?? 0) + 1;
          ps.redCards = (ps.redCards ?? 0) + 1;
        } else if (e.cardType === 'red') {
          ps.redCards = (ps.redCards ?? 0) + 1;
        }
        continue;
      }

      const action = matchEventToPostMatchAction(e);
      if (!action) continue;

      // Garantir que gols do adversário sejam contabilizados mesmo se, por algum motivo, vierem sem playerId
      if (action === 'goal' && (e.isOpponentGoal || e.result === 'contra') && !e.playerId) {
        goalsAgainst += 1;
        teamStats.goalsConceded = (teamStats.goalsConceded ?? 0) + 1;
        // Métodos de gols tomados (fallback)
        if (e.goalMethod && e.goalMethod.trim() !== '') {
          if (!teamStats.goalMethodsConceded) teamStats.goalMethodsConceded = {};
          const method = e.goalMethod.trim();
          teamStats.goalMethodsConceded[method] = (teamStats.goalMethodsConceded[method] || 0) + 1;
        }
        // Não cria playerStats para esse evento "órfão"
        const timeStrFallback = formatTimeToMMSS(e.time);
        // Registrar tempo de gol tomado para distribuição por período
        goalsConcededTimes.push({
          time: `${timeStrFallback} (${e.period})`,
          method: e.goalMethod && e.goalMethod.trim() !== '' ? e.goalMethod.trim() : undefined,
        });
        const postEventFallback: PostMatchEvent = {
          id: e.id,
          time: timeStrFallback,
          period: e.period,
          playerId: OPPONENT_FAKE_PLAYER_ID,
          action,
          tipo: e.tipo,
          subtipo: e.subtipo,
          isOpponentGoal: true,
        };
        postMatchEventLog.push(postEventFallback);
        continue;
      }

      if (!e.playerId) continue;

      const playerId = String(e.playerId).trim();
      if (!playerStats[playerId]) playerStats[playerId] = emptyStats();
      const ps = playerStats[playerId];

      const timeStr = formatTimeToMMSS(e.time);

      if (action === 'goal') {
        if (e.isOpponentGoal || e.result === 'contra') {
          goalsAgainst += 1;
          teamStats.goalsConceded = (teamStats.goalsConceded ?? 0) + 1;
          if (e.goalMethod && e.goalMethod.trim() !== '') {
            if (!teamStats.goalMethodsConceded) teamStats.goalMethodsConceded = {};
            const method = e.goalMethod.trim();
            teamStats.goalMethodsConceded[method] = (teamStats.goalMethodsConceded[method] || 0) + 1;
          }
          // Registrar tempo de gol tomado para distribuição por período
          goalsConcededTimes.push({
            time: `${timeStr} (${e.period})`,
            method: e.goalMethod && e.goalMethod.trim() !== '' ? e.goalMethod.trim() : undefined,
          });
        } else {
          // Gol nosso: contabilizar em playerStats e nos dados do time
          ps.goals += 1;
          teamStats.goals += 1;
          goalsFor += 1;
          if (e.assistPlayerId) {
            const assistId = String(e.assistPlayerId).trim();
            if (!playerStats[assistId]) playerStats[assistId] = emptyStats();
            playerStats[assistId].assists = (playerStats[assistId].assists ?? 0) + 1;
            teamStats.assists = (teamStats.assists ?? 0) + 1;
          }
          if (e.goalMethod && e.goalMethod.trim() !== '') {
            if (!teamStats.goalMethodsScored) teamStats.goalMethodsScored = {};
            const method = e.goalMethod.trim();
            teamStats.goalMethodsScored[method] = (teamStats.goalMethodsScored[method] || 0) + 1;
          }
          // Registrar tempo de gol feito para distribuição por período
          goalTimes.push({
            time: `${timeStr} (${e.period})`,
            method: e.goalMethod && e.goalMethod.trim() !== '' ? e.goalMethod.trim() : undefined,
          });
        }
      } else if (action === 'passCorrect') {
        ps.passesCorrect += 1;
        teamStats.passesCorrect += 1;
      } else if (action === 'passWrong') {
        ps.passesWrong += 1;
        teamStats.passesWrong += 1;
        if (e.wrongPassGeneratedTransition) {
          // Erro crítico: passe errado que gerou transição
          teamStats.transitionErrors = (teamStats.transitionErrors ?? 0) + 1;
          // Também registrar no jogador para permitir Top 10 por atleta no Scout Coletivo
          (ps as any).transitionErrors = ((ps as any).transitionErrors ?? 0) + 1;
        }
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
      if (action === 'passWrong' && e.wrongPassGeneratedTransition !== undefined) {
        postEvent.wrongPassGeneratedTransition = e.wrongPassGeneratedTransition;
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
      if (action === 'goal') {
        postEvent.goalMethod = e.goalMethod ?? e.subtipo;
        postEvent.isOpponentGoal = e.isOpponentGoal;
        if (e.assistPlayerId) {
          postEvent.assistPlayerId = String(e.assistPlayerId).trim();
          if (e.assistPlayerName) postEvent.assistPlayerName = e.assistPlayerName;
        }
      }
      if (action === 'falta') postEvent.foulTeam = e.foulTeam;
      postMatchEventLog.push(postEvent);
    }

    const playerRelationships = processPlayerRelationships();

    // Anexar tempos de gols feitos/tomados ao teamStats (usados pelos gráficos de gols por período)
    if (goalTimes.length > 0) {
      (teamStats as any).goalTimes = goalTimes;
    }
    if (goalsConcededTimes.length > 0) {
      (teamStats as any).goalsConcededTimes = goalsConcededTimes;
    }

    const result: 'V' | 'D' | 'E' = goalsFor > goalsAgainst ? 'V' : goalsAgainst > goalsFor ? 'D' : 'E';
    return {
      id: match.id,
      opponent: match.opponent,
      date: match.date,
      result,
      goalsFor,
      goalsAgainst,
      competition: match.competition,
      location: match.location,
      playerStats,
      teamStats,
      postMatchEventLog,
      playerRelationships: Object.keys(playerRelationships).length > 0 ? playerRelationships : undefined,
    };
  };

  const buildMatchSnapshot = (status: 'em_andamento' | 'encerrado'): MatchRecord => {
    const savedMatch = convertMatchEventsToMatchRecord(matchEvents);
    savedMatch.status = status;
    if (!isPostmatch) {
      savedMatch.lineup = lineupPlayers.length > 0 && ballPossessionStart
        ? { players: lineupPlayers, bench: benchPlayers, ballPossessionStart }
        : undefined;
      savedMatch.substitutionHistory = substitutionHistory.length > 0 ? substitutionHistory : undefined;
      savedMatch.possessionSecondsWith = possessionSecondsWith;
      savedMatch.possessionSecondsWithout = possessionSecondsWithout;
    }
    return savedMatch;
  };

  const saveSilently = async () => {
    if (!onSave || !isOpen || autosaveSkipRef.current) return;
    if (!isPostmatch && !isMatchStarted) return;
    if (matchEvents.length === 0) return;

    const snapshot = buildMatchSnapshot('em_andamento');
    const signature = JSON.stringify(snapshot);
    if (signature === lastAutosaveSignatureRef.current) return;

    if (autosaveInFlightRef.current) {
      autosaveQueuedRef.current = true;
      return;
    }

    autosaveInFlightRef.current = true;
    try {
      await onSave(snapshot, { source: 'autosave' });
      lastAutosaveSignatureRef.current = signature;
    } catch (error) {
      console.warn('[autosave] falhou ao salvar partida em andamento:', error);
    } finally {
      autosaveInFlightRef.current = false;
      if (autosaveQueuedRef.current) {
        autosaveQueuedRef.current = false;
        void saveSilently();
      }
    }
  };

  // Finalizar coleta (status = encerrado, mas editável depois)
  const handleEndCollection = async () => {
    const canEnd = isPostmatch ? matchEvents.length >= 1 : isMatchEnded;
    if (!canEnd) return;
    if (!window.confirm('Tem certeza que deseja finalizar a coleta?')) return;

    if (isPostmatch && onSave) {
      const savedMatch = buildMatchSnapshot('encerrado');
      await onSave(savedMatch, { source: 'manual' });
      onClose();
      return;
    }

    if (substitutionHistory.length > 0) {
      updateSubstitutionFrequency(substitutionHistory);
    }
    if (onSave) {
      const savedMatch = buildMatchSnapshot('encerrado');
      await onSave(savedMatch, { source: 'manual' });
    }
    onClose();
  };

  // Salvar manualmente sem fechar a janela (confirmação explícita)
  const handleManualSaveOnly = async () => {
    if (!onSave) return;
    if (!window.confirm('Tem certeza que deseja salvar os dados agora?')) return;
    setIsManualSaving(true);
    try {
      const status: 'em_andamento' | 'encerrado' = ((isPostmatch && matchEvents.length >= 1) || isMatchEnded) ? 'encerrado' : 'em_andamento';
      const savedMatch = buildMatchSnapshot(status);
      await onSave(savedMatch, { source: 'manual' });
      lastAutosaveSignatureRef.current = JSON.stringify(savedMatch);
      alert('Dados salvos com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar manualmente:', error);
      alert('Falha ao salvar os dados. Tente novamente.');
    } finally {
      setIsManualSaving(false);
    }
  };

  // Salvar rascunho para finalizar depois (status = em_andamento)
  const handleSaveLater = async () => {
    if (matchEvents.length === 0 && !isPostmatch) {
      onClose();
      return;
    }

    if (onSave) {
      const savedMatch = buildMatchSnapshot('em_andamento');
      await onSave(savedMatch, { source: 'manual' });
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (autosaveSkipRef.current) return;
    if (!isPostmatch && !isMatchStarted) return;
    if (matchEvents.length === 0) return;

    if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    autosaveDebounceRef.current = setTimeout(() => {
      void saveSilently();
    }, 8000);

    return () => {
      if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    };
  }, [isOpen, isPostmatch, isMatchStarted, matchEvents, lineupPlayers, benchPlayers, substitutionHistory, possessionSecondsWith, possessionSecondsWithout, currentPeriod]);

  useEffect(() => {
    if (!isOpen) return;
    if (autosaveSkipRef.current) return;
    if (!isPostmatch && !isMatchStarted) return;
    autosaveIntervalRef.current = setInterval(() => {
      void saveSilently();
    }, 30000);
    return () => {
      if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
    };
  }, [isOpen, isPostmatch, isMatchStarted, saveSilently]);

  useEffect(() => {
    if (!isOpen) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      void saveSilently();
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isOpen, saveSilently]);

  const handleCloseWithSilentSave = async () => {
    if (!window.confirm('Tem certeza que deseja fechar? Dados não salvos podem ser perdidos.')) return;
    await saveSilently();
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

  // Selecionar ação — novo fluxo: ação → detalhes (popup) → jogador (popup central) → tempo (popup se necessário)
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
    
    // Se já há passe pendente e clicou em Passe novamente, cancelar
    if (action === 'pass' && pendingPassEventId) {
      setMatchEvents(prev => prev.filter(e => e.id !== pendingPassEventId));
      setPendingPassEventId(null);
      setPendingPassSenderId(null);
      setPendingPassResult(null);
      setSelectedAction(null);
      return;
    }
    
    // Ações que usam fluxo próprio (GOL, PÊNALTI, TIRO LIVRE) — não usam actionFlow
    if (action === 'goal' || action === 'penalty' || action === 'freeKick') {
      setSelectedAction(action);
      return;
    }
    
    // Novo fluxo action-first: iniciar actionFlow (sem exigir jogador pré-selecionado)
    startActionFlow(action);
    setSelectedAction(action);
  };
  
  // Registrar desarme
  const handleRegisterTackle = (result: 'withBall' | 'withoutBall' | 'counter', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('tackle', result);
    const newEvent: MatchEvent = {
      id: `tackle-${Date.now()}`,
      type: 'tackle',
      playerId: pid,
      playerName: player?.nickname || player?.name || '',
      time: evtTime,
      period: evtPeriod,
      result,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);

    // Retomar cronômetro (desarme = bola em jogo)
    if (!isRunning) {
      setIsRunning(true);
    }

    // Desarme sem posse: posse vai para o adversário
    if (result === 'withoutBall') {
      setBallPossessionNow('sem');
    } else {
      setBallPossessionNow('com');
    }
    setSelectedAction(null);
  };

  // Registrar defesa (goleiro atual ou jogador selecionado): Simples ou Difícil
  const handleRegisterSave = (difficulty: 'simple' | 'hard', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? currentGoalkeeperId ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('save', difficulty);
    const newEvent: MatchEvent = {
      id: `save-${Date.now()}`,
      type: 'save',
      playerId: pid,
      playerName: player?.nickname?.trim() || player?.name || '',
      time: evtTime,
      period: evtPeriod,
      result: difficulty,
      tipo,
      subtipo,
      details: { saveDifficulty: difficulty },
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    if (!isRunning) setIsRunning(true);
    setSelectedAction(null);
  };
  
  // Registrar bloqueio
  const handleRegisterBlock = (playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('block');
    const newEvent: MatchEvent = {
      id: `block-${Date.now()}`,
      type: 'block',
      playerId: pid,
      playerName: player?.name || '',
      time: evtTime,
      period: evtPeriod,
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

  // Registrar falta: Nosso ou Adversário. Contagem continua após 5; a partir da 6ª o botão Tiro Livre fica disponível.
  const handleRegisterFoul = (team: 'for' | 'against', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid =
      team === 'against'
        ? (playerIdOverride ?? OPPONENT_FAKE_PLAYER_ID)
        : (playerIdOverride ?? selectedPlayerId);
    if (team === 'for' && !pid) return;
    if (team === 'for' && pid === OPPONENT_FAKE_PLAYER_ID) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = team === 'against' ? null : activePlayers.find(p => String(p.id).trim() === pid);
    const subtipoText = team === 'for' ? 'Nosso' : 'Adversário';
    const newEvent: MatchEvent = {
      id: `foul-${Date.now()}`,
      type: 'foul',
      playerId: pid,
      playerName: team === 'against' ? OPPONENT_FAKE_PLAYER_NAME : (player?.name || ''),
      time: evtTime,
      period: evtPeriod,
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

  // Registrar resultado de passe (wrongPassGeneratedTransition: true = gerou transição; false = não gerou; undefined = passe certo)
  const handleRegisterPass = (result: 'correct' | 'wrong', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T', wrongPassGeneratedTransition?: boolean) => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo: baseSubtipo } = getTipoSubtipo('pass', result);
    const subtipo = result === 'wrong' && wrongPassGeneratedTransition ? 'Transição' : baseSubtipo;
    const eventId = `pass-${Date.now()}`;
    const newEvent: MatchEvent = {
      id: eventId,
      type: 'pass',
      playerId: pid,
      playerName: player?.name || '',
      time: evtTime,
      period: evtPeriod,
      result,
      tipo,
      subtipo,
      ...(result === 'wrong' && { wrongPassGeneratedTransition: wrongPassGeneratedTransition === true }),
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Se passe foi correto, aguardar próximo jogador selecionado como receptor
    if (result === 'correct') {
      setPendingPassSenderId(pid);
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

  // Registrar resultado de chute — posse fica selecionável depois (usuário define com Com posse / Sem posse)
  const handleRegisterShot = (result: 'inside' | 'outside' | 'post' | 'blocked', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('shot', result);
    const newEvent: MatchEvent = {
      id: `shot-${Date.now()}`,
      type: 'shot',
      playerId: pid,
      playerName: player?.nickname?.trim() || player?.name || '',
      time: evtTime,
      period: evtPeriod,
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
  const handleRegisterCorner = (zone?: LateralResult, playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;
    setIsRunning(false);

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('corner', zone);
    const newEvent: MatchEvent = {
      id: `corner-${Date.now()}`,
      type: 'corner',
      playerId: pid,
      playerName: player?.name || '',
      time: evtTime,
      period: evtPeriod,
      ...(zone && { result: zone }),
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    setSelectedAction(null);
  };

  // Registrar lateral (cronômetro já parado ao clicar em LATERAL); zona opcional (preenchida em outro momento)
  const handleRegisterLateral = (zone?: LateralResult, playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo: subtipoText } = getTipoSubtipo('lateral', zone);
    const newEvent: MatchEvent = {
      id: `lateral-${Date.now()}`,
      type: 'lateral',
      playerId: pid,
      playerName: player?.name || '',
      time: evtTime,
      period: evtPeriod,
      ...(zone && { result: zone }),
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
  const handleRegisterGoal = (goalType: 'normal' | 'contra', isOpponent: boolean = false, playerId: string | null = null, goalMethod?: string | null, goalTimeOverride?: number | null, goalPeriodOverride?: '1T' | '2T' | null, assistPlayerId?: string | null, assistPlayerName?: string | null) => {
    const player = playerId ? activePlayers.find(p => String(p.id).trim() === playerId) : null;
    const assistPlayer = assistPlayerId ? activePlayers.find(p => String(p.id).trim() === assistPlayerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('goal', goalType);
    const rawGoalT = goalTimeOverride ?? pendingGoalTime ?? matchTime;
    let goalTime: number;
    let goalPeriod: MatchHalf;
    if (isPostmatch) {
      const os = absoluteSecondsToStored(rawGoalT);
      goalTime = os.time;
      goalPeriod = os.period;
    } else {
      goalTime = rawGoalT;
      goalPeriod = (goalPeriodOverride ?? currentPeriod) as MatchHalf;
    }
    const method = goalMethod ?? pendingGoalMethod;

    const effectivePlayerId = isOpponent
      ? OPPONENT_FAKE_PLAYER_ID
      : (playerId || undefined);

    const effectivePlayerName = isOpponent
      ? (goalType === 'contra' ? 'Gol Contra' : OPPONENT_FAKE_PLAYER_NAME)
      : (player?.name || 'Desconhecido');

    const newEvent: MatchEvent = {
      id: `goal-${Date.now()}`,
      type: 'goal',
      playerId: effectivePlayerId,
      playerName: effectivePlayerName,
      time: goalTime,
      period: goalPeriod,
      result: goalType,
      isOpponentGoal: isOpponent,
      tipo,
      subtipo,
      ...(method && { goalMethod: method }),
      ...(assistPlayerId && { assistPlayerId, assistPlayerName: assistPlayerName ?? assistPlayer?.name }),
    };
    
    // Marcar passe como assistência apenas quando não há assistente explícito (fluxo antigo / inferência)
    if (!isOpponent && playerId && goalType === 'normal' && !assistPlayerId) {
      const lastPass = findLastPassBeforeGoal(goalTime);
      if (lastPass && lastPass.passToPlayerId === playerId) {
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
    setPendingAssistPlayerId(null);
    setPendingGoalTime(null);
    setPendingGoalMethod(null);
    setGoalConfirmEditingTime(false);
    setGoalStep(null);
    // Em postmatch: resetar tempo manual para que o próximo evento peça o tempo novamente
    if (isPostmatch) {
      setManualMinute(0);
      setManualSecond(0);
    }
  };
  
  // Registrar tiro livre
  const handleRegisterFreeKick = (team: 'for' | 'against', kickerId: string | null, result: 'goal' | 'saved' | 'outside' | 'post' | 'noGoal') => {
    const kicker = kickerId ? activePlayers.find(p => String(p.id).trim() === kickerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('freeKick', result);
    const rawT = getTimeForEvent() ?? matchTime;
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT);
    const newEvent: MatchEvent = {
      id: `freekick-${Date.now()}`,
      type: 'freeKick',
      playerId: kickerId || undefined,
      playerName: kicker?.name || (team === 'against' ? 'Adversário' : 'Nossa Equipe'),
      time: evtTime,
      period: evtPeriod,
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
    setPendingFreeKickResultToRegister(null);
    setFreeKickStep(null);
    setSelectedAction(null);
  };
  
  // Registrar pênalti
  const handleRegisterPenalty = (team: 'for' | 'against', kickerId: string | null, result: 'goal' | 'saved' | 'outside' | 'post' | 'noGoal') => {
    const kicker = kickerId ? activePlayers.find(p => String(p.id).trim() === kickerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('penalty', result);
    const rawT = getTimeForEvent() ?? matchTime;
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT);
    const newEvent: MatchEvent = {
      id: `penalty-${Date.now()}`,
      type: 'penalty',
      playerId: kickerId || undefined,
      playerName: kicker?.name || (team === 'against' ? 'Adversário' : 'Nossa Equipe'),
      time: evtTime,
      period: evtPeriod,
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
  const handleRegisterCard = (cardType: 'yellow' | 'secondYellow' | 'red', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('card', undefined, cardType);
    const newEvent: MatchEvent = {
      id: `card-${Date.now()}`,
      type: 'card',
      playerId: pid,
      playerName: player?.name || '',
      time: evtTime,
      period: evtPeriod,
      cardType,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Adicionar cartão ao histórico do jogador
    setPlayerCards(prev => {
      const updatedCards = [...(prev[pid] || []), cardType];
      return {
        ...prev,
        [pid]: updatedCards,
      };
    });

    // Verificar expulsão após atualizar cartões (usar useEffect ou verificação imediata)
    const currentCards = [...(playerCards[pid] || []), cardType];
    const yellowCount = currentCards.filter(c => c === 'yellow').length;
    const hasSecondYellow = currentCards.some(c => c === 'secondYellow');
    const hasRed = currentCards.some(c => c === 'red');
    const isExpelled = yellowCount >= 2 || hasSecondYellow || hasRed;
    
    if (isExpelled) {
      // Remover jogador da escalação (time fica com um a menos); não colocar no banco
      if (lineupPlayers.includes(pid)) {
        const newLineup = lineupPlayers.filter(id => id !== pid);
        setLineupPlayers(newLineup);
        // Não adicionar expulso ao banco: slot de expulsão até 2 min (cronômetro) ou gol adversário
        
        // Se goleiro foi expulso, atualizar currentGoalkeeperId
        if (pid === currentGoalkeeperId) {
          if (newLineup.length > 0) {
            setCurrentGoalkeeperId(newLineup[0]);
          } else {
            setCurrentGoalkeeperId(null);
          }
        }
        
        // Registrar slot de expulsão: pode repor após 2 min (cronômetro) ou gol do adversário
        setExpulsionState({
          expelledPlayerId: pid,
          expelledAtTime: matchTime,
          period: currentPeriod,
        });
      }
      
      // activePlayers é derivado de lineupPlayers no useEffect, então já reflete 4 em quadra
      
      alert(`⚠️ ${player?.name || 'Jogador'} foi expulso. Time joga com um a menos até 2 min ou gol adversário.`);
    }
    
    setSelectedAction(null);
    setSelectedPlayerId(null); // Limpar seleção após registrar cartão
  };

  // Repor slot de expulsão: jogador do banco entra no lugar do expulso (após 2 min ou gol adversário)
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

  // Pode repor no slot de expulsão: 2 min cronometrados (no mesmo período) ou gol do adversário após expulsão
  const canReplaceAfterExpulsion = useMemo(() => {
    if (!expulsionState) return false;
    const twoMinutesElapsed =
      currentPeriod === expulsionState.period &&
      matchTime >= expulsionState.expelledAtTime + EXPULSION_WAIT_SECONDS;
    const opponentScoredAfterExpulsion = matchEvents.some(
      (e) =>
        e.type === 'goal' &&
        e.isOpponentGoal &&
        ((e.period === expulsionState.period && e.time >= expulsionState.expelledAtTime) ||
          (expulsionState.period === '1T' && e.period === '2T'))
    );
    return twoMinutesElapsed || opponentScoredAfterExpulsion;
  }, [expulsionState, matchTime, currentPeriod, matchEvents]);

  // Segundos restantes para poder repor (no mesmo período); null se já pode ou outro critério
  const expulsionCountdownSeconds = useMemo(() => {
    if (!expulsionState || canReplaceAfterExpulsion) return null;
    if (currentPeriod !== expulsionState.period) return null;
    const elapsed = matchTime - expulsionState.expelledAtTime;
    const remaining = EXPULSION_WAIT_SECONDS - elapsed;
    return remaining <= 0 ? 0 : remaining;
  }, [expulsionState, matchTime, currentPeriod, canReplaceAfterExpulsion]);

  // Estatísticas pré-intervalo (apenas eventos com period === '1T')
  const firstHalfStats = useMemo(() => {
    const e1t = matchEvents.filter(e => e.period === '1T');
    const shotsAll = e1t.filter(e => e.type === 'shot');
    const savesAll = e1t.filter(e => e.type === 'save');
    return {
      shots: shotsAll.length,
      shotsInside: shotsAll.filter(e => e.result === 'inside').length,
      shotsOutside: shotsAll.filter(e => e.result === 'outside').length,
      corners: e1t.filter(e => e.type === 'corner').length,
      saves: savesAll.length,
      savesSimple: savesAll.filter(e => e.result === 'simple' || e.details?.saveDifficulty === 'simple').length,
      savesHard: savesAll.filter(e => e.result === 'hard' || e.details?.saveDifficulty === 'hard').length,
      fouls: e1t.filter(e => e.type === 'foul').length,
      cards: e1t.filter(e => e.type === 'card').length,
    };
  }, [matchEvents]);

  // Relação entre jogadores e passes pré-intervalo (duplas, jogadores, certo/errado)
  const firstHalfPassData = useMemo(() => {
    const e1t = matchEvents.filter(e => e.period === '1T');
    const passesCorrect = e1t.filter(e => e.type === 'pass' && e.result === 'correct').length;
    const passesWrong = e1t.filter(e => e.type === 'pass' && e.result === 'wrong').length;
    const relationships = processPlayerRelationships(e1t);
    const getPlayerName = (id: string) => {
      const p = players.find(pl => String(pl.id).trim() === id);
      return (p?.nickname?.trim() || p?.name) ?? id;
    };

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
  const leftOffset = sidebarRetracted ? 'left-16' : 'left-64';
  return (
    <div className={`fixed z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in overflow-hidden p-0 ${
      useFullViewport ? 'inset-0 h-dvh min-h-dvh' : `${leftOffset} top-0 right-0 bottom-0`
    }`}>
      <div className="w-full h-full min-h-0 bg-black flex flex-col relative overflow-hidden">

        {/* DADOS DA PARTIDA - placar centralizado e botão sair na mesma box */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-1.5 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-zinc-500 text-[10px] font-bold uppercase">DADOS DA PARTIDA</p>
            <button
              onClick={handleCloseWithSilentSave}
              className="bg-zinc-900 hover:bg-zinc-800 text-white p-1.5 rounded-full transition-colors border border-zinc-700"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {/* Placar: nome na mesma linha dos gols (nomes pro lado de fora), gols centralizados, faltas abaixo */}
            <div className="flex flex-col items-center gap-1 w-full">
              {/* Linha 1: Nome (fora) | Gols centralizados | Nome (fora) */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full max-w-md">
                <p className="text-zinc-300 text-xs font-normal uppercase truncate text-right">{(teamName || 'Nossa equipe').toUpperCase()}</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-[#00f0ff] text-2xl font-black font-mono min-w-[1.5rem] text-center">{goalsFor}</p>
                  <span className="text-zinc-600 text-xl font-black">x</span>
                  <p className="text-red-400 text-2xl font-black font-mono min-w-[1.5rem] text-center">{goalsAgainst}</p>
                </div>
                <p className="text-zinc-300 text-xs font-normal uppercase truncate text-left">{(match.opponent || 'Adversário').toUpperCase()}</p>
              </div>
              {/* Linha 2: faltas do período selecionado (1T ou 2T) - controlado pelo botão central de tempo */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full max-w-md">
                <div className={`rounded px-1.5 py-0.5 border text-xs font-bold flex justify-center ${
                  foulsForCurrentPeriod >= 5 ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-orange-500/50 text-orange-400'
                }`}>
                  {foulsForCurrentPeriod} F
                </div>
                <div />
                <div className={`rounded px-1.5 py-0.5 border text-xs font-bold flex justify-center ${
                  foulsAgainstCurrentPeriod >= 5 ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-orange-500/50 text-orange-400'
                }`}>
                  {foulsAgainstCurrentPeriod} F
                </div>
              </div>
            </div>

            {/* Log no extremo esquerdo, Finalizar Coleta no extremo direito */}
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setShowLogsView(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#00f0ff]/50 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-[10px] uppercase font-normal transition-colors"
              >
                <List size={14} /> Logs
              </button>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSaveOnly}
                    disabled={isManualSaving}
                    className={`px-3 py-2.5 rounded-xl border-2 text-[11px] uppercase font-bold tracking-wide transition-all ${
                      isManualSaving
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-wait'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500 text-emerald-400 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/10'
                    }`}
                  >
                    {isManualSaving ? 'Salvando...' : 'Salvar Dados'}
                  </button>
                  <button
                    onClick={handleEndCollection}
                    disabled={isPostmatch ? matchEvents.length < 1 : !isMatchEnded}
                    className={`px-4 py-2.5 rounded-xl border-2 text-xs uppercase font-bold tracking-wide transition-all ${
                      (isPostmatch && matchEvents.length >= 1) || isMatchEnded
                        ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500 text-red-400 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/10'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    Finalizar Coleta
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveLater}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
                >
                  finalizar depois
                </button>
              </div>
            </div>
          </div>
          {/* Tempo com posse e porcentagem (apenas tempo real com cronômetro) */}
          {!isPostmatch && (
            <div className="mt-1 pt-1 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-2 text-[10px]">
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
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Jogador</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Ação</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Subtipo / Resultado</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Extra</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...matchEvents]
                    .reverse()
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
                              <span className="text-zinc-300 font-mono text-sm">{formatTime(storedToAbsoluteSeconds(event.period, event.time))}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing && draft ? (
                              event.isOpponentGoal || event.playerId === OPPONENT_FAKE_PLAYER_ID ? (
                                <span className="text-zinc-400 text-sm">{OPPONENT_FAKE_PLAYER_NAME}</span>
                              ) : (
                                <select
                                  value={draft.playerId ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setEditDraft(prev => prev ? { ...prev, playerId: null, playerName: null } : null);
                                    } else {
                                      const p = players.find(x => String(x.id).trim() === val);
                                      setEditDraft(prev => prev ? { ...prev, playerId: val, playerName: p?.name ?? null } : null);
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm min-w-[120px]"
                                >
                                  <option value="">—</option>
                                  {players.map((p) => (
                                    <option key={p.id} value={String(p.id).trim()}>
                                      #{p.jerseyNumber ?? '?'} {p.nickname || p.name}
                                    </option>
                                  ))}
                                </select>
                              )
                            ) : (
                              <span className="text-white text-sm">{event.playerName ?? '—'}</span>
                            )}
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
                            {isEditing && draft && draft.type === 'goal' ? (
                              <select
                                value={draft.assistPlayerId ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    setEditDraft(prev => prev ? { ...prev, assistPlayerId: null, assistPlayerName: null } : null);
                                  } else {
                                    const p = players.find(x => String(x.id).trim() === val);
                                    setEditDraft(prev => prev ? { ...prev, assistPlayerId: val, assistPlayerName: p?.name ?? null } : null);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm min-w-[140px]"
                              >
                                <option value="">Sem assistência</option>
                                {players.map((p) => (
                                  <option key={p.id} value={String(p.id).trim()}>
                                    #{p.jerseyNumber ?? '?'} {p.nickname || p.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-zinc-400 text-sm">
                                {event.type === 'goal' ? (event.assistPlayerName ?? (event.assistPlayerId ? '—' : 'Sem assistência')) : event.type === 'pass' ? (event.passToPlayerName ?? '—') : '—'}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const absSec = parseManualTimeToSeconds(editTimeInput);
                                    if (absSec === null || !editDraft) return;
                                    const { time: newTime, period: newPeriod } = absoluteSecondsToStored(absSec);
                                    const tipo = editDraft.type === 'foul' ? 'Falta' : getTipoSubtipo(editDraft.type, editDraft.result, editDraft.cardType).tipo;
                                    const subtipo = editDraft.type === 'foul' ? (editDraft.foulTeam === 'against' ? 'Adversário' : 'Nosso') : getTipoSubtipo(editDraft.type, editDraft.result, editDraft.cardType).subtipo;
                                    const isOpponentGoal = editDraft.type === 'goal' && (editDraft.result === 'contra' || editDraft.isOpponentGoal);
                                    const isContra = editDraft.type === 'goal' && editDraft.result === 'contra';
                                    const updatedEvents = matchEvents.map(e => e.id === editingEventId ? {
                                      ...e,
                                      time: newTime,
                                      period: newPeriod,
                                      type: editDraft.type,
                                      result: editDraft.result,
                                      cardType: editDraft.cardType,
                                      foulTeam: editDraft.foulTeam,
                                      tipo,
                                      subtipo,
                                      isOpponentGoal,
                                      playerId: isOpponentGoal ? OPPONENT_FAKE_PLAYER_ID : (editDraft.playerId || undefined),
                                      playerName: isOpponentGoal ? (isContra ? 'Gol Contra' : OPPONENT_FAKE_PLAYER_NAME) : (editDraft.playerName ?? undefined),
                                      ...(editDraft.type === 'goal' && {
                                        assistPlayerId: editDraft.assistPlayerId ?? undefined,
                                        assistPlayerName: editDraft.assistPlayerName ?? undefined,
                                      }),
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
                              <div className="flex gap-1 flex-wrap">
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
                                      playerId: event.playerId ?? null,
                                      playerName: event.playerName ?? null,
                                      assistPlayerId: event.type === 'goal' ? (event.assistPlayerId ?? null) : undefined,
                                      assistPlayerName: event.type === 'goal' ? (event.assistPlayerName ?? null) : undefined,
                                    });
                                    setEditTimeInput(formatTime(storedToAbsoluteSeconds(event.period, event.time)));
                                  }}
                                  className="px-2 py-1 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/30 text-xs font-bold"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = matchEvents.filter(e => e.id !== event.id);
                                    setMatchEvents(updated);
                                    recalcGoalsAndFoulsFromEvents(updated);
                                    if (editingEventId === event.id) { setEditingEventId(null); setEditDraft(null); }
                                  }}
                                  className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-500 border border-red-500/50 text-white text-xs font-bold"
                                  title="Excluir evento"
                                >
                                  Excluir
                                </button>
                              </div>
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
        {/* Corpo Principal - Painéis Esquerdo e Direito (responsivo: celular horizontal mantém proporções) */}
        <div className="flex-1 flex gap-2 p-2 overflow-hidden min-h-0 min-w-0">
          {/* Painel Esquerdo - Seleção de Jogador (ocupa toda a altura; lista + substituição preenchem o card) */}
          <div className={`w-52 min-w-[7rem] max-w-[14rem] rounded-lg p-2 flex flex-col border-2 shrink-0 min-h-0 bg-black ${actionFlow?.step === 'player' ? 'border-zinc-800' : actionFlow?.step === 'goalkeeper' ? 'border-purple-500/70' : 'border-zinc-800'}`}>
            <h3 className="text-white font-bold uppercase text-sm mb-2 text-center shrink-0">
              {(goalStep === 'author' || goalStep === 'assist') && !pendingGoalIsOpponent
                ? 'GOL — popup'
                : actionFlow?.step === 'player' && !goalStep
                  ? 'Ação — popup'
                  : 'SELECIONAR JOGADOR'}
            </h3>
            {goalStep === 'author' && !pendingGoalIsOpponent && (
              <>
                <p className="text-zinc-400 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Autor no centro da tela</p>
                <button type="button" onClick={() => { setGoalStep('team'); setPendingGoalPlayerId(null); setPendingAssistPlayerId(null); setPendingGoalType(null); setPendingGoalMethod(null); setGoalConfirmEditingTime(false); }} className="mb-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors shrink-0">Voltar</button>
              </>
            )}
            {goalStep === 'assist' && !pendingGoalIsOpponent && (
              <>
                <p className="text-zinc-400 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Assistência no centro</p>
                <button type="button" onClick={() => { setGoalStep('method'); setPendingAssistPlayerId(null); }} className="mb-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors shrink-0">Voltar</button>
              </>
            )}
            {actionFlow?.step === 'player' && !goalStep && (
              <p className="text-zinc-400 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Jogador no popup</p>
            )}
            
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
              {!isMatchStarted ? (
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-2 text-center">
                  <p className="text-yellow-400 text-xs font-bold">Complete a escalação para iniciar</p>
                </div>
              ) : showSubstitutions ? (
                // Modo Substituição: lista única com banco primeiro, depois quadra
                <>
                  <p className="text-zinc-400 text-xs font-bold uppercase mb-3 text-center">
                    {selectedPlayerId ? 'Selecione jogador do banco para entrar' : 'Clique no jogador em quadra para sair'}
                  </p>
                  <div className="space-y-1 flex-1 overflow-y-auto">
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
                          className={`w-full rounded-lg p-2 text-left transition-all ${
                            selectedPlayerId && lineupPlayers.includes(selectedPlayerId)
                              ? 'bg-green-500/20 border border-green-500/90 hover:border-green-400'
                              : 'bg-green-500/10 border border-green-500/70 hover:border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-white font-normal text-sm">
                              {player.nickname?.trim() || player.name} · {player.jerseyNumber}
                              {selectedPlayerId && lineupPlayers.includes(selectedPlayerId) && ' (ENTRANDO)'}
                            </p>
                            {subCount > 0 && (
                              <span className="text-green-400 text-[10px] font-bold bg-green-500/20 px-2 py-0.5 rounded">
                                {subCount}x
                              </span>
                            )}
                          </div>
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
                      const displayName = player.nickname?.trim() || player.name;
                      return (
                        <button
                          key={playerId}
                          onClick={() => setSelectedPlayerId(playerId)}
                          className={`w-full rounded-lg p-2 text-left transition-all flex items-center gap-3 ${
                            selectedPlayerId === playerId
                              ? 'bg-red-500/20 border-4 border-red-500'
                              : 'bg-zinc-900 border-2 border-zinc-700 hover:border-red-500'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                {displayName.substring(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-normal text-sm truncate">
                              {isGoalkeeper && '🥅 '}{displayName} · {player.jerseyNumber}
                              {selectedPlayerId === playerId && ' (SAINDO)'}
                            </p>
                            <p className="text-zinc-500 text-[10px]">QUADRA</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setShowSubstitutions(false);
                      setSelectedPlayerId(null);
                    }}
                    className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold uppercase text-xs rounded-lg p-2 transition-colors"
                  >
                    Cancelar Substituição
                  </button>
                </>
              ) : showExpulsionReplacementSelection && expulsionState ? (
                <>
                  <p className="text-zinc-400 text-xs font-bold uppercase mb-3 text-center">
                    Quem entra no lugar do expulso?
                  </p>
                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {sortedBenchPlayers.map((playerId) => {
                      const player = players.find(p => String(p.id).trim() === playerId);
                      if (!player) return null;
                      return (
                        <button
                          key={playerId}
                          onClick={() => handleReplaceExpulsionSlot(playerId)}
                          className="w-full rounded-lg p-2 text-left bg-green-500/20 border border-green-500/90 hover:border-green-400 transition-all flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-normal text-sm truncate">{player.nickname?.trim() || player.name} · {player.jerseyNumber}</p>
                            <p className="text-zinc-500 text-[10px]">BANCO (ENTRANDO)</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowExpulsionReplacementSelection(false)}
                    className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold uppercase text-xs rounded-lg p-2 transition-colors"
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
                          const clickedPlayerId = String(player.id).trim();
                          if ((goalStep === 'author' || goalStep === 'assist') && !pendingGoalIsOpponent) return;
                          if (actionFlow?.step === 'player' && actionFlow?.action) return;
                          if (!isMatchStarted) return;
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
                        disabled={!isMatchStarted && !goalStep}
                        className={`w-full rounded-lg p-2 text-left transition-all ${
                          !isMatchStarted
                            ? 'bg-zinc-800 border border-zinc-700 text-zinc-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#00f0ff]/20 border-2 border-[#00f0ff]'
                            : pendingPassEventId && String(player.id).trim() !== pendingPassSenderId
                            ? 'bg-yellow-500/20 border border-yellow-500 hover:border-yellow-400'
                            : 'bg-green-500/10 border border-green-500/80 hover:border-green-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <p className="text-white font-normal text-sm truncate flex-1 min-w-0">
                            {(player.position === 'Goleiro' || isGoalkeeper) && '🥅 '}{player.nickname?.trim() || player.name} · #{player.jerseyNumber}
                            {player.position && <span className="text-zinc-400 text-[10px] ml-1">· {player.position}</span>}
                            {pendingPassEventId && String(player.id).trim() !== pendingPassSenderId && ' (receber passe)'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  <div className="rounded-lg p-2 border-2 border-red-500 bg-red-500/10 text-left">
                    <p className="text-red-400 font-bold text-sm">
                      🟥 Expulso: {(players.find(p => String(p.id).trim() === expulsionState.expelledPlayerId)?.nickname?.trim() || players.find(p => String(p.id).trim() === expulsionState.expelledPlayerId)?.name) ?? 'Jogador'}
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
                          ? `Pode substituir em ${Math.floor(expulsionCountdownSeconds / 60)}:${String(expulsionCountdownSeconds % 60).padStart(2, '0')}`
                          : 'Aguarde 2 min ou gol adversário'}
                      </p>
                    )}
                  </div>
                </>
              ) : activePlayers && activePlayers.length > 0 ? (
                <div className="flex flex-col min-h-full gap-1">
                  {[...activePlayers]
                    .sort((a, b) => {
                      const aId = String(a.id).trim();
                      const bId = String(b.id).trim();
                      const aGK = a.position === 'Goleiro' || aId === currentGoalkeeperId;
                      const bGK = b.position === 'Goleiro' || bId === currentGoalkeeperId;
                      if (aGK && !bGK) return -1;
                      if (!aGK && bGK) return 1;
                      if (aGK && bGK && currentGoalkeeperId) {
                        if (aId === currentGoalkeeperId) return -1;
                        if (bId === currentGoalkeeperId) return 1;
                      }
                      return 0;
                    })
                    .map((player) => {
                  const isSelected = selectedPlayerId === String(player.id).trim();
                  const isGoalkeeper = String(player.id).trim() === currentGoalkeeperId;
                  const isGk = player.position === 'Goleiro' || isGoalkeeper;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        const clickedPlayerId = String(player.id).trim();
                        if ((goalStep === 'author' || goalStep === 'assist') && !pendingGoalIsOpponent) return;
                        if (actionFlow?.step === 'player' && actionFlow?.action) return;
                        if (!isMatchStarted) return;

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
                      disabled={!isMatchStarted && !goalStep}
                      className={`w-full rounded-lg p-1.5 text-left transition-all ${
                        !isMatchStarted
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#00f0ff]/20 border-2 border-[#00f0ff]'
                          : pendingPassEventId && String(player.id).trim() !== pendingPassSenderId
                          ? 'bg-yellow-500/20 border border-yellow-500 hover:border-yellow-400'
                          : 'bg-green-500/10 border border-green-500/80 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px] font-medium">
                              {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-[11px] truncate leading-tight">
                            {player.nickname?.trim() || player.name} · #{player.jerseyNumber}
                            {pendingPassEventId && String(player.id).trim() !== pendingPassSenderId && ' (receber passe)'}
                          </p>
                          <p className={`text-[9px] leading-tight mt-0.5 ${isGk ? 'text-amber-400' : 'text-zinc-400'}`}>
                            {isGk ? '🥅 Goleiro' : (player.position || '—')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                  })}
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/80 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs">Nenhum jogador ativo</p>
                </div>
              )}
            </div>

            {/* Botão Substituições - ocupa o fim do card à esquerda */}
            <button
              onClick={() => setShowSubstitutions(true)}
              className="mt-2 w-full rounded-lg p-2 font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30 shrink-0"
            >
              <ArrowRightLeft size={16} />
              SUBSTITUIÇÕES
            </button>
          </div>

          {/* Painel Direito - Ações/Eventos (flex-1 + min-w-0 para responsivo) */}
          <div className="flex-1 min-w-0 bg-black border-2 border-blue-500 rounded-lg p-2 flex flex-col min-h-0">
            {/* Indicação quando a ação aguarda seleção de jogador na aba lateral */}
            {actionFlow?.step === 'player' && !goalStep && (
              <div className="mb-2 p-2 bg-[#00f0ff]/10 border border-[#00f0ff]/50 rounded-lg">
                <p className="text-[#00f0ff] text-xs font-bold text-center">
                  Escolha o jogador no popup
                </p>
              </div>
            )}
            {actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save' && !goalStep && (
              <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/50 rounded-lg">
                <p className="text-purple-300 text-xs font-bold text-center">
                  Selecione quem defendeu no popup
                </p>
              </div>
            )}
            {/* Área Principal de Ações */}
            <div className="flex-1 border-2 border-zinc-800 rounded-lg p-2 flex flex-col min-h-0">
              {/* Parte superior (~20%): zona reservada para opções de Passe/Chute/Falta/Cartão */}
              <div className="flex-[2] min-h-0 overflow-auto flex-shrink-0">
              {/* Popup Gol - Equipe (Gol Nosso / Gol Adversário) */}
              {goalStep === 'team' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setGoalStep(null); setPendingGoalTime(null); setGoalConfirmEditingTime(false); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-green-500/40 rounded-2xl shadow-2xl shadow-green-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-green-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Goal size={18} />
                        Tipo de gol
                      </h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setPendingGoalIsOpponent(false);
                          setPendingGoalType('normal');
                          setPendingGoalMethod(null);
                          setPendingGoalPlayerId(null);
                          setPendingAssistPlayerId(null);
                          setGoalStep('author');
                        }}
                        className="w-full px-4 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-sm rounded-xl hover:bg-green-500/30 transition-colors"
                      >
                        Gol Nosso
                      </button>
                      <button
                        onClick={() => {
                          setPendingGoalIsOpponent(true);
                          setPendingGoalType('normal');
                          setGoalStep('method');
                          setPendingGoalMethod(null);
                        }}
                        className="w-full px-4 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Gol Adversário
                      </button>
                      <button
                        onClick={() => { setGoalStep(null); setPendingGoalTime(null); setPendingGoalMethod(null); setPendingGoalType(null); setPendingGoalIsOpponent(false); setPendingGoalPlayerId(null); setPendingAssistPlayerId(null); setGoalConfirmEditingTime(false); }}
                        className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Gol — autor (gol nosso; seleção central) */}
              {goalStep === 'author' && !pendingGoalIsOpponent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => {
                      setGoalStep('team');
                      setPendingGoalPlayerId(null);
                      setPendingAssistPlayerId(null);
                      setPendingGoalMethod(null);
                      setGoalConfirmEditingTime(false);
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-zinc-950 border-2 border-green-500/40 rounded-2xl shadow-2xl shadow-green-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 shrink-0">
                      <h3 className="text-green-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Goal size={18} />
                        Autor do gol
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">Quem marcou?</p>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
                      {[...activePlayers]
                        .sort((a, b) => {
                          const aId = String(a.id).trim();
                          const bId = String(b.id).trim();
                          const aGK = a.position === 'Goleiro' || aId === currentGoalkeeperId;
                          const bGK = b.position === 'Goleiro' || bId === currentGoalkeeperId;
                          if (aGK && !bGK) return -1;
                          if (!aGK && bGK) return 1;
                          if (aGK && bGK && currentGoalkeeperId) {
                            if (aId === currentGoalkeeperId) return -1;
                            if (bId === currentGoalkeeperId) return 1;
                          }
                          return 0;
                        })
                        .map((player) => {
                          const pid = String(player.id).trim();
                          const isGK = player.position === 'Goleiro' || pid === currentGoalkeeperId;
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => {
                                setPendingGoalPlayerId(pid);
                                setPendingAssistPlayerId(null);
                                setGoalStep('method');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/15 border-2 border-green-500/80 hover:bg-green-500/25 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                    {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <p className="text-white font-bold text-sm truncate flex-1 min-w-0">
                                {(isGK) && '🥅 '}{player.nickname?.trim() || player.name} · #{player.jerseyNumber}
                                {player.position && <span className="text-zinc-400 text-[10px] ml-1">· {player.position}</span>}
                              </p>
                            </button>
                          );
                        })}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setGoalStep('team');
                          setPendingGoalPlayerId(null);
                          setPendingAssistPlayerId(null);
                          setPendingGoalMethod(null);
                          setGoalConfirmEditingTime(false);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        <ArrowLeft size={14} /> Voltar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Gol — assistência (gol nosso, após método que permite assistência) */}
              {goalStep === 'assist' && !pendingGoalIsOpponent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => {
                      setGoalStep('method');
                      setPendingAssistPlayerId(null);
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-zinc-950 border-2 border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 shrink-0">
                      <h3 className="text-amber-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Goal size={18} />
                        Assistência
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">Quem deu a assistência?</p>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAssistPlayerId(null);
                          setGoalStep('confirm');
                        }}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-xl transition-colors"
                      >
                        Sem assistência
                      </button>
                      {[...activePlayers]
                        .filter((p) => String(p.id).trim() !== pendingGoalPlayerId)
                        .sort((a, b) => {
                          const aId = String(a.id).trim();
                          const bId = String(b.id).trim();
                          const aGK = a.position === 'Goleiro' || aId === currentGoalkeeperId;
                          const bGK = b.position === 'Goleiro' || bId === currentGoalkeeperId;
                          if (aGK && !bGK) return -1;
                          if (!aGK && bGK) return 1;
                          if (aGK && bGK && currentGoalkeeperId) {
                            if (aId === currentGoalkeeperId) return -1;
                            if (bId === currentGoalkeeperId) return 1;
                          }
                          return 0;
                        })
                        .map((player) => {
                          const pid = String(player.id).trim();
                          const isGK = player.position === 'Goleiro' || pid === currentGoalkeeperId;
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => {
                                setPendingAssistPlayerId(pid);
                                setGoalStep('confirm');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border-2 border-amber-500/80 hover:bg-amber-500/25 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                    {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <p className="text-white font-bold text-sm truncate flex-1 min-w-0">
                                {(isGK) && '🥅 '}{player.nickname?.trim() || player.name} · #{player.jerseyNumber}
                                {player.position && <span className="text-zinc-400 text-[10px] ml-1">· {player.position}</span>}
                              </p>
                            </button>
                          );
                        })}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setGoalStep('method');
                          setPendingAssistPlayerId(null);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        <ArrowLeft size={14} /> Voltar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Método do gol - overlay em cima, seleciona e fecha */}
              {goalStep === 'method' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setGoalStep(pendingGoalIsOpponent ? 'team' : 'author'); setPendingGoalMethod(null); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-[#00f0ff]/40 rounded-2xl shadow-2xl shadow-[#00f0ff]/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-[#00f0ff] font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Goal size={18} />
                        Método do gol
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">
                        {pendingGoalIsOpponent ? 'Como o adversário marcou?' : 'Como foi o gol?'}
                      </p>
                    </div>
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Coluna Bola Rolando */}
                        <div className="space-y-3">
                          <h4 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-800 pb-1 mb-3">Bola Rolando</h4>
                          <div className="flex flex-col gap-2">
                            {(pendingGoalIsOpponent ? GOAL_METHODS_CONCEDED : GOAL_METHODS_OUR)
                              .filter(method => !BOLA_PARADA_METHODS.includes(method))
                              .map((method) => {
                                const ui = GOAL_METHOD_UI[method] || { icon: <Goal size={16} />, bg: 'bg-zinc-600/20', border: 'border-zinc-600/50', hover: 'hover:bg-zinc-500', text: 'text-white' };
                                return (
                                  <button
                                    key={method}
                                    onClick={() => {
                                      setPendingGoalMethod(method);
                                      if (pendingGoalIsOpponent) {
                                        setGoalStep('confirm');
                                      } else if (GOAL_METHODS_NO_ASSIST.includes(method)) {
                                        setPendingAssistPlayerId(null);
                                        setGoalStep('confirm');
                                      } else {
                                        setGoalStep('assist');
                                      }
                                    }}
                                    className={`flex items-center gap-3 px-4 py-4 ${ui.bg} ${ui.border} border-2 ${ui.text} ${ui.hover} font-black uppercase text-[11px] rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] group`}
                                  >
                                    <span className="shrink-0 group-hover:scale-110 transition-transform">{ui.icon}</span>
                                    <span className="text-left leading-tight">{method}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* Coluna Bola Parada */}
                        <div className="space-y-3">
                          <h4 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-800 pb-1 mb-3">Bola Parada</h4>
                          <div className="flex flex-col gap-2">
                            {(pendingGoalIsOpponent ? GOAL_METHODS_CONCEDED : GOAL_METHODS_OUR)
                              .filter(method => BOLA_PARADA_METHODS.includes(method))
                              .map((method) => {
                                const ui = GOAL_METHOD_UI[method] || { icon: <Goal size={16} />, bg: 'bg-zinc-600/20', border: 'border-zinc-600/50', hover: 'hover:bg-zinc-500', text: 'text-white' };
                                return (
                                  <button
                                    key={method}
                                    onClick={() => {
                                      setPendingGoalMethod(method);
                                      if (pendingGoalIsOpponent) {
                                        setGoalStep('confirm');
                                      } else if (GOAL_METHODS_NO_ASSIST.includes(method)) {
                                        setPendingAssistPlayerId(null);
                                        setGoalStep('confirm');
                                      } else {
                                        setGoalStep('assist');
                                      }
                                    }}
                                    className={`flex items-center gap-3 px-4 py-4 ${ui.bg} ${ui.border} border-2 ${ui.text} ${ui.hover} font-black uppercase text-[11px] rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] group`}
                                  >
                                    <span className="shrink-0 group-hover:scale-110 transition-transform">{ui.icon}</span>
                                    <span className="text-left leading-tight">{method}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                      {pendingGoalIsOpponent && (
                        <div className="col-span-2 mt-2 space-y-3">
                          <h4 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-800 pb-1 mb-3">Gol Contra</h4>
                          <div className="flex flex-col gap-2">
                            {(() => {
                              const ui = GOAL_METHOD_UI['Gol Contra'];
                              return (
                                <button
                                  onClick={() => {
                                    setPendingGoalType('contra');
                                    setPendingGoalMethod('Gol Contra');
                                    setGoalStep('confirm');
                                  }}
                                  className={`flex items-center gap-3 px-4 py-4 ${ui.bg} ${ui.border} border-2 ${ui.text} ${ui.hover} font-black uppercase text-[11px] rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] group`}
                                >
                                  <span className="shrink-0 group-hover:scale-110 transition-transform">{ui.icon}</span>
                                  <span className="text-left leading-tight">Gol Contra</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button
                        onClick={() => { setGoalStep(pendingGoalIsOpponent ? 'team' : 'author'); setPendingGoalMethod(null); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        <ArrowLeft size={14} /> Voltar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {goalStep === 'confirm' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => {
                      setGoalStep(null);
                      setPendingGoalType(null);
                      setPendingGoalIsOpponent(false);
                      setPendingGoalPlayerId(null);
                      setPendingAssistPlayerId(null);
                      setPendingGoalTime(null);
                      setPendingGoalMethod(null);
                      setGoalConfirmEditingTime(false);
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-green-500/40 rounded-2xl shadow-2xl shadow-green-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-green-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Goal size={18} />
                        Confirmar Gol
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">Revise os dados antes de confirmar</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-xs font-bold uppercase w-20 shrink-0">Equipe</span>
                        <span className={`text-sm font-bold ${pendingGoalType === 'contra' ? 'text-amber-400' : pendingGoalIsOpponent ? 'text-red-400' : 'text-green-400'}`}>
                          {pendingGoalType === 'contra' ? 'Gol Contra (contra nós)' : pendingGoalIsOpponent ? 'Adversário' : 'Nosso Time'}
                        </span>
                      </div>
                      {pendingGoalPlayerId && (() => {
                        const p = players.find((x) => String(x.id).trim() === pendingGoalPlayerId);
                        return (
                          <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                            <span className="text-zinc-500 text-xs font-bold uppercase w-20 shrink-0">Autor</span>
                            <span className="text-white text-sm font-bold">
                              {p?.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p?.nickname || p?.name || '—'}
                            </span>
                          </div>
                        );
                      })()}
                      {!pendingGoalIsOpponent && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-bold uppercase w-20 shrink-0">Assistência</span>
                          <span className="text-white text-sm font-bold">
                            {pendingAssistPlayerId
                              ? (() => {
                                  const a = players.find((x) => String(x.id).trim() === pendingAssistPlayerId);
                                  return a ? `${a.jerseyNumber ? `#${a.jerseyNumber} ` : ''}${a.nickname || a.name || '—'}` : '—';
                                })()
                              : 'Sem assistência'}
                          </span>
                        </div>
                      )}
                      {pendingGoalMethod && (() => {
                        const ui = GOAL_METHOD_UI[pendingGoalMethod] || { icon: <Goal size={16} />, bg: 'bg-zinc-600', text: 'text-white' };
                        return (
                          <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                            <span className="text-zinc-500 text-xs font-bold uppercase w-20 shrink-0">Método</span>
                            <span className={`flex items-center gap-2 text-sm font-bold ${ui.text}`}>
                              {ui.icon} {pendingGoalMethod}
                            </span>
                          </div>
                        );
                      })()}
                      {pendingGoalTime !== null && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-bold uppercase w-20 shrink-0">Tempo</span>
                          {goalConfirmEditingTime ? (
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={Math.floor(pendingGoalTime / 60)}
                                onChange={(e) => setPendingGoalTime(parseInt(e.target.value, 10) * 60 + (pendingGoalTime % 60))}
                                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                              >
                                {Array.from({ length: 41 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span className="text-zinc-500 font-bold">:</span>
                              <select
                                value={pendingGoalTime % 60}
                                onChange={(e) => setPendingGoalTime(Math.floor(pendingGoalTime / 60) * 60 + parseInt(e.target.value, 10))}
                                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                              >
                                {Array.from({ length: 60 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setGoalConfirmEditingTime(false)}
                                className="ml-auto px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-bold rounded"
                              >
                                Ok
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[#00f0ff] text-sm font-bold">
                                {Math.floor(pendingGoalTime / 60)}&apos;{String(pendingGoalTime % 60).padStart(2, '0')}&quot;
                              </span>
                              <button
                                onClick={() => setGoalConfirmEditingTime(true)}
                                className="ml-auto px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 text-xs font-bold rounded transition-colors"
                              >
                                Editar tempo
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                      <button
                        onClick={() => {
                          const assistName = pendingAssistPlayerId ? (players.find((x) => String(x.id).trim() === pendingAssistPlayerId)?.name) : null;
                          handleRegisterGoal(
                            pendingGoalType || 'normal',
                            pendingGoalIsOpponent,
                            pendingGoalPlayerId,
                            pendingGoalMethod,
                            pendingGoalTime,
                            undefined,
                            pendingAssistPlayerId ?? undefined,
                            assistName ?? undefined
                          );
                        }}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20"
                      >
                        Confirmar Gol
                      </button>
                      <button
                        onClick={() => {
                          setGoalStep(null);
                          setPendingGoalType(null);
                          setPendingGoalIsOpponent(false);
                          setPendingGoalPlayerId(null);
                          setPendingAssistPlayerId(null);
                          setPendingGoalTime(null);
                          setGoalConfirmEditingTime(false);
                        }}
                        className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-xs rounded-xl border border-zinc-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ActionDetailsPopup — opções de detalhe por ação (Passe: Certo/Errado/Transição; sem zona para lateral) */}
              {actionFlow?.step === 'details' && actionFlow.action && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={cancelActionFlow}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-[#00f0ff] font-black uppercase text-sm tracking-wider">
                        {actionFlow.action === 'pass' && 'Resultado do Passe'}
                        {actionFlow.action === 'shot' && 'Resultado do Chute'}
                        {actionFlow.action === 'foul' && 'Quem cometeu a falta?'}
                        {actionFlow.action === 'tackle' && 'Tipo de Desarme'}
                        {actionFlow.action === 'card' && 'Tipo de Cartão'}
                        {actionFlow.action === 'save' && 'Tipo de Defesa'}
                      </h3>
                    </div>
                    <div className="p-4">
                      {actionFlow.action === 'pass' && actionFlow.step === 'details' && (
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => { advanceActionFlowToPlayer('correct'); }} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors">Certo</button>
                          <button onClick={() => { advanceActionFlowToPlayer('wrong', { wrongPassTransition: false }); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Errado</button>
                          <button onClick={() => { advanceActionFlowToPlayer('wrong', { wrongPassTransition: true }); }} className="px-4 py-3 bg-amber-500/20 border-2 border-amber-500 text-amber-400 font-bold uppercase text-xs rounded-lg hover:bg-amber-500/30 transition-colors">Transição</button>
                        </div>
                      )}
                      {actionFlow.action === 'shot' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { advanceActionFlowToPlayer('inside'); }} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors">No gol</button>
                          <button onClick={() => { advanceActionFlowToPlayer('outside'); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Fora</button>
                          <button onClick={() => { advanceActionFlowToPlayer('post'); }} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors">Trave</button>
                          <button onClick={() => { advanceActionFlowToPlayer('blocked'); }} className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors">Bloqueado</button>
                        </div>
                      )}
                      {actionFlow.action === 'foul' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { advanceActionFlowToPlayer('for', { foulTeam: 'for' }); }} className="px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/30">Nosso {foulsForCurrentPeriod > 0 && <span className="text-zinc-400">({foulsForCurrentPeriod})</span>}</button>
                          <button onClick={() => { advanceActionFlowToPlayer('against', { foulTeam: 'against' }); }} className="px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30">Adversário {foulsAgainstCurrentPeriod > 0 && <span className="text-zinc-400">({foulsAgainstCurrentPeriod})</span>}</button>
                        </div>
                      )}
                      {actionFlow.action === 'tackle' && (
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => { advanceActionFlowToPlayer('withBall'); }} className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors">Com Posse</button>
                          <button onClick={() => { advanceActionFlowToPlayer('withoutBall'); }} className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors">Sem Posse</button>
                          <button onClick={() => { advanceActionFlowToPlayer('counter'); }} className="px-4 py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-bold uppercase text-xs rounded-lg hover:bg-blue-500/30 transition-colors">Contra-ataque</button>
                        </div>
                      )}
                      {actionFlow.action === 'card' && (
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => { advanceActionFlowToPlayer('yellow', { cardType: 'yellow' }); }} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors">Amarelo</button>
                          <button onClick={() => { advanceActionFlowToPlayer('secondYellow', { cardType: 'secondYellow' }); }} className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors">2º Amarelo</button>
                          <button onClick={() => { advanceActionFlowToPlayer('red', { cardType: 'red' }); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Vermelho</button>
                        </div>
                      )}
                      {actionFlow.action === 'save' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'goalkeeper', details: 'simple' } : prev))}
                              className="px-4 py-3 bg-purple-500/20 border border-purple-500 text-purple-400 font-medium uppercase text-xs rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                              Defesa fácil
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'goalkeeper', details: 'hard' } : prev))}
                              className="px-4 py-3 bg-purple-600/20 border border-purple-600 text-purple-300 font-medium uppercase text-xs rounded-lg hover:bg-purple-600/30 transition-colors"
                            >
                              Defesa difícil
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button onClick={cancelActionFlow} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ActionFlow — jogador (popup central; substitui seleção na lista lateral) */}
              {actionFlow?.step === 'player' && actionFlow.action && !goalStep && (() => {
                const apAction = actionFlow.action;
                const apLabel =
                  apAction === 'pass'
                    ? 'Passe'
                    : apAction === 'shot'
                      ? 'Finalização'
                      : apAction === 'foul'
                        ? 'Falta'
                        : apAction === 'tackle'
                          ? 'Desarme'
                          : apAction === 'card'
                            ? 'Cartão'
                            : apAction === 'block'
                              ? 'Bloqueio'
                              : apAction === 'lateral'
                                ? 'Lateral'
                                : apAction === 'corner'
                                  ? 'Escanteio'
                                  : 'Jogador';
                return (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleActionFlowPlayerModalBack} aria-hidden="true" />
                    <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-zinc-950 border-2 border-[#00f0ff]/40 rounded-2xl shadow-2xl shadow-[#00f0ff]/10 overflow-hidden">
                      <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 shrink-0">
                        <h3 className="text-[#00f0ff] font-black uppercase text-sm tracking-wider flex items-center gap-2">
                          Quem?
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">{apLabel}</p>
                      </div>
                      <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
                        {activePlayers.length === 0 ? (
                          <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogador em quadra.</p>
                        ) : (
                          [...activePlayers]
                            .sort((a, b) => {
                              const aId = String(a.id).trim();
                              const bId = String(b.id).trim();
                              const aGK = a.position === 'Goleiro' || aId === currentGoalkeeperId;
                              const bGK = b.position === 'Goleiro' || bId === currentGoalkeeperId;
                              if (aGK && !bGK) return -1;
                              if (!aGK && bGK) return 1;
                              if (aGK && bGK && currentGoalkeeperId) {
                                if (aId === currentGoalkeeperId) return -1;
                                if (bId === currentGoalkeeperId) return 1;
                              }
                              return 0;
                            })
                            .map((player) => {
                              const pid = String(player.id).trim();
                              const isGK = player.position === 'Goleiro' || pid === currentGoalkeeperId;
                              return (
                                <button
                                  key={player.id}
                                  type="button"
                                  onClick={() => handleActionFlowPlayerPick(pid)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 hover:bg-[#00f0ff]/20 transition-colors text-left"
                                >
                                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-600 bg-zinc-800">
                                    {player.photoUrl ? (
                                      <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                                        {(player.nickname?.trim() || player.name).substring(0, 2).toUpperCase() || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-white font-bold text-sm truncate flex-1 min-w-0">
                                    {isGK && '🥅 '}
                                    {player.nickname?.trim() || player.name} · #{player.jerseyNumber}
                                    {player.position && <span className="text-zinc-400 text-[10px] ml-1">· {player.position}</span>}
                                  </p>
                                </button>
                              );
                            })
                        )}
                      </div>
                      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleActionFlowPlayerModalBack}
                          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                        >
                          <ArrowLeft size={14} /> Voltar
                        </button>
                        <button type="button" onClick={cancelActionFlow} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Defesa: após fácil/difícil — escolher goleiro em quadra */}
              {actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'details', details: null } : prev))}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-purple-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Shield size={18} />
                        Quem defendeu?
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">
                        {actionFlow.details === 'simple' ? 'Defesa fácil' : actionFlow.details === 'hard' ? 'Defesa difícil' : ''}
                        {saveGoalkeeperOptions.isFallback && ' — Nenhum goleiro titular na lista; escolha quem estava no gol.'}
                      </p>
                    </div>
                    <div className="p-4 max-h-[65vh] overflow-y-auto flex flex-col gap-2">
                      {saveGoalkeeperOptions.players.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogador em quadra.</p>
                      ) : (
                        saveGoalkeeperOptions.players.map((p) => {
                          const pid = String(p.id).trim();
                          const label = p.nickname?.trim() || p.name;
                          return (
                            <button
                              key={pid}
                              type="button"
                              onClick={() => completeSaveAfterGoalkeeperPick(actionFlow, pid)}
                              className="flex w-full items-center gap-3 px-4 py-4 bg-purple-500/10 border-2 border-purple-500/40 text-purple-100 font-bold uppercase text-[11px] rounded-xl transition-all duration-200 hover:bg-purple-500/20 hover:border-purple-400 hover:scale-[1.01] active:scale-[0.99] text-left"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-purple-500/30 font-mono text-sm text-purple-300">
                                {p.jerseyNumber}
                              </span>
                              <span className="min-w-0 leading-tight">{label}</span>
                              {p.position === 'Goleiro' && (
                                <span className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-wider text-purple-500/80">GK</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'details', details: null } : prev))}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        <ArrowLeft size={14} /> Voltar
                      </button>
                      <button type="button" onClick={cancelActionFlow} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TimeInputPopup — postmatch quando tempo não preenchido */}
              {actionFlow?.step === 'time' && actionFlow.selectedPlayerId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={cancelActionFlow}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-[#00f0ff] font-black uppercase text-sm tracking-wider">Informar tempo</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase w-20">Minuto</label>
                        <select
                          value={Math.floor((actionFlow.pendingTime ?? 0) / 60)}
                          onChange={(e) => {
                            const m = parseInt(e.target.value, 10);
                            setActionFlow(prev => prev ? { ...prev, pendingTime: (prev.pendingTime ?? 0) % 60 + m * 60 } : null);
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                        >
                          {Array.from({ length: 41 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase w-20">Segundo</label>
                        <select
                          value={(actionFlow.pendingTime ?? 0) % 60}
                          onChange={(e) => {
                            const s = parseInt(e.target.value, 10);
                            setActionFlow(prev => prev ? { ...prev, pendingTime: Math.floor((prev.pendingTime ?? 0) / 60) * 60 + s } : null);
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                      <button
                        onClick={() => {
                          const pid = actionFlow.selectedPlayerId!;
                          const time = (actionFlow.pendingTime ?? 0);
                          completeActionFlowWithPlayer(pid, time);
                        }}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs rounded-xl transition-all"
                      >
                        Confirmar
                      </button>
                      <button onClick={cancelActionFlow} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-xs rounded-xl border border-zinc-700 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Popup Tiro Livre - 1: Contra ou A favor */}
              {freeKickStep === 'team' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); setPendingFreeKickResultToRegister(null); }} aria-hidden="true" />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-violet-400 font-black uppercase text-sm tracking-wider">Tiro Livre - Contra ou A favor?</h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <button
                        onClick={() => { setPendingFreeKickTeam('for'); setFreeKickStep('result'); }}
                        className="w-full px-4 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-sm rounded-xl hover:bg-green-500/30 transition-colors"
                      >
                        A Favor (Nossa Equipe)
                      </button>
                      <button
                        onClick={() => { setPendingFreeKickTeam('against'); setFreeKickStep('result'); }}
                        className="w-full px-4 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Contra (Adversário)
                      </button>
                      <button onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); setPendingFreeKickResultToRegister(null); }} className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-xl transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Tiro Livre - Cobrador (Defesa / Pra fora — a favor) */}
              {freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setFreeKickStep('result'); setPendingFreeKickResultToRegister(null); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-violet-400 font-black uppercase text-sm tracking-wider">Quem cobrou o tiro livre?</h3>
                    </div>
                    <div className="p-4 max-h-[50vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {activePlayers?.length ? activePlayers.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              const res = pendingFreeKickResultToRegister;
                              const pid = String(player.id).trim();
                              if (res) handleRegisterFreeKick('for', pid, res);
                            }}
                            className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-lg hover:border-violet-500 hover:bg-violet-500/10 transition-colors text-left"
                          >
                            <span>#{player.jerseyNumber} {player.nickname?.trim() || player.name}</span>
                            {player.position && <span className="block text-[10px] text-zinc-400 mt-0.5">{player.position === 'Goleiro' ? '🥅 Goleiro' : player.position}</span>}
                          </button>
                        )) : (
                          <p className="col-span-2 text-zinc-500 text-xs text-center py-2">Nenhum jogador ativo</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setFreeKickStep('result'); setPendingFreeKickResultToRegister(null); }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Tiro Livre - 2: Resultado (Gol / Defesa / Pra fora) */}
              {freeKickStep === 'result' && pendingFreeKickTeam && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); setPendingFreeKickKickerId(null); setPendingFreeKickResultToRegister(null); }} aria-hidden="true" />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-violet-400 font-black uppercase text-sm tracking-wider">Resultado do Tiro Livre</h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <button
                        onClick={() => {
                          const team = pendingFreeKickTeam;
                          setFreeKickStep(null);
                          setPendingFreeKickTeam(null);
                          setPendingFreeKickKickerId(null);
                          setPendingFreeKickResultToRegister(null);
                          setPendingGoalMethod('Tiro Livre');
                          setPendingGoalTime(getTimeForEvent() ?? matchTime);
                          if (team === 'for') {
                            setPendingGoalIsOpponent(false);
                            setPendingGoalType('normal');
                            setGoalStep('author');
                          } else {
                            setPendingGoalIsOpponent(true);
                            setPendingGoalType('normal');
                            setPendingGoalPlayerId(OPPONENT_FAKE_PLAYER_ID);
                            setGoalStep('confirm');
                          }
                        }}
                        className="w-full px-4 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-sm rounded-xl hover:bg-green-500/30 transition-colors"
                      >
                        Gol
                      </button>
                      <button
                        onClick={() => {
                          if (pendingFreeKickTeam === 'for') {
                            setPendingFreeKickResultToRegister('saved');
                            setFreeKickStep('kicker');
                          } else {
                            handleRegisterFreeKick('against', null, 'saved');
                          }
                        }}
                        className="w-full px-4 py-4 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-sm rounded-xl hover:bg-purple-500/30 transition-colors"
                      >
                        Defesa
                      </button>
                      <button
                        onClick={() => {
                          if (pendingFreeKickTeam === 'for') {
                            setPendingFreeKickResultToRegister('outside');
                            setFreeKickStep('kicker');
                          } else {
                            handleRegisterFreeKick('against', null, 'noGoal');
                          }
                        }}
                        className="w-full px-4 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Pra fora
                      </button>
                      <button onClick={() => { setFreeKickStep(null); setPendingFreeKickTeam(null); setPendingFreeKickKickerId(null); setPendingFreeKickResultToRegister(null); }} className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-xl transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Popup Pênalti - Equipe */}
              {penaltyStep === 'team' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-purple-400 font-black uppercase text-sm tracking-wider">Pênalti - Qual equipe?</h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <button
                        onClick={() => { setPendingPenaltyTeam('for'); setPenaltyStep('kicker'); }}
                        className="w-full px-4 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-sm rounded-xl hover:bg-green-500/30 transition-colors"
                      >
                        A Favor (Nossa Equipe)
                      </button>
                      <button
                        onClick={() => { setPendingPenaltyTeam('against'); setPenaltyStep('result'); }}
                        className="w-full px-4 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Contra (Adversário)
                      </button>
                      <button
                        onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); }}
                        className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Pênalti - Cobrador */}
              {penaltyStep === 'kicker' && pendingPenaltyTeam === 'for' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setPenaltyStep('team'); setPendingPenaltyKickerId(null); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-purple-400 font-black uppercase text-sm tracking-wider">Selecionar cobrador</h3>
                    </div>
                    <div className="p-4 max-h-[50vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {activePlayers?.length ? activePlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => {
                              setPendingPenaltyKickerId(String(player.id).trim());
                              setPenaltyStep('result');
                            }}
                            className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-colors text-left"
                          >
                            <span>#{player.jerseyNumber} {player.nickname?.trim() || player.name}</span>
                            {player.position && <span className="block text-[10px] text-zinc-400 mt-0.5">{player.position === 'Goleiro' ? '🥅 Goleiro' : player.position}</span>}
                          </button>
                        )) : (
                          <p className="col-span-2 text-zinc-500 text-xs text-center py-2">Nenhum jogador ativo</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button
                        onClick={() => { setPenaltyStep('team'); setPendingPenaltyKickerId(null); }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Pênalti - Resultado */}
              {penaltyStep === 'result' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); setPendingPenaltyKickerId(null); }}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-purple-400 font-black uppercase text-sm tracking-wider">Resultado do Pênalti</h3>
                    </div>
                    <div className="p-4">
                      {pendingPenaltyTeam === 'for' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'goal')} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors">Gol</button>
                          <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30 transition-colors">Defendido</button>
                          <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'outside')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Pra Fora</button>
                          <button onClick={() => handleRegisterPenalty('for', pendingPenaltyKickerId, 'post')} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors">Trave</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => handleRegisterPenalty('against', null, 'goal')} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Gol Adversário</button>
                          <button onClick={() => handleRegisterPenalty('against', null, 'saved')} className="px-4 py-3 bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-bold uppercase text-xs rounded-lg hover:bg-purple-500/30 transition-colors">Defesa</button>
                          <button onClick={() => handleRegisterPenalty('against', null, 'noGoal')} className="px-4 py-3 bg-zinc-500/20 border-2 border-zinc-500 text-zinc-400 font-bold uppercase text-xs rounded-lg hover:bg-zinc-500/30 transition-colors">Não Gol</button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                      <button
                        onClick={() => { setPenaltyStep(null); setPendingPenaltyTeam(null); setPendingPenaltyKickerId(null); }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              </div>
              {/* Fim da parte superior reservada */}

              {!isMatchStarted ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg">
                    <p className="text-yellow-400 text-sm font-bold uppercase mb-2">
                      Partida não iniciada
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Complete a escalação para habilitar os comandos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-[8] flex flex-col gap-1 min-h-0 flex-1">
                  {/* Sem posse | GOL | Com posse - três botões iguais em uma linha */}
                  <div className="flex gap-1 flex-1 min-h-0">
                    <button
                      onClick={() => setBallPossessionNow('sem')}
                      disabled={isBlockedByPenalty}
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          : ballPossessionNow === 'sem'
                          ? 'bg-red-500/40 border-red-500 text-white'
                          : 'bg-zinc-900 border-red-500/30 text-red-500/70 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
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
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        isMatchStarted && !isBlockedByPenalty
                          ? 'bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500/30'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-zinc-700'
                      }`}
                    >
                      <Goal size={22} />
                      GOL
                    </button>
                    <button
                      onClick={() => setBallPossessionNow('com')}
                      disabled={isBlockedByPenalty}
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          : ballPossessionNow === 'com'
                          ? 'bg-[#00f0ff]/40 border-[#00f0ff] text-white'
                          : 'bg-zinc-900 border-[#00f0ff]/30 text-[#00f0ff]/70 hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] hover:text-[#00f0ff]'
                      }`}
                    >
                      Com posse
                    </button>
                  </div>

                  {/* Layout - FALTA/ESCANTEIO | TEMPO | PASSE/CHUTE - ocupa 80%, tamanhos similares, cronômetro maior */}
                  <div className="flex-[3] flex flex-col min-h-0 gap-1">
                    {/* Linha central: FALTA/ESCANTEIO | TEMPO (maior) | PASSE/CHUTE */}
                    <div className="flex-1 flex items-stretch justify-center gap-1 min-h-0">
                      {/* Esquerda - FALTA e ESCANTEIO */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0 min-h-0">
                        <button
                          onClick={() => {
                            if ((!isPostmatch && !isRunning) || isBlockedByPenalty || foulsForCurrentPeriod >= 5) return;
                            if (!isPostmatch && selectedAction !== 'foul') setIsRunning(false);
                            handleSelectAction('foul');
                          }}
                          disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty || foulsForCurrentPeriod >= 5}
                          className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                            (!isPostmatch && !isRunning) || isBlockedByPenalty || foulsForCurrentPeriod >= 5
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : selectedAction === 'foul'
                              ? 'bg-orange-500/30 border-orange-500 text-orange-400'
                              : 'bg-zinc-900 border-orange-500/30 text-orange-500/70 hover:bg-orange-500/20 hover:border-orange-500 hover:text-orange-400'
                          }`}
                        >
                          FALTA
                        </button>
                        <button
                          onClick={() => {
                            if (!isMatchStarted) return;
                            if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                            if (!isPostmatch) setIsRunning(false);
                            handleSelectAction('corner');
                          }}
                          disabled={!isMatchStarted || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                          className={`flex-1 min-h-[44px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                            (!isPostmatch && !isRunning) || isBlockedByPenalty
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500/70 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 shadow-sm'
                          }`}
                        >
                          ESCANTEIO
                        </button>
                      </div>

                      {/* TEMPO - Centro: cronômetro (realtime) - MAIOR que os outros botões */}
                      <div className="flex flex-col items-center justify-center gap-1 flex-[2] min-w-0 min-h-0">
                        {isPostmatch ? (
                          <div className="w-full h-full min-h-[80px] py-4 px-4 rounded-lg border-2 border-zinc-600 bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
                            <label className="text-zinc-400 text-[10px] font-bold uppercase">Tempo (min:seg)</label>
                            <div className="flex items-center gap-1">
                              <select
                                value={manualMinute}
                                onChange={(e) => setManualMinute(parseInt(e.target.value, 10))}
                                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                              >
                                {Array.from({ length: 41 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span className="text-zinc-500 font-bold">:</span>
                              <select
                                value={manualSecond}
                                onChange={(e) => setManualSecond(parseInt(e.target.value, 10))}
                                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-[#00f0ff]"
                              >
                                {Array.from({ length: 60 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleToggleTimer}
                              className={`w-full h-full min-h-[80px] py-4 px-4 rounded-lg border-2 font-black font-mono text-3xl transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
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
                      <div className="flex flex-col gap-1 flex-1 min-w-0 min-h-0">
                        {ballPossessionNow === 'com' ? (
                          <>
                            <button
                              onClick={() => handleSelectAction('pass')}
                              disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'pass'
                                  ? 'bg-zinc-100 border-white text-black'
                                  : 'bg-zinc-900 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 hover:border-white hover:text-white'
                              }`}
                            >
                              PASSE
                            </button>
                            <button
                              onClick={() => handleSelectAction('shot')}
                              disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'shot'
                                  ? 'bg-red-500/30 border-red-500 text-red-400'
                                  : 'bg-zinc-900 border-red-500/30 text-red-500/70 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
                              }`}
                            >
                              CHUTE
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectAction('tackle')}
                              disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'tackle'
                                  ? 'bg-blue-500/30 border-blue-500 text-blue-400'
                                  : 'bg-zinc-900 border-blue-500/30 text-blue-500/70 hover:bg-blue-500/20 hover:border-blue-500 hover:text-blue-400'
                              }`}
                            >
                              DESARME
                            </button>
                            <button
                              onClick={() => handleSelectAction('save')}
                              disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'save'
                                  ? 'bg-purple-500/30 border-purple-500 text-purple-400'
                                  : 'bg-zinc-900 border-purple-500/30 text-purple-500/70 hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-400'
                              }`}
                            >
                              DEFESA
                            </button>
                            <button
                              onClick={() => handleSelectAction('block')}
                              disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                (!isPostmatch && !isRunning) || isBlockedByPenalty
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'block'
                                  ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400'
                                  : 'bg-zinc-900 border-yellow-500/30 text-yellow-500/70 hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-400'
                              }`}
                            >
                              BLOQUEIO
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Linha inferior: PÊNALTI, TIRO LIVRE, LATERAL, CARTÃO - tamanhos similares */}
                    <div className="grid grid-cols-4 gap-1 shrink-0 min-h-[56px]">
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
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          (!isPostmatch && !isRunning) || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : penaltyStep ? 'bg-purple-500/40 border-purple-500 text-white'
                            : 'bg-zinc-900 border-purple-500/30 text-purple-500/70 hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-400'
                        }`}
                      >
                        PÊNALTI
                      </button>
                      <button
                        onClick={() => {
                          if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                          if (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5) {
                            return; // Habilitado quando pelo menos um lado tem 5 faltas no período atual
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
                        disabled={(!isPostmatch && !isRunning) || isBlockedByPenalty || (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5)}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors shadow-lg ${
                          (!isPostmatch && !isRunning) || isBlockedByPenalty || (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5)
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : freeKickStep ? 'bg-red-500/40 border-red-500 text-white'
                            : 'bg-zinc-900 border-red-500/30 text-red-500/70 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
                        }`}
                      >
                        TIRO LIVRE
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) return;
                          if ((!isPostmatch && !isRunning) || isBlockedByPenalty) return;
                          if (!isPostmatch) setIsRunning(false);
                          handleSelectAction('lateral');
                        }}
                        disabled={!isMatchStarted || (!isPostmatch && !isRunning) || isBlockedByPenalty}
                        className={`min-h-[48px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || (!isPostmatch && !isRunning) || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500/70 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 shadow-sm'
                        }`}
                      >
                        LATERAL
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) return;
                          if (isBlockedByPenalty) return;
                          handleSelectAction('card');
                        }}
                        disabled={!isMatchStarted || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : selectedAction === 'card'
                            ? 'bg-yellow-500/40 border-yellow-500 text-white'
                            : 'bg-zinc-900 border-yellow-500/30 text-yellow-500/70 hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-400'
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
                                  {player.position === 'Goleiro' || index === 0 ? '🥅 GOLEIRO' : `Jogador ${index + 1}`}
                                </p>
                                <p className="text-white font-bold text-sm text-center">
                                  #{player.jerseyNumber}
                                </p>
                                <p className="text-zinc-400 text-xs text-center truncate w-full">
                                  {player.name}
                                </p>
                                {player.position && <p className="text-zinc-500 text-[10px] text-center">{player.position}</p>}
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
                            <p className={`text-[10px] font-medium ${player.position === 'Goleiro' ? 'text-amber-400' : 'text-zinc-500'}`}>
                              {player.position === 'Goleiro' ? '🥅 Goleiro' : (player.position || '—')}
                            </p>
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
                  Resumo (pré-intervalo)
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

                  {/* Estatísticas (pré-intervalo, period === 1T) */}
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
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Defesas (total)</p>
                      <p className="text-purple-400 text-2xl font-black">{firstHalfStats.saves}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Defesas simples</p>
                      <p className="text-purple-300 text-2xl font-black">{firstHalfStats.savesSimple}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Defesas difíceis</p>
                      <p className="text-purple-500 text-2xl font-black">{firstHalfStats.savesHard}</p>
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

                  {/* Chutes dentro/fora e posse de bola (antes do intervalo) */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-3">Chutes e posse de bola (até o intervalo)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Chutes dentro</p>
                        <p className="text-green-400 text-xl font-black">{firstHalfStats.shotsInside}</p>
                        {firstHalfStats.shots > 0 && (
                          <p className="text-zinc-500 text-xs">{(100 * firstHalfStats.shotsInside / firstHalfStats.shots).toFixed(0)}%</p>
                        )}
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Chutes fora</p>
                        <p className="text-red-400 text-xl font-black">{firstHalfStats.shotsOutside}</p>
                        {firstHalfStats.shots > 0 && (
                          <p className="text-zinc-500 text-xs">{(100 * firstHalfStats.shotsOutside / firstHalfStats.shots).toFixed(0)}%</p>
                        )}
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Com posse</p>
                        <p className="text-[#00f0ff] text-xl font-black font-mono">{formatTime(possessionSecondsWith)}</p>
                        {possessionSecondsWith + possessionSecondsWithout > 0 && (
                          <p className="text-zinc-500 text-xs">{((possessionSecondsWith / (possessionSecondsWith + possessionSecondsWithout)) * 100).toFixed(1)}%</p>
                        )}
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Sem posse</p>
                        <p className="text-amber-400 text-xl font-black font-mono">{formatTime(possessionSecondsWithout)}</p>
                        {possessionSecondsWith + possessionSecondsWithout > 0 && (
                          <p className="text-zinc-500 text-xs">{((possessionSecondsWithout / (possessionSecondsWith + possessionSecondsWithout)) * 100).toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relação entre jogadores — passes antes do intervalo */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase">Relação entre jogadores (passes até o intervalo)</p>
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
                            <p className="text-zinc-600 text-xs">Nenhuma dupla com passes neste trecho</p>
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
                            <p className="text-zinc-600 text-xs">Nenhum passe neste trecho</p>
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
                  Retomar após o intervalo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { X, Play, Pause, Square, Users, Goal, AlertTriangle, Clock, List, ArrowLeft, Target, Zap, Shield, UserRound, CornerDownRight, MoveHorizontal, Flag, CircleDot, Circle, Hand, ShieldOff, Lock, Unlock } from 'lucide-react';
import { MatchRecord, MatchStats, Player, Team, PostMatchEvent, PostMatchAction, MatchClockSnapshot } from '../types';
import { MatchType } from './MatchTypeModal';
import {
  HALF_RELATIVE_LAST_SECOND_1T,
  HALF_RELATIVE_LAST_SECOND_2T,
  HALF_RELATIVE_MAX_SECONDS,
  absoluteSecondsToStored,
  canonicalizePostMatchEventClock,
  formatGoalTimeDigitsMask,
  goalAbsoluteDigitsToRelativeSecondsSecondHalf,
  goalAbsoluteDigitsToRelativeSecondsSecondHalfUnclamped,
  goalDigitsToRelativeSeconds,
  parseGoalTimeDigits,
  secondHalfRelativeToGoalDigits,
  storedToAbsoluteSeconds,
  type MatchHalf,
} from '../utils/matchPeriod';
import { isPersistedServerMatchId } from '../utils/matchUpsert';
import { REGULATION_HALF_SECONDS, getEventStamp, type ClockSnapshot } from '../services/clockService';
import { useMatchClock } from '../hooks/useMatchClock';
import { getMatchClockEventRule, type ClockPauseDirective } from '../utils/matchClockEventRules';
import {
  buildClockProductTourSteps,
  type ClockTourStepDefinition,
  type ClockTourTargetId,
} from '../content/clockProductTour';
import { ClockHelpPanel } from './guide/ClockHelpPanel';

const CLOCK_TOUR_COMPLETED_STORAGE_KEY = 'scout21.clockTour.v1.completed';

function readClockTourCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CLOCK_TOUR_COMPLETED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
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

const PERSISTED_CLOCK_STATES = new Set<MatchClockSnapshot['state']>([
  'PRE_JOGO',
  'PRIMEIRO_TEMPO',
  'PAUSADO',
  'SINCRONIZANDO',
  'INTERVALO',
  'SEGUNDO_TEMPO',
  'ENCERRADO',
]);

function normalizePersistedClockSnapshot(snapshot: unknown): MatchClockSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const candidate = snapshot as Partial<MatchClockSnapshot>;
  const rawSeconds = Number(candidate.currentTimeSeconds);
  const period = candidate.period;
  const state = candidate.state;

  if (!Number.isFinite(rawSeconds)) return null;
  if (period !== '1T' && period !== '2T') return null;
  if (typeof state !== 'string' || !PERSISTED_CLOCK_STATES.has(state as MatchClockSnapshot['state'])) {
    return null;
  }

  return {
    currentTimeSeconds: Math.max(0, Math.floor(rawSeconds)),
    period,
    state: state as MatchClockSnapshot['state'],
    isRunning: Boolean(candidate.isRunning),
    firstHalfLocked: Boolean(candidate.firstHalfLocked),
  };
}

function buildPersistedClockSnapshot(snapshot: ClockSnapshot): MatchClockSnapshot {
  const nextState =
    snapshot.state === 'PRIMEIRO_TEMPO' ||
    snapshot.state === 'SEGUNDO_TEMPO' ||
    snapshot.state === 'SINCRONIZANDO'
      ? 'PAUSADO'
      : snapshot.state;

  return {
    currentTimeSeconds: snapshot.currentTimeSeconds,
    period: snapshot.period,
    state: nextState,
    isRunning: false,
    firstHalfLocked: snapshot.firstHalfLocked,
  };
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
  onSave?: (
    match: MatchRecord,
    options?: { source?: 'manual' | 'autosave'; saveAsIncomplete?: boolean }
  ) => void | MatchRecord | undefined | Promise<MatchRecord | undefined | void>;
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
  'Ataque', 'Contra Ataque', 'Defesa de goleiro linha', 'Ataque de Goleiro Linha', 'Vantagem Numérica - Goleiro', 'Vantagem Numérica - Expulsão', 'Escanteio', 'Laterais', 'Faltas', 'Tiro Livre', 'Pênalti', 'MARCAÇÃO ALTA',
];
const GOAL_METHODS_CONCEDED = [
  'Ataque', 'Contra Ataque', 'Defesa de goleiro linha', 'Ataque de Goleiro Linha', 'Vantagem Numérica - Goleiro', 'Vantagem Numérica - Expulsão', 'Escanteio', 'Laterais', 'Faltas', 'Tiro Livre', 'Pênalti', 'Perda de bola na primeira linha da defesa',
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
  'Vantagem Numérica - Goleiro': { icon: <UserRound size={16} />, bg: 'bg-sky-500/20', border: 'border-sky-500/50', hover: 'hover:bg-sky-600', text: 'text-sky-300 hover:text-white' },
  'Vantagem Numérica - Expulsão': { icon: <Zap size={16} />, bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', hover: 'hover:bg-fuchsia-600', text: 'text-fuchsia-300 hover:text-white' },
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
const TEAM_EVENT_FAKE_PLAYER_ID = 'TEAM_EVENT';
const TEAM_EVENT_FAKE_PLAYER_NAME = 'Equipe';

interface MatchEvent {
  id: string;
  type: 'pass' | 'shot' | 'foul' | 'goal' | 'card' | 'tackle' | 'save' | 'block' | 'corner' | 'freeKick' | 'penalty' | 'lateral';
  playerId?: string;
  playerName?: string;
  time: number; // segundos
  period: '1T' | '2T'; // Período em que ocorreu
  result?: 'correct' | 'wrong' | 'inside' | 'outside' | 'post' | 'blocked' | 'normal' | 'contra' | 'withBall' | 'withoutBall' | 'counter' | 'goal' | 'saved' | 'noGoal' | 'simple' | 'hard' | LateralResult;
  cardType?: 'yellow' | 'secondYellow' | 'red';
  cardTeam?: 'for' | 'against';
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
function inferCardTypeFromSubtype(subtipo?: string): MatchEvent['cardType'] | undefined {
  switch ((subtipo ?? '').trim()) {
    case 'Amarelo':
      return 'yellow';
    case 'Segundo Amarelo':
      return 'secondYellow';
    case 'Vermelho':
      return 'red';
    default:
      return undefined;
  }
}

function inferSetPieceResultFromSubtype(subtipo?: string): MatchEvent['result'] | undefined {
  switch ((subtipo ?? '').trim()) {
    case 'Gol':
      return 'goal';
    case 'Defendido':
      return 'saved';
    case 'Pra fora':
      return 'outside';
    case 'Trave':
      return 'post';
    case 'Não gol':
    case 'Nao gol':
      return 'noGoal';
    default:
      return undefined;
  }
}

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
        if (pe.subtipo === 'Pra fora') result = 'outside';
        else if (pe.subtipo === 'Simples' || pe.subtipo === 'DEFESA SIMPLES') result = 'simple';
        else if (pe.subtipo === 'Difícil') result = 'hard';
        break;
      case 'card':
        type = 'card';
        break;
      case 'block':
        type = 'block';
        break;
      case 'corner':
        type = 'corner';
        break;
      case 'freeKick':
        type = 'freeKick';
        result = inferSetPieceResultFromSubtype(pe.subtipo);
        break;
      case 'penalty':
        type = 'penalty';
        result = inferSetPieceResultFromSubtype(pe.subtipo);
        break;
      case 'lateral':
        type = 'lateral';
        break;
      case 'assist':
        type = 'goal';
        break;
      default:
        type = 'pass';
        result = 'correct';
    }

    const rawPlayerId = pe.playerId != null ? String(pe.playerId).trim() : '';
    const inferredOpponentEvent =
      (pe.action === 'goal' && (pe.isOpponentGoal === true || pe.subtipo === 'Contra')) ||
      (pe.action === 'card' && pe.cardTeam === 'against') ||
      ((pe.action === 'freeKick' || pe.action === 'penalty') && pe.isForUs === false);
    const playerId =
      rawPlayerId === OPPONENT_FAKE_PLAYER_ID
        ? OPPONENT_FAKE_PLAYER_ID
        : rawPlayerId || (inferredOpponentEvent ? OPPONENT_FAKE_PLAYER_ID : undefined);
    const playerName =
      pe.playerName ??
      (playerId === OPPONENT_FAKE_PLAYER_ID ? OPPONENT_FAKE_PLAYER_NAME : playerId ? playerById.get(playerId)?.name : undefined);

    const event: MatchEvent = {
      id: pe.id,
      type,
      time: timeSeconds,
      period: normalizedPeriod,
      tipo: pe.tipo,
      subtipo: pe.subtipo,
    };
    if (playerId) event.playerId = playerId;
    if (playerName) event.playerName = playerName;
    if (result !== undefined) event.result = result;
    if (type === 'save' && result) {
      event.details =
        result === 'outside' ? { saveOutcome: 'outside' } : { saveDifficulty: result as 'simple' | 'hard' };
    }
    if (type === 'card') {
      event.cardType = pe.cardType ?? inferCardTypeFromSubtype(pe.subtipo);
      event.cardTeam = pe.cardTeam ?? (playerId === OPPONENT_FAKE_PLAYER_ID ? 'against' : 'for');
    }
    if (pe.passToPlayerId) {
      event.passToPlayerId = String(pe.passToPlayerId).trim();
      event.passToPlayerName = pe.passToPlayerName ?? playerById.get(event.passToPlayerId)?.name;
    }
    if (pe.zone && zoneToResult[pe.zone]) event.result = zoneToResult[pe.zone];
    else if (pe.result) event.result = pe.result as MatchEvent['result'];
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
    if (type === 'freeKick' || type === 'penalty') {
      event.isForUs = pe.isForUs ?? playerId !== OPPONENT_FAKE_PLAYER_ID;
      if (pe.kickerId) event.kickerId = String(pe.kickerId).trim();
      if (pe.kickerName) event.kickerName = pe.kickerName;
    }
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
  /** Id gravado no servidor; após o 1º save substitui `temp-`/`sched-` para os próximos PUTs não criarem linhas novas. */
  const [persistedMatchId, setPersistedMatchId] = useState<string>(() => {
    const id = match?.id != null ? String(match.id).trim() : '';
    return isPersistedServerMatchId(id) ? id : '';
  });
  const persistedMatchIdRef = useRef<string>(isPersistedServerMatchId(match?.id != null ? String(match.id).trim() : '') ? String(match.id).trim() : '');
  const [lastPersistedSignature, setLastPersistedSignature] = useState<string>('');

  useEffect(() => {
    const id = match?.id != null ? String(match.id).trim() : '';
    if (isPersistedServerMatchId(id)) {
      setPersistedMatchId(id);
      persistedMatchIdRef.current = id;
    }
  }, [match.id]);

  const applySaveResult = useCallback((r: MatchRecord | undefined | void) => {
    if (r && typeof r === 'object' && r.id != null) {
      const sid = String(r.id).trim();
      if (sid) {
        persistedMatchIdRef.current = sid;
        setPersistedMatchId(sid);
      }
    }
  }, []);
  const commitPersistedSignature = useCallback((signature: string) => {
    lastAutosaveSignatureRef.current = signature;
    setLastPersistedSignature(signature);
  }, []);
  const [manualMinute, setManualMinute] = useState<number>(0); // postmatch: minuto absoluto 0–40 (20+ = 2º tempo)
  const [manualSecond, setManualSecond] = useState<number>(0); // postmatch: segundo 0–59
  /** Pós-jogo: 0:00 só abre popup «Informar tempo» se o usuário não escolheu 1º/2º no centro (ex.: após gol). */
  const [manualHalfPinned, setManualHalfPinned] = useState<boolean>(true);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
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
  const [goalStep, setGoalStep] = useState<'team' | 'author' | 'assist' | 'method' | 'time' | null>(null); // Fluxo inline do gol (tempo após método/assistência)
  const [pendingGoalMethod, setPendingGoalMethod] = useState<string | null>(null); // Método do gol (para nosso ou tomado)
  const [pendingAssistPlayerId, setPendingAssistPlayerId] = useState<string | null>(null); // ID do assistente (null = sem assistência)
  /** Tempo relativo à metade escolhida (0 … 20:59). */
  const [goalTimeRelSeconds, setGoalTimeRelSeconds] = useState(0);
  /** Dígitos crus (até 4) para o campo texto MM:SS no passo tempo do gol; ex.: "1856" → 18:56. */
  const [goalTimeDigits, setGoalTimeDigits] = useState('');
  /** Para «Voltar» no passo tempo: regressão ao método ou à assistência. */
  const [goalTimeReturnStep, setGoalTimeReturnStep] = useState<'method' | 'assist'>('method');
  
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
  const [requirePassReceiver, setRequirePassReceiver] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scout21_requirePassReceiver') === 'true';
    } catch {
      return false;
    }
  });
  
  // Estados para período e posse
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
  /** Elenco em quadra + banco: quem está “ativo” para a coleta (exatamente 5 quando trancado). */
  const [squadActiveIds, setSquadActiveIds] = useState<string[]>([]);
  /** Locker aberto = editando quem está ativo; fechado = inativos ficam cinza/desabilitados. */
  const [lockerOpen, setLockerOpen] = useState<boolean>(false);
  const [lockerDraftIds, setLockerDraftIds] = useState<string[]>([]);
  
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveInFlightRef = useRef<boolean>(false);
  const autosaveQueuedRef = useRef<boolean>(false);
  const autosaveSkipRef = useRef<boolean>(true);
  const lastAutosaveSignatureRef = useRef<string>('');
  const suppressBeforeUnloadRef = useRef<boolean>(false);
  /** Só hidrata do `match` uma vez por id enquanto a janela está aberta (evita refresh do pai sobrescrever lances locais). */
  const hydrationAppliedForMatchIdRef = useRef<string | null>(null);
  const lastSeenMatchIdForHydrationRef = useRef<string | null>(null);
  /** Evita que efeitos de `match`/`init` repõem 1T após «Encerrar coleta do 1º tempo» antes do servidor gravar `collectionPhase: 2`. */
  const userEndedFirstHalfCollectionRef = useRef(false);
  
  // Estados para confirmação de falta com zona
  const [showFoulConfirmation, setShowFoulConfirmation] = useState<boolean>(false);
  const [pendingFoulZone, setPendingFoulZone] = useState<'ataque' | 'defesa' | null>(null);

  // Tela de logs (eventos em tabela editável)
  const [showLogsView, setShowLogsView] = useState<boolean>(false);
  const [realtimeHydrationReady, setRealtimeHydrationReady] = useState<boolean>(isPostmatch);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ time: number; period: '1T' | '2T'; type: MatchEvent['type']; result?: MatchEvent['result']; cardType?: MatchEvent['cardType']; cardTeam?: 'for' | 'against'; foulTeam?: 'for' | 'against'; isOpponentGoal?: boolean; playerId?: string | null; playerName?: string | null; assistPlayerId?: string | null; assistPlayerName?: string | null } | null>(null);
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

  useEffect(() => {
    if (!isOpen) {
      setShowClockHelpPanel(false);
    }
  }, [isOpen]);

  // Novo fluxo: Ação → Detalhes (popup) → Jogador (lista lateral) → Tempo (popup se necessário)
  type ActionFlowStep = 'details' | 'wrongPassTransition' | 'player' | 'goalkeeper' | 'time' | null;
  const [actionFlow, setActionFlow] = useState<{
    step: ActionFlowStep;
    action: string | null;
    details: string | null;
    selectedPlayerId?: string | null;
    cardType?: 'yellow' | 'secondYellow' | 'red';
    cardTeam?: 'for' | 'against';
    foulTeam?: 'for' | 'against';
    zone?: LateralResult;
    pendingTime?: number;
    /** Passe errado: true = gerou transição, false = não gerou */
    wrongPassTransition?: boolean;
  } | null>(null);
  const [showPenaltyKickerSelection, setShowPenaltyKickerSelection] = useState<boolean>(false);
  const [showPenaltyResult, setShowPenaltyResult] = useState<boolean>(false);
  const [pendingPenaltyTeam, setPendingPenaltyTeam] = useState<'for' | 'against' | null>(null);
  const [pendingPenaltyKickerId, setPendingPenaltyKickerId] = useState<string | null>(null);

  const teamName = teams && teams.length > 0 ? teams[0].nome : 'Nossa Equipe';
  const hasSelectedPlayer = selectedPlayerId != null && String(selectedPlayerId).trim().length > 0;
  const shouldHighlightPlayerPanel = isMatchStarted && !hasSelectedPlayer;
  const selectedPlayer = hasSelectedPlayer
    ? players.find((p) => String(p.id).trim() === String(selectedPlayerId).trim()) ?? null
    : null;

  /** Aviso não bloqueante (ex.: canto superior direito). */
  const [topRightNotice, setTopRightNotice] = useState<string | null>(null);
  const [needsClockSyncFallback, setNeedsClockSyncFallback] = useState(false);
  useEffect(() => {
    if (!topRightNotice) return;
    const id = window.setTimeout(() => setTopRightNotice(null), 4500);
    return () => window.clearTimeout(id);
  }, [topRightNotice]);
  const {
    snapshot: clockSnapshot,
    formatTime,
    hydrateClock,
    iniciarPrimeiroTempo,
    pausar,
    pausarPorEvento,
    continuarPartida,
    encerrarPrimeiroTempo,
    iniciarSegundoTempo,
    encerrarPartida,
    retornarAoPrimeiroTempo,
    iniciarSincronizacao,
    confirmarSincronizacao,
    cancelarSincronizacao,
    getEventStamp: getOfficialEventStamp,
    isPausedByEvent,
    isSyncing,
    canRegisterRealtimeEvent,
  } = useMatchClock({ mode: isPostmatch ? 'postmatch' : 'realtime' });
  const matchTime = clockSnapshot.currentTimeSeconds;
  const currentPeriod = clockSnapshot.period;
  const isRunning = clockSnapshot.isRunning;
  const firstHalfLocked = clockSnapshot.firstHalfLocked;
  const isMatchEnded = clockSnapshot.state === 'ENCERRADO';
  const [showClockSyncModal, setShowClockSyncModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showClockHelpPanel, setShowClockHelpPanel] = useState(false);
  const [hasCompletedClockTour, setHasCompletedClockTour] = useState<boolean>(() =>
    readClockTourCompleted()
  );
  const [activeClockTourStepId, setActiveClockTourStepId] = useState<string | null>(null);
  const [isEndingMatch, setIsEndingMatch] = useState(false);
  const [syncMinuteInput, setSyncMinuteInput] = useState<string>('0');
  const [syncSecondInput, setSyncSecondInput] = useState<string>('00');
  const [syncValidationError, setSyncValidationError] = useState<string | null>(null);

  const normalizeUiLabel = useCallback((value: string): string => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }, []);

  const formatRecentEventAction = useCallback((event: MatchEvent): string => {
    if (event.type === 'goal') {
      return 'Gol';
    }

    const tipo = (event.tipo || 'Evento').trim();
    const subtipo = (event.subtipo || '').trim();

    if (!subtipo) return tipo;

    const tipoNorm = normalizeUiLabel(tipo);
    const subtipoNorm = normalizeUiLabel(subtipo);

    if (tipoNorm === subtipoNorm || subtipoNorm.startsWith(`${tipoNorm} `)) {
      return subtipo;
    }

    if (subtipoNorm === 'no gol') {
      return `${tipo} no gol`;
    }

    if (tipoNorm === 'finalizacao' && subtipoNorm === 'bloqueado') {
      return 'Finalização bloqueada';
    }

    return `${tipo} ${subtipo.charAt(0).toLowerCase()}${subtipo.slice(1)}`;
  }, [normalizeUiLabel]);

  const pauseClock = useCallback((options?: { silent?: boolean }) => {
    if (isPostmatch) return { ok: true };
    if (clockSnapshot.state === 'PAUSADO' && !clockSnapshot.isRunning) {
      return { ok: true };
    }
    const result = pausar();
    if (!options?.silent && !result.ok && result.error) setTopRightNotice(result.error);
    return result;
  }, [clockSnapshot.isRunning, clockSnapshot.state, isPostmatch, pausar]);

  const pauseClockForEvent = useCallback((options?: { silent?: boolean }) => {
    if (isPostmatch) return { ok: true };
    if (clockSnapshot.state === 'PAUSADO' && !clockSnapshot.isRunning && isPausedByEvent) {
      return { ok: true };
    }
    const result = pausarPorEvento();
    if (!options?.silent && !result.ok && result.error) setTopRightNotice(result.error);
    return result;
  }, [clockSnapshot.isRunning, clockSnapshot.state, isPausedByEvent, isPostmatch, pausarPorEvento]);

  const resumeClock = useCallback((options?: { silent?: boolean }) => {
    if (isPostmatch) return { ok: true };
    if (clockSnapshot.isRunning) {
      return { ok: true };
    }
    if (needsClockSyncFallback) {
      const syncResult = iniciarSincronizacao();
      if (syncResult.ok) {
        setSyncMinuteInput(String(Math.floor(matchTime / 60)));
        setSyncSecondInput(String(matchTime % 60).padStart(2, '0'));
        setSyncValidationError(null);
        setShowClockSyncModal(true);
      }
      setTopRightNotice('NecessÃ¡rio sincronizar relÃ³gio antes de retomar a partida.');
      return { ok: false, error: 'NecessÃ¡rio sincronizar relÃ³gio antes de retomar a partida.' };
    }
    const result = continuarPartida();
    if (!options?.silent && !result.ok && result.error) setTopRightNotice(result.error);
    return result;
  }, [clockSnapshot.isRunning, continuarPartida, iniciarSincronizacao, isPostmatch, matchTime, needsClockSyncFallback]);

  const applyClockDirective = useCallback((directive: ClockPauseDirective) => {
    if (directive === 'manual') pauseClock();
    if (directive === 'event') pauseClockForEvent();
  }, [pauseClock, pauseClockForEvent]);

  const applyEventClockBehavior = useCallback((type: MatchEvent['type'], result?: MatchEvent['result']) => {
    const rule = getMatchClockEventRule(type, typeof result === 'string' ? result : undefined);
    applyClockDirective(rule.pauseAfterRegister);
  }, [applyClockDirective]);

  const applyPreActionClockBehavior = useCallback((type: MatchEvent['type'], result?: MatchEvent['result']) => {
    const rule = getMatchClockEventRule(type, typeof result === 'string' ? result : undefined);
    applyClockDirective(rule.pauseBeforeFlow);
  }, [applyClockDirective]);

  const getClockStateLabel = useCallback((state: typeof clockSnapshot.state): string => {
    switch (state) {
      case 'PRE_JOGO':
        return 'PRE-JOGO';
      case 'PRIMEIRO_TEMPO':
        return 'PRIMEIRO TEMPO';
      case 'PAUSADO':
        return 'PAUSADO';
      case 'SINCRONIZANDO':
        return 'SINCRONIZANDO';
      case 'INTERVALO':
        return 'INTERVALO';
      case 'SEGUNDO_TEMPO':
        return 'SEGUNDO TEMPO';
      case 'ENCERRADO':
        return 'ENCERRADO';
      default:
        return state;
    }
  }, [clockSnapshot.state, needsClockSyncFallback]);

  const getRealtimeBlockMessage = useCallback((): string => {
    if (needsClockSyncFallback) {
      return 'NecessÃ¡rio sincronizar relÃ³gio. Esta partida nÃ£o possui snapshot temporal salvo.';
    }
    switch (clockSnapshot.state) {
      case 'PRE_JOGO':
        return 'Inicie a partida para liberar o registro de eventos.';
      case 'INTERVALO':
        return 'Inicie o segundo tempo para registrar eventos.';
      case 'SINCRONIZANDO':
        return 'Conclua ou cancele a sincronização antes de registrar novos eventos.';
      case 'ENCERRADO':
        return 'A partida foi encerrada. Use o fluxo de retorno já existente para editar.';
      case 'PAUSADO':
        return 'Retome a partida para continuar registrando eventos.';
      default:
        return 'O cronômetro precisa estar em andamento para registrar eventos.';
    }
  }, [clockSnapshot.state, needsClockSyncFallback]);

  const getCollectionStatusMessage = useCallback((): string => {
    if (isPostmatch) {
      return matchEvents.length >= 1
        ? 'Coleta pronta para finalização.'
        : 'Registre pelo menos um evento para finalizar a coleta.';
    }
    switch (clockSnapshot.state) {
      case 'PRE_JOGO':
        return 'Inicie a partida para liberar o registro e o salvamento da coleta.';
      case 'PRIMEIRO_TEMPO':
        return 'Conclua o primeiro tempo antes de finalizar a coleta.';
      case 'INTERVALO':
        return 'Inicie o segundo tempo para continuar a coleta.';
      case 'SEGUNDO_TEMPO':
        return 'Encerre a partida no cronômetro para liberar a finalização da coleta.';
      case 'PAUSADO':
        return currentPeriod === '2T'
          ? 'Retome ou encerre a partida para continuar.'
          : 'Retome a partida para continuar a coleta.';
      case 'SINCRONIZANDO':
        return 'Conclua ou cancele a sincronização antes de finalizar.';
      case 'ENCERRADO':
        return 'Partida encerrada. A coleta está pronta para finalização.';
      default:
        return 'Finalize a partida no cronômetro para concluir a coleta.';
    }
  }, [clockSnapshot.state, currentPeriod, isPostmatch, matchEvents.length, needsClockSyncFallback]);

  const blockRealtimeEventWhenNeeded = useCallback(() => {
    if (isPostmatch) return false;
    if (needsClockSyncFallback) {
      setTopRightNotice('Necessario sincronizar relogio. Esta partida nao possui snapshot temporal salvo.');
      return true;
    }
    if (canRegisterRealtimeEvent) return false;
    setTopRightNotice(getRealtimeBlockMessage());
    return true;
  }, [canRegisterRealtimeEvent, getRealtimeBlockMessage, isPostmatch, needsClockSyncFallback]);

  const openClockSyncModal = useCallback(() => {
    if (isPostmatch) return;
    const result = iniciarSincronizacao();
    if (!result.ok) {
      setTopRightNotice(result.error ?? 'Não foi possível abrir a sincronização do cronômetro.');
      return;
    }
    setSyncMinuteInput(String(Math.floor(matchTime / 60)));
    setSyncSecondInput(String(matchTime % 60).padStart(2, '0'));
    setSyncValidationError(null);
    setShowClockSyncModal(true);
  }, [iniciarSincronizacao, isPostmatch, matchTime]);

  const closeClockSyncModal = useCallback(() => {
    if (!isSyncing) {
      setShowClockSyncModal(false);
      setSyncValidationError(null);
      return;
    }
    const result = cancelarSincronizacao();
    if (!result.ok) {
      setTopRightNotice(result.error ?? 'Não foi possível cancelar a sincronização.');
      return;
    }
    setShowClockSyncModal(false);
    setSyncValidationError(null);
  }, [cancelarSincronizacao, isSyncing]);

  const handleConfirmClockSync = useCallback(() => {
    const minuteIsValid = /^\d+$/.test(syncMinuteInput.trim());
    const secondIsValid = /^\d+$/.test(syncSecondInput.trim());
    if (!minuteIsValid || !secondIsValid) {
      setSyncValidationError('Informe minuto e segundo usando apenas números inteiros.');
      return;
    }
    const minute = Number.parseInt(syncMinuteInput.trim(), 10);
    const second = Number.parseInt(syncSecondInput.trim(), 10);
    const result = confirmarSincronizacao(minute, second);
    if (!result.ok) {
      setSyncValidationError(result.error ?? 'Não foi possível sincronizar o cronômetro.');
      return;
    }
    setNeedsClockSyncFallback(false);
    setShowClockSyncModal(false);
    setSyncValidationError(null);
  }, [confirmarSincronizacao, syncMinuteInput, syncSecondInput]);

  useEffect(() => {
    if (!showClockSyncModal && !isSyncing) return;
    if (showClockSyncModal && !isSyncing) {
      setShowClockSyncModal(false);
      setSyncValidationError(null);
    }
  }, [isSyncing, showClockSyncModal]);
  
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
        if (result === 'simple') return { tipo: 'Defesa', subtipo: 'DEFESA SIMPLES' };
        if (result === 'hard') return { tipo: 'Defesa', subtipo: 'Difícil' };
        if (result === 'outside') return { tipo: 'Defesa', subtipo: 'Pra fora' };
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

  const startActionFlow = (action: string, preSelectedPlayerId?: string | null) => {
    const cleanSelectedPlayerId = preSelectedPlayerId != null ? String(preSelectedPlayerId).trim() : '';
    const flow = {
      step: needsDetails(action) ? 'details' as const : 'player' as const,
      action,
      details: null as string | null,
      selectedPlayerId: cleanSelectedPlayerId.length > 0 ? cleanSelectedPlayerId : undefined,
    };

    // Escanteio e Lateral: após detalhes, jogador só pela lista à esquerda
    if ((action === 'lateral' || action === 'corner' || action === 'block') && flow.selectedPlayerId) {
      executeActionFlow({ ...flow, step: 'details' as const }, flow.selectedPlayerId);
      return;
    }

    setActionFlow(flow as any);
  };

  const advanceActionFlowToPlayer = (details: string | null, extra?: { cardType?: 'yellow' | 'secondYellow' | 'red'; cardTeam?: 'for' | 'against'; foulTeam?: 'for' | 'against'; zone?: LateralResult; wrongPassTransition?: boolean }) => {
    if (!actionFlow) return;
    const openTimeOrExecuteAgainstEvent = (
      nextFlow: NonNullable<typeof actionFlow>,
      playerId: string
    ) => {
      if (needsTimePopup()) {
        setActionFlow({
          ...nextFlow,
          step: 'time' as const,
          selectedPlayerId: playerId,
          pendingTime: getTimeForEvent() ?? matchTime ?? 0,
        });
        return;
      }
      executeActionFlow(nextFlow, playerId);
    };
    // Falta do adversário: só contabiliza; não abre popup com lista dos nossos jogadores
    if (actionFlow.action === 'foul' && extra?.foulTeam === 'against') {
      openTimeOrExecuteAgainstEvent(
        { ...actionFlow, step: 'details', details, foulTeam: 'against', ...extra },
        OPPONENT_FAKE_PLAYER_ID
      );
      return;
    }
    if (actionFlow.action === 'card' && extra?.cardTeam === 'against') {
      openTimeOrExecuteAgainstEvent(
        { ...actionFlow, step: 'details', details, cardTeam: 'against', ...extra },
        OPPONENT_FAKE_PLAYER_ID
      );
      return;
    }
    if (
      ballPossessionNow === 'sem' &&
      (actionFlow.action === 'tackle' || actionFlow.action === 'save') &&
      (actionFlow.selectedPlayerId == null || String(actionFlow.selectedPlayerId).trim().length === 0)
    ) {
      executeActionFlow({ ...actionFlow, step: 'details', details, ...extra }, TEAM_EVENT_FAKE_PLAYER_ID);
      return;
    }
    const pid = actionFlow.selectedPlayerId != null ? String(actionFlow.selectedPlayerId).trim() : '';
    const nextFlow = { ...actionFlow, details, ...extra };
    if (pid.length > 0) {
      if (needsTimePopup()) {
        setActionFlow({ ...nextFlow, step: 'time' as const, pendingTime: getTimeForEvent() ?? matchTime ?? 0, selectedPlayerId: pid });
      } else {
        executeActionFlow({ ...nextFlow, step: 'details' as const, selectedPlayerId: pid }, pid);
      }
      return;
    }
    setActionFlow({ ...nextFlow, step: 'player' as const });
  };

  /** Escolha de jogador no fluxo actionFlow (lista lateral). */
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

  const needsTimePopup = (): boolean => isPostmatch;

  /** Tempo relativo à metade + period técnico; pós-jogo: `rawSeconds` é minuto absoluto 0–40. */
  const eventTimeAndPeriod = (rawSeconds: number, periodOverride?: MatchHalf): { time: number; period: MatchHalf } => {
    return getOfficialEventStamp(rawSeconds, periodOverride);
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
          handleRegisterCard(flow.cardType ?? 'yellow', playerId, rawT, periodOverride, flow.cardTeam ?? 'for');
          break;
        case 'save':
          handleRegisterSave(flow.details as 'simple' | 'hard' | 'outside', playerId, rawT, periodOverride);
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

  /** Após Defesa fácil/difícil/pra fora: goleiro pela lista lateral; pós-jogo sem tempo abre o passo `time`. */
  const completeSaveAfterGoalkeeperPick = (flow: NonNullable<typeof actionFlow>, gkId: string) => {
    if (
      flow.action !== 'save' ||
      (flow.details !== 'simple' && flow.details !== 'hard' && flow.details !== 'outside')
    ) {
      return;
    }
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
      case 'save':
        return [
          { value: 'DEFESA SIMPLES', result: 'simple' },
          { value: 'Difícil', result: 'hard' },
          { value: 'Pra fora', result: 'outside' },
        ];
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

  /** Pós-jogo: após escolher método (ou assistência), abre o passo manual de tempo. */
  const enterGoalTimeStep = useCallback((from: 'method' | 'assist') => {
    if (!isPostmatch) return;
    setGoalTimeReturnStep(from);
    setGoalTimeRelSeconds(0);
    setGoalTimeDigits('');
    setGoalStep('time');
  }, [isPostmatch]);

  useEffect(() => {
    userEndedFirstHalfCollectionRef.current = false;
  }, [match?.id]);

  // Pós-jogo: os campos manuais continuam no UI, mas o estado oficial do relógio passa pelo ClockService.
  useEffect(() => {
    if (!isPostmatch) return;
    const snapshot = hydrateClock({
      seconds: manualMinute * 60 + manualSecond,
      firstHalfLocked,
      isRunning: false,
    });
    const nextMinute = Math.floor(snapshot.currentTimeSeconds / 60);
    const nextSecond = snapshot.currentTimeSeconds % 60;
    if (nextMinute !== manualMinute) setManualMinute(nextMinute);
    if (nextSecond !== manualSecond) setManualSecond(nextSecond);
  }, [firstHalfLocked, hydrateClock, isPostmatch, manualMinute, manualSecond]);

  // Inicializar modal de escalação quando janela abrir (apenas realtime)
  useEffect(() => {
    if (!isOpen) return;
    if (isPostmatch) {
      if (match.collectionPhase === 2) {
        userEndedFirstHalfCollectionRef.current = false;
        setManualMinute(20);
        setManualSecond(0);
        setManualHalfPinned(true);
        hydrateClock({ seconds: REGULATION_HALF_SECONDS, firstHalfLocked: true, state: 'SEGUNDO_TEMPO', isRunning: false });
      } else if (userEndedFirstHalfCollectionRef.current) {
        setManualMinute(20);
        setManualSecond(0);
        setManualHalfPinned(true);
        hydrateClock({ seconds: REGULATION_HALF_SECONDS, firstHalfLocked: true, state: 'SEGUNDO_TEMPO', isRunning: false });
      } else {
        setManualMinute(0);
        setManualSecond(0);
        setManualHalfPinned(false);
        hydrateClock({ seconds: 0, firstHalfLocked: false, state: 'PRIMEIRO_TEMPO', isRunning: false });
      }
      // Postmatch: pular lineup, usar selectedPlayerIds como jogadores ativos
      const ids = selectedPlayerIds && selectedPlayerIds.length > 0
        ? selectedPlayerIds
        : players.map(p => String(p.id).trim());
      setActivePlayers(players.filter(p => ids.includes(String(p.id).trim())));
      setLineupPlayers(ids);
      setBenchPlayers([]);
      setSquadActiveIds(ids);
      setIsMatchStarted(true);
      setShowLineupModal(false);
      // Definir goleiro atual: primeiro goleiro na lista de ativos, ou primeiro da lista
      if (ids.length > 0) {
        const gkId = ids.find(id => players.find(p => String(p.id).trim() === id)?.position === 'Goleiro') ?? ids[0];
        setCurrentGoalkeeperId(gkId);
      }
      return;
    }
    if (!realtimeHydrationReady) return;
    if (!isMatchStarted && !showLineupModal) {
      const Lm = match.lineup;
      if (
        Lm &&
        Array.isArray(Lm.players) &&
        Lm.players.length === 5 &&
        Boolean(Lm.ballPossessionStart)
      ) {
        return;
      }
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
  }, [hydrateClock, isOpen, isMatchStarted, isPostmatch, realtimeHydrationReady, selectedPlayerIds, players, match?.collectionPhase, match?.id, match?.lineup]);

  // Jogadores ativos na coleta = só após trancar o locker com 5 IDs; sem ativos = ninguém selecionável na coleta
  useEffect(() => {
    if (!isOpen || isPostmatch) return;
    if (squadActiveIds.length === 0) {
      setActivePlayers([]);
      return;
    }
    if (!players?.length) {
      setActivePlayers([]);
      return;
    }
    const active = squadActiveIds
      .map(id => players.find(p => String(p.id).trim() === id))
      .filter((p): p is Player => p != null);
    setActivePlayers(active);
  }, [isOpen, isPostmatch, players, squadActiveIds]);

  const allSquadPlayers = useMemo(() => {
    const ids = [...new Set([...lineupPlayers, ...benchPlayers])];
    const list = ids
      .map(id => players.find(p => String(p.id).trim() === id))
      .filter((p): p is Player => p != null);
    return [...list].sort((a, b) => {
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
      return (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0);
    });
  }, [lineupPlayers, benchPlayers, players, currentGoalkeeperId]);

  const isLineupGoalkeeperId = (id: string) =>
    players.find((p) => String(p.id).trim() === id)?.position === 'Goleiro';

  /** Rascunho do locker: dedupe e no máx. 1 goleiro (mesma regra do botão Ativos). */
  const sanitizeLockerDraftIds = useCallback((raw: string[]) => {
    const deduped = [...new Set(raw.map((id) => String(id).trim()).filter(Boolean))];
    let gkKept = false;
    return deduped.filter((id) => {
      if (!isLineupGoalkeeperId(id)) return true;
      if (gkKept) return false;
      gkKept = true;
      return true;
    });
  }, [players]);

  /** Locker lateral: no máximo 1 jogador com posição Goleiro; ao escolher outro goleiro, substitui o anterior. */
  const toggleLockerDraft = (playerId: string) => {
    if (checkPlayerExpulsion(playerId)) return;
    setLockerDraftIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((x) => x !== playerId);
      const addingGk = isLineupGoalkeeperId(playerId);
      if (addingGk) {
        const withoutOtherGoalkeepers = prev.filter((id) => !isLineupGoalkeeperId(id));
        if (withoutOtherGoalkeepers.length >= 5) return prev;
        return [...withoutOtherGoalkeepers, playerId];
      }
      if (prev.length >= 5) return prev;
      return [...prev, playerId];
    });
  };

  // Cronômetro e acúmulo de tempo com/sem posse
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isMatchEnded) {
      interval = setInterval(() => {
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

  // Recalcular placar e faltas a partir de matchEvents (usado após edição na tela de logs)
  const recalcGoalsAndFoulsFromEvents = (events: MatchEvent[]) => {
    let goalsForCalc = 0;
    let goalsAgainstCalc = 0;
    let foulsForCalc = 0;
    let foulsAgainstCalc = 0;
    for (const e of events) {
      const isSetPieceGoal = (e.type === 'freeKick' || e.type === 'penalty') && e.result === 'goal';
      if (e.type === 'goal' || isSetPieceGoal) {
        const isOpponentScore =
          e.type === 'goal'
            ? (e.isOpponentGoal || e.result === 'contra')
            : (e.isForUs === false || e.playerId === OPPONENT_FAKE_PLAYER_ID);
        if (isOpponentScore) goalsAgainstCalc += 1;
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
  /** Goleiros em quadra após Defesa fácil/difícil (titulares + goleiro linha ativo; fallback: todos em quadra). */
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

  // Carregar log de lances e escalação ao abrir (incompleto: salvar/reabrir lineup + postMatchEventLog)
  useEffect(() => {
    if (!isOpen) {
      setNeedsClockSyncFallback(false);
      setRealtimeHydrationReady(isPostmatch);
      hydrationAppliedForMatchIdRef.current = null;
      lastSeenMatchIdForHydrationRef.current = null;
      return;
    }
    if (!isPostmatch) {
      setRealtimeHydrationReady(false);
    }
    const mid = String(match?.id ?? '').trim();
    if (lastSeenMatchIdForHydrationRef.current !== null && lastSeenMatchIdForHydrationRef.current !== mid) {
      hydrationAppliedForMatchIdRef.current = null;
    }
    lastSeenMatchIdForHydrationRef.current = mid;

    if (hydrationAppliedForMatchIdRef.current === mid && mid !== '') {
      if (!isPostmatch) setRealtimeHydrationReady(true);
      return;
    }

    const log = match.postMatchEventLog;
    const hasLog = log != null && log.length > 0;
    const L = match.lineup;
    const hasLineupData =
      L != null &&
      ((Array.isArray(L.players) && L.players.length > 0) ||
        (Array.isArray(L.selectedPlayerIds) && L.selectedPlayerIds.length > 0) ||
        (Array.isArray(L.bench) && L.bench.length > 0));

    if (!hasLog && !hasLineupData) {
      // The first postmatch opening can start from a fully empty QA fixture.
      // Mark hydration as consumed for this match so later autosave prop updates
      // do not wipe the in-flight local event list back to an empty snapshot.
      setNeedsClockSyncFallback(false);
      hydrationAppliedForMatchIdRef.current = mid;
      if (!isPostmatch) setRealtimeHydrationReady(true);
      return;
    }

    hydrationAppliedForMatchIdRef.current = mid;

    let converted: MatchEvent[] = [];
    if (hasLog) {
      converted = postMatchEventLogToMatchEvents(log, players);
      setMatchEvents(converted);
      recalcGoalsAndFoulsFromEvents(converted);
    } else {
      setMatchEvents([]);
      recalcGoalsAndFoulsFromEvents([]);
    }

    const has2TEvent = converted.some((e) => e.period === '2T');
    const hasPossessionProgress =
      ((match.possessionSecondsWith ?? 0) + (match.possessionSecondsWithout ?? 0)) > 0;
    const persistedClockSnapshot = normalizePersistedClockSnapshot(match.lineup?.clockSnapshot);
    const phase = match.collectionPhase;
    if (phase === 2) {
      userEndedFirstHalfCollectionRef.current = false;
    }
    const inSecondHalf =
      phase === 2 || (phase === undefined && has2TEvent) || userEndedFirstHalfCollectionRef.current;

    if (!isPostmatch) {
      if (hasLineupData && L) {
        setLineupPlayers(L.players ?? []);
        setBenchPlayers(L.bench ?? []);
        if (L.ballPossessionStart) {
          setBallPossessionStart(L.ballPossessionStart);
        }
        const tit = (L.players ?? []).filter(Boolean);
        if (tit.length === 5 && L.ballPossessionStart) {
          setIsMatchStarted(true);
          setShowLineupModal(false);
          setCurrentGoalkeeperId(tit[0]);
          setBallPossessionNow(L.ballPossessionStart === 'us' ? 'com' : 'sem');
          setSquadActiveIds(tit);
        } else if (hasLog) {
          setIsMatchStarted(true);
          setShowLineupModal(false);
          setSquadActiveIds(tit.length > 0 && tit.length <= 5 ? tit : []);
          if (tit[0]) setCurrentGoalkeeperId(tit[0]);
        } else {
          setIsMatchStarted(false);
          setShowLineupModal(true);
          setSquadActiveIds([]);
        }
      } else if (hasLog && L) {
        setLineupPlayers(L.players ?? []);
        setBenchPlayers(L.bench ?? []);
        if (L.ballPossessionStart) {
          setBallPossessionStart(L.ballPossessionStart);
          setBallPossessionNow(L.ballPossessionStart === 'us' ? 'com' : 'sem');
        }
        setIsMatchStarted(true);
        setShowLineupModal(false);
        const titFb = (L.players ?? []).filter(Boolean);
        setSquadActiveIds(titFb.length > 0 && titFb.length <= 5 ? titFb : []);
        if (titFb[0]) setCurrentGoalkeeperId(titFb[0]);
      }
      setSubstitutionHistory(match.substitutionHistory ?? []);
      if (persistedClockSnapshot) {
        setNeedsClockSyncFallback(false);
        hydrateClock({
          seconds: persistedClockSnapshot.currentTimeSeconds,
          period: persistedClockSnapshot.period,
          firstHalfLocked: persistedClockSnapshot.firstHalfLocked,
          state: persistedClockSnapshot.state,
          isRunning: false,
        });
      } else if (hasLog && inSecondHalf) {
        setNeedsClockSyncFallback(true);
        hydrateClock({ seconds: 0, period: '2T', firstHalfLocked: true, state: 'PAUSADO', isRunning: false });
      } else if (hasLog && !inSecondHalf) {
        setNeedsClockSyncFallback(true);
        hydrateClock({ seconds: 0, period: '1T', firstHalfLocked: false, state: 'PAUSADO', isRunning: false });
      } else if (!hasLog && inSecondHalf) {
        setNeedsClockSyncFallback(true);
        hydrateClock({ seconds: 0, period: '2T', firstHalfLocked: true, state: 'PAUSADO', isRunning: false });
      } else if (!hasLog && hasPossessionProgress) {
        setNeedsClockSyncFallback(true);
        hydrateClock({ seconds: 0, period: '1T', firstHalfLocked: false, state: 'PAUSADO', isRunning: false });
      } else if (!hasLog && !inSecondHalf) {
        setNeedsClockSyncFallback(false);
        hydrateClock({ seconds: 0, period: '1T', firstHalfLocked: false, state: 'PRE_JOGO', isRunning: false });
      }
    } else if (inSecondHalf) {
      setNeedsClockSyncFallback(false);
      setManualMinute(20);
      setManualSecond(0);
      setManualHalfPinned(true);
      hydrateClock({ seconds: REGULATION_HALF_SECONDS, firstHalfLocked: true, state: 'SEGUNDO_TEMPO', isRunning: false });
    } else {
      setNeedsClockSyncFallback(false);
    }
    autosaveSkipRef.current = true;
    setTimeout(() => {
      autosaveSkipRef.current = false;
      try {
        const initialSnapshot = JSON.stringify(buildMatchSnapshot('em_andamento'));
        commitPersistedSignature(initialSnapshot);
      } catch (_) {}
      if (!isPostmatch) {
        setRealtimeHydrationReady(true);
      }
    }, 0);
  }, [commitPersistedSignature, hydrateClock, isOpen, isPostmatch, match?.id, match?.postMatchEventLog, match?.lineup, match?.substitutionHistory, match?.collectionPhase, players]);

  // Toggle cronômetro
  // Encerrar tempo (primeira metade → modal de intervalo; segunda metade → fim de jogo)
  const handleEndTime = () => {
    if (matchTime >= REGULATION_HALF_SECONDS) {
      if (currentPeriod === '1T') {
        const result = encerrarPrimeiroTempo();
        if (!result.ok) {
          setTopRightNotice(result.error ?? 'Nao foi possivel encerrar o primeiro tempo.');
          return;
        }
        setShowIntervalAnalysis(true);
      } else {
        const result = encerrarPartida();
        if (!result.ok && result.error) {
          setTopRightNotice(result.error);
        }
      }
    }
  };
  
  /** Segundo tempo no ao vivo: cronômetro zera, posse inverte (mesmo após intervalo ou após “encerrar coleta 1º tempo”). */
  const applySecondHalfRealtime = () => {
    const result = iniciarSegundoTempo();
    if (!result.ok) {
      setTopRightNotice(result.error ?? 'Nao foi possivel iniciar o segundo tempo.');
      return;
    }
    setShowIntervalAnalysis(false);
    setBallPossessionNow(ballPossessionStart === 'us' ? 'sem' : 'com');
  };

  const handleStartSecondHalf = () => {
    if (needsClockSyncFallback) {
      const result = iniciarSincronizacao();
      if (result.ok) {
        setSyncMinuteInput(String(Math.floor(matchTime / 60)));
        setSyncSecondInput(String(matchTime % 60).padStart(2, '0'));
        setSyncValidationError(null);
        setShowClockSyncModal(true);
      }
      setTopRightNotice('Necessario sincronizar relogio antes de continuar a partida.');
      return;
    }
    applySecondHalfRealtime();
  };

  const handleEndMatchRealtime = () => {
    if (isPostmatch || currentPeriod !== '2T' || isMatchEnded) return;
    setShowEndMatchModal(true);
  };

  const handleCancelEndMatchModal = () => {
    if (isEndingMatch) return;
    setShowEndMatchModal(false);
  };

  const handleConfirmEndMatchRealtime = () => {
    if (isEndingMatch) return;
    setIsEndingMatch(true);
    const result = encerrarPartida();
    if (!result.ok) {
      setTopRightNotice(result.error ?? 'Não foi possível encerrar a partida.');
      setIsEndingMatch(false);
      return;
    }
    setShowEndMatchModal(false);
    setIsEndingMatch(false);
  };

  /** Encerra a coleta do 1º tempo: ativa 2º tempo; faltas exibidas passam a ser as do 2T (novos lances entram como 2T). */
  const handleEndFirstHalfCollection = () => {
    if (currentPeriod !== '1T') return;
    if (isPostmatch) {
      userEndedFirstHalfCollectionRef.current = true;
      flushSync(() => {
        setManualMinute(20);
        setManualSecond(0);
        setManualHalfPinned(true);
        hydrateClock({ seconds: REGULATION_HALF_SECONDS, firstHalfLocked: true, state: 'SEGUNDO_TEMPO', isRunning: false });
      });
    } else {
      const result = encerrarPrimeiroTempo();
      if (!result.ok) {
        if (result.error) setTopRightNotice(result.error);
        return;
      }
      userEndedFirstHalfCollectionRef.current = true;
      flushSync(() => {
        setShowIntervalAnalysis(true);
      });
    }
    if (onSave && isOpen) {
      setTimeout(() => {
        try {
          autosaveSkipRef.current = false;
          const snap = buildMatchSnapshot('em_andamento');
          void Promise.resolve(onSave(snap, { source: 'autosave' })).then((r: MatchRecord | undefined | void) => {
            applySaveResult(r);
            commitPersistedSignature(JSON.stringify(snap));
          });
        } catch (_) {
          /* noop */
        }
      }, 0);
    }
  };

  /** Volta a coletar no 1º tempo (edição/correção); novos lances passam a ser 1T até encerrar de novo. */
  const handleReturnToFirstHalfCollection = () => {
    if (currentPeriod !== '2T') return;
    if (
      !window.confirm(
        'Voltar ao 1º tempo? O relógio de coleta será reiniciado para 0:00 no 1º tempo. Novos eventos serão registrados no 1º tempo.'
      )
    ) {
      return;
    }
    if (isPostmatch) {
      flushSync(() => {
        setManualMinute(0);
        setManualSecond(0);
        setManualHalfPinned(false);
      });
    }
    const result = retornarAoPrimeiroTempo();
    if (!result.ok) {
      if (result.error) setTopRightNotice(result.error);
      return;
    }
    userEndedFirstHalfCollectionRef.current = false;
    if (!isPostmatch) {
      setShowIntervalAnalysis(false);
    }
    if (onSave && isOpen) {
      setTimeout(() => {
        try {
          autosaveSkipRef.current = false;
          const snap = buildMatchSnapshot('em_andamento');
          void Promise.resolve(onSave(snap, { source: 'autosave' })).then((r: MatchRecord | undefined | void) => {
            applySaveResult(r);
            commitPersistedSignature(JSON.stringify(snap));
          });
        } catch (_) {
          /* noop */
        }
      }, 0);
    }
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
      case 'card': return 'card';
      case 'block': return 'block';
      case 'corner': return 'corner';
      case 'freeKick': return 'freeKick';
      case 'penalty': return 'penalty';
      case 'lateral': return 'lateral';
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

      if (action === 'card') {
        if (e.cardTeam !== 'against' && playerId !== OPPONENT_FAKE_PLAYER_ID) {
          if (e.cardType === 'yellow') {
            ps.yellowCards = (ps.yellowCards ?? 0) + 1;
          } else if (e.cardType === 'secondYellow') {
            ps.yellowCards = (ps.yellowCards ?? 0) + 1;
            ps.redCards = (ps.redCards ?? 0) + 1;
          } else if (e.cardType === 'red') {
            ps.redCards = (ps.redCards ?? 0) + 1;
          }
        }
      }

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
      } else if (action === 'freeKick' || action === 'penalty') {
        const isForUs = e.isForUs !== false && playerId !== OPPONENT_FAKE_PLAYER_ID;
        if (e.result === 'goal') {
          const setPieceMethod = action === 'freeKick' ? 'Tiro Livre' : 'Pênalti';
          if (isForUs) {
            ps.goals += 1;
            teamStats.goals += 1;
            goalsFor += 1;
            goalTimes.push({
              time: `${timeStr} (${e.period})`,
              method: setPieceMethod,
            });
          } else {
            goalsAgainst += 1;
            teamStats.goalsConceded = (teamStats.goalsConceded ?? 0) + 1;
            goalsConcededTimes.push({
              time: `${timeStr} (${e.period})`,
              method: setPieceMethod,
            });
          }
        }
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
      if (e.result) postEvent.result = e.result;
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
      if (action === 'card') {
        postEvent.cardType = e.cardType;
        postEvent.cardTeam = e.cardTeam;
      }
      if (action === 'falta') postEvent.foulTeam = e.foulTeam;
      if (action === 'freeKick' || action === 'penalty') {
        postEvent.isForUs = e.isForUs;
        if (e.kickerId) postEvent.kickerId = String(e.kickerId).trim();
        if (e.kickerName) postEvent.kickerName = e.kickerName;
      }
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
    const snapshotId = persistedMatchIdRef.current.length > 0 ? persistedMatchIdRef.current : match.id;
    return {
      id: snapshotId,
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
    savedMatch.collectionPhase = clockSnapshot.state === 'PRE_JOGO' ? 0 : currentPeriod === '1T' ? 1 : 2;
    const persistedClockSnapshot = !isPostmatch ? buildPersistedClockSnapshot(clockSnapshot) : undefined;

    const squadIds = [
      ...new Set(
        [
          ...lineupPlayers.map((id) => String(id).trim()),
          ...benchPlayers.map((id) => String(id).trim()),
          ...(selectedPlayerIds || []).map((id) => String(id).trim()),
          ...(match.lineup?.selectedPlayerIds || []).map((id) => String(id).trim()),
        ].filter(Boolean)
      ),
    ];

    if (!isPostmatch) {
      if (lineupPlayers.length > 0 && ballPossessionStart) {
        savedMatch.lineup = {
          players: lineupPlayers,
          bench: benchPlayers,
          ballPossessionStart,
          ...(persistedClockSnapshot ? { clockSnapshot: persistedClockSnapshot } : {}),
          ...(squadIds.length > 0 ? { selectedPlayerIds: squadIds } : {}),
        };
      } else if (squadIds.length > 0) {
        savedMatch.lineup = {
          players: [],
          bench: [],
          ballPossessionStart: 'us',
          ...(persistedClockSnapshot ? { clockSnapshot: persistedClockSnapshot } : {}),
          selectedPlayerIds: squadIds,
        };
      }
      savedMatch.substitutionHistory = substitutionHistory.length > 0 ? substitutionHistory : undefined;
      savedMatch.possessionSecondsWith = possessionSecondsWith;
      savedMatch.possessionSecondsWithout = possessionSecondsWithout;
    } else if (squadIds.length > 0) {
      savedMatch.lineup = {
        players: lineupPlayers,
        bench: benchPlayers,
        ballPossessionStart: ballPossessionStart ?? 'us',
        selectedPlayerIds: squadIds,
      };
    }

    return savedMatch;
  };

  const hasEvents = matchEvents.length > 0;
  const hasRealtimeLineupDraft =
    !isPostmatch &&
    isMatchStarted &&
    lineupPlayers.length === 5 &&
    ballPossessionStart != null;
  const squadIdsForDraft = [
    ...new Set(
      [
        ...lineupPlayers.map((id) => String(id).trim()),
        ...benchPlayers.map((id) => String(id).trim()),
        ...(selectedPlayerIds || []).map((id) => String(id).trim()),
        ...(match.lineup?.selectedPlayerIds || []).map((id) => String(id).trim()),
      ].filter(Boolean)
    ),
  ];
  const hasPostmatchSquad = isPostmatch && squadIdsForDraft.length > 0;
  const persistableDraftSignature = useMemo(() => {
    if (!isOpen || !onSave) return null;
    if (!isPostmatch && !realtimeHydrationReady) return null;
    if (!isPostmatch && !isMatchStarted) return null;
    if (!hasEvents && !hasRealtimeLineupDraft && !hasPostmatchSquad) return null;
    try {
      return JSON.stringify(buildMatchSnapshot('em_andamento'));
    } catch {
      return null;
    }
  }, [
    ballPossessionStart,
    benchPlayers,
    currentPeriod,
    hasEvents,
    hasPostmatchSquad,
    hasRealtimeLineupDraft,
    isMatchStarted,
    isOpen,
    isPostmatch,
    lineupPlayers,
    match.lineup?.selectedPlayerIds,
    matchEvents,
    onSave,
    possessionSecondsWith,
    possessionSecondsWithout,
    realtimeHydrationReady,
    selectedPlayerIds,
    substitutionHistory,
  ]);
  const hasPendingSnapshotChanges =
    persistableDraftSignature !== null &&
    persistableDraftSignature !== lastPersistedSignature;
  const hasUnsavedChanges = Boolean(
    editingEventId ||
      editDraft ||
      autosaveInFlightRef.current ||
      autosaveQueuedRef.current ||
      hasPendingSnapshotChanges
  );

  const saveSilently = async () => {
    if (suppressBeforeUnloadRef.current) return;
    if (!onSave || !isOpen || autosaveSkipRef.current) return;
    if (!isPostmatch && !isMatchStarted) return;
    if (!hasEvents && !hasRealtimeLineupDraft && !hasPostmatchSquad) return;

    const snapshot = buildMatchSnapshot('em_andamento');
    const signature = JSON.stringify(snapshot);
    if (signature === lastAutosaveSignatureRef.current) return;

    if (autosaveInFlightRef.current) {
      autosaveQueuedRef.current = true;
      return;
    }

    autosaveInFlightRef.current = true;
    try {
      const saveResult = await onSave(snapshot, { source: 'autosave' });
      applySaveResult(saveResult);
      commitPersistedSignature(signature);
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

  /** Espera o autosave em curso terminar para evitar corrida com save manual (duplicata / last-write). */
  const waitForAutosaveIdle = useCallback(async (maxMs = 8000) => {
    const t0 = Date.now();
    while (autosaveInFlightRef.current) {
      if (Date.now() - t0 > maxMs) break;
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }, []);

  const stopAutosaveSchedulers = useCallback(() => {
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
      autosaveDebounceRef.current = null;
    }
    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current);
      autosaveIntervalRef.current = null;
    }
    autosaveQueuedRef.current = false;
  }, []);

  // Finalizar coleta (status = encerrado, mas editável depois)
  const handleEndCollection = async () => {
    const canEnd = isPostmatch ? matchEvents.length >= 1 : isMatchEnded;
    if (!canEnd) return;
    if (!window.confirm('Tem certeza que deseja finalizar a coleta?')) return;

    suppressBeforeUnloadRef.current = true;
    autosaveSkipRef.current = true;
    stopAutosaveSchedulers();
    await waitForAutosaveIdle();

    if (isPostmatch && onSave) {
      const savedMatch = buildMatchSnapshot('encerrado');
      applySaveResult(await onSave(savedMatch, { source: 'manual' }));
      commitPersistedSignature(JSON.stringify(savedMatch));
      onClose();
      return;
    }

    if (substitutionHistory.length > 0) {
      updateSubstitutionFrequency(substitutionHistory);
    }
    if (onSave) {
      const savedMatch = buildMatchSnapshot('encerrado');
      applySaveResult(await onSave(savedMatch, { source: 'manual' }));
      commitPersistedSignature(JSON.stringify(savedMatch));
    }
    onClose();
  };

  // Guardar como incompleto (status = em_andamento)
  const handleSaveLater = async () => {
    const hasRealtimeLineupOnly =
      !isPostmatch &&
      isMatchStarted &&
      lineupPlayers.length === 5 &&
      ballPossessionStart != null;
    if (matchEvents.length === 0 && !isPostmatch && !hasRealtimeLineupOnly) {
      suppressBeforeUnloadRef.current = true;
      onClose();
      return;
    }

    suppressBeforeUnloadRef.current = true;
    autosaveSkipRef.current = true;
    stopAutosaveSchedulers();
    await waitForAutosaveIdle();

    if (onSave) {
      const savedMatch = buildMatchSnapshot('em_andamento');
      applySaveResult(
        await onSave(savedMatch, { source: 'manual', saveAsIncomplete: true })
      );
      commitPersistedSignature(JSON.stringify(savedMatch));
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (autosaveSkipRef.current) return;
    if (!isPostmatch && !isMatchStarted) return;
    if (!hasEvents && !hasRealtimeLineupDraft && !hasPostmatchSquad) return;

    if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    autosaveDebounceRef.current = setTimeout(() => {
      void saveSilently();
    }, 800);

    return () => {
      if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    };
  }, [
    hasEvents,
    hasPostmatchSquad,
    hasRealtimeLineupDraft,
    isOpen,
    isPostmatch,
    isMatchStarted,
    matchEvents,
    lineupPlayers,
    benchPlayers,
    substitutionHistory,
    possessionSecondsWith,
    possessionSecondsWithout,
    currentPeriod,
    ballPossessionStart,
    selectedPlayerIds,
    match?.lineup?.selectedPlayerIds,
  ]);

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
    if (!isOpen || !hasUnsavedChanges || suppressBeforeUnloadRef.current) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (suppressBeforeUnloadRef.current) return;
      if (hasPendingSnapshotChanges) {
        void saveSilently();
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasPendingSnapshotChanges, hasUnsavedChanges, isOpen, saveSilently]);

  const handleCloseWithSilentSave = async () => {
    if (!hasUnsavedChanges) {
      suppressBeforeUnloadRef.current = true;
      onClose();
      return;
    }
    if (!window.confirm('Tem certeza que deseja fechar? Dados não salvos podem ser perdidos.')) return;
    if (hasPendingSnapshotChanges) {
      await saveSilently();
    }
    suppressBeforeUnloadRef.current = true;
    onClose();
  };

  // Confirmar escalação e iniciar partida
  const handleConfirmLineup = () => {
    if (lineupPlayers.length !== 5) {
      alert('Por favor, selecione exatamente 5 atletas para a escalação.');
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

    flushSync(() => {
      setIsMatchStarted(true);
      setShowLineupModal(false);
      setSquadActiveIds([...lineupPlayers]);
      if (lineupPlayers.length > 0) {
        setCurrentGoalkeeperId(lineupPlayers[0]);
      }
      setBallPossessionNow(ballPossessionStart === 'us' ? 'com' : 'sem');
    });
    if (onSave) {
      try {
        autosaveSkipRef.current = false;
        const snap = buildMatchSnapshot('em_andamento');
        void Promise.resolve(onSave(snap, { source: 'autosave' })).then((r: MatchRecord | undefined | void) => {
          applySaveResult(r);
          commitPersistedSignature(JSON.stringify(snap));
        });
      } catch {
        /* noop */
      }
    }
  };

  // Adicionar jogador à escalação
  const handleAddToLineup = (playerId: string) => {
    if (lineupPlayers.length >= 5) {
      alert('Máximo de 5 atletas em quadra. Remova um atleta primeiro.');
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
          'Já há um goleiro em quadra. No futsal, apenas um goleiro pode estar em campo por vez. Durante o jogo, um atleta de linha pode assumir a função (goleiro linha).'
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

  // Selecionar ação — novo fluxo: ação → detalhes (popup) → jogador (lista lateral) → tempo (popup se necessário)
  const handleSelectAction = (action: string) => {
    if (!isMatchStarted) {
      alert('A partida ainda não foi iniciada. Complete a escalação primeiro.');
      return;
    }
    
    // Bloquear comandos quando tempo está parado (exceto GOL e substituições) - apenas em realtime
    if (blockRealtimeEventWhenNeeded()) {
      return;
    }
    /*

      return;
    }
    
    */
    // Se já há passe pendente e clicou em Passe novamente, cancelar
    if (action === 'pass' && pendingPassEventId) {
      setMatchEvents(prev => prev.filter(e => e.id !== pendingPassEventId));
      setPendingPassEventId(null);
      setPendingPassSenderId(null);
      setPendingPassResult(null);
      setSelectedAction(null);
      return;
    }
    
    // Ações com fluxo próprio (GOL, PÊNALTI, TIRO LIVRE) — agora também no padrão jogador-primeiro
    if (action === 'goal' || action === 'penalty' || action === 'freeKick') {
      if (!hasSelectedPlayer && action !== 'goal') {
        alert('Selecione um atleta primeiro.');
        return;
      }
      if (action === 'goal') applyPreActionClockBehavior('goal');
      if (action === 'penalty') applyPreActionClockBehavior('penalty');
      if (action === 'freeKick') applyPreActionClockBehavior('freeKick');
      setSelectedAction(action);
      return;
    }

    if (action === 'foul') {
      applyPreActionClockBehavior('foul');
      startActionFlow(action, hasSelectedPlayer ? selectedPlayerId : null);
      setSelectedAction(action);
      return;
    }
    if (action === 'cardAgainst') {
      setActionFlow({
        step: 'details',
        action: 'card',
        details: null,
        cardTeam: 'against',
      });
      applyPreActionClockBehavior('card');
      setSelectedAction(action);
      return;
    }
    if (ballPossessionNow === 'sem' && (action === 'tackle' || action === 'save')) {
      applyPreActionClockBehavior(action);
      startActionFlow(action, hasSelectedPlayer ? selectedPlayerId : null);
      setSelectedAction(action);
      return;
    }
    if (ballPossessionNow === 'sem' && action === 'block') {
      applyPreActionClockBehavior('block');
      handleRegisterBlock(hasSelectedPlayer ? selectedPlayerId : TEAM_EVENT_FAKE_PLAYER_ID);
      setSelectedAction(action);
      return;
    }
    if (!hasSelectedPlayer) {
      alert('Selecione um atleta primeiro.');
      return;
    }
    applyPreActionClockBehavior(action as MatchEvent['type']);
    startActionFlow(action, selectedPlayerId);
    setSelectedAction(action);
  };
  
  // Registrar desarme
  const handleRegisterTackle = (result: 'withBall' | 'withoutBall' | 'counter', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid =
      playerIdOverride ??
      selectedPlayerId ??
      (ballPossessionNow === 'sem' ? TEAM_EVENT_FAKE_PLAYER_ID : null);
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('tackle', result);
    const newEvent: MatchEvent = {
      id: `tackle-${Date.now()}`,
      type: 'tackle',
      playerId: pid,
      playerName:
        pid === TEAM_EVENT_FAKE_PLAYER_ID
          ? TEAM_EVENT_FAKE_PLAYER_NAME
          : (player?.nickname || player?.name || ''),
      time: evtTime,
      period: evtPeriod,
      result,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);

    // Retomar cronômetro (desarme = bola em jogo)
    applyEventClockBehavior('tackle', result);

    // Desarme sem posse: posse vai para o adversário
    if (result === 'withoutBall') {
      setBallPossessionNow('sem');
    } else {
      setBallPossessionNow('com');
    }
    setSelectedAction(null);
  };

  // Registrar defesa (goleiro na lista): Simples, Difícil ou Pra fora
  const handleRegisterSave = (
    difficulty: 'simple' | 'hard' | 'outside',
    playerIdOverride?: string,
    timeOverride?: number,
    periodOverride?: '1T' | '2T'
  ) => {
    const selectedSidebarGoalkeeperId =
      selectedPlayerId &&
      activePlayers.some(
        (p) =>
          String(p.id).trim() === String(selectedPlayerId).trim() &&
          String(p.position || '').trim().toLowerCase() === 'goleiro'
      )
        ? String(selectedPlayerId).trim()
        : null;
    const pid =
      playerIdOverride ??
      selectedSidebarGoalkeeperId ??
      currentGoalkeeperId ??
      (ballPossessionNow === 'sem' ? TEAM_EVENT_FAKE_PLAYER_ID : null);
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('save', difficulty);
    const newEvent: MatchEvent = {
      id: `save-${Date.now()}`,
      type: 'save',
      playerId: pid,
      playerName:
        pid === TEAM_EVENT_FAKE_PLAYER_ID
          ? TEAM_EVENT_FAKE_PLAYER_NAME
          : (player?.nickname?.trim() || player?.name || ''),
      time: evtTime,
      period: evtPeriod,
      result: difficulty,
      tipo,
      subtipo,
      details:
        difficulty === 'outside' ? { saveOutcome: 'outside' as const } : { saveDifficulty: difficulty },
    };

    setMatchEvents(prev => [...prev, newEvent]);

    applyEventClockBehavior('save', difficulty);
    setSelectedAction(null);
  };
  
  // Registrar bloqueio
  const handleRegisterBlock = (playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid =
      playerIdOverride ??
      selectedPlayerId ??
      (ballPossessionNow === 'sem' ? TEAM_EVENT_FAKE_PLAYER_ID : null);
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);
    
    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('block');
    const newEvent: MatchEvent = {
      id: `block-${Date.now()}`,
      type: 'block',
      playerId: pid,
      playerName:
        pid === TEAM_EVENT_FAKE_PLAYER_ID
          ? TEAM_EVENT_FAKE_PLAYER_NAME
          : (player?.name || ''),
      time: evtTime,
      period: evtPeriod,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Retomar cronômetro (bloqueio = bola em jogo)
    applyEventClockBehavior('block');
    
    setSelectedAction(null);
  };

  // Registrar falta: Nosso ou Adversário. Contagem continua após 5; a partir da 6ª o botão Tiro Livre fica disponível.
  const handleRegisterFoul = (team: 'for' | 'against', playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const rawPlayerId =
      team === 'against'
        ? (playerIdOverride ?? OPPONENT_FAKE_PLAYER_ID)
        : (playerIdOverride ?? selectedPlayerId);
    if (team === 'for' && !rawPlayerId) return;
    if (team === 'for' && rawPlayerId === OPPONENT_FAKE_PLAYER_ID) return;
    const pid = rawPlayerId ?? OPPONENT_FAKE_PLAYER_ID;

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
      setFoulsAgainstCount(prev => prev + 1);
    }

    applyEventClockBehavior('foul');
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
    applyEventClockBehavior('pass', result);
    if (result === 'correct') {
      if (!requirePassReceiver) {
        setPendingPassSenderId(null);
        setPendingPassEventId(null);
        setPendingPassResult(null);
        setSelectedAction(null);
        return;
      }
      setPendingPassSenderId(pid);
      setPendingPassEventId(eventId);
      setPendingPassResult('correct');
      // Retomar cronômetro (passe certo = bola em jogo)
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
    applyEventClockBehavior('shot', result);

    setSelectedAction(null);
  };
  
  // Registrar escanteio (zone opcional: Defesa/Ataque - Esquerda/Direita)
  const handleRegisterCorner = (zone?: LateralResult, playerIdOverride?: string, timeOverride?: number, periodOverride?: '1T' | '2T') => {
    const pid = playerIdOverride ?? selectedPlayerId;
    if (!pid) return;

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
    applyEventClockBehavior('corner', zone);
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
    applyEventClockBehavior('lateral', zone);
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
    const rawGoalT = isPostmatch
      ? (goalTimeOverride ?? pendingGoalTime ?? matchTime)
      : (goalTimeOverride ?? matchTime);
    const { time: goalTime, period: goalPeriod } = getOfficialEventStamp(rawGoalT, goalPeriodOverride ?? undefined);
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
    applyEventClockBehavior('goal', goalType);
    
    setShowGoalConfirmation(false);
    setPendingGoalType(null);
    setPendingGoalIsOpponent(false);
    setPendingGoalPlayerId(null);
    setPendingAssistPlayerId(null);
    setPendingGoalTime(null);
    setPendingGoalMethod(null);
    setGoalStep(null);
    // Em postmatch: resetar relógio para novo lance (mantém eixo do 2º tempo se o 1º já foi encerrado)
    if (isPostmatch) {
      if (firstHalfLocked) {
        setManualMinute(20);
        setManualSecond(0);
        setManualHalfPinned(true);
      } else {
        setManualMinute(0);
        setManualSecond(0);
        setManualHalfPinned(false);
      }
    }
  };

  const completeGoalFromTimeStep = () => {
    const period = currentPeriod;
    const maxRel = period === '1T' ? HALF_RELATIVE_LAST_SECOND_1T : HALF_RELATIVE_LAST_SECOND_2T;
    const rel = Math.max(0, Math.min(goalTimeRelSeconds, maxRel));
    const rawT = isPostmatch ? (period === '1T' ? rel : 20 * 60 + rel) : rel;
    const periodOv = period;
    const assistPlayer = pendingAssistPlayerId
      ? activePlayers.find((p) => String(p.id).trim() === pendingAssistPlayerId)
      : null;
    if (pendingGoalIsOpponent && pendingGoalMethod === 'Gol Contra') {
      handleRegisterGoal('contra', true, null, 'Gol Contra', rawT, periodOv);
      return;
    }
    if (pendingGoalIsOpponent) {
      handleRegisterGoal('normal', true, null, pendingGoalMethod ?? undefined, rawT, periodOv);
      return;
    }
    handleRegisterGoal(
      pendingGoalType || 'normal',
      false,
      pendingGoalPlayerId,
      pendingGoalMethod,
      rawT,
      periodOv,
      pendingAssistPlayerId,
      assistPlayer?.name
    );
  };

  const completeRealtimePendingGoal = (goalMethodOverride?: string | null, assistIdOverride?: string | null) => {
    const method = goalMethodOverride ?? pendingGoalMethod;
    const assistId = assistIdOverride ?? pendingAssistPlayerId;
    const assistPlayer = assistId
      ? activePlayers.find((p) => String(p.id).trim() === assistId)
      : null;

    if (pendingGoalIsOpponent && method === 'Gol Contra') {
      handleRegisterGoal('contra', true, null, 'Gol Contra');
      return;
    }
    if (pendingGoalIsOpponent) {
      handleRegisterGoal('normal', true, null, method ?? undefined);
      return;
    }
    handleRegisterGoal(
      pendingGoalType || 'normal',
      false,
      pendingGoalPlayerId,
      method,
      null,
      null,
      assistId,
      assistPlayer?.name
    );
  };
  
  // Registrar tiro livre
  const handleRegisterFreeKick = (team: 'for' | 'against', kickerId: string | null, result: 'goal' | 'saved' | 'outside' | 'post' | 'noGoal') => {
    const kicker = kickerId ? activePlayers.find(p => String(p.id).trim() === kickerId) : null;
    const { tipo, subtipo } = getTipoSubtipo('freeKick', result);
    const rawT = getTimeForEvent() ?? matchTime;
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT);
    const effectivePlayerId = team === 'against' ? OPPONENT_FAKE_PLAYER_ID : (kickerId || undefined);
    const effectivePlayerName = kicker?.name || (team === 'against' ? OPPONENT_FAKE_PLAYER_NAME : 'Nossa Equipe');
    const newEvent: MatchEvent = {
      id: `freekick-${Date.now()}`,
      type: 'freeKick',
      playerId: effectivePlayerId,
      playerName: effectivePlayerName,
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
    pauseClock();
    
    // Retomar se resultado indica bola em jogo (exceto gol e não gol)
    if (result !== 'goal' && result !== 'noGoal') {
      // Retomar após breve pausa (defendido, pra fora, trave = bola volta ao jogo)
      setTimeout(() => {
        if (!isMatchEnded) {
          resumeClock();
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
    const effectivePlayerId = team === 'against' ? OPPONENT_FAKE_PLAYER_ID : (kickerId || undefined);
    const effectivePlayerName = kicker?.name || (team === 'against' ? OPPONENT_FAKE_PLAYER_NAME : 'Nossa Equipe');
    const newEvent: MatchEvent = {
      id: `penalty-${Date.now()}`,
      type: 'penalty',
      playerId: effectivePlayerId,
      playerName: effectivePlayerName,
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
    pauseClock();
    
    // Retomar se resultado indica bola em jogo (exceto gol e não gol)
    if (result !== 'goal' && result !== 'noGoal') {
      setTimeout(() => {
        if (!isMatchEnded) {
          resumeClock();
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

  /** Fluxos que pediam jogador no centro passam a usar só os números à esquerda. */
  const handleLateralPlayerClick = (clickedPlayerId: string) => {
    if (goalStep === 'author' && !pendingGoalIsOpponent) {
      setPendingGoalPlayerId(clickedPlayerId);
      setPendingAssistPlayerId(null);
      setGoalStep('method');
      return;
    }
    if (goalStep === 'assist' && !pendingGoalIsOpponent) {
      if (clickedPlayerId === pendingGoalPlayerId) return;
      setPendingAssistPlayerId(clickedPlayerId);
      if (isPostmatch) {
        enterGoalTimeStep('assist');
      } else {
        completeRealtimePendingGoal(pendingGoalMethod, clickedPlayerId);
      }
      return;
    }
    if (!isMatchStarted) return;

    if (freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister) {
      const res = pendingFreeKickResultToRegister;
      handleRegisterFreeKick('for', clickedPlayerId, res);
      return;
    }
    if (penaltyStep === 'kicker' && pendingPenaltyTeam === 'for') {
      setPendingPenaltyKickerId(clickedPlayerId);
      setPenaltyStep('result');
      return;
    }
    if (actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save') {
      if (saveGoalkeeperOptions.players.some((p) => String(p.id).trim() === clickedPlayerId)) {
        completeSaveAfterGoalkeeperPick(actionFlow, clickedPlayerId);
      }
      return;
    }
    if (actionFlow?.step === 'player' && actionFlow?.action) {
      handleActionFlowPlayerPick(clickedPlayerId);
      return;
    }

    if (pendingPassEventId && pendingPassSenderId && clickedPlayerId !== pendingPassSenderId) {
      handleConfirmPassReceiver(clickedPlayerId);
      return;
    }
    setSelectedPlayerId(clickedPlayerId);
    if (pendingPassEventId) {
      setMatchEvents((prev) => prev.filter((e) => e.id !== pendingPassEventId));
      setPendingPassEventId(null);
      setPendingPassSenderId(null);
      setPendingPassResult(null);
      setSelectedAction(null);
    }
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
  const handleRegisterCard = (
    cardType: 'yellow' | 'secondYellow' | 'red',
    playerIdOverride?: string,
    timeOverride?: number,
    periodOverride?: '1T' | '2T',
    cardTeam: 'for' | 'against' = 'for'
  ) => {
    const pid =
      cardTeam === 'against'
        ? OPPONENT_FAKE_PLAYER_ID
        : (playerIdOverride ?? selectedPlayerId);
    if (!pid) return;

    const rawT = timeOverride ?? (getTimeForEvent() ?? matchTime);
    const { time: evtTime, period: evtPeriod } = eventTimeAndPeriod(rawT, periodOverride);

    const player = activePlayers.find(p => String(p.id).trim() === pid);
    const { tipo, subtipo } = getTipoSubtipo('card', undefined, cardType);
    const newEvent: MatchEvent = {
      id: `card-${Date.now()}`,
      type: 'card',
      playerId: pid,
      playerName: cardTeam === 'against' ? OPPONENT_FAKE_PLAYER_NAME : (player?.name || ''),
      time: evtTime,
      period: evtPeriod,
      cardType,
      cardTeam,
      tipo,
      subtipo,
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    applyEventClockBehavior('card');
    if (cardTeam === 'against') {
      setSelectedAction(null);
      setSelectedPlayerId(null);
      return;
    }
    
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
        // Mantém o número na lateral (bloqueado) para visibilidade de expulsão.
        setBenchPlayers((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
        
        // Se goleiro foi expulso, atualizar currentGoalkeeperId
        if (pid === currentGoalkeeperId) {
          if (newLineup.length > 0) {
            setCurrentGoalkeeperId(newLineup[0]);
          } else {
            setCurrentGoalkeeperId(null);
          }
        }
        
        // Após expulsão, manter painel de ativos com a quantidade atual em quadra.
        setSquadActiveIds(newLineup);
      }
      
      // activePlayers é derivado de lineupPlayers no useEffect, então já reflete 4 em quadra
      
      alert(`⚠️ ${player?.name || 'Atleta'} foi expulso. Ajuste os atletas em quadra quando quiser (máx. 5 em quadra).`);
    }
    
    setSelectedAction(null);
    setSelectedPlayerId(null); // Limpar seleção após registrar cartão
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
    const lines: Array<{ key: string; absoluteTime: number; playerName: string; actionText: string; zone?: string }> = [];
    for (const event of lastThreeEvents) {
      const zone = event.result && lateralToZoneLabel[event.result] ? lateralToZoneLabel[event.result] : undefined;
      const isPassWithReceiver = event.type === 'pass' && event.passToPlayerId && event.passToPlayerName;
      const absoluteTime = storedToAbsoluteSeconds(event.period, event.time);
      if (isPassWithReceiver) {
        lines.push({
          key: `${event.id}-passer`,
          absoluteTime,
          playerName: event.playerName || 'N/A',
          actionText: formatRecentEventAction(event),
          zone,
        });
        lines.push({
          key: `${event.id}-receiver`,
          absoluteTime,
          playerName: event.passToPlayerName || 'N/A',
          actionText: 'Recebeu passe',
          zone,
        });
      } else {
        lines.push({
          key: event.id,
          absoluteTime,
          playerName: event.playerName || 'N/A',
          actionText: formatRecentEventAction(event),
          zone,
        });
      }
    }
    return lines;
  }, [formatRecentEventAction, lastThreeEvents]);

  const isBlockedByPenalty = !!penaltyStep;

  const expelledPlayerIds = useMemo(() => {
    return Object.entries(playerCards)
      .filter(([, cards]) => {
        const yellowCount = cards.filter((c) => c === 'yellow').length;
        const hasSecondYellow = cards.some((c) => c === 'secondYellow');
        const hasRed = cards.some((c) => c === 'red');
        return yellowCount >= 2 || hasSecondYellow || hasRed;
      })
      .map(([pid]) => pid);
  }, [playerCards]);

  /** Mantém squadActiveIds dentro do elenco, sem expulsos, e com todos em quadra quando há desvantagem numérica. */
  useEffect(() => {
    if (!isOpen || isPostmatch || !isMatchStarted || lockerOpen) return;
    const roster = new Set([...lineupPlayers, ...benchPlayers].map((id) => String(id).trim()));
    const expelled = new Set(expelledPlayerIds.map((id) => String(id).trim()));
    setSquadActiveIds((prev) => {
      const next = [
        ...new Set(
          prev
            .map((id) => String(id).trim())
            .filter((id) => roster.has(id) && !expelled.has(id))
        ),
      ];
      const lineupNorm = lineupPlayers.map((id) => String(id).trim()).filter(Boolean);
      let out = next;
      if (lineupNorm.length > 0 && lineupNorm.length < 5) {
        const missingFromLineup = lineupNorm.filter((id) => !out.includes(id));
        if (missingFromLineup.length > 0) {
          out = sanitizeLockerDraftIds([...lineupNorm, ...out]);
        }
      }
      if (out.length === prev.length && out.every((id, i) => id === String(prev[i] ?? ''))) return prev;
      return out;
    });
  }, [
    isOpen,
    isPostmatch,
    isMatchStarted,
    lockerOpen,
    lineupPlayers,
    benchPlayers,
    expelledPlayerIds,
    sanitizeLockerDraftIds,
  ]);

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
      savesOutside: savesAll.filter(e => e.result === 'outside' || e.details?.saveOutcome === 'outside').length,
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

  const canEndTime = matchTime >= REGULATION_HALF_SECONDS;
  const isRealtimeActionLocked = !isPostmatch && !canRegisterRealtimeEvent;
  const shouldDisableRealtimeEventButtons = isBlockedByPenalty || isRealtimeActionLocked;
  const syncMinuteIsNumeric = /^\d+$/.test(syncMinuteInput.trim());
  const syncSecondIsNumeric = /^\d+$/.test(syncSecondInput.trim());
  const syncMinuteValue = syncMinuteIsNumeric ? Number.parseInt(syncMinuteInput.trim(), 10) : null;
  const syncSecondValue = syncSecondIsNumeric ? Number.parseInt(syncSecondInput.trim(), 10) : null;
  const syncPreviewSeconds =
    syncMinuteValue != null && syncSecondValue != null
      ? Math.max(0, syncMinuteValue * 60 + syncSecondValue)
      : null;
  const syncPreviewLabel = syncPreviewSeconds != null && syncSecondValue != null && syncSecondValue <= 59
    ? formatTime(syncPreviewSeconds)
    : '--:--';
  const clockPrimaryAction = (() => {
    switch (clockSnapshot.state) {
      case 'PRE_JOGO':
        return {
          label: 'INICIAR PARTIDA',
          onClick: () => {
            const result = iniciarPrimeiroTempo();
            if (!result.ok && result.error) setTopRightNotice(result.error);
          },
          disabled: false,
          className: 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] hover:bg-[#00f0ff]/25',
        };
      case 'PRIMEIRO_TEMPO':
      case 'SEGUNDO_TEMPO':
        return {
          label: 'PAUSAR',
          onClick: () => pauseClock(),
          disabled: false,
          className: 'border-amber-500 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25',
        };
      case 'PAUSADO':
        return {
          label: 'CONTINUAR PARTIDA',
          onClick: () => resumeClock(),
          disabled: false,
          className: isPausedByEvent
            ? 'border-emerald-400 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30 shadow-lg shadow-emerald-500/20'
            : 'border-emerald-500 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
        };
      case 'INTERVALO':
        return {
          label: 'INICIAR SEGUNDO TEMPO',
          onClick: handleStartSecondHalf,
          disabled: false,
          className: 'border-violet-400 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25',
        };
      default:
        return null;
    }
  })();

  const clockTourSteps = useMemo(
    () =>
      buildClockProductTourSteps({
        clockState: clockSnapshot.state,
        currentPeriod,
        hasClockSyncFallback: needsClockSyncFallback,
        isMatchStarted,
        canShowPlayerStep: isMatchStarted && allSquadPlayers.length > 0,
        canShowPassStep: isMatchStarted && canRegisterRealtimeEvent,
        canSaveIncomplete: !isMatchEnded,
        canFinishCollection: isMatchEnded,
      }),
    [
      allSquadPlayers.length,
      canRegisterRealtimeEvent,
      clockSnapshot.state,
      currentPeriod,
      isMatchEnded,
      isMatchStarted,
      needsClockSyncFallback,
    ]
  );

  const activeClockTourStep = useMemo<ClockTourStepDefinition | null>(() => {
    if (!showClockHelpPanel) return null;

    return (
      clockTourSteps.find((step) => step.id === activeClockTourStepId) ??
      clockTourSteps.find((step) => step.role === 'current') ??
      clockTourSteps[0] ??
      null
    );
  }, [activeClockTourStepId, clockTourSteps, showClockHelpPanel]);

  const activeClockTourIndex = useMemo(() => {
    if (!activeClockTourStep) return -1;
    return clockTourSteps.findIndex((step) => step.id === activeClockTourStep.id);
  }, [activeClockTourStep, clockTourSteps]);

  useEffect(() => {
    if (!showClockHelpPanel) return;

    const nextStep =
      clockTourSteps.find((step) => step.id === activeClockTourStepId) ??
      clockTourSteps.find((step) => step.role === 'current') ??
      clockTourSteps[0] ??
      null;

    if (nextStep && nextStep.id !== activeClockTourStepId) {
      setActiveClockTourStepId(nextStep.id);
    }
  }, [activeClockTourStepId, clockTourSteps, showClockHelpPanel]);

  const openClockProductTour = useCallback(() => {
    setActiveClockTourStepId('welcome');
    setShowClockHelpPanel(true);
  }, []);

  const closeClockProductTour = useCallback(() => {
    setShowClockHelpPanel(false);
    setActiveClockTourStepId(null);
  }, []);

  const completeClockProductTour = useCallback(() => {
    try {
      window.localStorage.setItem(CLOCK_TOUR_COMPLETED_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage failures and keep the tour usable.
    }
    setHasCompletedClockTour(true);
    closeClockProductTour();
  }, [closeClockProductTour]);

  const goToPreviousClockTourStep = useCallback(() => {
    if (activeClockTourIndex <= 0) return;
    setActiveClockTourStepId(clockTourSteps[activeClockTourIndex - 1]?.id ?? null);
  }, [activeClockTourIndex, clockTourSteps]);

  const goToNextClockTourStep = useCallback(() => {
    if (activeClockTourIndex < 0 || activeClockTourIndex >= clockTourSteps.length - 1) return;
    setActiveClockTourStepId(clockTourSteps[activeClockTourIndex + 1]?.id ?? null);
  }, [activeClockTourIndex, clockTourSteps]);

  const openFullClockGuide = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open('/guia-de-uso#cronometro', '_blank', 'noopener,noreferrer');
  }, []);

  const isClockTourTargetHighlighted = useCallback(
    (targetId: ClockTourTargetId) =>
      showClockHelpPanel && activeClockTourStep?.targetId === targetId,
    [activeClockTourStep, showClockHelpPanel]
  );

  const getClockTourTargetClass = useCallback(
    (targetId: ClockTourTargetId) =>
      isClockTourTargetHighlighted(targetId)
        ? 'ring-2 ring-[#00f0ff] ring-offset-2 ring-offset-zinc-950 shadow-[0_0_0_2px_rgba(0,240,255,0.18)]'
        : '',
    [isClockTourTargetHighlighted]
  );

  const isRealtimePage = window.location.pathname === '/scout-realtime';
  const useFullViewport = isRealtimePage || takeFullWidth;
  const leftOffset = sidebarRetracted ? 'left-16' : 'left-64';
  return (
    <div className={`fixed z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in overflow-hidden p-0 ${
      useFullViewport ? 'inset-0 h-dvh min-h-dvh' : `${leftOffset} top-0 right-0 bottom-0`
    }`}>
      <div className="w-full h-full min-h-0 bg-black flex flex-col relative overflow-hidden">
        {topRightNotice && (
          <div
            role="alert"
            className="absolute top-3 right-3 z-[250] max-w-[min(92vw,22rem)] rounded-lg border border-amber-500/80 bg-zinc-950/95 px-3 py-2.5 shadow-xl shadow-amber-500/10 pointer-events-none"
          >
            <p className="text-amber-100 text-xs font-bold leading-snug text-right">{topRightNotice}</p>
          </div>
        )}

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
                  <p data-testid="score-us" className="text-[#00f0ff] text-2xl font-black font-mono min-w-[1.5rem] text-center">{goalsFor}</p>
                  <span className="text-zinc-600 text-xl font-black">x</span>
                  <p data-testid="score-opponent" className="text-red-400 text-2xl font-black font-mono min-w-[1.5rem] text-center">{goalsAgainst}</p>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogsView(true)}
                  data-testid="logs-open"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-[10px] font-semibold transition-colors"
                >
                  <List size={14} /> Eventos da partida
                </button>
                {!isPostmatch && (
                  <button
                    type="button"
                    onClick={openClockProductTour}
                    data-testid="clock-help-open"
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    {hasCompletedClockTour ? 'Rever tour' : 'Tour guiado'}
                    {!hasCompletedClockTour ? (
                      <span className="rounded-full border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-1.5 py-0.5 text-[9px] font-black tracking-[0.18em] text-[#00f0ff]">
                        NOVO
                      </span>
                    ) : null}
                  </button>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEndCollection}
                    data-testid="end-collection"
                    data-tour-highlighted={isClockTourTargetHighlighted('end-collection') ? 'true' : undefined}
                    disabled={isPostmatch ? matchEvents.length < 1 : !isMatchEnded}
                    className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold tracking-wide transition-all ${
                      (isPostmatch && matchEvents.length >= 1) || isMatchEnded
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-100 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
                    } ${getClockTourTargetClass('end-collection')}`}
                  >
                    Finalizar coleta
                  </button>
                </div>
                <p
                  data-testid="collection-status"
                  className={`max-w-[240px] text-right text-[10px] font-semibold ${
                    (isPostmatch && matchEvents.length >= 1) || isMatchEnded
                      ? 'text-emerald-300'
                      : 'text-amber-200'
                  }`}
                >
                  Estado: {isPostmatch ? 'POS-JOGO' : getClockStateLabel(clockSnapshot.state)}. {needsClockSyncFallback ? 'Necessario sincronizar relogio. Esta partida nao possui snapshot temporal salvo.' : getCollectionStatusMessage()}
                </p>
                <button
                  type="button"
                  onClick={handleSaveLater}
                  data-testid="save-match"
                  data-tour-highlighted={isClockTourTargetHighlighted('save-match') ? 'true' : undefined}
                  className={`px-3 py-1.5 rounded-lg border border-zinc-600 bg-zinc-800/80 hover:bg-zinc-700 text-[10px] uppercase font-semibold tracking-wide text-zinc-300 transition-colors ${getClockTourTargetClass('save-match')}`}
                >
                  Salvar como incompleta
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
              <h2 className="text-white font-bold uppercase text-lg">Eventos da partida</h2>
              <button
                type="button"
                onClick={() => { setShowLogsView(false); setEditingEventId(null); setEditDraft(null); }}
                data-testid="logs-close"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 text-sm font-bold uppercase transition-colors"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            </div>
            <div data-testid="event-logs-table" className="flex-1 min-h-0 overflow-auto rounded-xl border-2 border-zinc-800 bg-zinc-950">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-900 border-b-2 border-zinc-700 z-10">
                  <tr>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Tempo</th>
                    <th className="p-2 text-zinc-400 text-xs font-bold uppercase">Atleta</th>
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
                        <tr
                          key={event.id}
                          data-testid="event-log-row"
                          data-event-id={event.id}
                          data-event-period={event.period}
                          data-event-type={event.type}
                          data-event-time={formatTime(storedToAbsoluteSeconds(event.period, event.time))}
                          className="border-b border-zinc-800 hover:bg-zinc-900/50"
                        >
                          <td className="p-2">
                            {isEditing && draft ? (
                              <input
                                type="text"
                                value={editTimeInput}
                                onChange={(e) => setEditTimeInput(e.target.value)}
                                data-testid="edit-event-time"
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
                                data-testid="edit-event-assist"
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
                                  data-testid="edit-event-confirm"
                                  className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingEventId(null); setEditDraft(null); }}
                                  data-testid="edit-event-cancel"
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
                                  data-testid="event-edit"
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
                                  data-testid="event-delete"
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
          <div
            data-testid="player-selector-panel"
            data-tour-highlighted={isClockTourTargetHighlighted('player-selector-panel') ? 'true' : undefined}
            className={`rounded-lg p-2 flex flex-col border-2 shrink-0 min-h-0 bg-black transition-all duration-300 ${
            shouldHighlightPlayerPanel ? 'w-64 min-w-[10rem] max-w-[17rem] animate-pulse' : 'w-52 min-w-[7rem] max-w-[14rem]'
          } ${
            goalStep === 'time'
              ? 'border-cyan-500/70'
              : goalStep === 'assist' && !pendingGoalIsOpponent
              ? 'border-amber-500/70'
              : goalStep === 'author' && !pendingGoalIsOpponent
                ? 'border-green-500/70'
                : actionFlow?.step === 'player'
                  ? 'border-[#00f0ff]/50'
                  : actionFlow?.step === 'goalkeeper'
                    ? 'border-purple-500/70'
                    : freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister
                      ? 'border-violet-500/70'
                    : penaltyStep === 'kicker' && pendingPenaltyTeam === 'for'
                        ? 'border-fuchsia-500/70'
                        : 'border-zinc-800'
          } ${getClockTourTargetClass('player-selector-panel')}`}>
            <h3 className={`font-bold uppercase mb-2 text-center shrink-0 ${shouldHighlightPlayerPanel ? 'text-[#00f0ff] text-base' : 'text-white text-sm'}`}>
              {goalStep === 'time'
                ? 'GOL — tempo'
                : (goalStep === 'author' || goalStep === 'assist') && !pendingGoalIsOpponent
                ? goalStep === 'assist'
                  ? 'GOL — assistência'
                  : 'GOL — autor'
                : freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister
                  ? 'Tiro livre — cobrador'
                  : penaltyStep === 'kicker' && pendingPenaltyTeam === 'for'
                    ? 'Pênalti — cobrador'
                    : actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save'
                      ? 'Defesa — goleiro'
                      : actionFlow?.step === 'player' && !goalStep
                        ? 'Ação — atleta'
                        : pendingPassEventId && requirePassReceiver
                          ? 'PASSE — recebedor'
                          : selectedPlayer
                            ? `#${selectedPlayer.jerseyNumber ?? '?'} ${(selectedPlayer.nickname?.trim() || selectedPlayer.name || 'Atleta').trim()}`
                        : 'SELECIONAR ATLETA'}
            </h3>
            {selectedPlayer && !goalStep && !actionFlow && !pendingPassEventId && (
              <p data-testid="selected-athlete-summary" className="text-emerald-300 text-[11px] font-semibold text-center mb-2 shrink-0">
                {(selectedPlayer.nickname?.trim() || selectedPlayer.name || '').trim()}
                {selectedPlayer.jerseyNumber != null ? ` (#${selectedPlayer.jerseyNumber})` : ''} em ação
              </p>
            )}
            {shouldHighlightPlayerPanel && (
              <p className="text-[#00f0ff] text-xs font-black text-center mb-2 shrink-0">
                Selecione um atleta
              </p>
            )}
            {goalStep === 'author' && !pendingGoalIsOpponent && (
              <>
                <p className="text-green-400/90 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no autor do gol</p>
                <button type="button" onClick={() => { setGoalStep('team'); setPendingGoalPlayerId(null); setPendingAssistPlayerId(null); setPendingGoalType(null); setPendingGoalMethod(null); }} className="mb-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors shrink-0">Voltar</button>
              </>
            )}
            {goalStep === 'assist' && !pendingGoalIsOpponent && (
              <>
                <p className="text-amber-400/90 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no assistente</p>
                <button type="button" onClick={() => { setGoalStep('method'); setPendingAssistPlayerId(null); }} className="mb-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors shrink-0">Voltar</button>
              </>
            )}
            {actionFlow?.step === 'player' && !goalStep && (
              <p className="text-[#00f0ff]/90 text-[10px] font-semibold text-center mb-2 shrink-0">Toque no número do atleta</p>
            )}
            {actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save' && !goalStep && (
              <p className="text-purple-300 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no goleiro</p>
            )}
            {freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister && (
              <p className="text-violet-300 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no cobrador</p>
            )}
            {penaltyStep === 'kicker' && pendingPenaltyTeam === 'for' && (
              <p className="text-fuchsia-300 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no cobrador</p>
            )}
            {pendingPassEventId && requirePassReceiver && (
              <p className="text-yellow-300 text-[10px] font-bold uppercase text-center mb-2 shrink-0">Toque no recebedor do passe</p>
            )}

            <div data-testid="player-selector" className="flex-1 min-h-0 overflow-y-auto space-y-1">
              {!isMatchStarted ? (
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-2 text-center">
                  <p className="text-yellow-400 text-xs font-bold">Complete a escalação para iniciar</p>
                </div>
              ) : allSquadPlayers.length > 0 ? (
                <>
                  {expelledPlayerIds.length > 0 && (
                    <div className="rounded-lg p-2 border border-red-500/70 bg-red-950/40 text-left shrink-0 mb-1">
                      <p className="text-red-300 text-[10px] font-bold uppercase">Expulsão</p>
                      <p className="text-zinc-300 text-xs leading-snug">
                        {expelledPlayerIds
                          .map((eid) => {
                            const p = players.find((x) => String(x.id).trim() === eid);
                            return p ? (p.nickname?.trim() || p.name) : eid;
                          })
                          .join(', ')}
                        . Ajuste os atletas em quadra quando quiser (máx. 5).
                      </p>
                    </div>
                  )}
                  {lockerOpen && (
                    <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-2 py-2 text-center mb-2 shrink-0">
                      <p className="text-amber-200 text-[11px] font-bold">{lockerDraftIds.length} de 5 atletas em quadra</p>
                      <p className="text-amber-100/90 text-[10px]">Máximo de 1 goleiro</p>
                      <p className="text-amber-100/80 text-[10px]">Toque nos números e confirme abaixo</p>
                    </div>
                  )}
                <div className="grid grid-cols-2 gap-2 min-h-0 content-start">
                  {allSquadPlayers.map((player) => {
                  const pid = String(player.id).trim();
                  const isSelected = selectedPlayerId === pid;
                  const isGoalkeeper = pid === currentGoalkeeperId;
                  const isGk = player.position === 'Goleiro' || isGoalkeeper;
                  const displayNum = player.jerseyNumber ?? '?';
                  const labelName = player.nickname?.trim() || player.name || '';
                  const isInactiveLocked =
                    !isPostmatch &&
                    !lockerOpen &&
                    isMatchStarted &&
                    (squadActiveIds.length === 0 || !squadActiveIds.includes(pid));
                  const isExpelled = expelledPlayerIds.includes(pid);
                  const inLockerSelection = lockerOpen ? lockerDraftIds.includes(pid) : squadActiveIds.includes(pid);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      title={isGk ? `${labelName} — Goleiro` : labelName}
                      data-testid={`player-button-${pid}`}
                      data-player-name={labelName}
                      data-player-jersey={String(displayNum)}
                      onClick={() => {
                        if (lockerOpen) {
                          if (isExpelled) return;
                          toggleLockerDraft(pid);
                          return;
                        }
                        if (isInactiveLocked || isExpelled) return;
                        handleLateralPlayerClick(pid);
                      }}
                      disabled={
                        (!isMatchStarted && !goalStep && !lockerOpen)
                        || (lockerOpen ? isExpelled : isInactiveLocked || isExpelled)
                      }
                      className={`relative flex aspect-square w-full max-h-[2.6rem] items-center justify-center rounded-full text-base font-black transition-all ${
                        !isMatchStarted && !lockerOpen
                          ? 'bg-zinc-800 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed'
                          : isExpelled
                          ? 'bg-red-500/15 border-2 border-red-500 text-red-300 cursor-not-allowed opacity-85'
                          : lockerOpen
                          ? inLockerSelection
                            ? 'bg-emerald-500/30 border-2 border-emerald-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.35)]'
                            : 'bg-zinc-800/50 border-2 border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800'
                          : isInactiveLocked
                          ? 'bg-zinc-800/90 border-2 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-55'
                          : isSelected
                          ? 'bg-[#00f0ff]/25 border-2 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                          : pendingPassEventId && pid !== pendingPassSenderId
                          ? 'bg-yellow-500/25 border-2 border-yellow-500 text-yellow-100 hover:bg-yellow-500/35'
                          : 'bg-green-500/15 border-2 border-green-500/70 text-white hover:bg-green-500/25 hover:border-green-400'
                      }`}
                    >
                      <span className="tabular-nums leading-none">{displayNum}</span>
                      {isGk && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] ring-1 ring-amber-500/80" aria-hidden>🥅</span>
                      )}
                      {isExpelled && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600/90 px-1 py-px text-[7px] font-bold uppercase text-white">expulso</span>
                      )}
                      {pendingPassEventId && pid !== pendingPassSenderId && !lockerOpen && !isInactiveLocked && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-yellow-600/90 px-1 py-px text-[7px] font-bold uppercase text-black">passe</span>
                      )}
                    </button>
                  );
                  })}
                </div>
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/80 rounded-lg p-2 text-center">
                  <p className="text-zinc-500 text-xs">Nenhum atleta ativo</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !requirePassReceiver;
                setRequirePassReceiver(next);
                try {
                  localStorage.setItem('scout21_requirePassReceiver', next ? 'true' : 'false');
                } catch {
                  // ignore localStorage errors
                }
              }}
              className={`mt-2 w-full rounded-lg p-2 font-bold uppercase text-[10px] transition-colors shrink-0 border ${
                requirePassReceiver
                  ? 'bg-yellow-500/25 border-yellow-500 text-yellow-200'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
              data-testid="pass-receiver-toggle"
            >
              Pedir quem recebeu o passe: {requirePassReceiver ? 'Sim' : 'Não'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (lockerOpen) {
                  if (lockerDraftIds.length > 0 && lockerDraftIds.length <= 5) {
                    setSquadActiveIds([...lockerDraftIds]);
                    setLockerOpen(false);
                  } else {
                    setLockerOpen(false);
                    setLockerDraftIds([]);
                  }
                } else {
                  const fromLineup = lineupPlayers.map((id) => String(id).trim()).filter(Boolean);
                  const raw =
                    fromLineup.length > 0
                      ? fromLineup
                      : squadActiveIds.length > 0
                        ? [...squadActiveIds]
                        : [];
                  setLockerDraftIds(sanitizeLockerDraftIds(raw));
                  setLockerOpen(true);
                }
              }}
              className={`mt-2 w-full rounded-lg p-2 font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 shrink-0 border-2 ${
                lockerOpen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
              }`}
              data-testid="lineup-actives"
            >
              {lockerOpen ? <Unlock size={16} aria-hidden /> : <Lock size={16} aria-hidden />}
              {lockerOpen ? 'Confirmar atletas em quadra' : 'Editar atletas em quadra'}
            </button>
          </div>

          {/* Painel Direito - Ações/Eventos (flex-1 + min-w-0 para responsivo) */}
          <div className="flex-1 min-w-0 bg-black border-2 border-blue-500 rounded-lg p-2 flex flex-col min-h-0">
            {goalStep === 'author' && !pendingGoalIsOpponent && (
              <div className="mb-2 p-2 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-green-300 text-xs font-bold text-center">Toque no autor do gol na lista à esquerda</p>
                <button
                  type="button"
                  onClick={() => {
                    setGoalStep('team');
                    setPendingGoalPlayerId(null);
                    setPendingAssistPlayerId(null);
                    setPendingGoalType(null);
                    setPendingGoalMethod(null);
                  }}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
            {goalStep === 'assist' && !pendingGoalIsOpponent && (
              <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                <p className="text-amber-300 text-xs font-bold text-center">Assistência: toque num atleta à esquerda ou selecione sem assistência</p>
                <button
                  type="button"
                    onClick={() => {
                      setPendingAssistPlayerId(null);
                      if (isPostmatch) {
                        enterGoalTimeStep('assist');
                      } else {
                        completeRealtimePendingGoal(pendingGoalMethod, null);
                      }
                    }}
                  data-testid="goal-assist-none"
                  className="mt-2 w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Sem assistência
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalStep('method');
                    setPendingAssistPlayerId(null);
                  }}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
            {/* Indicação quando a ação aguarda seleção na lista à esquerda */}
            {actionFlow?.step === 'player' && !goalStep && (
              <div className="mb-2 p-2 bg-[#00f0ff]/10 border border-[#00f0ff]/50 rounded-lg">
                <p className="text-[#00f0ff] text-xs font-bold text-center">Escolha o atleta na lista à esquerda</p>
                <button
                  type="button"
                  onClick={handleActionFlowPlayerModalBack}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
            {actionFlow?.step === 'goalkeeper' && actionFlow.action === 'save' && !goalStep && (
              <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/50 rounded-lg">
                <p className="text-purple-300 text-xs font-bold text-center">Toque no goleiro que defendeu (lista à esquerda)</p>
                {saveGoalkeeperOptions.isFallback && (
                  <p className="text-zinc-500 text-[10px] text-center mt-1">Nenhum goleiro titular na lista — escolha quem estava no gol.</p>
                )}
                <button
                  type="button"
                  onClick={() => setActionFlow((prev) => (prev && prev.action === 'save' ? { ...prev, step: 'details', details: null } : prev))}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
            {freeKickStep === 'kicker' && pendingFreeKickTeam === 'for' && pendingFreeKickResultToRegister && (
              <div className="mb-2 p-2 bg-violet-500/10 border border-violet-500/50 rounded-lg">
                <p className="text-violet-300 text-xs font-bold text-center">Toque no cobrador na lista à esquerda</p>
                <button
                  type="button"
                  onClick={() => {
                    setFreeKickStep('result');
                    setPendingFreeKickResultToRegister(null);
                  }}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
            {penaltyStep === 'kicker' && pendingPenaltyTeam === 'for' && (
              <div className="mb-2 p-2 bg-fuchsia-500/10 border border-fuchsia-500/50 rounded-lg">
                <p className="text-fuchsia-300 text-xs font-bold text-center">Toque no cobrador na lista à esquerda</p>
                <button
                  type="button"
                  onClick={() => {
                    setPenaltyStep('team');
                    setPendingPenaltyKickerId(null);
                  }}
                  className="mt-2 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-[10px] rounded-lg border border-zinc-600 transition-colors"
                >
                  Voltar
                </button>
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
                    onClick={() => { setGoalStep(null); setPendingGoalTime(null); }}
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
                          if (!hasSelectedPlayer) {
                            alert('Selecione o autor do gol primeiro.');
                            return;
                          }
                          setPendingGoalPlayerId(String(selectedPlayerId).trim());
                          setPendingAssistPlayerId(null);
                          setGoalStep('method');
                        }}
                        data-testid="goal-team-us"
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
                        data-testid="goal-team-opponent"
                        className="w-full px-4 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Gol Adversário
                      </button>
                      <button
                        onClick={() => { setGoalStep(null); setPendingGoalTime(null); setPendingGoalMethod(null); setPendingGoalType(null); setPendingGoalIsOpponent(false); setPendingGoalPlayerId(null); setPendingAssistPlayerId(null); }}
                        className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase text-xs rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Popup Método do gol - após método, gol adversário ou métodos sem assistência registram na hora */}
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
                                      if (pendingGoalIsOpponent) {
                                        setPendingGoalMethod(method);
                                        if (isPostmatch) {
                                          enterGoalTimeStep('method');
                                        } else {
                                          completeRealtimePendingGoal(method, null);
                                        }
                                      } else if (GOAL_METHODS_NO_ASSIST.includes(method)) {
                                        setPendingAssistPlayerId(null);
                                        setPendingGoalMethod(method);
                                        if (isPostmatch) {
                                          enterGoalTimeStep('method');
                                        } else {
                                          completeRealtimePendingGoal(method, null);
                                        }
                                      } else {
                                        setPendingGoalMethod(method);
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
                                      if (pendingGoalIsOpponent) {
                                        setPendingGoalMethod(method);
                                        if (isPostmatch) {
                                          enterGoalTimeStep('method');
                                        } else {
                                          completeRealtimePendingGoal(method, null);
                                        }
                                      } else if (GOAL_METHODS_NO_ASSIST.includes(method)) {
                                        setPendingAssistPlayerId(null);
                                        setPendingGoalMethod(method);
                                        if (isPostmatch) {
                                          enterGoalTimeStep('method');
                                        } else {
                                          completeRealtimePendingGoal(method, null);
                                        }
                                      } else {
                                        setPendingGoalMethod(method);
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
                                    setPendingGoalMethod('Gol Contra');
                                    if (isPostmatch) {
                                      enterGoalTimeStep('method');
                                    } else {
                                      completeRealtimePendingGoal('Gol Contra', null);
                                    }
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

              {/* Passo tempo do gol — período = tempo de coleta (`currentPeriod`); só minuto/segundo relativos */}
              {goalStep === 'time' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setGoalStep(goalTimeReturnStep)}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-md bg-zinc-950 border-2 border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950">
                      <h3 className="text-cyan-400 font-black uppercase text-sm tracking-wider flex items-center gap-2">
                        <Clock size={18} />
                        Tempo do gol
                      </h3>
                      <p
                        className={`mt-2 text-sm font-black uppercase tracking-wide ${
                          currentPeriod === '1T' ? 'text-[#00f0ff]' : 'text-emerald-400'
                        }`}
                      >
                        {currentPeriod === '1T' ? '1º tempo' : '2º tempo'}
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase">Tempo (minuto e segundo)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={currentPeriod === '2T' ? '20:00' : '00:00'}
                          value={formatGoalTimeDigitsMask(goalTimeDigits)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (currentPeriod === '2T') {
                              const unclamped =
                                goalAbsoluteDigitsToRelativeSecondsSecondHalfUnclamped(raw);
                              const rel = goalAbsoluteDigitsToRelativeSecondsSecondHalf(raw);
                              setGoalTimeRelSeconds(rel);
                              const needsClamp =
                                raw.length === 4
                                  ? unclamped !== rel
                                  : unclamped > HALF_RELATIVE_LAST_SECOND_2T;
                              if (needsClamp) {
                                setGoalTimeDigits(secondHalfRelativeToGoalDigits(rel));
                              } else {
                                setGoalTimeDigits(raw);
                              }
                            } else {
                              const maxRel = HALF_RELATIVE_LAST_SECOND_1T;
                              const rel = goalDigitsToRelativeSeconds(raw, maxRel);
                              setGoalTimeRelSeconds(rel);
                              const { mm, ss } = parseGoalTimeDigits(raw);
                              const unconstrained = mm * 60 + ss;
                              if (unconstrained !== rel) {
                                const cm = Math.floor(rel / 60);
                                const cs = rel % 60;
                                setGoalTimeDigits(`${String(cm).padStart(2, '0')}${String(cs).padStart(2, '0')}`);
                              } else {
                                setGoalTimeDigits(raw);
                              }
                            }
                          }}
                          data-testid="goal-time-input"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white text-lg font-mono font-bold outline-none focus:border-cyan-500 placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={completeGoalFromTimeStep}
                        data-testid="goal-time-confirm"
                        className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs rounded-xl transition-all"
                      >
                        Confirmar gol
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalStep(goalTimeReturnStep)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-bold uppercase text-xs rounded-lg border border-zinc-600 transition-colors"
                      >
                        <ArrowLeft size={14} /> Voltar
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
                          <button data-testid="event-result-pass-correct" onClick={() => { advanceActionFlowToPlayer('correct'); }} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors">Certo</button>
                          <button data-testid="event-result-pass-wrong" onClick={() => { advanceActionFlowToPlayer('wrong', { wrongPassTransition: false }); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Errado</button>
                          <button data-testid="event-result-pass-transition" onClick={() => { advanceActionFlowToPlayer('wrong', { wrongPassTransition: true }); }} className="px-4 py-3 bg-amber-500/20 border-2 border-amber-500 text-amber-400 font-bold uppercase text-xs rounded-lg hover:bg-amber-500/30 transition-colors">Transição</button>
                        </div>
                      )}
                      {actionFlow.action === 'shot' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button data-testid="event-result-shot-inside" onClick={() => { advanceActionFlowToPlayer('inside'); }} className="px-4 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-xs rounded-lg hover:bg-green-500/30 transition-colors">No gol</button>
                          <button data-testid="event-result-shot-outside" onClick={() => { advanceActionFlowToPlayer('outside'); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Fora</button>
                          <button onClick={() => { advanceActionFlowToPlayer('post'); }} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors">Trave</button>
                          <button onClick={() => { advanceActionFlowToPlayer('blocked'); }} className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors">Bloqueado</button>
                        </div>
                      )}
                      {actionFlow.action === 'foul' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button data-testid="event-result-foul-for" onClick={() => { advanceActionFlowToPlayer('for', { foulTeam: 'for' }); }} className="px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/30">Nosso {foulsForCurrentPeriod > 0 && <span className="text-zinc-400">({foulsForCurrentPeriod})</span>}</button>
                          <button data-testid="event-result-foul-against" onClick={() => { advanceActionFlowToPlayer('against', { foulTeam: 'against' }); }} className="px-4 py-3 rounded-lg border-2 font-bold uppercase text-xs transition-colors bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30">Adversário {foulsAgainstCurrentPeriod > 0 && <span className="text-zinc-400">({foulsAgainstCurrentPeriod})</span>}</button>
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
                        actionFlow.cardTeam === 'against' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { advanceActionFlowToPlayer('yellow', { cardType: 'yellow', cardTeam: 'against' }); }} className="px-4 py-3 bg-yellow-500/10 border-2 border-yellow-700 text-yellow-300 font-bold uppercase text-[11px] rounded-lg hover:bg-yellow-500/20 transition-colors">Amarelo</button>
                            <button onClick={() => { advanceActionFlowToPlayer('red', { cardType: 'red', cardTeam: 'against' }); }} className="px-4 py-3 bg-red-500/10 border-2 border-red-700 text-red-300 font-bold uppercase text-[11px] rounded-lg hover:bg-red-500/20 transition-colors">Vermelho</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => { advanceActionFlowToPlayer('yellow', { cardType: 'yellow' }); }} className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold uppercase text-xs rounded-lg hover:bg-yellow-500/30 transition-colors">Amarelo</button>
                            <button onClick={() => { advanceActionFlowToPlayer('secondYellow', { cardType: 'secondYellow' }); }} className="px-4 py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold uppercase text-xs rounded-lg hover:bg-orange-500/30 transition-colors">2º Amarelo</button>
                            <button onClick={() => { advanceActionFlowToPlayer('red', { cardType: 'red' }); }} className="px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold uppercase text-xs rounded-lg hover:bg-red-500/30 transition-colors">Vermelho</button>
                          </div>
                        )
                      )}
                      {actionFlow.action === 'save' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = selectedPlayerId != null ? String(selectedPlayerId).trim() : '';
                                const canUseSelectedGoalkeeper =
                                  selectedId.length > 0 &&
                                  saveGoalkeeperOptions.players.some((p) => String(p.id).trim() === selectedId);
                                if (canUseSelectedGoalkeeper && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'simple' }, selectedId);
                                  return;
                                }
                                if (ballPossessionNow === 'sem' && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'simple' }, TEAM_EVENT_FAKE_PLAYER_ID);
                                  return;
                                }
                                setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'goalkeeper', details: 'simple' } : prev));
                              }}
                              className="px-4 py-3 bg-purple-500/20 border border-purple-500 text-purple-400 font-medium uppercase text-xs rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                              DEFESA SIMPLES
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = selectedPlayerId != null ? String(selectedPlayerId).trim() : '';
                                const canUseSelectedGoalkeeper =
                                  selectedId.length > 0 &&
                                  saveGoalkeeperOptions.players.some((p) => String(p.id).trim() === selectedId);
                                if (canUseSelectedGoalkeeper && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'hard' }, selectedId);
                                  return;
                                }
                                if (ballPossessionNow === 'sem' && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'hard' }, TEAM_EVENT_FAKE_PLAYER_ID);
                                  return;
                                }
                                setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'goalkeeper', details: 'hard' } : prev));
                              }}
                              className="px-4 py-3 bg-purple-600/20 border border-purple-600 text-purple-300 font-medium uppercase text-xs rounded-lg hover:bg-purple-600/30 transition-colors"
                            >
                              Defesa difícil
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const selectedId = selectedPlayerId != null ? String(selectedPlayerId).trim() : '';
                                const canUseSelectedGoalkeeper =
                                  selectedId.length > 0 &&
                                  saveGoalkeeperOptions.players.some((p) => String(p.id).trim() === selectedId);
                                if (canUseSelectedGoalkeeper && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'outside' }, selectedId);
                                  return;
                                }
                                if (ballPossessionNow === 'sem' && actionFlow?.action === 'save') {
                                  completeSaveAfterGoalkeeperPick({ ...actionFlow, step: 'goalkeeper', details: 'outside' }, TEAM_EVENT_FAKE_PLAYER_ID);
                                  return;
                                }
                                setActionFlow(prev => (prev && prev.action === 'save' ? { ...prev, step: 'goalkeeper', details: 'outside' } : prev));
                              }}
                              className="col-span-2 px-4 py-3 bg-slate-500/20 border border-slate-500 text-slate-300 font-medium uppercase text-xs rounded-lg hover:bg-slate-500/30 transition-colors"
                            >
                              Pra fora
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

              {/* TimeInputPopup — postmatch quando tempo não preenchido */}
              {actionFlow?.step === 'time' && actionFlow.selectedPlayerId && (
                <div data-testid="postmatch-event-time-dialog" className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
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
                          data-testid="postmatch-event-minute"
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
                          data-testid="postmatch-event-second"
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
                        data-testid="postmatch-event-confirm"
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs rounded-xl transition-all"
                      >
                        Confirmar
                      </button>
                      <button data-testid="postmatch-event-cancel" onClick={cancelActionFlow} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-xs rounded-xl border border-zinc-700 transition-colors">
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
                        onClick={() => {
                          if (!hasSelectedPlayer) {
                            alert('Selecione o cobrador primeiro.');
                            return;
                          }
                          setPendingFreeKickTeam('for');
                          setPendingFreeKickKickerId(String(selectedPlayerId).trim());
                          setFreeKickStep('result');
                        }}
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
                          if (team === 'for') {
                            if (!hasSelectedPlayer) {
                              alert('Selecione o autor do gol primeiro.');
                              return;
                            }
                            handleRegisterGoal('normal', false, String(selectedPlayerId).trim(), 'Tiro Livre');
                          } else {
                            handleRegisterGoal('normal', true, null, 'Tiro Livre');
                          }
                        }}
                        className="w-full px-4 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold uppercase text-sm rounded-xl hover:bg-green-500/30 transition-colors"
                      >
                        Gol
                      </button>
                      <button
                        onClick={() => {
                          if (pendingFreeKickTeam === 'for') {
                            if (pendingFreeKickKickerId) {
                              handleRegisterFreeKick('for', pendingFreeKickKickerId, 'saved');
                            } else {
                              alert('Selecione o cobrador primeiro.');
                            }
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
                            if (pendingFreeKickKickerId) {
                              handleRegisterFreeKick('for', pendingFreeKickKickerId, 'outside');
                            } else {
                              alert('Selecione o cobrador primeiro.');
                            }
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
                        onClick={() => {
                          if (!hasSelectedPlayer) {
                            alert('Selecione o cobrador primeiro.');
                            return;
                          }
                          setPendingPenaltyTeam('for');
                          setPendingPenaltyKickerId(String(selectedPlayerId).trim());
                          setPenaltyStep('result');
                        }}
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
                <div className="flex-[8] flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
                  {/* Sem posse | GOL | Com posse - três botões iguais em uma linha */}
                  <div className="relative z-20 flex gap-1 shrink-0 min-h-[48px]">
                    <button
                      onClick={() => setBallPossessionNow('sem')}
                      disabled={isBlockedByPenalty || isRealtimeActionLocked}
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty || isRealtimeActionLocked
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          : ballPossessionNow === 'sem'
                          ? 'bg-red-500/40 border-red-500 text-white'
                          : 'bg-zinc-900 border-red-500/30 text-red-500/70 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
                      }`}
                    >
                      Sem posse
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isMatchStarted || shouldDisableRealtimeEventButtons) return;
                        if (blockRealtimeEventWhenNeeded()) return;
                        if (!hasSelectedPlayer) {
                          setTopRightNotice('Selecione um atleta em quadra na lista à esquerda antes de marcar o gol.');
                          return;
                        }
                        applyPreActionClockBehavior('goal');
                        setPendingGoalTime(null);
                        setGoalStep('team');
                        setPendingGoalIsOpponent(false);
                        setPendingGoalType(null);
                        setPendingGoalPlayerId(null);
                      }}
                      disabled={!isMatchStarted || shouldDisableRealtimeEventButtons}
                      data-testid="event-selector-goal"
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        isMatchStarted && !shouldDisableRealtimeEventButtons
                          ? hasSelectedPlayer
                            ? 'bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500/30'
                            : 'bg-zinc-900/80 text-zinc-500 border-zinc-600 opacity-80'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-zinc-700'
                      }`}
                    >
                      <Goal size={22} />
                      GOL
                    </button>
                    <button
                      onClick={() => setBallPossessionNow('com')}
                      disabled={isBlockedByPenalty || isRealtimeActionLocked}
                      className={`flex-1 min-h-[48px] px-4 py-4 rounded-lg border-2 font-black uppercase text-base transition-all ${
                        isBlockedByPenalty || isRealtimeActionLocked
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
                  <div className="flex-1 flex flex-col min-h-0 gap-1 overflow-hidden">
                    {/* Linha central: FALTA/ESCANTEIO | TEMPO (maior) | PASSE/CHUTE */}
                    <div className="flex-1 flex items-stretch justify-center gap-1 min-h-0 overflow-hidden">
                      {/* Esquerda - FALTA e ESCANTEIO */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0 min-h-0 overflow-hidden">
                        <button
                          onClick={() => {
                            if (shouldDisableRealtimeEventButtons) return;
                            handleSelectAction('foul');
                          }}
                          data-testid="event-selector-foul"
                          disabled={shouldDisableRealtimeEventButtons}
                          className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                            shouldDisableRealtimeEventButtons
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
                            if (shouldDisableRealtimeEventButtons) return;
                            handleSelectAction('corner');
                          }}
                          data-testid="event-selector-corner"
                          disabled={!isMatchStarted || shouldDisableRealtimeEventButtons}
                          className={`flex-1 min-h-[44px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                            shouldDisableRealtimeEventButtons
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500/70 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 shadow-sm'
                          }`}
                        >
                          ESCANTEIO
                        </button>
                      </div>

                      {/* TEMPO - Centro: cronômetro (realtime) - MAIOR que os outros botões */}
                      <div
                        data-testid="match-clock-panel"
                        data-tour-highlighted={isClockTourTargetHighlighted('match-clock-panel') ? 'true' : undefined}
                        className={`relative z-10 flex flex-col items-center justify-start gap-1 flex-[2] min-w-0 min-h-0 overflow-y-auto overflow-x-hidden ${getClockTourTargetClass('match-clock-panel')}`}
                      >
                        {isPostmatch ? (
                          <div className="w-full h-full min-h-[80px] py-2 px-3 rounded-lg border-2 border-zinc-600 bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
                            <p
                              data-testid="postmatch-period-label"
                              className={`text-sm sm:text-base font-black uppercase tracking-wide ${
                                currentPeriod === '1T' ? 'text-[#00f0ff]' : 'text-emerald-400'
                              }`}
                            >
                              {currentPeriod === '1T' ? '1º tempo · coleta' : '2º tempo · coleta'}
                            </p>
                            {currentPeriod === '1T' && (
                              <button
                                type="button"
                                onClick={handleEndFirstHalfCollection}
                                data-testid="postmatch-end-first-half"
                                className="w-full mt-1 px-2 py-2 rounded-lg border-2 border-amber-500/70 bg-amber-500/15 text-amber-200 text-[10px] sm:text-xs font-bold uppercase hover:bg-amber-500/25 transition-colors"
                              >
                                Encerrar coleta do 1º tempo
                              </button>
                            )}
                            {currentPeriod === '2T' && (
                              <button
                                type="button"
                                onClick={handleReturnToFirstHalfCollection}
                                data-testid="postmatch-return-first-half"
                                className="w-full mt-1 px-2 py-2 rounded-lg border-2 border-sky-500/70 bg-sky-500/15 text-sky-200 text-[10px] sm:text-xs font-bold uppercase hover:bg-sky-500/25 transition-colors"
                              >
                                Voltar ao 1º tempo
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="w-full flex flex-col items-center gap-0.5 shrink-0 px-1">
                              <span
                                data-testid="clock-state"
                                className={`text-[11px] font-black uppercase tracking-[0.12em] text-center leading-tight ${
                                  currentPeriod === '1T' ? 'text-[#00f0ff]' : 'text-emerald-400'
                                }`}
                              >
                                {getClockStateLabel(clockSnapshot.state)}
                                {clockSnapshot.state !== 'PRE_JOGO' &&
                                clockSnapshot.state !== 'INTERVALO' &&
                                clockSnapshot.state !== 'ENCERRADO'
                                  ? ` · ${currentPeriod === '1T' ? '1T' : '2T'}`
                                  : ''}
                              </span>
                            </div>
                            <div className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950/70 px-3 py-2 flex flex-col items-center justify-center gap-1.5 shrink-0">
                              <div data-testid="clock-time" className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight tabular-nums leading-none">
                                {formatTime(matchTime)}
                              </div>
                              {clockPrimaryAction ? (
                                <button
                                  type="button"
                                  onClick={clockPrimaryAction.onClick}
                                  disabled={clockPrimaryAction.disabled}
                                  data-tour-highlighted={isClockTourTargetHighlighted('clock-primary') ? 'true' : undefined}
                                  data-testid={
                                    clockSnapshot.state === 'PRE_JOGO'
                                      ? 'clock-start'
                                      : clockSnapshot.state === 'PAUSADO'
                                        ? 'clock-continue'
                                        : clockSnapshot.state === 'INTERVALO'
                                          ? 'clock-start-second-half'
                                          : 'clock-pause'
                                  }
                                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border-2 font-black uppercase text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-white ${clockPrimaryAction.className} ${clockPrimaryAction.disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'} ${getClockTourTargetClass('clock-primary')}`}
                                >
                                  {clockPrimaryAction.label}
                                </button>
                              ) : (
                                <div className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-500 text-xs font-bold uppercase flex items-center justify-center">
                                  Partida encerrada
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={openClockSyncModal}
                                disabled={clockSnapshot.state === 'ENCERRADO' || showClockSyncModal}
                                data-testid="clock-sync"
                                data-tour-highlighted={isClockTourTargetHighlighted('clock-sync') ? 'true' : undefined}
                                className={`w-full px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                                  clockSnapshot.state === 'ENCERRADO' || showClockSyncModal
                                    ? 'border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                    : 'border-zinc-600 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700'
                                } ${getClockTourTargetClass('clock-sync')}`}
                              >
                                Sincronizar cronômetro
                              </button>
                              {isPausedByEvent && (
                                <p className="text-center text-[10px] font-bold uppercase text-emerald-200 leading-tight">
                                  Evento pausou o relógio. Continue a partida.
                                </p>
                              )}
                              {isRealtimeActionLocked && (
                                <p className="text-center text-[10px] font-bold uppercase text-amber-200 leading-tight">
                                  {getRealtimeBlockMessage()}
                                </p>
                              )}
                            </div>
                            <div className="w-full flex flex-col gap-1 shrink-0">
                              {currentPeriod === '1T' && canEndTime && !isMatchEnded && (
                                <button
                                  onClick={handleEndTime}
                                  data-testid="clock-end-period"
                                  className="w-full px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                  Encerrar Tempo
                                </button>
                              )}
                              {currentPeriod === '2T' && !isMatchEnded && (
                                <button
                                  type="button"
                                  onClick={handleEndMatchRealtime}
                                  data-testid="clock-end-match"
                                  className="w-full px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                  Encerrar partida
                                </button>
                              )}
                              {currentPeriod === '1T' && !isMatchEnded && (
                                <button
                                  type="button"
                                  onClick={handleEndFirstHalfCollection}
                                  data-testid="clock-end-first-half"
                                  className="w-full px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/70 text-amber-200 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                  Encerrar coleta do 1º tempo
                                </button>
                              )}
                              {currentPeriod === '2T' && !isMatchEnded && (
                                <button
                                  type="button"
                                  onClick={handleReturnToFirstHalfCollection}
                                  data-testid="clock-return-first-half"
                                  className="w-full px-2 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/70 text-sky-200 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                  Voltar ao 1º tempo
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Direita - Vertical: COM posse = PASSE/CHUTE; SEM posse = DESARME/DEFESA - tamanhos similares */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0 min-h-0 overflow-hidden">
                        {ballPossessionNow === 'com' ? (
                          <>
                            <button
                              onClick={() => handleSelectAction('pass')}
                              data-testid="event-selector-pass"
                              data-tour-highlighted={isClockTourTargetHighlighted('event-selector-pass') ? 'true' : undefined}
                              disabled={shouldDisableRealtimeEventButtons}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                shouldDisableRealtimeEventButtons
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : !hasSelectedPlayer
                                  ? 'bg-zinc-900/70 border-zinc-700 text-zinc-500 opacity-70'
                                  : selectedAction === 'pass'
                                  ? 'bg-zinc-100 border-white text-black'
                                  : 'bg-zinc-900 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 hover:border-white hover:text-white'
                              } ${getClockTourTargetClass('event-selector-pass')}`}
                            >
                              PASSE
                            </button>
                            <button
                              onClick={() => handleSelectAction('shot')}
                              data-testid="event-selector-shot"
                              disabled={shouldDisableRealtimeEventButtons}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                shouldDisableRealtimeEventButtons
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : !hasSelectedPlayer
                                  ? 'bg-zinc-900/70 border-red-500/20 text-red-500/50 opacity-70'
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
                              disabled={shouldDisableRealtimeEventButtons}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                shouldDisableRealtimeEventButtons
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
                              disabled={shouldDisableRealtimeEventButtons}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                shouldDisableRealtimeEventButtons
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                  : selectedAction === 'save'
                                  ? 'bg-purple-500/30 border-purple-500 text-purple-400'
                                  : 'bg-zinc-900 border-purple-500/30 text-purple-500/70 hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-400'
                              }`}
                            >
                              CHUTE (ADVERSARIO)
                            </button>
                            <button
                              onClick={() => handleSelectAction('block')}
                              data-testid="event-selector-block"
                              disabled={shouldDisableRealtimeEventButtons}
                              className={`flex-1 min-h-0 w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                                shouldDisableRealtimeEventButtons
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

                    {/* Linha inferior: PÊNALTI, TIRO LIVRE, LATERAL, CARTÃO, CARTÃO ADVERSÁRIO */}
                    <div className="relative z-20 grid grid-cols-5 gap-1 shrink-0 min-h-[56px] bg-black">
                      <button
                        onClick={() => {
                          if (shouldDisableRealtimeEventButtons) return;
                          if (isPostmatch && getTimeForEvent() === null) {
                            alert('Informe o tempo (ex.: 0100 para 01:00).');
                            return;
                          }
                          applyPreActionClockBehavior('penalty');
                          setPenaltyStep('team');
                          setPendingPenaltyTeam(null);
                          setPendingPenaltyKickerId(null);
                          setSelectedAction(null);
                        }}
                        data-testid="event-selector-penalty"
                        disabled={shouldDisableRealtimeEventButtons}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          shouldDisableRealtimeEventButtons
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : penaltyStep ? 'bg-purple-500/40 border-purple-500 text-white'
                            : 'bg-zinc-900 border-purple-500/30 text-purple-500/70 hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-400'
                        }`}
                      >
                        PÊNALTI
                      </button>
                      <button
                        onClick={() => {
                          if (shouldDisableRealtimeEventButtons) return;
                          if (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5) {
                            return; // Habilitado quando pelo menos um lado tem 5 faltas no período atual
                          }
                          if (isPostmatch && getTimeForEvent() === null) {
                            alert('Informe o tempo (ex.: 0100 para 01:00).');
                            return;
                          }
                          applyPreActionClockBehavior('freeKick');
                          setFreeKickStep('team');
                          setPendingFreeKickTeam(null);
                          setPendingFreeKickKickerId(null);
                          setSelectedAction(null);
                        }}
                        data-testid="event-selector-freekick"
                        disabled={shouldDisableRealtimeEventButtons || (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5)}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors shadow-lg ${
                          shouldDisableRealtimeEventButtons || (foulsForCurrentPeriod < 5 && foulsAgainstCurrentPeriod < 5)
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
                          if (shouldDisableRealtimeEventButtons) return;
                          if (!hasSelectedPlayer) {
                            alert('Selecione um atleta primeiro.');
                            return;
                          }
                          handleSelectAction('lateral');
                        }}
                        data-testid="event-selector-lateral"
                        disabled={!isMatchStarted || shouldDisableRealtimeEventButtons}
                        className={`min-h-[48px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || shouldDisableRealtimeEventButtons
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : !hasSelectedPlayer
                            ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-500/40 opacity-70'
                            : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500/70 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 shadow-sm'
                        }`}
                      >
                        LATERAL
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) return;
                          if (isBlockedByPenalty) return;
                          if (!hasSelectedPlayer) {
                            alert('Selecione um atleta primeiro.');
                            return;
                          }
                          handleSelectAction('card');
                        }}
                        data-testid="event-selector-card"
                        disabled={!isMatchStarted || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : !hasSelectedPlayer
                            ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500/40 opacity-70'
                            : selectedAction === 'card'
                            ? 'bg-yellow-500/40 border-yellow-500 text-white'
                            : 'bg-zinc-900 border-yellow-500/30 text-yellow-500/70 hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-400'
                        }`}
                      >
                        CARTÃO
                      </button>
                      <button
                        onClick={() => {
                          if (!isMatchStarted) return;
                          if (isBlockedByPenalty) return;
                          handleSelectAction('cardAgainst');
                        }}
                        data-testid="event-selector-card-against"
                        disabled={!isMatchStarted || isBlockedByPenalty}
                        className={`min-h-[56px] w-full flex items-center justify-center rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                          !isMatchStarted || isBlockedByPenalty
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : selectedAction === 'cardAgainst'
                            ? 'bg-amber-500/40 border-amber-500 text-white'
                            : 'bg-zinc-900 border-amber-500/30 text-amber-500/70 hover:bg-amber-500/20 hover:border-amber-500 hover:text-amber-400'
                        }`}
                      >
                        CARTÃO ADVERSÁRIO
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

        {/* Eventos recentes - Parte inferior da tela */}
        <div className="h-[64px] min-h-[64px] max-h-[64px] bg-zinc-950 border-t border-zinc-800 px-3 py-2 flex-shrink-0 overflow-hidden">
          <div className="flex items-start sm:items-center gap-3 text-xs w-full h-full">
            <p className="text-zinc-500 font-bold uppercase shrink-0">Eventos recentes:</p>
            <div data-testid="recent-events" className="flex-1 flex gap-2 overflow-x-auto overflow-y-hidden min-w-0 pb-1">
              {lastCommandDisplayLines.length > 0 ? (
                lastCommandDisplayLines.slice(-5).map((line) => (
                  <div
                    key={line.key}
                    data-testid="recent-event-item"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded shrink-0 min-w-0 max-w-full"
                  >
                    <span data-testid="recent-event-time" className="text-zinc-400 font-mono shrink-0">{formatTime(line.absoluteTime)}</span>
                    <span className="text-zinc-600 shrink-0">·</span>
                    <span data-testid="recent-event-player" className="text-white font-semibold truncate">{line.playerName}</span>
                    <span className="text-zinc-600 shrink-0">·</span>
                    <span data-testid="recent-event-action" className="text-[#00f0ff] truncate">{line.actionText}</span>
                    {line.zone && (
                      <>
                        <span className="text-zinc-600 shrink-0">·</span>
                        <span className="text-zinc-500 shrink-0">{line.zone}</span>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-xs truncate">Nenhum evento registrado ainda.</p>
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
                    Selecione 5 atletas: 1 goleiro (slot abaixo) e 4 atletas de linha. Durante o jogo, um atleta de
                    linha pode assumir a função de goleiro (goleiro linha).
                  </p>
                  
                  {/* Escalação (5 jogadores) */}
                  <div className="mb-6">
                    <h4 className="text-white font-bold uppercase text-sm mb-3">
                      Atletas em quadra ({lineupPlayers.length}/5)
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
                                  {player.position === 'Goleiro' || index === 0 ? '🥅 GOLEIRO' : `Atleta ${index + 1}`}
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
                            data-testid={`lineup-player-option-${playerId}`}
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
                        data-testid="lineup-ball-us"
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
                        data-testid="lineup-ball-opponent"
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
                      data-testid="lineup-confirm-start"
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
                      <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Defesa pra fora</p>
                      <p className="text-slate-400 text-2xl font-black">{firstHalfStats.savesOutside}</p>
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

        {!isPostmatch && (
          <ClockHelpPanel
            isOpen={showClockHelpPanel}
            step={activeClockTourStep}
            currentIndex={activeClockTourIndex >= 0 ? activeClockTourIndex : 0}
            totalSteps={clockTourSteps.length}
            canGoBack={activeClockTourIndex > 0}
            canGoNext={activeClockTourIndex >= 0 && activeClockTourIndex < clockTourSteps.length - 1}
            hasCompleted={hasCompletedClockTour}
            onBack={goToPreviousClockTourStep}
            onNext={goToNextClockTourStep}
            onClose={closeClockProductTour}
            onComplete={completeClockProductTour}
            onOpenReference={openFullClockGuide}
          />
        )}

        {showEndMatchModal && !isPostmatch && (
          <div
            data-testid="end-match-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-match-dialog-title"
            className="fixed inset-0 z-[119] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
          >
            <div className="w-full max-w-md rounded-2xl border-2 border-red-500/60 bg-zinc-950 shadow-2xl shadow-black/40 overflow-hidden">
              <div className="border-b border-zinc-800 px-5 py-4">
                <p id="end-match-dialog-title" className="text-white text-sm font-black uppercase">Encerrar partida</p>
                <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                  O cronômetro passará para encerrado e a coleta ficará pronta para finalização.
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Próxima ação</p>
                  <p className="text-sm font-semibold text-zinc-100">Finalize a coleta assim que a partida for encerrada.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
                <button
                  type="button"
                  onClick={handleCancelEndMatchModal}
                  disabled={isEndingMatch}
                  data-testid="end-match-cancel"
                  className="px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 text-xs font-bold uppercase hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndMatchRealtime}
                  disabled={isEndingMatch}
                  data-testid="end-match-confirm"
                  className="px-4 py-2 rounded-lg border border-red-400 bg-red-500/15 text-red-100 text-xs font-black uppercase hover:bg-red-500/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isEndingMatch ? 'Encerrando...' : 'Encerrar partida'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showClockSyncModal && !isPostmatch && (
          <div data-testid="clock-sync-dialog" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-md rounded-2xl border-2 border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40 overflow-hidden">
              <div className="border-b border-zinc-800 px-5 py-4">
                <p className="text-white text-sm font-black uppercase">Sincronizar cronômetro</p>
                <p className="text-zinc-400 text-xs mt-1">
                  Ajuste manualmente o relógio do {currentPeriod === '1T' ? '1º tempo' : '2º tempo'}.
                </p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Período</p>
                    <p className="text-sm font-black uppercase text-zinc-100">{currentPeriod}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Atual</p>
                    <p className="text-sm font-black font-mono text-zinc-100">{formatTime(matchTime)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Proposto</p>
                    <p className="text-sm font-black font-mono text-[#00f0ff]">{syncPreviewLabel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase text-zinc-300">
                    Minuto
                    <input
                      type="text"
                      inputMode="numeric"
                      value={syncMinuteInput}
                      onChange={(e) => {
                        setSyncMinuteInput(e.target.value.replace(/\D/g, ''));
                        setSyncValidationError(null);
                      }}
                      data-testid="clock-sync-minute"
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base font-mono text-white focus:border-[#00f0ff] focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase text-zinc-300">
                    Segundo
                    <input
                      type="text"
                      inputMode="numeric"
                      value={syncSecondInput}
                      onChange={(e) => {
                        setSyncSecondInput(e.target.value.replace(/\D/g, ''));
                        setSyncValidationError(null);
                      }}
                      data-testid="clock-sync-second"
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base font-mono text-white focus:border-[#00f0ff] focus:outline-none"
                    />
                  </label>
                </div>
                {syncValidationError && (
                  <div data-testid="clock-sync-error" className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
                    {syncValidationError}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
                <button
                  type="button"
                  onClick={closeClockSyncModal}
                  data-testid="clock-sync-cancel"
                  className="px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 text-xs font-bold uppercase hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClockSync}
                  data-testid="clock-sync-confirm"
                  className="px-4 py-2 rounded-lg border border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] text-xs font-black uppercase hover:bg-[#00f0ff]/25 transition-colors"
                >
                  Confirmar sincronização
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

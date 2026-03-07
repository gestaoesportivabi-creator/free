/**
 * Tipos do Frontend (compatibilidade)
 * Duplicados do 21Scoutpro/types.ts para evitar problemas de importação
 */

export type Position = 'Goleiro' | 'Fixo' | 'Ala' | 'Pivô';

export interface Player {
  id: string;
  name: string;
  nickname: string;
  position: Position;
  jerseyNumber: number;
  dominantFoot: 'Destro' | 'Canhoto' | 'Ambidestro';
  age: number;
  height: number;
  weight?: number;
  birthDate?: string;
  lastClub: string;
  photoUrl?: string;
  isTransferred?: boolean;
  transferDate?: string;
  injuryHistory?: InjuryRecord[];
  maxLoads?: unknown[];
}

export interface InjuryRecord {
  id: string;
  playerId?: string;
  date?: string;
  type: string;
  location: string;
  side: 'Direito' | 'Esquerdo' | 'Bilateral' | 'N/A';
  severity: string;
  origin: 'Treino' | 'Jogo' | 'Outros';
  startDate: string;
  endDate?: string;
  daysOut?: number;
}

export interface PhysicalAssessment {
  id: string;
  playerId: string;
  date: string;
  weight: number;
  height: number;
  bodyFat: number;
  muscleMass: number;
  vo2max: number;
  flexibility: number;
  speed: number;
  strength: number;
  agility: number;
}

export interface MatchRecord {
  id?: string;
  opponent: string;
  date: string;
  result: 'V' | 'D' | 'E';
  goalsFor: number;
  goalsAgainst: number;
  competition?: string;
  playerStats: { [playerId: string]: MatchStats };
  teamStats: MatchStats;
  playerRelationships?: { [p1: string]: { [p2: string]: { passes: number; assists: number } } };
  postMatchEventLog?: Array<{ id: string; time: string; period: string; playerId: string; action: string; tipo: string; subtipo: string; passToPlayerId?: string; playerName?: string; passToPlayerName?: string; zone?: 'AT_ESQ' | 'AT_DIR' | 'DF_ESQ' | 'DF_DIR'; recordedByUserId?: string; recordedByName?: string }>;
  lineup?: { players: string[]; bench: string[]; ballPossessionStart: string };
  substitutionHistory?: Array<{ playerOutId: string; playerInId: string; time: number; period: string }>;
  possessionSecondsWith?: number;
  possessionSecondsWithout?: number;
}

export interface MatchStats {
  goals: number;
  assists: number;
  passesCorrect: number;
  passesWrong: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  tacklesWithBall: number;
  tacklesWithoutBall: number;
  tacklesCounterAttack: number;
  transitionErrors: number;
  yellowCards?: number;
  redCards?: number;
}

export interface WeeklySchedule {
  id: string;
  title: string;
  weekStart: string;
  weekEnd: string;
  days: DaySchedule[];
  isActive?: boolean;
  createdAt?: number;
}

export interface DaySchedule {
  day: string;
  date?: string;  // YYYY-MM-DD - data do dia
  activities: {
    time: string;
    activity: string;
    location: string;
    notes?: string;
    carga?: number;
    cargaPercent?: number;
    exerciseName?: string;
  }[];
}

/** Formato flat: cada linha = um evento (para Schedule component e ScheduleAlerts) */
export interface ScheduleDay {
  date: string;
  weekday: string;
  time: string;
  activity: string;
  location: string;
  notes?: string;
  carga?: number;
  cargaPercent?: number;
  exerciseName?: string;
}

export interface StatTargets {
  goals: number;
  assists: number;
  passesCorrect: number;
  passesWrong: number;
  shotsOn: number;
  shotsOff: number;
  tacklesPossession: number;
  tacklesNoPossession: number;
  tacklesCounter: number;
  transitionError: number;
}

export interface PlayerTimeControl {
  id: string;
  matchId: string;
  playerId: string;
  timeEntries: {
    entryTime: string;
    exitTime?: string;
  }[];
  totalTime: number;
}


export interface Team {
  id: string;
  nome: string;
  categoria?: string;
  temporada?: string;
  tecnicoId: string;
  clubeId?: string;
  createdAt: string;
}

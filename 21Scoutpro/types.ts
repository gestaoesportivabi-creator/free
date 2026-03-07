// User Types
export type UserRole = 'Treinador' | 'Preparador Físico' | 'Supervisor' | 'Diretor' | 'Atleta';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  linkedPlayerId?: string;
}

// Championship Table Types
export interface ChampionshipMatch {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  team: string; // Nome da equipe
  opponent: string; // Nome do adversário
  competition: string; // Nome da competição
  location?: string; // Mandante/Visitante
  scoreTarget?: string; // Meta de pontuação esperada (texto livre)
}

export interface Championship {
  id: string;
  name: string;
  phase?: string; // Fase: "1 Fase classificatória" | "1 PlayOffs"
  /** Pontuação por resultado */
  pointsPerWin?: number;
  pointsPerDraw?: number;
  pointsPerLoss?: number;
  suspensionRules: {
    yellowCardsForSuspension: number; // Quantidade de amarelos para suspensão
    redCardSuspension: number; // Jogos de suspensão por vermelho
    yellowAccumulationSuspension: number; // Jogos de suspensão por acumulação de amarelos
  };
  /** Zerar cartões ao avançar de fase */
  resetCardsOnPhaseAdvance?: boolean;
  /** IDs das equipes participantes */
  teamIds?: string[];
  createdAt?: string;
}

// Player Types
export type Position = 'Goleiro' | 'Fixo' | 'Ala' | 'Pivô';

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
  returnDate?: string; // Data de retorno prevista
  returnDateActual?: string; // Data de retorno real
  daysOut?: number;
}

// Max Load Types
export type LoadType = 'Kg' | 'Repetições';

export interface MaxLoad {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string;
  loadType: LoadType;
  value: number;
  date?: string; // Data do registro YYYY-MM-DD
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  position: Position;
  jerseyNumber: number;
  dominantFoot: 'Destro' | 'Canhoto' | 'Ambidestro';
  age: number;
  height: number;
  weight?: number; // Peso (kg)
  lastClub: string;
  photoUrl?: string;
  isTransferred?: boolean;
  transferDate?: string;
  injuryHistory?: InjuryRecord[];
  birthDate?: string; // YYYY-MM-DD
  maxLoads?: MaxLoad[];
}

// Match Types
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
  /** Passes que geraram transição (planilha pós-jogo) */
  passesTransition?: number;
  /** Passes em progressão (planilha pós-jogo) */
  passesProgression?: number;
  /** Finalização em zona de chute (planilha pós-jogo) */
  shotsShootZone?: number;
  /** Faltas (planilha pós-jogo) */
  fouls?: number;
  /** Defesas – goleiro (planilha pós-jogo) */
  saves?: number;
  /** Cartões amarelos (contabilizados por campeonato) */
  yellowCards?: number;
  /** Cartões vermelhos (contabilizados por campeonato) */
  redCards?: number;
  /** PSE média da partida (0-10) – Evolução PSE (Jogos) */
  rpeMatch?: number;
  /** Minutos jogados (Input de Dados / TimeControl) */
  minutesPlayed?: number;
  /** Gols tomados (equipe; Input de Dados) */
  goalsConceded?: number;
  /** Métodos dos gols feitos por método (Input de Dados) */
  goalMethodsScored?: Record<string, number>;
  /** Métodos dos gols tomados por método (Input de Dados) */
  goalMethodsConceded?: Record<string, number>;
  /** Tempos reais dos gols feitos (Input de Dados) */
  goalTimes?: Array<{ time: string; method?: string }>;
  /** Tempos reais dos gols tomados (Input de Dados) */
  goalsConcededTimes?: Array<{ time: string; method?: string }>;
  /** Gols em jogo aberto (Input de Dados) */
  goalsScoredOpenPlay?: number;
  /** Gols tomados em jogo aberto (Input de Dados) */
  goalsConcededOpenPlay?: number;
  /** Gols em bola parada (Input de Dados) */
  goalsScoredSetPiece?: number;
  /** Gols tomados em bola parada (Input de Dados) */
  goalsConcededSetPiece?: number;
}

export type PostMatchAction =
  | 'goal'
  | 'assist'
  | 'passCorrect'
  | 'passWrong'
  | 'passTransicao'
  | 'passProgressao'
  | 'shotOn'
  | 'shotOff'
  | 'shotZonaChute'
  | 'falta'
  | 'tackleWithBall'
  | 'tackleWithoutBall'
  | 'tackleCounter'
  | 'save';

export interface PostMatchEvent {
  id: string;
  time: string; // "MM:SS"
  period: '1T' | '2T';
  playerId: string;
  action: PostMatchAction;
  /** Tipo para exibição e dashboard (ex.: Gol, Passe, Finalização) */
  tipo: string;
  /** Subtipo para exibição e dashboard (ex.: A favor, Certo, No gol) */
  subtipo: string;
  /** ID do jogador que recebeu o passe (apenas para ações passCorrect/passWrong) */
  passToPlayerId?: string;
  /** Nome do atleta que fez a ação */
  playerName?: string;
  /** Nome do atleta que recebeu o passe (para passes) */
  passToPlayerName?: string;
  /** Zona da quadra (AT ESQ, AT DIR, DF ESQ, DF DIR) */
  zone?: 'AT_ESQ' | 'AT_DIR' | 'DF_ESQ' | 'DF_DIR';
  /** ID do usuário que registrou a ação (auditoria) */
  recordedByUserId?: string;
  /** Nome do usuário que registrou a ação (auditoria) */
  recordedByName?: string;
  /** Método do gol (ex.: Ataque, Contra-ataque) – usado na análise de quartetos */
  goalMethod?: string;
  /** true se for gol do adversário */
  isOpponentGoal?: boolean;
  /** Falta cometida por nossa equipe ('for') ou pelo adversário ('against') */
  foulTeam?: 'for' | 'against';
}

export interface MatchRecord {
  id: string;
  opponent: string;
  date: string;
  result: 'V' | 'D' | 'E';
  goalsFor: number;
  goalsAgainst: number;
  competition?: string;
  playerStats: { [playerId: string]: MatchStats };
  teamStats: MatchStats;
  playerRelationships?: {
    [playerId1: string]: {
      [playerId2: string]: {
        passes: number; // Quantidade de passes entre os dois
        assists: number; // Quantidade de assistências
      }
    }
  };
  lineup?: {
    players: string[]; // IDs dos 5 jogadores em quadra (primeiro é goleiro)
    bench: string[]; // IDs dos jogadores no banco
    ballPossessionStart: 'us' | 'opponent'; // Quem começou com a bola
  };
  postMatchEventLog?: PostMatchEvent[];
  /** Histórico de substituições da partida */
  substitutionHistory?: Array<{
    playerOutId: string;
    playerInId: string;
    time: number; // segundos
    period: '1T' | '2T';
  }>;
  /** Segundos com posse de bola (nossa equipe) – evolução campeonato */
  possessionSecondsWith?: number;
  /** Segundos sem posse de bola – evolução campeonato */
  possessionSecondsWithout?: number;
  /** Status da partida para exibição e filtros */
  status?: 'encerrado' | 'em_andamento' | 'nao_executado';
}

// Physical Assessment Types
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

// Schedule Types - Formato flat: cada linha = um evento (data, horário, atividade)
export interface ScheduleDay {
  date: string;       // YYYY-MM-DD
  weekday: string;    // Nome do dia da semana
  time: string;       // HH:MM
  activity: string;   // Treino, Jogo, Musculação, etc.
  location: string;
  notes?: string;
  // Campos para Musculação: carga e porcentagem
  carga?: number;     // Carga em kg ou repetições
  cargaPercent?: number; // Porcentagem da carga máxima do atleta
  exerciseName?: string; // Nome do exercício (para Musculação)
}

// Compatibilidade: DaySchedule agrupado (usado pelo backend em alguns casos)
export interface DaySchedule {
  day: string;
  date?: string;      // YYYY-MM-DD - incluído para não perder a data
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

export interface WeeklySchedule {
  id: string;
  title: string;
  weekStart: string;
  weekEnd: string;
  startDate?: string;  // Alias para weekStart
  endDate?: string;    // Alias para weekEnd
  days: ScheduleDay[] | DaySchedule[];  // Aceita formato flat ou agrupado
  isActive?: boolean;
  createdAt?: number;
}

// Stat Targets Types
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

// Time Control Types
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

// Team Types
export interface Team {
  id: string;
  nome: string;
  categoria?: string;
  temporada?: string;
  tecnicoId: string;
  clubeId?: string;
  logoUrl?: string; // URL/base64 do escudo da equipe
  createdAt: string;
}

// Sport Config Types
export interface SportConfig {
  name: string;
  positions: Position[];
  playerCount: number;
  fieldType: string;
  icon: string;
}

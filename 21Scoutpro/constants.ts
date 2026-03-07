import { Player, MatchRecord, SportConfig, InjuryRecord, TrainingSession, PhysicalAssessment, LoadType } from './types';

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  category: string;
  defaultLoadType: LoadType;
}

export const EXERCISE_CATEGORIES = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Braços',
  'Core',
  'Cardio'
];

export const EXERCISES: Exercise[] = [
  // Peito
  { id: 'supino-reto', name: 'Supino Reto', category: 'Peito', defaultLoadType: 'Kg' },
  { id: 'supino-inclinado', name: 'Supino Inclinado', category: 'Peito', defaultLoadType: 'Kg' },
  { id: 'supino-declinado', name: 'Supino Declinado', category: 'Peito', defaultLoadType: 'Kg' },
  { id: 'supino-halteres', name: 'Supino com Halteres', category: 'Peito', defaultLoadType: 'Kg' },
  { id: 'crucifixo', name: 'Crucifixo', category: 'Peito', defaultLoadType: 'Kg' },
  { id: 'flexao-braco', name: 'Flexão de Braço', category: 'Peito', defaultLoadType: 'Repetições' },
  { id: 'paralelas', name: 'Paralelas', category: 'Peito', defaultLoadType: 'Repetições' },
  
  // Costas
  { id: 'barra-fixa', name: 'Barra Fixa', category: 'Costas', defaultLoadType: 'Repetições' },
  { id: 'puxada-frente', name: 'Puxada Frontal', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'puxada-costas', name: 'Puxada Atrás', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'remada-curvada', name: 'Remada Curvada', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'remada-sentado', name: 'Remada Sentado', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'remada-unilateral', name: 'Remada Unilateral', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'serrote', name: 'Serrote', category: 'Costas', defaultLoadType: 'Kg' },
  { id: 'puxada-alta', name: 'Puxada Alta', category: 'Costas', defaultLoadType: 'Kg' },
  
  // Pernas
  { id: 'agachamento', name: 'Agachamento', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'agachamento-livre', name: 'Agachamento Livre', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'leg-press', name: 'Leg Press', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'extensora', name: 'Cadeira Extensora', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'flexora', name: 'Cadeira Flexora', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'stiff', name: 'Stiff', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'afundo', name: 'Afundo', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'elevacao-pelvica', name: 'Elevação Pélvica', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'agachamento-bulgaro', name: 'Agachamento Búlgaro', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'panturrilha', name: 'Panturrilha em Pé', category: 'Pernas', defaultLoadType: 'Kg' },
  { id: 'panturrilha-sentado', name: 'Panturrilha Sentado', category: 'Pernas', defaultLoadType: 'Kg' },
  
  // Ombros
  { id: 'desenvolvimento', name: 'Desenvolvimento', category: 'Ombros', defaultLoadType: 'Kg' },
  { id: 'elevacao-lateral', name: 'Elevação Lateral', category: 'Ombros', defaultLoadType: 'Kg' },
  { id: 'elevacao-frontal', name: 'Elevação Frontal', category: 'Ombros', defaultLoadType: 'Kg' },
  { id: 'remada-alta', name: 'Remada Alta', category: 'Ombros', defaultLoadType: 'Kg' },
  { id: 'crucifixo-invertido', name: 'Crucifixo Invertido', category: 'Ombros', defaultLoadType: 'Kg' },
  { id: 'desenvolvimento-halteres', name: 'Desenvolvimento com Halteres', category: 'Ombros', defaultLoadType: 'Kg' },
  
  // Braços
  { id: 'rosca-direta', name: 'Rosca Direta', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'rosca-martelo', name: 'Rosca Martelo', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'rosca-concentrada', name: 'Rosca Concentrada', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'triceps-pulley', name: 'Tríceps Pulley', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'triceps-frances', name: 'Tríceps Francês', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'triceps-coice', name: 'Tríceps Coice', category: 'Braços', defaultLoadType: 'Kg' },
  { id: 'triceps-paralela', name: 'Tríceps na Paralela', category: 'Braços', defaultLoadType: 'Repetições' },
  { id: 'rosca-21', name: 'Rosca 21', category: 'Braços', defaultLoadType: 'Kg' },
  
  // Core
  { id: 'abdominal', name: 'Abdominal', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'prancha', name: 'Prancha', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'abdominal-inverso', name: 'Abdominal Inverso', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'mountain-climber', name: 'Mountain Climber', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'abdominal-bicicleta', name: 'Abdominal Bicicleta', category: 'Core', defaultLoadType: 'Repetições' },
  { id: 'leg-raise', name: 'Elevação de Pernas', category: 'Core', defaultLoadType: 'Repetições' },
  
  // Cardio
  { id: 'esteira', name: 'Esteira', category: 'Cardio', defaultLoadType: 'Repetições' },
  { id: 'bicicleta-ergometrica', name: 'Bicicleta Ergométrica', category: 'Cardio', defaultLoadType: 'Repetições' },
  { id: 'eliptico', name: 'Elíptico', category: 'Cardio', defaultLoadType: 'Repetições' },
  { id: 'remador', name: 'Remador', category: 'Cardio', defaultLoadType: 'Repetições' },
];

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  futsal: {
    id: 'futsal',
    name: 'Futsal',
    labels: {
      goals: 'Gols',
      assists: 'Assistências',
      tackles: 'Desarmes',
      shots: 'Chutes',
      shotsOn: 'No Gol',
      shotsOff: 'Para Fora',
      cards: 'Cartões',
      period: 'Tempo'
    },
    positions: ['Goleiro', 'Fixo', 'Ala', 'Pivô']
  }
};

export const PLAYERS: Player[] = [];

// Função para gerar estatísticas realistas por posição
const generatePlayerStats = (position: string, playerId: string): any => {
  const baseStats: any = {
    minutesPlayed: 40,
    goalsConceded: 0,
    yellowCards: Math.random() > 0.85 ? 1 : 0,
    redCards: 0,
    rpeMatch: Number((Math.random() * 2 + 7).toFixed(1)), // 7.0 to 9.0
    goalsScoredOpenPlay: 0,
    goalsScoredSetPiece: 0,
    goalsConcededOpenPlay: 0,
    goalsConcededSetPiece: 0,
  };

  switch (position) {
    case 'Pivô':
      return {
        ...baseStats,
        goals: Math.floor(Math.random() * 3) + 1, // 1-3 gols
        assists: Math.floor(Math.random() * 2), // 0-1 assistências
        passesCorrect: Math.floor(Math.random() * 15) + 20, // 20-35
        passesWrong: Math.floor(Math.random() * 5) + 2, // 2-7
        wrongPassesTransition: Math.floor(Math.random() * 3) + 1, // 1-4
        tacklesWithBall: Math.floor(Math.random() * 8) + 12, // 12-20
        tacklesCounterAttack: Math.floor(Math.random() * 4) + 2, // 2-6
        tacklesWithoutBall: Math.floor(Math.random() * 10) + 8, // 8-18
        shotsOnTarget: Math.floor(Math.random() * 4) + 3, // 3-7
        shotsOffTarget: Math.floor(Math.random() * 3) + 2, // 2-5
      };
    case 'Ala':
      return {
        ...baseStats,
        goals: Math.floor(Math.random() * 2) + 1, // 1-2 gols
        assists: Math.floor(Math.random() * 3) + 1, // 1-3 assistências
        passesCorrect: Math.floor(Math.random() * 20) + 25, // 25-45
        passesWrong: Math.floor(Math.random() * 6) + 3, // 3-9
        wrongPassesTransition: Math.floor(Math.random() * 3) + 1, // 1-4
        tacklesWithBall: Math.floor(Math.random() * 10) + 15, // 15-25
        tacklesCounterAttack: Math.floor(Math.random() * 5) + 3, // 3-8
        tacklesWithoutBall: Math.floor(Math.random() * 12) + 10, // 10-22
        shotsOnTarget: Math.floor(Math.random() * 3) + 2, // 2-5
        shotsOffTarget: Math.floor(Math.random() * 4) + 2, // 2-6
      };
    case 'Fixo':
      return {
        ...baseStats,
        goals: Math.floor(Math.random() * 2), // 0-1 gols
        assists: Math.floor(Math.random() * 2), // 0-1 assistências
        passesCorrect: Math.floor(Math.random() * 25) + 30, // 30-55
        passesWrong: Math.floor(Math.random() * 5) + 2, // 2-7
        wrongPassesTransition: Math.floor(Math.random() * 2) + 1, // 1-3
        tacklesWithBall: Math.floor(Math.random() * 12) + 18, // 18-30
        tacklesCounterAttack: Math.floor(Math.random() * 6) + 4, // 4-10
        tacklesWithoutBall: Math.floor(Math.random() * 15) + 15, // 15-30
        shotsOnTarget: Math.floor(Math.random() * 2) + 1, // 1-3
        shotsOffTarget: Math.floor(Math.random() * 2) + 1, // 1-3
      };
    case 'Goleiro':
      return {
        ...baseStats,
        goals: 0,
        assists: Math.floor(Math.random() * 2), // 0-1 assistências
        passesCorrect: Math.floor(Math.random() * 10) + 15, // 15-25
        passesWrong: Math.floor(Math.random() * 4) + 1, // 1-5
        wrongPassesTransition: Math.floor(Math.random() * 2), // 0-2
        tacklesWithBall: Math.floor(Math.random() * 5) + 3, // 3-8
        tacklesCounterAttack: 0,
        tacklesWithoutBall: Math.floor(Math.random() * 8) + 5, // 5-13
        shotsOnTarget: 0,
        shotsOffTarget: 0,
      };
    default:
      return baseStats;
  }
};

// Função para gerar estatísticas do time
const generateTeamStats = (playerStats: Record<string, any>): any => {
  const totals = Object.values(playerStats).reduce((acc: any, stats: any) => {
    acc.goals += stats.goals || 0;
    acc.assists += stats.assists || 0;
    acc.passesCorrect += stats.passesCorrect || 0;
    acc.passesWrong += stats.passesWrong || 0;
    acc.wrongPassesTransition += stats.wrongPassesTransition || 0;
    acc.tacklesWithBall += stats.tacklesWithBall || 0;
    acc.tacklesCounterAttack += stats.tacklesCounterAttack || 0;
    acc.tacklesWithoutBall += stats.tacklesWithoutBall || 0;
    acc.shotsOnTarget += stats.shotsOnTarget || 0;
    acc.shotsOffTarget += stats.shotsOffTarget || 0;
    acc.rpeMatch += stats.rpeMatch || 0;
    return acc;
  }, {
    goals: 0, assists: 0, passesCorrect: 0, passesWrong: 0,
    wrongPassesTransition: 0, tacklesWithBall: 0, tacklesCounterAttack: 0,
    tacklesWithoutBall: 0, shotsOnTarget: 0, shotsOffTarget: 0, rpeMatch: 0
  });

  const playerCount = Object.keys(playerStats).length;
  
  return {
    minutesPlayed: 40,
    goals: totals.goals,
    goalsConceded: Math.floor(Math.random() * 4) + 1, // 1-4 gols tomados
    assists: totals.assists,
    yellowCards: Math.floor(Math.random() * 3), // 0-2
    redCards: Math.random() > 0.9 ? 1 : 0,
    passesCorrect: totals.passesCorrect,
    passesWrong: totals.passesWrong,
    wrongPassesTransition: totals.wrongPassesTransition,
    tacklesWithBall: totals.tacklesWithBall,
    tacklesCounterAttack: totals.tacklesCounterAttack,
    tacklesWithoutBall: totals.tacklesWithoutBall,
    shotsOnTarget: totals.shotsOnTarget,
    shotsOffTarget: totals.shotsOffTarget,
    rpeMatch: Number((totals.rpeMatch / playerCount).toFixed(1)),
    goalsScoredOpenPlay: Math.floor(totals.goals * 0.7),
    goalsScoredSetPiece: Math.ceil(totals.goals * 0.3),
    goalsConcededOpenPlay: Math.floor((Math.floor(Math.random() * 4) + 1) * 0.6),
    goalsConcededSetPiece: Math.ceil((Math.floor(Math.random() * 4) + 1) * 0.4),
  };
};

// Gerar partidas com estatísticas realistas
export const MATCHES: MatchRecord[] = [];

// MOCK DATA FOR PHYSICAL SCOUT
export const TRAINING_SESSIONS: TrainingSession[] = [];

// Dados fictícios de lesão removidos - agora usando dados reais dos jogadores (injuryHistory)
export const INJURIES: InjuryRecord[] = [];

export const ASSESSMENTS: PhysicalAssessment[] = []; // Start empty

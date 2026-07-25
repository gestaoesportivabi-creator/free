export const QA_SEED_GUARD = 'ALLOW_QA_SEED';
export const QA_CLEANUP_GUARD = 'ALLOW_QA_CLEANUP';
export const QA_CLEANUP_CONFIRMATION = 'DELETE_QA_ENVIRONMENT';

export type QaMatchKey = 'clock' | 'postmatch';

export interface QaMatchDefinition {
  key: QaMatchKey;
  competitionName: string;
  matchLabel: string;
  opponentName: string;
  matchDate: string;
  matchLocation: string;
  status: 'disponivel' | 'em_andamento';
  collectionPhase: number;
  resetOnSeed?: boolean;
}

export const QA_MATCHES: Record<QaMatchKey, QaMatchDefinition> = {
  clock: {
    key: 'clock',
    competitionName: 'QA CRONOMETRO 003B',
    matchLabel: 'QA CRONOMETRO 003B',
    opponentName: 'QA ADVERSARIO',
    matchDate: '2026-07-15',
    matchLocation: 'QA ARENA LOCAL',
    status: 'em_andamento',
    collectionPhase: 0,
    resetOnSeed: true,
  },
  postmatch: {
    key: 'postmatch',
    competitionName: 'QA POS-JOGO 003G',
    matchLabel: 'QA POS-JOGO 003G',
    opponentName: 'QA ADVERSARIO',
    matchDate: '2026-07-16',
    matchLocation: 'QA ARENA LOCAL',
    status: 'disponivel',
    collectionPhase: 0,
    resetOnSeed: true,
  },
} as const;

export const QA_ENVIRONMENT = {
  tenantName: 'QA SCOUT 21',
  userEmail: 'qa.scout21@qa.scout21.local',
  clubName: 'QA FUTSAL CLUBE',
  teamName: 'QA PRINCIPAL',
  competitionName: QA_MATCHES.clock.competitionName,
  matchLabel: QA_MATCHES.clock.matchLabel,
  opponentName: QA_MATCHES.clock.opponentName,
  userRole: 'ESSENCIAL',
  clubCnpj: '99.999.999/0001-QA',
  teamCategory: 'Adulto',
  teamSeason: '2026',
  matchDate: QA_MATCHES.clock.matchDate,
  matchLocation: QA_MATCHES.clock.matchLocation,
  playerNames: [
    'QA ATLETA 01',
    'QA ATLETA 02',
    'QA ATLETA 03',
    'QA ATLETA 04',
    'QA ATLETA 05',
    'QA ATLETA 06',
  ],
} as const;

export type QaPlayerName = (typeof QA_ENVIRONMENT.playerNames)[number];

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isDryRun(args: string[]): boolean {
  return args.includes('--dry-run');
}

export function ensureQaPrefix(value: string, label: string): void {
  if (!value.startsWith('QA')) {
    throw new Error(`${label} precisa manter prefixo QA para garantir isolamento.`);
  }
}

export function listQaMatches(): QaMatchDefinition[] {
  return Object.values(QA_MATCHES);
}

export function qaMatchDate(matchDate: string = QA_ENVIRONMENT.matchDate): Date {
  return new Date(`${matchDate}T00:00:00.000Z`);
}

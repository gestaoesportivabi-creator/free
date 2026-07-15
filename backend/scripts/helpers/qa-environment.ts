export const QA_SEED_GUARD = 'ALLOW_QA_SEED';
export const QA_CLEANUP_GUARD = 'ALLOW_QA_CLEANUP';
export const QA_CLEANUP_CONFIRMATION = 'DELETE_QA_ENVIRONMENT';

export const QA_ENVIRONMENT = {
  tenantName: 'QA SCOUT 21',
  userEmail: 'qa.scout21@qa.scout21.local',
  clubName: 'QA FUTSAL CLUBE',
  teamName: 'QA PRINCIPAL',
  competitionName: 'QA CRONOMETRO 003B',
  matchLabel: 'QA CRONOMETRO 003B',
  opponentName: 'QA ADVERSARIO',
  userRole: 'ESSENCIAL',
  clubCnpj: '99.999.999/0001-QA',
  teamCategory: 'Adulto',
  teamSeason: '2026',
  matchDate: '2026-07-15',
  matchLocation: 'QA ARENA LOCAL',
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

export function qaMatchDate(): Date {
  return new Date(`${QA_ENVIRONMENT.matchDate}T00:00:00.000Z`);
}

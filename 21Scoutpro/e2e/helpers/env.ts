function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}. Configure 21Scoutpro/.env.e2e antes de rodar a suite.`);
  }
  return value;
}

export const qaEnv = {
  email: required('E2E_QA_EMAIL'),
  password: required('E2E_QA_PASSWORD'),
  matchOpponent: process.env.E2E_QA_MATCH_OPPONENT?.trim() || 'QA ADVERSARIO',
  matchCompetition: process.env.E2E_QA_MATCH_COMPETITION?.trim() || 'QA CRONOMETRO 003B',
  postmatchOpponent: process.env.E2E_QA_POSTMATCH_OPPONENT?.trim() || 'QA ADVERSARIO',
  postmatchCompetition: process.env.E2E_QA_POSTMATCH_COMPETITION?.trim() || 'QA POS-JOGO 003G',
  playerName: process.env.E2E_QA_PLAYER_NAME?.trim() || 'QA ATLETA 02',
} as const;

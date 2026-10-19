/** Corte da função `/api` na Vercel. Acima disso a plataforma fecha o socket sem status. */
export const VERCEL_MAX_DURATION_MS = 60_000;

/** O PUT do cliente desiste antes do corte da Vercel, com erro explícito. */
export const CLIENT_MATCH_SAVE_TIMEOUT_MS = 55_000;

/**
 * Escrita de jogo (fita + estatísticas por atleta).
 * 30s estourava no re-finalize do J2-1 (~112 lances) e o retry quente passava.
 * Fica abaixo dos 55s do cliente para a API ainda devolver corpo.
 */
export const MATCH_WRITE_TRANSACTION_TIMEOUT_MS = 50_000;

/** Demais rotas do tenant. Não segura conexão à toa. */
export const TENANT_TRANSACTION_TIMEOUT_MS = 30_000;

export const TENANT_TRANSACTION_MAX_WAIT_MS = 10_000;

export function tenantTransactionTimeoutMs(kind: 'default' | 'match-write' = 'default'): number {
  return kind === 'match-write' ? MATCH_WRITE_TRANSACTION_TIMEOUT_MS : TENANT_TRANSACTION_TIMEOUT_MS;
}

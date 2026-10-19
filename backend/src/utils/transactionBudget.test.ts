import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CLIENT_MATCH_SAVE_TIMEOUT_MS,
  MATCH_WRITE_TRANSACTION_TIMEOUT_MS,
  TENANT_TRANSACTION_TIMEOUT_MS,
  VERCEL_MAX_DURATION_MS,
  tenantTransactionTimeoutMs,
} from './transactionBudget';

describe('orçamento do save de jogo', () => {
  it('a escrita de jogo passa dos 30s do J2-1 e ainda responde antes do cliente e da Vercel', () => {
    assert.equal(tenantTransactionTimeoutMs('match-write'), MATCH_WRITE_TRANSACTION_TIMEOUT_MS);
    assert.ok(TENANT_TRANSACTION_TIMEOUT_MS < MATCH_WRITE_TRANSACTION_TIMEOUT_MS);
    assert.ok(MATCH_WRITE_TRANSACTION_TIMEOUT_MS > 30_000);
    assert.ok(MATCH_WRITE_TRANSACTION_TIMEOUT_MS < CLIENT_MATCH_SAVE_TIMEOUT_MS);
    assert.ok(CLIENT_MATCH_SAVE_TIMEOUT_MS < VERCEL_MAX_DURATION_MS);
    assert.equal(CLIENT_MATCH_SAVE_TIMEOUT_MS, 55_000);
    assert.equal(VERCEL_MAX_DURATION_MS, 60_000);
  });

  it('o restante do tenant continua em 30s', () => {
    assert.equal(tenantTransactionTimeoutMs(), 30_000);
  });
});

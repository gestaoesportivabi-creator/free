import type { MatchRecord } from '../types';
import { matchesApi } from '../services/api';
import { isPersistedServerMatchId } from './matchIds';
import { preserveEncerradoStatus } from './matchStatus';

export type PostMatchEventLogVerifyStatus = 'confirmed' | 'shorter' | 'unavailable';

export interface PostMatchEventLogVerifyResult {
  status: PostMatchEventLogVerifyStatus;
  /** Partida a manter na tela. GET ausente não substitui a coleta local. */
  match: MatchRecord;
  serverLogLength?: number;
}

/**
 * Confere a fita depois do PUT. 404, rede ou corpo sem log devolvem `unavailable`
 * e preservam `saved` — o GET de verificação não apaga a coleta.
 */
export async function verifyPostMatchEventLog(
  saved: MatchRecord,
  expectedLogLength: number,
  fetchById: (id: string) => Promise<MatchRecord | null> = (id) => matchesApi.getById(id)
): Promise<PostMatchEventLogVerifyResult> {
  const id = saved.id != null ? String(saved.id).trim() : '';
  if (!isPersistedServerMatchId(id)) {
    return { status: 'unavailable', match: saved };
  }

  let fresh: MatchRecord | null = null;
  try {
    fresh = await fetchById(id);
  } catch {
    fresh = null;
  }

  const serverLog = fresh && Array.isArray(fresh.postMatchEventLog) ? fresh.postMatchEventLog : null;
  if (!fresh || !serverLog) {
    return { status: 'unavailable', match: saved };
  }

  if (expectedLogLength > 0 && serverLog.length < expectedLogLength) {
    return {
      status: 'shorter',
      match: saved,
      serverLogLength: serverLog.length,
    };
  }

  return {
    status: 'confirmed',
    match: preserveEncerradoStatus(saved, {
      ...saved,
      ...fresh,
      id: fresh.id || saved.id,
      postMatchEventLog: serverLog.length >= expectedLogLength ? serverLog : saved.postMatchEventLog,
    }),
    serverLogLength: serverLog.length,
  };
}

/** PUT estourou ou a rede caiu: o servidor pode ter gravado mesmo assim. */
export function isUnconfirmedSaveError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  return (
    msg.includes('tempo esgotado') ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('erro ao comunicar') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

export const SAVE_UNCONFIRMED_MESSAGE =
  'Não foi possível confirmar o salvamento no servidor. A coleta continua nesta tela e não foi apagada. Tente novamente.';

import { MatchRecord } from '../types';
import { matchesApi } from '../services/api';

export interface MatchUpsertResult {
  saved: MatchRecord;
  operation: 'created' | 'updated';
}

export async function upsertMatchRecord(newMatch: MatchRecord): Promise<MatchUpsertResult> {
  const idStr = newMatch.id != null ? String(newMatch.id).trim() : '';
  const isExistingMatch = idStr.length > 0 && !idStr.startsWith('sched-');

  if (isExistingMatch) {
    try {
      const saved = await matchesApi.update(idStr, newMatch);
      if (!saved) throw new Error('Resposta vazia ao atualizar partida');
      return { saved, operation: 'updated' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const is404 = msg.includes('404') || msg.includes('não encontrado') || msg.includes('not found');
      if (!is404) throw err;
    }
  }

  const matchToCreate = { ...newMatch };
  if (matchToCreate.id) {
    delete (matchToCreate as Partial<MatchRecord>).id;
  }
  const saved = await matchesApi.create(matchToCreate as MatchRecord);
  if (!saved) throw new Error('Resposta vazia ao criar partida');
  return { saved, operation: 'created' };
}

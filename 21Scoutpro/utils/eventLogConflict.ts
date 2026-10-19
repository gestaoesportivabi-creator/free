import type { MatchRecord } from '../types';

/** Mesmo código do 409 em `postMatchEventLogMerge` quando a fita union chega vazia. */
export const EMPTY_UNION_EVENT_LOG_CODE = 'EMPTY_UNION_EVENT_LOG';

export const EMPTY_UNION_EVENT_LOG_MESSAGE =
  'O servidor recusou este salvamento: a fita chegou vazia e esta partida já tem lances gravados. A coleta desta tela foi mantida e nenhum lance foi apagado.';

export function isEmptyUnionEventLogError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: unknown }).status;
  const code = (error as { code?: unknown }).code;
  return status === 409 && code === EMPTY_UNION_EVENT_LOG_CODE;
}

export function readLineupDeletedEventIds(lineup: unknown): string[] {
  if (!lineup || typeof lineup !== 'object' || Array.isArray(lineup)) return [];
  const raw = (lineup as { deletedEventIds?: unknown }).deletedEventIds;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const id = String(item).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function rememberDeletedIds(target: Set<string>, lineup: MatchRecord['lineup'] | unknown): void {
  for (const id of readLineupDeletedEventIds(lineup)) target.add(id);
}

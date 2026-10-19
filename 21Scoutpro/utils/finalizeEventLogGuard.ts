import { isPersistedServerMatchId } from './matchIds';

export const EMPTY_EVENT_LOG_FINALIZE_MESSAGE =
  'Não foi possível confirmar os lances desta partida. A finalização foi bloqueada para não enviar um log vazio. Recarregue a partida e tente novamente.';

/**
 * Finalizar não pode mandar `eventLog: []` (nem encerrar omitindo a fita)
 * quando a hidratação falhou ou a contagem não existe.
 * Contagem 0 com busca bem-sucedida é fita vazia de verdade.
 */
export function emptyEventLogFinalizeBlock(input: {
  id?: string | null;
  postMatchEventLog?: unknown;
  postMatchEventCount?: number | null;
  localEventCount: number;
  deletedCount: number;
  hydrationFailed?: boolean;
}): string | null {
  const id = input.id != null ? String(input.id) : '';
  if (!isPersistedServerMatchId(id)) return null;
  if (input.localEventCount > 0 || input.deletedCount > 0) return null;

  const log = input.postMatchEventLog;
  const hasArray = Array.isArray(log);
  const logLength = hasArray ? log.length : 0;
  const hasCount = typeof input.postMatchEventCount === 'number' && Number.isFinite(input.postMatchEventCount);
  const count = hasCount ? (input.postMatchEventCount as number) : null;

  if (!input.hydrationFailed && count === 0 && logLength === 0) return null;

  const outgoingEmpty = !hasArray || logLength === 0;
  if (!outgoingEmpty) return null;
  if (input.hydrationFailed || !hasCount || (count != null && count > 0)) {
    return EMPTY_EVENT_LOG_FINALIZE_MESSAGE;
  }
  return null;
}

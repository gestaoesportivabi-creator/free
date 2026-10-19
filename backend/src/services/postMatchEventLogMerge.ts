/**
 * União de postMatchEventLog no PUT /matches/:id.
 * Só entra quando o client envia eventLogWriteMode 'union'.
 * Client antigo (campo ausente) não passa por aqui: o service faz replace
 * do array, e omitir um lance continua sendo exclusão.
 *
 * Eventos com id: união; o recebido substitui o armazenado no mesmo id.
 * deletedEventIds sai do armazenado antes de comparar tamanhos — apagar
 * todos os lances com id manda [] + a lista de ids e não pode virar 409.
 * Eventos sem id: replace do que sobrou só se o recebido não for menor;
 * se for menor, 409 (não apaga lances).
 */

export const EVENT_LOG_WRITE_MODE_UNION = 'union';

export function isUnionEventLogWrite(mode: unknown): boolean {
  return mode === EVENT_LOG_WRITE_MODE_UNION;
}

import { ConflictError } from '../utils/errors';

type EventRecord = Record<string, unknown>;

function isEventRecord(value: unknown): value is EventRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function eventId(value: unknown): string | null {
  if (!isEventRecord(value)) return null;
  const raw = value.id;
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const id = String(raw).trim();
  return id.length > 0 ? id : null;
}

function normalizeDeletedIds(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  const ids = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const id = String(item).trim();
    if (id) ids.add(id);
  }
  return ids;
}

function periodRank(period: unknown): number {
  const value = String(period ?? '').trim().toUpperCase();
  if (value === '1T' || value === '1') return 1;
  if (value === '2T' || value === '2') return 2;
  return 9;
}

function clockSeconds(time: unknown): number {
  if (typeof time === 'number' && Number.isFinite(time)) return time;
  if (typeof time !== 'string') return Number.MAX_SAFE_INTEGER;
  const match = time.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

function timestampValue(event: EventRecord): number {
  const raw = event.timestamp ?? event.createdAt ?? event.recordedAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Number.MAX_SAFE_INTEGER;
}

/** 1T antes de 2T; dentro do período, pelo tempo de jogo; empate mantém a ordem já montada. */
function sortEventsByExistingTime<T extends EventRecord>(events: T[]): T[] {
  return events
    .map((event, index) => ({
      event,
      index,
      period: periodRank(event.period),
      seconds: clockSeconds(event.time),
      timestamp: timestampValue(event),
    }))
    .sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      if (a.seconds !== b.seconds) return a.seconds - b.seconds;
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return a.index - b.index;
    })
    .map((item) => item.event);
}

function partition(events: unknown[]): { withId: EventRecord[]; withoutId: unknown[] } {
  const withId: EventRecord[] = [];
  const withoutId: unknown[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    const id = eventId(event);
    if (!id || !isEventRecord(event)) {
      withoutId.push(event);
      continue;
    }
    if (seen.has(id)) {
      const index = withId.findIndex((item) => eventId(item) === id);
      if (index >= 0) withId[index] = event;
      continue;
    }
    seen.add(id);
    withId.push(event);
  }
  return { withId, withoutId };
}

function shrinkWithoutIdsMessage(receivedCount: number, storedCount: number): string {
  return `Conflito ao salvar os lances: chegaram ${receivedCount} evento(s) sem id e já havia ${storedCount} armazenado(s). A atualização foi recusada para não apagar lances. Envie o log completo ou informe deletedEventIds com os ids excluídos.`;
}

/**
 * @throws ConflictError 409 quando, depois de aplicar deletedEventIds,
 * o payload não tem ids e ainda é menor que o que restou armazenado,
 * ou quando a parte sem id encolhe num payload que também tem ids.
 */
export function mergePostMatchEventLogs(
  storedRaw: unknown,
  receivedRaw: unknown,
  deletedEventIdsRaw?: unknown
): unknown[] {
  const stored = Array.isArray(storedRaw) ? storedRaw : [];
  const received = Array.isArray(receivedRaw) ? receivedRaw : [];
  const deleted = normalizeDeletedIds(deletedEventIdsRaw);
  const storedAfterDeletes =
    deleted.size === 0
      ? stored
      : stored.filter((event) => {
          const id = eventId(event);
          return !id || !deleted.has(id);
        });
  const storedParts = partition(storedAfterDeletes);
  const receivedParts = partition(received);

  if (receivedParts.withId.length === 0) {
    if (received.length < storedAfterDeletes.length) {
      throw new ConflictError(shrinkWithoutIdsMessage(received.length, storedAfterDeletes.length));
    }
    return received.slice();
  }

  if (receivedParts.withoutId.length < storedParts.withoutId.length) {
    throw new ConflictError(
      shrinkWithoutIdsMessage(receivedParts.withoutId.length, storedParts.withoutId.length)
    );
  }

  const receivedById = new Map<string, EventRecord>();
  for (const event of receivedParts.withId) {
    const id = eventId(event);
    if (id) receivedById.set(id, event);
  }

  const merged: EventRecord[] = [];
  const consumed = new Set<string>();

  for (const event of storedParts.withId) {
    const id = eventId(event);
    if (!id) continue;
    consumed.add(id);
    if (deleted.has(id)) continue;
    const incoming = receivedById.get(id);
    merged.push(incoming ? { ...incoming } : { ...event });
  }

  for (const event of receivedParts.withId) {
    const id = eventId(event);
    if (!id || consumed.has(id) || deleted.has(id)) continue;
    merged.push({ ...event });
  }

  for (const event of receivedParts.withoutId) {
    if (isEventRecord(event)) merged.push({ ...event });
  }

  return sortEventsByExistingTime(merged);
}

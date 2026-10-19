/**
 * Tombstones de lances excluídos no modo union.
 * Ficam em lineup.deletedEventIds da própria partida (o JSON já existe;
 * não abre coluna nova). O merge recebe a união com o deletedEventIds do
 * pedido, então um PUT atrasado que ainda traz o lance — e não manda o id
 * excluído — não recoloca o evento.
 */

import { mergeLineupPreservingClockSnapshot } from './matchLineupClock';
import { mergePostMatchEventLogs, normalizeDeletedEventIds } from './postMatchEventLogMerge';

export function readLineupDeletedEventIds(lineup: unknown): string[] {
  if (!lineup || typeof lineup !== 'object' || Array.isArray(lineup)) return [];
  return normalizeDeletedEventIds((lineup as { deletedEventIds?: unknown }).deletedEventIds);
}

export function unionDeletedEventIds(stored: unknown, incoming: unknown): string[] {
  return normalizeDeletedEventIds([...normalizeDeletedEventIds(stored), ...normalizeDeletedEventIds(incoming)]);
}

function copyLineup(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return { ...(value as Record<string, unknown>) };
}

export function applyUnionEventLogWrite(input: {
  existingLog: unknown;
  existingLineup: unknown;
  incomingLog: unknown;
  incomingDeletedIds: unknown;
  incomingLineup: unknown;
  lineupProvided: boolean;
}): { log: unknown[]; lineup: unknown } {
  const tombstones = unionDeletedEventIds(
    readLineupDeletedEventIds(input.existingLineup),
    input.incomingDeletedIds
  );
  const log = mergePostMatchEventLogs(input.existingLog, input.incomingLog, tombstones);
  const lineup = input.lineupProvided
    ? mergeLineupPreservingClockSnapshot(input.existingLineup, input.incomingLineup)
    : input.existingLineup;

  if (tombstones.length === 0) {
    return { log, lineup };
  }

  const base = copyLineup(lineup) ?? copyLineup(input.existingLineup) ?? {};
  return {
    log,
    lineup: { ...base, deletedEventIds: tombstones },
  };
}

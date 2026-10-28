/**
 * Chute no gol.
 * A trave nunca entra. O glossário de coleta não define o gol como chute no gol,
 * então o evento GOL (gol nosso) também não entra.
 * Espelho: 21Scoutpro/utils/shotsOnTarget.ts
 */

export interface ShotEventLike {
  action?: string;
  tipo?: string;
  subtipo?: string;
  result?: string;
  playerId?: string;
}

function norm(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function isWoodworkShot(event: ShotEventLike): boolean {
  const action = norm(event.action);
  const subtipo = norm(event.subtipo);
  const result = norm(event.result);
  return action === 'shotpost' || result === 'post' || subtipo === 'trave';
}

/** Só finalização no gol (resultado inside / subtipo "No gol" / action shotOn). */
export function isShotOnTargetEvent(event: ShotEventLike): boolean {
  if (isWoodworkShot(event)) return false;

  const action = norm(event.action);
  const tipo = norm(event.tipo);
  const subtipo = norm(event.subtipo);
  const result = norm(event.result);

  if (action === 'goal' || action === 'assist' || tipo === 'gol') return false;
  if (action === 'shotoff' || action === 'shotzonachute') return false;
  if (result === 'outside' || result === 'blocked') return false;
  if (
    subtipo === 'pra fora' ||
    subtipo === 'fora' ||
    subtipo === 'bloqueado' ||
    subtipo === 'zona de chute'
  ) {
    return false;
  }

  return action === 'shoton' || result === 'inside' || subtipo === 'no gol';
}

export function logHasShotEvidence(events: readonly ShotEventLike[]): boolean {
  return events.some((event) => {
    const action = norm(event.action);
    const tipo = norm(event.tipo);
    if (
      action === 'shoton' ||
      action === 'shotoff' ||
      action === 'shotzonachute' ||
      action === 'shotpost'
    ) {
      return true;
    }
    return tipo === 'finalizacao';
  });
}

export function countShotsOnTarget(events: readonly ShotEventLike[]): {
  team: number;
  byPlayer: Record<string, number>;
} {
  const byPlayer: Record<string, number> = {};
  let team = 0;
  for (const event of events) {
    if (!isShotOnTargetEvent(event)) continue;
    team += 1;
    const playerId = String(event.playerId ?? '').trim();
    if (!playerId) continue;
    byPlayer[playerId] = (byPlayer[playerId] ?? 0) + 1;
  }
  return { team, byPlayer };
}

/** Null quando o log não traz finalização: mantém o número já gravado (planilha). */
export function derivedShotsOnTarget(
  events: unknown
): { team: number; byPlayer: Record<string, number> } | null {
  if (!Array.isArray(events) || !logHasShotEvidence(events as ShotEventLike[])) return null;
  return countShotsOnTarget(events as ShotEventLike[]);
}

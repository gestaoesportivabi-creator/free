/**
 * Posse de bola da coleta ao vivo.
 * Os segundos nascem no cronômetro (com/sem posse) e viajam no JSON `lineup`,
 * porque a tabela de estatísticas da equipe não tem coluna de posse.
 * A leitura aceita o campo no topo da partida ou dentro do lineup.
 */

export interface PossessionSeconds {
  withBall: number;
  withoutBall: number;
}

export interface PossessionShare {
  us: number;
  opponent: number;
}

function finiteSeconds(value: unknown): number | undefined {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function readPossessionSeconds(match: {
  possessionSecondsWith?: number;
  possessionSecondsWithout?: number;
  lineup?: {
    possessionSecondsWith?: number;
    possessionSecondsWithout?: number;
  } | null;
}): PossessionSeconds {
  const topWith = finiteSeconds(match.possessionSecondsWith);
  const topWithout = finiteSeconds(match.possessionSecondsWithout);
  const lineWith = finiteSeconds(match.lineup?.possessionSecondsWith);
  const lineWithout = finiteSeconds(match.lineup?.possessionSecondsWithout);
  const topTotal = (topWith ?? 0) + (topWithout ?? 0);
  const lineTotal = (lineWith ?? 0) + (lineWithout ?? 0);
  if (topTotal > 0) {
    return { withBall: topWith ?? 0, withoutBall: topWithout ?? 0 };
  }
  if (lineTotal > 0) {
    return { withBall: lineWith ?? 0, withoutBall: lineWithout ?? 0 };
  }
  return { withBall: 0, withoutBall: 0 };
}

/** Percentuais do donut. Null quando a coleta não registrou posse. */
export function possessionShare(seconds: PossessionSeconds): PossessionShare | null {
  const total = seconds.withBall + seconds.withoutBall;
  if (total <= 0) return null;
  const us = Math.round((seconds.withBall / total) * 1000) / 10;
  const opponent = Math.round((seconds.withoutBall / total) * 1000) / 10;
  return { us, opponent };
}

/**
 * Save pós-jogo troca o lineup inteiro e não manda os segundos.
 * Mantém o que já estava gravado quando o payload novo omite o campo.
 */
export function preservePossessionSeconds<T extends object>(
  nextLineup: T,
  existingLineup: object | null | undefined
): T & { possessionSecondsWith?: number; possessionSecondsWithout?: number } {
  const out: Record<string, unknown> = { ...(nextLineup as Record<string, unknown>) };
  const prev =
    existingLineup && typeof existingLineup === 'object'
      ? (existingLineup as Record<string, unknown>)
      : undefined;
  for (const key of ['possessionSecondsWith', 'possessionSecondsWithout'] as const) {
    if (finiteSeconds(out[key]) !== undefined) continue;
    const kept = finiteSeconds(prev?.[key]);
    if (kept !== undefined) out[key] = kept;
  }
  const nextKickoff = typeof out.kickoffTime === 'string' ? out.kickoffTime.trim() : '';
  const prevKickoff = typeof prev?.kickoffTime === 'string' ? prev.kickoffTime.trim() : '';
  if (!nextKickoff && prevKickoff) out.kickoffTime = prevKickoff;
  return out as T & {
    possessionSecondsWith?: number;
    possessionSecondsWithout?: number;
    kickoffTime?: string;
  };
}

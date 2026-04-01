/**
 * Mesma lógica de PlayerStatsTable (GeneralScout) para export PDF.
 */
import type { MatchRecord, Player } from '../types';

export type PlayerStatTypePdf = 'passes' | 'shots' | 'tackles' | 'criticalErrors' | 'saves' | 'fouls' | 'cards';

const OPPONENT_FAKE_PLAYER_ID = 'OPPONENT_TEAM';

export interface PlayerTop10RowPdf {
  name: string;
  col1: number;
  col2: number;
  /** Finalizações: chutes bloqueados (shots). */
  col3?: number;
  total: number;
}

export function buildPlayerTop10ForPdf(
  matches: MatchRecord[],
  players: Player[],
  statType: PlayerStatTypePdf
): PlayerTop10RowPdf[] {
  if (statType === 'fouls') {
    const statsMap = new Map<string, { name: string; correct: number; wrong: number; total: number }>();
    matches.forEach((match) => {
      const log = Array.isArray((match as MatchRecord & { postMatchEventLog?: unknown[] }).postMatchEventLog)
        ? ((match as MatchRecord & { postMatchEventLog?: unknown[] }).postMatchEventLog as any[])
        : [];
      for (const e of log) {
        const action = String(e?.action ?? '').trim().toLowerCase();
        const tipo = String(e?.tipo ?? '').trim().toLowerCase();
        if (action !== 'falta' && tipo !== 'falta') continue;
        if (e?.foulTeam === 'against') continue;
        const pid = String(e?.playerId ?? '').trim();
        if (!pid || pid === OPPONENT_FAKE_PLAYER_ID) continue;
        const player = players.find((p) => String(p.id).trim() === pid);
        const playerName = player?.name ?? (e?.playerName?.trim() || pid);
        if (!statsMap.has(pid)) {
          statsMap.set(pid, { name: playerName, correct: 0, wrong: 0, total: 0 });
        }
        const row = statsMap.get(pid)!;
        row.correct += 1;
        row.total += 1;
      }
    });
    return Array.from(statsMap.values())
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((s) => ({ name: s.name, col1: s.correct, col2: 0, total: s.total }));
  }

  const statsMap = new Map<
    string,
    { name: string; correct: number; wrong: number; blocked?: number; total: number }
  >();

  matches.forEach((match) => {
    if (!match.playerStats) return;

    Object.entries(match.playerStats).forEach(([playerId, pStats]) => {
      const normalizedPlayerId = String(playerId).trim();
      if (statType === 'cards' && normalizedPlayerId === OPPONENT_FAKE_PLAYER_ID) return;
      const player = players.find((p) => String(p.id).trim() === normalizedPlayerId);
      const playerName = player ? player.name : normalizedPlayerId;

      if (!statsMap.has(normalizedPlayerId)) {
        statsMap.set(normalizedPlayerId, { name: playerName, correct: 0, wrong: 0, total: 0 });
      }
      const stats = statsMap.get(normalizedPlayerId)!;

      if (statType === 'passes') {
        stats.correct += pStats.passesCorrect || 0;
        stats.wrong += pStats.passesWrong || 0;
        stats.total += (pStats.passesCorrect || 0) + (pStats.passesWrong || 0);
      } else if (statType === 'shots') {
        const on = pStats.shotsOnTarget || 0;
        const off = pStats.shotsOffTarget || 0;
        const blk = pStats.shotsShootZone || 0;
        stats.correct += on;
        stats.wrong += off;
        stats.blocked = (stats.blocked ?? 0) + blk;
        stats.total += on + off + blk;
      } else if (statType === 'tackles') {
        stats.correct += (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0);
        stats.wrong += pStats.tacklesCounterAttack || 0;
        stats.total +=
          (pStats.tacklesWithBall || 0) + (pStats.tacklesWithoutBall || 0) + (pStats.tacklesCounterAttack || 0);
      } else if (statType === 'criticalErrors') {
        const totalWrong = pStats.passesWrong || 0;
        const transition =
          (pStats as { wrongPassesTransition?: number; transitionErrors?: number }).wrongPassesTransition ??
          (pStats as { transitionErrors?: number }).transitionErrors ??
          0;
        stats.correct += totalWrong;
        stats.wrong += transition;
        stats.total += transition;
      } else if (statType === 'saves') {
        const simple = (pStats as { savesSimple?: number }).savesSimple || 0;
        const hard = (pStats as { savesHard?: number }).savesHard || 0;
        stats.correct += simple;
        stats.wrong += hard;
        stats.total += simple + hard;
      } else if (statType === 'cards') {
        const yellow = (pStats as { yellowCards?: number }).yellowCards || 0;
        const red = (pStats as { redCards?: number }).redCards || 0;
        stats.correct += yellow;
        stats.wrong += red;
        stats.total += yellow + red;
      }
    });
  });

  return Array.from(statsMap.values())
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((s) => {
      const row: PlayerTop10RowPdf = {
        name: s.name,
        col1: s.correct,
        col2: s.wrong,
        total: s.total,
      };
      if (statType === 'shots') row.col3 = s.blocked ?? 0;
      return row;
    });
}

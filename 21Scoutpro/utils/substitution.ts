export interface SubstitutionRecord {
  playerOutId: string;
  playerInId: string;
  time: number;
  period: '1T' | '2T';
}

export interface SubstitutionState {
  lineup: string[];
  bench: string[];
  history: SubstitutionRecord[];
  counts: Record<string, number>;
  currentGoalkeeperId: string | null;
}

export interface ApplySubstitutionInput extends SubstitutionState {
  playerOutId: string;
  playerInId: string;
  time: number;
  period: '1T' | '2T';
  incomingIsGoalkeeper?: boolean;
}

export function applySubstitution(input: ApplySubstitutionInput): SubstitutionState {
  const playerOutId = String(input.playerOutId).trim();
  const playerInId = String(input.playerInId).trim();
  if (!playerOutId || !playerInId || playerOutId === playerInId) {
    throw new Error('Substituição exige atletas distintos para saída e entrada.');
  }
  const outIndex = input.lineup.indexOf(playerOutId);
  if (outIndex < 0) throw new Error('O atleta que sai não está em quadra.');
  if (!input.bench.includes(playerInId)) throw new Error('O atleta que entra não está no banco.');

  const lineup = [...input.lineup];
  lineup[outIndex] = playerInId;
  const bench = input.bench.filter((id) => id !== playerInId);
  if (!bench.includes(playerOutId)) bench.push(playerOutId);

  return {
    lineup,
    bench,
    history: [
      ...input.history,
      {
        playerOutId,
        playerInId,
        time: input.time,
        period: input.period,
      },
    ],
    counts: {
      ...input.counts,
      [playerOutId]: (input.counts[playerOutId] ?? 0) + 1,
      [playerInId]: (input.counts[playerInId] ?? 0) + 1,
    },
    currentGoalkeeperId:
      input.currentGoalkeeperId === playerOutId
        ? (input.incomingIsGoalkeeper ? playerInId : null)
        : input.currentGoalkeeperId,
  };
}

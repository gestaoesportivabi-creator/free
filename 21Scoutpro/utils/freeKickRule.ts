/**
 * Lei 13 das Leis do Jogo de Futsal da FIFA, adotadas pela CBFS.
 *
 * Falta acumulada é a punida com tiro livre direto. A conta é por equipe
 * e por período: os lados não se somam. O período seguinte começa do zero.
 *
 * Da 6ª falta acumulada de uma equipe naquele período em diante, o adversário
 * cobra tiro livre direto sem barreira. As cinco primeiras de cada equipe
 * seguem como tiro livre direto com barreira.
 *
 * O Scout não escolhe o local da cobrança (marca dos 10 m ou local da falta).
 * Isso continua com a arbitragem. Aqui só se registra quem cobra, o resultado
 * e se a barreira é permitida.
 */

export const ACCUMULATED_FOULS_FOR_NO_WALL = 6;

export type FreeKickSide = 'for' | 'against';
export type FreeKickWall = 'withWall' | 'noWall';

export interface AccumulatedFoulRights {
  foulsFor: number;
  foulsAgainst: number;
  /** Nossa equipe cobra sem barreira: o adversário já chegou à 6ª falta. */
  noWallForUs: boolean;
  /** O adversário cobra sem barreira: nossa equipe já chegou à 6ª falta. */
  noWallAgainst: boolean;
  /** Faltas nossas que ainda faltam para o adversário cobrar sem barreira. */
  foulsUntilOpponentNoWall: number;
  /** Faltas do adversário que ainda faltam para nós cobrarmos sem barreira. */
  foulsUntilOurNoWall: number;
  message: string;
}

function count(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function faltaPhrase(remaining: number, owner: 'nossas' | 'adversário'): string {
  if (remaining === 1) {
    return owner === 'nossas' ? 'falta 1 falta nossa' : 'falta 1 falta do adversário';
  }
  return owner === 'nossas'
    ? `faltam ${remaining} faltas nossas`
    : `faltam ${remaining} faltas do adversário`;
}

/**
 * Direito ao tiro livre direto sem barreira neste período.
 * `foulsFor` = faltas cometidas pela nossa equipe. `foulsAgainst` = pelo adversário.
 */
export function describeAccumulatedFouls(foulsFor: number, foulsAgainst: number): AccumulatedFoulRights {
  const ours = count(foulsFor);
  const theirs = count(foulsAgainst);
  const noWallForUs = theirs >= ACCUMULATED_FOULS_FOR_NO_WALL;
  const noWallAgainst = ours >= ACCUMULATED_FOULS_FOR_NO_WALL;
  const foulsUntilOurNoWall = Math.max(0, ACCUMULATED_FOULS_FOR_NO_WALL - theirs);
  const foulsUntilOpponentNoWall = Math.max(0, ACCUMULATED_FOULS_FOR_NO_WALL - ours);

  let message: string;
  if (noWallForUs && noWallAgainst) {
    message =
      'Os dois lados já chegaram à 6ª falta neste tempo: quem sofre a falta cobra tiro livre direto sem barreira.';
  } else if (noWallForUs) {
    const rest =
      foulsUntilOpponentNoWall > 0
        ? ` ${faltaPhrase(foulsUntilOpponentNoWall, 'nossas')} para o adversário ter o mesmo direito.`
        : '';
    message = `Nossa equipe cobra tiro livre direto sem barreira (adversário com ${theirs} faltas neste tempo).${rest}`;
  } else if (noWallAgainst) {
    const rest =
      foulsUntilOurNoWall > 0
        ? ` ${faltaPhrase(foulsUntilOurNoWall, 'adversário')} para nós termos o mesmo direito.`
        : '';
    message = `O adversário cobra tiro livre direto sem barreira (nós com ${ours} faltas neste tempo).${rest}`;
  } else {
    message = `Tiro livre com barreira. Sem barreira ainda não: ${faltaPhrase(foulsUntilOpponentNoWall, 'nossas')} para o adversário cobrar e ${faltaPhrase(foulsUntilOurNoWall, 'adversário')} para nós. A contagem é por equipe neste tempo.`;
  }

  return {
    foulsFor: ours,
    foulsAgainst: theirs,
    noWallForUs,
    noWallAgainst,
    foulsUntilOpponentNoWall,
    foulsUntilOurNoWall,
    message,
  };
}

/**
 * Barreira da cobrança que está sendo registrada.
 * Sem barreira só quando a equipe que vai defender já tem 6 faltas acumuladas
 * no período. Caso contrário, a cobrança é o tiro livre direto com barreira.
 */
export function directFreeKickWall(
  kickingSide: FreeKickSide,
  foulsFor: number,
  foulsAgainst: number
): FreeKickWall {
  const rights = describeAccumulatedFouls(foulsFor, foulsAgainst);
  if (kickingSide === 'for') return rights.noWallForUs ? 'noWall' : 'withWall';
  return rights.noWallAgainst ? 'noWall' : 'withWall';
}

export function freeKickWallLabel(wall: FreeKickWall): string {
  return wall === 'noWall' ? 'sem barreira' : 'com barreira';
}

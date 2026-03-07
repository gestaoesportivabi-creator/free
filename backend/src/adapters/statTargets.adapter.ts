/**
 * Adapter para transformar StatTargets do backend para formato do frontend
 * Corrige incompatibilidade de nomes de campos
 */

import { StatTargets } from '../types/frontend';

// Tipo do banco de dados
interface MetasEstatisticasDB {
  gols: number;
  assistencias: number;
  passesCorretos: number;
  passesErrados: number;
  chutesNoGol: number;
  chutesFora: number;
  desarmesComPosse: number;
  desarmesSemPosse: number;
  desarmesContraAtaque: number;
  errosTransicao: number;
}

/**
 * Transforma metas do banco para formato do frontend
 * Frontend usa: shotsOn, shotsOff, tacklesPossession, tacklesNoPossession, tacklesCounter, transitionError
 */
export function transformStatTargetsToFrontend(meta: MetasEstatisticasDB | null): StatTargets {
  if (!meta) {
    // Valores padrão
    return {
      goals: 0,
      assists: 0,
      passesCorrect: 0,
      passesWrong: 0,
      shotsOn: 0, // Frontend espera shotsOn, não shotsOnTarget
      shotsOff: 0, // Frontend espera shotsOff, não shotsOffTarget
      tacklesPossession: 0, // Frontend espera tacklesPossession, não tacklesWithBall
      tacklesNoPossession: 0, // Frontend espera tacklesNoPossession, não tacklesWithoutBall
      tacklesCounter: 0, // Frontend espera tacklesCounter, não tacklesCounterAttack
      transitionError: 0, // Frontend espera transitionError, não transitionErrors
    };
  }

  return {
    goals: meta.gols || 0,
    assists: meta.assistencias || 0,
    passesCorrect: meta.passesCorretos || 0,
    passesWrong: meta.passesErrados || 0,
    shotsOn: meta.chutesNoGol || 0, // Mapear chutesNoGol para shotsOn
    shotsOff: meta.chutesFora || 0, // Mapear chutesFora para shotsOff
    tacklesPossession: meta.desarmesComPosse || 0, // Mapear desarmesComPosse para tacklesPossession
    tacklesNoPossession: meta.desarmesSemPosse || 0, // Mapear desarmesSemPosse para tacklesNoPossession
    tacklesCounter: meta.desarmesContraAtaque || 0, // Mapear desarmesContraAtaque para tacklesCounter
    transitionError: meta.errosTransicao || 0, // Mapear errosTransicao para transitionError
  };
}

/**
 * Transforma StatTargets do frontend para formato do banco
 */
export function transformStatTargetsToBackend(targets: Partial<StatTargets>): Partial<MetasEstatisticasDB> {
  return {
    gols: targets.goals,
    assistencias: targets.assists,
    passesCorretos: targets.passesCorrect,
    passesErrados: targets.passesWrong,
    chutesNoGol: targets.shotsOn, // Mapear shotsOn para chutesNoGol
    chutesFora: targets.shotsOff, // Mapear shotsOff para chutesFora
    desarmesComPosse: targets.tacklesPossession, // Mapear tacklesPossession para desarmesComPosse
    desarmesSemPosse: targets.tacklesNoPossession, // Mapear tacklesNoPossession para desarmesSemPosse
    desarmesContraAtaque: targets.tacklesCounter, // Mapear tacklesCounter para desarmesContraAtaque
    errosTransicao: targets.transitionError, // Mapear transitionError para errosTransicao
  };
}


/**
 * Constantes do sistema
 */

// Roles do sistema
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  ESSENCIAL: 'ESSENCIAL',
  COMPETICAO: 'COMPETICAO',
  PERFORMANCE: 'PERFORMANCE',
} as const;

// Tipos de evento de jogo
export const TIPO_EVENTO = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
} as const;

// Tipos de resultado de jogo
export const RESULTADO_JOGO = {
  VITORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
} as const;


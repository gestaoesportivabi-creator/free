/**
 * Validador de Email
 * Aplicar ajuste recomendado da Seção 11.2.D (item 17)
 */

/**
 * Regex para validação de email (compatível com constraint do PostgreSQL)
 */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;

/**
 * Valida formato de email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }

  // Trim espaços
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email não pode estar vazio' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: 'Email não pode ter mais de 255 caracteres' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Validações adicionais
  if (trimmed.indexOf('..') !== -1) {
    return { valid: false, error: 'Email não pode conter pontos consecutivos' };
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Email não pode começar ou terminar com ponto' };
  }

  const [localPart, domain] = trimmed.split('@');
  
  if (!localPart || localPart.length === 0) {
    return { valid: false, error: 'Email deve ter parte local antes do @' };
  }

  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Email deve ter domínio após o @' };
  }

  if (domain.indexOf('.') === -1) {
    return { valid: false, error: 'Domínio deve conter pelo menos um ponto' };
  }

  return { valid: true };
}

/**
 * Normaliza email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}


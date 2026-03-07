/**
 * Validador de CPF
 * Aplicar ajuste recomendado da Seção 11.2.D (item 16)
 */

/**
 * Remove caracteres não numéricos do CPF
 */
function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida formato do CPF (11 dígitos)
 */
function validateCpfFormat(cpf: string): boolean {
  const cleaned = cleanCpf(cpf);
  return cleaned.length === 11 && /^\d+$/.test(cleaned);
}

/**
 * Valida dígitos verificadores do CPF
 */
function validateCpfDigits(cpf: string): boolean {
  const cleaned = cleanCpf(cpf);
  
  // Verificar se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;

  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;

  // Verificar se os dígitos calculados correspondem aos informados
  return (
    digit1 === parseInt(cleaned.charAt(9)) &&
    digit2 === parseInt(cleaned.charAt(10))
  );
}

/**
 * Valida CPF completo (formato e dígitos verificadores)
 */
export function validateCpf(cpf: string): { valid: boolean; error?: string } {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, error: 'CPF é obrigatório' };
  }

  if (!validateCpfFormat(cpf)) {
    return { valid: false, error: 'CPF deve conter 11 dígitos numéricos' };
  }

  if (!validateCpfDigits(cpf)) {
    return { valid: false, error: 'CPF inválido: dígitos verificadores incorretos' };
  }

  return { valid: true };
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCpf(cpf: string): string {
  const cleaned = cleanCpf(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}


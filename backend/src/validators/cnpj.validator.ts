/**
 * Validador de CNPJ
 * Aplicar ajuste recomendado da Seção 11.2.D (item 16)
 */

/**
 * Remove caracteres não numéricos do CNPJ
 */
function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Valida formato do CNPJ (14 dígitos)
 */
function validateCnpjFormat(cnpj: string): boolean {
  const cleaned = cleanCnpj(cnpj);
  return cleaned.length === 14 && /^\d+$/.test(cleaned);
}

/**
 * Valida dígitos verificadores do CNPJ
 */
function validateCnpjDigits(cnpj: string): boolean {
  const cleaned = cleanCnpj(cnpj);
  
  // Verificar se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  // Calcular primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;

  // Calcular segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;

  // Verificar se os dígitos calculados correspondem aos informados
  return (
    digit1 === parseInt(cleaned.charAt(12)) &&
    digit2 === parseInt(cleaned.charAt(13))
  );
}

/**
 * Valida CNPJ completo (formato e dígitos verificadores)
 */
export function validateCnpj(cnpj: string): { valid: boolean; error?: string } {
  if (!cnpj || typeof cnpj !== 'string') {
    return { valid: false, error: 'CNPJ é obrigatório' };
  }

  if (!validateCnpjFormat(cnpj)) {
    return { valid: false, error: 'CNPJ deve conter 14 dígitos numéricos' };
  }

  if (!validateCnpjDigits(cnpj)) {
    return { valid: false, error: 'CNPJ inválido: dígitos verificadores incorretos' };
  }

  return { valid: true };
}

/**
 * Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cleanCnpj(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}


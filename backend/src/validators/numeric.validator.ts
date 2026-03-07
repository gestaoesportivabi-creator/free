/**
 * Validador de campos numéricos
 * Aplicar ajuste recomendado da Seção 11.2.D (validações de tipos)
 */

/**
 * Valida se o valor é um número válido
 */
export function validateNumber(value: any): { valid: boolean; error?: string; value?: number } {
  if (value === null || value === undefined) {
    return { valid: false, error: 'Valor numérico é obrigatório' };
  }

  // Se já é número
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return { valid: false, error: 'Número inválido' };
    }
    return { valid: true, value };
  }

  // Se é string, tentar converter
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return { valid: false, error: 'Valor numérico não pode estar vazio' };
    }

    // Verificar se contém apenas números, ponto e sinal negativo
    if (!/^-?\d*\.?\d+$/.test(trimmed)) {
      return { valid: false, error: 'Valor deve ser um número válido (não pode conter letras)' };
    }

    const numValue = parseFloat(trimmed);
    if (isNaN(numValue) || !isFinite(numValue)) {
      return { valid: false, error: 'Número inválido' };
    }

    return { valid: true, value: numValue };
  }

  return { valid: false, error: 'Tipo de dado inválido: esperado número ou string numérica' };
}

/**
 * Valida número inteiro
 */
export function validateInteger(value: any): { valid: boolean; error?: string; value?: number } {
  const result = validateNumber(value);
  if (!result.valid) {
    return result;
  }

  if (result.value !== undefined && !Number.isInteger(result.value)) {
    return { valid: false, error: 'Valor deve ser um número inteiro' };
  }

  return result;
}

/**
 * Valida range de número (min/max)
 */
export function validateNumberRange(
  value: any,
  min?: number,
  max?: number
): { valid: boolean; error?: string; value?: number } {
  const result = validateNumber(value);
  if (!result.valid) {
    return result;
  }

  if (result.value === undefined) {
    return result;
  }

  if (min !== undefined && result.value < min) {
    return { valid: false, error: `Valor deve ser maior ou igual a ${min}` };
  }

  if (max !== undefined && result.value > max) {
    return { valid: false, error: `Valor deve ser menor ou igual a ${max}` };
  }

  return result;
}

/**
 * Valida número inteiro com range
 */
export function validateIntegerRange(
  value: any,
  min?: number,
  max?: number
): { valid: boolean; error?: string; value?: number } {
  const intResult = validateInteger(value);
  if (!intResult.valid) {
    return intResult;
  }

  return validateNumberRange(intResult.value, min, max);
}


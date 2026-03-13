/**
 * Utilitários para datas no formato YYYY-MM-DD (apenas dia, sem hora).
 * new Date("2026-02-16") no JS é interpretado como UTC meia-noite, o que em
 * fusos como Brasil (UTC-3) vira 15/02 às 21h e exibe dia 15. Aqui tratamos
 * sempre como data local para exibição e comparação consistente.
 */

/**
 * Converte string YYYY-MM-DD (ou DD/MM/YYYY) em Date à meia-noite no fuso local.
 * Evita o deslocamento de um dia que ocorre com new Date("YYYY-MM-DD").
 */
export function parseLocalDateOnly(dateStr: string | undefined): Date {
  if (!dateStr || typeof dateStr !== 'string') return new Date(NaN);
  const trimmed = dateStr.trim();
  const dateOnly = trimmed.slice(0, 10);
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) return new Date(y, m, d);
  }
  const partsSlash = dateOnly.split('/');
  if (partsSlash.length === 3) {
    const a = parseInt(partsSlash[0], 10);
    const b = parseInt(partsSlash[1], 10);
    const c = parseInt(partsSlash[2], 10);
    if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) return new Date(NaN);
    if (c > 31) return new Date(c, b - 1, a);
    if (a > 31) return new Date(a, b - 1, c);
    return new Date(c, b - 1, a);
  }
  return new Date(trimmed);
}

/**
 * Retorna true se a data (YYYY-MM-DD) já passou (antes de hoje à meia-noite local).
 */
export function isDateInPast(dateStr: string | undefined): boolean {
  const date = parseLocalDateOnly(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Formata com segurança uma string de data para exibição no formato pt-BR (DD/MM/YYYY).
 * Se for no formato YYYY-MM-DD, a formatação é feita através de split para evitar 
 * que a conversão silenciosa de fuso-horário crie anomalias de "um dia a menos".
 */
export function formatDateSafe(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  // Se for uma string de data ISO com YYYY-MM-DD
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      // Retorna no formato DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // Falha segura: tentar converter usando o JS normal se não bater no Regex ou não for string
  try {
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  } catch (e) {
    console.warn(`Erro ao formatar data: ${dateStr}`);
  }

  return String(dateStr);
}

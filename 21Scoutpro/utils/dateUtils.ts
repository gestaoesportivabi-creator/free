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

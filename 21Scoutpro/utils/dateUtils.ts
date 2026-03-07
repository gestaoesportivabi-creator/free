/**
 * Utilitários para datas no formato YYYY-MM-DD (apenas dia, sem hora).
 * new Date("2026-02-16") no JS é interpretado como UTC meia-noite, o que em
 * fusos como Brasil (UTC-3) vira 15/02 às 21h e exibe dia 15. Aqui tratamos
 * sempre como data local para exibição e comparação consistente.
 */

/**
 * Converte string YYYY-MM-DD em Date à meia-noite no fuso local.
 * Evita o deslocamento de um dia que ocorre com new Date("YYYY-MM-DD").
 */
export function parseLocalDateOnly(dateStr: string | undefined): Date {
  if (!dateStr || typeof dateStr !== 'string') return new Date(NaN);
  const trimmed = dateStr.trim();
  // Aceitar YYYY-MM-DD ou ISO com hora (usar só os primeiros 10 caracteres)
  const dateOnly = trimmed.slice(0, 10);
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return new Date(trimmed);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return new Date(trimmed);
  return new Date(y, m, d);
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

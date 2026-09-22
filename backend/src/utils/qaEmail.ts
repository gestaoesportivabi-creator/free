/**
 * Contas de teste automatizado / técnico José.
 * Nunca bloquear escrita por e-mail não verificado nestes endereços.
 */
export function isQaTestEmail(email: string | null | undefined): boolean {
  const e = String(email || '')
    .trim()
    .toLowerCase();
  if (!e) return false;
  if (e.startsWith('qa.scout21+')) return true;
  if (e.startsWith('qa.scout21@')) return true;
  if (e.endsWith('@qa.scout21.local')) return true;
  return false;
}

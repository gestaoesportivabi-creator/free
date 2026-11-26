/**
 * Contas admin que ficam PRO para sempre.
 *
 * A lista vem da env `ADMIN_PRO_EMAILS` (e-mails separados por vírgula) somada à
 * constante abaixo. É consultada ANTES de trial, Stripe ou qualquer status:
 * estas contas nunca expiram nem são rebaixadas por webhook.
 *
 * Só liste e-mails de contas que já existem — o match é por e-mail, sem exigir
 * verificação, então um endereço ainda não cadastrado poderia ser "reservado"
 * por quem se cadastrar primeiro.
 */

/** Lista fixa opcional. Prefira a env para não precisar de deploy ao mudar. */
export const ADMIN_PRO_EMAILS_CONSTANT: readonly string[] = [];

function normalize(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function getAdminProEmails(): Set<string> {
  const fromEnv = (process.env.ADMIN_PRO_EMAILS || '').split(',');
  return new Set([...ADMIN_PRO_EMAILS_CONSTANT, ...fromEnv].map(normalize).filter(Boolean));
}

export function isAdminProEmail(email: string | null | undefined): boolean {
  const normalized = normalize(email);
  return normalized !== '' && getAdminProEmails().has(normalized);
}

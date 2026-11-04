/**
 * Texto de erro exibido quando a API recusa uma escrita.
 *
 * O servidor devolve alguns bloqueios como código de máquina em `error`
 * (ex.: `email_not_verified`, HTTP 403) e a frase para a pessoa em `message`.
 * Mostrar o código cru ("email_not_verified") deixa a usuária sem saber o que fazer.
 */

const MACHINE_CODE = /^[a-z0-9]+(?:_[a-z0-9]+)+$/;

export function apiErrorMessage(
  parsed: { error?: string; message?: string } | null,
  responseText: string,
  status: number
): string {
  const error = typeof parsed?.error === 'string' ? parsed.error.trim() : '';
  const message = typeof parsed?.message === 'string' ? parsed.message.trim() : '';
  if (message && (!error || MACHINE_CODE.test(error))) return message;
  return error || responseText || `Erro ${status}`;
}

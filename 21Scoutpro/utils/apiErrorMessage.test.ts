import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './apiErrorMessage';

describe('apiErrorMessage', () => {
  it('usa a frase de `message` quando `error` é um código de máquina (403 email_not_verified)', () => {
    const msg = 'Confirme seu e-mail para continuar registando dados.';
    expect(apiErrorMessage({ error: 'email_not_verified', message: msg }, '', 403)).toBe(msg);
  });

  it('mantém `error` quando já é texto legível (409 de camisa repetida)', () => {
    expect(
      apiErrorMessage({ error: 'Número 10 já está em uso por Ana nesta equipe.', message: 'x' }, '', 409)
    ).toBe('Número 10 já está em uso por Ana nesta equipe.');
  });

  it('mantém o código quando não há `message`', () => {
    expect(apiErrorMessage({ error: 'email_not_verified' }, '', 403)).toBe('email_not_verified');
  });

  it('cai no corpo bruto e depois no status', () => {
    expect(apiErrorMessage(null, 'Bad Gateway', 502)).toBe('Bad Gateway');
    expect(apiErrorMessage(null, '', 500)).toBe('Erro 500');
  });
});

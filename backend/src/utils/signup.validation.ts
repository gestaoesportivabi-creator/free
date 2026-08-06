/**
 * Validação do auto-cadastro público.
 *
 * O `register` original aceitava qualquer senha (inclusive "1") e confiava no
 * `roleName` vindo do cliente — o que é escalonamento de privilégio quando a rota
 * fica pública. Ver docs/PLANO_MESTRE_TRIAL_30D.md (§1.5, §3.3).
 */

/** Domínios descartáveis mais comuns. Lista curta e de baixo falso-positivo. */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
  'maildrop.cc', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com',
  'spamgourmet.com', 'tempinbox.com', 'emailondeck.com', 'mohmal.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  teamName: string;
  phone?: string | null;
  acceptedTerms: boolean;
}

export interface ValidationFailure {
  field: keyof SignupInput | 'general';
  code: string;
  message: string;
}

export function isDisposableEmail(email: string): boolean {
  if (process.env.DISPOSABLE_EMAIL_BLOCKLIST === 'false') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Senha: mínimo 8 caracteres com pelo menos uma letra e um número.
 * Deliberadamente sem exigência de símbolo ou maiúscula — regras barrocas
 * empurram o utilizador para senhas piores e anotadas em papel.
 */
export function validatePassword(password: string): ValidationFailure | null {
  if (password.length < 8) {
    return { field: 'password', code: 'password_too_short', message: 'A senha precisa de pelo menos 8 caracteres.' };
  }
  if (password.length > 200) {
    return { field: 'password', code: 'password_too_long', message: 'Senha demasiado longa.' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      field: 'password',
      code: 'password_too_weak',
      message: 'A senha precisa de pelo menos uma letra e um número.',
    };
  }
  return null;
}

export function validateSignup(body: Record<string, unknown>): {
  ok: false; failure: ValidationFailure;
} | {
  ok: true; value: SignupInput;
} {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const teamName = String(body.teamName ?? '').trim();
  const phone = body.phone ? String(body.phone).trim().slice(0, 50) : null;
  const acceptedTerms = body.acceptedTerms === true || body.acceptedTerms === 'true';

  if (name.length < 3 || name.length > 255) {
    return { ok: false, failure: { field: 'name', code: 'invalid_name', message: 'Informe seu nome completo.' } };
  }

  if (!EMAIL_RE.test(email) || email.length > 255) {
    return { ok: false, failure: { field: 'email', code: 'invalid_email', message: 'Informe um e-mail válido.' } };
  }

  if (isDisposableEmail(email)) {
    return {
      ok: false,
      failure: {
        field: 'email',
        code: 'disposable_email',
        message: 'Use um e-mail permanente. Endereços temporários não são aceites.',
      },
    };
  }

  const passwordFailure = validatePassword(password);
  if (passwordFailure) return { ok: false, failure: passwordFailure };

  if (teamName.length < 2 || teamName.length > 255) {
    return {
      ok: false,
      failure: { field: 'teamName', code: 'invalid_team_name', message: 'Informe o nome da sua equipa.' },
    };
  }

  if (!acceptedTerms) {
    return {
      ok: false,
      failure: {
        field: 'acceptedTerms',
        code: 'terms_not_accepted',
        message: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.',
      },
    };
  }

  return { ok: true, value: { name, email, password, teamName, phone, acceptedTerms } };
}

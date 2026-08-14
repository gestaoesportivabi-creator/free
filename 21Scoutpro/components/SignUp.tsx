import React, { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { User } from '../types';
import { getApiUrl } from '../config';
import { track } from '../utils/analytics';

const LOGO_IMAGE = '/public-logo.png.png';

interface SignUpProps {
  onSignedUp: (user: User) => void;
  onGoToLogin: () => void;
  onBackToHome?: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  teamName?: string;
  acceptedTerms?: string;
  general?: string;
}

/** Espelha `validatePassword` do backend — evita ida ao servidor para erro óbvio. */
function passwordIssue(password: string): string | null {
  if (password.length < 8) return 'Use pelo menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Combine pelo menos uma letra e um número.';
  }
  return null;
}

const inputClass =
  'w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm ' +
  'placeholder:text-zinc-600 outline-none transition-colors focus:border-[#00f0ff] ' +
  'focus:ring-1 focus:ring-[#00f0ff]/40';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5';

export const SignUp: React.FC<SignUpProps> = ({ onSignedUp, onGoToLogin, onBackToHome }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const checkSeq = useRef(0);

  /**
   * Verificação de e-mail em tempo real, no blur.
   * Corridas são resolvidas por sequência: só a resposta mais recente vale.
   */
  const checkEmailAvailability = useCallback(async (candidate: string) => {
    const value = candidate.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return;

    const seq = ++checkSeq.current;
    try {
      const response = await fetch(`${getApiUrl()}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const result = await response.json();
      if (seq !== checkSeq.current) return;
      setEmailTaken(result?.available === false);
    } catch {
      // Silencioso: o cadastro valida de novo no servidor.
    }
  }, []);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (name.trim().length < 3) next.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = 'Informe um e-mail válido.';
    const pwIssue = passwordIssue(password);
    if (pwIssue) next.password = pwIssue;
    if (teamName.trim().length < 2) next.teamName = 'Informe o nome da sua equipe.';
    if (!acceptedTerms) next.acceptedTerms = 'É necessário aceitar os termos para continuar.';
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          teamName: teamName.trim(),
          acceptedTerms: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const field = result?.field as keyof FieldErrors | undefined;
        const message = result?.message || result?.error || 'Não foi possível criar a conta.';
        setErrors(field && field !== 'general' ? { [field]: message } : { general: message });
        // Motivo real da falha (email_taken, senha fraca etc.), não só "erro genérico" — é o que falta hoje pra medir onde o funil trava.
        track('signup_error', { reason: result?.error || 'unknown' });
        return;
      }

      const data = result.data;
      localStorage.setItem('token', data.token);
      // Conversão real do trial: até agora só media o clique no CTA, não o cadastro concluído.
      track('signup_completed', { plan: data.user?.planName });

      onSignedUp({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: 'Treinador',
        planName: data.user.planName,
        teamDisplayName: data.user.teamDisplayName,
        equipeId: data.user.equipeId,
        isPlatformAdmin: false,
      });
    } catch {
      setErrors({ general: 'Erro de conexão. Verifique sua internet e tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwIssue = password ? passwordIssue(password) : null;

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      <header className="shrink-0 px-4 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </button>
        <div className="w-9 h-9 border border-zinc-700 rounded flex items-center justify-center bg-black/80 overflow-hidden">
          <img src={LOGO_IMAGE} alt="SCOUT21" className="w-full h-full object-contain p-0.5" />
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00f0ff] mb-2">
              Teste grátis de 30 dias
            </p>
            <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
              Crie sua conta
            </h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Sem cartão de crédito, sem Pix. Acesso completo por 30 dias.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="signup-name" className={labelClass}>Nome completo</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como devemos chamar você"
                className={inputClass}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className={labelClass}>E-mail</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }}
                onBlur={(e) => void checkEmailAvailability(e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
                aria-invalid={Boolean(errors.email) || emailTaken}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              {!errors.email && emailTaken && (
                <p className="mt-1.5 text-xs text-amber-300">
                  Já existe uma conta com este e-mail.{' '}
                  <button type="button" onClick={onGoToLogin} className="underline hover:text-amber-200">
                    Entrar
                  </button>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-password" className={labelClass}>Senha</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="signup-password-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Verde só quando há senha E ela é válida — campo vazio não é "ok". */}
              <p
                id="signup-password-hint"
                className={`mt-1.5 text-xs ${
                  errors.password ? 'text-red-400' : !password || pwIssue ? 'text-zinc-500' : 'text-emerald-400'
                }`}
              >
                {errors.password || pwIssue || (password ? 'Senha válida.' : 'Pelo menos 8 caracteres, com letra e número.')}
              </p>
            </div>

            <div>
              <label htmlFor="signup-team" className={labelClass}>Nome da equipe</label>
              <input
                id="signup-team"
                type="text"
                autoComplete="organization"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex.: Associação Atlética Central"
                className={inputClass}
                aria-invalid={Boolean(errors.teamName)}
              />
              {errors.teamName && <p className="mt-1.5 text-xs text-red-400">{errors.teamName}</p>}
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <span className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className="w-[18px] h-[18px] rounded border border-zinc-600 bg-black/60 transition-colors
                             peer-checked:bg-[#00f0ff] peer-checked:border-[#00f0ff]
                             peer-focus-visible:ring-2 peer-focus-visible:ring-[#00f0ff]/50"
                  aria-hidden="true"
                />
                {acceptedTerms && (
                  <Check size={13} strokeWidth={3} className="absolute text-black pointer-events-none" />
                )}
              </span>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] hover:underline">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] hover:underline">
                  Política de Privacidade
                </a>
                .
              </span>
            </label>
            {errors.acceptedTerms && <p className="text-xs text-red-400">{errors.acceptedTerms}</p>}

            {errors.general && (
              <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-300 leading-relaxed">{errors.general}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00d4e6]
                         disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-bold text-sm uppercase
                         tracking-wide rounded-xl py-3.5 transition-colors
                         shadow-[0_0_24px_rgba(0,240,255,0.25)] disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Criando conta...
                </>
              ) : (
                'Começar teste de 30 dias'
              )}
            </button>

            <p className="text-center text-[11px] text-zinc-500 leading-relaxed pt-1">
              Não pedimos cartão. Nada é cobrado ao fim do teste.
            </p>
          </form>

          <div className="mt-7 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-[#00f0ff] font-semibold hover:underline"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config';
import { User, SubscriptionPlanName } from '../types';

const LOGO_IMAGE = '/public-logo.png.png';

export type AuthEmailActionKind = 'reset-password' | 'magic-link' | 'verify-email';

interface AuthEmailActionProps {
  kind: AuthEmailActionKind;
  token: string;
  onLogin: (user: User) => void;
  onBackToLogin: () => void;
}

function mapApiUser(data: {
  id: string;
  name: string;
  email: string;
  role: string;
  planName?: string;
  isPlatformAdmin?: boolean;
  jogadorId?: string;
  linkedPlayerId?: string;
  equipeId?: string | null;
}): User {
  const roleRaw = data.role;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role:
      roleRaw === 'TECNICO' ? 'Treinador' : roleRaw === 'ATLETA' ? 'Atleta' : roleRaw,
    planName: data.planName as SubscriptionPlanName | undefined,
    isPlatformAdmin: data.isPlatformAdmin ?? data.planName === 'ADMINISTRADOR',
    linkedPlayerId: data.linkedPlayerId ?? data.jogadorId,
    jogadorId: data.jogadorId ?? data.linkedPlayerId,
    equipeId: data.equipeId ?? undefined,
  };
}

export const AuthEmailAction: React.FC<AuthEmailActionProps> = ({
  kind,
  token,
  onLogin,
  onBackToLogin,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(kind === 'verify-email' && Boolean(token));
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (kind === 'verify-email') return;
    if (!token) {
      setError('Link inválido. Peça um novo e-mail pelo login.');
    }
  }, [kind, token]);

  const consumeToken = async (endpoint: '/auth/magic-link/verify' | '/auth/verify-email') => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.json();
  };

  useEffect(() => {
    if (kind !== 'verify-email') return;
    if (!token) {
      setError('Link inválido. Peça um novo e-mail de confirmação.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await consumeToken('/auth/verify-email');
        if (cancelled) return;
        if (result.success) {
          setMessage(result.message || 'E-mail confirmado com sucesso.');
          setDone(true);
        } else {
          setError(result.error || 'Link inválido ou expirado.');
        }
      } catch {
        if (!cancelled) setError('Erro de conexão. Tente novamente.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, token]);

  const handleMagicLink = async () => {
    if (!token) {
      setError('Link inválido. Peça um novo link de acesso.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await consumeToken('/auth/magic-link/verify');
      if (result.success && result.data) {
        localStorage.setItem('token', result.data.token);
        onLogin(mapApiUser(result.data.user));
        return;
      }
      setError(result.error || 'Link inválido ou expirado.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Link inválido. Peça um novo e-mail de redefinição.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage(result.message || 'Senha redefinida. Você já pode entrar.');
        setDone(true);
      } else {
        setError(result.error || 'Não foi possível redefinir a senha.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    kind === 'reset-password'
      ? 'Nova senha'
      : kind === 'magic-link'
        ? 'Entrar sem senha'
        : 'Confirmar e-mail';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
        <div className="text-center mb-6">
          <img src={LOGO_IMAGE} alt="SCOUT21" className="h-16 mx-auto mb-3" />
          <h1 className="text-xl font-black uppercase italic">{title}</h1>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-zinc-300 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]" />
            Processando…
          </div>
        )}

        {!isLoading && kind === 'magic-link' && !done && !error && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-300">
              Clique para entrar na sua conta. Este link é de uso único e expira em 15 minutos.
            </p>
            <button
              type="button"
              onClick={handleMagicLink}
              className="w-full py-3 bg-[#00f0ff] text-black font-bold uppercase text-xs rounded-xl"
            >
              Entrar no SCOUT21
            </button>
          </div>
        )}

        {!isLoading && kind === 'reset-password' && !done && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm"
            />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar senha"
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm"
            />
            {error && (
              <div className="text-red-400 text-xs flex items-center gap-2 justify-center">
                <ShieldCheck size={14} /> {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[#00f0ff] text-black font-bold uppercase text-xs rounded-xl"
            >
              Salvar nova senha
            </button>
          </form>
        )}

        {!isLoading && (done || (kind !== 'reset-password' && error) || (kind === 'verify-email' && (message || error))) && (
          <div className="space-y-4 text-center">
            {message && (
              <p className="text-[#00f0ff] text-sm bg-cyan-950/40 border border-cyan-900/50 rounded-xl p-3">
                {message}
              </p>
            )}
            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-xl p-3 flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> {error}
              </p>
            )}
            {(done || error) && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-3 border border-white/20 rounded-xl text-sm uppercase tracking-wider hover:border-[#00f0ff]"
              >
                Ir para login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

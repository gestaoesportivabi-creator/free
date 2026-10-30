import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Shield, Sparkles } from 'lucide-react';
import { getApiUrl } from '../../config';
import type { SubscriptionSnapshot } from '../../services/api';

type Interval = 'month' | 'year';

interface BillingConfig {
  enabled: boolean;
  monthly: boolean;
  yearly: boolean;
}

interface PlansPageProps {
  onHome: () => void;
  onLogin: () => void;
  onOpenApp: () => void;
}

const FEATURES = [
  'Scout ao vivo, calendário e relatórios',
  'Fisiologia e prontidão do elenco',
  'Sem limite de jogos do plano Essencial',
  'Cancela quando quiser no portal do Stripe',
];

function readPreview(): 'checkout' | 'pro' | 'lifetime' | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('preview');
  if (value === 'checkout' || value === 'pro' || value === 'lifetime') return value;
  return null;
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    const body = await response.json();
    return (body?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export const PlansPage: React.FC<PlansPageProps> = ({ onHome, onLogin, onOpenApp }) => {
  const preview = readPreview();
  const [config, setConfig] = useState<BillingConfig | null>(preview ? { enabled: true, monthly: true, yearly: true } : null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<Interval | 'portal' | null>(null);
  const loggedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/billing/config`);
        const data = await readJson<BillingConfig>(response);
        if (!cancelled && data) setConfig(data);
        else if (!cancelled) setConfig({ enabled: false, monthly: false, yearly: false });
      } catch {
        if (!cancelled) setConfig({ enabled: false, monthly: false, yearly: false });
      }
      if (!loggedIn) return;
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${getApiUrl()}/me/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await readJson<SubscriptionSnapshot>(response);
        if (!cancelled) setSubscription(data);
      } catch {
        if (!cancelled) setSubscription(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [preview, loggedIn]);

  const showPro = preview === 'pro' || preview === 'lifetime' || Boolean(subscription);
  const lifetime = preview === 'lifetime' || Boolean(subscription?.isLifetimePro);
  const proActive = preview === 'pro' || preview === 'lifetime' || Boolean(subscription?.isPro);
  const enabled = config?.enabled === true;
  const checkoutNote =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('checkout') === 'success'
      ? 'Pagamento recebido. O PRO ativa quando o Stripe confirmar — pode levar um instante.'
      : typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('checkout') === 'cancel'
        ? 'Checkout cancelado. Nada foi cobrado.'
        : '';

  const startCheckout = async (interval: Interval) => {
    if (preview) return;
    if (!loggedIn) {
      onLogin();
      return;
    }
    if (!enabled) {
      setMessage('Pagamento ainda não está ligado neste ambiente.');
      return;
    }
    setBusy(interval);
    setMessage('');
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${getApiUrl()}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interval }),
      });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.data?.url) {
        window.location.href = body.data.url;
        return;
      }
      setMessage(body?.message || 'Não foi possível abrir o checkout.');
    } catch {
      setMessage('Não foi possível abrir o checkout. A conta continua como está.');
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    if (preview || lifetime) return;
    if (!loggedIn) {
      onLogin();
      return;
    }
    setBusy('portal');
    setMessage('');
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${getApiUrl()}/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.data?.url) {
        window.location.href = body.data.url;
        return;
      }
      setMessage(body?.message || 'Portal indisponível.');
    } catch {
      setMessage('Portal indisponível. Nada foi alterado na assinatura.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <button type="button" onClick={onHome} className="text-sm font-semibold tracking-wide">
          SCOUT 21 <span className="text-[#00f0ff]">PRO</span>
        </button>
        <div className="flex items-center gap-3 text-sm">
          {loggedIn ? (
            <button type="button" onClick={onOpenApp} className="text-zinc-300 hover:text-white">
              Ir para a plataforma
            </button>
          ) : (
            <button type="button" onClick={onLogin} className="text-zinc-300 hover:text-white">
              Entrar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {preview !== 'pro' && preview !== 'lifetime' && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00f0ff] mb-3">Plano PRO</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Scout completo, com assinatura</h1>
            <p className="text-zinc-400 max-w-2xl mb-10">
              O teste de 30 dias continua sem cartão. O PRO é a assinatura mensal ou anual. O pagamento abre no Stripe
              e a conta só muda quando o webhook confirma.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <PlanCard
                title="PRO mensal"
                detail="Renova todo mês. Cancele no portal quando quiser."
                action="Continuar para o checkout"
                disabled={!enabled || busy !== null}
                busy={busy === 'month'}
                onClick={() => void startCheckout('month')}
              />
              <PlanCard
                title="PRO anual"
                detail="Um ciclo por ano, o mesmo produto."
                action="Continuar para o checkout"
                disabled={!enabled || busy !== null || config?.yearly === false}
                busy={busy === 'year'}
                onClick={() => void startCheckout('year')}
              />
            </div>

            <ul className="mt-8 grid sm:grid-cols-2 gap-3 text-sm text-zinc-300">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check size={16} className="text-[#00f0ff] mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {!enabled && config && (
              <p className="mt-6 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                Pagamento ainda não está ligado neste ambiente. A plataforma segue no ar, sem cobrança.
              </p>
            )}
            {message && <p className="mt-4 text-sm text-zinc-300">{message}</p>}
            {checkoutNote && <p className="mt-4 text-sm text-[#00f0ff]">{checkoutNote}</p>}
          </section>
        )}

        {showPro && (
          <section className={preview === 'checkout' ? 'hidden' : preview ? '' : 'mt-14'}>
            <ProState
              lifetime={lifetime}
              active={proActive}
              periodEnd={preview === 'pro' ? '2026-11-15T12:00:00.000Z' : subscription?.currentPeriodEnd}
              status={subscription?.status}
              busy={busy === 'portal'}
              onPortal={() => void openPortal()}
            />
          </section>
        )}
      </main>
    </div>
  );
};

function PlanCard({
  title,
  detail,
  action,
  disabled,
  busy,
  onClick,
}: {
  title: string;
  detail: string;
  action: string;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col">
      <div className="flex items-center gap-2 text-[#00f0ff] mb-4">
        <Sparkles size={16} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Assinatura</span>
      </div>
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 flex-1">{detail}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#00f0ff] text-black font-semibold px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CreditCard size={16} />
        {busy ? 'Abrindo checkout…' : action}
      </button>
    </article>
  );
}

function ProState({
  lifetime,
  active,
  periodEnd,
  status,
  busy,
  onPortal,
}: {
  lifetime: boolean;
  active: boolean;
  periodEnd?: string | null;
  status?: string;
  busy: boolean;
  onPortal: () => void;
}) {
  const when = periodEnd
    ? new Date(periodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8" data-testid="pro-state">
      <div className="flex items-center gap-2 text-[#00f0ff] mb-3">
        <Shield size={16} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Estado da conta</span>
      </div>
      <h2 className="text-3xl font-semibold mb-2">{lifetime ? 'PRO permanente' : active ? 'Plano PRO ativo' : 'PRO inativo'}</h2>
      <p className="text-zinc-400 max-w-xl">
        {lifetime
          ? 'Equipe Demo. Esta conta não depende do Stripe e não perde o PRO se uma assinatura for cancelada.'
          : active
            ? 'Equipe Demo. A assinatura fica no Stripe. Para trocar o cartão ou cancelar, use o portal do cliente.'
            : 'Equipe Demo. O acesso de escrita volta quando uma assinatura PRO estiver ativa.'}
      </p>
      <dl className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Conta</dt>
          <dd className="mt-1">Equipe Demo</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Situação</dt>
          <dd className="mt-1">{lifetime ? 'Permanente' : active ? 'Ativa' : status || 'Sem assinatura'}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Próximo ciclo</dt>
          <dd className="mt-1">{lifetime ? 'Não se aplica' : when || 'Definido pelo Stripe'}</dd>
        </div>
      </dl>
      {!lifetime && (
        <button
          type="button"
          onClick={onPortal}
          disabled={busy}
          className="mt-6 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold hover:border-[#00f0ff]"
        >
          {busy ? 'Abrindo portal…' : 'Gerir ou cancelar no portal'}
        </button>
      )}
    </article>
  );
}

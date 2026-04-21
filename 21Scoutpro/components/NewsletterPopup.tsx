import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '../utils/analytics';

const STORAGE_KEY = 'scout21_newsletter_v1';
const DELAY_MS = 18_000;
const SCROLL_TRIGGER = 0.4;
const STICKY_DELAY_MS = 8_000;

type Status = 'idle' | 'sending' | 'success' | 'error';

interface NewsletterPopupProps {
  source?: string;
}

function readUtm(): Record<string, string | undefined> {
  try {
    const p = new URLSearchParams(window.location.search);
    const pick = (k: string) => p.get(k) || undefined;
    return {
      utmSource: pick('utm_source'),
      utmMedium: pick('utm_medium'),
      utmCampaign: pick('utm_campaign'),
      utmTerm: pick('utm_term'),
      utmContent: pick('utm_content'),
    };
  } catch {
    return {};
  }
}

async function submitNewsletter(email: string, source: string): Promise<boolean> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: email.split('@')[0].slice(0, 60),
        email: email.trim(),
        source,
        lang: document.documentElement.lang || 'pt-BR',
        message: 'Assinatura da Newsletter SCOUT 21',
        ...readUtm(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function readStoredState(): 'subscribed' | 'dismissed' | null {
  try {
    return (localStorage.getItem(STORAGE_KEY) as 'subscribed' | 'dismissed' | null) ?? null;
  } catch {
    return null;
  }
}

function writeStoredState(v: 'subscribed' | 'dismissed'): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* noop */
  }
}

interface NewsletterModalProps {
  open: boolean;
  onClose: () => void;
  source: string;
  triggerReason: 'manual' | 'auto';
}

const NewsletterModal: React.FC<NewsletterModalProps> = ({ open, onClose, source, triggerReason }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    track('newsletter_popup_open', { source, trigger: triggerReason });
  }, [open, source, triggerReason]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('error');
        return;
      }
      setStatus('sending');
      track('newsletter_submit', { source });
      const ok = await submitNewsletter(email, source);
      if (ok) {
        setStatus('success');
        writeStoredState('subscribed');
        track('newsletter_subscribed', { source });
        setTimeout(onClose, 1800);
      } else {
        setStatus('error');
      }
    },
    [email, source, onClose],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-4 pb-4 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#00f0ff]">
          Newsletter SCOUT21
        </div>

        <h2 id="newsletter-title" className="mb-2 text-xl sm:text-2xl font-bold text-white">
          Receba insights de futsal que viram resultado.
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-zinc-400">
          Toda semana: gestão de elenco, scout e fisiologia em linguagem prática para comissão técnica. Sem spam, só conteúdo aplicável.
        </p>

        {status === 'success' ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Cadastro completo! Seu primeiro conteúdo chega em breve no e-mail.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="sr-only">E-mail</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#00f0ff] focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/30"
              />
            </label>
            {status === 'error' && (
              <p className="text-xs text-red-400">
                Não consegui finalizar agora. Confere o e-mail e tenta novamente.
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00f0ff] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#00d4e6] disabled:opacity-60"
            >
              {status === 'sending' ? 'Finalizando…' : 'Quero receber os insights'}
            </button>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Ao enviar, você autoriza o envio da newsletter SCOUT21. LGPD em primeiro lugar.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

/** Popup auto-ativado (scroll 55% ou 25s) + gatilho manual via botão "Newsletter" no header. */
export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ source = 'newsletter_popup' }) => {
  const [open, setOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState<'manual' | 'auto'>('auto');

  useEffect(() => {
    if (readStoredState()) return;
    let done = false;

    const openAuto = () => {
      if (done) return;
      done = true;
      setTriggerReason('auto');
      setOpen(true);
    };

    const tm = window.setTimeout(openAuto, DELAY_MS);

    const onScroll = () => {
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - window.innerHeight);
      if (window.scrollY / max >= SCROLL_TRIGGER) openAuto();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /** Exit-intent: mouse saindo pela borda superior → forte sinal de abandono. */
    const onMouseOut = (e: MouseEvent) => {
      if (done) return;
      if (e.relatedTarget) return;
      if (e.clientY <= 0) openAuto();
    };
    document.addEventListener('mouseout', onMouseOut);

    const onOpenEvent: EventListener = () => {
      if (done) {
        setTriggerReason('manual');
        setOpen(true);
        return;
      }
      done = true;
      setTriggerReason('manual');
      setOpen(true);
    };
    window.addEventListener('scout21:newsletter-open', onOpenEvent);

    return () => {
      window.clearTimeout(tm);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scout21:newsletter-open', onOpenEvent);
    };
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (readStoredState() !== 'subscribed') writeStoredState('dismissed');
  }, []);

  return <NewsletterModal open={open} onClose={handleClose} source={source} triggerReason={triggerReason} />;
};

/** Botão "Newsletter" para colocar em qualquer header. Dispara o mesmo modal. */
export const NewsletterTriggerButton: React.FC<{
  className?: string;
  label?: string;
  source?: string;
}> = ({ className, label = 'Newsletter', source = 'newsletter_header' }) => {
  const handleClick = useCallback(() => {
    track('newsletter_button_click', { source });
    window.dispatchEvent(new CustomEvent('scout21:newsletter-open'));
  }, [source]);

  const defaultCls =
    'inline-flex items-center gap-2 rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/20';

  return (
    <button type="button" onClick={handleClick} className={className ?? defaultCls} aria-label="Assinar newsletter">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {label}
    </button>
  );
};

/** Hook utilitário para abrir o modal programaticamente. */
export function openNewsletter(): void {
  window.dispatchEvent(new CustomEvent('scout21:newsletter-open'));
}

/** Barra fina, fixa no rodapé do blog, persistente mas discreta. */
export const NewsletterStickyBar: React.FC<{ source?: string }> = ({ source = 'sticky_bar' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [hidden, setHidden] = useState<boolean>(() => readStoredState() !== null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (hidden) return;
    const tm = window.setTimeout(() => setVisible(true), STICKY_DELAY_MS);
    return () => window.clearTimeout(tm);
  }, [hidden]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('error');
        return;
      }
      setStatus('sending');
      track('newsletter_submit', { source });
      const ok = await submitNewsletter(email, source);
      if (ok) {
        setStatus('success');
        writeStoredState('subscribed');
        track('newsletter_subscribed', { source });
        setTimeout(() => setHidden(true), 1800);
      } else {
        setStatus('error');
      }
    },
    [email, source],
  );

  const handleDismiss = useCallback(() => {
    setHidden(true);
    if (readStoredState() !== 'subscribed') writeStoredState('dismissed');
    track('newsletter_sticky_dismiss', { source });
  }, [source]);

  if (hidden || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Assinar newsletter"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="hidden sm:flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#00f0ff]/15 text-[#00f0ff]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="hidden sm:block text-sm font-semibold text-white leading-tight">
            Receba insights semanais de futsal
          </p>
          <p className="hidden sm:block text-[11px] text-zinc-400 leading-tight">
            Gestão, scout e performance com foco em resultado.
          </p>
          <p className="sm:hidden text-sm font-semibold text-white leading-tight">Newsletter SCOUT21</p>
        </div>
        {status === 'success' ? (
          <span className="text-sm text-emerald-300 whitespace-nowrap">Cadastro completo ✓</span>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#00f0ff] focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="whitespace-nowrap rounded-lg bg-[#00f0ff] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#00d4e6] disabled:opacity-60"
            >
              {status === 'sending' ? '…' : 'Assinar'}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar"
          className="ml-1 rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/** Página dedicada para compartilhar como link curto. */
export const NewsletterSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-black to-zinc-950 px-6 py-16 text-center sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#00f0ff]">
          Newsletter SCOUT21
        </div>
        <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">Receba 1 análise por semana.</h2>
        <p className="mb-6 text-base text-zinc-400">
          Casos reais de clubes de futsal, decisões baseadas em dados e bastidores do produto.
        </p>
        <NewsletterTriggerButton
          label="Assinar agora"
          source="newsletter_section"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#00d4e6]"
        />
      </div>
    </section>
  );
};

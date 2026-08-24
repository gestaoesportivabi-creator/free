import React, { useEffect } from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import { applyRouteMeta } from '../utils/seo';

interface NotFoundPageProps {
  onHome?: () => void;
}

/** 404 amigável — marca + caminho de volta (P3-4). */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onHome }) => {
  useEffect(() => {
    applyRouteMeta({
      title: 'Página não encontrada | SCOUT21',
      description: 'Este endereço não existe no SCOUT21. Volte ao início ou ao login.',
      path: '/404',
    });
  }, []);

  const goHome = () => {
    if (onHome) onHome();
    else window.location.assign('/');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <img src="/public-logo.png.png" alt="SCOUT21" className="h-12 w-auto mb-8 opacity-90" />
      <p className="text-[11px] uppercase tracking-[0.25em] text-[#00f0ff] font-semibold mb-3">404</p>
      <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-center max-w-md">
        Esta página não existe
      </h1>
      <p className="mt-3 text-sm text-zinc-400 text-center max-w-md leading-relaxed">
        O link pode estar antigo ou digitado errado. Volte ao início — o elenco e a coleta continuam
        no mesmo lugar.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00f0ff] text-black font-bold uppercase text-xs tracking-wider"
        >
          <Home size={16} aria-hidden />
          Ir ao início
        </button>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider hover:border-zinc-500"
        >
          <ArrowLeft size={16} aria-hidden />
          Entrar
        </a>
      </div>
    </div>
  );
};

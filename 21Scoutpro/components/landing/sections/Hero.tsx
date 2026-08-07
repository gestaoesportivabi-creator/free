import React from 'react';
import { ArrowRight } from 'lucide-react';
import { scrollToSection } from '../shared/scroll';

interface HeroProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

/** Mock de prontidão — dados fictícios, sem LGPD. */
const ReadinessPreview: React.FC = () => (
  <div
    className="w-full max-w-lg border border-zinc-700/90 bg-zinc-950/90 backdrop-blur-sm p-5 md:p-6 text-left shadow-[0_0_60px_rgba(0,240,255,0.08)]"
    aria-hidden
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-3">
      Prontidão da equipe · hoje
    </p>
    <div className="flex items-end gap-4 mb-5">
      <span className="text-5xl md:text-6xl font-black text-white tabular-nums leading-none">62</span>
      <div className="pb-1">
        <p className="text-sm font-bold text-amber-300 uppercase tracking-wide">Sessão moderada</p>
        <p className="text-xs text-zinc-500 mt-0.5">ACWR 7d / 28d · 3 atletas sinalizados</p>
      </div>
    </div>
    <div className="space-y-2">
      {[
        { name: 'Rafael S.', score: 48, tone: 'text-red-400' },
        { name: 'Lucas M.', score: 55, tone: 'text-amber-300' },
        { name: 'Diego A.', score: 71, tone: 'text-emerald-400' },
      ].map((row) => (
        <div
          key={row.name}
          className="flex items-center justify-between border-t border-zinc-800 pt-2 text-sm"
        >
          <span className="text-zinc-300">{row.name}</span>
          <span className={`font-mono font-bold tabular-nums ${row.tone}`}>{row.score}</span>
        </div>
      ))}
    </div>
  </div>
);

export const Hero: React.FC<HeroProps> = ({ goToSignup }) => (
  <header className="relative min-h-[100svh] pt-24 md:pt-28 pb-16 md:pb-20 overflow-hidden bg-black">
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 85% 40%, rgba(0,240,255,0.14) 0%, transparent 55%), linear-gradient(180deg, #000 0%, #09090b 100%)',
      }}
    />
    <img
      src="/scout21pro-hero-product.jpg"
      alt=""
      className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.18] mix-blend-luminosity"
      fetchPriority="high"
      decoding="sync"
      aria-hidden
    />

    <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16 min-h-[calc(100svh-7rem)]">
      <div className="flex-1 max-w-xl space-y-7">
        <p className="text-2xl md:text-3xl font-black italic tracking-tight text-[#00f0ff]">
          SCOUT21
        </p>
        <h1 className="landing-headline text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05]">
          Seu elenco está pronto para treinar forte hoje?
        </h1>
        <p className="landing-body-medium text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
          O SCOUT21 responde com carga, sono e bem-estar de cada atleta — não com achismo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center pt-1">
          <a
            href="/criar-conta"
            onClick={goToSignup('hero')}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm rounded-lg transition-all"
          >
            Começar teste de 30 dias
            <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={18} />
          </a>
          <a
            href="#perguntas"
            onClick={(e) => scrollToSection(e, '#perguntas')}
            className="landing-body-medium text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Ver como funciona
          </a>
        </div>
        <p className="text-xs text-zinc-600">
          Sem cartão · Acesso completo · Cancele quando quiser
        </p>
      </div>

      <div className="flex-1 flex justify-center lg:justify-end">
        <ReadinessPreview />
      </div>
    </div>
  </header>
);

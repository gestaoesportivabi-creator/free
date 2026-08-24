import React from 'react';
import { ArrowRight } from 'lucide-react';
import { scrollToSection } from '../shared/scroll';
import { ScreenshotFrame } from '../shared/ScreenshotFrame';

interface HeroProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

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

    <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16 min-h-[calc(100svh-7rem)]">
      <div className="flex-1 max-w-xl min-w-0 space-y-7">
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

      {/*
        Captura real do ranking: pódio, medalhas e números de verdade.
        Prova que o produto existe melhor do que qualquer mock desenhado à mão.
      */}
      <div className="flex-1 w-full min-w-0 lg:max-w-[54%]">
        <ScreenshotFrame
          src="/shots/ranking.png"
          alt="Ranking de estatísticas do SCOUT21, com pódio dos artilheiros e tabela de gols por atleta"
          label="scout21.com.br/dashboard"
          priority
          maxAspect="16 / 10"
        />
      </div>
    </div>
  </header>
);

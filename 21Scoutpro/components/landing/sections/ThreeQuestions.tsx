import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '../shared/SectionHeading';
import { ScreenshotFrame } from '../shared/ScreenshotFrame';
import { useInView } from '../useInView';

interface ThreeQuestionsProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

const BLOCKS = [
  {
    id: 'prontidao',
    question: 'Meu elenco aguenta hoje?',
    title: 'Prontidão da equipe, calculada todo dia',
    body: (
      <>
        O SCOUT21 cruza PSE, qualidade de sono e bem-estar de cada atleta e devolve um score de
        prontidão — com recomendação de intensidade para a sessão.
        <br />
        <br />
        Por trás do número está a <strong className="text-white">razão carga aguda:crônica (ACWR)</strong>,
        comparando os últimos 7 dias contra os últimos 28. É o indicador que a literatura associa a
        risco de lesão — e que normalmente exige um preparador com planilha própria.
      </>
    ),
    proof: 'Score 62 · Sessão moderada · 3 atletas sinalizados',
    img: '/scout21pro-dashboard-mockup.jpg',
    alt: 'Painel SCOUT21 com indicadores de prontidão da equipe',
  },
  {
    id: 'jogo',
    question: 'O que aconteceu no jogo?',
    title: 'Coleta ao vivo, com o jogo rolando',
    body: (
      <>
        Cronômetro oficial com estados de período e registro por toque. Gol, finalização, falta,
        desarme, defesa, cartão e mais — <strong className="text-white">12 tipos de evento</strong>,
        cada um em poucos toques.
        <br />
        <br />
        Autosave contínuo enquanto a sessão roda. Prefere lançar pela súmula depois do jogo? O mesmo
        sistema aceita — e alimenta os mesmos indicadores.
      </>
    ),
    proof: 'Realtime · Postmatch · FSM de cronômetro',
    img: '/gestaoespo.png',
    alt: 'Interface de coleta e gestão SCOUT21',
  },
  {
    id: 'risco',
    question: 'Quem está em risco?',
    title: 'Alertas que explicam, não só apitam',
    body: (
      <>
        Em vez de um número solto, uma frase que já aponta o próximo passo — recuperação, carga
        acumulada, sono ruim ou queda de bem-estar.
        <br />
        <br />
        Lesões ativas e histórico médico entram no mesmo radar, por atleta.
      </>
    ),
    proof: 'Alertas interpretativos no painel',
    img: '/scout21pro-feature-card.jpg',
    alt: 'Recursos de análise e alerta no SCOUT21',
  },
] as const;

export const ThreeQuestions: React.FC<ThreeQuestionsProps> = ({ goToSignup }) => {
  const [ref, inView] = useInView(0.08);

  return (
    <section
      id="perguntas"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 md:py-28 px-4 md:px-8 bg-zinc-950/80 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="O núcleo"
          title="Três perguntas. Respostas com dados."
          subtitle="A inteligência que a comissão técnica não tem tempo de montar."
        />

        <div className="space-y-20 md:space-y-28">
          {BLOCKS.map((block, idx) => {
            const reverse = idx % 2 === 1;
            return (
              <div
                key={block.id}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${
                  reverse ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="space-y-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00f0ff]">
                    {block.question}
                  </p>
                  <h3 className="landing-headline text-2xl md:text-3xl text-white leading-tight">
                    {block.title}
                  </h3>
                  <div className="landing-body text-zinc-400 text-base md:text-lg leading-relaxed">
                    {block.body}
                  </div>
                  <p className="text-xs font-mono text-zinc-500 border-l-2 border-[#00f0ff]/50 pl-3">
                    {block.proof}
                  </p>
                </div>
                <ScreenshotFrame src={block.img} alt={block.alt} />
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a
            href="/criar-conta"
            onClick={goToSignup('three-questions')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm rounded-lg transition-all"
          >
            Testar com meu elenco <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { ArrowRight, Clock, CreditCard, Unlock, Database } from 'lucide-react';

interface FreeTrialProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

const ITEMS = [
  {
    icon: Clock,
    title: '30 dias completos',
    desc: 'Acesso total à plataforma, sem compromisso.',
  },
  {
    icon: CreditCard,
    title: 'Sem cartão',
    desc: 'Não pedimos cartão nem Pix. Nenhum dado de pagamento.',
  },
  {
    icon: Unlock,
    title: 'Produto inteiro',
    desc: 'Recursos liberados durante o teste — plano efetivo completo.',
  },
  {
    icon: Database,
    title: 'Dados preservados',
    desc: 'Ao final, o que você registrou continua seu e exportável.',
  },
] as const;

export const FreeTrial: React.FC<FreeTrialProps> = ({ goToSignup }) => (
  <section id="teste-gratis" className="py-24 px-4 md:px-8 bg-black border-t border-zinc-800">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00f0ff] mb-3">
          Comece sem risco
        </p>
        <h2 className="landing-headline text-4xl md:text-5xl text-white leading-tight">
          Como funciona o teste grátis
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {ITEMS.map((item) => (
          <div key={item.title} className="bg-zinc-950 border border-zinc-800 p-6 text-left">
            <item.icon className="text-[#00f0ff] mb-3" size={22} aria-hidden />
            <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center space-y-6">
        <p className="landing-body-medium text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Ao final dos 30 dias você decide se continua.{' '}
          <strong className="text-white">Sem cobrança automática, sem renovação surpresa.</strong>{' '}
          Seus dados permanecem acessíveis para consulta e exportação.
        </p>
        <a
          href="/criar-conta"
          onClick={goToSignup('secao-teste-gratis')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-base rounded-xl transition-all"
        >
          Começar teste de 30 dias <ArrowRight className="w-5 h-5" />
        </a>
        <p className="text-xs text-zinc-600">
          Leva menos de um minuto. Nenhum contato comercial necessário.
        </p>
      </div>
    </div>
  </section>
);

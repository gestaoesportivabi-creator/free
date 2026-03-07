import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Users, Target, TrendingUp, Clock, BarChart3, Shield, CheckCircle, Building2, Trophy, Sparkles, Brain } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onGoToLogin?: () => void;
}

// Hook para animações ao scroll
const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isInView] as const;
};

// Componente de Carrossel
const ImageCarousel: React.FC = () => {
  const images = [
    '/ChatGPT Image 20 de jan. de 2026, 15_18_24.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_20_07.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_21_34.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_23_12.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_25_30.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_28_11.png',
    '/ChatGPT Image 20 de jan. de 2026, 15_31_43.png',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div 
      className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={img}
            alt={`SCOUT21PRO - ${idx + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ))}
      
      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-8 bg-[#00f0ff]'
                : 'w-1.5 bg-zinc-600 hover:bg-zinc-500'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const NAV_LINKS = [
  { href: '#para-quem-e', label: 'Para Quem É' },
  { href: '#solucao', label: 'Solução' },
  { href: '#diferenciais', label: 'Diferenciais' },
  { href: '#contato', label: 'Contato' },
] as const;

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  e.preventDefault();
  const id = href.slice(1);
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onGoToLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleClick = () => {
    console.log('🚀 Botão Começar Agora clicado!');
    onGetStarted();
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSubmitted(true);
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  // Refs para animações
  const [refParaQuem, inViewParaQuem] = useInView(0.1);
  const [refDesafio, inViewDesafio] = useInView(0.1);
  const [refSolucao, inViewSolucao] = useInView(0.1);
  const [refDiferenciais, inViewDiferenciais] = useInView(0.1);
  const [refVestiario, inViewVestiario] = useInView(0.1);
  const [refDNA, inViewDNA] = useInView(0.1);
  const [refComoFunciona, inViewComoFunciona] = useInView(0.1);
  const [refCarousel, inViewCarousel] = useInView(0.1);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-3 md:py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center shrink-0">
              <img src="/public-logo.png.png" alt="SCOUT21PRO Logo" className="h-12 md:h-14 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <a key={href} href={href} onClick={(e) => { scrollToSection(e, href); setMobileMenuOpen(false); }} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">{label}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button type="button" onClick={handleClick} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">Cadastre-se</button>
              <button onClick={onGoToLogin} className="px-4 py-2.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm uppercase tracking-wider rounded-lg transition-all">Login</button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button type="button" onClick={() => setMobileMenuOpen((o) => !o)} className="p-2 text-zinc-400 hover:text-white rounded-lg" aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}>
                {mobileMenuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </button>
              <button type="button" onClick={handleClick} className="text-zinc-400 hover:text-white text-sm font-medium">Cadastre-se</button>
              <button onClick={onGoToLogin} className="px-3 py-2 bg-[#00f0ff] text-black font-semibold text-xs uppercase rounded-lg">Login</button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pt-3 pb-2 border-t border-zinc-800/50 mt-3 flex flex-col gap-2">
              {NAV_LINKS.map(({ href, label }) => (
                <a key={href} href={href} onClick={(e) => { scrollToSection(e, href); setMobileMenuOpen(false); }} className="text-zinc-400 hover:text-white text-sm font-medium py-2">{label}</a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <header className="relative h-[723px] pl-6 pr-4 sm:pl-10 sm:pr-6 md:pl-14 md:pr-8 lg:pl-20 lg:pr-12 pt-20 md:pt-24 pb-0 bg-black overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: 'linear-gradient(to right, #000000 0%, #000000 25%, transparent 45%, transparent 55%, rgba(0, 240, 255, 0.12) 80%, rgba(0, 240, 255, 0.2) 100%), radial-gradient(ellipse 70% 80% at 90% 50%, rgba(0, 240, 255, 0.2) 0%, rgba(0, 240, 255, 0.06) 45%, transparent 75%)' }} />
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-0 pt-[106px] pb-4 md:pb-6">
          <div className="max-w-[581px] text-left space-y-6 md:space-y-8 md:flex-shrink-0 mt-6 md:mt-10">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Gestão esportiva<br /><span className="italic">na prática</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
              Indicadores, scout e análise de performance para transformar dados em insights poderosos para o dia a dia do clube.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-start items-start sm:items-center pt-2">
              <button onClick={handleClick} type="button" className="group px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm rounded-lg transition-all flex items-center gap-2 shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                Começar Agora
                <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={18} />
              </button>
              <a href="https://wa.me/5548991486176?text=Olá%2C%20gostaria%20de%20agendar%20uma%20apresentação" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1 sm:self-center">
                Novo: Agende uma apresentação <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          <div className="relative w-full md:max-w-[65%] lg:max-w-[62%] xl:max-w-[65%] md:flex-shrink-0 flex items-start justify-end -mt-4 md:-mt-8">
            <img src="/gestaoespo.png" alt="SCOUT21PRO — interface de gestão esportiva e scout" className="relative z-10 w-full max-w-[820px] h-auto object-contain py-px box-content" />
          </div>
        </div>
      </header>

      <section id="para-quem-e" ref={refParaQuem} className={`py-24 px-4 sm:px-6 bg-zinc-900/50 border-y border-zinc-800 transition-all duration-700 ${inViewParaQuem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">Para Quem É</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Clubes de Futsal', desc: 'Equipes adultas e de base que buscam profissionalização' },
              { icon: Target, title: 'Times Universitários', desc: 'Projetos esportivos acadêmicos e competitivos' },
              { icon: Shield, title: 'Comissões Técnicas', desc: 'Treinadores que querem dados organizados para decisões' }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-black border border-zinc-800 rounded-2xl p-8 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.02] ${inViewParaQuem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <item.icon className="text-[#00f0ff] mb-4" size={48} />
                <h3 className="text-xl font-black text-white mb-3 uppercase">{item.title}</h3>
                <p className="text-zinc-400 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Problema Atual */}
      <section ref={refDesafio} className={`py-24 px-4 sm:px-6 transition-all duration-700 ${inViewDesafio ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">O Desafio Atual</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto mb-6"></div>
            <p className="text-xl text-zinc-400 font-medium">Gestão informal prejudica o desenvolvimento da equipe</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {[
              'Planilhas desorganizadas e dados perdidos',
              'Falta de histórico completo dos atletas',
              'Dificuldade em acompanhar evolução real',
              'Sistemas caros ou complexos demais',
              'Avaliações subjetivas sem base de dados',
              'Falta de profissionalização na gestão técnica'
            ].map((problem, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 transition-all duration-300 ${inViewDesafio ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                <p className="text-zinc-300 font-medium text-lg">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solucao" ref={refSolucao} className={`py-24 px-4 sm:px-6 bg-zinc-900/30 transition-all duration-700 ${inViewSolucao ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">A Solução</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto mb-6"></div>
            <p className="text-xl text-zinc-400 font-medium">Gestão profissional, simples e completa</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              { icon: Users, title: 'Gestão de Equipe', desc: 'Cadastro completo de atletas, comissão técnica e histórico' },
              { icon: Clock, title: 'Programação', desc: 'Organize treinos, jogos e convocações em um só lugar' },
              { icon: BarChart3, title: 'Scout de Jogo', desc: 'Registre dados individuais e coletivos de cada partida' },
              { icon: TrendingUp, title: 'Evolução e Ranking', desc: 'Acompanhe performance e compare atletas com dados reais' }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className={`bg-black border border-zinc-800 rounded-2xl p-8 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.02] ${inViewSolucao ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <feature.icon className="text-[#00f0ff] mb-4" size={40} />
                <h3 className="text-2xl font-black text-white mb-3 uppercase">{feature.title}</h3>
                <p className="text-zinc-400 font-medium text-lg leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carrossel de Imagens */}
      <section ref={refCarousel} className={`py-24 px-4 sm:px-6 transition-all duration-700 ${inViewCarousel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-4">Gestão de Alta Performance</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto"></div>
          </div>
          <ImageCarousel />
        </div>
      </section>

      <section id="diferenciais" ref={refDiferenciais} className={`py-24 px-4 sm:px-6 transition-all duration-700 ${inViewDiferenciais ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">Por Que SCOUT21PRO?</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto"></div>
          </div>
          
          <div className="space-y-6">
            {[
              'Foco exclusivo em esportes de quadra (futsal)',
              'Pensado para clubes pequenos e médios do Brasil',
              'Interface simples, sem complexidade desnecessária',
              'Personalizável conforme a realidade do seu clube',
              'Plataforma brasileira, próxima da sua realidade'
            ].map((diff, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.01] ${inViewDiferenciais ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <CheckCircle className="text-[#00f0ff] shrink-0" size={32} />
                <p className="text-white font-bold text-xl">{diff}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Do Vestiário ao Escritório */}
      <section ref={refVestiario} className={`py-24 px-4 sm:px-6 bg-zinc-900/30 transition-all duration-700 ${inViewVestiario ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">Do Vestiário ao Escritório</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto mb-8"></div>
            <p className="text-xl text-zinc-400 font-medium max-w-3xl mx-auto">
              Trazer a frieza dos números para a emoção do campo.<br />
              Transformar dados em legado vencedor.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { 
                icon: Brain, 
                title: 'Lógica', 
                desc: 'Trazer a frieza dos números para a emoção do campo.',
                emoji: '🏛️'
              },
              { 
                icon: Trophy, 
                title: 'Prática', 
                desc: 'Transformar dados em legado vencedor.',
                emoji: '⚽'
              },
              { 
                icon: BarChart3, 
                title: 'Método', 
                desc: 'Gestão Esportiva de Alta Performance.',
                emoji: '📊'
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-black border border-zinc-800 rounded-2xl p-8 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.02] text-center ${inViewVestiario ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <item.icon className="text-[#00f0ff] mb-4 mx-auto" size={40} />
                <h3 className="text-xl font-black text-white mb-4 uppercase">{item.title}</h3>
                <p className="text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O DNA do Idealizador */}
      <section ref={refDNA} className={`py-24 px-4 sm:px-6 transition-all duration-700 ${inViewDNA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">O DNA do Idealizador</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { 
                icon: Trophy, 
                title: 'Atleta (Vestiário)', 
                desc: 'Vivência da dor real: falta de profissionalismo e gestão.',
                emoji: '⚽'
              },
              { 
                icon: Building2, 
                title: 'Executivo (Logística)', 
                desc: 'Gestão baseada em KPIs, SLA e Nível de Serviço ao Cliente.',
                emoji: '🏢'
              },
              { 
                icon: Sparkles, 
                title: 'Alta Performance', 
                desc: 'A aplicação de indicadores de alta performance com metodologia corporativa.',
                emoji: '🚀'
              },
              { 
                icon: Brain, 
                title: 'Expertise em BI', 
                desc: 'Expertise em transformar dados brutos de 20.000 linhas de excel em insights poderosos.',
                emoji: '📊'
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.01] ${inViewDNA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">{item.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <item.icon className="text-[#00f0ff]" size={32} />
                      <h3 className="text-2xl font-black text-white uppercase">{item.title}</h3>
                    </div>
                    <p className="text-zinc-300 font-medium text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={refComoFunciona} className={`py-24 px-4 sm:px-6 bg-zinc-900/30 transition-all duration-700 ${inViewComoFunciona ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">Como Funciona</h2>
            <div className="w-24 h-1 bg-[#00f0ff] mx-auto mb-6"></div>
            <p className="text-xl text-zinc-400 font-medium">Simples e direto ao ponto</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
            {[
              { num: '1', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito' },
              { num: '2', title: 'Monte sua equipe', desc: 'Adicione atletas e comissão' },
              { num: '3', title: 'Registre jogos', desc: 'Scout simples e eficiente' },
              { num: '4', title: 'Acompanhe evolução', desc: 'Dados e ranking em tempo real' },
              { num: '5', title: 'Tome decisões', desc: 'Base sólida para escolhas técnicas' }
            ].map((step, idx) => (
              <div
                key={idx}
                className={`bg-black border border-zinc-800 rounded-2xl p-8 hover:border-[#00f0ff] transition-all duration-300 hover:scale-[1.02] text-center ${inViewComoFunciona ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-16 h-16 bg-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-4 text-black font-black text-2xl transition-transform duration-300 hover:scale-110 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                  {step.num}
                </div>
                <h3 className="text-xl font-black text-white mb-3 uppercase">{step.title}</h3>
                <p className="text-zinc-400 font-medium text-base">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="py-32 px-4 sm:px-6 bg-gradient-to-br from-zinc-900 to-black border-y border-zinc-800">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-black uppercase text-white leading-tight">
            Pronto para profissionalizar<br />
            <span className="text-[#00f0ff]">sua equipe?</span>
          </h2>
          <button onClick={handleClick} type="button" className="group px-10 py-5 bg-[#00f0ff] hover:bg-[#00d4e6] active:scale-[0.98] text-black font-black text-xl uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_40px_rgba(0,240,255,0.5)] hover:shadow-[0_0_60px_rgba(0,240,255,0.7)] hover:scale-[1.02] flex items-center gap-3 mx-auto cursor-pointer">
            Criar Conta Grátis
            <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={28} />
          </button>
          <p className="text-sm text-zinc-600 font-medium">
            ✓ Sem compromisso &nbsp;&nbsp; ✓ Cancele quando quiser &nbsp;&nbsp; ✓ Suporte em português
          </p>
          <div className="pt-16 border-t border-zinc-800 mt-16 text-left">
            <h3 className="text-2xl md:text-3xl font-black uppercase text-white mb-2">Fale conosco</h3>
            <p className="text-zinc-400 font-medium mb-8">Preencha o formulário ou use o botão do WhatsApp.</p>
            {contactSubmitted ? (
              <div className="bg-zinc-900/80 border border-[#00f0ff]/30 rounded-xl p-8 text-center">
                <CheckCircle className="text-[#00f0ff] mx-auto mb-4" size={48} />
                <p className="text-white font-bold text-lg">Mensagem enviada!</p>
                <p className="text-zinc-400 mt-2">Em breve entraremos em contato.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5 max-w-xl">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-zinc-300 mb-2">Nome *</label>
                  <input id="contact-name" type="text" required value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-colors" placeholder="Seu nome" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-zinc-300 mb-2">E-mail *</label>
                  <input id="contact-email" type="email" required value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-colors" placeholder="seu@email.com" />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-semibold text-zinc-300 mb-2">Telefone / WhatsApp</label>
                  <input id="contact-phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-colors" placeholder="(48) 99999-9999" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-zinc-300 mb-2">Mensagem *</label>
                  <textarea id="contact-message" required rows={4} value={contactForm.message} onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-colors resize-y" placeholder="Como podemos ajudar?" />
                </div>
                <button type="submit" className="px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]">Enviar mensagem</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <a href="https://wa.me/5548991486176?text=Olá%2C%20gostaria%20de%20mais%20informações%20sobre%20o%20SCOUT21PRO" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-black" aria-label="Contato pelo WhatsApp">
        <WhatsAppIcon className="w-8 h-8" />
      </a>

      <footer className="py-12 px-4 sm:px-6 bg-black border-t border-zinc-800">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <img src="/public-logo.png.png" alt="SCOUT21PRO Logo" className="h-12 w-auto" />
          </div>
          <p className="text-zinc-500 font-medium">
            Plataforma brasileira de gestão e performance para futsal
          </p>
          <div className="pt-8 border-t border-zinc-900">
            <p className="text-zinc-700 text-xs">
              © 2026 SCOUT21PRO. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Users, Shield } from 'lucide-react';
import { WhatsAppIcon } from '../shared/WhatsAppIcon';
import { track } from '../../../utils/analytics';

interface FinalCtaProps {
  goToSignup: (where: string) => (e: React.MouseEvent) => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ goToSignup }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSending, setContactSending] = useState(false);

  const readUtm = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      const sp = new URLSearchParams(window.location.search);
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const out: Record<string, string> = {};
      keys.forEach((k) => {
        const v = sp.get(k);
        if (v) out[k] = v;
      });
      return out;
    } catch {
      return {};
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSending(true);
    setContactError('');
    try {
      track('contact_form_submit', { source: 'landing' });
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone || null,
          message: contactForm.message || null,
          source: 'landing',
          lang: 'pt-BR',
          ua: navigator.userAgent,
          ...readUtm(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setContactError((err as Error).message || 'error');
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } finally {
      setContactSending(false);
    }
  };

  return (
    <section id="contato" className="py-24 md:py-32 px-4 md:px-8 bg-zinc-950 border-y border-zinc-800">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="landing-headline text-4xl md:text-5xl text-white leading-tight">
          Pronto para decidir
          <br />
          <span className="text-[#00f0ff]">com o elenco na mão?</span>
        </h2>
        <p className="landing-body-medium text-sm text-zinc-500">
          Sem compromisso · Cancele quando quiser · Suporte em português
        </p>

        <a
          href="/criar-conta"
          onClick={goToSignup('cta-final')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-base rounded-xl transition-all"
        >
          Começar teste de 30 dias <ArrowRight size={20} />
        </a>

        <div className="grid md:grid-cols-2 gap-6 mt-16 text-left max-w-3xl mx-auto">
          <div className="border border-zinc-800 bg-black p-8 space-y-4">
            <Users className="text-[#00f0ff]" size={28} />
            <h3 className="landing-headline text-lg text-white">Teste self-service</h3>
            <p className="landing-body text-sm text-zinc-400">
              Cadastro em menos de um minuto. Produto completo por 30 dias.
            </p>
            <a
              href="/criar-conta"
              onClick={goToSignup('plano-essencial')}
              className="inline-flex text-sm font-semibold text-[#00f0ff] hover:text-white"
            >
              Criar conta →
            </a>
          </div>
          <div className="border border-zinc-800 bg-black p-8 space-y-4">
            <Shield className="text-[#00f0ff]" size={28} />
            <h3 className="landing-headline text-lg text-white">Plano para o clube</h3>
            <p className="landing-body text-sm text-zinc-400">
              Precisa de onboarding assistido ou várias equipes? Fale com a gente.
            </p>
            <a
              href="https://wa.me/5548991486176?text=Olá%2C%20desejo%20um%20plano%20personalizado%20para%20minha%20equipe."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('cta_whatsapp_click', { where: 'plano-personalizado' })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" /> WhatsApp suporte
            </a>
          </div>
        </div>

        <div className="pt-16 border-t border-zinc-800 mt-16 text-left">
          <h3 className="landing-headline text-2xl text-white mb-2">Fale conosco</h3>
          <p className="landing-body-medium text-zinc-400 mb-8">
            Formulário para proposta consultiva — ou use o WhatsApp.
          </p>
          {contactSubmitted ? (
            <div className="bg-zinc-900/80 border border-[#00f0ff]/30 p-8 text-center">
              <CheckCircle className="text-[#00f0ff] mx-auto mb-4" size={48} />
              <p className="landing-body-medium text-white text-lg">Recebido!</p>
              <p className="landing-body text-zinc-400 mt-2">
                Em até 24h nosso time entra em contato.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 max-w-xl">
              <div>
                <label htmlFor="contact-name" className="landing-body-medium block text-sm text-zinc-300 mb-2">
                  Nome *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="landing-body-medium block text-sm text-zinc-300 mb-2">
                  E-mail *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="landing-body-medium block text-sm text-zinc-300 mb-2">
                  Telefone / WhatsApp
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
                  placeholder="(48) 99999-9999"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="landing-body-medium block text-sm text-zinc-300 mb-2">
                  Mensagem *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] resize-y"
                  placeholder="Conte o cenário da sua equipe."
                />
              </div>
              <button
                type="submit"
                disabled={contactSending}
                className="landing-body-medium px-6 py-3.5 bg-[#00f0ff] hover:bg-[#00d4e6] text-black text-sm rounded-lg disabled:opacity-60"
              >
                {contactSending ? 'Enviando…' : 'Quero receber uma proposta'}
              </button>
              {contactError ? (
                <p className="text-xs text-zinc-500">
                  Recebemos localmente; houve um problema técnico — tentaremos contato em breve.
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

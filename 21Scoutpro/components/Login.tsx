import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config';

// Importação explícita da logo oficial
const LOGO_IMAGE = '/public-logo.png.png';
const WHATSAPP_URL = 'https://wa.me/5548991486176?text=Olá!%20Gostaria%20de%20criar%20uma%20conta%20no%20SCOUT21.';

interface LoginProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'register';
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
  onBackToHome?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBackToHome }) => {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMsg('');
    
    // Simulação de envio de e-mail
    setResetSuccessMsg('Instruções para redefinição de senha foram enviadas.');
    setTimeout(() => {
      setIsResettingPassword(false);
      setResetEmail('');
      setResetSuccessMsg('');
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // Login - chamar API do backend (aceita email ou nome)
        const identifier = email.trim();
        
        console.log('🔐 Tentando login com:', identifier);
        
        const response = await fetch(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: identifier,
            password: password,
          }),
        });

        const result = await response.json();
        
        if (result.success && result.data) {
          // Salvar token
          localStorage.setItem('token', result.data.token);
          console.log('✅ Token salvo no localStorage:', result.data.token.substring(0, 20) + '...');
          
          // Criar objeto User
          const user: User = {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            role: result.data.user.role === 'TECNICO' ? 'Treinador' : result.data.user.role,
          };
          
          console.log('👤 Usuário criado:', user);
          console.log('🔄 Chamando onLogin...');
          onLogin(user);
          setIsLoading(false);
        } else {
          setError(result.error || 'Email ou senha incorretos.');
          setIsLoading(false);
        }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      setError('Erro de conexão. Verifique se o backend está rodando.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-black overflow-hidden font-sans text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-zinc-800/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center shrink-0">
              {onBackToHome ? (
                <button type="button" onClick={onBackToHome} className="hover:opacity-80 transition-opacity cursor-pointer">
                  <img src={LOGO_IMAGE} alt="SCOUT21 Logo" className="h-10 md:h-12 w-auto" />
                </button>
              ) : (
                <img src={LOGO_IMAGE} alt="SCOUT21 Logo" className="h-10 md:h-12 w-auto" />
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <a href="https://instagram.com/scout21" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 text-[#00f0ff] hover:text-[#00d4e6] text-sm font-semibold transition-all hover:bg-zinc-900/50 rounded-lg border border-transparent hover:border-[#00f0ff]/30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="hidden md:inline">@scout21</span>
              </a>
              {onBackToHome && (
                <button type="button" onClick={onBackToHome} className="px-5 md:px-7 py-2.5 md:py-3 bg-[#00f0ff] hover:bg-[#00d4e6] active:scale-[0.98] text-black font-black text-sm md:text-base uppercase tracking-wider rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]">Voltar</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Área central: sem rolagem, tudo visível */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-16 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop" 
            alt="Arena Lotada Emoção" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
      </div>

      {/* Auth Card - compacto para caber na tela sem rolagem */}
      <div className="z-20 bg-black/20 backdrop-blur-lg border border-white/10 p-4 sm:p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] w-full max-w-sm relative animate-fade-in ring-1 ring-white/5">
        
        <div className="mb-4 text-center">
            {/* Logo Oficial */}
            <div className="flex justify-center mb-3">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center border-2 border-white bg-black/60 shadow-[0_0_30px_rgba(0,240,255,0.25)] rounded-xl transform rotate-3 transition-all duration-300 overflow-hidden">
                    <img 
                        src={LOGO_IMAGE} 
                        alt="SCOUT21" 
                        className="w-full h-full object-contain p-4"
                    />
                </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                SCOUT21
            </h1>
            <p className="text-[9px] text-zinc-200 font-light uppercase tracking-[0.25em] mt-0.5 drop-shadow-md">
                Performance Data Intelligence e Gestão
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">E-mail ou Nome</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
              placeholder="seu@email.com ou seu nome"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
              placeholder="••••••"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setIsResettingPassword(true)}
            className="w-full text-[10px] text-zinc-400 hover:text-[#00f0ff] font-light underline transition-colors text-center"
          >
            Esqueci minha senha
          </button>

          {error && <div className="text-red-400 text-xs bg-red-950/60 p-3 rounded-xl border border-red-900/50 flex items-center gap-2 justify-center font-light backdrop-blur-sm"><ShieldCheck size={14}/> {error}</div>}
          {successMsg && <div className="text-[#00f0ff] text-xs bg-cyan-950/60 p-3 rounded-xl border border-cyan-900/50 text-center font-light backdrop-blur-sm">{successMsg}</div>}

          {isResettingPassword ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
                  placeholder="Digite seu e-mail"
                />
              </div>
              
              {resetSuccessMsg && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-400 text-xs py-2 px-4 rounded-lg text-center">
                  {resetSuccessMsg}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(false);
                    setResetEmail('');
                    setError('');
                    setResetSuccessMsg('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 font-bold uppercase text-xs rounded-xl transition-all border border-white/10"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  onClick={handleResetPassword}
                  className="flex-1 bg-[#00f0ff] hover:bg-[#33f5ff] text-black py-4 font-bold uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-white/90 hover:bg-[#00f0ff] text-black font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)] mt-4 uppercase tracking-wider backdrop-blur-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Entrando...
                </>
              ) : (
                <>Entrar em Quadra</>
              )}
            </button>
          )}
        </form>
        
        <div className="mt-4 text-center pt-4 border-t border-white/10">
             <a 
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-[10px] text-zinc-300 hover:text-[#25D366] font-light transition-colors uppercase tracking-widest"
             >
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                 Cadastre-se via WhatsApp
             </a>
        </div>
      </div>
      </div>

      {/* Rodapé fixo: frase completa em uma linha, logo no final */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 py-3 px-4 bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-nowrap items-center justify-center gap-2 sm:gap-2.5">
          <p className="text-zinc-300 font-light text-xs sm:text-sm tracking-wide whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
            Bem-vindo ao <span className="text-[#00f0ff] font-bold italic">SCOUT21</span> — gestão esportiva baseada em dados para decisões vencedoras.
          </p>
          <div className="w-6 h-6 border border-zinc-600/50 rounded flex items-center justify-center bg-black/80 shrink-0 overflow-hidden flex-shrink-0">
            <img src={LOGO_IMAGE} alt="" className="w-full h-full object-contain p-0.5" />
          </div>
        </div>
      </footer>
    </div>
  );
};
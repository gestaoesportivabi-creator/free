import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config';

// Importação explícita da logo oficial
const LOGO_IMAGE = '/public-logo.png.png';

interface LoginProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'register';
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
  onBackToHome?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, initialMode = 'login', onSwitchToLogin, onSwitchToRegister, onBackToHome }) => {
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Treinador');
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
      if (isRegistering) {
        // Validações simples
        if (!name || name.trim().length < 3) {
          setError('Digite seu nome (mínimo 3 caracteres).');
          setIsLoading(false);
          return;
        }
        if (!email || email.trim().length < 3) {
          setError('Digite um email válido (mínimo 3 caracteres).');
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 4) {
          setError('Senha muito curta (mínimo 4 caracteres).');
          setIsLoading(false);
          return;
        }
        
        // Chamar API do backend para registro
        const response = await fetch(`${getApiUrl()}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password,
            roleName: 'TECNICO' // Backend usa TECNICO como padrão
          }),
        });

        const result = await response.json();
        
        if (result.success && result.data) {
          // Salvar token
          localStorage.setItem('token', result.data.token);
          
          // Criar objeto User
          const newUser: User = {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            role: result.data.user.role === 'TECNICO' ? 'Treinador' : result.data.user.role,
          };
          
          setSuccessMsg('Conta criada com sucesso!');
          // Login automático após um breve delay
          setTimeout(() => {
            onLogin(newUser);
          }, 500);
        } else {
          setError(result.error || 'Erro ao criar conta. Tente novamente.');
          setIsLoading(false);
        }
      } else {
        // Login - chamar API do backend
        // IMPORTANTE: Se o usuário digitar "admin", sempre usar "admin@admin.com"
        const emailToUse = (email.trim() === 'admin' || email.trim() === 'admin@admin.com') 
          ? 'admin@admin.com' 
          : email.trim();
        
        console.log('🔐 Tentando login com email:', emailToUse);
        
        const response = await fetch(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailToUse,
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center shrink-0">
              {onBackToHome ? (
                <button type="button" onClick={onBackToHome} className="hover:opacity-80 transition-opacity cursor-pointer">
                  <img src={LOGO_IMAGE} alt="SCOUT21PRO Logo" className="h-10 md:h-12 w-auto" />
                </button>
              ) : (
                <img src={LOGO_IMAGE} alt="SCOUT21PRO Logo" className="h-10 md:h-12 w-auto" />
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <a href="https://instagram.com/scout21pro" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 text-[#00f0ff] hover:text-[#00d4e6] text-sm font-semibold transition-all hover:bg-zinc-900/50 rounded-lg border border-transparent hover:border-[#00f0ff]/30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="hidden md:inline">@scout21pro</span>
              </a>
              {onBackToHome && (
                <button type="button" onClick={onBackToHome} className="px-5 md:px-7 py-2.5 md:py-3 bg-[#00f0ff] hover:bg-[#00d4e6] active:scale-[0.98] text-black font-black text-sm md:text-base uppercase tracking-wider rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]">Voltar</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center pt-24 pb-8">
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop" 
            alt="Arena Lotada Emoção" 
            className="w-full h-full object-cover opacity-60"
          />
          {/* Gradient Overlay for Text Readability and Mood */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
      </div>

      {/* Auth Card - Black Piano Aesthetic - EXTRA TRANSPARENT (20%) */}
      <div className="z-20 bg-black/20 backdrop-blur-lg border border-white/10 p-12 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] w-full max-w-sm relative animate-fade-in ring-1 ring-white/5 mb-24">
        
        <div className="mb-10 text-center">
            {/* Logo Oficial */}
            <div className="flex justify-center mb-8">
                <div className={`relative w-40 h-40 flex items-center justify-center border-[3px] ${isRegistering ? 'border-[#00f0ff]' : 'border-white'} bg-black/60 shadow-[0_0_40px_rgba(0,240,255,0.3)] rounded-2xl transform rotate-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] overflow-hidden`}>
                    <img 
                        src={LOGO_IMAGE} 
                        alt="SCOUT21PRO" 
                        className="w-full h-full object-contain p-4"
                    />
                </div>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                SCOUT21PRO
            </h1>
            <p className="text-[10px] text-zinc-200 font-light uppercase tracking-[0.3em] mt-2 drop-shadow-md">
                {isRegistering ? 'Criar Conta Gratuita' : 'Performance Data Intelligence e Gestão'}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
             <div className="space-y-1.5">
                <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">Seu Nome</label>
                <input
                    type="text"
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
                    placeholder="João Silva"
                />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">{isRegistering ? 'Escolha um usuário' : 'Usuário'}</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
              placeholder={isRegistering ? 'joaosilva' : 'admin'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">{isRegistering ? 'Crie uma senha' : 'Senha'}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
              placeholder="••••••"
            />
            {!isRegistering && (
              <p className="text-[10px] text-zinc-400 font-light text-center pt-1">Use admin/admin para teste</p>
            )}
            {isRegistering && (
              <p className="text-[10px] text-zinc-400 font-light text-center pt-1">Mínimo 4 caracteres</p>
            )}
          </div>
          
          {!isRegistering && (
            <button
              type="button"
              onClick={() => setIsResettingPassword(true)}
              className="w-full text-[10px] text-zinc-400 hover:text-[#00f0ff] font-light underline transition-colors text-center"
            >
              Esqueci minha senha
            </button>
          )}

          {isRegistering && (
            <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">Função</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] text-sm font-light uppercase backdrop-blur-sm"
                >
                    <option value="Treinador">Treinador</option>
                    <option value="Preparador Físico">Preparador Físico</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Diretor">Diretor</option>
                    <option value="Atleta">Atleta</option>
                </select>
            </div>
          )}

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
                  {isRegistering ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isRegistering ? 'Criar Conta Grátis' : 'Entrar em Quadra'
              )}
            </button>
          )}
        </form>
        
        <div className="mt-8 text-center pt-6 border-t border-white/10">
             <button 
                onClick={() => {
                    if (isRegistering && onSwitchToLogin) {
                      onSwitchToLogin();
                    } else if (!isRegistering && onSwitchToRegister) {
                      onSwitchToRegister();
                    } else {
                    setIsRegistering(!isRegistering);
                    }
                    setError('');
                }}
                className="text-xs text-zinc-300 hover:text-white font-light transition-colors uppercase tracking-widest"
             >
                 {isRegistering ? 'Já possui conta? Fazer Login' : 'Novo no clube? Criar Conta'}
             </button>
        </div>
      </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center px-6 animate-fade-in-up">
        <div className="flex flex-col items-center gap-2.5">
            {/* Decorative Line */}
            <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-zinc-600 to-transparent"></div>
            
            {/* Welcome Message - Compact Background (almost text size) */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-700/70 backdrop-blur-sm rounded-md">
                <span className="text-zinc-300 font-light text-xs md:text-sm tracking-wide">
                    Bem-vindo ao <span className="text-[#00f0ff] font-bold italic">SCOUT21PRO</span> — gestão esportiva baseada em dados para decisões vencedoras.
                </span>
                {/* Logo oficial no rodapé */}
                <div className="w-5 h-5 border border-zinc-600/50 rounded flex items-center justify-center bg-black/90 shrink-0 ml-1 overflow-hidden">
                    <img 
                        src={LOGO_IMAGE} 
                        alt="SCOUT21PRO" 
                        className="w-full h-full object-contain p-0.5"
                    />
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};
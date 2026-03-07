import React, { useState } from 'react';
import { registerCoach } from '../../services/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';

const LOGO_IMAGE = '/public-logo.png.png';

interface RegisterProps {
    onRegisterSuccess: (user: any) => void;
    onSwitchToLogin: () => void;
}

export function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        console.group('📝 [Register] Tentando registrar usuário');
        console.log('Dados:', { name, email, passwordLength: password.length });

        try {
            const result = await registerCoach(name, email, password);
            console.log('📦 Resultado API:', result);

            if (result.success && result.user) {
                console.log('✅ Sucesso! Redirecionando...');
                localStorage.setItem('user', JSON.stringify(result.user));
                onRegisterSuccess(result.user);
            } else {
                console.error('❌ Erro:', result.error);
                setError(result.error || 'Erro desconhecido ao registrar');
            }
        } catch (err) {
            console.error('❌ Exceção:', err);
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-black overflow-hidden font-sans text-white">

            {/* Background - Crowded Arena / Emotion (Igual Login) */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop"
                    alt="Arena Lotada Emoção"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
            </div>

            {/* Auth Card - Black Piano Aesthetic */}
            <div className="z-20 bg-black/20 backdrop-blur-lg border border-white/10 p-12 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] w-full max-w-sm relative animate-fade-in ring-1 ring-white/5 mb-24">

                <div className="mb-10 text-center">
                    {/* Logo Oficial */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40 flex items-center justify-center border-[3px] border-[#00f0ff] bg-black/60 shadow-[0_0_40px_rgba(0,240,255,0.3)] rounded-2xl transform rotate-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] overflow-hidden">
                            <img
                                src={LOGO_IMAGE}
                                alt="SCOUT21PRO"
                                className="w-full h-full object-contain p-4"
                            />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                        CRIAR CONTA
                    </h1>
                    <p className="text-[10px] text-zinc-200 font-light uppercase tracking-[0.3em] mt-2 drop-shadow-md">
                        Comece a Profissionalizar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">Nome Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
                            placeholder="Seu Nome"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-light text-zinc-300 uppercase tracking-wider pl-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:bg-black/60 transition-all placeholder-zinc-400 font-light text-sm backdrop-blur-sm"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p className="text-[10px] text-zinc-400 font-light text-center pt-1">Mínimo 6 caracteres</p>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs bg-red-950/60 p-3 rounded-xl border border-red-900/50 flex items-center gap-2 justify-center font-light backdrop-blur-sm animate-pulse">
                            <ShieldCheck size={14} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-[#00f0ff] hover:bg-[#33f5ff] text-black font-bold text-sm rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] mt-4 uppercase tracking-wider backdrop-blur-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Criando ambiente...
                            </>
                        ) : (
                            'Criar Conta Grátis'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/10">
                    <button onClick={onSwitchToLogin} className="text-xs text-zinc-300 hover:text-white font-light transition-colors uppercase tracking-widest">
                        Já tem uma conta? Fazer Login
                    </button>
                </div>
            </div>

            {/* Footer Igual Login */}
            <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center px-6 animate-fade-in-up">
                <div className="flex flex-col items-center gap-2.5">
                    <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-zinc-600 to-transparent"></div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-700/70 backdrop-blur-sm rounded-md">
                        <span className="text-zinc-300 font-light text-xs md:text-sm tracking-wide">
                            Junte-se ao <span className="text-[#00f0ff] font-bold italic">SCOUT21PRO</span>
                        </span>
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
}

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, Lock, CheckCircle, Shield, Plus } from 'lucide-react';

const CURRENT_TEAM_STORAGE_KEY = 'scout21_settings_current_team';

type CurrentTeam = {
  teamName: string;
  startDate: string;
  endDate: string;
  shieldUrl: string;
};

interface SettingsProps {
  currentUser: User | null;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');

  const [teamName, setTeamName] = useState('');
  const [teamStartDate, setTeamStartDate] = useState('');
  const [teamEndDate, setTeamEndDate] = useState('');
  const [teamShieldUrl, setTeamShieldUrl] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhotoUrl(currentUser.photoUrl || '');
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_TEAM_STORAGE_KEY);
      if (raw) {
        const data: CurrentTeam = JSON.parse(raw);
        setTeamName(data.teamName || '');
        setTeamStartDate(data.startDate || '');
        setTeamEndDate(data.endDate || '');
        setTeamShieldUrl(data.shieldUrl || '');
      }
    } catch (_) {}
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPhotoUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleShieldUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTeamShieldUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveCurrentTeam = () => {
    const data: CurrentTeam = {
      teamName,
      startDate: teamStartDate,
      endDate: teamEndDate,
      shieldUrl: teamShieldUrl,
    };
    localStorage.setItem(CURRENT_TEAM_STORAGE_KEY, JSON.stringify(data));
  };

  const handleAddNewTeam = () => {
    saveCurrentTeam();
    setTeamName('');
    setTeamStartDate('');
    setTeamEndDate('');
    setTeamShieldUrl('');
    setSuccess('Formulário limpo para cadastrar o novo time. Preencha e salve.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    // Validar formato de email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Formato de email inválido!");
        return;
      }
    }

    if (password && password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    const updates: Partial<User> = {
      name,
      email,
      photoUrl
    };
    
    onUpdateUser(updates);
    saveCurrentTeam();

    setSuccess('Configurações atualizadas com sucesso!');
    setPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header - Black Piano */}
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <UserIcon className="text-[#10b981]" /> Configurações Gerais
            </h2>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Gerencie perfil, metas e definições do sistema.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card Preview */}
        <div className="md:col-span-1">
            <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-xl flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-[#10b981] mb-4 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    {photoUrl ? (
                        <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-3xl">
                            {name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">{name || 'Usuário'}</h3>
                <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded-full mt-2 uppercase tracking-widest border border-[#10b981]/20">
                    {currentUser?.role}
                </span>
                <p className="text-zinc-500 text-xs mt-4 truncate max-w-full px-4">{currentUser?.email}</p>
            </div>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-8">
            
            {/* 1. Profile Form */}
            <form onSubmit={handleSubmit} className="bg-black p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
                
                <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase text-sm tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <Shield size={16} className="text-[#10b981]" /> Time Atual
                    </h3>
                    <p className="text-zinc-500 text-xs">Nome do clube, período de trabalho e escudo. Data de fim em branco = ainda no clube.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nome do time</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 text-sm outline-none focus:border-[#10b981]"
                                placeholder="Ex: Clube ABC"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Início do trabalho</label>
                            <input
                                type="date"
                                value={teamStartDate}
                                onChange={(e) => setTeamStartDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 text-sm outline-none focus:border-[#10b981]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fim do trabalho</label>
                            <input
                                type="date"
                                value={teamEndDate}
                                onChange={(e) => setTeamEndDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 text-sm outline-none focus:border-[#10b981]"
                                placeholder="Vazio = ainda no clube"
                            />
                            {teamEndDate.trim() !== '' && (
                                <button
                                    type="button"
                                    onClick={handleAddNewTeam}
                                    className="mt-2 flex items-center gap-1.5 text-[#10b981] hover:text-[#34d399] text-xs font-bold uppercase"
                                >
                                    <Plus size={14} /> Adicionar novo time
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Escudo da equipe</label>
                            <div className="flex items-center gap-2">
                                {teamShieldUrl ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0 bg-zinc-900">
                                        <img src={teamShieldUrl} alt="Escudo" className="w-full h-full object-contain" />
                                    </div>
                                ) : null}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.svg,.webp"
                                    onChange={handleShieldUpload}
                                    className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white text-xs outline-none focus:border-[#10b981] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase text-sm tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <UserIcon size={16} className="text-[#10b981]" /> Informações Básicas
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nome de Exibição</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-medium"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Foto de Perfil (Upload)</label>
                            <input 
                                type="file" 
                                accept=".jpg, .jpeg, .png, .tiff, .bmp"
                                onChange={handlePhotoUpload}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#10b981] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-white font-bold uppercase text-sm tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <Lock size={16} className="text-[#10b981]" /> Segurança
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nova Senha</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-medium"
                                placeholder="••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Confirmar Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-medium"
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-pulse">
                        <CheckCircle size={16} /> {success}
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit"
                        className="bg-[#10b981] hover:bg-[#34d399] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </form>

        </div>
      </div>
    </div>
  );
};
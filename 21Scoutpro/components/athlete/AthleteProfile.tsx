import React, { useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { meApi } from '../../services/api';

interface AthleteProfileProps {
  profile: Record<string, unknown> | null;
  onUpdated?: () => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({ profile, onUpdated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSavePassword = async () => {
    if (!password || password.length < 8) {
      alert('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await meApi.updateProfile({ password });
      setPassword('');
      alert('Senha atualizada!');
      onUpdated?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar senha');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <p className="text-zinc-500 text-center py-12">Carregando perfil...</p>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-black text-white uppercase">Meu perfil</h1>
      </header>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">Nome</p>
          <p className="text-white font-medium">{String(profile.name || '')}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">Email</p>
          <p className="text-white font-medium">{String(profile.email || '—')}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">Equipe</p>
          <p className="text-white font-medium">{String(profile.equipeName || '—')}</p>
        </div>
        {profile.position != null && (
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Posição</p>
            <p className="text-white font-medium">{String(profile.position)}</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
        <h2 className="text-white font-bold text-sm uppercase">Alterar senha</h2>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (mín. 8 caracteres)"
            className="w-full bg-black border border-zinc-800 rounded-xl p-3 pr-12 text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSavePassword}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] text-black font-bold uppercase text-xs disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Atualizar senha'}
        </button>
      </section>
    </div>
  );
};

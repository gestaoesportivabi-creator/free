import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { meApi, MeWellnessType } from '../../services/api';

interface AthleteNumericFormProps {
  title: string;
  subtitle: string;
  types: { type: MeWellnessType; label: string; contextKey?: 'equipeId' | 'jogoId'; contextId?: string | null }[];
  equipeId?: string | null;
  defaultDate?: string;
  onSaved?: () => void;
}

export const AthleteNumericForm: React.FC<AthleteNumericFormProps> = ({
  title,
  subtitle,
  types,
  equipeId,
  defaultDate,
  onSaved,
}) => {
  const [values, setValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const today = defaultDate || new Date().toISOString().slice(0, 10);

  const saveOne = async (t: (typeof types)[0]) => {
    const val = values[t.type];
    if (val === undefined || val < 0 || val > 10) {
      alert('Selecione um valor de 0 a 10.');
      return;
    }
    setSaving(t.type);
    try {
      const body: Record<string, unknown> = { value: val, data: today };
      if (t.contextKey === 'jogoId' && t.contextId) body.jogoId = t.contextId;
      else if (equipeId) body.equipeId = equipeId;
      await meApi.saveWellness(t.type, body);
      alert('Salvo com sucesso!');
      onSaved?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-black text-white uppercase">{title}</h1>
        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
      </header>

      {types.map((t) => (
        <section key={t.type} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <h2 className="text-white font-bold text-sm">{t.label}</h2>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValues((v) => ({ ...v, [t.type]: n }))}
                className={`py-4 rounded-xl text-lg font-black border-2 transition-all ${
                  values[t.type] === n
                    ? 'bg-[#10b981] border-white text-black'
                    : 'bg-black border-zinc-800 text-zinc-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={saving === t.type}
            onClick={() => saveOne(t)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] text-black font-bold uppercase text-xs disabled:opacity-50"
          >
            <Save size={16} />
            {saving === t.type ? 'Salvando...' : 'Salvar'}
          </button>
        </section>
      ))}
    </div>
  );
};

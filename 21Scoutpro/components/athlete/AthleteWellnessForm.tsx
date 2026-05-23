import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { meApi } from '../../services/api';
import { WellnessScale, type WellnessValues } from './WellnessScale';
import type { WellnessDimensionKey } from '../WellnessTab';

interface AthleteWellnessFormProps {
  equipeId?: string | null;
  defaultDate?: string;
  onSaved?: () => void;
}

export const AthleteWellnessForm: React.FC<AthleteWellnessFormProps> = ({
  equipeId,
  defaultDate,
  onSaved,
}) => {
  const [values, setValues] = useState<WellnessValues>({});
  const [saving, setSaving] = useState(false);
  const today = defaultDate || new Date().toISOString().slice(0, 10);

  const onChange = (key: WellnessDimensionKey, value: number) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSave = async () => {
    const keys: WellnessDimensionKey[] = ['stress', 'sono', 'humor', 'dor', 'satisfacao'];
    if (keys.some((k) => values[k] === undefined)) {
      alert('Preencha todas as dimensões do bem-estar.');
      return;
    }
    if (!equipeId) {
      alert('Equipe não vinculada. Contacte a comissão.');
      return;
    }
    setSaving(true);
    try {
      await meApi.saveWellness('bem-estar-diario', {
        equipeId,
        data: today,
        stress: values.stress,
        sono: values.sono,
        humor: values.humor,
        dor: values.dor,
        satisfacao: values.satisfacao,
      });
      alert('Bem-estar registrado!');
      onSaved?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-black text-white uppercase">Bem-estar diário</h1>
        <p className="text-zinc-500 text-sm mt-1">Como você está hoje?</p>
      </header>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <WellnessScale values={values} onChange={onChange} />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] text-black font-bold uppercase text-xs disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar bem-estar'}
        </button>
      </div>
    </div>
  );
};

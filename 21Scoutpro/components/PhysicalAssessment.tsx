import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Player, PhysicalAssessment } from '../types';
import {
  Calculator,
  Ruler,
  Save,
  Trash2,
  FileText,
  TrendingDown,
  Users,
  Sigma,
  Droplets,
  Percent,
  Scale,
  Eraser,
  X,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface PhysicalAssessmentProps {
  players: Player[];
  assessments: PhysicalAssessment[];
  onSaveAssessment: (assessment: PhysicalAssessment) => void;
  onDeleteAssessment?: (id: string) => void;
}

/** Faixas alinhadas ao modal de interpretação: Ideal = atletas; Adequado = saudável; Elevado = acima do limite */
export type BodyFatReferenceBand = 'ideal' | 'adequado' | 'elevado';

type LastSavedResults = {
  sum7Mm: number;
  bodyDensity: number;
  bodyFatPercent: number;
  fatMassKg: number | null;
  leanMassKg: number | null;
  imc: number | null;
  referenceBand: BodyFatReferenceBand;
};

/**
 * Homens: Ideal 6–13%, Adequado 14–20%, Elevado &gt;25%.
 * Mulheres: Ideal 14–20%, Adequado 21–30%, Elevado &gt;35%.
 * Valores entre faixas (ex.: homem 21–25%) classificam como Adequado até o limite de Elevado.
 */
export function classifyBodyFatReference(bf: number, sex: 'M' | 'F'): BodyFatReferenceBand {
  if (sex === 'M') {
    if (bf > 25) return 'elevado';
    if (bf >= 6 && bf <= 13) return 'ideal';
    if (bf >= 14 && bf <= 20) return 'adequado';
    return 'adequado';
  }
  if (bf > 35) return 'elevado';
  if (bf >= 14 && bf <= 20) return 'ideal';
  if (bf >= 21 && bf <= 30) return 'adequado';
  return 'adequado';
}

const SKINFOLD_KEYS = [
  { key: 'chest' as const, label: 'Peito (mm)' },
  { key: 'axilla' as const, label: 'Axilar média (mm)' },
  { key: 'triceps' as const, label: 'Tríceps (mm)' },
  { key: 'subscapular' as const, label: 'Subescapular (mm)' },
  { key: 'abdominal' as const, label: 'Abdômen (mm)' },
  { key: 'suprailiac' as const, label: 'Supra-ilíaca (mm)' },
  { key: 'thigh' as const, label: 'Coxa (mm)' },
];

function computeJacksonPollock7(
  skinfolds: Record<string, number>,
  sex: 'M' | 'F',
  age: number
): { sum7: number; bodyDensity: number; bodyFatPercent: number } {
  const sum7 = SKINFOLD_KEYS.reduce((acc, { key }) => acc + (skinfolds[key] || 0), 0);
  let bodyDensity: number;
  if (sex === 'F') {
    bodyDensity = 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 * sum7 - 0.00012828 * age;
  } else {
    bodyDensity = 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 * sum7 - 0.00028826 * age;
  }
  const bodyFatPercent = 495 / bodyDensity - 450;
  return {
    sum7,
    bodyDensity,
    bodyFatPercent: Number.isFinite(bodyFatPercent) ? bodyFatPercent : NaN,
  };
}

/** Densidade a partir do % gordura (inversa da Siri) quando não há como recalcular por dobras */
function bodyDensityFromSiriPercent(bfPercent: number): number {
  return 495 / (bfPercent + 450);
}

function buildLastSavedFromAssessment(a: PhysicalAssessment, sex: 'M' | 'F', ageYears: number): LastSavedResults | null {
  const bfRaw = a.bodyFatPercent ?? a.bodyFat;
  if (typeof bfRaw !== 'number' || !Number.isFinite(bfRaw)) return null;
  const bf = parseFloat(bfRaw.toFixed(1));

  const skin = {
    chest: a.chest ?? 0,
    axilla: a.axilla ?? 0,
    subscapular: a.subscapular ?? 0,
    triceps: a.triceps ?? 0,
    abdominal: a.abdominal ?? 0,
    suprailiac: a.suprailiac ?? 0,
    thigh: a.thigh ?? 0,
  };
  const sum7 = SKINFOLD_KEYS.reduce((acc, { key }) => acc + (skin[key] || 0), 0);

  let bodyDensity: number;
  if (sum7 > 0) {
    const c = computeJacksonPollock7(skin, sex, ageYears);
    if (Number.isFinite(c.bodyDensity) && c.bodyDensity > 0) {
      bodyDensity = c.bodyDensity;
    } else {
      bodyDensity = bodyDensityFromSiriPercent(bf);
    }
  } else {
    bodyDensity = bodyDensityFromSiriPercent(bf);
  }

  const w = a.weight;
  const h = a.height;
  let fatMassKg: number | null = null;
  let leanMassKg: number | null = null;
  if (w > 0) {
    fatMassKg = parseFloat(((w * bf) / 100).toFixed(1));
    leanMassKg = parseFloat((w - fatMassKg).toFixed(1));
  }
  const imc = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : null;

  return {
    sum7Mm: Math.round(sum7 * 10) / 10,
    bodyDensity: parseFloat(bodyDensity.toFixed(4)),
    bodyFatPercent: bf,
    fatMassKg,
    leanMassKg,
    imc: imc != null ? Math.round(imc * 10) / 10 : null,
    referenceBand: classifyBodyFatReference(bf, sex),
  };
}

function bandToBfTextClass(band: BodyFatReferenceBand): string {
  if (band === 'ideal') return 'text-emerald-400';
  if (band === 'adequado') return 'text-amber-400';
  return 'text-red-400';
}

const formulaBox = 'my-3 rounded-lg border border-dashed border-zinc-600 bg-zinc-900/80 px-4 py-3 text-center font-mono text-[13px] leading-relaxed text-emerald-200/95';

function InterpretationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interpretation-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col rounded-2xl border border-zinc-600 bg-zinc-950 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-6 w-6 shrink-0 text-[#00f0ff]" />
            <div>
              <h2 id="interpretation-modal-title" className="text-lg font-black uppercase tracking-wide text-white sm:text-xl">
                Interpretação
              </h2>
              <p className="mt-1 text-xs text-zinc-500">Jackson & Pollock (7 dobras) · fórmulas e referências clínicas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-zinc-300 sm:px-6 sm:py-6">
          <section className="mb-8">
            <h3 className="mb-3 text-base font-bold text-[#5eead4]">O que é a calculadora Jackson & Pollock (7 dobras)?</h3>
            <p className="mb-3">
              Esta ferramenta estima a <strong className="text-zinc-100">densidade corporal</strong> e o{' '}
              <strong className="text-zinc-100">percentual de gordura corporal (%GC)</strong> a partir da soma de sete dobras cutâneas
              padronizadas (peito, axilar média, tríceps, subescapular, abdômen, supra-ilíaca e coxa), com conversão pela{' '}
              <strong className="text-zinc-100">equação de Siri</strong>. É um protocolo clássico em Medicina do Esporte e avaliação física.
            </p>
            <p>
              Ao informar o <strong className="text-zinc-100">peso (kg)</strong> — também disponível no cadastro do atleta na aba Elenco — a
              calculadora estima ainda <strong className="text-zinc-100">massa gorda</strong> e <strong className="text-zinc-100">massa magra</strong>.
              Recomenda-se <strong className="text-zinc-100">2–3 medições por dobra</strong> e usar a média para maior confiabilidade.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="mb-3 text-base font-bold text-white">Como a fórmula funciona?</h3>
            <p className="mb-2">O cálculo segue quatro etapas:</p>
            <ol className="list-inside list-decimal space-y-1 text-zinc-300">
              <li>Soma das dobras (Σ7);</li>
              <li>Densidade corporal por Jackson & Pollock;</li>
              <li>Conversão para %GC pela equação de Siri;</li>
              <li>Massas (opcional, com peso informado).</li>
            </ol>
          </section>

          <section className="mb-8 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
            <h4 className="mb-2 font-bold text-white">1) Soma das 7 dobras cutâneas</h4>
            <p className="mb-3">
              Insira as dobras em <strong className="text-zinc-100">milímetros (mm)</strong> e some os sete sítios padronizados. Use sempre o
              mesmo lado do corpo.
            </p>
            <div className={formulaBox}>
              Σ7 = d<sub className="text-xs">peito</sub> + d<sub className="text-xs">axilar</sub> + d<sub className="text-xs">tri</sub> + d
              <sub className="text-xs">sub</sub> + d<sub className="text-xs">abd</sub> + d<sub className="text-xs">sup</sub> + d
              <sub className="text-xs">cox</sub> (mm)
            </div>
          </section>

          <section className="mb-8 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
            <h4 className="mb-2 font-bold text-white">2) Densidade corporal (BD) — Jackson & Pollock (7 dobras)</h4>
            <p className="mb-3">
              A densidade corporal <strong className="text-zinc-100">BD</strong> (g/cm³) é estimada a partir de Σ7, Σ7² e idade, com
              coeficientes específicos por sexo.
            </p>
            <div className={formulaBox}>
              BD = A − B·Σ7 + C·(Σ7)² − D·idade
            </div>
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-zinc-500">Equações usadas nesta calculadora</p>
            <div className={`${formulaBox} mb-3 text-left text-[12px]`}>
              BD<sub className="text-[10px]">masc</sub> = 1,112 − 0,00043499·Σ7 + 0,00000055·(Σ7)² − 0,00028826·idade
            </div>
            <div className={`${formulaBox} text-left text-[12px]`}>
              BD<sub className="text-[10px]">fem</sub> = 1,097 − 0,00046971·Σ7 + 0,00000056·(Σ7)² − 0,00012828·idade
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              A acurácia depende fortemente da técnica de mensuração, padronização dos pontos anatômicos e calibração do adipômetro.
            </p>
          </section>

          <section className="mb-8 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
            <h4 className="mb-2 font-bold text-white">3) Conversão para percentual de gordura (equação de Siri)</h4>
            <p className="mb-3">Após obter BD, a conversão para % de gordura corporal é:</p>
            <div className={formulaBox}>% Gordura = (495 ÷ BD) − 450</div>
            <p className="mt-3 text-xs text-zinc-500">
              A equação de Siri assume um modelo bicompartimental. Em populações específicas (ex.: atletas de elite, idosos, extremos de
              adiposidade), pode haver viés sistemático face a métodos de referência (ex.: DXA).
            </p>
          </section>

          <section className="mb-8 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
            <h4 className="mb-2 font-bold text-white">4) Massa gorda e massa magra (opcional)</h4>
            <p className="mb-3">Se o peso corporal for informado (cadastro ou campo), estimam-se:</p>
            <div className={`${formulaBox} mb-3`}>Massa gorda (kg) = Peso × (% Gordura ÷ 100)</div>
            <div className={formulaBox}>Massa magra (kg) = Peso − Massa gorda</div>
            <p className="mt-3 text-xs text-zinc-500">
              Para acompanhamento, repita medidas em condições semelhantes (horário, hidratação, mesmo avaliador e mesmo compasso).
            </p>
          </section>

          <section className="mb-6 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
            <h4 className="mb-2 font-bold text-white">5) IMC (índice de massa corporal)</h4>
            <p className="mb-2 text-xs text-zinc-500">Complementar — usa peso (kg) e altura (m no cálculo; no app a altura é em cm).</p>
            <div className={formulaBox}>IMC = peso ÷ altura²</div>
          </section>

          <section className="mb-6 border-t border-zinc-800 pt-8">
            <h3 className="mb-2 text-lg font-bold text-[#5eead4]">Interpretação dos resultados</h3>
            <h4 className="mb-3 font-semibold text-white">Percentual de gordura corporal (%GC)</h4>
            <p className="mb-6 text-zinc-400">
              O %GC deve ser interpretado considerando sexo, idade e nível de treinamento. Em avaliações seriadas, valorize a{' '}
              <strong className="text-zinc-200">tendência ao longo do tempo</strong>, pois pequenas variações podem refletir erro de medida e não
              mudanças reais de composição corporal.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-sky-400" /> Homens
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">Referência adultos</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between rounded-lg bg-emerald-950/50 px-3 py-2 text-emerald-200">
                    <span>Atletas</span>
                    <span className="font-black">~6–13%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-sky-950/40 px-3 py-2 text-sky-200">
                    <span>Saudável / adequado</span>
                    <span className="font-black">~14–20%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-red-950/40 px-3 py-2 text-red-200">
                    <span>Elevado</span>
                    <span className="font-black">&gt;25%</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  Em atletas, valores baixos podem ser esperados; avalie sinais clínicos/nutricionais e contexto de performance.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-pink-400" /> Mulheres
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">Referência adultos</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between rounded-lg bg-emerald-950/50 px-3 py-2 text-emerald-200">
                    <span>Atletas</span>
                    <span className="font-black">~14–20%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-sky-950/40 px-3 py-2 text-sky-200">
                    <span>Saudável / adequado</span>
                    <span className="font-black">~21–30%</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-red-950/40 px-3 py-2 text-red-200">
                    <span>Elevado</span>
                    <span className="font-black">&gt;35%</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  Mudanças hormonais, gravidez/puerpério e envelhecimento podem alterar o %GC. Integre com avaliação clínica.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 sm:p-5">
            <h4 className="mb-3 font-semibold text-white">Densidade corporal (BD)</h4>
            <ul className="mb-4 list-inside list-disc space-y-2 text-zinc-400">
              <li>BD mais <strong className="text-zinc-200">baixa</strong> tende a indicar maior proporção de gordura corporal.</li>
              <li>BD mais <strong className="text-zinc-200">alta</strong> tende a indicar maior proporção de massa livre de gordura.</li>
            </ul>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-3 text-xs leading-relaxed text-zinc-400">
              Interprete BD e %GC considerando a qualidade da medida (técnica, avaliador, pontos anatômicos, hidratação). Para decisões clínicas,
              use como suporte e associe a outros indicadores (circunferência da cintura, perfil metabólico, etc.).
            </div>
          </section>
        </div>
        <div className="shrink-0 border-t border-zinc-800 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-800 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export const PhysicalAssessmentTab: React.FC<PhysicalAssessmentProps> = ({
  players,
  assessments,
  onSaveAssessment,
  onDeleteAssessment,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionPlan, setActionPlan] = useState('');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [ageYears, setAgeYears] = useState(25);
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [viewTab, setViewTab] = useState<'form' | 'evolution' | 'ranking'>('form');
  const [interpretationOpen, setInterpretationOpen] = useState(false);
  /** Só preenchido após salvar com sucesso — controla exibição dos cartões de resultado */
  const [lastSavedResults, setLastSavedResults] = useState<LastSavedResults | null>(null);

  const [skinfolds, setSkinfolds] = useState({
    chest: 0,
    axilla: 0,
    subscapular: 0,
    triceps: 0,
    abdominal: 0,
    suprailiac: 0,
    thigh: 0,
  });

  /** Evita que o efeito do atleta limpe o formulário ao hidratar a partir do histórico */
  const loadingFromHistoryRef = useRef(false);

  const loadAssessmentFromHistory = useCallback(
    (a: PhysicalAssessment) => {
      loadingFromHistoryRef.current = true;
      const p = players.find(pl => pl.id === a.playerId);
      const sexVal: 'M' | 'F' = a.sex === 'F' ? 'F' : 'M';
      const ageVal =
        typeof a.ageYears === 'number' && a.ageYears > 0
          ? a.ageYears
          : p && typeof p.age === 'number' && p.age > 0
            ? p.age
            : 25;

      setSelectedPlayerId(a.playerId);
      setAssessmentDate(a.date.length >= 10 ? a.date.slice(0, 10) : a.date);
      setSex(sexVal);
      setAgeYears(ageVal);
      setWeight(typeof a.weight === 'number' && !Number.isNaN(a.weight) ? a.weight : 0);
      setHeight(typeof a.height === 'number' && !Number.isNaN(a.height) ? a.height : 0);
      setSkinfolds({
        chest: a.chest ?? 0,
        axilla: a.axilla ?? 0,
        subscapular: a.subscapular ?? 0,
        triceps: a.triceps ?? 0,
        abdominal: a.abdominal ?? 0,
        suprailiac: a.suprailiac ?? 0,
        thigh: a.thigh ?? 0,
      });
      setActionPlan(a.actionPlan ?? '');
      setLastSavedResults(buildLastSavedFromAssessment(a, sexVal, ageVal));
      setViewTab('form');
      queueMicrotask(() => {
        loadingFromHistoryRef.current = false;
      });
    },
    [players]
  );

  useEffect(() => {
    if (loadingFromHistoryRef.current) return;
    if (!selectedPlayerId) {
      setWeight(0);
      setHeight(0);
      setAgeYears(25);
      setLastSavedResults(null);
      return;
    }
    const p = players.find(pl => pl.id === selectedPlayerId);
    if (!p) return;
    const w = p.weight;
    const h = p.height;
    setWeight(typeof w === 'number' && !Number.isNaN(w) && w > 0 ? w : 0);
    setHeight(typeof h === 'number' && !Number.isNaN(h) && h > 0 ? h : 0);
    setAgeYears(typeof p.age === 'number' && p.age > 0 ? p.age : 25);
    setLastSavedResults(null);
  }, [selectedPlayerId, players]);

  useEffect(() => {
    if (!interpretationOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [interpretationOpen]);

  const clearFormFields = useCallback(() => {
    setSkinfolds({
      chest: 0,
      axilla: 0,
      subscapular: 0,
      triceps: 0,
      abdominal: 0,
      suprailiac: 0,
      thigh: 0,
    });
    setActionPlan('');
    setLastSavedResults(null);
    if (selectedPlayerId) {
      const p = players.find(pl => pl.id === selectedPlayerId);
      if (p) {
        const w = p.weight;
        const h = p.height;
        setWeight(typeof w === 'number' && !Number.isNaN(w) && w > 0 ? w : 0);
        setHeight(typeof h === 'number' && !Number.isNaN(h) && h > 0 ? h : 0);
        setAgeYears(typeof p.age === 'number' && p.age > 0 ? p.age : 25);
      }
    }
  }, [selectedPlayerId, players]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) {
      alert('Selecione um atleta.');
      return;
    }

    const { sum7, bodyDensity, bodyFatPercent } = computeJacksonPollock7(skinfolds, sex, ageYears);
    if (!Number.isFinite(bodyFatPercent) || bodyDensity <= 0) {
      alert('Verifique as dobras e a idade — não foi possível calcular a densidade.');
      return;
    }

    const bf = parseFloat(bodyFatPercent.toFixed(1));
    const imc = weight > 0 && height > 0 ? weight / Math.pow(height / 100, 2) : null;
    let fatMassKg: number | null = null;
    let leanMassKg: number | null = null;
    if (weight > 0) {
      fatMassKg = parseFloat(((weight * bf) / 100).toFixed(1));
      leanMassKg = parseFloat((weight - fatMassKg).toFixed(1));
    }

    const referenceBand = classifyBodyFatReference(bf, sex);

    setLastSavedResults({
      sum7Mm: Math.round(sum7 * 10) / 10,
      bodyDensity: parseFloat(bodyDensity.toFixed(4)),
      bodyFatPercent: bf,
      fatMassKg,
      leanMassKg,
      imc: imc != null ? Math.round(imc * 10) / 10 : null,
      referenceBand,
    });

    const newAssessment: PhysicalAssessment = {
      id: Date.now().toString(),
      playerId: selectedPlayerId,
      date: assessmentDate,
      weight,
      height,
      bodyFat: bf,
      ...skinfolds,
      bodyFatPercent: bf,
      actionPlan,
      muscleMass: leanMassKg ?? 0,
      vo2max: 0,
      flexibility: 0,
      speed: 0,
      strength: 0,
      agility: 0,
      sex,
      ageYears,
    };

    onSaveAssessment(newAssessment);
    setSkinfolds({ chest: 0, axilla: 0, subscapular: 0, triceps: 0, abdominal: 0, suprailiac: 0, thigh: 0 });
    setActionPlan('');
    const pAfter = players.find(pl => pl.id === selectedPlayerId);
    const wR = pAfter?.weight;
    const hR = pAfter?.height;
    setWeight(typeof wR === 'number' && !Number.isNaN(wR) && wR > 0 ? wR : 0);
    setHeight(typeof hR === 'number' && !Number.isNaN(hR) && hR > 0 ? hR : 0);
  };

  const history = [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const evolutionData = useMemo(() => {
    if (!selectedPlayerId) return [];
    return assessments
      .filter(a => a.playerId === selectedPlayerId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        bf: (a as PhysicalAssessment & { bodyFatPercent?: number }).bodyFatPercent ?? a.bodyFat ?? 0,
      }));
  }, [selectedPlayerId, assessments]);

  const teamRanking = useMemo(() => {
    const latestByPlayer: Record<string, PhysicalAssessment> = {};
    assessments.forEach(a => {
      if (!latestByPlayer[a.playerId] || a.date > latestByPlayer[a.playerId].date) {
        latestByPlayer[a.playerId] = a;
      }
    });
    return Object.values(latestByPlayer)
      .map(a => {
        const p = players.find(pl => pl.id === a.playerId);
        const bfVal = (a as PhysicalAssessment & { bodyFatPercent?: number }).bodyFatPercent ?? a.bodyFat ?? 0;
        return { name: p?.nickname || p?.name || 'Desconhecido', bf: bfVal, playerId: a.playerId };
      })
      .sort((a, b) => a.bf - b.bf);
  }, [assessments, players]);

  const ResultCard: React.FC<{
    borderClass: string;
    icon: React.ReactNode;
    iconLabel: string;
    title: string;
    value: string;
    subtitle: string;
  }> = ({ borderClass, icon, iconLabel, title, value, subtitle }) => (
    <div
      className={`relative rounded-2xl border border-zinc-800 bg-zinc-950/80 pl-4 pr-14 py-4 ${borderClass} border-l-4`}
    >
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[10px] font-black text-zinc-400">
        {icon}
        <span className="sr-only">{iconLabel}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-zinc-500">{subtitle}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-black p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-wide text-white">
            <Ruler className="text-[#00f0ff]" /> Avaliação Física
          </h2>
          <p className="mt-1 text-xs font-bold text-zinc-500">
            Jackson & Pollock – 7 dobras · Masculino e feminino
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="rounded-full border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#00f0ff]">
            7 dobras + % gordura (Siri)
          </span>
          <button
            type="button"
            onClick={() => setInterpretationOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[#00f0ff]/50 hover:text-white"
          >
            <Lightbulb className="h-4 w-4 text-[#00f0ff]" />
            Interpretação
          </button>
          {(['form', 'evolution', 'ranking'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setViewTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase transition-colors ${
                viewTab === tab ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'form' ? 'Nova coleta' : tab === 'evolution' ? 'Evolução' : 'Ranking'}
            </button>
          ))}
        </div>
      </div>

      {viewTab === 'evolution' && (
        <div className="rounded-3xl border border-zinc-900 bg-black p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <TrendingDown size={18} className="text-[#00f0ff]" />
            <h3 className="font-bold uppercase text-white">Evolução %BF por atleta</h3>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="ml-auto rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white outline-none"
            >
              <option value="">Selecione um atleta</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nickname || p.name}
                </option>
              ))}
            </select>
          </div>
          {evolutionData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bf"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    dot={{ fill: '#00f0ff', r: 4 }}
                    name="% Gordura"
                  >
                    <LabelList dataKey="bf" position="top" fill="#fff" fontSize={12} fontWeight="bold" formatter={(v: number) => `${v}%`} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              {selectedPlayerId ? 'Nenhuma avaliação para este atleta.' : 'Selecione um atleta para ver a evolução.'}
            </p>
          )}
        </div>
      )}

      {viewTab === 'ranking' && (
        <div className="rounded-3xl border border-zinc-900 bg-black p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <Users size={18} className="text-[#00f0ff]" />
            <h3 className="font-bold uppercase text-white">Ranking %BF da equipe</h3>
          </div>
          {teamRanking.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamRanking} layout="vertical" margin={{ left: 60, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                    formatter={(v: number) => [`${v}%`, '% Gordura']}
                  />
                  <Bar dataKey="bf" fill="#00f0ff" radius={[0, 4, 4, 0]} barSize={20} name="% Gordura">
                    <LabelList dataKey="bf" position="right" fill="#fff" fontSize={12} fontWeight="bold" formatter={(v: number) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">Nenhuma avaliação registrada.</p>
          )}
        </div>
      )}

      {viewTab === 'form' && (
        <>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 shadow-xl md:p-8">
            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wide text-white">Jackson & Pollock – 7 dobras</h3>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-500">
                Insira as dobras em mm. Sítios (7): peito, axilar média, tríceps, subescapular, abdômen, supra-ilíaca e coxa. A equação muda
                conforme o sexo. Peso e altura vêm do cadastro do atleta ao selecioná-lo (aba Elenco), podendo ser ajustados.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {/* Coluna Dados */}
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Dados</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Atleta</label>
                      <select
                        required
                        value={selectedPlayerId}
                        onChange={e => setSelectedPlayerId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 font-bold text-white outline-none focus:border-[#00f0ff]"
                      >
                        <option value="">Selecione...</option>
                        {players.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Data</label>
                      <input
                        required
                        type="date"
                        value={assessmentDate}
                        onChange={e => setAssessmentDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 font-bold text-white outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Sexo</label>
                      <select
                        value={sex}
                        onChange={e => setSex(e.target.value as 'M' | 'F')}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 font-bold text-white outline-none focus:border-[#00f0ff]"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Idade (anos)</label>
                      <input
                        type="number"
                        min={10}
                        max={99}
                        step={1}
                        value={ageYears || ''}
                        onChange={e => setAgeYears(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 text-center font-bold text-white outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {SKINFOLD_KEYS.slice(0, 3).map(({ key, label }) => (
                      <div key={key}>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase text-zinc-400">{label}</label>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={skinfolds[key] || ''}
                          onChange={e => setSkinfolds({ ...skinfolds, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-center font-bold text-white outline-none focus:border-emerald-500/80"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SKINFOLD_KEYS.slice(3).map(({ key, label }) => (
                      <div key={key}>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase text-zinc-400">{label}</label>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={skinfolds[key] || ''}
                          onChange={e => setSkinfolds({ ...skinfolds, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-center font-bold text-white outline-none focus:border-emerald-500/80"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Peso (kg) — opcional</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={weight || ''}
                        onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 text-center font-bold text-white outline-none focus:border-[#00f0ff]"
                        placeholder="kg"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase text-zinc-500">Altura (cm)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={height || ''}
                        onChange={e => setHeight(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3.5 text-center font-bold text-white outline-none focus:border-[#00f0ff]"
                        placeholder="cm"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    % gordura e demais resultados aparecem nos cartões à direita <strong className="text-zinc-400">após salvar</strong> esta
                    coleta. Fórmula de conversão: Siri — (495 ÷ DC) − 450, em que DC é a densidade corporal estimada por Jackson & Pollock.
                  </p>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                      <FileText size={12} /> Plano de ação / orientações
                    </label>
                    <textarea
                      value={actionPlan}
                      onChange={e => setActionPlan(e.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-zinc-800 bg-black p-4 font-medium text-white outline-none focus:border-emerald-500/80"
                      placeholder="Orientações nutricionais, metas de treino..."
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-500"
                    >
                      <Save size={18} /> Salvar avaliação
                    </button>
                    <button
                      type="button"
                      onClick={clearFormFields}
                      className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-sm font-bold uppercase text-zinc-300 transition hover:bg-zinc-800"
                    >
                      <Eraser size={18} /> Limpar
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Dica: faça 2–3 medidas por dobra e use a média para maior consistência.
                  </p>
                </form>
              </div>

              {/* Coluna Resultados — só após salvamento */}
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Resultados</p>
                {!lastSavedResults ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black/40 p-8 text-center">
                    <Calculator className="mb-3 h-10 w-10 text-zinc-600" />
                    <p className="text-sm font-bold text-zinc-500">Preencha os dados e clique em Salvar avaliação</p>
                    <p className="mt-2 max-w-xs text-xs text-zinc-600">
                      Os cartões com soma das dobras, densidade, % gordura (Siri) e massas aparecem aqui após o salvamento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResultCard
                      borderClass="border-l-sky-500"
                      icon={<Sigma className="h-5 w-5 text-sky-400" />}
                      iconLabel="Soma 7 dobras"
                      title="Soma das 7 dobras (mm)"
                      value={lastSavedResults.sum7Mm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      subtitle="Usada na equação Jackson & Pollock (7 sítios)."
                    />
                    <ResultCard
                      borderClass="border-l-emerald-500"
                      icon={<Droplets className="h-5 w-5 text-emerald-400" />}
                      iconLabel="Densidade"
                      title="Densidade corporal (g/cm³)"
                      value={lastSavedResults.bodyDensity.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      subtitle="Estimativa a partir do sexo, idade e soma das dobras."
                    />
                    <ResultCard
                      borderClass="border-l-amber-500"
                      icon={<Percent className="h-5 w-5 text-amber-400" />}
                      iconLabel="Siri"
                      title="% Gordura estimada"
                      value={`${lastSavedResults.bodyFatPercent.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                      subtitle="Convertida pela equação de Siri a partir da densidade."
                    />
                    <ResultCard
                      borderClass="border-l-violet-500"
                      icon={<Scale className="h-5 w-5 text-violet-400" />}
                      iconLabel="Massas"
                      title="Massa gorda / massa magra"
                      value={
                        lastSavedResults.fatMassKg != null && lastSavedResults.leanMassKg != null
                          ? `${lastSavedResults.fatMassKg.toLocaleString('pt-BR')} / ${lastSavedResults.leanMassKg.toLocaleString('pt-BR')} kg`
                          : '—'
                      }
                      subtitle={
                        lastSavedResults.fatMassKg != null
                          ? 'A partir do peso informado e do % de gordura.'
                          : 'Requer peso (kg). Informe o peso para calcular massa gorda e magra.'
                      }
                    />
                    {lastSavedResults.imc != null && (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
                        <span className="text-[10px] font-bold uppercase text-zinc-500">IMC (peso e altura) </span>
                        <span className="ml-2 text-xl font-black text-white">{lastSavedResults.imc.toLocaleString('pt-BR')}</span>
                      </div>
                    )}

                    <div
                      className={`mt-4 rounded-2xl border-2 p-4 ${
                        lastSavedResults.referenceBand === 'ideal'
                          ? 'border-emerald-500 bg-emerald-950/40'
                          : lastSavedResults.referenceBand === 'adequado'
                            ? 'border-amber-400 bg-amber-950/35'
                            : 'border-red-500 bg-red-950/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {lastSavedResults.referenceBand === 'ideal' ? (
                          <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-400" aria-hidden />
                        ) : lastSavedResults.referenceBand === 'adequado' ? (
                          <AlertCircle className="mt-0.5 h-8 w-8 shrink-0 text-amber-400" aria-hidden />
                        ) : (
                          <AlertCircle className="mt-0.5 h-8 w-8 shrink-0 text-red-400" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Resultado esperado (referência)</p>
                          <p
                            className={`mt-1 text-xl font-black uppercase ${
                              lastSavedResults.referenceBand === 'ideal'
                                ? 'text-emerald-300'
                                : lastSavedResults.referenceBand === 'adequado'
                                  ? 'text-amber-300'
                                  : 'text-red-300'
                            }`}
                          >
                            {lastSavedResults.referenceBand === 'ideal'
                              ? 'Ideal'
                              : lastSavedResults.referenceBand === 'adequado'
                                ? 'Adequado'
                                : 'Elevado'}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                            {lastSavedResults.referenceBand === 'ideal' &&
                              (sex === 'M'
                                ? 'Percentual de gordura na faixa Ideal (referência de atletas: ~6–13% para homens), conforme o sexo usado no cálculo.'
                                : 'Percentual de gordura na faixa Ideal (referência de atletas: ~14–20% para mulheres), conforme o sexo usado no cálculo.')}
                            {lastSavedResults.referenceBand === 'adequado' &&
                              (sex === 'M'
                                ? 'Dentro da faixa Adequada (saudável) de referência para homens (~14–20%), ou valor intermediário fora das faixas Ideal/Elevado.'
                                : 'Dentro da faixa Adequada (saudável) de referência para mulheres (~21–30%), ou valor intermediário fora das faixas Ideal/Elevado.')}
                            {lastSavedResults.referenceBand === 'elevado' &&
                              (sex === 'M'
                                ? 'Acima do limite de referência para homens (Elevado: &gt;25%). Considere contexto clínico, nutricional e de treino.'
                                : 'Acima do limite de referência para mulheres (Elevado: &gt;35%). Considere contexto clínico, nutricional e de treino.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6 shadow-xl">
            <h3 className="mb-4 font-bold uppercase text-white">Histórico geral</h3>
            <div className="custom-scrollbar max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {history.length === 0 && <p className="py-10 text-center text-xs text-zinc-600">Nenhuma avaliação registrada.</p>}
              {history.map(assessment => {
                const playerName = players.find(p => p.id === assessment.playerId)?.name || 'Atleta desconhecido';
                const bfVal =
                  typeof assessment.bodyFatPercent === 'number'
                    ? assessment.bodyFatPercent
                    : assessment.bodyFat ?? 0;
                const histSex: 'M' | 'F' = assessment.sex === 'F' ? 'F' : 'M';
                const histBand = classifyBodyFatReference(bfVal, histSex);
                return (
                  <div
                    key={assessment.id}
                    className="group relative rounded-xl border border-zinc-800 bg-black transition-colors hover:border-zinc-600"
                  >
                    {onDeleteAssessment && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm('Excluir esta avaliação? Esta ação não pode ser desfeita.')) {
                            onDeleteAssessment(assessment.id);
                          }
                        }}
                        className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-zinc-600 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                        title="Excluir avaliação"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => loadAssessmentFromHistory(assessment)}
                      className="w-full rounded-xl p-4 pr-12 text-left transition-colors hover:bg-zinc-900/60"
                      title="Abrir medidas, anotações e resultados desta avaliação"
                    >
                      <div className="mb-2 flex flex-col gap-1">
                        <span className="text-sm font-bold text-white">{playerName}</span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-zinc-500">
                            {new Date(assessment.date).toLocaleDateString()}
                          </span>
                          <span className={`shrink-0 text-xl font-black ${bandToBfTextClass(histBand)}`}>
                            {bfVal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            <span className="ml-1 text-[10px] font-bold uppercase text-zinc-500">gordura</span>
                          </span>
                        </div>
                      </div>
                      {assessment.actionPlan ? (
                        <div className="mt-2 border-t border-zinc-900 pt-2">
                          <p className="mb-1 text-[10px] font-bold uppercase text-zinc-500">Plano de ação</p>
                          <p className="line-clamp-3 text-xs text-zinc-300">{assessment.actionPlan}</p>
                        </div>
                      ) : null}
                      <p className="mt-3 text-[10px] font-bold uppercase text-[#00f0ff]/80">
                        Clique para ver medidas, cartões e anotações
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <InterpretationModal open={interpretationOpen} onClose={() => setInterpretationOpen(false)} />
    </div>
  );
};

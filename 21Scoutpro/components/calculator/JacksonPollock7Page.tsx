import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Percent, Scale, Sigma, Droplets } from 'lucide-react';
import { track } from '../../utils/analytics';
import {
  SKINFOLD_KEYS,
  bandLabel,
  classifyBodyFatReference,
  compositionFromWeight,
  computeImc,
  computeJacksonPollock7,
  JP7_PATH,
  type BodyFatReferenceBand,
  type SkinfoldKey,
} from '../../utils/jacksonPollock7';

const SIGNUP_HREF = `/criar-conta?utm_source=calculadora-jp7`;

type Result = {
  sum7: number;
  bodyDensity: number;
  bodyFatPercent: number;
  band: BodyFatReferenceBand;
  fatMassKg: number | null;
  leanMassKg: number | null;
  imc: number | null;
};

function emptyFolds(): Record<SkinfoldKey, string> {
  return {
    chest: '',
    axilla: '',
    triceps: '',
    subscapular: '',
    abdominal: '',
    suprailiac: '',
    thigh: '',
  };
}

function parseMm(raw: string): number | null {
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 80) return null;
  return n;
}

export const JacksonPollock7Page: React.FC = () => {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [folds, setFolds] = useState(emptyFolds);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMsg, setLeadMsg] = useState('');
  const [leadBusy, setLeadBusy] = useState(false);

  useEffect(() => {
    const id = 'scout21-jp7-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Calculadora Jackson & Pollock 7 dobras',
      url: `https://scout21.com.br${JP7_PATH}`,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      description:
        'Calculadora gratuita de densidade corporal e percentual de gordura (Jackson & Pollock 7 dobras + Siri) para comissões técnicas de futsal.',
      publisher: { '@type': 'Organization', name: 'SCOUT21', url: 'https://scout21.com.br/' },
    });
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  const bandTone = useMemo(() => {
    if (!result) return '';
    if (result.band === 'ideal') return 'border-cyan-700/60 bg-cyan-950/30 text-cyan-200';
    if (result.band === 'adequado') return 'border-zinc-700 bg-zinc-900/60 text-zinc-200';
    return 'border-amber-700/50 bg-amber-950/30 text-amber-200';
  }, [result]);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ageN = Number(age);
    if (!Number.isFinite(ageN) || ageN < 10 || ageN > 99) {
      setError('Informe uma idade entre 10 e 99 anos.');
      setResult(null);
      return;
    }
    const skinfolds: Record<string, number> = {};
    for (const { key, label } of SKINFOLD_KEYS) {
      const n = parseMm(folds[key]);
      if (n == null) {
        setError(`Confira a dobra ${label.toLowerCase()}.`);
        setResult(null);
        return;
      }
      skinfolds[key] = n;
    }
    const { sum7, bodyDensity, bodyFatPercent } = computeJacksonPollock7(skinfolds, sex, ageN);
    if (!Number.isFinite(bodyFatPercent) || !(bodyDensity > 0)) {
      setError('Não foi possível calcular. Revise as dobras e a idade.');
      setResult(null);
      return;
    }
    const bf = parseFloat(bodyFatPercent.toFixed(1));
    const w = Number(String(weight).replace(',', '.'));
    const h = Number(String(height).replace(',', '.'));
    const masses = w > 0 ? compositionFromWeight(bf, w) : null;
    const next: Result = {
      sum7: Math.round(sum7 * 10) / 10,
      bodyDensity: parseFloat(bodyDensity.toFixed(4)),
      bodyFatPercent: bf,
      band: classifyBodyFatReference(bf, sex),
      fatMassKg: masses?.fatMassKg ?? null,
      leanMassKg: masses?.leanMassKg ?? null,
      imc: computeImc(w, h),
    };
    setResult(next);
    track('calculator_jp7_calculate', { sex, band: next.band, bf: next.bodyFatPercent });
  };

  const clearForm = () => {
    setFolds(emptyFolds());
    setWeight('');
    setHeight('');
    setResult(null);
    setError('');
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadMsg('');
    setLeadBusy(true);
    try {
      const q = new URLSearchParams(window.location.search);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim() || undefined,
          source: 'calculadora-jp7',
          message: result
            ? `%GC ${result.bodyFatPercent} | Σ7 ${result.sum7} mm | ${bandLabel(result.band)}`
            : undefined,
          utm_source: q.get('utm_source') || 'calculadora-jp7',
          utm_medium: q.get('utm_medium') || 'organic',
          utm_campaign: q.get('utm_campaign') || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setLeadMsg('Recebemos. Enviamos o caminho para gravar isso no elenco.');
        track('calculator_jp7_lead', { where: 'result' });
      } else {
        setLeadMsg('Não foi possível enviar. Tente o teste grátis.');
      }
    } catch {
      setLeadMsg('Não foi possível enviar. Tente o teste grátis.');
    } finally {
      setLeadBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-10 w-auto" />
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/" className="text-zinc-400 hover:text-white">
              Início
            </a>
            <a
              href={SIGNUP_HREF}
              onClick={() => track('calculator_jp7_signup_click', { where: 'header' })}
              className="px-3 py-2 rounded-lg bg-[#00f0ff] text-black font-semibold uppercase text-xs"
            >
              Teste grátis
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-10">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold">
            Ferramenta livre · Fisiologia
          </p>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">
            Calculadora Jackson &amp; Pollock 7 dobras
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Estima densidade corporal e % de gordura (equação de Siri) para a comissão técnica
            de futsal. Mesmo motor da avaliação física do SCOUT21 — aqui sem login, para um atleta.
          </p>
        </div>

        <form onSubmit={calculate} className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs uppercase tracking-wider text-zinc-500">
                Sexo
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'M' | 'F')}
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </label>
              <label className="block text-xs uppercase tracking-wider text-zinc-500">
                Idade (anos)
                <input
                  type="number"
                  min={10}
                  max={99}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-zinc-500">
                Peso kg (opcional)
                <input
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Massa gorda / magra"
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-zinc-500">
                Altura cm (opcional)
                <input
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="IMC"
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </label>
            </div>

            <p className="text-xs text-zinc-500">
              Sete dobras em milímetros. Mesmo lado do corpo, 2–3 medidas, use a média.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SKINFOLD_KEYS.map(({ key, label }) => (
                <label key={key} className="block text-xs uppercase tracking-wider text-zinc-500">
                  {label}
                  <input
                    inputMode="decimal"
                    required
                    value={folds[key]}
                    onChange={(e) => setFolds((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                </label>
              ))}
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-[#00f0ff] text-black font-bold uppercase text-xs tracking-wider"
              >
                Calcular
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider"
              >
                Limpar
              </button>
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-4">
            {result ? (
              <div className={`rounded-2xl border p-5 space-y-4 ${bandTone}`}>
                <p className="text-[11px] uppercase tracking-widest opacity-80">Resultado</p>
                <p className="text-4xl font-black italic">{result.bodyFatPercent.toFixed(1)}%</p>
                <p className="text-sm font-semibold">{bandLabel(result.band)}</p>
                <ul className="text-sm space-y-1.5 text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Sigma size={14} /> Σ7 = {result.sum7} mm
                  </li>
                  <li className="flex items-center gap-2">
                    <Droplets size={14} /> Densidade = {result.bodyDensity.toFixed(4)} g/cm³
                  </li>
                  <li className="flex items-center gap-2">
                    <Percent size={14} /> % gordura (Siri)
                  </li>
                  {result.fatMassKg != null && result.leanMassKg != null ? (
                    <li className="flex items-center gap-2">
                      <Scale size={14} /> Gorda {result.fatMassKg} kg · magra {result.leanMassKg} kg
                    </li>
                  ) : null}
                  {result.imc != null ? (
                    <li className="flex items-center gap-2">
                      <Calculator size={14} /> IMC {result.imc}
                    </li>
                  ) : null}
                </ul>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Estimativa para acompanhamento da comissão. Não é diagnóstico clínico nem
                  autorização de carga, dieta ou retorno a jogo.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-500">
                Preencha as sete dobras e calcule. O resultado aparece aqui, no mesmo protocolo
                usado na avaliação física do elenco.
              </div>
            )}

            <div className="rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/5 p-5 space-y-3">
              <p className="text-sm font-semibold text-white">
                Um atleta é o começo. O elenco é o produto.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No SCOUT21 você grava a dobra no jogador, vê a tendência e cruza com PSE, PSR,
                sono e lesão — prontidão de verdade, não um número solto.
              </p>
              <a
                href={SIGNUP_HREF}
                onClick={() => track('calculator_jp7_signup_click', { where: 'result-card' })}
                className="block text-center px-4 py-3 rounded-xl bg-[#00f0ff] text-black font-bold uppercase text-xs"
              >
                Gravar no elenco · 30 dias grátis
              </a>
            </div>
          </aside>
        </form>

        {result ? (
          <form
            onSubmit={submitLead}
            className="rounded-2xl border border-zinc-800 p-5 md:p-6 grid md:grid-cols-4 gap-3 items-end"
          >
            <p className="md:col-span-4 text-sm text-zinc-300">
              Quer o protocolo de coleta das 7 dobras no elenco? Deixe o contato.
            </p>
            <input
              required
              placeholder="Nome"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              required
              type="email"
              placeholder="E-mail"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="WhatsApp (opcional)"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={leadBusy}
              className="px-4 py-2.5 rounded-xl border border-[#00f0ff]/50 text-[#00f0ff] text-xs uppercase font-bold disabled:opacity-50"
            >
              {leadBusy ? 'Enviando…' : 'Receber protocolo'}
            </button>
            {leadMsg ? <p className="md:col-span-4 text-xs text-zinc-400">{leadMsg}</p> : null}
          </form>
        ) : null}

        <section className="space-y-4 text-sm text-zinc-400 leading-relaxed max-w-3xl">
          <h2 className="text-white text-lg font-bold">O que esta calculadora faz</h2>
          <p>
            Soma as sete dobras, estima a densidade corporal (Jackson &amp; Pollock, sexo e idade) e
            converte para % de gordura pela equação de Siri (495/BD − 450). Com peso, estima massa
            gorda e magra; com altura, o IMC.
          </p>
          <p>
            Homens: faixa de atletas ~6–13%, adequado ~14–20%, elevado &gt;25%. Mulheres: atletas
            ~14–20%, adequado ~21–30%, elevado &gt;35%. Valorize a tendência, não o número isolado.
          </p>
          <p>
            A precisão depende do adipômetro, dos pontos anatômicos e do avaliador. Em atletas de
            elite o viés frente ao DXA pode ser relevante — use como rotina de elenco, não como
            laudo.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
        <a href={JP7_PATH} className="text-zinc-500">
          {typeof window !== 'undefined' ? window.location.origin : 'https://scout21.com.br'}
          {JP7_PATH}
        </a>
        <p className="mt-2">SCOUT21 · estimativa, não diagnóstico</p>
      </footer>
    </div>
  );
};

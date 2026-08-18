import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, ChevronDown, Copy, Percent, Scale, Sigma, Droplets } from 'lucide-react';
import { track } from '../../utils/analytics';
import {
  SKINFOLD_KEYS,
  bandBlurb,
  bandLabel,
  classifyBodyFatReference,
  compositionFromWeight,
  computeImc,
  computeJacksonPollock7,
  JP7_BLOG_PATH,
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

function fieldClass(ok: boolean) {
  return `mt-1 w-full bg-black border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f0ff] ${
    ok ? 'border-zinc-800' : 'border-red-500/60'
  }`;
}

export const JacksonPollock7Page: React.FC = () => {
  const [athleteName, setAthleteName] = useState('');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [folds, setFolds] = useState(emptyFolds);
  const [error, setError] = useState('');
  const [invalidKey, setInvalidKey] = useState<SkinfoldKey | 'age' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMsg, setLeadMsg] = useState('');
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadOk, setLeadOk] = useState(false);

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

  const liveSum = useMemo(() => {
    let sum = 0;
    let filled = 0;
    for (const { key } of SKINFOLD_KEYS) {
      const n = parseMm(folds[key]);
      if (n != null) {
        sum += n;
        filled += 1;
      }
    }
    return { sum: Math.round(sum * 10) / 10, filled };
  }, [folds]);

  const bandTone = useMemo(() => {
    if (!result) return '';
    if (result.band === 'ideal') return 'border-cyan-700/60 bg-cyan-950/30 text-cyan-200';
    if (result.band === 'adequado') return 'border-zinc-700 bg-zinc-900/60 text-zinc-200';
    return 'border-amber-700/50 bg-amber-950/30 text-amber-200';
  }, [result]);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidKey(null);
    const ageN = Number(age);
    if (!Number.isFinite(ageN) || ageN < 10 || ageN > 99) {
      setError('Informe uma idade entre 10 e 99 anos.');
      setInvalidKey('age');
      setResult(null);
      return;
    }
    const skinfolds: Record<string, number> = {};
    for (const { key, label } of SKINFOLD_KEYS) {
      const n = parseMm(folds[key]);
      if (n == null) {
        setError(`Falta a dobra ${label.replace(' (mm)', '').toLowerCase()} (0 a 80 mm).`);
        setInvalidKey(key);
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
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const clearAthlete = () => {
    setAthleteName('');
    setFolds(emptyFolds());
    setWeight('');
    setHeight('');
    setResult(null);
    setError('');
    setInvalidKey(null);
    setCopied(false);
  };

  const copyResult = async () => {
    if (!result) return;
    const who = athleteName.trim() || 'Atleta';
    const lines = [
      `SCOUT21 · Jackson & Pollock 7 dobras`,
      `${who} · ${sex === 'M' ? 'Masculino' : 'Feminino'} · ${age} anos`,
      `% gordura: ${result.bodyFatPercent.toFixed(1)}% (${bandLabel(result.band)})`,
      `Σ7: ${result.sum7} mm · Densidade: ${result.bodyDensity.toFixed(4)} g/cm³`,
    ];
    if (result.fatMassKg != null && result.leanMassKg != null) {
      lines.push(`Massa gorda ${result.fatMassKg} kg · magra ${result.leanMassKg} kg`);
    }
    if (result.imc != null) lines.push(`IMC ${result.imc}`);
    lines.push('Estimativa para a comissão. Não é diagnóstico.');
    lines.push(`https://scout21.com.br${JP7_PATH}`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      track('calculator_jp7_copy', { band: result.band });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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
        setLeadOk(true);
        setLeadMsg('Recebemos o contato. O histórico no elenco fica no teste grátis — 30 dias, sem cartão.');
        track('calculator_jp7_lead', { where: 'result' });
      } else {
        setLeadMsg('Não foi possível enviar. Use o teste grátis abaixo.');
      }
    } catch {
      setLeadMsg('Não foi possível enviar. Use o teste grátis abaixo.');
    } finally {
      setLeadBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3" aria-label="SCOUT21 — início">
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-10 w-auto" />
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="hidden sm:inline text-zinc-400 hover:text-white">
              Início
            </a>
            <a href={JP7_BLOG_PATH} className="text-zinc-400 hover:text-white">
              Como usar
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
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold">
            Ferramenta livre · Fisiologia
          </p>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">
            Calculadora Jackson &amp; Pollock 7 dobras
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Um atleta, agora, sem login. Mesmo motor da avaliação física do SCOUT21: Σ7, densidade e %
            de gordura (Siri). O elenco, a tendência e o cruzamento com carga ficam no produto.
          </p>
          <ol className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <li className="rounded-full border border-zinc-800 px-3 py-1">1. Sexo e idade</li>
            <li className="rounded-full border border-zinc-800 px-3 py-1">2. Sete dobras (mm)</li>
            <li className="rounded-full border border-zinc-800 px-3 py-1">3. Resultado e próximo passo</li>
          </ol>
        </div>

        <form onSubmit={calculate} className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs text-zinc-400">
                Nome do atleta <span className="text-zinc-600">(só nesta tela)</span>
                <input
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="Para o recorte / WhatsApp da comissão"
                  maxLength={80}
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f0ff]"
                />
              </label>
              <fieldset className="block text-xs text-zinc-400">
                <legend className="mb-1">Sexo biológico da equação</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['M', 'Masculino'],
                      ['F', 'Feminino'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSex(value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                        sex === value
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                          : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-xs text-zinc-400">
                Idade (anos)
                <input
                  type="number"
                  min={10}
                  max={99}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={fieldClass(invalidKey !== 'age')}
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Peso (kg) <span className="text-zinc-600">opcional · massa gorda/magra</span>
                <input
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex.: 74,5"
                  className="mt-1 w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f0ff]"
                />
              </label>
              <label className="block text-xs text-zinc-400 sm:col-span-2">
                Altura (cm) <span className="text-zinc-600">opcional · IMC</span>
                <input
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex.: 178"
                  className="mt-1 w-full max-w-xs bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f0ff]"
                />
              </label>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs text-zinc-500">
                Sete dobras em mm. Mesmo lado do corpo, adipômetro calibrado, média de 2–3 medidas.
              </p>
              <p className="shrink-0 text-xs text-zinc-500 tabular-nums">
                Σ7 {liveSum.filled === 7 ? liveSum.sum : '—'} mm
                {liveSum.filled > 0 && liveSum.filled < 7 ? ` · ${liveSum.filled}/7` : ''}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SKINFOLD_KEYS.map(({ key, label, hint }) => (
                <label key={key} className="block text-xs text-zinc-400">
                  {label}
                  <input
                    inputMode="decimal"
                    required
                    value={folds[key]}
                    onChange={(e) => setFolds((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="mm"
                    className={fieldClass(invalidKey !== key)}
                    aria-describedby={`hint-${key}`}
                  />
                  <span id={`hint-${key}`} className="mt-1 block text-[11px] normal-case tracking-normal text-zinc-600">
                    {hint}
                  </span>
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
                onClick={clearAthlete}
                className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider"
              >
                Outro atleta
              </button>
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-6 self-start">
            <div ref={resultRef} id="resultado" className="scroll-mt-6">
              {result ? (
                <div className={`rounded-2xl border p-5 space-y-4 ${bandTone}`}>
                  {athleteName.trim() ? (
                    <p className="text-[11px] uppercase tracking-widest opacity-80">{athleteName.trim()}</p>
                  ) : (
                    <p className="text-[11px] uppercase tracking-widest opacity-80">Resultado</p>
                  )}
                  <p className="text-4xl font-black italic">{result.bodyFatPercent.toFixed(1)}%</p>
                  <p className="text-sm font-semibold">{bandLabel(result.band)}</p>
                  <p className="text-xs leading-relaxed text-zinc-400">{bandBlurb(result.band)}</p>
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
                    ) : (
                      <li className="text-zinc-500 text-xs">Informe o peso para estimar massa gorda e magra.</li>
                    )}
                    {result.imc != null ? (
                      <li className="flex items-center gap-2">
                        <Calculator size={14} /> IMC {result.imc}
                      </li>
                    ) : null}
                  </ul>
                  <button
                    type="button"
                    onClick={copyResult}
                    className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white"
                  >
                    <Copy size={14} /> {copied ? 'Copiado' : 'Copiar para a comissão'}
                  </button>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Estimativa para acompanhamento. Não é diagnóstico clínico nem autorização de carga,
                    dieta ou retorno a jogo.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-500">
                  Preencha as sete dobras e calcule. O resultado aparece aqui — no celular a tela desce
                  até ele.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/5 p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Um atleta é o começo. O elenco é o produto.</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No SCOUT21 a dobra fica no jogador, com data. Você vê a tendência e cruza com PSE, PSR,
                sono e lesão. Prontidão de verdade, não um print.
              </p>
              <a
                href={SIGNUP_HREF}
                onClick={() => track('calculator_jp7_signup_click', { where: 'result-card' })}
                className="block text-center px-4 py-3 rounded-xl bg-[#00f0ff] text-black font-bold uppercase text-xs"
              >
                Gravar no elenco · 30 dias grátis
              </a>
            </div>

            {result ? (
              <form onSubmit={submitLead} className="rounded-2xl border border-zinc-800 p-5 space-y-3">
                <p className="text-sm text-zinc-300">Quer que a gente te chame para implantar no elenco?</p>
                <input
                  required
                  placeholder="Nome"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="E-mail"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  placeholder="WhatsApp (opcional)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={leadBusy || leadOk}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#00f0ff]/50 text-[#00f0ff] text-xs uppercase font-bold disabled:opacity-50"
                >
                  {leadBusy ? 'Enviando…' : leadOk ? 'Contato enviado' : 'Quero o histórico no elenco'}
                </button>
                {leadMsg ? <p className="text-xs text-zinc-400">{leadMsg}</p> : null}
              </form>
            ) : null}
          </aside>
        </form>

        <section className="rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setGuideOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            aria-expanded={guideOpen}
          >
            <span className="text-sm font-semibold text-white">Como coletar as 7 dobras</span>
            <ChevronDown size={18} className={`text-zinc-500 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
          </button>
          {guideOpen ? (
            <div className="px-5 pb-5 space-y-3 text-sm text-zinc-400 leading-relaxed">
              <p>
                Use adipômetro calibrado, o mesmo lado do corpo em todas as medidas, pele seca, atleta em pé.
                Três tentativas por sítio; anote a média. Não calcule com valor “chutado”.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                {SKINFOLD_KEYS.map(({ key, label, hint }) => (
                  <li key={key}>
                    <span className="text-zinc-200">{label.replace(' (mm)', '')}:</span> {hint}
                  </li>
                ))}
              </ul>
              <p>
                Leia o protocolo com calma no{' '}
                <a href={JP7_BLOG_PATH} className="text-[#00f0ff] hover:underline">
                  artigo do blog
                </a>
                .
              </p>
            </div>
          ) : null}
        </section>

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

      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600 space-y-2">
        <p>
          <a href={JP7_BLOG_PATH} className="text-zinc-400 hover:text-white">
            Jackson &amp; Pollock no futsal
          </a>
          {' · '}
          <a href={SIGNUP_HREF} className="text-zinc-400 hover:text-white">
            Teste grátis
          </a>
        </p>
        <p>SCOUT21 · estimativa, não diagnóstico</p>
      </footer>
    </div>
  );
};

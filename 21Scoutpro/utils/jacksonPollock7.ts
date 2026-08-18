/** Jackson & Pollock 7 dobras + conversão Siri. Uma fórmula para o app logado e a calculadora pública. */

export type BodyFatReferenceBand = 'ideal' | 'adequado' | 'elevado';

export type SkinfoldKey =
  | 'chest'
  | 'axilla'
  | 'triceps'
  | 'subscapular'
  | 'abdominal'
  | 'suprailiac'
  | 'thigh';

export const SKINFOLD_KEYS: { key: SkinfoldKey; label: string; hint: string }[] = [
  { key: 'chest', label: 'Peito (mm)', hint: 'Diagonal, entre axila e mamilo (homens); acima da mama (mulheres).' },
  { key: 'axilla', label: 'Axilar média (mm)', hint: 'Vertical, na linha axilar média, altura do xifoide.' },
  { key: 'triceps', label: 'Tríceps (mm)', hint: 'Vertical, face posterior do braço, meio acrômio–olécrano.' },
  { key: 'subscapular', label: 'Subescapular (mm)', hint: 'Diagonal, 1–2 cm abaixo do ângulo inferior da escápula.' },
  { key: 'abdominal', label: 'Abdômen (mm)', hint: 'Vertical, 2 cm à direita da cicatriz umbilical.' },
  { key: 'suprailiac', label: 'Supra-ilíaca (mm)', hint: 'Diagonal, imediatamente acima da crista ilíaca.' },
  { key: 'thigh', label: 'Coxa (mm)', hint: 'Vertical, face anterior, meio da distância virilha–patela.' },
];

/**
 * Homens: Ideal 6–13%, Adequado 14–20%, Elevado >25%.
 * Mulheres: Ideal 14–20%, Adequado 21–30%, Elevado >35%.
 * Intervalos entre faixas classificam como Adequado até o limite de Elevado.
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

export function bandLabel(band: BodyFatReferenceBand): string {
  if (band === 'ideal') return 'Faixa de atletas';
  if (band === 'adequado') return 'Adequado';
  return 'Elevado';
}

/** Texto para a comissão — não é laudo nem autorização de carga. */
export function bandBlurb(band: BodyFatReferenceBand): string {
  if (band === 'ideal') {
    return 'Na faixa típica de atletas desta calculadora. O número só vira decisão quando entra no histórico do jogador e cruza com PSE, sono e lesão.';
  }
  if (band === 'adequado') {
    return 'Dentro do aceitável para acompanhamento. Não autorize carga, dieta ou retorno a jogo só com este valor — olhe a tendência e a prontidão.';
  }
  return 'Acima da faixa de referência usada aqui. Não é diagnóstico. Repita a coleta com o mesmo avaliador e grave no elenco antes de mudar o plano.';
}

export function computeJacksonPollock7(
  skinfolds: Record<string, number>,
  sex: 'M' | 'F',
  age: number
): { sum7: number; bodyDensity: number; bodyFatPercent: number } {
  const sum7 = SKINFOLD_KEYS.reduce((acc, { key }) => acc + (skinfolds[key] || 0), 0);
  const bodyDensity =
    sex === 'F'
      ? 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 * sum7 - 0.00012828 * age
      : 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 * sum7 - 0.00028826 * age;
  const bodyFatPercent = 495 / bodyDensity - 450;
  return {
    sum7,
    bodyDensity,
    bodyFatPercent: Number.isFinite(bodyFatPercent) ? bodyFatPercent : NaN,
  };
}

export function compositionFromWeight(
  bodyFatPercent: number,
  weightKg: number
): { fatMassKg: number; leanMassKg: number } {
  const fatMassKg = (weightKg * bodyFatPercent) / 100;
  return {
    fatMassKg: parseFloat(fatMassKg.toFixed(1)),
    leanMassKg: parseFloat((weightKg - fatMassKg).toFixed(1)),
  };
}

export function computeImc(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

export const JP7_PATH = '/calculadoras/jackson-pollock-7-dobras';
export const JP7_BLOG_PATH = '/blog/jackson-pollock-7-dobras-no-futsal';

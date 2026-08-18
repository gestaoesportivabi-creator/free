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

export const SKINFOLD_KEYS: { key: SkinfoldKey; label: string }[] = [
  { key: 'chest', label: 'Peito (mm)' },
  { key: 'axilla', label: 'Axilar média (mm)' },
  { key: 'triceps', label: 'Tríceps (mm)' },
  { key: 'subscapular', label: 'Subescapular (mm)' },
  { key: 'abdominal', label: 'Abdômen (mm)' },
  { key: 'suprailiac', label: 'Supra-ilíaca (mm)' },
  { key: 'thigh', label: 'Coxa (mm)' },
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

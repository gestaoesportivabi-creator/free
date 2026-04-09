import { WELLNESS_IDEAL_VALUES, type WellnessDimensionKey } from '../components/WellnessTab';

export type WellnessRadarRow = { key: WellnessDimensionKey; avg: number | null };

/**
 * 1 = coincide com o modelo ideal em todos os eixos com dados; 0 = pior desvio possível (média).
 */
export function wellnessClosenessScore(rows: WellnessRadarRow[]): number | null {
  const parts: number[] = [];
  rows.forEach(r => {
    if (r.avg == null) return;
    const ideal = WELLNESS_IDEAL_VALUES[r.key];
    const diff = Math.abs(r.avg - ideal);
    const maxDiff = 4;
    const axisScore = 1 - Math.min(1, diff / maxDiff);
    parts.push(axisScore);
  });
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

/** Cor do radar “real”: vermelho → laranja → amarelo → verde conforme a proximidade ao ideal. */
export function wellnessRealRadarColors(meanScore: number): { stroke: string; fill: string; dot: string } {
  const t = Math.max(0, Math.min(1, meanScore));
  const hue = Math.round(t * 118);
  return {
    stroke: `hsl(${hue}, 82%, 54%)`,
    fill: `hsla(${hue}, 72%, 48%, 0.22)`,
    dot: `hsl(${hue}, 82%, 54%)`,
  };
}

/** RGB 0–255 para jsPDF (interpolado no matiz HSL). */
export function wellnessClosenessRgb(meanScore: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, meanScore));
  const h = t * 118;
  const s = 0.82;
  const l = 0.52;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else {
    g = x;
    b = c;
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

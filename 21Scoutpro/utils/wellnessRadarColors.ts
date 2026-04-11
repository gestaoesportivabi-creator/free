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

const HUE_MAX = 125;

/**
 * Curva de cor: quanto mais longe do ideal (meanScore baixo), mais avermelhado.
 * Expoente > 1 puxa o gráfico para vermelho/laranja mais cedo que uma escala linear.
 */
function closenessToHueSatLight(meanScore: number): { hue: number; s: number; l: number } {
  const c = Math.max(0, Math.min(1, meanScore));
  const curved = Math.pow(c, 1.85);
  const hue = curved * HUE_MAX;
  const s = 72 + (1 - c) * 24;
  const l = 48 + c * 10;
  return { hue, s, l };
}

/** Cor do radar “real”: vermelho → laranja → amarelo → verde conforme a proximidade ao bem-estar ideal. */
export function wellnessRealRadarColors(meanScore: number): { stroke: string; fill: string; dot: string } {
  const { hue, s, l } = closenessToHueSatLight(meanScore);
  const hi = Math.round(hue);
  const si = Math.round(s);
  const li = Math.round(l);
  return {
    stroke: `hsl(${hi}, ${si}%, ${li}%)`,
    fill: `hsla(${hi}, ${Math.round(si * 0.92)}%, ${Math.max(38, li - 6)}%, 0.26)`,
    dot: `hsl(${hi}, ${si}%, ${li}%)`,
  };
}

function hslToRgb(h: number, sPct: number, lPct: number): [number, number, number] {
  const s = sPct / 100;
  const l = lPct / 100;
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

/** RGB 0–255 para jsPDF (mesma lógica que o radar na tela). */
export function wellnessClosenessRgb(meanScore: number): [number, number, number] {
  const { hue, s, l } = closenessToHueSatLight(meanScore);
  return hslToRgb(hue, s, l);
}

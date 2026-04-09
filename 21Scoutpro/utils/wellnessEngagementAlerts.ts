import { WELLNESS_IDEAL_VALUES, type WellnessDimensionKey } from '../components/WellnessTab';

export type WellnessEngagementAlertSeverity = 'critical' | 'warning' | 'info';

export interface WellnessEngagementAlert {
  key: WellnessDimensionKey;
  severity: WellnessEngagementAlertSeverity;
  message: string;
}

const LOWER_IS_BETTER: Partial<Record<WellnessDimensionKey, true>> = {
  stress: true,
  dor: true,
};

/** Só alerta quando o desvio prejudica o engajamento vs meta (fora da tolerância). */
export function buildWellnessEngagementAlerts(
  rows: { key: WellnessDimensionKey; subject: string; avg: number | null }[]
): WellnessEngagementAlert[] {
  const TOL = 0.35;
  const out: WellnessEngagementAlert[] = [];

  rows.forEach(r => {
    if (r.avg == null) return;
    const ideal = WELLNESS_IDEAL_VALUES[r.key];
    const diff = r.avg - ideal;
    const absDiff = Math.abs(diff);
    if (absDiff < TOL) return;

    const lowerBetter = !!LOWER_IS_BETTER[r.key];
    const worse = lowerBetter ? diff > 0 : diff < 0;
    if (!worse) return;

    let severity: WellnessEngagementAlertSeverity = 'info';
    if (absDiff >= 1.5) severity = 'critical';
    else if (absDiff >= 0.85) severity = 'warning';

    let message: string;
    if (lowerBetter) {
      message = `${r.subject}: Ø ${r.avg} (meta ${ideal}). Acima do engajamento ideal — indicador negativo na escala.`;
    } else {
      message = `${r.subject}: Ø ${r.avg} (meta ${ideal}). Abaixo do engajamento ideal da equipe.`;
    }
    out.push({ key: r.key, severity, message });
  });

  const order: Record<WellnessEngagementAlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  out.sort((a, b) => order[a.severity] - order[b.severity]);
  return out;
}

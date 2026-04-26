export interface IndiceFisicoDetalhes {
  dor: number;
  pse: number;
  psr: number;
  sono: number;
}

export interface IndiceFisicoResultado {
  indice: number;
  status: 'Apto' | 'Atenção' | 'Risco Moderado' | 'Alto Risco';
  detalhes: IndiceFisicoDetalhes;
}

export interface IndiceFisicoErro {
  error: string;
}

const isInRange = (value: number, min: number, max: number): boolean =>
  Number.isFinite(value) && value >= min && value <= max;

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function calcularIndiceFisico(
  dorMuscular: number,
  pse: number,
  psr: number,
  sono: number
): IndiceFisicoResultado | IndiceFisicoErro {
  if (!isInRange(dorMuscular, 1, 5)) {
    return { error: 'Valor inválido para dorMuscular. Informe um número entre 1 e 5.' };
  }
  if (!isInRange(pse, 1, 10)) {
    return { error: 'Valor inválido para pse. Informe um número entre 1 e 10.' };
  }
  if (!isInRange(psr, 1, 10)) {
    return { error: 'Valor inválido para psr. Informe um número entre 1 e 10.' };
  }
  if (!isInRange(sono, 1, 5)) {
    return { error: 'Valor inválido para sono. Informe um número entre 1 e 5.' };
  }

  const dorNormalizada = ((5 - dorMuscular) / 4) * 100;
  const pseNormalizado = ((10 - pse) / 9) * 100;
  const psrNormalizado = ((psr - 1) / 9) * 100;
  const sonoNormalizado = ((sono - 1) / 4) * 100;

  const indiceBruto =
    pseNormalizado * 0.35 +
    psrNormalizado * 0.25 +
    sonoNormalizado * 0.25 +
    dorNormalizada * 0.15;

  const indice = Math.round(indiceBruto);
  let status: IndiceFisicoResultado['status'] = 'Alto Risco';
  if (indice >= 85) status = 'Apto';
  else if (indice >= 70) status = 'Atenção';
  else if (indice >= 50) status = 'Risco Moderado';

  return {
    indice,
    status,
    detalhes: {
      dor: round1(dorNormalizada),
      pse: round1(pseNormalizado),
      psr: round1(psrNormalizado),
      sono: round1(sonoNormalizado),
    },
  };
}

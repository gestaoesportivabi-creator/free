/**
 * Mapa de finalizações.
 *
 * A quadra desenhada põe o ataque para cima. No 1º tempo atacamos para cima.
 * No intervalo o lado inverte sozinho: no 2º tempo atacamos para baixo, e o
 * lance é espelhado para cair na metade de ataque do desenho.
 *
 * Cada metade vira quatro zonas (esquerda/direita × fundo/meio).
 * Lance sem `shotOriginZone` não entra. Não há campo novo no banco.
 */

import {
  COURT,
  courtZoneAt,
  readShotOriginZone,
  type ShotHeatSource,
  type ShotOriginZone,
} from './shotCourtZones';

export type AttackEnd = 'cima' | 'baixo';
export type MatchPeriod = '1T' | '2T';
export type FinalizationSide = 'ours' | 'conceded';
export type HeatRampStep = 0 | 1 | 2 | 3 | 4;

export const HEAT_CELLS = [
  { id: 'AT_L_NEAR', label: 'Ataque, esquerda, fundo', x: 0, y: 0, w: 100, h: 100 },
  { id: 'AT_R_NEAR', label: 'Ataque, direita, fundo', x: 100, y: 0, w: 100, h: 100 },
  { id: 'AT_L_MID', label: 'Ataque, esquerda, meio', x: 0, y: 100, w: 100, h: 100 },
  { id: 'AT_R_MID', label: 'Ataque, direita, meio', x: 100, y: 100, w: 100, h: 100 },
  { id: 'DF_L_MID', label: 'Defesa, esquerda, meio', x: 0, y: 200, w: 100, h: 100 },
  { id: 'DF_R_MID', label: 'Defesa, direita, meio', x: 100, y: 200, w: 100, h: 100 },
  { id: 'DF_L_NEAR', label: 'Defesa, esquerda, fundo', x: 0, y: 300, w: 100, h: 100 },
  { id: 'DF_R_NEAR', label: 'Defesa, direita, fundo', x: 100, y: 300, w: 100, h: 100 },
] as const;

export type HeatCellId = (typeof HEAT_CELLS)[number]['id'];

export type HeatCellCount = Record<HeatCellId, number>;

const MIRROR: Record<ShotOriginZone, ShotOriginZone> = {
  AREA_ADV: 'AREA_DEF',
  AREA_DEF: 'AREA_ADV',
  ENTRE_ADV: 'ENTRE_DEF',
  ENTRE_DEF: 'ENTRE_ADV',
  LAT_AT_ESQ: 'LAT_DF_ESQ',
  LAT_DF_ESQ: 'LAT_AT_ESQ',
  LAT_AT_DIR: 'LAT_DF_DIR',
  LAT_DF_DIR: 'LAT_AT_DIR',
  FAIXA_AT: 'FAIXA_DF',
  FAIXA_DF: 'FAIXA_AT',
  CENTRO: 'CENTRO',
};

export const HEAT_RAMP = [
  { step: 1, label: 'Poucas', fill: '#22c55e' },
  { step: 2, label: 'Médias', fill: '#eab308' },
  { step: 3, label: 'Altas', fill: '#f97316' },
  { step: 4, label: 'Muitas', fill: '#ef4444' },
] as const;

/** 1º tempo ataca para cima. O 2º tempo é o lado oposto, sem escolha manual. */
export function attackEndForPeriod(period: MatchPeriod, firstHalf: AttackEnd = 'cima'): AttackEnd {
  if (period === '1T') return firstHalf;
  return firstHalf === 'cima' ? 'baixo' : 'cima';
}

export function heatCellAt(x: number, y: number): HeatCellId | null {
  if (x < 0 || y < 0 || x > COURT.width || y > COURT.length) return null;
  const left = x < 100;
  if (y < 100) return left ? 'AT_L_NEAR' : 'AT_R_NEAR';
  if (y < 200) return left ? 'AT_L_MID' : 'AT_R_MID';
  if (y < 300) return left ? 'DF_L_MID' : 'DF_R_MID';
  return left ? 'DF_L_NEAR' : 'DF_R_NEAR';
}

function majorityCell(zone: ShotOriginZone): HeatCellId {
  const totals = new Map<HeatCellId, number>();
  for (let y = 2; y < COURT.length; y += 4) {
    for (let x = 2; x < COURT.width; x += 4) {
      if (courtZoneAt(x, y) !== zone) continue;
      const cell = heatCellAt(x, y);
      if (!cell) continue;
      totals.set(cell, (totals.get(cell) ?? 0) + 1);
    }
  }
  let best: HeatCellId = 'AT_L_NEAR';
  let bestCount = -1;
  for (const cell of HEAT_CELLS) {
    const count = totals.get(cell.id) ?? 0;
    if (count > bestCount) {
      best = cell.id;
      bestCount = count;
    }
  }
  return best;
}

export const ORIGIN_TO_HEAT_CELL: Record<ShotOriginZone, HeatCellId> = {
  AREA_ADV: majorityCell('AREA_ADV'),
  ENTRE_ADV: majorityCell('ENTRE_ADV'),
  LAT_AT_ESQ: majorityCell('LAT_AT_ESQ'),
  LAT_AT_DIR: majorityCell('LAT_AT_DIR'),
  FAIXA_AT: majorityCell('FAIXA_AT'),
  CENTRO: majorityCell('CENTRO'),
  FAIXA_DF: majorityCell('FAIXA_DF'),
  LAT_DF_ESQ: majorityCell('LAT_DF_ESQ'),
  LAT_DF_DIR: majorityCell('LAT_DF_DIR'),
  ENTRE_DEF: majorityCell('ENTRE_DEF'),
  AREA_DEF: majorityCell('AREA_DEF'),
};

export function heatCellForOrigin(zone: ShotOriginZone): HeatCellId {
  return ORIGIN_TO_HEAT_CELL[zone];
}

export function orientZoneToAttack(zone: ShotOriginZone, period: ShotHeatSource['period']): ShotOriginZone {
  const half: MatchPeriod = period === '2T' ? '2T' : '1T';
  return attackEndForPeriod(half) === 'baixo' ? MIRROR[zone] : zone;
}

function isOurShot(event: ShotHeatSource): boolean {
  if (event.type === 'shot') return true;
  if (event.type) return false;
  return event.action === 'shotOn' || event.action === 'shotOff' || event.action === 'shotZonaChute';
}

function isConcededShot(event: ShotHeatSource): boolean {
  if (event.type === 'save') return true;
  if (event.type) return false;
  return event.action === 'save';
}

export function emptyHeatCellCount(): HeatCellCount {
  const heat = {} as HeatCellCount;
  for (const cell of HEAT_CELLS) heat[cell.id] = 0;
  return heat;
}

export function aggregateFinalizationHeat(
  events: readonly ShotHeatSource[] | null | undefined,
  side: FinalizationSide,
): HeatCellCount {
  const heat = emptyHeatCellCount();
  if (!events) return heat;
  for (const event of events) {
    const raw = readShotOriginZone(event.shotOriginZone);
    if (!raw) continue;
    const matches = side === 'ours' ? isOurShot(event) : isConcededShot(event);
    if (!matches) continue;
    const oriented = orientZoneToAttack(raw, event.period);
    heat[heatCellForOrigin(oriented)] += 1;
  }
  return heat;
}

export function heatCellTotal(heat: HeatCellCount): number {
  return HEAT_CELLS.reduce((sum, cell) => sum + heat[cell.id], 0);
}

export function heatCellMax(heat: HeatCellCount): number {
  return HEAT_CELLS.reduce((max, cell) => Math.max(max, heat[cell.id]), 0);
}

/** 0 vazio, 1 verde, 2 amarelo, 3 laranja, 4 vermelho. */
export function heatRampStep(count: number, max: number): HeatRampStep {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function heatRampFill(step: HeatRampStep): string {
  if (step === 0) return 'transparent';
  return HEAT_RAMP[step - 1].fill;
}

export function heatRampInk(step: HeatRampStep): string {
  if (step === 2 || step === 3) return '#1a1206';
  return '#f8fafc';
}

export type DensityPoint = { x: number; y: number; n: number };

const ANCHORS: Record<ShotOriginZone, { x: number; y: number }> = {
  AREA_ADV: { x: 100, y: 36 },
  ENTRE_ADV: { x: 100, y: 78 },
  LAT_AT_ESQ: { x: 24, y: 110 },
  LAT_AT_DIR: { x: 176, y: 110 },
  FAIXA_AT: { x: 100, y: 150 },
  CENTRO: { x: 100, y: 188 },
  FAIXA_DF: { x: 100, y: 250 },
  LAT_DF_ESQ: { x: 24, y: 290 },
  LAT_DF_DIR: { x: 176, y: 290 },
  ENTRE_DEF: { x: 100, y: 322 },
  AREA_DEF: { x: 100, y: 364 },
};

/** Pontos para o mapa contínuo, já no sentido do ataque (cima). */
export function finalizationDensity(
  events: readonly ShotHeatSource[] | null | undefined,
  side: FinalizationSide,
): DensityPoint[] {
  const buckets = new Map<string, DensityPoint>();
  if (!events) return [];
  for (const event of events) {
    const raw = readShotOriginZone(event.shotOriginZone);
    if (!raw) continue;
    const matches = side === 'ours' ? isOurShot(event) : isConcededShot(event);
    if (!matches) continue;
    const oriented = orientZoneToAttack(raw, event.period);
    const anchor = ANCHORS[oriented];
    const key = `${anchor.x}:${anchor.y}`;
    const current = buckets.get(key) ?? { x: anchor.x, y: anchor.y, n: 0 };
    current.n += 1;
    buckets.set(key, current);
  }
  return [...buckets.values()];
}

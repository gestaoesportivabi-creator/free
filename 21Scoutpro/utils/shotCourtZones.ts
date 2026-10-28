/**
 * Quadra de futsal em 8 zonas para a origem do chute.
 *
 * Olhando do nosso gol para o gol adversário (embaixo → cima na tela):
 * quatro faixas no comprimento × esquerda/direita.
 *
 * O campo `zone` do lance continua sendo lateral/escanteio
 * (AT_ESQ, AT_DIR, DF_ESQ, DF_DIR). A origem do chute é `shotOriginZone`.
 */

export const SHOT_ORIGIN_ZONES = [
  { id: 'AT2_ESQ', short: 'Final E', label: 'Ataque final, esquerda', row: 0, col: 0 },
  { id: 'AT2_DIR', short: 'Final D', label: 'Ataque final, direita', row: 0, col: 1 },
  { id: 'AT1_ESQ', short: 'Meio E', label: 'Ataque meio, esquerda', row: 1, col: 0 },
  { id: 'AT1_DIR', short: 'Meio D', label: 'Ataque meio, direita', row: 1, col: 1 },
  { id: 'DF2_ESQ', short: 'Saída E', label: 'Defesa saída, esquerda', row: 2, col: 0 },
  { id: 'DF2_DIR', short: 'Saída D', label: 'Defesa saída, direita', row: 2, col: 1 },
  { id: 'DF1_ESQ', short: 'Fundo E', label: 'Defesa fundo, esquerda', row: 3, col: 0 },
  { id: 'DF1_DIR', short: 'Fundo D', label: 'Defesa fundo, direita', row: 3, col: 1 },
] as const;

export type ShotOriginZone = (typeof SHOT_ORIGIN_ZONES)[number]['id'];

const ZONE_IDS = new Set<string>(SHOT_ORIGIN_ZONES.map((zone) => zone.id));

export type ShotZoneCount = { ours: number; conceded: number };

export type ShotZoneHeat = Record<ShotOriginZone, ShotZoneCount>;

/** Lance mínimo para o mapa. Aceita o evento da coleta (`type`) ou o pós-jogo (`action`). */
export type ShotHeatSource = {
  type?: string;
  action?: string;
  shotOriginZone?: unknown;
};

export function isShotOriginZone(value: unknown): value is ShotOriginZone {
  return typeof value === 'string' && ZONE_IDS.has(value);
}

export function readShotOriginZone(value: unknown): ShotOriginZone | undefined {
  return isShotOriginZone(value) ? value : undefined;
}

export function shotOriginZoneById(id: ShotOriginZone): (typeof SHOT_ORIGIN_ZONES)[number] {
  const zone = SHOT_ORIGIN_ZONES.find((item) => item.id === id);
  if (!zone) {
    throw new Error(`Zona de chute desconhecida: ${id}`);
  }
  return zone;
}

export function shotOriginZoneLabel(id: ShotOriginZone): string {
  return shotOriginZoneById(id).short;
}

export function emptyShotZoneHeat(): ShotZoneHeat {
  const heat = {} as ShotZoneHeat;
  for (const zone of SHOT_ORIGIN_ZONES) {
    heat[zone.id] = { ours: 0, conceded: 0 };
  }
  return heat;
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

/**
 * Conta chutes nossos (finalização) e sofridos (chute do adversário, gravado como defesa)
 * que têm origem na quadra. Lance antigo sem `shotOriginZone` fica de fora do mapa.
 */
export function aggregateShotZoneHeat(events: readonly ShotHeatSource[] | null | undefined): ShotZoneHeat {
  const heat = emptyShotZoneHeat();
  if (!events) return heat;
  for (const event of events) {
    const zone = readShotOriginZone(event.shotOriginZone);
    if (!zone) continue;
    if (isOurShot(event)) heat[zone].ours += 1;
    else if (isConcededShot(event)) heat[zone].conceded += 1;
  }
  return heat;
}

export function shotZoneHeatTotals(heat: ShotZoneHeat): { ours: number; conceded: number } {
  let ours = 0;
  let conceded = 0;
  for (const zone of SHOT_ORIGIN_ZONES) {
    ours += heat[zone.id].ours;
    conceded += heat[zone.id].conceded;
  }
  return { ours, conceded };
}

export function shotZoneHeatMax(heat: ShotZoneHeat): number {
  let max = 0;
  for (const zone of SHOT_ORIGIN_ZONES) {
    max = Math.max(max, heat[zone.id].ours, heat[zone.id].conceded);
  }
  return max;
}

/**
 * Regiões reais de uma quadra de futsal (40 m × 20 m).
 *
 * A tela olha do nosso gol (embaixo) para o gol adversário (cima).
 * Esquerda e direita são de quem está atrás do nosso gol.
 * 10 unidades no desenho = 1 metro.
 *
 * O campo `zone` do lance continua sendo lateral/escanteio
 * (AT_ESQ, AT_DIR, DF_ESQ, DF_DIR). A região do lance é `shotOriginZone`.
 * Lance antigo sem esse campo continua válido.
 */

export const COURT_UNITS_PER_METER = 10;

export const COURT = {
  width: 200,
  length: 400,
  centerX: 100,
  halfwayY: 200,
  areaRadius: 60,
  centerRadius: 30,
  /** Laterais: 5 m a partir de cada linha lateral. Não é linha pintada. */
  wing: 50,
  tenAttack: 100,
  tenDefense: 300,
  leftPost: 85,
  rightPost: 115,
} as const;

const AREA_SHOULDER_Y = Math.sqrt(COURT.areaRadius ** 2 - (COURT.leftPost - COURT.wing) ** 2);

export const SHOT_ORIGIN_ZONES = [
  { id: 'AREA_ADV', short: 'Área adv.', label: 'Área adversária' },
  { id: 'ENTRE_ADV', short: '10 m adv.', label: 'Entre a área e os 10 m, no ataque' },
  { id: 'LAT_AT_ESQ', short: 'Lat. at. E', label: 'Lateral esquerda de ataque' },
  { id: 'LAT_AT_DIR', short: 'Lat. at. D', label: 'Lateral direita de ataque' },
  { id: 'FAIXA_AT', short: 'Faixa at.', label: 'Faixa central de ataque' },
  { id: 'CENTRO', short: 'Centro', label: 'Círculo central' },
  { id: 'FAIXA_DF', short: 'Faixa def.', label: 'Faixa central de defesa' },
  { id: 'LAT_DF_ESQ', short: 'Lat. def. E', label: 'Lateral esquerda de defesa' },
  { id: 'LAT_DF_DIR', short: 'Lat. def. D', label: 'Lateral direita de defesa' },
  { id: 'ENTRE_DEF', short: '10 m nosso', label: 'Entre a área e os 10 m, na defesa' },
  { id: 'AREA_DEF', short: 'Nossa área', label: 'Nossa área' },
] as const;

export type ShotOriginZone = (typeof SHOT_ORIGIN_ZONES)[number]['id'];

const ZONE_IDS = new Set<string>(SHOT_ORIGIN_ZONES.map((zone) => zone.id));

/**
 * Protótipo anterior (grade de 8). Não é mais desenhado.
 * Na leitura, cai na região mais próxima para o mapa não perder o lance.
 */
const LEGACY_ZONE_MAP: Record<string, ShotOriginZone> = {
  AT2_ESQ: 'LAT_AT_ESQ',
  AT2_DIR: 'LAT_AT_DIR',
  AT1_ESQ: 'FAIXA_AT',
  AT1_DIR: 'LAT_AT_DIR',
  DF2_ESQ: 'LAT_DF_ESQ',
  DF2_DIR: 'LAT_DF_DIR',
  DF1_ESQ: 'LAT_DF_ESQ',
  DF1_DIR: 'LAT_DF_DIR',
};

export type ShotZoneCount = { ours: number; conceded: number };

export type ShotZoneHeat = Record<ShotOriginZone, ShotZoneCount>;

/** Lance mínimo para o mapa. Aceita o evento da coleta (`type`) ou o pós-jogo (`action`). */
export type ShotHeatSource = {
  type?: string;
  action?: string;
  shotOriginZone?: unknown;
  /** 1T ataca para cima. 2T inverte sozinho. Ausente: trata como 1º tempo. */
  period?: '1T' | '2T' | string;
};

const COURT_ZONE_EVENT_TYPES = new Set([
  'pass',
  'shot',
  'foul',
  'tackle',
  'save',
  'block',
  'corner',
  'lateral',
]);

/** Onde o lance acontece na quadra. Gol, cartão, pênalti e tiro livre seguem o fluxo próprio. */
export function eventTypeUsesCourtZone(type: string | null | undefined): boolean {
  return typeof type === 'string' && COURT_ZONE_EVENT_TYPES.has(type);
}

export function isShotOriginZone(value: unknown): value is ShotOriginZone {
  return typeof value === 'string' && ZONE_IDS.has(value);
}

export function readShotOriginZone(value: unknown): ShotOriginZone | undefined {
  if (typeof value !== 'string') return undefined;
  if (ZONE_IDS.has(value)) return value as ShotOriginZone;
  return LEGACY_ZONE_MAP[value];
}

export function shotOriginZoneById(id: ShotOriginZone): (typeof SHOT_ORIGIN_ZONES)[number] {
  const zone = SHOT_ORIGIN_ZONES.find((item) => item.id === id);
  if (!zone) {
    throw new Error(`Região da quadra desconhecida: ${id}`);
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
 * que têm região na quadra. Lance antigo sem `shotOriginZone` fica de fora do mapa.
 * Passe, falta e os outros lances com região não pintam o mapa.
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

function inPenaltyArea(x: number, yFromGoal: number): boolean {
  if (yFromGoal < 0 || yFromGoal > COURT.areaRadius) return false;
  if (x >= COURT.leftPost && x <= COURT.rightPost) return true;
  const post = x < COURT.leftPost ? COURT.leftPost : COURT.rightPost;
  const dx = x - post;
  return dx * dx + yFromGoal * yFromGoal <= COURT.areaRadius ** 2;
}

function inCenterCircle(x: number, y: number): boolean {
  const dx = x - COURT.centerX;
  const dy = y - COURT.halfwayY;
  return dx * dx + dy * dy <= COURT.centerRadius ** 2;
}

/** Região sob um ponto do desenho. Fora da quadra, null. */
export function courtZoneAt(x: number, y: number): ShotOriginZone | null {
  if (x < 0 || y < 0 || x > COURT.width || y > COURT.length) return null;
  if (inPenaltyArea(x, y)) return 'AREA_ADV';
  if (inPenaltyArea(x, COURT.length - y)) return 'AREA_DEF';
  if (inCenterCircle(x, y)) return 'CENTRO';
  const attack = y < COURT.halfwayY;
  if (x < COURT.wing) return attack ? 'LAT_AT_ESQ' : 'LAT_DF_ESQ';
  if (x > COURT.width - COURT.wing) return attack ? 'LAT_AT_DIR' : 'LAT_DF_DIR';
  if (attack) return y <= COURT.tenAttack ? 'ENTRE_ADV' : 'FAIXA_AT';
  return y >= COURT.tenDefense ? 'ENTRE_DEF' : 'FAIXA_DF';
}

const shoulder = AREA_SHOULDER_Y.toFixed(2);
const defenseShoulder = (COURT.length - AREA_SHOULDER_Y).toFixed(2);

/** Contornos clicáveis. As linhas oficiais são desenhadas por cima, à parte. */
export const COURT_ZONE_PATHS: Record<ShotOriginZone, string> = {
  AREA_ADV: `M 25 0 A 60 60 0 0 0 85 60 L 115 60 A 60 60 0 0 0 175 0 Z`,
  AREA_DEF: `M 25 400 A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 175 400 Z`,
  ENTRE_ADV: `M 50 ${shoulder} A 60 60 0 0 1 85 60 L 115 60 A 60 60 0 0 0 150 ${shoulder} L 150 100 L 50 100 Z`,
  ENTRE_DEF: `M 50 ${defenseShoulder} A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 150 ${defenseShoulder} L 150 300 L 50 300 Z`,
  LAT_AT_ESQ: `M 0 0 L 25 0 A 60 60 0 0 0 50 ${shoulder} L 50 200 L 0 200 Z`,
  LAT_AT_DIR: `M 200 0 L 175 0 A 60 60 0 0 1 150 ${shoulder} L 150 200 L 200 200 Z`,
  LAT_DF_ESQ: `M 0 400 L 25 400 A 60 60 0 0 1 50 ${defenseShoulder} L 50 200 L 0 200 Z`,
  LAT_DF_DIR: `M 200 400 L 175 400 A 60 60 0 0 0 150 ${defenseShoulder} L 150 200 L 200 200 Z`,
  FAIXA_AT: `M 50 100 H 150 V 200 H 130 A 30 30 0 0 0 70 200 H 50 Z`,
  FAIXA_DF: `M 50 300 H 150 V 200 H 130 A 30 30 0 0 1 70 200 H 50 Z`,
  CENTRO: '',
};

export const COURT_ZONE_ANCHORS: Record<ShotOriginZone, { x: number; y: number }> = {
  AREA_ADV: { x: 100, y: 34 },
  ENTRE_ADV: { x: 100, y: 82 },
  LAT_AT_ESQ: { x: 22, y: 118 },
  LAT_AT_DIR: { x: 178, y: 118 },
  FAIXA_AT: { x: 100, y: 146 },
  CENTRO: { x: 100, y: 200 },
  FAIXA_DF: { x: 100, y: 254 },
  LAT_DF_ESQ: { x: 22, y: 278 },
  LAT_DF_DIR: { x: 178, y: 278 },
  ENTRE_DEF: { x: 100, y: 318 },
  AREA_DEF: { x: 100, y: 370 },
};

/** viewBox centrado no círculo central, com os gols para fora da linha de fundo. */
export const COURT_VIEWBOX = '-18 -26 236 452';

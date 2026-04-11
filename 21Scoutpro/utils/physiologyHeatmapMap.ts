import type { InjuryRecord } from '../types';

/**
 * Pontos base (% largura, % altura) por região no heatmap.
 * ox/oy em resolveMedicalLocationToHeatmap refinam sub-zonas sem precisar de centenas de chaves.
 */
export const HEATMAP_BODY_POINTS: Record<string, { front: [number, number] | null; back: [number, number] | null }> = {
  Cabeça: { front: [50, 8], back: [50, 8] },
  Face: { front: [50, 12], back: null },
  Pescoço: { front: [50, 14], back: [50, 12] },
  Ombro: { front: [28, 22], back: [28, 22] },
  Braço: { front: [28, 30], back: [28, 30] },
  Cotovelo: { front: [28, 36], back: [28, 36] },
  Antebraço: { front: [28, 42], back: [28, 42] },
  Punho: { front: [27, 46], back: [27, 46] },
  Mão: { front: [26, 50], back: [26, 50] },
  Tórax: { front: [50, 30], back: null },
  ColunaToracica: { front: null, back: [50, 28] },
  Costas: { front: null, back: [50, 35] },
  ColunaLombar: { front: null, back: [50, 40] },
  ColunaCervical: { front: null, back: [50, 14] },
  Quadril: { front: [44, 48], back: [44, 48] },
  Adutor: { front: [47, 52], back: null },
  'Coxa Anterior': { front: [42, 55], back: null },
  'Coxa Posterior': { front: null, back: [42, 55] },
  Glúteo: { front: null, back: [42, 52] },
  Joelho: { front: [38, 68], back: [38, 70] },
  Panturrilha: { front: null, back: [40, 80] },
  Tornozelo: { front: [40, 88], back: [40, 88] },
  Pé: { front: [38, 94], back: [38, 94] },
};

export type HeatmapResolved = { regionId: string; ox: number; oy: number };

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

function normKey(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/\s*(direito|direita|esquerdo|esquerda)\s*/gi, '')
    .trim();
}

/** Cada local da aba médica (TeamManagement INJURY_LOCATIONS_BY_TYPE) → região + offset fino. */
const MEDICAL_TO_HEATMAP: Record<string, HeatmapResolved> = {
  // Muscular
  'Coxa Posterior': { regionId: 'Coxa Posterior', ox: 0, oy: 0 },
  'Coxa Anterior': { regionId: 'Coxa Anterior', ox: 0, oy: 0 },
  Quadríceps: { regionId: 'Coxa Anterior', ox: 0, oy: -3 },
  Isquiostibiais: { regionId: 'Coxa Posterior', ox: 0, oy: -2 },
  Panturrilha: { regionId: 'Panturrilha', ox: 0, oy: 0 },
  Glúteo: { regionId: 'Glúteo', ox: 0, oy: 0 },
  Adutor: { regionId: 'Adutor', ox: 0, oy: 0 },
  'Bíceps Braquial': { regionId: 'Braço', ox: 0, oy: 2 },
  'Tríceps': { regionId: 'Braço', ox: 0, oy: -2 },
  'Tendão de Aquiles': { regionId: 'Panturrilha', ox: 0, oy: 3 },
  'Tendão Patelar': { regionId: 'Joelho', ox: 0, oy: 2 },

  // Trauma — membros inferiores
  Tornozelo: { regionId: 'Tornozelo', ox: 0, oy: 0 },
  Joelho: { regionId: 'Joelho', ox: 0, oy: 0 },
  Pé: { regionId: 'Pé', ox: 0, oy: 0 },
  'Dedos do Pé': { regionId: 'Pé', ox: 0, oy: 2 },
  Calcâneo: { regionId: 'Pé', ox: 0, oy: 4 },
  Metatarso: { regionId: 'Pé', ox: 0, oy: -3 },
  Fêmur: { regionId: 'Coxa Anterior', ox: 0, oy: -5 },
  Tíbia: { regionId: 'Joelho', ox: 0, oy: 5 },
  Fíbula: { regionId: 'Tornozelo', ox: 0, oy: -2 },

  // Trauma — membros superiores
  Ombro: { regionId: 'Ombro', ox: 0, oy: 0 },
  Braço: { regionId: 'Braço', ox: 0, oy: 0 },
  Antebraço: { regionId: 'Antebraço', ox: 0, oy: 0 },
  Punho: { regionId: 'Punho', ox: 0, oy: 0 },
  Mão: { regionId: 'Mão', ox: 0, oy: 0 },
  'Dedos da Mão': { regionId: 'Mão', ox: 0, oy: 3 },
  Úmero: { regionId: 'Braço', ox: 0, oy: -3 },
  Rádio: { regionId: 'Antebraço', ox: 0, oy: 2 },
  Ulna: { regionId: 'Antebraço', ox: 0, oy: -2 },
  Clavícula: { regionId: 'Ombro', ox: 2, oy: -4 },
  Escápula: { regionId: 'Ombro', ox: 0, oy: -3 },
  Esternão: { regionId: 'Tórax', ox: 0, oy: 3 },
  Costelas: { regionId: 'Tórax', ox: 0, oy: -2 },

  // Trauma — cabeça / face
  Cabeça: { regionId: 'Cabeça', ox: 0, oy: 0 },
  Face: { regionId: 'Face', ox: 0, oy: 0 },
  Mandíbula: { regionId: 'Face', ox: 0, oy: 4 },
  Dentes: { regionId: 'Face', ox: -3, oy: 5 },
  Nariz: { regionId: 'Face', ox: 0, oy: 2 },
  Olho: { regionId: 'Face', ox: -4, oy: 0 },
  Orelha: { regionId: 'Face', ox: 5, oy: -1 },

  // Articular
  Quadril: { regionId: 'Quadril', ox: 0, oy: 0 },
  Cotovelo: { regionId: 'Cotovelo', ox: 0, oy: 0 },
  'Ligamento Cruzado Anterior': { regionId: 'Joelho', ox: -2, oy: 0 },
  'Ligamento Cruzado Posterior': { regionId: 'Joelho', ox: 2, oy: 1 },
  'Ligamento Colateral Medial': { regionId: 'Joelho', ox: -3, oy: 2 },
  'Ligamento Colateral Lateral': { regionId: 'Joelho', ox: 3, oy: 2 },
  Menisco: { regionId: 'Joelho', ox: 0, oy: -1 },
  'Coluna Cervical': { regionId: 'ColunaCervical', ox: 0, oy: 0 },
  'Coluna Torácica': { regionId: 'ColunaToracica', ox: 0, oy: 0 },
  'Coluna Lombar': { regionId: 'ColunaLombar', ox: 0, oy: 0 },

  // Outros / sinónimos adicionais
  Tórax: { regionId: 'Tórax', ox: 0, oy: 0 },
  Costas: { regionId: 'Costas', ox: 0, oy: 0 },
  Lombar: { regionId: 'ColunaLombar', ox: 0, oy: 0 },
  Pescoço: { regionId: 'Pescoço', ox: 0, oy: 0 },
  Pelve: { regionId: 'Quadril', ox: 0, oy: 3 },
  Sacro: { regionId: 'ColunaLombar', ox: 0, oy: 4 },
};

const NORM_LOOKUP: Record<string, HeatmapResolved> = (() => {
  const out: Record<string, HeatmapResolved> = {};
  for (const [k, v] of Object.entries(MEDICAL_TO_HEATMAP)) {
    out[normKey(k)] = v;
  }
  return out;
})();

/**
 * Resolve o texto de localização da lesão (aba médica) para região do heatmap + offset %.
 * "Outros" ou vazio → null (não desenha no corpo).
 */
export function resolveMedicalLocationToHeatmap(location: string): HeatmapResolved | null {
  const t = (location || '').trim();
  if (!t) return null;
  const nk = normKey(t);
  if (nk === 'outros') return null;

  if (MEDICAL_TO_HEATMAP[t]) return MEDICAL_TO_HEATMAP[t];
  if (NORM_LOOKUP[nk]) return NORM_LOOKUP[nk];

  // Fallbacks por palavra-chave (dados antigos / texto livre parcial)
  if (nk.includes('joelho')) return { regionId: 'Joelho', ox: 0, oy: 0 };
  if (nk.includes('tornozelo')) return { regionId: 'Tornozelo', ox: 0, oy: 0 };
  if (nk.includes('pe ') || nk === 'pe' || nk.includes('pé')) return { regionId: 'Pé', ox: 0, oy: 0 };
  if (nk.includes('ombro')) return { regionId: 'Ombro', ox: 0, oy: 0 };
  if (nk.includes('costas') || nk.includes('lombar')) return { regionId: 'Costas', ox: 0, oy: 0 };
  if (nk.includes('torax') || nk.includes('tórax')) return { regionId: 'Tórax', ox: 0, oy: 0 };
  if (nk.includes('cabeca') || nk.includes('cabeça')) return { regionId: 'Cabeça', ox: 0, oy: 0 };

  return null;
}

export type InjurySideKind = 'Direito' | 'Esquerdo' | 'Bilateral' | 'N/A';

export function inferSideFromLocationText(location: string): 'Direito' | 'Esquerdo' | null {
  const l = location.toLowerCase();
  if (/\b(direito|direita)\b/.test(l)) return 'Direito';
  if (/\b(esquerdo|esquerda)\b/.test(l)) return 'Esquerdo';
  return null;
}

export function effectiveInjurySide(inj: InjuryRecord): InjurySideKind {
  if (inj.side === 'Bilateral') return 'Bilateral';
  if (inj.side === 'Direito' || inj.side === 'Esquerdo') return inj.side;
  const fromText = inferSideFromLocationText(inj.location);
  if (fromText) return fromText;
  return inj.side === 'N/A' || !inj.side ? 'N/A' : inj.side;
}

/** Regiões com espelho esquerdo/direito na vista atual. */
export function isLateralRegion(regionId: string, view: 'front' | 'back'): boolean {
  if (
    regionId === 'Cabeça' ||
    regionId === 'Face' ||
    regionId === 'Tórax' ||
    regionId === 'ColunaToracica' ||
    regionId === 'Costas' ||
    regionId === 'ColunaLombar' ||
    regionId === 'ColunaCervical' ||
    regionId === 'Pescoço'
  ) {
    return false;
  }
  const frontLateral = new Set([
    'Ombro',
    'Braço',
    'Cotovelo',
    'Antebraço',
    'Punho',
    'Mão',
    'Joelho',
    'Tornozelo',
    'Pé',
    'Coxa Anterior',
    'Adutor',
    'Quadril',
  ]);
  const backLateral = new Set([
    'Ombro',
    'Braço',
    'Cotovelo',
    'Antebraço',
    'Punho',
    'Mão',
    'Joelho',
    'Tornozelo',
    'Pé',
    'Coxa Posterior',
    'Panturrilha',
    'Glúteo',
    'Quadril',
  ]);
  return view === 'front' ? frontLateral.has(regionId) : backLateral.has(regionId);
}

export function anchorForRegion(
  regionId: string,
  view: 'front' | 'back',
  side: InjurySideKind
): [number, number] | null {
  const bp = HEATMAP_BODY_POINTS[regionId];
  if (!bp) return null;
  const c = view === 'front' ? bp.front : bp.back;
  if (!c) return null;
  const [xRef, y] = c;
  if (!isLateralRegion(regionId, view)) return [c[0], y];
  const xLeft = Math.min(xRef, 100 - xRef);
  const xRight = Math.max(xRef, 100 - xRef);
  if (side === 'Bilateral' || side === 'N/A') return [50, y];
  return side === 'Direito' ? [xLeft, y] : [xRight, y];
}

export type OutwardDir = 'left' | 'right' | 'up' | 'down';

export function outwardDirection(x: number, y: number): OutwardDir {
  if (x < 50) return 'left';
  if (x > 50) return 'right';
  if (y < 38) return 'up';
  return 'down';
}

/** Desloca o ponto de ancoragem para fora do corpo para a seta não “carimbar” o silhueta. */
export function nudgeAnchorAwayFromBody(x: number, y: number, dir: OutwardDir, amount = 2.4): [number, number] {
  switch (dir) {
    case 'left':
      return [x - amount, y];
    case 'right':
      return [x + amount, y];
    case 'up':
      return [x, y - amount];
    default:
      return [x, y + amount];
  }
}

export function clampHeatmapPercent(v: number, min = 4, max = 96): number {
  return Math.min(max, Math.max(min, v));
}

export function heatmapLabelForMedical(displayLocation: string, side: InjurySideKind): string {
  if (side === 'Bilateral') return displayLocation;
  if (side === 'N/A') return displayLocation;
  return `${displayLocation} (${side})`;
}

/**
 * Em que vistas anatómicas cada região pode mostrar rótulos.
 * - Só coordenada frontal → só vista "frente"
 * - Só coordenada dorsal → só vista "costas"
 * - Joelho: regra explícita — rótulos só na frente (patela vista anterior)
 * - Ambas as coordenadas → frente e costas
 */
export function getAllowedViewsForRegion(regionId: string): Set<'front' | 'back'> {
  if (regionId === 'Joelho') return new Set(['front']);
  const bp = HEATMAP_BODY_POINTS[regionId];
  if (!bp) return new Set();
  const hasF = bp.front != null;
  const hasB = bp.back != null;
  if (hasF && !hasB) return new Set(['front']);
  if (!hasF && hasB) return new Set(['back']);
  if (hasF && hasB) return new Set(['front', 'back']);
  return new Set();
}

export interface HeatmapCalloutData {
  x: number;
  y: number;
  outward: OutwardDir;
  regionLabel: string;
  count: number;
}

/**
 * Coordenadas na vista atual — só se a região existir nessa vista (sem “empurrar” lesão dorsal para a frente, etc.).
 */
export function pickCoordsForView(
  regionId: string,
  view: 'front' | 'back'
): { regionId: string; coords: [number, number] } | null {
  const bp = HEATMAP_BODY_POINTS[regionId];
  if (!bp) return null;
  const c = view === 'front' ? bp.front : bp.back;
  if (!c) return null;
  return { regionId, coords: c };
}

export function buildHeatmapCallouts(injuries: InjuryRecord[], view: 'front' | 'back'): HeatmapCalloutData[] {
  const tallies = new Map<
    string,
    { displayLocation: string; side: InjurySideKind; count: number; regionId: string; ox: number; oy: number }
  >();

  injuries.forEach(inj => {
    const resolved = resolveMedicalLocationToHeatmap(inj.location);
    if (!resolved) return;
    const { regionId, ox, oy } = resolved;
    if (!getAllowedViewsForRegion(regionId).has(view)) return;
    const picked = pickCoordsForView(regionId, view);
    if (!picked) return;

    const side = effectiveInjurySide(inj);
    const locKey = (inj.location || '').trim();
    const key = `${locKey}::${side}`;
    const prev = tallies.get(key);
    if (prev) prev.count += 1;
    else tallies.set(key, { displayLocation: locKey, side, count: 1, regionId: picked.regionId, ox, oy });
  });

  const spots: HeatmapCalloutData[] = [];
  tallies.forEach(({ displayLocation, side, count, regionId, ox, oy }) => {
    const anchor = anchorForRegion(regionId, view, side);
    if (!anchor) return;
    let [ax, ay] = anchor;
    ax += ox;
    ay += oy;
    ax = clampHeatmapPercent(ax);
    ay = clampHeatmapPercent(ay);
    const outward = outwardDirection(ax, ay);
    [ax, ay] = nudgeAnchorAwayFromBody(ax, ay, outward, 2.4);
    ax = clampHeatmapPercent(ax);
    ay = clampHeatmapPercent(ay);
    spots.push({
      x: ax,
      y: ay,
      outward,
      regionLabel: heatmapLabelForMedical(displayLocation, side),
      count,
    });
  });

  spots.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
  return spots;
}

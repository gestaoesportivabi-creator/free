import { describe, expect, it } from 'vitest';
import {
  SHOT_ORIGIN_ZONES,
  aggregateShotZoneHeat,
  isShotOriginZone,
  readShotOriginZone,
  shotZoneHeatMax,
  shotZoneHeatTotals,
} from './shotCourtZones';

describe('shotCourtZones', () => {
  it('divide a quadra em 8 zonas únicas', () => {
    expect(SHOT_ORIGIN_ZONES).toHaveLength(8);
    expect(new Set(SHOT_ORIGIN_ZONES.map((zone) => zone.id)).size).toBe(8);
  });

  it('não trata zona de lateral como origem de chute', () => {
    expect(isShotOriginZone('AT_ESQ')).toBe(false);
    expect(isShotOriginZone('DF_DIR')).toBe(false);
    expect(readShotOriginZone('AT2_ESQ')).toBe('AT2_ESQ');
    expect(readShotOriginZone(undefined)).toBeUndefined();
    expect(readShotOriginZone('meio')).toBeUndefined();
  });

  it('separa chutes nossos e sofridos e ignora lance sem zona', () => {
    const heat = aggregateShotZoneHeat([
      { type: 'shot', shotOriginZone: 'AT2_ESQ' },
      { action: 'shotOff', shotOriginZone: 'AT2_ESQ' },
      { action: 'shotZonaChute', shotOriginZone: 'AT1_DIR' },
      { type: 'save', shotOriginZone: 'DF1_DIR' },
      { action: 'save', shotOriginZone: 'DF1_DIR' },
      { action: 'save', shotOriginZone: 'DF2_ESQ' },
      { type: 'shot' },
      { action: 'shotOn', shotOriginZone: 'AT_ESQ' },
      { type: 'goal', shotOriginZone: 'AT2_DIR' },
      { type: 'pass', shotOriginZone: 'AT1_ESQ' },
    ]);

    expect(heat.AT2_ESQ).toEqual({ ours: 2, conceded: 0 });
    expect(heat.AT1_DIR).toEqual({ ours: 1, conceded: 0 });
    expect(heat.DF1_DIR).toEqual({ ours: 0, conceded: 2 });
    expect(heat.DF2_ESQ).toEqual({ ours: 0, conceded: 1 });
    expect(heat.AT2_DIR).toEqual({ ours: 0, conceded: 0 });
    expect(shotZoneHeatTotals(heat)).toEqual({ ours: 3, conceded: 3 });
    expect(shotZoneHeatMax(heat)).toBe(2);
  });

  it('não conta duas vezes quando o lance da coleta já tem type', () => {
    const heat = aggregateShotZoneHeat([
      { type: 'shot', action: 'shotOn', shotOriginZone: 'DF1_ESQ' },
      { type: 'save', action: 'save', shotOriginZone: 'DF1_ESQ' },
    ]);
    expect(heat.DF1_ESQ).toEqual({ ours: 1, conceded: 1 });
  });
});

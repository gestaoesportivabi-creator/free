import { describe, expect, it } from 'vitest';
import {
  SHOT_ORIGIN_ZONES,
  aggregateShotZoneHeat,
  courtZoneAt,
  eventTypeUsesCourtZone,
  isShotOriginZone,
  readShotOriginZone,
  shotZoneHeatMax,
  shotZoneHeatTotals,
} from './shotCourtZones';

describe('shotCourtZones', () => {
  it('cobre a quadra com regiões reais, sem repetir id', () => {
    expect(SHOT_ORIGIN_ZONES.map((zone) => zone.id)).toEqual([
      'AREA_ADV',
      'ENTRE_ADV',
      'LAT_AT_ESQ',
      'LAT_AT_DIR',
      'FAIXA_AT',
      'CENTRO',
      'FAIXA_DF',
      'LAT_DF_ESQ',
      'LAT_DF_DIR',
      'ENTRE_DEF',
      'AREA_DEF',
    ]);
    expect(new Set(SHOT_ORIGIN_ZONES.map((zone) => zone.id)).size).toBe(SHOT_ORIGIN_ZONES.length);
  });

  it('não trata zona de lateral como região da quadra e lê o protótipo antigo', () => {
    expect(isShotOriginZone('AT_ESQ')).toBe(false);
    expect(isShotOriginZone('DF_DIR')).toBe(false);
    expect(isShotOriginZone('AREA_ADV')).toBe(true);
    expect(readShotOriginZone('AREA_DEF')).toBe('AREA_DEF');
    expect(readShotOriginZone('AT2_ESQ')).toBe('LAT_AT_ESQ');
    expect(readShotOriginZone('AT1_ESQ')).toBe('FAIXA_AT');
    expect(readShotOriginZone('DF1_DIR')).toBe('LAT_DF_DIR');
    expect(readShotOriginZone('AT_ESQ')).toBeUndefined();
    expect(readShotOriginZone(undefined)).toBeUndefined();
    expect(readShotOriginZone('meio')).toBeUndefined();
  });

  it('classifica as regiões pela geometria da quadra', () => {
    expect(courtZoneAt(100, 30)).toBe('AREA_ADV');
    expect(courtZoneAt(40, 20)).toBe('AREA_ADV');
    expect(courtZoneAt(100, 80)).toBe('ENTRE_ADV');
    expect(courtZoneAt(60, 70)).toBe('ENTRE_ADV');
    expect(courtZoneAt(20, 120)).toBe('LAT_AT_ESQ');
    expect(courtZoneAt(180, 80)).toBe('LAT_AT_DIR');
    expect(courtZoneAt(100, 150)).toBe('FAIXA_AT');
    expect(courtZoneAt(100, 200)).toBe('CENTRO');
    expect(courtZoneAt(100, 250)).toBe('FAIXA_DF');
    expect(courtZoneAt(18, 280)).toBe('LAT_DF_ESQ');
    expect(courtZoneAt(182, 260)).toBe('LAT_DF_DIR');
    expect(courtZoneAt(100, 320)).toBe('ENTRE_DEF');
    expect(courtZoneAt(100, 370)).toBe('AREA_DEF');
    expect(courtZoneAt(-1, 10)).toBeNull();
    expect(courtZoneAt(100, 401)).toBeNull();
  });

  it('não deixa buraco dentro da quadra', () => {
    const seen = new Set<string>();
    for (let y = 1; y < 400; y += 5) {
      for (let x = 1; x < 200; x += 5) {
        const zone = courtZoneAt(x, y);
        expect(zone).not.toBeNull();
        seen.add(zone as string);
      }
    }
    expect(seen.size).toBe(SHOT_ORIGIN_ZONES.length);
  });

  it('separa chutes nossos e sofridos e ignora lance sem região', () => {
    const heat = aggregateShotZoneHeat([
      { type: 'shot', shotOriginZone: 'AREA_ADV' },
      { action: 'shotOff', shotOriginZone: 'AREA_ADV' },
      { action: 'shotZonaChute', shotOriginZone: 'ENTRE_ADV' },
      { type: 'save', shotOriginZone: 'AREA_DEF' },
      { action: 'save', shotOriginZone: 'AREA_DEF' },
      { action: 'save', shotOriginZone: 'ENTRE_DEF' },
      { type: 'shot' },
      { action: 'shotOn', shotOriginZone: 'AT_ESQ' },
      { type: 'goal', shotOriginZone: 'FAIXA_AT' },
      { type: 'pass', shotOriginZone: 'CENTRO' },
      { type: 'shot', shotOriginZone: 'AT2_ESQ' },
    ]);

    expect(heat.AREA_ADV).toEqual({ ours: 2, conceded: 0 });
    expect(heat.ENTRE_ADV).toEqual({ ours: 1, conceded: 0 });
    expect(heat.AREA_DEF).toEqual({ ours: 0, conceded: 2 });
    expect(heat.ENTRE_DEF).toEqual({ ours: 0, conceded: 1 });
    expect(heat.LAT_AT_ESQ).toEqual({ ours: 1, conceded: 0 });
    expect(heat.FAIXA_AT).toEqual({ ours: 0, conceded: 0 });
    expect(heat.CENTRO).toEqual({ ours: 0, conceded: 0 });
    expect(shotZoneHeatTotals(heat)).toEqual({ ours: 4, conceded: 3 });
    expect(shotZoneHeatMax(heat)).toBe(2);
  });

  it('não conta duas vezes quando o lance da coleta já tem type', () => {
    const heat = aggregateShotZoneHeat([
      { type: 'shot', action: 'shotOn', shotOriginZone: 'FAIXA_AT' },
      { type: 'save', action: 'save', shotOriginZone: 'FAIXA_AT' },
    ]);
    expect(heat.FAIXA_AT).toEqual({ ours: 1, conceded: 1 });
  });

  it('marca região no lance de quadra e não no gol, cartão ou bola parada', () => {
    for (const type of ['pass', 'shot', 'foul', 'tackle', 'save', 'block', 'corner', 'lateral']) {
      expect(eventTypeUsesCourtZone(type)).toBe(true);
    }
    for (const type of ['goal', 'card', 'penalty', 'freeKick', 'cardAgainst']) {
      expect(eventTypeUsesCourtZone(type)).toBe(false);
    }
  });
});

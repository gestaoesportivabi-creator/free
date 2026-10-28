import { describe, expect, it } from 'vitest';
import {
  HEAT_CELLS,
  ORIGIN_TO_HEAT_CELL,
  aggregateFinalizationHeat,
  attackEndForPeriod,
  finalizationDensity,
  heatCellForOrigin,
  heatCellMax,
  heatCellTotal,
  heatRampStep,
  orientZoneToAttack,
} from './finalizationHeatMap';
import type { ShotHeatSource } from './shotCourtZones';

const BOTH_HALVES: ShotHeatSource[] = [
  { type: 'shot', period: '1T', shotOriginZone: 'AREA_ADV' },
  { type: 'shot', period: '1T', shotOriginZone: 'AREA_ADV' },
  { type: 'shot', period: '2T', shotOriginZone: 'AREA_DEF' },
  { type: 'shot', period: '2T', shotOriginZone: 'LAT_DF_DIR' },
  { type: 'save', period: '1T', shotOriginZone: 'AREA_DEF' },
  { type: 'save', period: '1T', shotOriginZone: 'ENTRE_DEF' },
  { type: 'save', period: '2T', shotOriginZone: 'AREA_ADV' },
  { type: 'shot', period: '1T' },
  { type: 'shot', period: '2T', shotOriginZone: 'AT_ESQ' },
  { type: 'pass', period: '1T', shotOriginZone: 'FAIXA_AT' },
];

describe('finalizationHeatMap', () => {
  it('inverte o lado de ataque no intervalo', () => {
    expect(attackEndForPeriod('1T')).toBe('cima');
    expect(attackEndForPeriod('2T')).toBe('baixo');
    expect(attackEndForPeriod('2T', 'baixo')).toBe('cima');
    expect(orientZoneToAttack('AREA_ADV', '1T')).toBe('AREA_ADV');
    expect(orientZoneToAttack('AREA_DEF', '2T')).toBe('AREA_ADV');
    expect(orientZoneToAttack('AREA_ADV', '2T')).toBe('AREA_DEF');
    expect(orientZoneToAttack('CENTRO', undefined)).toBe('CENTRO');
  });

  it('divide cada metade em quatro zonas e cobre as regiões da coleta', () => {
    const attack = HEAT_CELLS.filter((cell) => cell.id.startsWith('AT_'));
    const defense = HEAT_CELLS.filter((cell) => cell.id.startsWith('DF_'));
    expect(attack).toHaveLength(4);
    expect(defense).toHaveLength(4);
    expect(new Set(Object.values(ORIGIN_TO_HEAT_CELL)).size).toBeGreaterThan(1);
    expect(heatCellForOrigin('AREA_ADV')).not.toBe(heatCellForOrigin('AREA_DEF'));
  });

  it('soma finalizações dos dois tempos no lado de ataque e ignora lance sem zona', () => {
    const ours = aggregateFinalizationHeat(BOTH_HALVES, 'ours');
    const conceded = aggregateFinalizationHeat(BOTH_HALVES, 'conceded');
    const attackCell = heatCellForOrigin('AREA_ADV');
    const defenseCell = heatCellForOrigin('AREA_DEF');

    expect(ours[attackCell]).toBe(3);
    expect(ours[heatCellForOrigin('LAT_AT_DIR')]).toBe(1);
    expect(heatCellTotal(ours)).toBe(4);
    expect(conceded[defenseCell]).toBe(3);
    expect(heatCellTotal(conceded)).toBe(3);
    expect(heatCellMax(ours)).toBeGreaterThan(0);
    expect(heatRampStep(0, 4)).toBe(0);
    expect(heatRampStep(4, 4)).toBe(4);
    expect(heatRampStep(1, 4)).toBe(1);
  });

  it('não mistura feitas e sofridas no mapa contínuo', () => {
    const ours = finalizationDensity(BOTH_HALVES, 'ours');
    const conceded = finalizationDensity(BOTH_HALVES, 'conceded');
    expect(ours.reduce((sum, point) => sum + point.n, 0)).toBe(4);
    expect(conceded.reduce((sum, point) => sum + point.n, 0)).toBe(3);
    expect(ours.every((point) => point.y < 220)).toBe(true);
  });
});

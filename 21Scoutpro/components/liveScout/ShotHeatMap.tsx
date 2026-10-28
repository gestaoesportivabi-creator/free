import React, { useMemo, useState } from 'react';
import {
  aggregateFinalizationHeat,
  attackEndForPeriod,
  finalizationDensity,
  heatCellTotal,
  HEAT_RAMP,
  type FinalizationSide,
} from '../../utils/finalizationHeatMap';
import type { ShotHeatSource } from '../../utils/shotCourtZones';
import { FinalizationHeatCourt } from './FinalizationHeatCourt';

type ShotHeatMapProps = {
  events?: readonly ShotHeatSource[] | null;
  /** A fita ainda não chegou. Não mostra zero como se não houvesse chute. */
  pending?: boolean;
};

export function ShotHeatMap({ events, pending = false }: ShotHeatMapProps) {
  const [mode, setMode] = useState<'zones' | 'continuous'>('zones');
  const [side, setSide] = useState<FinalizationSide>('ours');
  const counts = useMemo(
    () => aggregateFinalizationHeat(pending ? [] : events, side),
    [events, pending, side],
  );
  const oursTotal = useMemo(
    () => heatCellTotal(aggregateFinalizationHeat(pending ? [] : events, 'ours')),
    [events, pending],
  );
  const concededTotal = useMemo(
    () => heatCellTotal(aggregateFinalizationHeat(pending ? [] : events, 'conceded')),
    [events, pending],
  );
  const points = useMemo(
    () => finalizationDensity(pending ? [] : events, side),
    [events, pending, side],
  );
  const total = heatCellTotal(counts);
  const empty = !pending && total === 0;

  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${
      active ? 'border-white bg-white/15 text-white' : 'border-white/20 text-zinc-400'
    }`;

  return (
    <section
      data-testid="shot-heat-map"
      className="rounded-3xl border border-zinc-800 bg-black p-4 shadow-lg sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-white">Mapa de finalizações</h3>
          <p className="mt-1 max-w-xl text-xs text-zinc-400">
            O desenho põe o ataque para cima. No intervalo o lado inverte sozinho.
            Lance antigo sem região fica de fora.
          </p>
        </div>
        <p data-testid="heat-attack-flag" className="text-[11px] font-bold uppercase leading-snug text-sky-200">
          1º tempo · ataque para {attackEndForPeriod('1T')}
          <span className="mx-1 text-white/30">·</span>
          2º tempo · ataque para {attackEndForPeriod('2T')}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={chip(side === 'ours')} aria-pressed={side === 'ours'} data-testid="heat-side-ours" onClick={() => setSide('ours')}>
          Feitas {pending ? '—' : oursTotal}
        </button>
        <button type="button" className={chip(side === 'conceded')} aria-pressed={side === 'conceded'} data-testid="heat-side-conceded" onClick={() => setSide('conceded')}>
          Sofridas {pending ? '—' : concededTotal}
        </button>
        <button type="button" className={chip(mode === 'zones')} aria-pressed={mode === 'zones'} data-testid="heat-mode-zones" onClick={() => setMode('zones')}>
          Zonas
        </button>
        <button type="button" className={chip(mode === 'continuous')} aria-pressed={mode === 'continuous'} data-testid="heat-mode-continuous" onClick={() => setMode('continuous')}>
          Contínuo
        </button>
      </div>

      {pending ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-sm text-zinc-400">
          Carregando lances antes de pintar a quadra.
        </p>
      ) : (
        <div className="mx-auto h-[380px] w-full max-w-[300px] sm:h-[420px] sm:max-w-[320px]">
          <FinalizationHeatCourt mode={mode} counts={counts} points={points} className="h-full" />
        </div>
      )}

      <div data-testid="heat-legend" className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-zinc-300">
        <span className="text-zinc-500">Contagem</span>
        {HEAT_RAMP.map((item) => (
          <span key={item.step} className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm" style={{ background: item.fill }} />
            {item.label}
          </span>
        ))}
      </div>

      {empty && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Nenhuma finalização com região nesta partida. Na coleta, toque a região e depois o chute.
          Lances antigos, sem região, continuam na fita e não entram no mapa.
        </p>
      )}
    </section>
  );
}

import React, { useMemo } from 'react';
import {
  aggregateShotZoneHeat,
  shotZoneHeatTotals,
  type ShotHeatSource,
} from '../../utils/shotCourtZones';
import { LiveScoutCourt } from './LiveScoutCourt';

type ShotHeatMapProps = {
  events?: readonly ShotHeatSource[] | null;
  /** A fita ainda não chegou. Não mostra zero como se não houvesse chute. */
  pending?: boolean;
};

export function ShotHeatMap({ events, pending = false }: ShotHeatMapProps) {
  const heat = useMemo(() => aggregateShotZoneHeat(pending ? [] : events), [events, pending]);
  const totals = shotZoneHeatTotals(heat);
  const empty = !pending && totals.ours === 0 && totals.conceded === 0;

  return (
    <section
      data-testid="shot-heat-map"
      className="rounded-3xl border border-zinc-800 bg-black p-4 shadow-lg sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-white">Mapa de calor dos chutes</h3>
          <p className="mt-1 text-xs text-zinc-400">
            As mesmas regiões da quadra. Ciano é chute nosso. Rosa é chute que sofremos.
          </p>
        </div>
        <div className="flex gap-2 text-[11px] font-black uppercase">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">
            Nossos {pending ? '—' : totals.ours}
          </span>
          <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2.5 py-1 text-rose-200">
            Sofridos {pending ? '—' : totals.conceded}
          </span>
        </div>
      </div>
      {pending ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-sm text-zinc-400">
          Carregando lances antes de pintar a quadra.
        </p>
      ) : (
        <div className="mx-auto h-[min(68vh,520px)] w-full max-w-[280px] sm:max-w-[320px]">
          <LiveScoutCourt counts={heat} className="h-full">
            <p className="text-center text-[11px] font-black tabular-nums leading-tight">
              <span className="text-cyan-200">{totals.ours}</span>
              <span className="text-white/40"> · </span>
              <span className="text-rose-200">{totals.conceded}</span>
            </p>
          </LiveScoutCourt>
        </div>
      )}
      {empty && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Nenhum chute com região nesta partida. Na coleta, toque a região da quadra e depois o evento.
          Lances antigos, sem região, continuam na fita e não entram no mapa.
        </p>
      )}
    </section>
  );
}

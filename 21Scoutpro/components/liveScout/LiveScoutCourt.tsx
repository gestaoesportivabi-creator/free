import React from 'react';
import {
  SHOT_ORIGIN_ZONES,
  shotZoneHeatMax,
  type ShotOriginZone,
  type ShotZoneHeat,
} from '../../utils/shotCourtZones';

export type ShotZonePick = 'ours' | 'conceded' | null;

type LiveScoutCourtProps = {
  counts?: ShotZoneHeat;
  /** Quadra armada: o próximo toque grava a origem do chute. */
  picking?: ShotZonePick;
  selectedZone?: ShotOriginZone | null;
  onSelectZone?: (zone: ShotOriginZone) => void;
  onCancelPick?: () => void;
  /** Cronômetro (ou o resumo do mapa) na faixa central, sobre a linha do meio. */
  children?: React.ReactNode;
  className?: string;
};

function zoneFill(ours: number, conceded: number, max: number): string {
  const alpha = (count: number) => (count <= 0 || max <= 0 ? 0 : 0.28 + 0.62 * (count / max));
  const cyan = `rgba(0, 240, 255, ${alpha(ours).toFixed(3)})`;
  const rose = `rgba(251, 113, 133, ${alpha(conceded).toFixed(3)})`;
  if (ours > 0 && conceded > 0) {
    return `linear-gradient(90deg, ${cyan} 0 50%, ${rose} 50% 100%)`;
  }
  if (ours > 0) return cyan;
  if (conceded > 0) return rose;
  return 'rgba(255,255,255,0.05)';
}

function ZoneButton({
  zone,
  ours,
  conceded,
  max,
  picking,
  selected,
  onSelectZone,
}: {
  zone: (typeof SHOT_ORIGIN_ZONES)[number];
  ours: number;
  conceded: number;
  max: number;
  picking: ShotZonePick;
  selected: boolean;
  onSelectZone?: (zone: ShotOriginZone) => void;
}) {
  const interactive = picking != null;
  return (
    <button
      type="button"
      data-testid={`shot-zone-${zone.id}`}
      aria-label={`${zone.label}. Nossos chutes: ${ours}. Chutes sofridos: ${conceded}.`}
      aria-disabled={!interactive}
      aria-pressed={selected}
      onClick={() => {
        if (!interactive) return;
        onSelectZone?.(zone.id);
      }}
      className={`relative z-[1] flex min-h-[44px] flex-col items-start justify-between rounded-2xl border px-2 py-1.5 text-left transition-transform ${
        interactive
          ? 'cursor-pointer border-white/50 hover:border-white active:scale-[0.98]'
          : 'cursor-default border-white/15'
      } ${selected ? 'ring-2 ring-white' : ''} ${
        picking === 'ours' ? 'shadow-[inset_0_0_0_1px_rgba(0,240,255,0.35)]' : ''
      } ${picking === 'conceded' ? 'shadow-[inset_0_0_0_1px_rgba(251,113,133,0.4)]' : ''}`}
      style={{ background: zoneFill(ours, conceded, max) }}
    >
      <span className="text-[10px] font-black uppercase tracking-wide text-white/90">{zone.short}</span>
      {(ours > 0 || conceded > 0) && (
        <span className="flex gap-1.5 text-[11px] font-black tabular-nums">
          <span className="text-cyan-200">{ours}</span>
          <span className="text-rose-200">{conceded}</span>
        </span>
      )}
    </button>
  );
}

export function LiveScoutCourt({
  counts,
  picking = null,
  selectedZone = null,
  onSelectZone,
  onCancelPick,
  children,
  className = '',
}: LiveScoutCourtProps) {
  const max = counts ? shotZoneHeatMax(counts) : 0;
  const attack = SHOT_ORIGIN_ZONES.filter((zone) => zone.row < 2);
  const defense = SHOT_ORIGIN_ZONES.filter((zone) => zone.row >= 2);
  const prompt =
    picking === 'ours'
      ? 'Toque de onde nós chutamos'
      : picking === 'conceded'
        ? 'Toque de onde sofremos o chute'
        : 'Gol adversário';

  return (
    <div
      data-testid="live-scout-court"
      className={`flex min-h-0 flex-col rounded-3xl border border-white/10 bg-[#07110c] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="flex items-center justify-center gap-2 px-2 py-1">
        <p
          data-testid="shot-zone-prompt"
          className={`text-center text-[9px] font-bold uppercase tracking-[0.16em] ${
            picking === 'ours' ? 'text-cyan-200' : picking === 'conceded' ? 'text-rose-200' : 'text-rose-200/70'
          }`}
        >
          {prompt}
        </p>
        {picking && onCancelPick ? (
          <button
            type="button"
            data-testid="shot-zone-cancel"
            onClick={onCancelPick}
            className="rounded-full border border-white/25 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-200"
          >
            Cancelar
          </button>
        ) : null}
      </div>
      <div
        className="relative grid min-h-[220px] flex-1 grid-cols-2 gap-1.5 px-2"
        style={{ gridTemplateRows: '1fr 1fr auto 1fr 1fr' }}
      >
        {attack.map((zone) => (
          <ZoneButton
            key={zone.id}
            zone={zone}
            ours={counts?.[zone.id].ours ?? 0}
            conceded={counts?.[zone.id].conceded ?? 0}
            max={max}
            picking={picking}
            selected={selectedZone === zone.id}
            onSelectZone={onSelectZone}
          />
        ))}
        <div className="z-[2] col-span-2 flex items-center justify-center py-0.5">
          <div className="w-full max-w-[230px] rounded-full border border-white/25 bg-black/55 px-3 py-1.5 shadow-lg backdrop-blur-md">
            {children ?? (
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Meio</p>
            )}
          </div>
        </div>
        {defense.map((zone) => (
          <ZoneButton
            key={zone.id}
            zone={zone}
            ours={counts?.[zone.id].ours ?? 0}
            conceded={counts?.[zone.id].conceded ?? 0}
            max={max}
            picking={picking}
            selected={selectedZone === zone.id}
            onSelectZone={onSelectZone}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/80">Nosso gol</p>
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/35">E · D</span>
      </div>
    </div>
  );
}

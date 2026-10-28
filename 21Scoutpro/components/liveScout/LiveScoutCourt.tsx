import React, { useId, useState } from 'react';
import {
  COURT_UNITS_PER_METER,
  COURT_VIEWBOX,
  COURT_ZONE_ANCHORS,
  COURT_ZONE_PATHS,
  SHOT_ORIGIN_ZONES,
  shotZoneHeatMax,
  type ShotOriginZone,
  type ShotZoneHeat,
} from '../../utils/shotCourtZones';

type LiveScoutCourtProps = {
  counts?: ShotZoneHeat;
  selectedZone?: ShotOriginZone | null;
  onSelectZone?: (zone: ShotOriginZone) => void;
  onClearZone?: () => void;
  /** Relógio fora da quadra clicável, para não cobrir o círculo nem as laterais. */
  children?: React.ReactNode;
  className?: string;
};

function zoneFill(ours: number, conceded: number, max: number, selected: boolean, hovered: boolean): string {
  if (selected) return 'rgba(0, 240, 255, 0.48)';
  if (hovered && ours <= 0 && conceded <= 0) return 'rgba(255,255,255,0.14)';
  const alpha = (count: number) => (count <= 0 || max <= 0 ? 0 : 0.22 + 0.5 * (count / max));
  if (ours > 0 && conceded > 0) {
    const cyan = alpha(ours);
    const rose = alpha(conceded);
    return `rgba(${Math.round(0 * cyan + 251 * rose)}, ${Math.round(240 * cyan + 113 * rose)}, ${Math.round(255 * cyan + 133 * rose)}, ${Math.max(cyan, rose).toFixed(3)})`;
  }
  if (ours > 0) return `rgba(0, 240, 255, ${alpha(ours).toFixed(3)})`;
  if (conceded > 0) return `rgba(251, 113, 133, ${alpha(conceded).toFixed(3)})`;
  return 'transparent';
}

function Mark({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={4.2} fill="#f7f4ea" stroke="#0b4f26" strokeWidth={1.4} />;
}

export function LiveScoutCourt({
  counts,
  selectedZone = null,
  onSelectZone,
  onClearZone,
  children,
  className = '',
}: LiveScoutCourtProps) {
  const [hover, setHover] = useState<ShotOriginZone | null>(null);
  const sheenId = useId().replace(/:/g, '');
  const interactive = Boolean(onSelectZone);
  const max = counts ? shotZoneHeatMax(counts) : 0;
  const selected = selectedZone ? SHOT_ORIGIN_ZONES.find((zone) => zone.id === selectedZone) : undefined;
  const prompt = selected ? selected.label : 'Toque a região';

  return (
    <div
      data-testid="live-scout-court"
      className={`flex min-h-0 flex-col ${className}`}
    >
      {interactive ? (
      <div className="flex h-6 shrink-0 items-center justify-center gap-2 px-1">
        <p
          data-testid="shot-zone-prompt"
          className={`truncate text-center text-[10px] font-bold uppercase tracking-[0.14em] ${
            selected ? 'text-white' : 'text-emerald-100/70'
          }`}
        >
          {prompt}
        </p>
        {selected && onClearZone ? (
          <button
            type="button"
            data-testid="shot-zone-clear"
            onClick={onClearZone}
            className="shrink-0 rounded-full border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-100"
          >
          Limpar
        </button>
        ) : null}
      </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={COURT_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Quadra de futsal"
        >
          <rect x={-18} y={-26} width={236} height={452} fill="#04140c" />
          <rect x={0} y={0} width={200} height={400} fill="#0f7a3a" />
          <rect x={0} y={0} width={200} height={400} fill={`url(#${sheenId})`} />

          {SHOT_ORIGIN_ZONES.map((zone) => {
            const ours = counts?.[zone.id].ours ?? 0;
            const conceded = counts?.[zone.id].conceded ?? 0;
            const isSelected = selectedZone === zone.id;
            const label = `${zone.label}. Nossos chutes: ${ours}. Chutes sofridos: ${conceded}.`;
            const common = {
              'data-testid': `shot-zone-${zone.id}`,
              fill: zoneFill(ours, conceded, max, isSelected, hover === zone.id),
              stroke: isSelected ? '#ffffff' : 'transparent',
              strokeWidth: isSelected ? 2.4 : 0,
              vectorEffect: 'non-scaling-stroke' as const,
              'aria-label': label,
            };
            if (zone.id === 'CENTRO') {
              return interactive ? (
                <circle
                  key={zone.id}
                  {...common}
                  cx={100}
                  cy={200}
                  r={30}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => setHover(zone.id)}
                  onMouseLeave={() => setHover((current) => (current === zone.id ? null : current))}
                  onClick={() => onSelectZone?.(zone.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectZone?.(zone.id);
                    }
                  }}
                />
              ) : (
                <circle key={zone.id} {...common} cx={100} cy={200} r={30} />
              );
            }
            return interactive ? (
              <path
                key={zone.id}
                {...common}
                d={COURT_ZONE_PATHS[zone.id]}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(zone.id)}
                onMouseLeave={() => setHover((current) => (current === zone.id ? null : current))}
                onClick={() => onSelectZone?.(zone.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectZone?.(zone.id);
                  }
                }}
              />
            ) : (
              <path key={zone.id} {...common} d={COURT_ZONE_PATHS[zone.id]} />
            );
          })}

          <g fill="none" stroke="#f7f4ea" strokeWidth={1.7} strokeLinejoin="miter" pointerEvents="none">
            <rect x={0.9} y={0.9} width={198.2} height={398.2} />
            <line x1={0} y1={200} x2={200} y2={200} />
            <circle cx={100} cy={200} r={3 * COURT_UNITS_PER_METER} />
            <path d="M 25 0 A 60 60 0 0 0 85 60 L 115 60 A 60 60 0 0 0 175 0" />
            <path d="M 25 400 A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 175 400" />
            <path d="M 85 0 V -11 H 115 V 0" strokeWidth={2.2} />
            <path d="M 85 400 V 411 H 115 V 400" strokeWidth={2.2} />
          </g>
          <g pointerEvents="none">
            <Mark cx={100} cy={200} />
            <Mark cx={100} cy={60} />
            <Mark cx={100} cy={100} />
            <Mark cx={100} cy={300} />
            <Mark cx={100} cy={340} />
          </g>
          <g
            pointerEvents="none"
            fill="#f7f4ea"
            fontSize={8}
            fontWeight={700}
            letterSpacing={1.2}
            textAnchor="middle"
          >
            <text x={100} y={-15}>
              GOL ADVERSÁRIO
            </text>
            <text x={100} y={426}>
              NOSSO GOL
            </text>
          </g>
          {selected ? (
            selected.id === 'CENTRO' ? (
              <circle
                cx={100}
                cy={200}
                r={30}
                fill="none"
                stroke="#ffffff"
                strokeWidth={2.6}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ) : (
              <path
                d={COURT_ZONE_PATHS[selected.id]}
                fill="none"
                stroke="#ffffff"
                strokeWidth={2.6}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )
          ) : null}
          <g pointerEvents="none" fontSize={11} fontWeight={800} textAnchor="middle">
            {SHOT_ORIGIN_ZONES.map((zone) => {
              const ours = counts?.[zone.id].ours ?? 0;
              const conceded = counts?.[zone.id].conceded ?? 0;
              if (ours === 0 && conceded === 0) return null;
              const anchor = COURT_ZONE_ANCHORS[zone.id];
              return (
                <text key={zone.id} x={anchor.x} y={anchor.y} dominantBaseline="middle">
                  {ours > 0 ? <tspan fill="#d9fbff">{ours}</tspan> : null}
                  {ours > 0 && conceded > 0 ? <tspan fill="rgba(255,255,255,0.55)"> · </tspan> : null}
                  {conceded > 0 ? <tspan fill="#ffd0d8">{conceded}</tspan> : null}
                </text>
              );
            })}
          </g>
          <defs>
            <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
              <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {children ? (
        <div data-testid="court-clock" className="relative z-20 mt-1 flex shrink-0 justify-center">
          <div className="rounded-full border border-white/25 bg-black/80 px-2 py-1 shadow-lg">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

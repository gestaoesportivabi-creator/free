import React, { useId } from 'react';
import { COURT_VIEWBOX } from '../../utils/shotCourtZones';
import {
  HEAT_CELLS,
  heatRampFill,
  heatRampInk,
  heatRampStep,
  type DensityPoint,
  type HeatCellCount,
} from '../../utils/finalizationHeatMap';

type FinalizationHeatCourtProps = {
  mode: 'zones' | 'continuous';
  counts: HeatCellCount;
  points: readonly DensityPoint[];
  className?: string;
};

export function FinalizationHeatCourt({ mode, counts, points, className = '' }: FinalizationHeatCourtProps) {
  const blurId = useId().replace(/:/g, '');
  const max = Math.max(1, ...HEAT_CELLS.map((cell) => counts[cell.id]), ...points.map((point) => point.n));

  return (
    <div className={`relative min-h-0 ${className}`} data-testid={`heat-court-${mode}`}>
      <svg
        viewBox={COURT_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={mode === 'zones' ? 'Mapa de finalizações por zonas' : 'Mapa contínuo de finalizações'}
      >
        <rect x={-18} y={-26} width={236} height={452} fill="#071422" />
        <rect x={0} y={0} width={200} height={400} fill="#0a3158" />

        {mode === 'zones'
          ? HEAT_CELLS.map((cell) => {
              const count = counts[cell.id];
              const step = heatRampStep(count, max);
              return (
                <g key={cell.id}>
                  <rect
                    x={cell.x}
                    y={cell.y}
                    width={cell.w}
                    height={cell.h}
                    fill={heatRampFill(step)}
                    opacity={step === 0 ? 0 : 0.82}
                  />
                  <text
                    x={cell.x + cell.w / 2}
                    y={cell.y + cell.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={22}
                    fontWeight={800}
                    fill={step === 0 ? 'rgba(248,250,252,0.45)' : heatRampInk(step)}
                  >
                    {count}
                  </text>
                </g>
              );
            })
          : null}

        {mode === 'continuous' ? (
          <g filter={`url(#${blurId})`}>
            {points.map((point) => {
              const step = heatRampStep(point.n, max);
              return (
                <circle
                  key={`${point.x}-${point.y}`}
                  cx={point.x}
                  cy={point.y}
                  r={16 + point.n * 7}
                  fill={heatRampFill(step)}
                  opacity={0.9}
                />
              );
            })}
          </g>
        ) : null}

        <g fill="none" stroke="#f4f7fb" strokeWidth={1.7} strokeLinejoin="miter" pointerEvents="none">
          <rect x={0.9} y={0.9} width={198.2} height={398.2} />
          <line x1={0} y1={200} x2={200} y2={200} />
          <circle cx={100} cy={200} r={30} />
          <path d="M 25 0 A 60 60 0 0 0 85 60 L 115 60 A 60 60 0 0 0 175 0" />
          <path d="M 25 400 A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 175 400" />
          <path d="M 85 0 V -11 H 115 V 0" strokeWidth={2.2} />
          <path d="M 85 400 V 411 H 115 V 400" strokeWidth={2.2} />
        </g>
        <g pointerEvents="none" fill="#f4f7fb">
          <circle cx={100} cy={200} r={2.2} />
          <circle cx={100} cy={60} r={2.4} />
          <circle cx={100} cy={100} r={2.4} />
          <circle cx={100} cy={300} r={2.4} />
          <circle cx={100} cy={340} r={2.4} />
        </g>
        <g pointerEvents="none" fill="#dbeafe" fontSize={8} fontWeight={700} textAnchor="middle">
          <text x={100} y={-15}>ATAQUE</text>
          <text x={100} y={426}>NOSSA DEFESA</text>
        </g>
        <defs>
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

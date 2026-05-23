import React from 'react';
import {
  WELLNESS_DIMENSIONS,
  WELLNESS_DIMENSION_KEYS,
  type WellnessDimensionKey,
} from '../WellnessTab';

const SCALE_HIGHER_IS_BETTER = [
  { value: 1, label: 'Muito ruim', color: 'bg-red-500' },
  { value: 2, label: 'Ruim', color: 'bg-orange-500' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-emerald-400' },
  { value: 5, label: 'Muito bom', color: 'bg-emerald-500' },
];

const SCALE_LOWER_IS_BETTER = [
  { value: 1, label: 'Muito ruim', color: 'bg-emerald-500' },
  { value: 2, label: 'Ruim', color: 'bg-emerald-400' },
  { value: 3, label: 'Regular', color: 'bg-amber-400' },
  { value: 4, label: 'Bom', color: 'bg-orange-500' },
  { value: 5, label: 'Muito bom', color: 'bg-red-500' },
];

const LOWER_IS_BETTER = new Set<WellnessDimensionKey>(['stress', 'dor']);

function scaleFor(dim: WellnessDimensionKey) {
  return LOWER_IS_BETTER.has(dim) ? SCALE_LOWER_IS_BETTER : SCALE_HIGHER_IS_BETTER;
}

export interface WellnessValues {
  stress?: number;
  sono?: number;
  humor?: number;
  dor?: number;
  satisfacao?: number;
}

interface WellnessScaleProps {
  values: WellnessValues;
  onChange: (key: WellnessDimensionKey, value: number) => void;
  compact?: boolean;
}

export const WellnessScale: React.FC<WellnessScaleProps> = ({ values, onChange, compact }) => {
  return (
    <div className="space-y-6">
      {WELLNESS_DIMENSIONS.map((dim) => (
        <div key={dim.key}>
          <p className={`font-bold text-white mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="mr-2">{dim.emoji}</span>
            {dim.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {scaleFor(dim.key).map((opt) => {
              const selected = values[dim.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(dim.key, opt.value)}
                  className={`flex-1 min-w-[3.5rem] py-3 px-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${
                    selected
                      ? `${opt.color} border-white text-black scale-105`
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export { WELLNESS_DIMENSION_KEYS };

import React, { useMemo, useState, useEffect } from 'react';
import { Moon, Activity } from 'lucide-react';
import { WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { QUALIDADE_SONO_STORAGE_KEY } from './QualidadeSonoTab';

const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type StoredSono = Record<string, Record<string, number>>;
type StoredPse = Record<string, Record<string, number>>;

type ChampionshipMatchForAlert = { date: string };

interface DashboardConditionCardProps {
  schedules: WeeklySchedule[];
  championshipMatches: ChampionshipMatchForAlert[];
}

function isMorningTime(timeStr: string): boolean {
  if (!timeStr || !timeStr.trim()) return false;
  const [h] = timeStr.split(':').map(Number);
  return (h ?? 0) < 12;
}

function teamAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export const DashboardConditionCard: React.FC<DashboardConditionCardProps> = ({
  schedules = [],
  championshipMatches = [],
}) => {
  const [sonoStored, setSonoStored] = useState<StoredSono>({});
  const [pseTreinos, setPseTreinos] = useState<StoredPse>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (s) setSonoStored(JSON.parse(s));
      const p = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (p) setPseTreinos(JSON.parse(p));
    } catch (_) {}
  }, []);

  const vigentSonoKeys = useMemo(() => {
    const keys = new Set<string>();
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      (s) => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
    );
    active.forEach((s) => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach((day) => {
          const act = (day?.activity || '').trim();
          if (act !== 'Treino' && act !== 'Musculação') return;
          const date = day?.date || '';
          const time = day?.time || '00:00';
          if (!date || !isMorningTime(time)) return;
          keys.add(`treino_${date}`);
        });
      } catch (_) {}
    });
    (Array.isArray(championshipMatches) ? championshipMatches : []).forEach((m) => {
      if (m?.date) keys.add(`jogo_${m.date}`);
    });
    return keys;
  }, [schedules, championshipMatches]);

  const vigentPseKeys = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      (s) => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
    );
    active.forEach((s) => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach((day) => {
          const act = (day?.activity || '').trim();
          if (act !== 'Treino' && act !== 'Musculação') return;
          const date = day?.date || '';
          const time = day?.time || '00:00';
          const key = `${date}_${time}_${act}`;
          if (!date || seen.has(key)) return;
          seen.add(key);
          keys.push(key);
        });
      } catch (_) {}
    });
    return keys;
  }, [schedules]);

  const { avgPse, avgSono, status } = useMemo(() => {
    const sonoAverages: number[] = [];
    vigentSonoKeys.forEach((eventKey) => {
      const data = sonoStored[eventKey];
      if (!data) return;
      const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);
      const avg = teamAvg(values);
      if (avg != null) sonoAverages.push(avg);
    });
    const avgSono = sonoAverages.length > 0 ? teamAvg(sonoAverages) : null;

    const pseAverages: number[] = [];
    vigentPseKeys.forEach((sessionKey) => {
      const data = pseTreinos[sessionKey];
      if (!data) return;
      const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
      const avg = teamAvg(values);
      if (avg != null) pseAverages.push(avg);
    });
    const avgPse = pseAverages.length > 0 ? teamAvg(pseAverages) : null;

    let status = 'Sem dados recentes';
    if (avgPse != null && avgSono != null) {
      if (avgSono < 3 && avgPse >= 7) status = 'Atenção: recuperação e carga';
      else if (avgPse >= 7) status = 'Carga elevada';
      else if (avgPse >= 4 && avgPse < 7 && (avgSono ?? 0) >= 4) status = 'Carga moderada · Recuperação adequada';
      else if (avgPse >= 4 && avgPse < 7) status = 'Carga moderada';
      else if ((avgSono ?? 0) >= 4) status = 'Recuperação adequada';
      else status = 'Monitorar recuperação';
    } else if (avgPse != null) {
      if (avgPse >= 7) status = 'Carga elevada';
      else if (avgPse >= 4) status = 'Carga moderada';
      else status = 'Carga baixa';
    } else if (avgSono != null) {
      if (avgSono >= 4) status = 'Recuperação adequada';
      else if (avgSono >= 3) status = 'Sono regular';
      else status = 'Monitorar sono';
    }

    return { avgPse, avgSono, status };
  }, [vigentSonoKeys, vigentPseKeys, sonoStored, pseTreinos]);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-medium mb-3">
        Condição física da equipe
      </p>
      <div className="h-px bg-white/[0.06] mb-3" />
      <div className="flex flex-wrap items-center gap-6">
        {avgPse != null && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400 text-xs">PSE médio</span>
            <span className="text-white font-semibold text-sm">{avgPse}</span>
            <span className="text-zinc-500 text-xs">/10</span>
          </div>
        )}
        {avgSono != null && (
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400 text-xs">Sono médio</span>
            <span className="text-white font-semibold text-sm">{avgSono}</span>
            <span className="text-zinc-500 text-xs">/5</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <span className="text-zinc-500">Status:</span>
          <span className="text-white/90">{status}</span>
        </div>
      </div>
    </div>
  );
};

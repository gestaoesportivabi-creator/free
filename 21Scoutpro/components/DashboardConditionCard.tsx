import React, { useMemo, useState, useEffect } from 'react';
import { Moon, Activity, Heart } from 'lucide-react';
import { WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { QUALIDADE_SONO_STORAGE_KEY } from './QualidadeSonoTab';

const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const PSR_TREINOS_STORAGE_KEY = 'scout21_psr_treinos';
const PSR_JOGOS_STORAGE_KEY = 'scout21_psr_jogos';

type StoredSono = Record<string, Record<string, number>>;
type StoredPse = Record<string, Record<string, number>>;
type StoredPsr = Record<string, Record<string, number>>;

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
  const [psrTreinos, setPsrTreinos] = useState<StoredPsr>({});
  const [psrJogos, setPsrJogos] = useState<StoredPsr>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (s) setSonoStored(JSON.parse(s));
      const p = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (p) setPseTreinos(JSON.parse(p));
      const pr = localStorage.getItem(PSR_TREINOS_STORAGE_KEY);
      if (pr) setPsrTreinos(JSON.parse(pr));
      const pj = localStorage.getItem(PSR_JOGOS_STORAGE_KEY);
      if (pj) setPsrJogos(JSON.parse(pj));
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

  const { avgPse, avgPsr, avgSono, status, alertKind } = useMemo(() => {
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

    const psrValues: number[] = [];
    Object.values(psrTreinos).forEach((data) => {
      Object.values(data).forEach((v) => {
        if (typeof v === 'number' && v >= 0 && v <= 10) psrValues.push(v);
      });
    });
    Object.values(psrJogos).forEach((data) => {
      Object.values(data).forEach((v) => {
        if (typeof v === 'number' && v >= 0 && v <= 10) psrValues.push(v);
      });
    });
    const avgPsr = psrValues.length > 0 ? teamAvg(psrValues) : null;

    let status = 'Sem dados recentes';
    let alertKind: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
    if (avgPse != null || avgPsr != null || avgSono != null) {
      if (avgSono != null && avgSono < 3 && (avgPse ?? 0) >= 7) {
        status = 'Atenção: recuperação insuficiente e carga elevada. Vale monitorar sono e volume.';
        alertKind = 'warning';
      } else if ((avgPse ?? 0) >= 7) {
        status = 'Carga elevada. Boa recuperação entre sessões.';
        alertKind = (avgSono ?? 0) >= 4 ? 'success' : 'info';
      } else if ((avgPse ?? 0) >= 4 && (avgPse ?? 0) < 7 && (avgSono ?? 0) >= 4) {
        status = 'Carga moderada e recuperação adequada.';
        alertKind = 'success';
      } else if ((avgPse ?? 0) >= 4 && (avgPse ?? 0) < 7) {
        status = 'Carga moderada. Acompanhar recuperação.';
        alertKind = 'info';
      } else if ((avgSono ?? 0) >= 4) {
        status = 'Recuperação adequada.';
        alertKind = 'success';
      } else if (avgSono != null && avgSono < 3) {
        status = 'Monitorar qualidade do sono.';
        alertKind = 'warning';
      } else {
        status = 'Dados insuficientes para interpretação. Preencha PSE, PSR e Sono nas abas de Fisiologia.';
        alertKind = 'neutral';
      }
    }

    return { avgPse, avgPsr, avgSono, status, alertKind };
  }, [vigentSonoKeys, vigentPseKeys, sonoStored, pseTreinos, psrTreinos, psrJogos]);

  const alertBg = alertKind === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : alertKind === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : alertKind === 'info' ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/[0.04] border-white/[0.08]';

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-medium mb-3">
        Condição física da equipe
      </p>
      <div className="h-px bg-white/[0.06] mb-3" />
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-3">
        {avgPse != null && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400 text-xs">PSE</span>
            <span className="text-white font-semibold text-sm">{avgPse}</span>
            <span className="text-zinc-500 text-xs">/10</span>
          </div>
        )}
        {avgPsr != null && (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400 text-xs">PSR</span>
            <span className="text-white font-semibold text-sm">{avgPsr}</span>
            <span className="text-zinc-500 text-xs">/10</span>
          </div>
        )}
        {avgSono != null && (
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400 text-xs">Sono</span>
            <span className="text-white font-semibold text-sm">{avgSono}</span>
            <span className="text-zinc-500 text-xs">/5</span>
          </div>
        )}
      </div>
      <div className={`rounded-lg border px-3 py-2.5 ${alertBg}`}>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Alerta interpretativo</p>
        <p className="text-zinc-200 text-sm">{status}</p>
      </div>
    </div>
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { Moon, Activity } from 'lucide-react';
import { WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { QUALIDADE_SONO_STORAGE_KEY } from './QualidadeSonoTab';

const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type StoredSono = Record<string, Record<string, number>>;
type StoredPseTreinos = Record<string, Record<string, number>>;

type ChampionshipMatchForAlert = { date: string };

interface SleepAndPseAlertsProps {
  schedules: WeeklySchedule[];
  championshipMatches: ChampionshipMatchForAlert[];
}

function isMorningTime(timeStr: string): boolean {
  if (!timeStr || !timeStr.trim()) return false;
  const [h] = timeStr.split(':').map(Number);
  return (h ?? 0) < 12;
}

function teamAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export const SleepAndPseAlerts: React.FC<SleepAndPseAlertsProps> = ({
  schedules = [],
  championshipMatches = [],
}) => {
  const [sonoStored, setSonoStored] = useState<StoredSono>({});
  const [pseTreinosStored, setPseTreinosStored] = useState<StoredPseTreinos>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (s) setSonoStored(JSON.parse(s));
      const p = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (p) setPseTreinosStored(JSON.parse(p));
    } catch (_) {}
  }, []);

  const vigentSonoKeys = useMemo(() => {
    const keys = new Set<string>();
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      s => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
    );
    active.forEach(s => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach(day => {
          const act = (day?.activity || '').trim();
          if (act !== 'Treino' && act !== 'Musculação') return;
          const date = day?.date || '';
          const time = day?.time || '00:00';
          if (!date || !isMorningTime(time)) return;
          keys.add(`treino_${date}`);
        });
      } catch (_) {}
    });
    (Array.isArray(championshipMatches) ? championshipMatches : []).forEach(m => {
      if (m?.date) keys.add(`jogo_${m.date}`);
    });
    return keys;
  }, [schedules, championshipMatches]);

  const vigentPseSessionKeys = useMemo(() => {
    const keys: string[] = [];
    const active = (Array.isArray(schedules) ? schedules : []).filter(
      s => s && (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true')
    );
    const seen = new Set<string>();
    active.forEach(s => {
      try {
        const flat = normalizeScheduleDays(s);
        flat.forEach(day => {
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

  const { sonoPhrase, psePhrase } = useMemo(() => {
    let sonoPhrase: string | null = null;
    let psePhrase: string | null = null;

    const sonoAverages: number[] = [];
    vigentSonoKeys.forEach(eventKey => {
      const data = sonoStored[eventKey];
      if (!data) return;
      const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);
      const avg = teamAverage(values);
      if (avg != null) sonoAverages.push(avg);
    });
    if (sonoAverages.length > 0) {
      const media = teamAverage(sonoAverages) ?? 0;
      const n = sonoAverages.length;
      if (media >= 4) {
        sonoPhrase = `Na programação vigente, a qualidade de sono da equipe está boa: média de ${media} (escala 1-5) em ${n} noite${n > 1 ? 's' : ''} avaliada${n > 1 ? 's' : ''}.`;
      } else if (media >= 3) {
        sonoPhrase = `Na programação vigente, a qualidade de sono da equipe apresentou média de ${media} (escala 1-5) em ${n} noite${n > 1 ? 's' : ''} avaliada${n > 1 ? 's' : ''}.`;
      } else {
        sonoPhrase = `Atenção: na programação vigente a média de qualidade de sono da equipe foi de ${media} (escala 1-5) em ${n} noite${n > 1 ? 's' : ''} avaliada${n > 1 ? 's' : ''}. Vale monitorar a recuperação.`;
      }
    }

    const pseAverages: number[] = [];
    vigentPseSessionKeys.forEach(sessionKey => {
      const data = pseTreinosStored[sessionKey];
      if (!data) return;
      const values = Object.values(data).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
      const avg = teamAverage(values);
      if (avg != null) pseAverages.push(avg);
    });
    if (pseAverages.length > 0) {
      const media = teamAverage(pseAverages) ?? 0;
      const n = pseAverages.length;
      if (media >= 7) {
        psePhrase = `A média PSE (treinos) da equipe na programação vigente é de ${media} (escala 0-10) em ${n} sessão${n > 1 ? 'ões' : 'ão'}, indicando boa carga percebida.`;
      } else if (media >= 4) {
        psePhrase = `Na programação vigente, a média PSE (treinos) da equipe foi de ${media} (escala 0-10) em ${n} sessão${n > 1 ? 'ões' : 'ão'}.`;
      } else {
        psePhrase = `A média PSE (treinos) da equipe na programação vigente é de ${media} (escala 0-10) em ${n} sessão${n > 1 ? 'ões' : 'ão'}.`;
      }
    }

    return { sonoPhrase, psePhrase };
  }, [vigentSonoKeys, vigentPseSessionKeys, sonoStored, pseTreinosStored]);

  if (!sonoPhrase && !psePhrase) return null;

  return (
    <>
      {sonoPhrase && (
        <div className="rounded-lg border border-zinc-600 bg-zinc-800/80 border-l-4 border-l-slate-500 px-3 py-2.5">
          <div className="flex items-start gap-2 text-xs">
            <Moon className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0" />
            <div className="min-w-0">
              <span className="text-zinc-200 font-semibold block mb-0.5">Qualidade de sono</span>
              <span className="text-zinc-500 text-[11px] leading-snug line-clamp-2">{sonoPhrase}</span>
            </div>
          </div>
        </div>
      )}
      {psePhrase && (
        <div className="rounded-lg border border-zinc-600 bg-zinc-800/80 border-l-4 border-l-slate-500 px-3 py-2.5">
          <div className="flex items-start gap-2 text-xs">
            <Activity className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0" />
            <div className="min-w-0">
              <span className="text-zinc-200 font-semibold block mb-0.5">PSE – Treinos</span>
              <span className="text-zinc-500 text-[11px] leading-snug line-clamp-2">{psePhrase}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

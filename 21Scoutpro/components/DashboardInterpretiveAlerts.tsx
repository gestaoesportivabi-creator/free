import React, { useMemo, useState, useEffect } from 'react';
import { AlertCircle, Moon, Activity, AlertTriangle } from 'lucide-react';
import { Player, WeeklySchedule } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { QUALIDADE_SONO_STORAGE_KEY } from './QualidadeSonoTab';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type RiskLevel = 'green' | 'yellow' | 'red';

export type InterpretiveAlert = {
  phrase: string;
  risk: RiskLevel;
  icon?: 'sleep' | 'pse' | 'injury' | 'general';
};

type StoredSono = Record<string, Record<string, number>>;
type StoredPse = Record<string, Record<string, number>>;

type ChampionshipMatchForAlert = { date: string };

interface DashboardInterpretiveAlertsProps {
  players: Player[];
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

export const DashboardInterpretiveAlerts: React.FC<DashboardInterpretiveAlertsProps> = ({
  players,
  schedules = [],
  championshipMatches = [],
}) => {
  const [sonoStored, setSonoStored] = useState<StoredSono>({});
  const [pseJogos, setPseJogos] = useState<StoredPse>({});
  const [pseTreinos, setPseTreinos] = useState<StoredPse>({});

  useEffect(() => {
    const load = () => {
      try {
        const s = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
        if (s) setSonoStored(JSON.parse(s));
        const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
        if (j) setPseJogos(JSON.parse(j));
        const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
        if (t) setPseTreinos(JSON.parse(t));
      } catch (_) {}
    };
    load();
    window.addEventListener('wellness-updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('wellness-updated', load);
      window.removeEventListener('storage', load);
    };
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

  const alerts = useMemo((): InterpretiveAlert[] => {
    const list: InterpretiveAlert[] = [];

    const injuredCount = players.filter((p) => {
      if (!p.injuryHistory?.length) return false;
      return p.injuryHistory.some((inj) => !(inj.returnDateActual || inj.endDate));
    }).length;

    if (injuredCount > 0) {
      list.push({
        phrase: `${injuredCount} atleta${injuredCount !== 1 ? 's' : ''} em recuperação. Acompanhar evolução no departamento médico.`,
        risk: injuredCount >= 3 ? 'red' : 'yellow',
        icon: 'injury',
      });
    }

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
    Object.values(pseJogos).forEach((byPlayer) => {
      const values = Object.values(byPlayer).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10);
      const avg = teamAvg(values);
      if (avg != null) pseAverages.push(avg);
    });
    const avgPse = pseAverages.length > 0 ? teamAvg(pseAverages) : null;

    if (avgSono != null) {
      if (avgSono >= 4) {
        list.push({
          phrase: `Qualidade de sono da equipe em boa média (${avgSono}/5). Recuperação adequada.`,
          risk: 'green',
          icon: 'sleep',
        });
      } else if (avgSono >= 3) {
        list.push({
          phrase: `Sono médio em ${avgSono}/5. Monitorar recuperação antes do próximo compromisso.`,
          risk: 'yellow',
          icon: 'sleep',
        });
      } else {
        list.push({
          phrase: `Atenção: média de sono baixa (${avgSono}/5). Avaliar carga e descanso.`,
          risk: 'red',
          icon: 'sleep',
        });
      }
    }

    if (avgPse != null) {
      if (avgPse >= 7.5) {
        list.push({
          phrase: `PSE médio elevado (${avgPse}/10). Considerar recuperação ativa ou carga reduzida.`,
          risk: avgPse >= 8.5 ? 'red' : 'yellow',
          icon: 'pse',
        });
      } else if (avgPse >= 4 && avgPse < 7) {
        list.push({
          phrase: `PSE médio em nível adequado (${avgPse}/10). Carga dentro do esperado.`,
          risk: 'green',
          icon: 'pse',
        });
      } else if (avgPse < 4 && pseAverages.length >= 3) {
        list.push({
          phrase: `PSE médio baixo (${avgPse}/10). Equipe possivelmente subcarregada ou em recuperação.`,
          risk: 'yellow',
          icon: 'pse',
        });
      }
    }

    if (avgSono != null && avgPse != null && avgSono < 3.5 && avgPse >= 7) {
      list.push({
        phrase: 'Sono baixo com PSE alto: priorizar recuperação e evitar sobrecarga.',
        risk: 'red',
        icon: 'general',
      });
    }

    // P6: ACWR alerts per athlete
    const today = new Date();
    const d7 = new Date(today); d7.setDate(d7.getDate() - 7);
    const d28 = new Date(today); d28.setDate(d28.getDate() - 28);

    const allPseDates: { date: string; data: Record<string, number> }[] = [];
    Object.entries(pseTreinos).forEach(([key, data]) => {
      const dt = key.split('_')[0];
      if (dt) allPseDates.push({ date: dt, data });
    });
    Object.entries(pseJogos).forEach(([, data]) => {
      allPseDates.push({ date: today.toISOString().split('T')[0], data });
    });

    const acwrRiskPlayers: string[] = [];
    players.filter(p => !p.isTransferred).forEach(p => {
      let acute = 0, ac = 0, chronic = 0, cc = 0;
      allPseDates.forEach(({ date, data }) => {
        const d = new Date(date);
        const v = data[p.id];
        if (typeof v !== 'number') return;
        if (d >= d7) { acute += v; ac++; }
        if (d >= d28) { chronic += v; cc++; }
      });
      const acuteAvg = ac > 0 ? acute / ac : 0;
      const chronicAvg = cc > 0 ? chronic / cc : 0;
      if (chronicAvg > 0) {
        const acwr = acuteAvg / chronicAvg;
        if (acwr > 1.5) acwrRiskPlayers.push(p.nickname || p.name);
      }
    });

    if (acwrRiskPlayers.length > 0) {
      list.push({
        phrase: `ACWR elevado (>1.5) em: ${acwrRiskPlayers.slice(0, 3).join(', ')}${acwrRiskPlayers.length > 3 ? ` +${acwrRiskPlayers.length - 3}` : ''}. Risco de lesão aumentado.`,
        risk: 'red',
        icon: 'injury',
      });
    }

    // Monotonia alert: if PSE std deviation < 0.5 over 5+ sessions
    if (pseAverages.length >= 5) {
      const mean = pseAverages.reduce((a, b) => a + b, 0) / pseAverages.length;
      const variance = pseAverages.reduce((acc, v) => acc + Math.pow((v || 0) - mean, 2), 0) / pseAverages.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev < 0.5) {
        list.push({
          phrase: `Monotonia de treino detectada (variação PSE < 0.5). Diversificar intensidades.`,
          risk: 'yellow',
          icon: 'pse',
        });
      }
    }

    // Chronic sleep alert: last 3 sono averages < 3
    const lastSonoAvgs = sonoAverages.slice(-3);
    if (lastSonoAvgs.length >= 3 && lastSonoAvgs.every(v => v < 3)) {
      list.push({
        phrase: `Sono crônico insuficiente (média <3 nas últimas 3 sessões). Intervenção necessária.`,
        risk: 'red',
        icon: 'sleep',
      });
    }

    return list;
  }, [players, vigentSonoKeys, vigentPseKeys, sonoStored, pseJogos, pseTreinos]);

  if (alerts.length === 0) return null;

  const riskStyles = {
    green: 'bg-zinc-800/80 border-zinc-600 text-zinc-200 border-l-4 border-l-emerald-600',
    yellow: 'bg-zinc-800/80 border-zinc-600 text-zinc-200 border-l-4 border-l-amber-600',
    red: 'bg-zinc-800/80 border-zinc-600 text-zinc-200 border-l-4 border-l-red-600',
  };

  const Icon = ({ icon }: { icon?: InterpretiveAlert['icon'] }) => {
    if (icon === 'sleep') return <Moon size={14} className="flex-shrink-0 text-zinc-400" />;
    if (icon === 'pse') return <Activity size={14} className="flex-shrink-0 text-zinc-400" />;
    if (icon === 'injury') return <AlertTriangle size={14} className="flex-shrink-0 text-zinc-400" />;
    return <AlertCircle size={14} className="flex-shrink-0 text-zinc-400" />;
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-3">Indicadores de risco e recuperação</p>
      <ul className="space-y-2">
        {alerts.map((a, i) => (
          <li
            key={i}
            className={`rounded-r border px-3 py-2 text-xs ${riskStyles[a.risk]}`}
          >
            <div className="flex items-start gap-2">
              <Icon icon={a.icon} />
              <span>{a.phrase}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Activity, Moon, UserX, UserCheck } from 'lucide-react';
import { Player } from '../types';
import { Championship } from '../types';
import { getPlayerStatus } from '../utils/championshipCards';
import { QUALIDADE_SONO_STORAGE_KEY } from './QualidadeSonoTab';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';

type StoredSono = Record<string, Record<string, number>>;
type StoredPse = Record<string, Record<string, number>>;

export type NextMatchInfo = {
  id?: string;
  date: string;
  time?: string;
  team?: string;
  opponent: string;
  competition?: string;
  dateTime?: Date;
} | null;

interface DashboardNextGameCardProps {
  nextMatch: NextMatchInfo;
  championships: Championship[];
  players: Player[];
}

function teamAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export const DashboardNextGameCard: React.FC<DashboardNextGameCardProps> = ({
  nextMatch,
  championships,
  players,
}) => {
  const [sonoStored, setSonoStored] = useState<StoredSono>({});
  const [pseJogos, setPseJogos] = useState<StoredPse>({});
  const [pseTreinos, setPseTreinos] = useState<StoredPse>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
      if (s) setSonoStored(JSON.parse(s));
      const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
      if (j) setPseJogos(JSON.parse(j));
      const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (t) setPseTreinos(JSON.parse(t));
    } catch (_) {}
  }, []);

  const { suspended, pendurados, availableCount, avgPse, avgSono } = useMemo(() => {
    let suspended: Player[] = [];
    let pendurados: Player[] = [];
    const hasActiveInjury = (p: Player): boolean => {
      if (!p.injuryHistory?.length) return false;
      return p.injuryHistory.some((inj) => !(inj.returnDateActual || inj.endDate));
    };

    if (nextMatch?.competition && championships?.length) {
      const champ = championships.find((c) => c.name === nextMatch.competition);
      if (champ?.suspensionRules) {
        const rules = champ.suspensionRules;
        players.forEach((p) => {
          const status = getPlayerStatus(champ.id, p.id, rules);
          if (status.suspended) suspended.push(p);
          else if (status.pendurado) pendurados.push(p);
        });
      }
    }
    const injuredCount = players.filter(hasActiveInjury).length;
    const availableCount = players.length - suspended.length - injuredCount;
    let avgPse: number | null = null;
    let avgSono: number | null = null;

    const pseValues: number[] = [];
    Object.values(pseJogos).forEach((byPlayer) => {
      Object.values(byPlayer).forEach((v) => {
        if (typeof v === 'number' && v >= 0 && v <= 10) pseValues.push(v);
      });
    });
    Object.values(pseTreinos).forEach((byPlayer) => {
      Object.values(byPlayer).forEach((v) => {
        if (typeof v === 'number' && v >= 0 && v <= 10) pseValues.push(v);
      });
    });
    if (pseValues.length > 0) avgPse = teamAvg(pseValues);

    const sonoValues: number[] = [];
    Object.values(sonoStored).forEach((byPlayer) => {
      Object.values(byPlayer).forEach((v) => {
        if (typeof v === 'number' && v >= 1 && v <= 5) sonoValues.push(v);
      });
    });
    if (sonoValues.length > 0) avgSono = teamAvg(sonoValues);

    return { suspended, pendurados, availableCount, avgPse, avgSono };
  }, [nextMatch, championships, players, pseJogos, pseTreinos, sonoStored]);

  if (!nextMatch) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-zinc-900/40 p-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-2">
          <Trophy className="text-zinc-500" size={14} />
          Próximo jogo
        </h3>
        <p className="text-zinc-500 text-xs">Nenhum jogo agendado.</p>
      </div>
    );
  }

  const dateLabel = nextMatch.date
    ? new Date(nextMatch.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    : '—';
  const timeLabel = nextMatch.time ? nextMatch.time.slice(0, 5) : '';

  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/40 p-4">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-zinc-500" />
        Próximo jogo
      </h3>
      <div className="mb-3">
        <p className="text-white font-medium text-sm">
          {nextMatch.team || 'Time'} x {nextMatch.opponent}
        </p>
        <p className="text-zinc-400 text-[11px] mt-0.5 flex items-center gap-1.5">
          <Calendar size={12} /> {dateLabel} {timeLabel && `· ${timeLabel}`}
        </p>
        {nextMatch.competition && (
          <p className="text-zinc-500 text-[11px] mt-0.5">{nextMatch.competition}</p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 flex items-center gap-1">
            <Users size={12} /> Impacto no elenco
          </span>
          <span className="text-zinc-400">{availableCount} disp. · {suspended.length} susp. · {pendurados.length} pend.</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {avgPse != null && (
            <span className="flex items-center gap-1 text-zinc-400">
              <Activity size={12} /> PSE <strong className="text-white/90">{avgPse}</strong>/10
            </span>
          )}
          {avgSono != null && (
            <span className="flex items-center gap-1 text-zinc-400">
              <Moon size={12} /> Sono <strong className="text-white/90">{avgSono}</strong>/5
            </span>
          )}
        </div>
        {suspended.length > 0 && (
          <div className="flex items-start gap-1.5 text-[10px] text-zinc-500 opacity-80">
            <UserX className="flex-shrink-0 mt-0.5" size={12} />
            <span>Suspensos: {suspended.map((p) => p.nickname || p.name).join(', ')}</span>
          </div>
        )}
        {pendurados.length > 0 && (
          <div className="flex items-start gap-1.5 text-[10px] text-zinc-500 opacity-80">
            <UserCheck className="flex-shrink-0 mt-0.5" size={12} />
            <span>Pendurados: {pendurados.map((p) => p.nickname || p.name).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

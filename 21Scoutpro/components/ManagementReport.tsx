import React, { useEffect, useMemo, useState } from 'react';
import { Player, MatchRecord, PhysicalAssessment, PlayerTimeControl, MatchStats, InjuryRecord } from '../types';
import { FileText, Calendar, User, Download, Activity, Trophy, AlertTriangle, BarChart3, Users, HeartPulse, Rotate3d, Brain } from 'lucide-react';
import html2canvas from 'html2canvas';
import { WELLNESS_STORAGE_KEY, WELLNESS_DIMENSIONS, WELLNESS_IDEAL_VALUES } from './WellnessTab';
import { wellnessClosenessScore, wellnessRealRadarColors } from '../utils/wellnessRadarColors';
import { buildWellnessEngagementAlerts } from '../utils/wellnessEngagementAlerts';
import { buildHeatmapCallouts, type HeatmapCalloutData, type OutwardDir } from '../utils/physiologyHeatmapMap';
import { postMatchEventClockToAbsoluteSeconds } from '../utils/matchPeriod';
import { exportManagementReportPdf } from '../utils/exportManagementReportPdf';
import { classifyBodyFatReference, type BodyFatReferenceBand } from './PhysicalAssessment';
import { RadarChart, Radar, PolarGrid, PolarRadiusAxis, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const PSR_JOGOS_STORAGE_KEY = 'scout21_psr_jogos';
const PSR_TREINOS_STORAGE_KEY = 'scout21_psr_treinos';

interface ManagementReportProps {
  players: Player[];
  matches: MatchRecord[];
  assessments: PhysicalAssessment[];
  timeControls?: PlayerTimeControl[];
}

type WellnessRadarChartRow = {
  key: string;
  subject: string;
  shortLabel: string;
  value: number;
  avg: number | null;
  avgLabel: string;
};

const cardBase = 'bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg';
const GOAL_BY_PERIOD_LABELS = [
  '00:00 - 05:00',
  '05:01 - 10:00',
  '10:01 - 15:00',
  '15:01 - 20:00',
  '20:01 - 25:00',
  '25:01 - 30:00',
  '30:01 - 35:00',
  '35:01 - 40:00',
  '40:01 - 45:00',
  '45:01 - 50:00',
] as const;
const SET_PIECE_METHODS = ['ESCANTEIO', 'FALTAS', 'PÊNALTI', 'TIRO LIVRE', 'LATERAIS'];

const HeatCallout: React.FC<HeatmapCalloutData> = ({ x, y, outward, regionLabel, count }) => {
  const lineLen = 34;
  const stroke = '#ef4444';
  const countText = `${count} ${count === 1 ? 'lesão' : 'lesões'}`;
  const styleByDir: Record<OutwardDir, React.CSSProperties> = {
    left: { right: lineLen + 8, top: '50%', transform: 'translateY(-50%)', textAlign: 'right' },
    right: { left: lineLen + 8, top: '50%', transform: 'translateY(-50%)', textAlign: 'left' },
    up: { bottom: lineLen + 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
    down: { top: lineLen + 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  };
  return (
    <div className="absolute pointer-events-none z-10" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
      {outward === 'left' || outward === 'right' ? (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 h-0.5" style={{ background: stroke, width: lineLen, [outward === 'left' ? 'right' : 'left']: 0 }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              [outward === 'left' ? 'right' : 'left']: lineLen,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              [outward === 'left' ? 'borderRight' : 'borderLeft']: `7px solid ${stroke}`,
            }}
          />
        </>
      ) : (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 w-0.5" style={{ background: stroke, height: lineLen, [outward === 'up' ? 'bottom' : 'top']: 0 }} />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              [outward === 'up' ? 'bottom' : 'top']: lineLen,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              [outward === 'up' ? 'borderBottom' : 'borderTop']: `7px solid ${stroke}`,
            }}
          />
        </>
      )}
      <div className="absolute z-20" style={styleByDir[outward]}>
        <div className="text-[10px] font-black whitespace-nowrap text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{regionLabel}</div>
        <div className="text-[9px] font-bold whitespace-nowrap text-red-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{countText}</div>
      </div>
    </div>
  );
};

export const ManagementReport: React.FC<ManagementReportProps> = ({ players, matches, assessments }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pseJogos, setPseJogos] = useState<Record<string, Record<string, number>>>({});
  const [pseTreinos, setPseTreinos] = useState<Record<string, Record<string, number>>>({});
  const [psrJogos, setPsrJogos] = useState<Record<string, Record<string, number>>>({});
  const [psrTreinos, setPsrTreinos] = useState<Record<string, Record<string, number>>>({});
  const [wellnessStored, setWellnessStored] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');

  useEffect(() => {
    try {
      const pj = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
      if (pj) setPseJogos(JSON.parse(pj));
      const pt = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
      if (pt) setPseTreinos(JSON.parse(pt));
      const rj = localStorage.getItem(PSR_JOGOS_STORAGE_KEY);
      if (rj) setPsrJogos(JSON.parse(rj));
      const rt = localStorage.getItem(PSR_TREINOS_STORAGE_KEY);
      if (rt) setPsrTreinos(JSON.parse(rt));
      const w = localStorage.getItem(WELLNESS_STORAGE_KEY);
      if (w) setWellnessStored(JSON.parse(w));
    } catch (_) {}
  }, []);

  const selectedPlayer = useMemo(() => players.find(p => p.id === selectedPlayerId), [players, selectedPlayerId]);

  const inRange = (d: string) => {
    const day = String(d || '').slice(0, 10);
    if (!day) return false;
    if (startDate && day < startDate) return false;
    if (endDate && day > endDate) return false;
    return true;
  };

  const filteredMatches = useMemo(() => {
    if (!selectedPlayerId) return [];
    return matches.filter(m => !!m.playerStats[selectedPlayerId] && inRange(m.date));
  }, [matches, selectedPlayerId, startDate, endDate]);

  const playerStats = useMemo(() => {
    if (!selectedPlayerId) return null;
    const s = filteredMatches.reduce(
      (acc, match) => {
        const p = match.playerStats[selectedPlayerId];
        if (!p) return acc;
        acc.games += 1;
        acc.minutes += p.minutesPlayed || 40;
        acc.goals += p.goals || 0;
        acc.assists += p.assists || 0;
        acc.shotsOnTarget += p.shotsOnTarget || 0;
        acc.shotsOffTarget += p.shotsOffTarget || 0;
        acc.passesCorrect += p.passesCorrect || 0;
        acc.passesWrong += p.passesWrong || 0;
        acc.tacklesWithBall += p.tacklesWithBall || 0;
        acc.tacklesWithoutBall += p.tacklesWithoutBall || 0;
        acc.tacklesCounterAttack += p.tacklesCounterAttack || 0;
        acc.wrongPassesTransition += (p as any).wrongPassesTransition || 0;
        return acc;
      },
      {
        games: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        passesCorrect: 0,
        passesWrong: 0,
        tacklesWithBall: 0,
        tacklesWithoutBall: 0,
        tacklesCounterAttack: 0,
        wrongPassesTransition: 0,
      }
    );
    return { ...s, avgMinutes: s.games > 0 ? Math.round(s.minutes / s.games) : 0 };
  }, [filteredMatches, selectedPlayerId]);

  const injuryInfo = useMemo(() => {
    if (!selectedPlayer) return null;
    const injuries = (selectedPlayer.injuryHistory || []).filter(i => inRange(i.startDate || i.date || ''));
    let totalDaysLost = 0;
    let recoveredInTime = 0;
    let recoveredLate = 0;
    const injuryTypes: Record<string, number> = {};
    injuries.forEach(i => {
      const type = i.type || 'Outros';
      injuryTypes[type] = (injuryTypes[type] || 0) + 1;
      const st = new Date(i.startDate || i.date || '');
      const end = i.endDate ? new Date(i.endDate) : i.returnDateActual ? new Date(i.returnDateActual) : new Date();
      totalDaysLost += i.daysOut || Math.max(0, Math.ceil((end.getTime() - st.getTime()) / (1000 * 60 * 60 * 24)));
      const actualYmd = ((i.returnDateActual || i.endDate || '') as string).toString().slice(0, 10);
      const expectedYmd = ((i.returnDate || '') as string).toString().slice(0, 10);
      if (actualYmd && expectedYmd) {
        if (actualYmd <= expectedYmd) recoveredInTime += 1;
        else recoveredLate += 1;
      }
    });
    const side = injuries.reduce(
      (acc, i) => {
        if (i.side === 'Direito') acc.direito += 1;
        else if (i.side === 'Esquerdo') acc.esquerdo += 1;
        else if (i.side === 'Bilateral') {
          acc.direito += 1;
          acc.esquerdo += 1;
        }
        return acc;
      },
      { direito: 0, esquerdo: 0 }
    );
    return { injuries, totalDaysLost, injuryTypes, recoveredInTime, recoveredLate, side };
  }, [selectedPlayer, startDate, endDate, filteredMatches]);

  const cardAndFoulStats = useMemo(() => {
    if (!selectedPlayerId) return { foulsCommitted: 0, yellowCards: 0, redCards: 0 };
    let foulsCommitted = 0;
    let yellowCards = 0;
    let redCards = 0;
    filteredMatches.forEach(match => {
      (match.postMatchEventLog || []).forEach(ev => {
        if (String(ev.playerId) !== String(selectedPlayerId)) return;
        if (ev.action === 'falta' && ev.foulTeam === 'for') foulsCommitted += 1;
        const t = `${ev.tipo || ''} ${ev.subtipo || ''}`.toLowerCase();
        if (t.includes('amarelo')) yellowCards += 1;
        if (t.includes('vermelho')) redCards += 1;
      });
    });
    return { foulsCommitted, yellowCards, redCards };
  }, [filteredMatches, selectedPlayerId]);

  const goalInsights = useMemo(() => {
    if (!selectedPlayerId) return { bestPeriod: '—', bestPeriodShare: null as number | null, topMethod: '—', topOrigin: '—' };
    const periodCount = new Array<number>(GOAL_BY_PERIOD_LABELS.length).fill(0);
    const methodCount: Record<string, number> = {};
    const originCount: Record<string, number> = {};
    let totalGoals = 0;
    filteredMatches.forEach(match => {
      (match.postMatchEventLog || []).forEach(ev => {
        if (String(ev.playerId) !== String(selectedPlayerId) || ev.action !== 'goal' || ev.isOpponentGoal) return;
        const absSec = postMatchEventClockToAbsoluteSeconds(ev.time || '', ev.period || '1T');
        if (absSec != null && absSec >= 0 && absSec <= 50 * 60) {
          const idx = absSec <= 300 ? 0 : Math.min(9, Math.floor((absSec - 1) / 300));
          periodCount[idx] += 1;
        }
        totalGoals += 1;
        const m = (ev.goalMethod || ev.subtipo || 'Não informado').trim();
        methodCount[m] = (methodCount[m] || 0) + 1;
        const normalized = m.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
        const isSetPiece = SET_PIECE_METHODS.some(sp => normalized.includes(sp.normalize('NFD').replace(/\p{M}/gu, '')));
        const o = isSetPiece ? 'Bola Parada' : 'Bola Rolando';
        originCount[o] = (originCount[o] || 0) + 1;
      });
    });
    const maxOf = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const maxVal = periodCount.length ? Math.max(...periodCount) : 0;
    const maxIdx = periodCount.findIndex(v => v === maxVal);
    const bestPeriod = maxVal > 0 && maxIdx >= 0 ? GOAL_BY_PERIOD_LABELS[maxIdx] : '—';
    const bestPeriodShare = totalGoals > 0 && maxVal > 0 ? Math.round((maxVal / totalGoals) * 10000) / 100 : null;
    return { bestPeriod, bestPeriodShare, topMethod: maxOf(methodCount), topOrigin: maxOf(originCount) };
  }, [filteredMatches, selectedPlayerId]);

  const avgPsePsr = useMemo(() => {
    if (!selectedPlayerId) return { avgPse: null as number | null, avgPsr: null as number | null };
    const pseVals: number[] = [];
    Object.values(pseJogos).forEach(v => typeof v[selectedPlayerId] === 'number' && pseVals.push(v[selectedPlayerId]));
    Object.values(pseTreinos).forEach(v => typeof v[selectedPlayerId] === 'number' && pseVals.push(v[selectedPlayerId]));
    const psrVals: number[] = [];
    Object.values(psrJogos).forEach(v => typeof v[selectedPlayerId] === 'number' && psrVals.push(v[selectedPlayerId]));
    Object.values(psrTreinos).forEach(v => typeof v[selectedPlayerId] === 'number' && psrVals.push(v[selectedPlayerId]));
    const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
    return { avgPse: avg(pseVals), avgPsr: avg(psrVals) };
  }, [selectedPlayerId, pseJogos, pseTreinos, psrJogos, psrTreinos]);

  const goalAssistDualities = useMemo(() => {
    if (!selectedPlayerId) return [];
    const sid = String(selectedPlayerId);
    const map = new Map<string, { partnerName: string; given: number; received: number }>();
    filteredMatches.forEach(match => {
      (match.postMatchEventLog || []).forEach(ev => {
        if (ev.action !== 'goal' || ev.isOpponentGoal || !ev.assistPlayerId) return;
        const scorer = String(ev.playerId);
        const assist = String(ev.assistPlayerId);
        if (scorer === assist) return;
        if (scorer === sid) {
          const cur = map.get(assist) || { partnerName: ev.assistPlayerName || 'Jogador', given: 0, received: 0 };
          cur.received += 1;
          map.set(assist, cur);
        } else if (assist === sid) {
          const cur = map.get(scorer) || { partnerName: ev.playerName || 'Jogador', given: 0, received: 0 };
          cur.given += 1;
          map.set(scorer, cur);
        }
      });
    });
    const rows = Array.from(map.entries()).map(([partnerId, v]) => ({
      partnerId,
      partnerName: players.find(p => p.id === partnerId)?.name || v.partnerName,
      goalsPartnerScoredWithMyAssist: v.given,
      goalsScoredWithPartnerAssist: v.received,
      total: v.given + v.received,
    }));
    rows.sort((a, b) => b.total - a.total || b.goalsPartnerScoredWithMyAssist - a.goalsPartnerScoredWithMyAssist);
    const uniqueByTotal = new Map<number, typeof rows[number]>();
    rows.forEach(r => {
      const prev = uniqueByTotal.get(r.total);
      if (!prev || r.goalsPartnerScoredWithMyAssist > prev.goalsPartnerScoredWithMyAssist) uniqueByTotal.set(r.total, r);
    });
    return Array.from(uniqueByTotal.values())
      .sort((a, b) => b.total - a.total || b.goalsPartnerScoredWithMyAssist - a.goalsPartnerScoredWithMyAssist)
      .slice(0, 3);
  }, [filteredMatches, selectedPlayerId, players]);

  const wellnessRadarPeriod = useMemo<WellnessRadarChartRow[]>(() => {
    if (!selectedPlayerId) return [];
    const dates = Object.keys(wellnessStored).filter(d => inRange(d)).sort();
    return WELLNESS_DIMENSIONS.map(dim => {
      const vals = dates
        .map(d => wellnessStored[d]?.[selectedPlayerId]?.[dim.key])
        .filter((x): x is number => typeof x === 'number');
      const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
      const shortLabel = dim.label.length > 18 ? `${dim.label.slice(0, 16)}…` : dim.label;
      return { key: dim.key, subject: dim.label, shortLabel, value: avg ?? 0, avg, avgLabel: avg != null ? `Ø ${avg}` : '—' };
    });
  }, [wellnessStored, selectedPlayerId, startDate, endDate]);

  const wellnessIdealRadarData = useMemo<WellnessRadarChartRow[]>(
    () =>
      WELLNESS_DIMENSIONS.map(dim => ({
        key: dim.key,
        subject: dim.label,
        shortLabel: dim.label.length > 18 ? `${dim.label.slice(0, 16)}…` : dim.label,
        value: WELLNESS_IDEAL_VALUES[dim.key],
        avg: WELLNESS_IDEAL_VALUES[dim.key],
        avgLabel: `Meta ${WELLNESS_IDEAL_VALUES[dim.key]}`,
      })),
    []
  );
  const hasWellness = wellnessRadarPeriod.some(r => r.avg !== null);
  const closeness = useMemo(() => wellnessClosenessScore(wellnessRadarPeriod.map(r => ({ key: r.key as any, avg: r.avg }))), [wellnessRadarPeriod]);
  const realRadarStyle = useMemo(() => wellnessRealRadarColors(closeness ?? 0), [closeness]);
  const wellnessAlerts = useMemo(() => buildWellnessEngagementAlerts(wellnessRadarPeriod.map(r => ({ key: r.key as any, subject: r.subject, avg: r.avg }))), [wellnessRadarPeriod]);

  const filteredAssessments = useMemo(
    () =>
      selectedPlayerId
        ? assessments.filter(a => a.playerId === selectedPlayerId).filter(a => inRange(a.date)).sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [assessments, selectedPlayerId, startDate, endDate]
  );

  /** Distribuição das avaliações salvas na aba Avaliação física pelas faixas Ideal / Adequado / Elevado */
  const physicalAssessmentBandStats = useMemo(() => {
    const bands: Record<BodyFatReferenceBand, number> = { ideal: 0, adequado: 0, elevado: 0 };
    filteredAssessments.forEach(a => {
      const bfRaw = typeof a.bodyFatPercent === 'number' && Number.isFinite(a.bodyFatPercent) ? a.bodyFatPercent : a.bodyFat;
      if (typeof bfRaw !== 'number' || !Number.isFinite(bfRaw)) return;
      const sex: 'M' | 'F' = a.sex === 'F' ? 'F' : 'M';
      bands[classifyBodyFatReference(bfRaw, sex)] += 1;
    });
    const total = filteredAssessments.length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
    return {
      total,
      bands,
      pctIdeal: pct(bands.ideal),
      pctAdequado: pct(bands.adequado),
      pctElevado: pct(bands.elevado),
    };
  }, [filteredAssessments]);

  const physicalAssessmentBandAlerts = useMemo(() => {
    const { total, bands, pctIdeal, pctAdequado, pctElevado } = physicalAssessmentBandStats;
    if (total === 0) return [] as { band: BodyFatReferenceBand; message: string }[];
    const rows: { band: BodyFatReferenceBand; message: string }[] = [];
    if (bands.ideal > 0) {
      rows.push({
        band: 'ideal',
        message: `${bands.ideal} avaliação(ões) (${pctIdeal}%) na faixa Ideal (referência de % gordura para o sexo informado na avaliação).`,
      });
    }
    if (bands.adequado > 0) {
      rows.push({
        band: 'adequado',
        message: `${bands.adequado} avaliação(ões) (${pctAdequado}%) na faixa Adequada (saudável) ou intermediária fora de Ideal/Elevado.`,
      });
    }
    if (bands.elevado > 0) {
      rows.push({
        band: 'elevado',
        message: `${bands.elevado} avaliação(ões) (${pctElevado}%) acima do limite de referência (Elevado). Acompanhar contexto nutricional, de treino e critérios clínicos.`,
      });
    }
    return rows;
  }, [physicalAssessmentBandStats]);

  const rankings = useMemo(() => {
    if (!selectedPlayerId || !playerStats) return null;
    const categories: { key: keyof MatchStats; label: string }[] = [
      { key: 'goals', label: 'Gols' },
      { key: 'assists', label: 'Assistências' },
      { key: 'shotsOnTarget', label: 'Chutes no Gol' },
      { key: 'passesCorrect', label: 'Passes Certos' },
      { key: 'tacklesWithBall', label: 'Desarmes (Posse)' },
      { key: 'tacklesCounterAttack', label: 'Desarme Contra-Ataque' },
    ];
    const out: Record<string, number> = {};
    categories.forEach(({ key, label }) => {
      const all = players.map(p => ({
        id: p.id,
        val: filteredMatches.reduce((acc, m) => acc + ((m.playerStats[p.id]?.[key] as number) || 0), 0),
      }));
      all.sort((a, b) => b.val - a.val);
      out[label] = all.findIndex(a => a.id === selectedPlayerId) + 1;
    });
    return out;
  }, [players, filteredMatches, selectedPlayerId, playerStats]);

  const heatmapSpots = useMemo(() => buildHeatmapCallouts(injuryInfo?.injuries || [], bodyView), [injuryInfo, bodyView]);
  const injuryTypeData = useMemo(
    () => Object.entries(injuryInfo?.injuryTypes || {}).map(([name, value]) => ({ name, value })),
    [injuryInfo]
  );

  const handleExportPdf = async () => {
    if (!selectedPlayer || !playerStats) return;
    let heatmapImageDataUrl: string | null = null;
    try {
      const el = document.getElementById('management-report-heatmap-capture');
      if (el) {
        const canvas = await html2canvas(el, { backgroundColor: '#000000', scale: 2, useCORS: true });
        heatmapImageDataUrl = canvas.toDataURL('image/png');
      }
    } catch (_) {}

    const teamSettings = (() => {
      try {
        const raw = localStorage.getItem('scout21_overview_team');
        if (!raw) return { teamName: undefined, teamShieldUrl: undefined };
        const parsed = JSON.parse(raw);
        return {
          teamName: parsed?.teamName || undefined,
          teamShieldUrl: parsed?.teamShieldUrl || parsed?.shieldUrl || undefined,
        };
      } catch {
        return { teamName: undefined, teamShieldUrl: undefined };
      }
    })();

    await exportManagementReportPdf({
      teamName: teamSettings.teamName,
      teamShieldUrl: teamSettings.teamShieldUrl,
      player: {
        name: selectedPlayer.name,
        number: selectedPlayer.jerseyNumber,
        position: selectedPlayer.position,
        photoUrl: selectedPlayer.photoUrl,
      },
      periodLabel: `${startDate || 'Início'} a ${endDate || 'Atual'}`,
      topCards: [
        { title: 'Média de PSE', value: String(avgPsePsr.avgPse ?? '—') },
        { title: 'Média de PSR', value: String(avgPsePsr.avgPsr ?? '—') },
        { title: 'Quantidade de lesões', value: String(injuryInfo?.injuries.length ?? 0) },
        { title: 'Total dias afastado', value: String(injuryInfo?.totalDaysLost ?? 0) },
        { title: 'Recuperadas prazo vs pós', value: `${injuryInfo?.recoveredInTime ?? 0} vs ${injuryInfo?.recoveredLate ?? 0}` },
      ],
      gameStatsCards: [
        { title: 'Total de jogos', value: String(playerStats.games) },
        { title: 'Jogos perdidos', value: String(injuryInfo?.injuries.length ?? 0) },
        { title: 'Minutos totais', value: String(playerStats.minutes) },
        { title: 'Média minutos', value: String(playerStats.avgMinutes) },
        { title: 'Período mais produtivo', value: String(goalInsights.bestPeriod), sub: goalInsights.bestPeriodShare != null ? `${goalInsights.bestPeriodShare.toFixed(2)}% dos gols` : undefined },
        { title: 'Método de gol +', value: String(goalInsights.topMethod) },
        { title: 'Origem de gol +', value: String(goalInsights.topOrigin) },
      ],
      scoutCards: [
        { title: 'Gols', value: String(playerStats.goals) },
        { title: 'Assistências', value: String(playerStats.assists) },
        { title: 'Chutes no gol', value: String(playerStats.shotsOnTarget) },
        { title: 'Passes certos', value: String(playerStats.passesCorrect) },
        { title: 'Faltas cometidas', value: String(cardAndFoulStats.foulsCommitted) },
        { title: 'Cartões amarelos', value: String(cardAndFoulStats.yellowCards) },
        { title: 'Cartões vermelhos', value: String(cardAndFoulStats.redCards) },
        { title: 'Passes errados', value: String(playerStats.passesWrong) },
        { title: 'Desarmes (posse)', value: String(playerStats.tacklesWithBall) },
        { title: 'Desarmes (s/posse)', value: String(playerStats.tacklesWithoutBall) },
        { title: 'Desarme c/a', value: String(playerStats.tacklesCounterAttack) },
        { title: 'Erro transição', value: String(playerStats.wrongPassesTransition) },
      ],
      rankings: Object.entries(rankings || {}).map(([name, position]) => ({ name, position })),
      dualities: goalAssistDualities.map(d => ({
        pairLabel: `${selectedPlayer.name} ↔ ${d.partnerName}`,
        total: d.total,
        given: d.goalsPartnerScoredWithMyAssist,
        received: d.goalsScoredWithPartnerAssist,
      })),
      wellnessIdeal: wellnessIdealRadarData.map(r => ({ subject: r.subject, avg: r.avg ?? 0 })),
      wellnessReal: wellnessRadarPeriod.map(r => ({ subject: r.subject, avg: r.avg })),
      wellnessCloseness: closeness,
      injuryTypes: injuryTypeData,
      injurySide: injuryInfo?.side || { direito: 0, esquerdo: 0 },
      physicalAssessmentBands: {
        total: physicalAssessmentBandStats.total,
        ideal: physicalAssessmentBandStats.bands.ideal,
        adequado: physicalAssessmentBandStats.bands.adequado,
        elevado: physicalAssessmentBandStats.bands.elevado,
        pctIdeal: physicalAssessmentBandStats.pctIdeal,
        pctAdequado: physicalAssessmentBandStats.pctAdequado,
        pctElevado: physicalAssessmentBandStats.pctElevado,
      },
      heatmapImageDataUrl,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className={cardBase}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <FileText className="text-[#00f0ff]" /> Relatório Gerencial
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1">Análise completa do atleta para avaliação da diretoria</p>
          </div>
          {selectedPlayer && (
            <button onClick={handleExportPdf} className="bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors print:hidden">
              <Download size={18} /> Exportar PDF
            </button>
          )}
        </div>
      </div>

      <div className={`${cardBase} print:hidden`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><User size={12} /> Atleta</label>
            <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold">
              <option value="">Selecione um atleta...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} #{p.jerseyNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><Calendar size={12} /> Data Inicial</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><Calendar size={12} /> Data Final</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold" />
          </div>
        </div>
      </div>

      {!selectedPlayer && (
        <div className="bg-black p-12 rounded-3xl border border-zinc-900 shadow-lg text-center">
          <User size={64} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 font-bold text-lg">Selecione um atleta para gerar o relatório</p>
        </div>
      )}

      {selectedPlayer && (
        <div className="space-y-6 print:space-y-4">
          <div className={`${cardBase} print:border-0 print:shadow-none`}>
            <div className="flex items-center gap-6">
              {selectedPlayer.photoUrl && <img src={selectedPlayer.photoUrl} alt={selectedPlayer.name} className="w-24 h-24 rounded-full object-cover border-4 border-[#00f0ff]" />}
              <div className="flex-1">
                <h3 className="text-3xl font-black text-white uppercase">{selectedPlayer.name}</h3>
                <p className="text-zinc-400 font-bold mt-1">#{selectedPlayer.jerseyNumber} • {selectedPlayer.position} • {selectedPlayer.age} anos</p>
                {(startDate || endDate) && <p className="text-zinc-500 text-sm font-bold mt-2">Período: {startDate || 'Início'} a {endDate || 'Atual'}</p>}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="border border-zinc-900 rounded-xl p-3"><p className="text-zinc-500 text-[10px] font-bold uppercase">Média de PSE</p><p className="text-white text-2xl font-black">{avgPsePsr.avgPse ?? '—'}</p></div>
              <div className="border border-zinc-900 rounded-xl p-3"><p className="text-zinc-500 text-[10px] font-bold uppercase">Média de PSR</p><p className="text-white text-2xl font-black">{avgPsePsr.avgPsr ?? '—'}</p></div>
              <div className="border border-zinc-900 rounded-xl p-3"><p className="text-zinc-500 text-[10px] font-bold uppercase">Quantidade de lesões</p><p className="text-white text-2xl font-black">{injuryInfo?.injuries.length ?? 0}</p></div>
              <div className="border border-zinc-900 rounded-xl p-3"><p className="text-zinc-500 text-[10px] font-bold uppercase">Total dias afastado</p><p className="text-white text-2xl font-black">{injuryInfo?.totalDaysLost ?? 0}</p></div>
              <div className="border border-zinc-900 rounded-xl p-3"><p className="text-zinc-500 text-[10px] font-bold uppercase">Recuperadas prazo vs pós</p><p className="text-white text-xl font-black">{injuryInfo?.recoveredInTime ?? 0} <span className="text-zinc-500">vs</span> {injuryInfo?.recoveredLate ?? 0}</p></div>
            </div>
          </div>

          {playerStats && (
            <>
              <div className={cardBase}>
                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2"><Activity className="text-[#00f0ff]" /> Estatísticas de Jogos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Total de Jogos</p><p className="text-white font-black text-2xl">{playerStats.games}</p></div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Jogos Perdidos</p><p className="text-white font-black text-2xl">{injuryInfo?.injuries.length ? injuryInfo.injuries.length : 0}</p></div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Minutos Totais</p><p className="text-white font-black text-2xl">{playerStats.minutes}</p></div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Média Minutos</p><p className="text-white font-black text-2xl">{playerStats.avgMinutes}</p></div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4">
                    <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Período mais produtivo</p>
                    <p className="text-white font-black text-lg">{goalInsights.bestPeriod}</p>
                    {goalInsights.bestPeriodShare != null && (
                      <p className="text-zinc-500 text-[11px] font-bold mt-1">{goalInsights.bestPeriodShare.toFixed(2)}% dos gols</p>
                    )}
                  </div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Método de gol +</p><p className="text-white font-black text-lg">{goalInsights.topMethod}</p></div>
                  <div className="text-center border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 font-bold uppercase text-xs mb-2">Origem de gol +</p><p className="text-white font-black text-lg">{goalInsights.topOrigin}</p></div>
                </div>
              </div>

              <div className={cardBase}>
                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2"><BarChart3 className="text-[#00f0ff]" /> Estatísticas do Scout Coletivo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Gols</p><p className="text-white font-black text-2xl">{playerStats.goals}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Assistências</p><p className="text-white font-black text-2xl">{playerStats.assists}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Chutes no Gol</p><p className="text-white font-black text-2xl">{playerStats.shotsOnTarget}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Passes Certos</p><p className="text-white font-black text-2xl">{playerStats.passesCorrect}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Faltas cometidas</p><p className="text-white font-black text-2xl">{cardAndFoulStats.foulsCommitted}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Cartões amarelos</p><p className="text-white font-black text-2xl">{cardAndFoulStats.yellowCards}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Cartões vermelhos</p><p className="text-white font-black text-2xl">{cardAndFoulStats.redCards}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Passes Errados</p><p className="text-white font-black text-2xl">{playerStats.passesWrong}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Desarmes (Posse)</p><p className="text-white font-black text-2xl">{playerStats.tacklesWithBall}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Desarmes (S/Posse)</p><p className="text-white font-black text-2xl">{playerStats.tacklesWithoutBall}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Desarme C/A</p><p className="text-white font-black text-2xl">{playerStats.tacklesCounterAttack}</p></div>
                  <div className="border border-zinc-900 rounded-xl p-4"><p className="text-zinc-500 text-xs uppercase font-bold mb-2">Erro Transição</p><p className="text-white font-black text-2xl">{playerStats.wrongPassesTransition}</p></div>
                </div>
              </div>
            </>
          )}

          {rankings && (
            <div className={cardBase}>
              <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2"><Trophy className="text-[#00f0ff]" /> Posição nos Rankings</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(rankings).map(([stat, position]) => (
                  <div key={stat} className="border border-zinc-900 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 font-bold uppercase text-xs mb-2">{stat}</p>
                    <p className="font-black text-3xl text-white">{position}º</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goalAssistDualities.length > 0 && (
            <div className={cardBase}>
              <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2"><Users className="text-[#00f0ff]" /> Dualidades (Top 3)</h4>
              <p className="text-zinc-400 text-xs mb-4">Empates por interações são desempatados por quem recebeu mais assistências do atleta filtrado.</p>
              <div className="space-y-3">
                {goalAssistDualities.map(rel => (
                  <div key={rel.partnerId} className="border border-zinc-900 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-white font-bold text-sm">{selectedPlayer.name} ↔ {rel.partnerName}</p>
                      <p className="text-white font-black text-lg">{rel.total} interações</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-900">
                      <div><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Seu gol (assist. parceiro)</p><p className="text-white font-black text-xl">{rel.goalsScoredWithPartnerAssist}</p></div>
                      <div><p className="text-zinc-500 text-xs font-bold uppercase mb-1">Gol parceiro (sua assist.)</p><p className="text-white font-black text-xl">{rel.goalsPartnerScoredWithMyAssist}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cardBase}>
            <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2"><Brain className="text-[#00f0ff]" /> Fisiológica</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-zinc-900 p-4">
                <p className="text-emerald-400 text-[11px] font-black uppercase tracking-wide mb-2 text-center">Modelo ideal</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wellnessIdealRadarData} cx="50%" cy="52%" outerRadius="68%">
                      <PolarGrid stroke="#27272a" />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" />
                      <PolarAngleAxis
                        dataKey="shortLabel"
                        tick={({ x, y, payload, textAnchor }) => {
                          const row = wellnessIdealRadarData.find(r => r.shortLabel === payload.value);
                          if (!row) return <g />;
                          const ta = textAnchor === 'end' ? 'end' : textAnchor === 'start' ? 'start' : 'middle';
                          return (
                            <text x={x} y={y} textAnchor={ta} fill="#a1a1aa" fontSize={9} fontFamily="Calibri">
                              <tspan x={x} dy={0}>{row.shortLabel}</tspan>
                              <tspan x={x} dy={12} fill="#4ade80" fontWeight="bold" fontSize={10}>{row.avgLabel}</tspan>
                            </text>
                          );
                        }}
                      />
                      <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.22} strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-900 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide mb-2 text-center" style={{ color: hasWellness ? realRadarStyle.stroke : '#a1a1aa' }}>Realidade (período)</p>
                {hasWellness ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={wellnessRadarPeriod} cx="50%" cy="52%" outerRadius="68%">
                        <PolarGrid stroke="#27272a" />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" />
                        <PolarAngleAxis
                          dataKey="shortLabel"
                          tick={({ x, y, payload, textAnchor }) => {
                            const row = wellnessRadarPeriod.find(r => r.shortLabel === payload.value);
                            if (!row) return <g />;
                            const ta = textAnchor === 'end' ? 'end' : textAnchor === 'start' ? 'start' : 'middle';
                            return (
                              <text x={x} y={y} textAnchor={ta} fill="#a1a1aa" fontSize={9} fontFamily="Calibri">
                                <tspan x={x} dy={0}>{row.shortLabel}</tspan>
                                <tspan x={x} dy={12} fill={realRadarStyle.stroke} fontWeight="bold" fontSize={10}>{row.avgLabel}</tspan>
                              </text>
                            );
                          }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff' }} />
                        <Radar dataKey="value" stroke={realRadarStyle.stroke} fill={realRadarStyle.fill} strokeWidth={2} dot={{ r: 3, fill: realRadarStyle.dot }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-zinc-500 text-sm py-20 text-center">Sem dados de bem-estar no período.</p>}
              </div>
            </div>
            <div className="mt-4 print:hidden">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide text-center">Proximidade ao Bem- Estar ideal da equipe (realidade)</p>
              <div className="h-2.5 max-w-md mx-auto mt-2 rounded-full border border-zinc-700" style={{ background: 'linear-gradient(90deg, hsl(0,92%,48%) 0%, hsl(24,90%,50%) 18%, hsl(42,92%,52%) 40%, hsl(88,78%,48%) 72%, hsl(125,72%,46%) 100%)' }} />
            </div>
            {hasWellness && (
              <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-200 mb-2">Alertas · real vs Bem-Estar Ideal</p>
                {wellnessAlerts.length ? (
                  <ul className="space-y-1.5">
                    {wellnessAlerts.map(a => <li key={a.key} className="text-[10px] text-zinc-300">{a.message}</li>)}
                  </ul>
                ) : <p className="text-[10px] text-emerald-300">Indicadores alinhados ao ideal no período.</p>}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-zinc-900 p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-black uppercase text-sm">Mapa de calor de lesões</p>
                  <button onClick={() => setBodyView(v => (v === 'front' ? 'back' : 'front'))} className="text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2 py-1 flex items-center gap-1"><Rotate3d size={12} /> {bodyView === 'front' ? 'Costas' : 'Frente'}</button>
                </div>
                <div id="management-report-heatmap-capture" className="relative h-[440px] bg-black rounded-xl border border-zinc-800 overflow-visible">
                  <img src={bodyView === 'front' ? '/anatomy-front.png.png' : '/anatomy-back.png.png'} alt="Corpo humano" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0">{heatmapSpots.map((s, i) => <HeatCallout key={`${s.regionLabel}-${i}`} {...s} />)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-900 p-4">
                  <p className="text-white font-black uppercase text-sm mb-3">Tipos de lesão</p>
                  {injuryTypeData.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={injuryTypeData} layout="vertical" margin={{ left: 30, right: 16, top: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal vertical={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={95} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                          <Bar dataKey="value" fill="#52525b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-zinc-500 text-sm">Sem lesões no período.</p>}
                </div>
                <div className="rounded-2xl border border-zinc-900 p-4">
                  <p className="text-white font-black uppercase text-sm mb-3">Lesões por lado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800"><p className="text-zinc-400 text-xs uppercase font-bold">Direito</p><p className="text-white text-2xl font-black">{injuryInfo?.side.direito ?? 0}</p></div>
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800"><p className="text-zinc-400 text-xs uppercase font-bold">Esquerdo</p><p className="text-white text-2xl font-black">{injuryInfo?.side.esquerdo ?? 0}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-900 p-4">
                  <p className="text-white font-black uppercase text-sm mb-1">Avaliações físicas · % gordura</p>
                  <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-wide">Mesmas faixas da aba Avaliação física (Ideal / Adequado / Elevado)</p>
                  {physicalAssessmentBandStats.total === 0 ? (
                    <p className="text-zinc-500 text-sm">Sem avaliações no período.</p>
                  ) : (
                    <>
                      <div className="mb-4 flex items-baseline gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                        <span className="text-2xl font-black text-[#00f0ff]">{physicalAssessmentBandStats.total}</span>
                        <span className="text-xs font-bold uppercase text-zinc-400">avaliações registradas</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between rounded-lg border border-emerald-800/60 bg-emerald-950/35 px-3 py-2.5">
                          <span className="text-[11px] font-black uppercase text-emerald-300">Ideal</span>
                          <span className="text-sm font-black text-emerald-200">
                            {physicalAssessmentBandStats.bands.ideal}{' '}
                            <span className="text-emerald-400/90">({physicalAssessmentBandStats.pctIdeal}%)</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2.5">
                          <span className="text-[11px] font-black uppercase text-amber-300">Adequado</span>
                          <span className="text-sm font-black text-amber-200">
                            {physicalAssessmentBandStats.bands.adequado}{' '}
                            <span className="text-amber-400/90">({physicalAssessmentBandStats.pctAdequado}%)</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/35 px-3 py-2.5">
                          <span className="text-[11px] font-black uppercase text-red-300">Elevado</span>
                          <span className="text-sm font-black text-red-200">
                            {physicalAssessmentBandStats.bands.elevado}{' '}
                            <span className="text-red-400/90">({physicalAssessmentBandStats.pctElevado}%)</span>
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-200 mb-2">Alertas · composição corporal</p>
                        {physicalAssessmentBandAlerts.length ? (
                          <ul className="space-y-1.5">
                            {physicalAssessmentBandAlerts.map(row => (
                              <li
                                key={row.band}
                                className={`text-[10px] leading-snug ${
                                  row.band === 'ideal'
                                    ? 'text-emerald-200'
                                    : row.band === 'adequado'
                                      ? 'text-amber-200'
                                      : 'text-red-200'
                                }`}
                              >
                                {row.message}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-zinc-500">Sem dados classificáveis.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {filteredAssessments.length > 0 && (
            <div className={cardBase}>
              <h4 className="text-xl font-black text-white uppercase mb-4">Avaliações Físicas</h4>
              <div className="space-y-4">
                {filteredAssessments.map(assessment => (
                  <div key={assessment.id} className="border border-zinc-900 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white font-black text-lg">{new Date(assessment.date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-white font-black text-xl">{assessment.bodyFat}% BF</p>
                    </div>
                    {(assessment as any).actionPlan && <p className="text-zinc-400 text-sm font-bold mt-2 border-t border-zinc-900 pt-2">{(assessment as any).actionPlan}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


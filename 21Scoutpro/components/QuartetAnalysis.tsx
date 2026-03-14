import React, { useState, useMemo } from 'react';
import { Trophy, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { MatchRecord, Player } from '../types';
import { ExpandableCard } from './ExpandableCard';
import { IS_FREE_PLAN } from '../config';

interface QuartetAnalysisProps {
  matches: MatchRecord[];
  players: Player[];
}

/** Objeto final do quarteto para exibição (Análise de Quarteto de Linha) */
export interface QuartetDisplay {
  atletas: Array<{ id: string; apelido: string; foto_url: string }>;
  tempo_total: number;
  gols_feitos: number;
  gols_tomados: number;
  metodo_gol_mais_recorrente: string;
  metodo_gol_tomado_mais_recorrente: string;
  chutes_dentro: number;
  chutes_fora: number;
  passes_certos: number;
  passes_errados: number;
  faltas_sofridas: number;
  faltas_feitas: number;
  desarmes_com_posse: number;
  desarmes_sem_posse: number;
  posse_media: number;
  ipq_total: number;
  ipq_ofensivo: number;
  ipq_defensivo: number;
  _raw?: unknown;
  _min?: number;
}

const QUARTET_MATCH_DURATION_SEC = 40 * 60; // 40 min
const QUARTET_PERIOD_SEC = 20 * 60; // 20 min
const MIN_QUARTET_MINUTES = 3; // Regra mínima: >= 3 min juntos

const parseEventTimeToSeconds = (timeStr: string, period: '1T' | '2T'): number => {
  const parts = timeStr.trim().split(':');
  const mm = parseInt(parts[0], 10) || 0;
  const ss = parseInt(parts[1], 10) || 0;
  const sec = mm * 60 + ss;
  return period === '1T' ? sec : QUARTET_PERIOD_SEC + sec;
};

const getQuartetKey = (ids: string[]): string => [...ids].map(id => String(id).trim()).sort().join(',');

const formatTempoJuntos = (segundos: number): string => {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}m ${s}s`;
};

const QuartetCard: React.FC<{
  quarteto: QuartetDisplay;
  rank: number;
  variant: 'high' | 'low';
}> = ({ quarteto, rank, variant }) => {
  const [expanded, setExpanded] = useState(false);
  const min = quarteto._min ?? (quarteto.tempo_total / 60);
  const perMin = (v: number) => (min > 0 ? (v / min).toFixed(2) : '0');

  return (
    <div className={`rounded-xl border p-4 ${variant === 'high' ? 'border-[#ccff00]/40 bg-[#ccff00]/5' : 'border-[#ff0055]/40 bg-[#ff0055]/5'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-lg font-black ${variant === 'high' ? 'text-[#ccff00]' : 'text-[#ff0055]'}`}>#{rank}</span>
        <span className="text-zinc-400 text-xs font-bold">Quarteto de linha</span>
      </div>

      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {quarteto.atletas.map(a => (
          <div key={a.id} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex-shrink-0">
              {a.foto_url ? (
                <img src={a.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                  {a.apelido.slice(0, 2) || '?'}
                </div>
              )}
            </div>
            <span className="text-white text-xs font-bold mt-1.5 truncate max-w-[72px] text-center">{a.apelido}</span>
          </div>
        ))}
      </div>

      <p className="text-zinc-400 text-xs mb-3">Tempo juntos: <span className="text-white font-bold">{formatTempoJuntos(quarteto.tempo_total)}</span></p>

      <div className="flex gap-4 mb-4 flex-wrap">
        <span className="text-zinc-400 text-xs">IPQ Total: <strong className="text-white">{quarteto.ipq_total}</strong></span>
        <span className="text-blue-400 text-xs">IPQ Ofensivo: <strong>{quarteto.ipq_ofensivo}</strong></span>
        <span className="text-red-400 text-xs">IPQ Defensivo: <strong>{quarteto.ipq_defensivo}</strong></span>
      </div>

      <div className="space-y-1 text-xs mb-4">
        <p className="text-zinc-300">⚽ {quarteto.gols_feitos} gols feitos &nbsp; 🥅 {quarteto.gols_tomados} gols tomados</p>
        <p className="text-zinc-300">📊 Posse média: {quarteto.posse_media}%</p>
        <p className="text-zinc-300">🔥 Método de gol mais recorrente: {quarteto.metodo_gol_mais_recorrente}</p>
        <p className="text-zinc-300">🛑 Método de gol tomado mais recorrente: {quarteto.metodo_gol_tomado_mais_recorrente}</p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Ocultar métricas' : 'Ver todas as métricas'}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="col-span-2 text-zinc-500 font-bold mb-1">Métricas brutas e por minuto</div>
          <span className="text-zinc-500">Tempo total</span>
          <span className="text-white font-bold text-right">{formatTempoJuntos(quarteto.tempo_total)}</span>
          <span className="text-zinc-500">Gols feitos</span>
          <span className="text-white font-bold text-right">{quarteto.gols_feitos} ({perMin(quarteto.gols_feitos)}/min)</span>
          <span className="text-zinc-500">Gols tomados</span>
          <span className="text-white font-bold text-right">{quarteto.gols_tomados} ({perMin(quarteto.gols_tomados)}/min)</span>
          <span className="text-zinc-500">Chutes dentro</span>
          <span className="text-white font-bold text-right">{quarteto.chutes_dentro} ({perMin(quarteto.chutes_dentro)}/min)</span>
          <span className="text-zinc-500">Chutes fora</span>
          <span className="text-white font-bold text-right">{quarteto.chutes_fora} ({perMin(quarteto.chutes_fora)}/min)</span>
          <span className="text-zinc-500">Passes certos</span>
          <span className="text-white font-bold text-right">{quarteto.passes_certos} ({perMin(quarteto.passes_certos)}/min)</span>
          <span className="text-zinc-500">Passes errados</span>
          <span className="text-white font-bold text-right">{quarteto.passes_errados} ({perMin(quarteto.passes_errados)}/min)</span>
          <span className="text-zinc-500">Desarmes com posse</span>
          <span className="text-white font-bold text-right">{quarteto.desarmes_com_posse} ({perMin(quarteto.desarmes_com_posse)}/min)</span>
          <span className="text-zinc-500">Desarmes sem posse</span>
          <span className="text-white font-bold text-right">{quarteto.desarmes_sem_posse} ({perMin(quarteto.desarmes_sem_posse)}/min)</span>
          <span className="text-zinc-500">Faltas sofridas</span>
          <span className="text-white font-bold text-right">{quarteto.faltas_sofridas} ({perMin(quarteto.faltas_sofridas)}/min)</span>
          <span className="text-zinc-500">Faltas feitas</span>
          <span className="text-white font-bold text-right">{quarteto.faltas_feitas} ({perMin(quarteto.faltas_feitas)}/min)</span>
          <span className="text-zinc-500">Método gol feito</span>
          <span className="text-white font-bold text-right">{quarteto.metodo_gol_mais_recorrente}</span>
          <span className="text-zinc-500">Método gol tomado</span>
          <span className="text-white font-bold text-right">{quarteto.metodo_gol_tomado_mais_recorrente}</span>
          <span className="text-zinc-500">Posse média</span>
          <span className="text-white font-bold text-right">{quarteto.posse_media}%</span>
        </div>
      )}
    </div>
  );
};

export const QuartetAnalysis: React.FC<QuartetAnalysisProps> = ({ matches, players }) => {
  const quartetAnalysis = useMemo(() => {
    type QuartetAgg = {
      playerIds: string[];
      tempo_total_seg: number;
      gols_feitos: number;
      gols_tomados: number;
      metodo_gol_mais_recorrente: string;
      metodo_gol_tomado_mais_recorrente: string;
      chutes_dentro: number;
      chutes_fora: number;
      passes_certos: number;
      passes_errados: number;
      faltas_sofridas: number;
      faltas_feitas: number;
      desarmes_com_posse: number;
      desarmes_sem_posse: number;
      posse_seg_com: number;
      posse_seg_sem: number;
      goalMethodsScored: Record<string, number>;
      goalMethodsConceded: Record<string, number>;
    };

    const agg = new Map<string, QuartetAgg>();

    const ensureQuartet = (key: string, playerIds: string[]) => {
      if (!agg.has(key)) {
        agg.set(key, {
          playerIds: [...playerIds],
          tempo_total_seg: 0,
          gols_feitos: 0,
          gols_tomados: 0,
          metodo_gol_mais_recorrente: '',
          metodo_gol_tomado_mais_recorrente: '',
          chutes_dentro: 0,
          chutes_fora: 0,
          passes_certos: 0,
          passes_errados: 0,
          faltas_sofridas: 0,
          faltas_feitas: 0,
          desarmes_com_posse: 0,
          desarmes_sem_posse: 0,
          posse_seg_com: 0,
          posse_seg_sem: 0,
          goalMethodsScored: {},
          goalMethodsConceded: {},
        });
      }
    };

    matches.forEach(match => {
      if (!match.lineup?.players || match.lineup.players.length < 5) return;
      const lineup = match.lineup.players.map(id => String(id).trim());
      const gkId = lineup[0];
      let currentQuartet = lineup.slice(1).sort();
      const subs = (match.substitutionHistory || []).slice().sort((a, b) => {
        const ta = a.period === '1T' ? a.time : QUARTET_PERIOD_SEC + a.time;
        const tb = b.period === '1T' ? b.time : QUARTET_PERIOD_SEC + b.time;
        return ta - tb;
      });

      const segments: { start: number; end: number; quartet: string[] }[] = [];
      let lastT = 0;
      for (const sub of subs) {
        const t = sub.period === '1T' ? sub.time : QUARTET_PERIOD_SEC + sub.time;
        if (t <= lastT) continue;
        const outId = String(sub.playerOutId).trim();
        if (outId === gkId) continue;
        if (!currentQuartet.includes(outId)) continue;
        segments.push({ start: lastT, end: t, quartet: [...currentQuartet] });
        currentQuartet = currentQuartet.map(id => (id === outId ? String(sub.playerInId).trim() : id)).sort();
        lastT = t;
      }
      segments.push({ start: lastT, end: QUARTET_MATCH_DURATION_SEC, quartet: currentQuartet });

      const matchWith = match.possessionSecondsWith ?? 0;
      const matchWithout = match.possessionSecondsWithout ?? 0;
      segments.forEach(seg => {
        const key = getQuartetKey(seg.quartet);
        ensureQuartet(key, seg.quartet);
        const rec = agg.get(key)!;
        const segDuration = seg.end - seg.start;
        rec.tempo_total_seg += segDuration;
        const fraction = segDuration / QUARTET_MATCH_DURATION_SEC;
        rec.posse_seg_com += fraction * matchWith;
        rec.posse_seg_sem += fraction * matchWithout;
      });

      const log = match.postMatchEventLog || [];
      log.forEach(ev => {
        const eventSec = parseEventTimeToSeconds(ev.time, ev.period);
        const seg = segments.find(s => eventSec >= s.start && eventSec < s.end);
        if (!seg) return;
        const key = getQuartetKey(seg.quartet);
        const rec = agg.get(key);
        if (!rec) return;
        const inQuartet = seg.quartet.includes(String(ev.playerId).trim());

        if (ev.action === 'goal') {
          if (ev.isOpponentGoal) {
            rec.gols_tomados += 1;
            const method = ev.goalMethod || ev.subtipo || '—';
            rec.goalMethodsConceded[method] = (rec.goalMethodsConceded[method] || 0) + 1;
          } else {
            rec.gols_feitos += 1;
            const method = ev.goalMethod || ev.subtipo || '—';
            rec.goalMethodsScored[method] = (rec.goalMethodsScored[method] || 0) + 1;
          }
        } else if (ev.action === 'passCorrect' && inQuartet) rec.passes_certos += 1;
        else if (ev.action === 'passWrong' && inQuartet) rec.passes_errados += 1;
        else if (ev.action === 'shotOn' && inQuartet) rec.chutes_dentro += 1;
        else if (ev.action === 'shotOff' && inQuartet) rec.chutes_fora += 1;
        else if (ev.action === 'tackleWithBall' && inQuartet) rec.desarmes_com_posse += 1;
        else if ((ev.action === 'tackleWithoutBall' || ev.action === 'tackleCounter') && inQuartet) rec.desarmes_sem_posse += 1;
        else if (ev.action === 'falta') {
          if (ev.foulTeam === 'for' && inQuartet) rec.faltas_feitas += 1;
          if (ev.foulTeam === 'against') rec.faltas_sofridas += 1;
        }
      });
    });

    const tempoMin = (q: QuartetAgg) => q.tempo_total_seg / 60;
    const list = Array.from(agg.values()).filter(q => tempoMin(q) >= MIN_QUARTET_MINUTES);

    if (list.length === 0) {
      return { highPerformance: [], lowPerformance: [] };
    }

    // IPQ Ofensivo bruto = (gols*4 + chutes_dentro*1.5 + passes_certos*0.05 + desarmes_com_posse*1) / tempo_min
    const ipqOfensivoBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      if (min <= 0) return 0;
      return ((q.gols_feitos * 4) + (q.chutes_dentro * 1.5) + (q.passes_certos * 0.05) + (q.desarmes_com_posse * 1)) / min;
    };
    // IPQ Defensivo bruto = (gols_tomados*-4 + faltas_feitas*-1 + passes_errados*-0.05 + chutes_fora*-0.5) / tempo_min → exibição = bruto * -1
    const ipqDefensivoBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      if (min <= 0) return 0;
      return ((q.gols_tomados * -4) + (q.faltas_feitas * -1) + (q.passes_errados * -0.05) + (q.chutes_fora * -0.5)) / min;
    };
    // IPQ Total bruto = ipq_ofensivo + ipq_defensivo + (faltas_sofridas*0.5 / tempo_min)
    const ipqTotalBruto = (q: QuartetAgg) => {
      const min = tempoMin(q);
      return ipqOfensivoBruto(q) + ipqDefensivoBruto(q) + (min > 0 ? (q.faltas_sofridas * 0.5) / min : 0);
    };

    list.sort((a, b) => ipqTotalBruto(b) - ipqTotalBruto(a));

    const ofensivoValues = list.map(ipqOfensivoBruto);
    const defensivoExibicaoValues = list.map(q => ipqDefensivoBruto(q) * -1);
    const totalValues = list.map(ipqTotalBruto);

    const normalize = (vals: number[]) => {
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);
      const range = maxVal - minVal;
      return vals.map(v => range === 0 ? 100 : ((v - minVal) / range) * 100);
    };

    const ipqOfensivoNorm = normalize(ofensivoValues);
    const ipqDefensivoNorm = normalize(defensivoExibicaoValues);
    const ipqTotalNorm = normalize(totalValues);

    const metodoMaisRecorrente = (m: Record<string, number>) => {
      const ent = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
      return ent ? ent[0] : '—';
    };

    const buildQuartet = (q: QuartetAgg, idx: number): QuartetDisplay => {
      const min = tempoMin(q);
      const totalPosse = q.posse_seg_com + q.posse_seg_sem;
      const posse_media = totalPosse > 0 ? Math.round((q.posse_seg_com / totalPosse) * 100) : 0;
      return {
        atletas: q.playerIds.map(id => {
          const p = players.find(x => String(x.id).trim() === String(id).trim());
          return {
            id: String(id).trim(),
            apelido: p?.nickname?.trim() || p?.name?.trim() || '—',
            foto_url: p?.photoUrl || '',
          };
        }),
        tempo_total: q.tempo_total_seg,
        gols_feitos: q.gols_feitos,
        gols_tomados: q.gols_tomados,
        metodo_gol_mais_recorrente: metodoMaisRecorrente(q.goalMethodsScored),
        metodo_gol_tomado_mais_recorrente: metodoMaisRecorrente(q.goalMethodsConceded),
        chutes_dentro: q.chutes_dentro,
        chutes_fora: q.chutes_fora,
        passes_certos: q.passes_certos,
        passes_errados: q.passes_errados,
        faltas_sofridas: q.faltas_sofridas,
        faltas_feitas: q.faltas_feitas,
        desarmes_com_posse: q.desarmes_com_posse,
        desarmes_sem_posse: q.desarmes_sem_posse,
        posse_media,
        ipq_total: Math.round(ipqTotalNorm[idx]),
        ipq_ofensivo: Math.round(ipqOfensivoNorm[idx]),
        ipq_defensivo: Math.round(ipqDefensivoNorm[idx]),
        _raw: q,
        _min: min,
      };
    };

    return {
      highPerformance: list.slice(0, 3).map((q, i) => buildQuartet(q, i)),
      lowPerformance: list.slice(-3).reverse().map((q, i) => buildQuartet(q, list.length - 1 - i)),
    };
  }, [matches, players]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 mb-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-[#00f0ff] rounded-full"></div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Análise de Quarteto de Linha</h2>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-zinc-800 pl-4 py-1">
          O <strong className="text-zinc-200">IPQ (Índice de Performance do Quarteto)</strong> mede a eficiência coletiva dos quatro atletas enquanto estiverem juntos em quadra. O sistema gera três indicadores: <span className="text-blue-400">IPQ Ofensivo</span> (produção ofensiva e geração de jogo), <span className="text-red-400">IPQ Defensivo</span> (solidez defensiva e controle de erros) e <span className="text-purple-400">IPQ Total</span> (ataque, defesa e disciplina). Todos são normalizados de 0 a 100 — quanto maior, melhor. Apenas quartetos com pelo menos 3 minutos juntos são considerados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpandableCard title="Quarteto Alta performance" icon={Trophy} headerColor="text-[#ccff00]">
          {IS_FREE_PLAN ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center">
              <Lock className="w-12 h-12 text-zinc-500 mb-4" strokeWidth={1.5} />
              <p className="text-zinc-400 text-sm max-w-md">
                Em breve, estamos desenvolvendo. Entre em contato para mais informações.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quartetAnalysis.highPerformance.length === 0 ? (
                <p className="text-zinc-500 text-sm py-6 text-center">Nenhum quarteto com pelo menos 3 minutos juntos nas partidas filtradas. Use partidas com escalação e scout salvos.</p>
              ) : (
                quartetAnalysis.highPerformance.map((q, idx) => (
                  <QuartetCard key={idx} quarteto={q} rank={idx + 1} variant="high" />
                ))
              )}
            </div>
          )}
        </ExpandableCard>

        <ExpandableCard title="Quarteto Baixa performance" icon={AlertCircle} headerColor="text-[#ff0055]">
          {IS_FREE_PLAN ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center">
              <Lock className="w-12 h-12 text-zinc-500 mb-4" strokeWidth={1.5} />
              <p className="text-zinc-400 text-sm max-w-md">
                Em breve, estamos desenvolvendo. Entre em contato para mais informações.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quartetAnalysis.lowPerformance.length === 0 ? (
                <p className="text-zinc-500 text-sm py-6 text-center">Nenhum quarteto com pelo menos 3 minutos juntos nas partidas filtradas. Use partidas com escalação e scout salvos.</p>
              ) : (
                quartetAnalysis.lowPerformance.map((q, idx) => (
                  <QuartetCard key={idx} quarteto={q} rank={idx + 1} variant="low" />
                ))
              )}
            </div>
          )}
        </ExpandableCard>
      </div>
    </div>
  );
};

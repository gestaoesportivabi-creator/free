import React, { useMemo, useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { Player } from '../types';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';

export type ChampionshipMatchForPse = {
  id: string;
  date: string;
  time?: string;
  opponent: string;
  competition?: string;
};

interface PseJogosTabProps {
  championshipMatches: ChampionshipMatchForPse[];
  players: Player[];
}

type StoredPseJogos = Record<string, Record<string, number>>; // matchId -> playerId -> PSE

export const PseJogosTab: React.FC<PseJogosTabProps> = ({ championshipMatches, players }) => {
  const [stored, setStored] = useState<StoredPseJogos>({});
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
      if (raw) setStored(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const save = (matchId: string, playerId: string, value: number | '') => {
    setStored(prev => {
      const matchData = { ...(prev[matchId] || {}) };
      if (value === '') delete matchData[playerId];
      else matchData[playerId] = value;
      const next = { ...prev, [matchId]: matchData };
      try { localStorage.setItem(PSE_JOGOS_STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const sortedMatches = useMemo(() => {
    return [...championshipMatches].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [championshipMatches]);

  const teamAverage = (matchId: string): number | null => {
    const data = stored[matchId];
    if (!data) return null;
    const values = Object.values(data).filter(v => typeof v === 'number' && v >= 0 && v <= 10);
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const activePlayers = useMemo(() => players.filter(p => !p.isTransferred), [players]);

  if (sortedMatches.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
          <div className="flex items-center justify-center flex-col py-16">
            <Trophy size={64} className="text-[#ccff00] mb-6 opacity-50" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Evolução PSE (Jogos)</h2>
            <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
              Cadastre jogos na <strong>Tabela de Campeonato</strong> (Gestão de Equipe) para preencher a PSE após cada partida.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide mb-2">
          <Activity className="text-[#ccff00]" /> Evolução PSE (Jogos)
        </h2>
        <p className="text-zinc-500 text-xs font-bold mb-6">
          Preencha a PSE (0-10) de cada atleta após os jogos. A média da equipe é calculada automaticamente e aparece no Monitoramento Fisiológico.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-500 uppercase text-xs tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-3">Data</th>
                <th className="p-3">Horário</th>
                <th className="p-3">Adversário</th>
                <th className="p-3">Competição</th>
                <th className="p-3 text-center">Média equipe</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300 divide-y divide-zinc-800">
              {sortedMatches.map((match) => {
                const isExpanded = expandedMatchId === match.id;
                const avg = teamAverage(match.id);
                return (
                  <React.Fragment key={match.id}>
                    <tr
                      className="hover:bg-zinc-900/50 cursor-pointer"
                      onClick={() => setExpandedMatchId(prev => prev === match.id ? null : match.id)}
                    >
                      <td className="p-3">
                        {isExpanded ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                      </td>
                      <td className="p-3 font-medium text-white">
                        {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-3">{match.time || '—'}</td>
                      <td className="p-3 font-bold">{match.opponent || '—'}</td>
                      <td className="p-3 text-zinc-400">{match.competition || '—'}</td>
                      <td className="p-3 text-center">
                        {avg != null ? <span className="text-[#ccff00] font-black">{avg}</span> : <span className="text-zinc-600">—</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0 bg-zinc-900/70">
                          <div className="p-4 border-t border-zinc-800">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">PSE por atleta (0-10)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {activePlayers.map((player) => (
                                <div key={player.id} className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2 border border-zinc-800">
                                  <span className="text-xs text-white truncate flex-1" title={player.nickname || player.name}>
                                    {player.nickname || player.name}
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    value={stored[match.id]?.[player.id] ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                                      if (v === '' || (!Number.isNaN(v) && v >= 0 && v <= 10)) {
                                        save(match.id, player.id, v === '' ? '' : v);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs text-center"
                                    placeholder="PSE"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

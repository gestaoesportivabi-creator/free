import React, { useMemo, useState } from 'react';
import { MatchRecord, Player, MatchStats } from '../types';
import { Trophy, Medal, Filter, Crown } from 'lucide-react';

interface StatsRankingProps {
    players: Player[];
    matches: MatchRecord[];
}

const STAT_CATEGORIES: { key: keyof MatchStats; label: string; color: string }[] = [
    { key: 'goals', label: 'Gols Marcados', color: 'text-[#ccff00]' },
    { key: 'assists', label: 'Assistências', color: 'text-[#10b981]' },
    { key: 'tacklesWithBall', label: 'Desarmes (Posse)', color: 'text-emerald-400' },
    { key: 'passesCorrect', label: 'Passes Certos', color: 'text-blue-400' },
    { key: 'shotsOnTarget', label: 'Chutes no Gol', color: 'text-purple-400' },
    { key: 'minutesPlayed', label: 'Minutagem Total', color: 'text-orange-400' },
    { key: 'tacklesCounterAttack', label: 'Desarme Contra-Ataque', color: 'text-yellow-400' },
    { key: 'passesWrong', label: 'Passes Errados', color: 'text-red-400' }, // Negative stat usually, but ranked high to low
];

export const StatsRanking: React.FC<StatsRankingProps> = ({ players, matches }) => {
    const [selectedStat, setSelectedStat] = useState<keyof MatchStats>('goals');
    const [competitionFilter, setCompetitionFilter] = useState('Todas');

    const aggregatedStats = useMemo(() => {
        const statsMap: Record<string, { value: number, games: number, minutes: number }> = {};

        matches.forEach(match => {
            if (competitionFilter !== 'Todas' && match.competition !== competitionFilter) return;

            Object.entries(match.playerStats).forEach(([playerId, stats]) => {
                if (!statsMap[playerId]) {
                    statsMap[playerId] = { value: 0, games: 0, minutes: 0 };
                }
                
                statsMap[playerId].value += (stats[selectedStat] || 0);
                statsMap[playerId].games += 1;
                statsMap[playerId].minutes += stats.minutesPlayed;
            });
        });

        return statsMap;
    }, [matches, selectedStat, competitionFilter]);

    const sortedPlayers = useMemo(() => {
        return players
            .map(player => {
                const data = aggregatedStats[player.id] || { value: 0, games: 0, minutes: 0 };
                return {
                    ...player,
                    value: data.value,
                    games: data.games,
                    avgMinutes: data.games > 0 ? (data.minutes / data.games).toFixed(1) : 0
                };
            })
            .filter(p => p.games > 0) // Filter out players with no games in selected filter
            .sort((a, b) => b.value - a.value); // Descending sort
    }, [players, aggregatedStats]);

    const currentStatConfig = STAT_CATEGORIES.find(c => c.key === selectedStat);

    // Helpers for Podium Colors
    const getRingColor = (index: number) => {
        if (index === 0) return 'from-yellow-300 via-yellow-500 to-yellow-600'; // Gold
        if (index === 1) return 'from-slate-300 via-slate-400 to-slate-500'; // Silver
        if (index === 2) return 'from-orange-700 via-orange-500 to-orange-800'; // Bronze
        return 'from-[#10b981] to-purple-600'; // Purple for others
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* Header & Controls */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide italic">
                        <Trophy className="text-[#10b981]" /> Ranking de Estatísticas
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold mt-1">Líderes e destaques da temporada.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Competição</label>
                        <select 
                            value={competitionFilter} 
                            onChange={(e) => setCompetitionFilter(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#10b981] uppercase"
                        >
                            <option value="Todas">Todas</option>
                            <option value="Copa Santa Catarina">Copa SC</option>
                            <option value="Série Prata">Série Prata</option>
                            <option value="JASC">JASC</option>
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[200px]">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Estatística</label>
                        <select 
                            value={selectedStat} 
                            onChange={(e) => setSelectedStat(e.target.value as keyof MatchStats)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#10b981] uppercase"
                        >
                            {STAT_CATEGORIES.map(cat => (
                                <option key={cat.key} value={cat.key}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Instagram Style "Stories" - Top Performers */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-6 min-w-max px-2">
                    {sortedPlayers.slice(0, 8).map((player, index) => (
                        <div key={player.id} className="flex flex-col items-center gap-2 group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                            <div className={`relative p-[3px] rounded-full bg-gradient-to-tr ${getRingColor(index)} shadow-lg`}>
                                <div className="bg-black p-[2px] rounded-full">
                                    <div className="w-20 h-20 rounded-full overflow-hidden relative">
                                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                        {index === 0 && (
                                            <div className="absolute inset-0 bg-yellow-500/20 mix-blend-overlay"></div>
                                        )}
                                    </div>
                                </div>
                                {/* Rank Badge */}
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-black border border-zinc-800 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md">
                                    {index + 1}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-white truncate max-w-[80px]">{player.nickname || player.name.split(' ')[0]}</p>
                                <p className={`text-[10px] font-black ${currentStatConfig?.color} tracking-wider`}>
                                    {player.value} <span className="opacity-60 text-[8px] uppercase">{currentStatConfig?.label.split(' ')[0]}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Ranking Table */}
            <div className="bg-black rounded-3xl border border-zinc-900 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                        <tr>
                            <th className="p-4 text-center w-16">#</th>
                            <th className="p-4">Atleta</th>
                            <th className="p-4 hidden md:table-cell">Posição</th>
                            <th className="p-4 text-center">Jogos</th>
                            <th className="p-4 text-center">Min/Jogo</th>
                            <th className="p-4 text-right pr-8">{currentStatConfig?.label}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                        {sortedPlayers.map((player, index) => (
                            <tr key={player.id} className="group hover:bg-zinc-900/40 transition-colors">
                                <td className="p-4 text-center">
                                    {index < 3 ? (
                                        <div className="flex justify-center">
                                            {index === 0 && <Crown size={20} className="text-yellow-400 fill-yellow-400/20" />}
                                            {index === 1 && <Medal size={20} className="text-slate-300 fill-slate-300/20" />}
                                            {index === 2 && <Medal size={20} className="text-orange-400 fill-orange-400/20" />}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600 font-bold text-sm">{index + 1}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr ${getRingColor(index)}`}>
                                            <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-black">
                                                <img src={player.photoUrl} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm group-hover:text-[#10b981] transition-colors">{player.name}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase md:hidden">{player.position}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                    <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg uppercase tracking-wide">
                                        {player.position}
                                    </span>
                                </td>
                                <td className="p-4 text-center text-xs font-bold text-white">
                                    {player.games}
                                </td>
                                <td className="p-4 text-center text-xs font-bold text-zinc-400">
                                    {player.avgMinutes}'
                                </td>
                                <td className="p-4 text-right pr-8">
                                    <span className={`text-2xl font-black italic tracking-tighter ${currentStatConfig?.color}`}>
                                        {player.value}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};
import React, { useState, useMemo, useEffect } from 'react';
import { Player, MatchRecord, PhysicalAssessment, PlayerTimeControl, MatchStats } from '../types';
import { FileText, Calendar, User, Printer, Download, Activity, Trophy, Clock, AlertTriangle, BarChart3, Users, HeartPulse, Moon } from 'lucide-react';

const PSE_JOGOS_STORAGE_KEY = 'scout21_pse_jogos';
const PSE_TREINOS_STORAGE_KEY = 'scout21_pse_treinos';
const QUALIDADE_SONO_STORAGE_KEY = 'scout21_qualidade_sono';

// Tipo para lesão (mesmo formato usado em TeamManagement)
interface InjuryRecord {
    id: string;
    playerId?: string;
    date?: string;
    type: string;
    location: string;
    side: 'Direito' | 'Esquerdo' | 'Bilateral' | 'N/A';
    severity: string;
    origin: 'Treino' | 'Jogo' | 'Outros';
    startDate: string;
    endDate?: string;
    daysOut?: number;
}

interface ManagementReportProps {
    players: Player[];
    matches: MatchRecord[];
    assessments: PhysicalAssessment[];
    timeControls?: PlayerTimeControl[];
}

export const ManagementReport: React.FC<ManagementReportProps> = ({ 
    players, 
    matches, 
    assessments,
    timeControls = []
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pseJogos, setPseJogos] = useState<Record<string, Record<string, number>>>({});
    const [pseTreinos, setPseTreinos] = useState<Record<string, Record<string, number>>>({});
    const [qualidadeSono, setQualidadeSono] = useState<Record<string, Record<string, number>>>({});

    useEffect(() => {
        try {
            const j = localStorage.getItem(PSE_JOGOS_STORAGE_KEY);
            if (j) setPseJogos(JSON.parse(j));
            const t = localStorage.getItem(PSE_TREINOS_STORAGE_KEY);
            if (t) setPseTreinos(JSON.parse(t));
            const q = localStorage.getItem(QUALIDADE_SONO_STORAGE_KEY);
            if (q) setQualidadeSono(JSON.parse(q));
        } catch (_) {}
    }, []);

    const selectedPlayer = useMemo(() => {
        return players.find(p => p.id === selectedPlayerId);
    }, [players, selectedPlayerId]);

    // Filtrar matches por período
    const filteredMatches = useMemo(() => {
        if (!selectedPlayerId) return [];
        
        return matches.filter(match => {
            const matchDate = new Date(match.date);
            const hasPlayer = match.playerStats[selectedPlayerId];
            
            if (!hasPlayer) return false;
            
            if (startDate && matchDate < new Date(startDate)) return false;
            if (endDate && matchDate > new Date(endDate)) return false;
            
            return true;
        });
    }, [matches, selectedPlayerId, startDate, endDate]);

    // Calcular estatísticas do jogador
    const playerStats = useMemo(() => {
        if (!selectedPlayerId) return null;

        const stats = filteredMatches.reduce((acc, match) => {
            const pStats = match.playerStats[selectedPlayerId];
            if (pStats) {
                acc.games += 1;
                acc.minutes += pStats.minutesPlayed || 40;
                acc.goals += pStats.goals || 0;
                acc.assists += pStats.assists || 0;
                acc.shotsOnTarget += pStats.shotsOnTarget || 0;
                acc.shotsOffTarget += pStats.shotsOffTarget || 0;
                acc.passesCorrect += pStats.passesCorrect || 0;
                acc.passesWrong += pStats.passesWrong || 0;
                acc.tacklesWithBall += pStats.tacklesWithBall || 0;
                acc.tacklesWithoutBall += pStats.tacklesWithoutBall || 0;
                acc.tacklesCounterAttack += pStats.tacklesCounterAttack || 0;
                acc.wrongPassesTransition += pStats.wrongPassesTransition || 0;
            }
            return acc;
        }, {
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
            wrongPassesTransition: 0
        });

        return {
            ...stats,
            avgMinutes: stats.games > 0 ? Math.round(stats.minutes / stats.games) : 0
        };
    }, [filteredMatches, selectedPlayerId]);

    // Calcular informações de lesões
    const injuryInfo = useMemo(() => {
        if (!selectedPlayer || !selectedPlayer.injuryHistory) return null;

        const injuries: InjuryRecord[] = selectedPlayer.injuryHistory || [];
        
        // Filtrar lesões por período
        const filteredInjuries = injuries.filter(injury => {
            if (!startDate && !endDate) return true;
            const injuryStart = new Date(injury.startDate);
            if (startDate && injuryStart < new Date(startDate)) return false;
            if (endDate && injuryStart > new Date(endDate)) return false;
            return true;
        });

        let totalDaysLost = 0;
        const injuryTypes: Record<string, number> = {};
        const injuryByType: Record<string, number> = {}; // dias parado por tipo

        filteredInjuries.forEach(injury => {
            const injuryStartDate = injury.startDate || injury.date || '';
            if (!injuryStartDate) return;
            
            const start = new Date(injuryStartDate);
            const end = injury.endDate ? new Date(injury.endDate) : new Date();
            const daysLost = injury.daysOut || Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            totalDaysLost += daysLost;
            
            const type = injury.type || 'Outros';
            injuryTypes[type] = (injuryTypes[type] || 0) + 1;
            injuryByType[type] = (injuryByType[type] || 0) + daysLost;
        });

        // Contar jogos perdidos por lesão
        const gamesLost = filteredInjuries.reduce((acc, injury) => {
            const injuryStartDate = injury.startDate || injury.date || '';
            if (!injuryStartDate) return acc;
            
            const start = new Date(injuryStartDate);
            const end = injury.endDate ? new Date(injury.endDate) : new Date();
            
            // Contar jogos no período de lesão
            const lostGames = filteredMatches.filter(match => {
                const matchDate = new Date(match.date);
                return matchDate >= start && matchDate <= end;
            }).length;
            
            return acc + lostGames;
        }, 0);

        return {
            totalDaysLost,
            injuryTypes,
            injuryByType,
            injuries: filteredInjuries,
            gamesLost
        };
    }, [selectedPlayer, startDate, endDate, filteredMatches]);

    // Médias de PSE (jogos + treinos) e qualidade de sono do atleta
    const pseAndSonoAverages = useMemo(() => {
        if (!selectedPlayerId) return null;
        const pseValues: number[] = [];
        Object.values(pseJogos).forEach(byPlayer => {
            const v = byPlayer[selectedPlayerId];
            if (typeof v === 'number' && v >= 0 && v <= 10) pseValues.push(v);
        });
        Object.values(pseTreinos).forEach(byPlayer => {
            const v = byPlayer[selectedPlayerId];
            if (typeof v === 'number' && v >= 0 && v <= 10) pseValues.push(v);
        });
        const sonoValues: number[] = [];
        Object.values(qualidadeSono).forEach(byPlayer => {
            const v = byPlayer[selectedPlayerId];
            if (typeof v === 'number' && v >= 1 && v <= 5) sonoValues.push(v);
        });
        const avgPse = pseValues.length > 0
            ? Math.round((pseValues.reduce((a, b) => a + b, 0) / pseValues.length) * 10) / 10
            : null;
        const avgSono = sonoValues.length > 0
            ? Math.round((sonoValues.reduce((a, b) => a + b, 0) / sonoValues.length) * 10) / 10
            : null;
        return {
            avgPse,
            avgSono,
            countPse: pseValues.length,
            countSono: sonoValues.length
        };
    }, [selectedPlayerId, pseJogos, pseTreinos, qualidadeSono]);

    // Filtrar avaliações físicas
    const filteredAssessments = useMemo(() => {
        if (!selectedPlayerId) return [];
        
        return assessments
            .filter(a => a.playerId === selectedPlayerId)
            .filter(a => {
                if (!startDate && !endDate) return true;
                const assessmentDate = new Date(a.date);
                if (startDate && assessmentDate < new Date(startDate)) return false;
                if (endDate && assessmentDate > new Date(endDate)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [assessments, selectedPlayerId, startDate, endDate]);

    // Calcular rankings
    const rankings = useMemo(() => {
        if (!selectedPlayerId || !playerStats) return null;

        const statCategories: { key: keyof MatchStats; label: string }[] = [
            { key: 'goals', label: 'Gols' },
            { key: 'assists', label: 'Assistências' },
            { key: 'shotsOnTarget', label: 'Chutes no Gol' },
            { key: 'passesCorrect', label: 'Passes Certos' },
            { key: 'tacklesWithBall', label: 'Desarmes (Posse)' },
            { key: 'tacklesCounterAttack', label: 'Desarme Contra-Ataque' }
        ];

        const rankings: Record<string, number> = {};

        statCategories.forEach(({ key, label }) => {
            const playerValue = playerStats[key as keyof typeof playerStats] as number || 0;
            
            // Calcular ranking entre todos os jogadores
            const allPlayersStats = players.map(player => {
                const stats = filteredMatches.reduce((acc, match) => {
                    const pStats = match.playerStats[player.id];
                    if (pStats) {
                        acc += (pStats[key] || 0);
                    }
                    return acc;
                }, 0);
                return { playerId: player.id, value: stats };
            });

            const sorted = allPlayersStats.sort((a, b) => b.value - a.value);
            const position = sorted.findIndex(s => s.playerId === selectedPlayerId) + 1;
            
            rankings[label] = position || 0;
        });

        return rankings;
    }, [players, filteredMatches, selectedPlayerId, playerStats]);

    // Função para imprimir/PDF
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="text-[#00f0ff]" /> Relatório Gerencial
                        </h2>
                        <p className="text-zinc-500 text-xs font-bold mt-1">Análise completa do atleta para avaliação da diretoria</p>
                    </div>
                    {selectedPlayer && (
                        <button
                            onClick={handlePrint}
                            className="bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors print:hidden"
                        >
                            <Printer size={18} />
                            Imprimir / PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2">
                            <User size={12} /> Atleta
                        </label>
                        <select
                            value={selectedPlayerId}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold"
                        >
                            <option value="">Selecione um atleta...</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>{p.name} #{p.jerseyNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2">
                            <Calendar size={12} /> Data Inicial
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2">
                            <Calendar size={12} /> Data Final
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold"
                        />
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
                    {/* Cabeçalho do Relatório */}
                    <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg print:border-0 print:shadow-none">
                        <div className="flex items-center gap-6">
                            {selectedPlayer.photoUrl && (
                                <img 
                                    src={selectedPlayer.photoUrl} 
                                    alt={selectedPlayer.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-[#00f0ff]"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="text-3xl font-black text-white uppercase">{selectedPlayer.name}</h3>
                                <p className="text-zinc-400 font-bold mt-1">
                                    #{selectedPlayer.jerseyNumber} • {selectedPlayer.position} • {selectedPlayer.age} anos
                                </p>
                                {(startDate || endDate) && (
                                    <p className="text-zinc-500 text-sm font-bold mt-2">
                                        Período: {startDate || 'Início'} a {endDate || 'Atual'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informações de Lesões */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lesões */}
                        {injuryInfo && (
                            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" /> Histórico de Lesões
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                                        <span className="text-zinc-400 font-bold uppercase text-sm">Total de Dias Parados</span>
                                        <span className="text-white font-black text-lg">{injuryInfo.totalDaysLost} dias</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                                        <span className="text-zinc-400 font-bold uppercase text-sm">Jogos Perdidos por Lesão</span>
                                        <span className="text-red-400 font-black text-lg">{injuryInfo.gamesLost} jogos</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold uppercase text-sm">Quantidade de Lesões</span>
                                        <span className="text-white font-black text-lg">{injuryInfo.injuries.length} lesões</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PSE e Qualidade de Sono */}
                        {pseAndSonoAverages && (pseAndSonoAverages.avgPse != null || pseAndSonoAverages.avgSono != null) && (
                            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                    <HeartPulse className="text-[#00f0ff]" /> PSE e Qualidade de Sono
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pseAndSonoAverages.avgPse != null && (
                                        <div className="border border-zinc-900 rounded-xl p-4">
                                            <p className="text-zinc-500 font-bold uppercase text-xs mb-1 flex items-center gap-2">
                                                <Activity size={14} /> Média PSE (Jogos e Treinos)
                                            </p>
                                            <p className="text-[#00f0ff] font-black text-2xl">{pseAndSonoAverages.avgPse}</p>
                                            <p className="text-zinc-500 text-xs mt-1">escala 0–10 • {pseAndSonoAverages.countPse} registros</p>
                                        </div>
                                    )}
                                    {pseAndSonoAverages.avgSono != null && (
                                        <div className="border border-zinc-900 rounded-xl p-4">
                                            <p className="text-zinc-500 font-bold uppercase text-xs mb-1 flex items-center gap-2">
                                                <Moon size={14} /> Média Qualidade de Sono
                                            </p>
                                            <p className="text-amber-400 font-black text-2xl">{pseAndSonoAverages.avgSono} <span className="text-zinc-500 font-bold text-base">/ 5</span></p>
                                            <p className="text-zinc-500 text-xs mt-1">escala 1–5 • {pseAndSonoAverages.countSono} noites avaliadas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tipos de Lesões */}
                    {injuryInfo && injuryInfo.injuries.length > 0 && (
                        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                            <h4 className="text-xl font-black text-white uppercase mb-4">Tipos de Lesões</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(injuryInfo.injuryTypes).map(([type, count]) => (
                                    <div key={type} className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                        <span className="text-zinc-400 font-bold text-sm">{type}</span>
                                        <span className="text-white font-black">
                                            {count} {count === 1 ? 'lesão' : 'lesões'} ({injuryInfo.injuryByType[type]} dias)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Estatísticas de Jogos */}
                    {playerStats && (
                        <>
                            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                    <Activity className="text-[#00f0ff]" /> Estatísticas de Jogos
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Total de Jogos</p>
                                        <p className="text-white font-black text-2xl">{playerStats.games}</p>
                                    </div>
                                    {injuryInfo && (
                                        <div className="text-center border border-zinc-900 rounded-xl p-4">
                                            <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Jogos Perdidos</p>
                                            <p className="text-red-400 font-black text-2xl">{injuryInfo.gamesLost}</p>
                                        </div>
                                    )}
                                    <div className="text-center border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Minutos Totais</p>
                                        <p className="text-white font-black text-2xl">{playerStats.minutes}</p>
                                    </div>
                                    <div className="text-center border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Média de Minutos</p>
                                        <p className="text-[#00f0ff] font-black text-2xl">{playerStats.avgMinutes} min</p>
                                    </div>
                                </div>
                            </div>

                            {/* Estatísticas do Scout Coletivo */}
                            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                                <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                    <BarChart3 className="text-[#00f0ff]" /> Estatísticas do Scout Coletivo
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Gols</p>
                                        <p className="text-[#ccff00] font-black text-2xl">{playerStats.goals}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Assistências</p>
                                        <p className="text-blue-400 font-black text-2xl">{playerStats.assists}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Chutes no Gol</p>
                                        <p className="text-purple-400 font-black text-2xl">{playerStats.shotsOnTarget}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Chutes para Fora</p>
                                        <p className="text-orange-400 font-black text-2xl">{playerStats.shotsOffTarget}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Passes Certos</p>
                                        <p className="text-green-400 font-black text-2xl">{playerStats.passesCorrect}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Passes Errados</p>
                                        <p className="text-red-400 font-black text-2xl">{playerStats.passesWrong}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Desarmes (Posse)</p>
                                        <p className="text-emerald-400 font-black text-2xl">{playerStats.tacklesWithBall}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Desarmes (S/Posse)</p>
                                        <p className="text-yellow-400 font-black text-2xl">{playerStats.tacklesWithoutBall}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Desarme C/A</p>
                                        <p className="text-cyan-400 font-black text-2xl">{playerStats.tacklesCounterAttack}</p>
                                    </div>
                                    <div className="border border-zinc-900 rounded-xl p-4">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Erro Transição</p>
                                        <p className="text-red-500 font-black text-2xl">{playerStats.wrongPassesTransition}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Rankings */}
                    {rankings && (
                        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                            <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                <Trophy className="text-[#00f0ff]" /> Posição nos Rankings
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(rankings).map(([stat, position]) => (
                                    <div key={stat} className="border border-zinc-900 rounded-xl p-4 text-center">
                                        <p className="text-zinc-500 font-bold uppercase text-xs mb-2">{stat}</p>
                                        <p className={`font-black text-3xl ${position <= 3 ? 'text-[#00f0ff]' : 'text-white'}`}>
                                            {position}º
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Avaliações Físicas */}
                    {filteredAssessments.length > 0 && (
                        <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                            <h4 className="text-xl font-black text-white uppercase mb-4">Avaliações Físicas</h4>
                            <div className="space-y-4">
                                {filteredAssessments.map((assessment) => (
                                    <div key={assessment.id} className="border border-zinc-900 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="text-white font-black text-lg">
                                                {new Date(assessment.date).toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="text-[#00f0ff] font-black text-xl">
                                                {assessment.bodyFat}% BF
                                            </p>
                                        </div>
                                        {(assessment as any).actionPlan && (
                                            <p className="text-zinc-400 text-sm font-bold mt-2 border-t border-zinc-900 pt-2">
                                                {(assessment as any).actionPlan}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dualidades - Relacionamentos entre Jogadores */}
                    {filteredMatches.length > 0 && (() => {
                        // Agregar relacionamentos de todas as partidas
                        const allRelationships: Array<{
                            player1Id: string;
                            player1Name: string;
                            player2Id: string;
                            player2Name: string;
                            totalPasses: number;
                            totalAssists: number;
                        }> = [];

                        filteredMatches.forEach(match => {
                            if (match.playerRelationships) {
                                Object.entries(match.playerRelationships).forEach(([player1Id, relationships]) => {
                                    Object.entries(relationships).forEach(([player2Id, stats]) => {
                                        const player1 = players.find(p => String(p.id).trim() === player1Id);
                                        const player2 = players.find(p => String(p.id).trim() === player2Id);
                                        
                                        if (player1 && player2) {
                                            // Verificar se já existe relacionamento (ordem pode variar)
                                            const existing = allRelationships.find(r => 
                                                (r.player1Id === player1Id && r.player2Id === player2Id) ||
                                                (r.player1Id === player2Id && r.player2Id === player1Id)
                                            );
                                            
                                            if (existing) {
                                                existing.totalPasses += stats.passes;
                                                existing.totalAssists += stats.assists;
                                            } else {
                                                allRelationships.push({
                                                    player1Id,
                                                    player1Name: player1.name,
                                                    player2Id,
                                                    player2Name: player2.name,
                                                    totalPasses: stats.passes,
                                                    totalAssists: stats.assists,
                                                });
                                            }
                                        }
                                    });
                                });
                            }
                        });

                        // Filtrar apenas relacionamentos que envolvem o jogador selecionado
                        const playerRelationships = allRelationships.filter(r => 
                            String(r.player1Id).trim() === selectedPlayerId || 
                            String(r.player2Id).trim() === selectedPlayerId
                        ).sort((a, b) => (b.totalPasses + b.totalAssists) - (a.totalPasses + a.totalAssists));

                        if (playerRelationships.length > 0) {
                            return (
                                <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                                    <h4 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                                        <Users className="text-[#00f0ff]" /> Dualidades
                                    </h4>
                                    <p className="text-zinc-400 text-xs mb-4">
                                        Relacionamentos de passes e assistências com outros jogadores
                                    </p>
                                    <div className="space-y-3">
                                        {playerRelationships.map((rel, index) => {
                                            const otherPlayer = String(rel.player1Id).trim() === selectedPlayerId 
                                                ? rel.player2Name 
                                                : rel.player1Name;
                                            return (
                                                <div key={index} className="border border-zinc-900 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="text-white font-bold text-sm">
                                                            {selectedPlayer?.name} ↔ {otherPlayer}
                                                        </p>
                                                        <p className="text-[#00f0ff] font-black text-lg">
                                                            {rel.totalPasses + rel.totalAssists} interações
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-900">
                                                        <div>
                                                            <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Passes</p>
                                                            <p className="text-green-400 font-black text-xl">{rel.totalPasses}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Assistências</p>
                                                            <p className="text-blue-400 font-black text-xl">{rel.totalAssists}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}
        </div>
    );
};


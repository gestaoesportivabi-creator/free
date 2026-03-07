import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, Plus, Save, Trash2 } from 'lucide-react';
import { PlayerTimeControl, PlayerTimeEntry, MatchRecord, Player } from '../types';
import { timeControlsApi } from '../services/api';

interface TimeControlProps {
    match: MatchRecord;
    players: Player[];
    onSave?: (timeControls: PlayerTimeControl[]) => void;
}

export const TimeControl: React.FC<TimeControlProps> = ({ match, players, onSave }) => {
    const [timeControls, setTimeControls] = useState<PlayerTimeControl[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Obter jogadores que participaram desta partida (memoizado para evitar re-renders)
    const activePlayers = React.useMemo(() => {
        return players.filter(p => {
            if (!match.playerStats || !match.playerStats[p.id]) return false;
            return true;
        });
    }, [players, match.playerStats]);

    // Carregar dados existentes do backend quando o componente monta ou o match muda
    useEffect(() => {
        const loadTimeControls = async () => {
            try {
                setIsLoading(true);
                const existing = await timeControlsApi.getByMatchId(match.id);
                
                // Criar mapa dos existentes por playerId
                const existingMap = new Map<string, PlayerTimeControl>();
                existing.forEach(tc => {
                    existingMap.set(tc.playerId, tc);
                });

                // Inicializar com jogadores ativos, usando dados existentes ou criando novos
                const initialTimeControls = activePlayers.map(player => {
                    const existingTc = existingMap.get(player.id);
                    if (existingTc) {
                        // Usar dados existentes
                        return existingTc;
                    }
                    
                    // Criar novo registro
                    const playerStats = match.playerStats?.[player.id];
                    return {
                        id: `${match.id}-${player.id}`,
                        matchId: match.id,
                        date: match.date,
                        playerId: player.id,
                        playerName: playerStats ? (playerStats as any).playerName || player.name : player.name,
                        position: playerStats ? (playerStats as any).position || player.position : player.position,
                        jerseyNumber: playerStats ? (playerStats as any).jerseyNumber || player.jerseyNumber : player.jerseyNumber,
                        timeEntries: [{ entryTime: '', exitTime: undefined }],
                        totalTime: 0
                    };
                });
                
                setTimeControls(initialTimeControls);
            } catch (error) {
                console.error('Erro ao carregar controles de tempo:', error);
                // Em caso de erro, inicializar com dados padrão
                const defaultTimeControls = activePlayers.map(player => {
                    const playerStats = match.playerStats?.[player.id];
                    return {
                        id: `${match.id}-${player.id}`,
                        matchId: match.id,
                        date: match.date,
                        playerId: player.id,
                        playerName: playerStats ? (playerStats as any).playerName || player.name : player.name,
                        position: playerStats ? (playerStats as any).position || player.position : player.position,
                        jerseyNumber: playerStats ? (playerStats as any).jerseyNumber || player.jerseyNumber : player.jerseyNumber,
                        timeEntries: [{ entryTime: '', exitTime: undefined }],
                        totalTime: 0
                    };
                });
                setTimeControls(defaultTimeControls);
            } finally {
                setIsLoading(false);
            }
        };

        if (activePlayers.length > 0) {
            loadTimeControls();
        } else {
            setIsLoading(false);
        }
    }, [match.id, activePlayers.length, JSON.stringify(activePlayers.map(p => p.id))]); // Recarregar quando o match ou jogadores mudarem
    
    // Funções helper (definidas antes de serem usadas)
    const parseTimeToMinutes = (timeStr: string): number | null => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return null;
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (isNaN(minutes) || isNaN(seconds)) return null;
        return minutes + (seconds / 60);
    };

    const formatMinutesToTime = (minutes: number): string => {
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Função helper para calcular tempo total de um timeControl
    const calculateTotalTime = (tc: PlayerTimeControl): number => {
        let total = 0;
        tc.timeEntries.forEach(entry => {
            if (entry.entryTime && entry.exitTime) {
                const entryMin = parseTimeToMinutes(entry.entryTime);
                const exitMin = parseTimeToMinutes(entry.exitTime);
                if (entryMin !== null && exitMin !== null && exitMin > entryMin) {
                    total += exitMin - entryMin;
                }
            }
        });
        return total;
    };

    // Calcular tempo total quando entradas/saídas mudarem (usando useMemo para evitar loops)
    const timeControlsWithTotals = useMemo(() => {
        return timeControls.map(tc => ({
            ...tc,
            totalTime: calculateTotalTime(tc)
        }));
    }, [timeControls]);

    const addTimeEntry = (playerId: string) => {
        setTimeControls(prev => prev.map(tc => {
            if (tc.playerId === playerId) {
                return {
                    ...tc,
                    timeEntries: [...tc.timeEntries, { entryTime: '', exitTime: undefined }]
                };
            }
            return tc;
        }));
    };

    const removeTimeEntry = (playerId: string, entryIndex: number) => {
        setTimeControls(prev => prev.map(tc => {
            if (tc.playerId === playerId) {
                const newEntries = tc.timeEntries.filter((_, idx) => idx !== entryIndex);
                return {
                    ...tc,
                    timeEntries: newEntries.length > 0 ? newEntries : [{ entryTime: '', exitTime: undefined }]
                };
            }
            return tc;
        }));
    };

    const updateTimeEntry = (playerId: string, entryIndex: number, field: 'entryTime' | 'exitTime', value: string) => {
        setTimeControls(prev => prev.map(tc => {
            if (tc.playerId === playerId) {
                const newEntries = [...tc.timeEntries];
                if (field === 'exitTime' && value && !newEntries[entryIndex].exitTime) {
                    // Se está preenchendo uma saída, criar automaticamente próxima entrada se necessário
                    if (entryIndex === newEntries.length - 1) {
                        newEntries.push({ entryTime: '', exitTime: undefined });
                    }
                }
                newEntries[entryIndex] = {
                    ...newEntries[entryIndex],
                    [field]: value || undefined
                };
                // Calcular totalTime imediatamente para manter sincronizado
                const updatedTc = {
                    ...tc,
                    timeEntries: newEntries
                };
                return {
                    ...updatedTc,
                    totalTime: calculateTotalTime(updatedTc)
                };
            }
            return tc;
        }));
    };

    const handleSave = async () => {
        try {
            let savedCount = 0;
            let updatedCount = 0;
            
            // Usar timeControlsWithTotals para salvar (com totais calculados)
            // Salvar todos os time controls de uma vez usando o novo método
            try {
                const saved = await timeControlsApi.saveForMatch(match.id, timeControlsWithTotals);
                if (saved && saved.length > 0) {
                    savedCount = saved.length;
                    console.log(`✅ Salvos ${savedCount} controles de tempo para o jogo`);
                }
            } catch (error) {
                console.error('Erro ao salvar controles de tempo:', error);
                throw error;
            }
            
            if (savedCount > 0) {
                alert(`✅ Tempos de jogo salvos com sucesso! (${savedCount} controles salvos)`);
                
                // Recarregar dados após salvar
                const existing = await timeControlsApi.getByMatchId(match.id);
                const existingMap = new Map<string, PlayerTimeControl>();
                existing.forEach(tc => {
                    existingMap.set(tc.playerId, tc);
                });
                
                const updatedTimeControls = activePlayers.map(player => {
                    const existingTc = existingMap.get(player.id);
                    if (existingTc) {
                        return existingTc;
                    }
                    const playerStats = match.playerStats?.[player.id];
                    return {
                        id: `${match.id}-${player.id}`,
                        matchId: match.id,
                        date: match.date,
                        playerId: player.id,
                        playerName: playerStats ? (playerStats as any).playerName || player.name : player.name,
                        position: playerStats ? (playerStats as any).position || player.position : player.position,
                        jerseyNumber: playerStats ? (playerStats as any).jerseyNumber || player.jerseyNumber : player.jerseyNumber,
                        timeEntries: [{ entryTime: '', exitTime: undefined }],
                        totalTime: 0
                    };
                });
                
                setTimeControls(updatedTimeControls);
            } else {
                alert('⚠️ Nenhum tempo foi salvo. Verifique se há dados para salvar.');
            }
            
            if (onSave) {
                onSave(timeControlsWithTotals);
            }
        } catch (error) {
            console.error('Erro ao salvar tempos:', error);
            alert('❌ Erro ao salvar tempos de jogo. Verifique o console.');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                    <p className="text-white text-center py-8">Carregando dados de entradas e saídas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                            <ArrowUpDown className="text-[#10b981]" /> Entradas e Saídas
                        </h2>
                        <p className="text-zinc-500 text-xs font-bold mt-1">
                            Partida: {match.competition} - {new Date(match.date).toLocaleDateString('pt-BR')} vs {match.opponent}
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-4 py-2 font-bold uppercase text-xs rounded-xl transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                        <Save size={16} /> Salvar Tempos
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-zinc-950 text-[10px] text-zinc-400 uppercase tracking-wider font-bold border-b border-zinc-800">
                                <th className="p-3 border-r border-zinc-900">Data</th>
                                <th className="p-3 border-r border-zinc-900">Atleta</th>
                                <th className="p-3 border-r border-zinc-900">Posição</th>
                                <th className="p-3 border-r border-zinc-900">Nº</th>
                                {(() => {
                                    const maxEntries = timeControlsWithTotals.length > 0 
                                        ? Math.max(...timeControlsWithTotals.map(tc => tc.timeEntries.length), 1)
                                        : 1;
                                    return Array.from({ length: maxEntries }, (_, i) => (
                                        <th key={i} className="p-3 border-r border-zinc-900 text-center" colSpan={2}>
                                            Entrada {i + 1} / Saída {i + 1}
                                        </th>
                                    ));
                                })()}
                                <th className="p-3 text-center">Tempo Total</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeControlsWithTotals.map((tc, idx) => (
                                <tr key={tc.id} className="border-b border-zinc-900 hover:bg-zinc-950">
                                    <td className="p-3 border-r border-zinc-900 text-white text-xs">
                                        {new Date(tc.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-3 border-r border-zinc-900 text-white text-xs font-bold">
                                        {tc.playerName}
                                    </td>
                                    <td className="p-3 border-r border-zinc-900 text-white text-xs">
                                        {tc.position}
                                    </td>
                                    <td className="p-3 border-r border-zinc-900 text-white text-xs text-center">
                                        #{tc.jerseyNumber}
                                    </td>
                                    {tc.timeEntries.map((entry, entryIdx) => {
                                        const hasEntry = entry && entry.entryTime;
                                        return (
                                            <React.Fragment key={entryIdx}>
                                                <td className="p-2 border-r border-zinc-900">
                                                    <input
                                                        type="text"
                                                        placeholder="00:00"
                                                        value={entry?.entryTime || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '' || /^\d{0,2}:?\d{0,2}$/.test(value.replace(':', ''))) {
                                                                updateTimeEntry(tc.playerId, entryIdx, 'entryTime', value);
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#10b981]"
                                                    />
                                                </td>
                                                <td className="p-2 border-r border-zinc-900">
                                                    {hasEntry ? (
                                                        <input
                                                            type="text"
                                                            placeholder="00:00"
                                                            value={entry?.exitTime || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '' || /^\d{0,2}:?\d{0,2}$/.test(value.replace(':', ''))) {
                                                                    updateTimeEntry(tc.playerId, entryIdx, 'exitTime', value);
                                                                }
                                                            }}
                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#10b981]"
                                                        />
                                                    ) : (
                                                        <span className="text-zinc-700 text-xs">-</span>
                                                    )}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-3 text-center text-white text-xs font-bold">
                                        {formatMinutesToTime(tc.totalTime)}
                                    </td>
                                    <td className="p-2">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => addTimeEntry(tc.playerId)}
                                                className="p-1 text-[#10b981] hover:bg-zinc-900 rounded"
                                                title="Adicionar entrada/saída"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            {tc.timeEntries.length > 1 && (
                                                <button
                                                    onClick={() => removeTimeEntry(tc.playerId, tc.timeEntries.length - 1)}
                                                    className="p-1 text-red-500 hover:bg-zinc-900 rounded"
                                                    title="Remover última entrada/saída"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


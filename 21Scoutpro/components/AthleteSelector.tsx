import React, { useMemo, useState } from 'react';
import { Users, Shield } from 'lucide-react';
import { Player } from '../types';

export interface AthleteSelectorProps {
    players: Player[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
}

type TabType = 'goleiros' | 'linha';

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
    players,
    selectedIds,
    onSelectionChange,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('goleiros');

    const goalkeepers = useMemo(
        () => players.filter((p) => p.position === 'Goleiro'),
        [players]
    );
    const fieldPlayers = useMemo(
        () => players.filter((p) => p.position !== 'Goleiro'),
        [players]
    );

    const selectedGoalkeepers = useMemo(
        () => goalkeepers.filter((p) => selectedIds.has(String(p.id).trim())).length,
        [goalkeepers, selectedIds]
    );
    const selectedFieldPlayers = useMemo(
        () => fieldPlayers.filter((p) => selectedIds.has(String(p.id).trim())).length,
        [fieldPlayers, selectedIds]
    );

    const allGoalkeepersSelected = goalkeepers.length > 0 && selectedGoalkeepers === goalkeepers.length;
    const allFieldPlayersSelected = fieldPlayers.length > 0 && selectedFieldPlayers === fieldPlayers.length;

    const togglePlayer = (playerId: string, checked: boolean) => {
        const id = String(playerId).trim();
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        onSelectionChange(newSet);
    };

    const selectAllGoalkeepers = () => {
        const newSet = new Set(selectedIds);
        goalkeepers.forEach((p) => newSet.add(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const deselectAllGoalkeepers = () => {
        const newSet = new Set(selectedIds);
        goalkeepers.forEach((p) => newSet.delete(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const selectAllFieldPlayers = () => {
        const newSet = new Set(selectedIds);
        fieldPlayers.forEach((p) => newSet.add(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const deselectAllFieldPlayers = () => {
        const newSet = new Set(selectedIds);
        fieldPlayers.forEach((p) => newSet.delete(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const renderPlayerCards = (list: Player[]) => (
        <div className="max-h-96 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {list.map((player) => {
                const isSelected = selectedIds.has(String(player.id).trim());
                return (
                    <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id, !isSelected)}
                        className={`flex flex-col items-center justify-center p-3 min-h-[72px] rounded-xl cursor-pointer transition-all ${
                            isSelected
                                ? 'bg-[#00f0ff]/15 border-2 border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                                : 'bg-zinc-950 border-2 border-zinc-800 hover:border-[#00f0ff]/50'
                        }`}
                    >
                        <span className="text-[#00f0ff] font-black text-lg leading-none">#{player.jerseyNumber}</span>
                        <span className="text-white font-bold text-[11px] leading-tight truncate w-full text-center mt-0.5">
                            {player.name}
                        </span>
                        <span className="text-zinc-500 text-[9px] uppercase mt-0.5">{player.position}</span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                <Users className="text-[#00f0ff]" size={16} /> Selecionar Atletas
            </h3>

            {/* Abas */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('goleiros')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-xs transition-colors ${
                        activeTab === 'goleiros'
                            ? 'bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#00f0ff]'
                            : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                >
                    <Shield size={14} /> Goleiros
                    {goalkeepers.length > 0 && (
                        <span className="text-zinc-500 text-[10px]">
                            ({selectedGoalkeepers}/{goalkeepers.length})
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('linha')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-xs transition-colors ${
                        activeTab === 'linha'
                            ? 'bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#00f0ff]'
                            : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                >
                    <Users size={14} /> Jogadores de linha
                    {fieldPlayers.length > 0 && (
                        <span className="text-zinc-500 text-[10px]">
                            ({selectedFieldPlayers}/{fieldPlayers.length})
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'goleiros' && (
                <>
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={allGoalkeepersSelected ? deselectAllGoalkeepers : selectAllGoalkeepers}
                            disabled={goalkeepers.length === 0}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg text-zinc-300 hover:text-white font-bold uppercase text-[10px] transition-colors"
                        >
                            {allGoalkeepersSelected ? 'Desmarcar todos os goleiros' : 'Selecionar todos os goleiros'}
                        </button>
                    </div>
                    {goalkeepers.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-4">Nenhum goleiro cadastrado</p>
                    ) : (
                        renderPlayerCards(goalkeepers)
                    )}
                </>
            )}

            {activeTab === 'linha' && (
                <>
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={allFieldPlayersSelected ? deselectAllFieldPlayers : selectAllFieldPlayers}
                            disabled={fieldPlayers.length === 0}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg text-zinc-300 hover:text-white font-bold uppercase text-[10px] transition-colors"
                        >
                            {allFieldPlayersSelected ? 'Desmarcar todos os jogadores' : 'Selecionar todos os jogadores'}
                        </button>
                    </div>
                    {fieldPlayers.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-4">Nenhum jogador de linha cadastrado</p>
                    ) : (
                        renderPlayerCards(fieldPlayers)
                    )}
                </>
            )}
        </div>
    );
};

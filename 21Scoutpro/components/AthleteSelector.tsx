import React, { useMemo, useState } from 'react';
import { Users, Shield, Ambulance, Ban } from 'lucide-react';
import { Player } from '../types';
import type { PlayerPhysiology } from '../utils/playerPhysiologyForMatch';

export interface AthleteSelectorProps {
    players: Player[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    /** IDs de atletas que não podem ser selecionados (ex.: lesionados ou suspensos) */
    disabledPlayerIds?: Set<string>;
    /** Por que estão desabilitados: 'injured' = ícone ambulância, 'suspended' = ícone suspensão */
    playerStatusMap?: Record<string, 'injured' | 'suspended'>;
    /** PSR (dia do jogo), PSE (últ. treino), sono (dia do jogo) por jogador */
    playerPhysiology?: Record<string, PlayerPhysiology>;
}

type TabType = 'goleiros' | 'linha';

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
    players,
    selectedIds,
    onSelectionChange,
    disabledPlayerIds,
    playerStatusMap = {},
    playerPhysiology = {},
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('goleiros');

    const isDisabled = (playerId: string) => disabledPlayerIds?.has(String(playerId).trim()) ?? false;

    const goalkeepers = useMemo(
        () => players.filter((p) => p.position === 'Goleiro'),
        [players]
    );
    const fieldPlayers = useMemo(
        () => players.filter((p) => p.position !== 'Goleiro'),
        [players]
    );

    const selectableGoalkeepers = useMemo(
        () => goalkeepers.filter((p) => !isDisabled(p.id)),
        [goalkeepers, disabledPlayerIds]
    );
    const selectableFieldPlayers = useMemo(
        () => fieldPlayers.filter((p) => !isDisabled(p.id)),
        [fieldPlayers, disabledPlayerIds]
    );

    const selectedGoalkeepers = useMemo(
        () => goalkeepers.filter((p) => selectedIds.has(String(p.id).trim())).length,
        [goalkeepers, selectedIds]
    );
    const selectedFieldPlayers = useMemo(
        () => fieldPlayers.filter((p) => selectedIds.has(String(p.id).trim())).length,
        [fieldPlayers, selectedIds]
    );

    const allGoalkeepersSelected = selectableGoalkeepers.length > 0 && selectableGoalkeepers.every((p) => selectedIds.has(String(p.id).trim()));
    const allFieldPlayersSelected = selectableFieldPlayers.length > 0 && selectableFieldPlayers.every((p) => selectedIds.has(String(p.id).trim()));

    const togglePlayer = (playerId: string, checked: boolean) => {
        const id = String(playerId).trim();
        if (checked && isDisabled(playerId)) return;
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
        selectableGoalkeepers.forEach((p) => newSet.add(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const deselectAllGoalkeepers = () => {
        const newSet = new Set(selectedIds);
        goalkeepers.forEach((p) => newSet.delete(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const selectAllFieldPlayers = () => {
        const newSet = new Set(selectedIds);
        selectableFieldPlayers.forEach((p) => newSet.add(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const deselectAllFieldPlayers = () => {
        const newSet = new Set(selectedIds);
        fieldPlayers.forEach((p) => newSet.delete(String(p.id).trim()));
        onSelectionChange(newSet);
    };

    const displayName = (p: Player) => (p.nickname && p.nickname.trim() !== '') ? p.nickname.trim() : p.name;

    const formatPhysio = (v: number | null) => (v != null ? String(v) : '—');
    const physio = (playerId: string) => playerPhysiology[String(playerId).trim()] ?? { psrMatchDay: null, pseAfterLastTraining: null, sleepMatchDay: null };

    const renderPlayerCards = (list: Player[]) => (
        <div className="max-h-[22rem] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {list.map((player) => {
                const id = String(player.id).trim();
                const isSelected = selectedIds.has(id);
                const disabled = isDisabled(player.id);
                const status = playerStatusMap[id];
                const name = displayName(player);
                const ph = physio(player.id);
                return (
                    <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id, !isSelected)}
                        disabled={disabled && !isSelected}
                        className={`flex flex-row items-stretch gap-1.5 p-2 min-h-0 rounded-xl transition-all border-2 text-left ${
                            disabled
                                ? 'opacity-90 cursor-not-allowed border-red-800 bg-red-600/90 hover:bg-red-600/90'
                                : isSelected
                                    ? 'cursor-pointer border-green-400 bg-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                                    : 'cursor-pointer border-green-800 bg-green-600/90 hover:bg-green-500 hover:border-green-600'
                        }`}
                    >
                        {/* Esquerda: foto + número + posição */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="relative flex items-center justify-center">
                                {status === 'injured' && (
                                    <span className="absolute -top-0.5 -right-0.5 z-10 bg-red-600/90 p-0.5 rounded" title="Lesão">
                                        <Ambulance size={8} className="text-white" />
                                    </span>
                                )}
                                {status === 'suspended' && (
                                    <span className="absolute -top-0.5 -right-0.5 z-10 bg-amber-600/90 p-0.5 rounded" title="Suspenso">
                                        <Ban size={8} className="text-white" />
                                    </span>
                                )}
                                <div className={`w-9 h-9 rounded-full overflow-hidden border flex-shrink-0 ${disabled ? 'border-red-900 bg-zinc-800' : isSelected ? 'border-white bg-zinc-800' : 'border-green-900 bg-zinc-800'} transition-transform hover:scale-105`}>
                                    {player.photoUrl ? (
                                        <img src={player.photoUrl} alt="" className="w-full h-full object-cover scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px] font-medium">
                                            {name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`text-[9px] font-normal mt-0.5 leading-tight ${disabled ? 'text-red-200' : 'text-green-100'}`}>Nº{player.jerseyNumber}</span>
                            <span className={`text-[8px] uppercase leading-tight ${disabled ? 'text-red-200/80' : 'text-green-100'}`}>{player.position}</span>
                        </div>

                        {/* Centro: apelido */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                            <span className={`text-[11px] font-bold truncate leading-tight ${disabled ? 'text-red-100' : 'text-white'}`}>
                                {name}
                            </span>
                        </div>

                        {/* Direita: dados fisiológicos só para atletas disponíveis */}
                        {!disabled && (
                            <div
                                className="flex flex-col justify-center gap-1 flex-shrink-0 text-right rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-1.5 py-1 min-w-[4rem]"
                                title="Fisiologia: PSR (dia do jogo), PSE (última sessão de treino), Sono (dia do jogo)"
                            >
                                <div
                                    className="flex items-center justify-end gap-1 leading-tight text-green-100"
                                    title="PSR (esforço percebido de recuperação) registrada no dia do jogo"
                                >
                                    <span className="text-[8px] opacity-90 uppercase">PSR</span>
                                    <span className="text-xs font-bold tabular-nums text-[#00f0ff]">{formatPhysio(ph.psrMatchDay)}</span>
                                </div>
                                <div
                                    className="flex items-center justify-end gap-1 leading-tight text-green-100"
                                    title="PSE (esforço percebido na sessão) da última sessão de treino antes do jogo — inclui treino no próprio dia do jogo se houver"
                                >
                                    <span className="text-[8px] opacity-90 uppercase">PSE</span>
                                    <span className="text-xs font-bold tabular-nums text-[#00f0ff]">{formatPhysio(ph.pseAfterLastTraining)}</span>
                                </div>
                                <div
                                    className="flex items-center justify-end gap-1 leading-tight text-green-100"
                                    title="Qualidade do sono no dia do jogo (escala 1-5)"
                                >
                                    <span className="text-[8px] opacity-90 uppercase">Sono</span>
                                    <span className="text-xs font-bold tabular-nums text-[#00f0ff]">{formatPhysio(ph.sleepMatchDay)}</span>
                                </div>
                            </div>
                        )}
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
                            ({selectedFieldPlayers}/{fieldPlayers.length}
                            {selectableFieldPlayers.length < fieldPlayers.length && ` · ${selectableFieldPlayers.length} disponíveis`})
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

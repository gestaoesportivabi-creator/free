import React, { useState, useMemo } from 'react';
import { Player, WeeklySchedule, ScheduleDay, MaxLoad, LoadType } from '../types';
import { EXERCISES } from '../constants';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { Dumbbell, User, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

interface AcademiaProps {
    schedules?: WeeklySchedule[];
    players?: Player[];
}

export const Academia: React.FC<AcademiaProps> = ({ schedules = [], players = [] }) => {
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
    const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

    // Eventos de Academia das programações ativas
    const academiaEvents = useMemo(() => {
        const activeSchedules = schedules.filter(s => 
            (s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true') && 
            s.days && Array.isArray(s.days)
        );
        const events: Array<{
            scheduleId: string;
            scheduleTitle: string;
            date: string;
            weekday: string;
            time: string;
            location: string;
            exerciseId: string;
            exerciseName: string;
            cargaPercent: number;
            loadType: LoadType;
        }> = [];

        activeSchedules.forEach(schedule => {
            const flatDays = normalizeScheduleDays(schedule);
            flatDays.forEach(day => {
                if ((day.activity === 'Academia' || day.activity === 'Musculação') && day.exerciseName && day.cargaPercent && day.cargaPercent > 0) {
                    const ex = EXERCISES.find(e => e.id === day.exerciseName);
                    events.push({
                        scheduleId: schedule.id,
                        scheduleTitle: schedule.title || '',
                        date: day.date,
                        weekday: day.weekday || '',
                        time: day.time || '',
                        location: day.location || '',
                        exerciseId: day.exerciseName,
                        exerciseName: ex?.name || day.exerciseName,
                        cargaPercent: day.cargaPercent,
                        loadType: ex?.defaultLoadType || 'Kg',
                    });
                }
            });
        });

        return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    }, [schedules]);

    // Calcular carga para cada atleta selecionado
    const athleteLoads = useMemo(() => {
        const result: Array<{
            playerId: string;
            playerName: string;
            exerciseId: string;
            exerciseName: string;
            loadType: LoadType;
            maxLoad: number;
            cargaPercent: number;
            calculatedLoad: number;
        }> = [];

        selectedPlayerIds.forEach(playerId => {
            const player = players.find(p => p.id === playerId);
            if (!player) return;

            const maxLoads = player.maxLoads || [];
            academiaEvents.forEach(ev => {
                const maxLoad = maxLoads.find(ml => 
                    ml.exerciseId === ev.exerciseId || 
                    ml.exerciseName?.toLowerCase() === ev.exerciseName?.toLowerCase()
                );
                const maxValue = maxLoad?.value ?? 0;
                const calculated = maxValue > 0 
                    ? Math.round(maxValue * (ev.cargaPercent / 100)) 
                    : 0;

                result.push({
                    playerId,
                    playerName: player.nickname || player.name,
                    exerciseId: ev.exerciseId,
                    exerciseName: ev.exerciseName,
                    loadType: ev.loadType,
                    maxLoad: maxValue,
                    cargaPercent: ev.cargaPercent,
                    calculatedLoad: calculated,
                });
            });
        });

        return result;
    }, [selectedPlayerIds, players, academiaEvents]);

    const togglePlayer = (playerId: string) => {
        setSelectedPlayerIds(prev => {
            const next = new Set(prev);
            if (next.has(playerId)) next.delete(playerId);
            else next.add(playerId);
            return next;
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    };

    if (academiaEvents.length === 0) {
        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="bg-black p-6 rounded-3xl border border-zinc-900 shadow-lg">
                    <div className="flex items-center justify-center flex-col py-16">
                        <Dumbbell size={64} className="text-[#00f0ff] mb-6 opacity-50" />
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide mb-4">
                            Musculação
                        </h2>
                        <p className="text-zinc-500 text-sm font-bold text-center max-w-md">
                            Não há eventos de Musculação na programação ativa. Crie uma programação, marque atividades como &quot;Musculação&quot;, defina o exercício e a % de carga.
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
                    <Dumbbell className="text-[#00f0ff]" /> Academia
                </h2>
                <p className="text-zinc-500 text-xs font-bold mb-6">
                    Selecione os atletas para ver o peso ou repetições calculados com base na carga máxima cadastrada e na % definida na programação.
                </p>

                {/* Seletor de Atletas */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User size={16} /> Selecione os atletas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => togglePlayer(p.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                    selectedPlayerIds.has(p.id)
                                        ? 'bg-[#00f0ff] text-black border-2 border-[#00f0ff]'
                                        : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                                }`}
                            >
                                {selectedPlayerIds.has(p.id) && <CheckCircle size={14} className="inline mr-1 -mt-0.5" />}
                                {p.nickname || p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resultado: Carga por Atleta */}
                {selectedPlayerIds.size > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Dumbbell size={16} /> Carga calculada por atleta
                        </h3>
                        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-zinc-900 text-zinc-500 uppercase text-xs tracking-wider">
                                        <th className="p-4 border-b border-zinc-800">Atleta</th>
                                        <th className="p-4 border-b border-zinc-800">Exercício</th>
                                        <th className="p-4 border-b border-zinc-800 text-center">% Carga</th>
                                        <th className="p-4 border-b border-zinc-800">Carga Máx. Cadastrada</th>
                                        <th className="p-4 border-b border-zinc-800 font-bold text-[#00f0ff]">Peso / Reps a fazer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {athleteLoads.map((row, idx) => (
                                        <tr key={`${row.playerId}-${row.exerciseId}-${idx}`} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                                            <td className="p-4 font-bold text-white">{row.playerName}</td>
                                            <td className="p-4 text-zinc-300">{row.exerciseName}</td>
                                            <td className="p-4 text-center font-bold text-amber-500">{row.cargaPercent}%</td>
                                            <td className="p-4 text-zinc-400">
                                                {row.maxLoad > 0 
                                                    ? `${row.maxLoad} ${row.loadType === 'Kg' ? 'kg' : 'reps'}`
                                                    : <span className="text-zinc-600 italic">Não cadastrado</span>
                                                }
                                            </td>
                                            <td className="p-4 font-bold text-[#00f0ff]">
                                                {row.maxLoad > 0 
                                                    ? `${row.calculatedLoad} ${row.loadType === 'Kg' ? 'kg' : 'reps'}`
                                                    : <span className="text-zinc-600 italic">—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Lista de eventos de Academia (referência) */}
                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
                        Eventos de Musculação na programação
                    </h3>
                    <div className="space-y-2">
                        {academiaEvents.map((ev, idx) => (
                            <div 
                                key={idx}
                                className="flex items-center gap-4 py-2 px-3 rounded-lg bg-zinc-900/50 text-zinc-400 text-xs"
                            >
                                <span className="font-bold text-white w-24">{formatDate(ev.date)}</span>
                                <span className="w-16">{ev.time}</span>
                                <span className="text-amber-500 font-bold">{ev.exerciseName}</span>
                                <span className="text-zinc-500">{ev.cargaPercent}%</span>
                                <span className="text-zinc-600">{ev.location || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

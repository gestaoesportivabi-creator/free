import React, { useState, useMemo } from 'react';
import { WeeklySchedule, ScheduleDay } from '../types';
import { normalizeScheduleDays, normalizeWeeklySchedule } from '../utils/scheduleUtils';
import { CalendarClock, Plus, Save, Printer, Share2, Trash2, Calendar, CheckCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';

interface ScheduleProps {
    schedules: WeeklySchedule[];
    onSaveSchedule: (schedule: WeeklySchedule) => void;
    onDeleteSchedule: (id: string) => void;
    onToggleActive?: (id: string) => void; // New prop for flagging
}

export const Schedule: React.FC<ScheduleProps> = ({ schedules, onSaveSchedule, onDeleteSchedule, onToggleActive }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);

    // Normalizar schedules carregados da API (formato agrupado -> flat)
    const normalizedSchedules = useMemo(() => schedules.map(normalizeWeeklySchedule), [schedules]);

    const generateDays = (start: string, end: string) => {
        const days: ScheduleDay[] = [];
        
        // Parse dates correctly to avoid timezone issues
        // Split YYYY-MM-DD and create date in local timezone
        const [startYear, startMonth, startDay] = start.split('-').map(Number);
        const [endYear, endMonth, endDay] = end.split('-').map(Number);
        
        const startDate = new Date(startYear, startMonth - 1, startDay);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        
        // Array de nomes dos dias da semana em português
        const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const weekdayIndex = d.getDay();
            const weekdayName = weekdays[weekdayIndex];
            
            days.push({
                date: dateStr,
                weekday: weekdayName,
                activity: 'Treino',
                time: '09:00',
                location: 'Ginásio',
                notes: ''
            });
        }
        return days;
    };

    const handleCreate = () => {
        if (!startDate || !endDate) {
            alert('Selecione as datas de início e fim.');
            return;
        }
        
        const days = generateDays(startDate, endDate);
        
        // Format dates correctly for title (avoid timezone issues)
        const formatDateForTitle = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        };
        
        const newSchedule: WeeklySchedule = {
            id: Date.now().toString(),
            startDate,
            endDate,
            weekStart: startDate,
            weekEnd: endDate,
            title: `Programação ${formatDateForTitle(startDate)} a ${formatDateForTitle(endDate)}`,
            days
        };
        
        setCurrentSchedule(newSchedule);
        setIsCreating(false);
    };

    const updateDay = (index: number, field: keyof ScheduleDay, value: string) => {
        if (!currentSchedule) return;
        const updatedDays = [...currentSchedule.days];
        updatedDays[index] = { ...updatedDays[index], [field]: value };
        setCurrentSchedule({ ...currentSchedule, days: updatedDays });
    };

    const addPeriodToDay = (index: number) => {
        if (!currentSchedule) return;
        
        const dayToClone = currentSchedule.days[index];
        const newPeriod: ScheduleDay = {
            ...dayToClone,
            time: '',
            activity: 'Musculação',
            location: '',
            notes: '',
        };

        const updatedDays = [...currentSchedule.days];
        updatedDays.splice(index + 1, 0, newPeriod);
        
        setCurrentSchedule({ ...currentSchedule, days: updatedDays });
    };

    const removePeriod = (index: number) => {
        if (!currentSchedule) return;
        if (currentSchedule.days.length <= 1) {
             alert("Não é possível remover a última linha.");
             return;
        }
        const updatedDays = currentSchedule.days.filter((_, i) => i !== index);
        setCurrentSchedule({ ...currentSchedule, days: updatedDays });
    };

    const saveCurrent = () => {
        if (currentSchedule) {
            onSaveSchedule(currentSchedule);
            setCurrentSchedule(null); // Return to list view after save
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = (schedule: WeeklySchedule) => {
        let text = `📅 *${schedule.title}*\n\n`;
        if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
            text += 'Nenhum dia configurado.\n';
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            return;
        }
        schedule.days.forEach(day => {
            // Format date correctly (avoid timezone issues)
            const formatDateForShare = (dateStr: string) => {
                if (!dateStr) return '';
                const [year, month, dayNum] = dateStr.split('-').map(Number);
                return `${String(dayNum).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
            };
            
            text += `*${day.weekday?.toUpperCase() || ''} (${formatDateForShare(day.date)})*\n`;
            text += `⏰ ${day.time || ''} - ${day.activity || ''}\n`;
            text += `📍 ${day.location || ''}\n`;
            if (day.notes) text += `ℹ️ ${day.notes}\n`;
            text += `----------------\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <CalendarClock className="text-[#10b981]" /> Programação Semanal
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold mt-1">Cronograma de treinos, jogos e viagens.</p>
                </div>
                
                <div className="flex gap-2">
                    {!currentSchedule && !isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#34d399] text-white px-6 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                        >
                            <Plus size={16} /> Nova Programação
                        </button>
                    )}
                    
                    {currentSchedule && (
                        <>
                            <button onClick={() => handleShare(currentSchedule)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2">
                                <Share2 size={16} /> WhatsApp
                            </button>
                            <button onClick={handlePrint} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2">
                                <Printer size={16} /> PDF
                            </button>
                            <button onClick={saveCurrent} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2">
                                <Save size={16} /> Salvar
                            </button>
                            <button onClick={() => setCurrentSchedule(null)} className="bg-zinc-900 border border-zinc-700 text-zinc-400 px-4 py-3 rounded-xl font-bold uppercase text-xs">
                                Voltar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Creation Modal / Form */}
            {isCreating && (
                <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 animate-slide-down max-w-2xl mx-auto">
                    <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-[#10b981]" /> Definir Período
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data Início</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#10b981] [color-scheme:dark]" 
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data Fim</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                min={startDate || undefined}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#10b981] [color-scheme:dark]" 
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white font-bold text-xs uppercase">Cancelar</button>
                        <button onClick={handleCreate} className="bg-[#10b981] text-white px-6 py-2 rounded-xl font-bold uppercase text-xs">Gerar Tabela</button>
                    </div>
                </div>
            )}

            {/* Editing / Viewing Current Schedule */}
            {currentSchedule && (() => {
                const days = normalizeScheduleDays(currentSchedule);
                return days.length > 0 && (
                <div className="bg-white text-black p-0 md:p-8 rounded-3xl shadow-xl overflow-hidden print:shadow-none print:p-0">
                    <div className="bg-black text-white p-6 md:rounded-t-2xl print:bg-black print:text-white mb-4 md:mb-0">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-center">{currentSchedule.title}</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-zinc-100 text-zinc-600 text-xs uppercase tracking-wider border-b border-zinc-300">
                                    <th className="p-4 w-40 border-r border-zinc-200">Dia</th>
                                    <th className="p-4 w-32 border-r border-zinc-200 text-black">Horário</th>
                                    <th className="p-4 w-40 border-r border-zinc-200">Atividade</th>
                                    <th className="p-4 w-48 border-r border-zinc-200 text-black">Local</th>
                                    <th className="p-4">Observações (ex: exercício, % de carga máxima)</th>
                                    <th className="p-4 w-10 text-center print:hidden">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {currentSchedule.days && Array.isArray(currentSchedule.days) && currentSchedule.days.map((day, idx) => (
                                    <tr key={idx} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors group">
                                        <td className="p-4 border-r border-zinc-200 bg-zinc-50 font-bold relative group">
                                            <div className="uppercase text-xs text-zinc-500">{day.weekday}</div>
                                            <div className="text-lg">
                                                {(() => {
                                                    // Parse date correctly to avoid timezone issues
                                                    const [year, month, dayNum] = day.date.split('-').map(Number);
                                                    return `${dayNum}/${month}`;
                                                })()}
                                            </div>
                                            
                                            <button 
                                                onClick={() => addPeriodToDay(idx)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#10b981] hover:bg-[#34d399] text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-sm"
                                                title="Adicionar Período"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </td>
                                        <td className="p-4 border-r border-zinc-200">
                                            <input 
                                                type="text" 
                                                value={day.time} 
                                                onChange={e => updateDay(idx, 'time', e.target.value)}
                                                className="w-full bg-transparent outline-none font-bold text-center text-black placeholder-zinc-300"
                                                placeholder="00:00"
                                            />
                                        </td>
                                        <td className="p-4 border-r border-zinc-200">
                                            <select 
                                                value={day.activity} 
                                                onChange={e => updateDay(idx, 'activity', e.target.value)}
                                                className={`w-full bg-transparent outline-none font-bold cursor-pointer ${
                                                    day.activity === 'Jogo' ? 'text-green-600' : 
                                                    day.activity === 'Folga' ? 'text-orange-500' : 
                                                    day.activity === 'Treino' ? 'text-blue-600' :
                                                    day.activity === 'Viagem' ? 'text-zinc-700' : 
                                                    day.activity === 'Academia' ? 'text-amber-600' : 'text-black'
                                                }`}
                                            >
                                                <option value="Treino">Treino</option>
                                                <option value="Jogo">Jogo</option>
                                                <option value="Folga">Folga</option>
                                                <option value="Viagem">Viagem</option>
                                                <option value="Musculação">Musculação</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </td>
                                        <td className="p-4 border-r border-zinc-200">
                                            <input 
                                                type="text" 
                                                value={day.location} 
                                                onChange={e => updateDay(idx, 'location', e.target.value)}
                                                className="w-full bg-transparent outline-none text-black"
                                                placeholder="Local..."
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={day.notes || ''} 
                                                onChange={e => updateDay(idx, 'notes', e.target.value)}
                                                className="w-full bg-transparent outline-none text-zinc-500 italic"
                                                placeholder="Notas (ex: Uniforme branco)..."
                                            />
                                        </td>
                                        <td className="p-4 text-center print:hidden">
                                            <button 
                                                onClick={() => removePeriod(idx)}
                                                className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remover linha"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                );
            })()}

            {/* Saved Schedules List - Expandable Cards */}
            {!currentSchedule && !isCreating && normalizedSchedules.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 border-l-4 border-[#10b981] pl-2">Programações Salvas</h3>
                    {normalizedSchedules
                        .filter(sch => sch && sch.id) // Remover schedules inválidos
                        .sort((a, b) => {
                            // Ordenar: ativos primeiro, depois por data de criação (mais recente primeiro)
                            if (a.isActive && !b.isActive) return -1;
                            if (!a.isActive && b.isActive) return 1;
                            const aCreated = a.createdAt || 0;
                            const bCreated = b.createdAt || 0;
                            return bCreated - aCreated;
                        })
                        .map(sch => (
                        <SavedScheduleCard 
                            key={sch.id} 
                            schedule={sch} 
                            onOpen={() => setCurrentSchedule(sch)}
                            onDelete={() => onDeleteSchedule(sch.id)}
                            onToggleActive={() => onToggleActive && onToggleActive(sch.id)}
                            onShare={() => handleShare(sch)}
                        />
                    ))}
                </div>
            )}

        </div>
    );
};

// Sub-component for Saved Schedule Item
const SavedScheduleCard: React.FC<{ 
    schedule: WeeklySchedule, 
    onOpen: () => void, 
    onDelete: () => void,
    onToggleActive: () => void,
    onShare: () => void
}> = ({ schedule, onOpen, onDelete, onToggleActive, onShare }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`bg-black rounded-3xl overflow-hidden transition-all duration-300 ${
            schedule.isActive 
            ? 'border-2 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.2)]' 
            : 'border border-zinc-800'
        }`}>
            {/* Header / Summary View */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/50">
                
                <div className="flex items-center gap-4 flex-1">
                    <button 
                        onClick={onToggleActive}
                        className={`p-2 rounded-full transition-colors ${
                            schedule.isActive ? 'bg-[#ccff00] text-black' : 'bg-zinc-900 text-zinc-600 hover:text-zinc-400'
                        }`}
                        title={schedule.isActive ? 'Programação Ativa (Selecionada)' : 'Marcar como Ativa'}
                    >
                        {schedule.isActive ? <CheckCircle size={20} /> : <Flag size={20} />}
                    </button>
                    
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">{schedule.title}</h3>
                            {schedule.isActive && (
                                <span className="bg-[#ccff00] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Vigente</span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase mt-1">
                            {(() => {
                                // Format dates correctly (avoid timezone issues)
                                const formatDate = (dateStr: string) => {
                                    if (!dateStr) return '';
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                                };
                                return `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`;
                            })()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                     <button onClick={onShare} className="bg-green-900/20 hover:bg-green-900/40 text-green-500 p-2 rounded-lg transition-colors" title="Compartilhar">
                        <Share2 size={18} />
                    </button>
                    <button onClick={onOpen} className="bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors" title="Editar">
                        Editar / Ver
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="bg-zinc-900 hover:bg-zinc-800 text-white p-2 rounded-lg transition-colors border border-zinc-700">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={onDelete} className="bg-red-950/30 hover:bg-red-900/50 text-red-500 p-2 rounded-lg transition-colors ml-2" title="Excluir">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Expanded Content (Preview Table) */}
            {isExpanded && (
                <div className="p-4 border-t border-zinc-800 animate-slide-down bg-black">
                     <div className="overflow-x-auto">
                        {schedule.days && Array.isArray(schedule.days) && schedule.days.length > 0 ? (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-zinc-500 uppercase border-b border-zinc-800">
                                        <th className="pb-2">Dia</th>
                                        <th className="pb-2">Horário</th>
                                        <th className="pb-2">Atividade</th>
                                        <th className="pb-2">Local</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-300">
                                    {schedule.days.map((day, idx) => (
                                        <tr key={idx} className="border-b border-zinc-900 last:border-0">
                                            <td className="py-2 font-bold text-white">{day.weekday || ''}</td>
                                            <td className="py-2">{day.time || ''}</td>
                                            <td className={`py-2 font-bold ${
                                                day.activity === 'Jogo' ? 'text-green-500' : 
                                                day.activity === 'Folga' ? 'text-orange-500' : 'text-blue-400'
                                            }`}>{day.activity || ''}</td>
                                            <td className="py-2 text-zinc-500">{day.location || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-zinc-500 text-center py-4">
                                Nenhum dia configurado nesta programação.
                            </div>
                        )}
                     </div>
                </div>
            )}
        </div>
    );
};

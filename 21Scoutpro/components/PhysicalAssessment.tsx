import React, { useState } from 'react';
import { Player, PhysicalAssessment } from '../types';
import { Calculator, Ruler, Save, Trash2, Calendar, User, FileText } from 'lucide-react';

interface PhysicalAssessmentProps {
    players: Player[];
    assessments: PhysicalAssessment[];
    onSaveAssessment: (assessment: PhysicalAssessment) => void;
}

export const PhysicalAssessmentTab: React.FC<PhysicalAssessmentProps> = ({ players, assessments, onSaveAssessment }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [actionPlan, setActionPlan] = useState('');
    
    // Skinfolds state
    const [skinfolds, setSkinfolds] = useState({
        chest: 0,
        axilla: 0,
        subscapular: 0,
        triceps: 0,
        abdominal: 0,
        suprailiac: 0,
        thigh: 0
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const player = players.find(p => p.id === selectedPlayerId);
        if (!player) {
            alert("Selecione um atleta.");
            return;
        }

        const sum7 = Object.values(skinfolds).reduce((a, b) => a + b, 0);
        const age = player.age || 25; // Default logic if age is missing

        // Jackson & Pollock 7-site Formula (Men)
        // Body Density = 1.112 - 0.00043499 * (sum7) + 0.00000055 * (sum7)^2 - 0.00028826 * (age)
        const bodyDensity = 1.112 - (0.00043499 * sum7) + (0.00000055 * Math.pow(sum7, 2)) - (0.00028826 * age);
        
        // Siri Equation: %Fat = (495 / Body Density) - 450
        const bodyFat = (495 / bodyDensity) - 450;

        const newAssessment: PhysicalAssessment = {
            id: Date.now().toString(),
            playerId: selectedPlayerId,
            date: assessmentDate,
            ...skinfolds,
            bodyFatPercent: isNaN(bodyFat) ? 0 : parseFloat(bodyFat.toFixed(2)),
            actionPlan: actionPlan
        };

        onSaveAssessment(newAssessment);
        
        // Reset form
        setSkinfolds({ chest: 0, axilla: 0, subscapular: 0, triceps: 0, abdominal: 0, suprailiac: 0, thigh: 0 });
        setActionPlan('');
        alert(`Avaliação salva com sucesso! BF Estimado: ${newAssessment.bodyFatPercent}%`);
    };

    // Show all history sorted by date (create a copy to avoid mutating the original array)
    const history = [...assessments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Ruler className="text-[#10b981]" /> Avaliação Física
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold mt-1">Protocolo Jackson & Pollock (7 Dobras)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form Column */}
                <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-white font-bold uppercase mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4">
                        <Calculator size={18} className="text-[#10b981]"/> Nova Coleta
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><User size={12}/> Atleta</label>
                                <select 
                                    required
                                    value={selectedPlayerId} 
                                    onChange={e => setSelectedPlayerId(e.target.value)} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#10b981] font-bold"
                                >
                                    <option value="">Selecione um atleta...</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><Calendar size={12}/> Data da Coleta</label>
                                <input 
                                    required
                                    type="date" 
                                    value={assessmentDate} 
                                    onChange={e => setAssessmentDate(e.target.value)} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#10b981] font-bold" 
                                />
                            </div>
                        </div>

                        <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-900">
                            <p className="text-[10px] text-[#10b981] font-black uppercase mb-4 tracking-widest">Dobras Cutâneas (mm)</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {Object.keys(skinfolds).map(key => (
                                    <div key={key}>
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-2 capitalize">
                                            {key
                                                .replace('axilla', 'Axilar Média')
                                                .replace('subscapular', 'Subescapular')
                                                .replace('suprailiac', 'Supra-ilíaca')
                                                .replace('thigh', 'Coxa')
                                                .replace('chest', 'Peitoral')
                                                .replace('triceps', 'Tríceps')
                                                .replace('abdominal', 'Abdominal')
                                            }
                                        </label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="0.1"
                                            value={(skinfolds as any)[key]} 
                                            onChange={e => setSkinfolds({...skinfolds, [key]: parseFloat(e.target.value)})} 
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#10b981] text-center font-black text-lg focus:bg-zinc-900 transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Plan Text Area */}
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><FileText size={12}/> Plano de Ação / Orientações</label>
                            <textarea 
                                value={actionPlan}
                                onChange={e => setActionPlan(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#10b981] font-medium h-32 resize-none"
                                placeholder="Descreva as orientações nutricionais, metas de treino ou cuidados específicos..."
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-[#10b981] hover:bg-[#34d399] text-white px-8 py-4 rounded-xl font-black uppercase tracking-wide flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Save size={20} /> Salvar e Calcular
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Column */}
                <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col h-full">
                    <h3 className="text-white font-bold uppercase mb-4 flex items-center gap-2">
                        Histórico Geral
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {history.length === 0 && (
                            <p className="text-zinc-600 text-xs text-center mt-10">Nenhuma avaliação registrada.</p>
                        )}
                        {history.map(assessment => {
                            const playerName = players.find(p => p.id === assessment.playerId)?.name || 'Atleta Desconhecido';
                            return (
                                <div key={assessment.id} className="bg-black p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors group">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className="text-white font-bold text-sm">{playerName}</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500 text-[10px] font-bold">{new Date(assessment.date).toLocaleDateString()}</span>
                                            <span className="text-[#10b981] font-black text-xl">{assessment.bodyFatPercent}% <span className="text-[10px] text-zinc-500 font-bold uppercase">Gordura</span></span>
                                        </div>
                                    </div>
                                    
                                    {assessment.actionPlan && (
                                        <div className="mt-2 pt-2 border-t border-zinc-900">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Plano de Ação:</p>
                                            <p className="text-zinc-300 text-xs line-clamp-3">{assessment.actionPlan}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

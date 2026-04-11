import React, { useState, useMemo, useEffect } from 'react';
import { Player, PhysicalAssessment } from '../types';
import { Calculator, Ruler, Save, Trash2, Calendar, User, FileText, TrendingDown, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface PhysicalAssessmentProps {
    players: Player[];
    assessments: PhysicalAssessment[];
    onSaveAssessment: (assessment: PhysicalAssessment) => void;
    onDeleteAssessment?: (id: string) => void;
}

export const PhysicalAssessmentTab: React.FC<PhysicalAssessmentProps> = ({ players, assessments, onSaveAssessment, onDeleteAssessment }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [actionPlan, setActionPlan] = useState('');
    const [sex, setSex] = useState<'M' | 'F'>('M');
    const [weight, setWeight] = useState(0);
    const [height, setHeight] = useState(0);
    const [viewTab, setViewTab] = useState<'form' | 'evolution' | 'ranking'>('form');
    
    const [skinfolds, setSkinfolds] = useState({
        chest: 0,
        axilla: 0,
        subscapular: 0,
        triceps: 0,
        abdominal: 0,
        suprailiac: 0,
        thigh: 0
    });

    /** Peso e altura do cadastro do atleta (aba Elenco) ao selecionar ou ao limpar seleção */
    useEffect(() => {
        if (!selectedPlayerId) {
            setWeight(0);
            setHeight(0);
            return;
        }
        const p = players.find(pl => pl.id === selectedPlayerId);
        if (!p) return;
        const w = p.weight;
        const h = p.height;
        setWeight(typeof w === 'number' && !Number.isNaN(w) && w > 0 ? w : 0);
        setHeight(typeof h === 'number' && !Number.isNaN(h) && h > 0 ? h : 0);
    }, [selectedPlayerId, players]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const player = players.find(p => p.id === selectedPlayerId);
        if (!player) { alert("Selecione um atleta."); return; }

        const sum7 = Object.values(skinfolds).reduce((a, b) => a + b, 0);
        const age = player.age || 25;

        let bodyDensity: number;
        if (sex === 'F') {
            bodyDensity = 1.097 - (0.00046971 * sum7) + (0.00000056 * Math.pow(sum7, 2)) - (0.00012828 * age);
        } else {
            bodyDensity = 1.112 - (0.00043499 * sum7) + (0.00000055 * Math.pow(sum7, 2)) - (0.00028826 * age);
        }
        const bodyFat = (495 / bodyDensity) - 450;
        const imc = weight > 0 && height > 0 ? weight / Math.pow(height / 100, 2) : 0;

        const newAssessment: PhysicalAssessment = {
            id: Date.now().toString(),
            playerId: selectedPlayerId,
            date: assessmentDate,
            weight,
            height,
            bodyFat: isNaN(bodyFat) ? 0 : parseFloat(bodyFat.toFixed(2)),
            ...skinfolds,
            bodyFatPercent: isNaN(bodyFat) ? 0 : parseFloat(bodyFat.toFixed(2)),
            actionPlan: actionPlan,
            muscleMass: 0,
            vo2max: 0,
            flexibility: 0,
            speed: 0,
            strength: 0,
            agility: 0,
        } as PhysicalAssessment;

        onSaveAssessment(newAssessment);
        setSkinfolds({ chest: 0, axilla: 0, subscapular: 0, triceps: 0, abdominal: 0, suprailiac: 0, thigh: 0 });
        setActionPlan('');
        const pAfter = players.find(pl => pl.id === selectedPlayerId);
        const wR = pAfter?.weight;
        const hR = pAfter?.height;
        setWeight(typeof wR === 'number' && !Number.isNaN(wR) && wR > 0 ? wR : 0);
        setHeight(typeof hR === 'number' && !Number.isNaN(hR) && hR > 0 ? hR : 0);
        alert(`Avaliação salva! BF: ${newAssessment.bodyFatPercent}%${imc > 0 ? ` · IMC: ${imc.toFixed(1)}` : ''}`);
    };

    const history = [...assessments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const evolutionData = useMemo(() => {
      if (!selectedPlayerId) return [];
      return assessments
        .filter(a => a.playerId === selectedPlayerId)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(a => ({
          date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          bf: (a as PhysicalAssessment & { bodyFatPercent?: number }).bodyFatPercent ?? a.bodyFat ?? 0,
        }));
    }, [selectedPlayerId, assessments]);

    const teamRanking = useMemo(() => {
      const latestByPlayer: Record<string, PhysicalAssessment> = {};
      assessments.forEach(a => {
        if (!latestByPlayer[a.playerId] || a.date > latestByPlayer[a.playerId].date) {
          latestByPlayer[a.playerId] = a;
        }
      });
      return Object.values(latestByPlayer)
        .map(a => {
          const p = players.find(pl => pl.id === a.playerId);
          const bfVal = (a as PhysicalAssessment & { bodyFatPercent?: number }).bodyFatPercent ?? a.bodyFat ?? 0;
          return { name: p?.nickname || p?.name || 'Desconhecido', bf: bfVal, playerId: a.playerId };
        })
        .sort((a, b) => a.bf - b.bf);
    }, [assessments, players]);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="bg-black p-6 rounded-3xl border border-zinc-800 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Ruler className="text-[#00f0ff]" /> Avaliação Física
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold mt-1">Protocolo Jackson & Pollock (7 Dobras) · Masculino & Feminino</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    {(['form', 'evolution', 'ranking'] as const).map(tab => (
                        <button key={tab} onClick={() => setViewTab(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${viewTab === tab ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                            {tab === 'form' ? 'Nova Coleta' : tab === 'evolution' ? 'Evolução' : 'Ranking'}
                        </button>
                    ))}
                </div>
            </div>

            {viewTab === 'evolution' && (
                <div className="bg-black border border-zinc-900 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingDown size={18} className="text-[#00f0ff]" />
                        <h3 className="text-white font-bold uppercase">Evolução %BF por Atleta</h3>
                        <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className="ml-auto bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none">
                            <option value="">Selecione um atleta</option>
                            {players.map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
                        </select>
                    </div>
                    {evolutionData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={evolutionData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="bf" stroke="#00f0ff" strokeWidth={2} dot={{ fill: '#00f0ff', r: 4 }} name="% Gordura">
                                        <LabelList dataKey="bf" position="top" fill="#fff" fontSize={12} fontWeight="bold" formatter={(v: number) => `${v}%`} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm py-8 text-center">{selectedPlayerId ? 'Nenhuma avaliação para este atleta.' : 'Selecione um atleta para ver a evolução.'}</p>
                    )}
                </div>
            )}

            {viewTab === 'ranking' && (
                <div className="bg-black border border-zinc-900 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Users size={18} className="text-[#00f0ff]" />
                        <h3 className="text-white font-bold uppercase">Ranking %BF da Equipe</h3>
                    </div>
                    {teamRanking.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={teamRanking} layout="vertical" margin={{ left: 60, right: 30, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#666" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" stroke="#71717a" tick={{ fontSize: 12 }} width={80} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} formatter={(v: number) => [`${v}%`, '% Gordura']} />
                                    <Bar dataKey="bf" fill="#00f0ff" radius={[0, 4, 4, 0]} barSize={20} name="% Gordura">
                                        <LabelList dataKey="bf" position="right" fill="#fff" fontSize={12} fontWeight="bold" formatter={(v: number) => `${v}%`} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm py-8 text-center">Nenhuma avaliação registrada.</p>
                    )}
                </div>
            )}

            {viewTab === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-white font-bold uppercase mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4">
                        <Calculator size={18} className="text-[#00f0ff]"/> Nova Coleta
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><User size={12}/> Atleta</label>
                                <select required value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold">
                                    <option value="">Selecione...</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 flex items-center gap-2"><Calendar size={12}/> Data</label>
                                <input required type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-[#00f0ff] font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Sexo (fórmula)</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setSex('M')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${sex === 'M' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>Masculino</button>
                                    <button type="button" onClick={() => setSex('F')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${sex === 'F' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>Feminino</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Peso (kg)</label>
                                <input type="number" min="0" step="0.1" value={weight || ''} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#00f0ff] text-center font-bold" placeholder="kg" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Altura (cm)</label>
                                <input type="number" min="0" step="1" value={height || ''} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-[#00f0ff] text-center font-bold" placeholder="cm" />
                            </div>
                            {weight > 0 && height > 0 && (
                                <div className="col-span-2 flex items-end">
                                    <div className="bg-zinc-900/50 rounded-xl px-4 py-3 border border-zinc-800 w-full text-center">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">IMC: </span>
                                        <span className="text-white font-black text-lg">{(weight / Math.pow(height / 100, 2)).toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
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
                                <div key={assessment.id} className="bg-black p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors group relative">
                                    {onDeleteAssessment && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Excluir esta avaliação? Esta ação não pode ser desfeita.')) {
                                                    onDeleteAssessment(assessment.id);
                                                }
                                            }}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                                            title="Excluir avaliação"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className="text-white font-bold text-sm">{playerName}</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500 text-[10px] font-bold">{new Date(assessment.date).toLocaleDateString()}</span>
                                            <span className="text-[#10b981] font-black text-xl">{(assessment as PhysicalAssessment & { bodyFatPercent?: number }).bodyFatPercent ?? assessment.bodyFat ?? 0}% <span className="text-[10px] text-zinc-500 font-bold uppercase">Gordura</span></span>
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
            )}
        </div>
    );
};

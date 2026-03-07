import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, Trophy, Plus, Save, Trash2, Edit2, RefreshCw, X, Upload, BarChart3, Award, Flag } from 'lucide-react';
import { Championship } from '../types';
import { setChampionshipCards } from '../utils/championshipCards';
import { parseLocalDateOnly, isDateInPast } from '../utils/dateUtils';

export interface ChampionshipMatch {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    team?: string;
    opponent: string;
    competition: string;
    phase?: string; // Fase da partida (ex: "1 Fase classificatória", "1 PlayOffs")
    location?: string; // Mandante/Visitante
    scoreTarget?: string; // Meta de pontuação esperada
}

interface ChampionshipTableProps {
    matches?: ChampionshipMatch[];
    competitions?: string[]; // Competições disponíveis
    onSave?: (match: ChampionshipMatch) => void;
    onDelete?: (id: string) => void;
    onUseForInput?: (match: ChampionshipMatch) => void; // Callback para usar na aba Input de Dados
    onRefresh?: () => void; // Callback para recarregar dados da API
    championships?: Championship[]; // Campeonatos cadastrados
    onSaveChampionship?: (championship: Championship) => void; // Callback para salvar campeonato
    teams?: { id: string; nome: string }[]; // Equipes para cadastrar no campeonato
}

const PHASE_OPTIONS = [
    { value: '1 Fase classificatória', label: '1 Fase classificatória' },
    { value: '1 PlayOffs', label: '1 PlayOffs' },
];

export const ChampionshipTable: React.FC<ChampionshipTableProps> = ({ 
    matches = [], 
    competitions = [],
    onSave, 
    onDelete,
    onUseForInput,
    onRefresh,
    championships = [],
    onSaveChampionship,
    teams = []
}) => {
    // Debug: log matches
    useEffect(() => {
        console.log('📋 ChampionshipTable - matches recebidos:', matches.length, matches);
        if (matches.length === 0) {
            console.log('⚠️ Nenhum match encontrado. Verifique se a API está retornando dados.');
        }
    }, [matches]);

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAmistoso, setIsAmistoso] = useState(false);
    // Lista de competições: campeonatos salvos primeiro, depois da API
    const competitionOptions = useMemo(() => {
        const fromChampionships = championships.map(c => c.name);
        const fromApi = competitions.filter(c => !fromChampionships.includes(c));
        return [...fromChampionships, ...fromApi];
    }, [championships, competitions]);

    const [formData, setFormData] = useState<ChampionshipMatch>({
        id: '',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        opponent: '',
        competition: competitionOptions.length > 0 ? competitionOptions[0] : '',
        phase: '1 Fase classificatória',
        location: '',
        scoreTarget: ''
    });
    
    // Estados para modal de cadastro de campeonato
    const [showChampionshipModal, setShowChampionshipModal] = useState(false);
    const [championshipForm, setChampionshipForm] = useState<Championship>({
        id: '',
        name: '',
        phase: '1 Fase classificatória',
        pointsPerWin: 3,
        pointsPerDraw: 1,
        pointsPerLoss: 0,
        suspensionRules: {
            yellowCardsForSuspension: 3,
            redCardSuspension: 1,
            yellowAccumulationSuspension: 1
        },
        resetCardsOnPhaseAdvance: false,
        teamIds: []
    });
    const [showChampionshipMatchesForm, setShowChampionshipMatchesForm] = useState(false);
    const [currentChampionshipId, setCurrentChampionshipId] = useState<string | null>(null);
    const [championshipMatchesForm, setChampionshipMatchesForm] = useState<ChampionshipMatch[]>([]);
    
    // Estados para importação
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<string>('');

    // Nome e escudo do time da aba Configurações (para cards de partidas)
    const [teamSettings, setTeamSettings] = useState<{ teamName: string; shieldUrl: string }>({ teamName: '', shieldUrl: '' });
    useEffect(() => {
        try {
            const raw = localStorage.getItem('scout21_settings_current_team');
            if (!raw) return;
            const d = JSON.parse(raw);
            setTeamSettings({ teamName: d.teamName || '', shieldUrl: d.shieldUrl || '' });
        } catch (_) {}
    }, []);
    
    // Modal de regras quando a fase da partida difere da fase do campeonato
    const [showPhaseRulesModal, setShowPhaseRulesModal] = useState(false);
    const [phaseRulesChampionship, setPhaseRulesChampionship] = useState<Championship | null>(null);
    
    // Estados para filtros de tempo e visualização
    const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
    const [viewMode, setViewMode] = useState<'all' | 'past' | 'future'>('all');

    const handleSave = () => {
        if (!formData.opponent.trim()) {
            alert('Por favor, preencha o adversário.');
            return;
        }

        // Se estiver editando, incluir o ID. Se for nova partida, não incluir
        const matchToSave: ChampionshipMatch = editingId 
            ? { ...formData, id: editingId }
            : {
                date: formData.date,
                time: formData.time,
                opponent: formData.opponent,
                competition: formData.competition,
                phase: formData.phase,
                location: formData.location,
                scoreTarget: formData.scoreTarget
            } as any;

        if (onSave) {
            onSave(matchToSave);
        }

        // Reset form
        setFormData({
            id: '',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            opponent: '',
            competition: competitionOptions.length > 0 ? competitionOptions[0] : '',
            phase: '1 Fase classificatória',
            location: 'Mandante',
            scoreTarget: ''
        });
        setIsCreating(false);
        setEditingId(null);
        setIsAmistoso(false);
    };

    const handleEdit = (match: ChampionshipMatch) => {
        setFormData({
            ...match,
            phase: match.phase || '1 Fase classificatória'
        });
        setEditingId(match.id);
        // Detectar se é amistoso
        setIsAmistoso(match.competition === 'Amistoso');
        setIsCreating(true);
    };

    const handleCancel = () => {
        setFormData({
            id: '',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            opponent: '',
            competition: competitionOptions.length > 0 ? competitionOptions[0] : '',
            phase: '1 Fase classificatória',
            location: 'Mandante',
            scoreTarget: ''
        });
        setIsCreating(false);
        setEditingId(null);
        setIsAmistoso(false);
    };

    const handleUseForInput = (match: ChampionshipMatch) => {
        if (onUseForInput) {
            onUseForInput(match);
        }
    };
    
    // Funções para cadastro de campeonato
    const handleSaveChampionship = () => {
        if (!championshipForm.name.trim()) {
            alert('Por favor, preencha o nome da competição.');
            return;
        }
        
        const championshipToSave: Championship = {
            ...championshipForm,
            id: championshipForm.id || Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        if (onSaveChampionship) {
            onSaveChampionship(championshipToSave);
        }
        
        // Salvar no localStorage também
        const savedChampionships = JSON.parse(localStorage.getItem('championships') || '[]');
        const updatedChampionships = savedChampionships.filter((c: Championship) => c.id !== championshipToSave.id);
        updatedChampionships.push(championshipToSave);
        localStorage.setItem('championships', JSON.stringify(updatedChampionships));
        
        // Fechar modal e abrir formulário de partidas
        setShowChampionshipModal(false);
        setCurrentChampionshipId(championshipToSave.id);
        setChampionshipMatchesForm([{
            id: '',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            opponent: '',
            competition: championshipToSave.name,
            location: 'Mandante',
            scoreTarget: ''
        }]);
        setShowChampionshipMatchesForm(true);
    };
    
    const handleAddChampionshipMatch = () => {
        const championship = championships.find(c => c.id === currentChampionshipId);
        setChampionshipMatchesForm([...championshipMatchesForm, {
            id: '',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            opponent: '',
            competition: championship?.name || '',
            location: 'Mandante',
            scoreTarget: ''
        }]);
    };
    
    const handleSaveChampionshipMatches = () => {
        if (championshipMatchesForm.length === 0) {
            alert('Adicione pelo menos uma partida.');
            return;
        }
        
        // Validar que todas as partidas têm adversário
        const invalidMatches = championshipMatchesForm.filter(m => !m.opponent.trim());
        if (invalidMatches.length > 0) {
            alert('Por favor, preencha o adversário em todas as partidas.');
            return;
        }
        
        // Salvar todas as partidas
        championshipMatchesForm.forEach(match => {
            if (match.opponent.trim()) {
                const matchToSave: ChampionshipMatch = {
                    ...match,
                    id: match.id || Date.now().toString() + Math.random()
                };
                if (onSave) {
                    onSave(matchToSave);
                }
            }
        });
        
        alert(`✅ ${championshipMatchesForm.length} partida(s) cadastrada(s) com sucesso!`);
        setShowChampionshipMatchesForm(false);
        setChampionshipMatchesForm([]);
        setCurrentChampionshipId(null);
    };
    
    // Funções para importação
    const handleImportData = () => {
        if (!importData.trim()) {
            alert('Por favor, cole os dados da tabela.');
            return;
        }
        
        // Parsear dados (formato TSV/CSV básico)
        const lines = importData.split('\n').filter(line => line.trim());
        const importedMatches: ChampionshipMatch[] = [];
        
        lines.forEach((line, index) => {
            if (index === 0) return; // Pular cabeçalho se houver
            
            const columns = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
            
            if (columns.length >= 3) {
                // Tentar identificar colunas: Data, Hora, Adversário, Campeonato
                const date = columns[0]?.trim() || '';
                const time = columns[1]?.trim() || '20:00';
                const opponent = columns[2]?.trim() || '';
                const competition = columns[3]?.trim() || competitions[0] || '';
                
                if (date && opponent) {
                    importedMatches.push({
                        id: Date.now().toString() + index,
                        date: date,
                        time: time,
                        opponent: opponent,
                        competition: competition,
                        location: 'Mandante',
                        scoreTarget: ''
                    });
                }
            }
        });
        
        if (importedMatches.length === 0) {
            alert('Nenhuma partida válida encontrada nos dados importados. Verifique o formato.');
            return;
        }
        
        // Preview e confirmação
        const confirmMessage = `Foram encontradas ${importedMatches.length} partida(s). Deseja importar?\n\n${importedMatches.map(m => `- ${m.date} ${m.time} vs ${m.opponent}`).join('\n')}`;
        
        if (window.confirm(confirmMessage)) {
            importedMatches.forEach(match => {
                if (onSave) {
                    onSave(match);
                }
            });
            alert(`✅ ${importedMatches.length} partida(s) importada(s) com sucesso!`);
            setShowImportModal(false);
            setImportData('');
        }
    };

    // Função para formatar hora corretamente
    // Converte timestamp ISO ou formato de data/hora para HH:MM
    // Google Sheets retorna apenas hora como "1899-12-30T23:06:28.000Z" (data de referência do Excel)
    const formatTime = (timeValue: string | undefined | null): string => {
        if (!timeValue || timeValue === '-') return '-';
        
        // Se já estiver no formato HH:MM (ex: "20:00"), retorna diretamente
        if (/^\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue;
        }
        
        try {
            // Tenta parsear como Date (pode ser timestamp ISO como "1899-12-30T23:06:28.000Z")
            const date = new Date(timeValue);
            
            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                return '-'; // Retorna '-' se não for uma data válida
            }
            
            // Extrai horas e minutos e formata como HH:MM
            // Usa getHours/getMinutes (não UTC) para evitar problemas de timezone
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            // Se houver erro no parse, retorna '-'
            console.warn('Erro ao formatar hora:', timeValue, e);
            return '-';
        }
    };

    const formatMatchDate = (dateValue: string | undefined) => {
        if (!dateValue) return '-';
        try {
            const date = parseLocalDateOnly(dateValue);
            if (Number.isNaN(date.getTime())) return dateValue;
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        } catch {
            return dateValue;
        }
    };
    
    // Separar e ordenar partidas por tempo (passadas vs futuras) — datas como local (YYYY-MM-DD)
    const { pastMatches, futureMatches } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const past: ChampionshipMatch[] = [];
        const future: ChampionshipMatch[] = [];
        
        matches.forEach(match => {
            const matchDate = parseLocalDateOnly(match.date);
            if (Number.isNaN(matchDate.getTime())) return;
            if (matchDate < now) {
                past.push(match);
            } else {
                future.push(match);
            }
        });
        
        past.sort((a, b) => {
            const dateCompare = parseLocalDateOnly(b.date).getTime() - parseLocalDateOnly(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return (b.time || '').localeCompare(a.time || '');
        });
        
        future.sort((a, b) => {
            const dateCompare = parseLocalDateOnly(a.date).getTime() - parseLocalDateOnly(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return (a.time || '').localeCompare(b.time || '');
        });
        
        return { pastMatches: past, futureMatches: future };
    }, [matches]);
    
    // Aplicar filtro de período às partidas passadas (datas locais)
    const applyTimeFilter = (matchesList: ChampionshipMatch[]) => {
        if (timeFilter === 'all') return matchesList;
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysMap = { '7days': 7, '30days': 30, '90days': 90 };
        const days = daysMap[timeFilter];
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return matchesList.filter(match => {
            const matchDate = parseLocalDateOnly(match.date);
            return !Number.isNaN(matchDate.getTime()) && matchDate >= cutoffDate && matchDate <= now;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="bg-black p-4 md:p-6 rounded-3xl border border-zinc-900 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                            <Trophy className="text-[#10b981] shrink-0" /> Tabela de Campeonato
                        </h2>
                        <p className="text-zinc-500 text-xs font-bold mt-1 hidden sm:block">
                            Gerencie os jogos da temporada e use para preencher automaticamente o Input de Dados
                        </p>
                    </div>
                    {!isCreating && (
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="flex items-center justify-center w-10 h-10 md:w-[176px] md:h-auto md:gap-2 bg-zinc-700 hover:bg-zinc-600 text-white md:px-4 md:py-2 font-bold uppercase text-xs rounded-xl transition-colors"
                                    title="Recarregar dados da planilha"
                                >
                                    <RefreshCw size={18} />
                                    <span className="hidden md:inline">Recarregar</span>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setChampionshipForm({
                                        id: '',
                                        name: '',
                                        phase: '1 Fase classificatória',
                                        pointsPerWin: 3,
                                        pointsPerDraw: 1,
                                        pointsPerLoss: 0,
                                        suspensionRules: {
                                            yellowCardsForSuspension: 3,
                                            redCardSuspension: 1,
                                            yellowAccumulationSuspension: 1
                                        },
                                        resetCardsOnPhaseAdvance: false,
                                        teamIds: []
                                    });
                                    setShowChampionshipModal(true);
                                }}
                                className="flex items-center justify-center w-10 h-10 md:w-[176px] md:h-auto md:gap-2 bg-purple-600 hover:bg-purple-500 text-white md:px-4 md:py-2 font-bold uppercase text-xs rounded-xl transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                                title="Novo campeonato"
                            >
                                <Trophy size={18} />
                                <span className="hidden md:inline">Novo campeonato</span>
                            </button>
                            <button
                                onClick={() => {
                                    setFormData({
                                        id: '',
                                        date: new Date().toISOString().split('T')[0],
                                        time: '20:00',
                                        opponent: '',
                                        competition: competitionOptions.length > 0 ? competitionOptions[0] : '',
                                        phase: '1 Fase classificatória',
                                        location: 'Mandante',
                                        scoreTarget: ''
                                    });
                                    setIsCreating(true);
                                }}
                                className="flex items-center justify-center w-10 h-10 md:w-[176px] md:h-auto md:gap-2 bg-[#10b981] hover:bg-[#34d399] text-white md:px-4 md:py-2 font-bold uppercase text-xs rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                title="Nova Partida"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Nova Partida</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Partidas Futuras</h3>
                    {futureMatches.length === 0 ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
                            Nenhuma partida futura cadastrada.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {futureMatches.slice(0, 5).map(match => (
                                <div key={match.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            {match.competition || 'Sem competição'}
                                        </span>
                                        <span className="text-[10px] text-zinc-600 font-semibold uppercase">
                                            {formatMatchDate(match.date)} • {formatTime(match.time)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                                        {teamSettings.shieldUrl ? (
                                            <img src={teamSettings.shieldUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0 rounded" aria-hidden />
                                        ) : null}
                                        <span>{teamSettings.teamName || match.team || 'Nosso time'}</span>
                                        <span className="text-zinc-500">x</span>
                                        <span>{match.opponent}</span>
                                    </p>
                                    <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                                        {match.location || 'Local indefinido'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulário de criação/edição */}
                {isCreating && (
                    <div className="mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <h3 className="text-white font-bold text-sm mb-4 uppercase">
                            {editingId ? 'Editar Partida' : 'Nova Partida'}
                        </h3>
                        
                        {/* Toggle Amistoso */}
                        <div className="mb-4 flex items-center gap-3 p-3 bg-black rounded-lg border border-zinc-800">
                            <input
                                type="checkbox"
                                id="amistoso-toggle"
                                checked={isAmistoso}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsAmistoso(checked);
                                    if (checked) {
                                        setFormData({ ...formData, competition: 'Amistoso' });
                                    } else {
                                        setFormData({ ...formData, competition: competitionOptions.length > 0 ? competitionOptions[0] : '' });
                                    }
                                }}
                                className="w-4 h-4 accent-[#10b981] cursor-pointer"
                            />
                            <label htmlFor="amistoso-toggle" className="text-white text-xs font-bold uppercase cursor-pointer flex items-center gap-2">
                                <Users size={14} className="text-[#10b981]" />
                                Partida Amistosa (não vinculada a campeonato)
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981] [color-scheme:dark]"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Hora</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981] [color-scheme:dark]"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</label>
                                <input
                                    type="text"
                                    value={formData.opponent}
                                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                                    placeholder="Nome do time"
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                    Competição {isAmistoso && <span className="text-zinc-600">(desabilitado)</span>}
                                </label>
                                <select
                                    value={formData.competition}
                                    onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                                    disabled={isAmistoso}
                                    className={`w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981] ${isAmistoso ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isAmistoso ? (
                                        <option value="Amistoso">Amistoso</option>
                                    ) : (
                                        competitionOptions.map(comp => (
                                            <option key={comp} value={comp}>{comp}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            {!isAmistoso && championships.some(c => c.name === formData.competition) && (
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Fase da partida</label>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={formData.phase || '1 Fase classificatória'}
                                            onChange={(e) => {
                                                const newPhase = e.target.value;
                                                const champ = championships.find(c => c.name === formData.competition);
                                                setFormData({ ...formData, phase: newPhase });
                                                // Se fase diferente da fase do campeonato, abrir modal de regras
                                                if (champ && newPhase !== (champ.phase || '1 Fase classificatória')) {
                                                    setPhaseRulesChampionship({ ...champ });
                                                    setShowPhaseRulesModal(true);
                                                }
                                            }}
                                            className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981]"
                                        >
                                            {PHASE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const champ = championships.find(c => c.name === formData.competition);
                                                if (champ) {
                                                    setPhaseRulesChampionship({ ...champ });
                                                    setShowPhaseRulesModal(true);
                                                }
                                            }}
                                            className="text-[10px] font-bold uppercase text-orange-500 hover:text-orange-400 whitespace-nowrap"
                                        >
                                            Regras
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Local</label>
                                <select
                                    value={formData.location || 'Mandante'}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981]"
                                >
                                    <option value="Mandante">Mandante</option>
                                    <option value="Visitante">Visitante</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Meta de Pontuação</label>
                                <input
                                    type="text"
                                    value={formData.scoreTarget || ''}
                                    onChange={(e) => setFormData({ ...formData, scoreTarget: e.target.value })}
                                    placeholder="Ex: Vencer por 2 gols"
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-[#10b981]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-[#10b981] hover:bg-[#34d399] text-white px-4 py-2 font-bold uppercase text-xs rounded-lg transition-colors"
                            >
                                <Save size={14} /> Salvar
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 font-bold uppercase text-xs rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Filtros de Visualização e Período */}
                <div className="mb-4 space-y-3">
                    {/* Filtro: Ver Todas / Passadas / Futuras */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setViewMode('all');
                                setTimeFilter('all');
                            }}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                                viewMode === 'all' 
                                    ? 'bg-[#10b981] text-white' 
                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                            }`}
                        >
                            Todas ({matches.length})
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('past');
                                setTimeFilter('all');
                            }}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                                viewMode === 'past' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                            }`}
                        >
                            Passadas ({pastMatches.length})
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('future');
                                setTimeFilter('all');
                            }}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                                viewMode === 'future' 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                            }`}
                        >
                            Futuras ({futureMatches.length})
                        </button>
                    </div>
                    
                    {/* Filtro de Período (apenas para partidas passadas) */}
                    {viewMode === 'past' && (
                        <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-blue-500">
                            <span className="text-zinc-500 text-xs font-bold uppercase self-center">Período:</span>
                            <button
                                onClick={() => setTimeFilter('7days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    timeFilter === '7days' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                            >
                                Últimos 7 dias
                            </button>
                            <button
                                onClick={() => setTimeFilter('30days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    timeFilter === '30days' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                            >
                                Últimos 30 dias
                            </button>
                            <button
                                onClick={() => setTimeFilter('90days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    timeFilter === '90days' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                            >
                                Últimos 90 dias
                            </button>
                            <button
                                onClick={() => setTimeFilter('all')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    timeFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                            >
                                Todas
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabela de partidas — colunas com largura mínima, sem comprimir */}
                <div className="overflow-x-auto -mx-4 md:mx-0 px-2 md:px-0">
                    <table className="w-full min-w-[580px] table-auto text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-950 text-[10px] text-zinc-400 uppercase tracking-wider font-bold border-b border-zinc-800">
                                <th className="min-w-[100px] p-1.5 md:p-2 border-r border-zinc-900">Data</th>
                                <th className="min-w-[70px] p-1.5 md:p-2 border-r border-zinc-900">Hora</th>
                                <th className="min-w-[140px] p-1.5 md:p-2 border-r border-zinc-900">Adversário</th>
                                <th className="min-w-[160px] p-1.5 md:p-2 border-r border-zinc-900">Competição</th>
                                <th className="min-w-[90px] p-1.5 md:p-2 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                                        Nenhuma partida cadastrada. Clique em "Nova Partida" para começar.
                                    </td>
                                </tr>
                            ) : (() => {
                                // Função auxiliar para renderizar uma linha de partida
                                const renderMatchRow = (match: ChampionshipMatch) => {
                                    let dateDisplay = '-';
                                    try {
                                        if (match.date) {
                                            const date = parseLocalDateOnly(match.date);
                                            if (!Number.isNaN(date.getTime())) {
                                                dateDisplay = date.toLocaleDateString('pt-BR');
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Erro ao formatar data:', match.date, e);
                                    }
                                    
                                    return (
                                        <tr key={match.id} className="border-b border-zinc-900 hover:bg-zinc-950">
                                            <td className="p-1.5 md:p-2 border-r border-zinc-900 text-white text-xs whitespace-nowrap">
                                                {dateDisplay}
                                            </td>
                                            <td className="p-1.5 md:p-2 border-r border-zinc-900 text-white text-xs whitespace-nowrap">
                                                {formatTime(match.time)}
                                            </td>
                                            <td className="p-1.5 md:p-2 border-r border-zinc-900 text-white text-xs font-bold whitespace-nowrap">
                                                {match.opponent || '-'}
                                            </td>
                                            <td className="p-1.5 md:p-2 border-r border-zinc-900 text-white text-xs whitespace-nowrap">
                                                {match.competition || '-'}
                                            </td>
                                            <td className="p-1.5 md:p-2 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                                                    <button
                                                        onClick={() => handleEdit(match)}
                                                        className="p-1 md:p-1.5 text-blue-400 hover:bg-zinc-900 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
                                                                    onDelete(match.id);
                                                                }
                                                            }}
                                                            className="p-1 md:p-1.5 text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                };
                                
                                // Determinar quais partidas exibir baseado no modo de visualização
                                if (viewMode === 'all') {
                                    // Mostrar ambas as seções separadas
                                    return (
                                        <>
                                            {/* Seção: Partidas Passadas */}
                                            {pastMatches.length > 0 && (
                                                <>
                                                    <tr className="bg-zinc-950">
                                                        <td colSpan={5} className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <BarChart3 className="text-blue-400" size={16} />
                                                                <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">
                                                                    Partidas Passadas ({pastMatches.length})
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {pastMatches.map(renderMatchRow)}
                                                </>
                                            )}
                                            
                                            {/* Seção: Partidas Futuras */}
                                            {futureMatches.length > 0 && (
                                                <>
                                                    <tr className="bg-zinc-950">
                                                        <td colSpan={5} className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="text-purple-400" size={16} />
                                                                <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">
                                                                    Partidas Futuras ({futureMatches.length})
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {futureMatches.map(renderMatchRow)}
                                                </>
                                            )}
                                        </>
                                    );
                                } else if (viewMode === 'past') {
                                    // Mostrar apenas passadas com filtro de tempo
                                    const filteredPast = applyTimeFilter(pastMatches);
                                    if (filteredPast.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                                                    Nenhuma partida passada encontrada no período selecionado.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filteredPast.map(renderMatchRow);
                                } else {
                                    // Mostrar apenas futuras
                                    if (futureMatches.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                                                    Nenhuma partida futura cadastrada.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return futureMatches.map(renderMatchRow);
                                }
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Modal de Cadastro de Campeonato */}
            {showChampionshipModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xl uppercase flex items-center gap-2">
                                <Trophy className="text-purple-500" size={24} /> Cadastrar Campeonato
                            </h3>
                            <button
                                onClick={() => setShowChampionshipModal(false)}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Nome do Campeonato *</label>
                                <input
                                    type="text"
                                    value={championshipForm.name}
                                    onChange={(e) => setChampionshipForm({ ...championshipForm, name: e.target.value })}
                                    placeholder="Ex: Copa Santa Catarina"
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                />
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Fase</label>
                                <select
                                    value={championshipForm.phase || '1 Fase classificatória'}
                                    onChange={(e) => setChampionshipForm({ ...championshipForm, phase: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                >
                                    <option value="1 Fase classificatória">1 Fase classificatória</option>
                                    <option value="1 PlayOffs">1 PlayOffs</option>
                                </select>
                            </div>
                            
                            <div className="border-t border-zinc-800 pt-4">
                                <h4 className="text-white font-bold text-sm mb-4 uppercase">Pontuação por resultado</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Vitória</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={championshipForm.pointsPerWin ?? 3}
                                            onChange={(e) => setChampionshipForm({ ...championshipForm, pointsPerWin: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Empate</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={championshipForm.pointsPerDraw ?? 1}
                                            onChange={(e) => setChampionshipForm({ ...championshipForm, pointsPerDraw: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Derrota</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={championshipForm.pointsPerLoss ?? 0}
                                            onChange={(e) => setChampionshipForm({ ...championshipForm, pointsPerLoss: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-zinc-800 pt-4">
                                <h4 className="text-white font-bold text-sm mb-4 uppercase">Regras de Suspensão</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                            Quantidade de cartões amarelos para suspensão
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={championshipForm.suspensionRules.yellowCardsForSuspension}
                                            onChange={(e) => setChampionshipForm({
                                                ...championshipForm,
                                                suspensionRules: {
                                                    ...championshipForm.suspensionRules,
                                                    yellowCardsForSuspension: parseInt(e.target.value) || 3
                                                }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                            Jogos de suspensão por cartão vermelho
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={championshipForm.suspensionRules.redCardSuspension}
                                            onChange={(e) => setChampionshipForm({
                                                ...championshipForm,
                                                suspensionRules: {
                                                    ...championshipForm.suspensionRules,
                                                    redCardSuspension: parseInt(e.target.value) || 1
                                                }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                            Jogos de suspensão por acumulação de amarelos
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={championshipForm.suspensionRules.yellowAccumulationSuspension}
                                            onChange={(e) => setChampionshipForm({
                                                ...championshipForm,
                                                suspensionRules: {
                                                    ...championshipForm.suspensionRules,
                                                    yellowAccumulationSuspension: parseInt(e.target.value) || 1
                                                }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex items-center gap-3 p-3 bg-black rounded-lg border border-zinc-800">
                                    <input
                                        type="checkbox"
                                        id="reset-cards-phase"
                                        checked={championshipForm.resetCardsOnPhaseAdvance ?? false}
                                        onChange={(e) => setChampionshipForm({ ...championshipForm, resetCardsOnPhaseAdvance: e.target.checked })}
                                        className="w-4 h-4 accent-purple-500 cursor-pointer"
                                    />
                                    <label htmlFor="reset-cards-phase" className="text-white text-xs font-bold uppercase cursor-pointer">
                                        Zerar cartões ao avançar de fase
                                    </label>
                                </div>
                            </div>
                            
                            <div className="border-t border-zinc-800 pt-4">
                                <h4 className="text-white font-bold text-sm mb-4 uppercase">Cadastrar Equipes</h4>
                                <p className="text-zinc-500 text-xs mb-3">
                                    As equipes serão vinculadas ao campeonato. Mantenha as configurações existentes da sua equipe.
                                </p>
                                <div className="bg-black border border-zinc-800 rounded-lg p-3 text-zinc-400 text-xs">
                                    As equipes cadastradas em Gestão de Equipe já estão disponíveis. Ao cadastrar partidas, selecione o campeonato para vincular.
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleSaveChampionship}
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                <Save size={16} /> Salvar e Abrir Tabela
                            </button>
                            <button
                                onClick={() => setShowChampionshipModal(false)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Formulário de Partidas do Campeonato */}
            {showChampionshipMatchesForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xl uppercase flex items-center gap-2">
                                <Trophy className="text-purple-500" size={24} /> Preencher Tabela do Campeonato
                            </h3>
                            <button
                                onClick={() => {
                                    setShowChampionshipMatchesForm(false);
                                    setChampionshipMatchesForm([]);
                                    setCurrentChampionshipId(null);
                                }}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {championshipMatchesForm.map((match, index) => (
                                <div key={index} className="bg-black border border-zinc-800 rounded-xl p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</label>
                                            <input
                                                type="date"
                                                value={match.date}
                                                onChange={(e) => {
                                                    const newMatches = [...championshipMatchesForm];
                                                    newMatches[index].date = e.target.value;
                                                    setChampionshipMatchesForm(newMatches);
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Hora</label>
                                            <input
                                                type="time"
                                                value={match.time}
                                                onChange={(e) => {
                                                    const newMatches = [...championshipMatchesForm];
                                                    newMatches[index].time = e.target.value;
                                                    setChampionshipMatchesForm(newMatches);
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário *</label>
                                            <input
                                                type="text"
                                                value={match.opponent}
                                                onChange={(e) => {
                                                    const newMatches = [...championshipMatchesForm];
                                                    newMatches[index].opponent = e.target.value;
                                                    setChampionshipMatchesForm(newMatches);
                                                }}
                                                placeholder="Nome do time"
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Local</label>
                                            <select
                                                value={match.location || 'Mandante'}
                                                onChange={(e) => {
                                                    const newMatches = [...championshipMatchesForm];
                                                    newMatches[index].location = e.target.value;
                                                    setChampionshipMatchesForm(newMatches);
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500"
                                            >
                                                <option value="Mandante">Mandante</option>
                                                <option value="Visitante">Visitante</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Campeonato</label>
                                            <input
                                                type="text"
                                                value={match.competition}
                                                readOnly
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-zinc-500 text-xs outline-none cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Meta de Pontuação</label>
                                            <input
                                                type="text"
                                                value={match.scoreTarget || ''}
                                                onChange={(e) => {
                                                    const newMatches = [...championshipMatchesForm];
                                                    newMatches[index].scoreTarget = e.target.value;
                                                    setChampionshipMatchesForm(newMatches);
                                                }}
                                                placeholder="Ex: Vencer por 2 gols"
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                    {championshipMatchesForm.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newMatches = championshipMatchesForm.filter((_, i) => i !== index);
                                                setChampionshipMatchesForm(newMatches);
                                            }}
                                            className="mt-2 text-red-400 hover:text-red-300 text-xs font-bold uppercase"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                onClick={handleAddChampionshipMatch}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 font-bold uppercase text-xs rounded-xl transition-colors border border-zinc-700"
                            >
                                <Plus size={16} /> Adicionar Partida
                            </button>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleSaveChampionshipMatches}
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                <Save size={16} /> Salvar Todas as Partidas
                            </button>
                            <button
                                onClick={() => {
                                    setShowChampionshipMatchesForm(false);
                                    setChampionshipMatchesForm([]);
                                    setCurrentChampionshipId(null);
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Regras quando fase da partida difere da fase do campeonato */}
            {showPhaseRulesModal && phaseRulesChampionship && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xl uppercase flex items-center gap-2">
                                <Flag className="text-orange-500" size={24} /> Regras para nova fase
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPhaseRulesModal(false);
                                    setPhaseRulesChampionship(null);
                                }}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">
                            A partida refere-se a uma fase diferente da fase cadastrada no campeonato. Configure as regras e opções de cartões para esta fase.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Fase</label>
                                <select
                                    value={phaseRulesChampionship.phase || '1 Fase classificatória'}
                                    onChange={(e) => setPhaseRulesChampionship({ ...phaseRulesChampionship, phase: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                >
                                    {PHASE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="border-t border-zinc-800 pt-4">
                                <h4 className="text-white font-bold text-sm mb-4 uppercase">Pontuação por resultado</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Vitória</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={phaseRulesChampionship.pointsPerWin ?? 3}
                                            onChange={(e) => setPhaseRulesChampionship({ ...phaseRulesChampionship, pointsPerWin: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Empate</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={phaseRulesChampionship.pointsPerDraw ?? 1}
                                            onChange={(e) => setPhaseRulesChampionship({ ...phaseRulesChampionship, pointsPerDraw: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Derrota</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={phaseRulesChampionship.pointsPerLoss ?? 0}
                                            onChange={(e) => setPhaseRulesChampionship({ ...phaseRulesChampionship, pointsPerLoss: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-zinc-800 pt-4">
                                <h4 className="text-white font-bold text-sm mb-4 uppercase">Regras de Suspensão</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Amarelos para suspensão</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={phaseRulesChampionship.suspensionRules.yellowCardsForSuspension}
                                            onChange={(e) => setPhaseRulesChampionship({
                                                ...phaseRulesChampionship,
                                                suspensionRules: { ...phaseRulesChampionship.suspensionRules, yellowCardsForSuspension: parseInt(e.target.value) || 3 }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Jogos por vermelho</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={phaseRulesChampionship.suspensionRules.redCardSuspension}
                                            onChange={(e) => setPhaseRulesChampionship({
                                                ...phaseRulesChampionship,
                                                suspensionRules: { ...phaseRulesChampionship.suspensionRules, redCardSuspension: parseInt(e.target.value) || 1 }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Jogos por acumulação</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={phaseRulesChampionship.suspensionRules.yellowAccumulationSuspension}
                                            onChange={(e) => setPhaseRulesChampionship({
                                                ...phaseRulesChampionship,
                                                suspensionRules: { ...phaseRulesChampionship.suspensionRules, yellowAccumulationSuspension: parseInt(e.target.value) || 1 }
                                            })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3 p-3 bg-black rounded-lg border border-zinc-800">
                                    <input
                                        type="checkbox"
                                        id="phase-reset-cards"
                                        checked={phaseRulesChampionship.resetCardsOnPhaseAdvance ?? false}
                                        onChange={(e) => setPhaseRulesChampionship({ ...phaseRulesChampionship, resetCardsOnPhaseAdvance: e.target.checked })}
                                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                                    />
                                    <label htmlFor="phase-reset-cards" className="text-white text-xs font-bold uppercase cursor-pointer">
                                        Zerar cartões ao avançar de fase
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => {
                                    if (onSaveChampionship) onSaveChampionship(phaseRulesChampionship);
                                    if (phaseRulesChampionship.resetCardsOnPhaseAdvance) {
                                        setChampionshipCards(phaseRulesChampionship.id, {});
                                    }
                                    setShowPhaseRulesModal(false);
                                    setPhaseRulesChampionship(null);
                                    alert('Regras atualizadas com sucesso!');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                <Save size={16} /> Aplicar e Salvar
                            </button>
                            <button
                                onClick={() => {
                                    setChampionshipCards(phaseRulesChampionship.id, {});
                                    alert('Cartões zerados com sucesso!');
                                    setShowPhaseRulesModal(false);
                                    setPhaseRulesChampionship(null);
                                }}
                                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                Zerar Cartões
                            </button>
                            <button
                                onClick={() => {
                                    setShowPhaseRulesModal(false);
                                    setPhaseRulesChampionship(null);
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Importação */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xl uppercase flex items-center gap-2">
                                <Upload className="text-blue-500" size={24} /> Importar Tabela
                            </h3>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportData('');
                                }}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                                    Cole os dados da tabela (formato TSV/CSV)
                                </label>
                                <p className="text-zinc-400 text-xs mb-2">
                                    Formato esperado: Data | Hora | Adversário | Campeonato (separados por tabulação ou vírgula)
                                </p>
                                <textarea
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                    placeholder="Exemplo:&#10;2024-01-15	20:00	Time A	Copa Santa Catarina&#10;2024-01-22	20:00	Time B	Copa Santa Catarina"
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-blue-500 font-mono h-48"
                                />
                            </div>
                            
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                                <p className="text-zinc-400 text-xs">
                                    <strong className="text-white">Dica:</strong> Você pode copiar dados de uma planilha Excel e colar aqui. 
                                    O sistema tentará identificar automaticamente as colunas de Data, Hora, Adversário e Campeonato.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleImportData}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                <Upload size={16} /> Importar Dados
                            </button>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportData('');
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-bold uppercase text-xs rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


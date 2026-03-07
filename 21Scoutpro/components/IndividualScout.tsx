import React, { useMemo, useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Text } from 'recharts';
import { User as UserIcon, Info, X, Plus, Users, Lock, Maximize2, Minimize2 } from 'lucide-react';
import { Player, SportConfig, User, MatchRecord, PlayerTimeControl } from '../types';

interface IndividualScoutProps {
    config: SportConfig;
    currentUser: User | null;
    matches: MatchRecord[];
    players: Player[];
    timeControls?: PlayerTimeControl[];
}

interface PlayerStatsSummary {
  minutes: number;
  goals: number;
  assists: number;
  games: number;
  shotsOn: number;             
  shotsOff: number;            
  tacklesTotal: number;        
  wrongPassesTransition: number; 
  tacklesCounterAttack: number; 
}

const calculatePlayerStats = (playerId: string, competition: string, month: string, matches: MatchRecord[]): PlayerStatsSummary => {
  return matches.filter(m => {
    const matchDate = new Date(m.date);
    const monthMatch = month === 'Todos' || matchDate.getMonth().toString() === month;
    const compMatch = competition === 'Todas' || m.competition === competition;
    return monthMatch && compMatch;
  }).reduce((acc, match) => {
    const pStats = match.playerStats[playerId];
    if (pStats) {
      acc.games += 1;
      // FIX: Minutes calculation fixed to games * 40 as requested
      acc.minutes += 40; 
      acc.goals += pStats.goals;
      acc.assists += pStats.assists;
      
      acc.shotsOn += pStats.shotsOnTarget;
      acc.shotsOff += pStats.shotsOffTarget;
      acc.tacklesTotal += (pStats.tacklesWithBall + pStats.tacklesWithoutBall);
      acc.wrongPassesTransition += pStats.wrongPassesTransition || 0;
      acc.tacklesCounterAttack += pStats.tacklesCounterAttack || 0;
    }
    return acc;
  }, {
    minutes: 0, goals: 0, assists: 0, games: 0,
    shotsOn: 0, shotsOff: 0, tacklesTotal: 0, wrongPassesTransition: 0, tacklesCounterAttack: 0
  });
};

const normalizeStat = (value: number, max: number) => {
  const normalized = (value / max) * 100;
  return Math.min(Math.round(normalized), 100);
};

// Custom Label for Radar Chart - Positioned outside
const renderCustomAxisTick = ({ x, y, payload, cx, cy, radius, outerRadius }: any) => {
    // Get angle from payload coordinate or calculate from x, y
    const textAngle = payload.coordinate !== undefined ? payload.coordinate : Math.atan2(y - cy, x - cx) * 180 / Math.PI;
    const radian = (textAngle * Math.PI) / 180;
    
    // Position labels outside the chart (aumentado para mais espaço)
    const labelDistance = (outerRadius || radius || 100) + 50;
    const labelX = cx + labelDistance * Math.cos(radian);
    const labelY = cy + labelDistance * Math.sin(radian);
    
    return (
        <Text 
            x={labelX} 
            y={labelY} 
            textAnchor="middle" 
            verticalAnchor="middle" 
            fill="#a1a1aa" 
            fontSize={11} 
            fontWeight="bold" 
            fontFamily="Poppins"
        >
            {payload.value}
        </Text>
    );
};

const PlayerCard: React.FC<{ 
    player: Player | undefined, 
    stats: PlayerStatsSummary, 
    config: SportConfig,
    isCompact?: boolean,
    onRemove?: () => void,
    timeControls?: PlayerTimeControl[],
    matchIds?: string[] // IDs das partidas filtradas
}> = ({ player, stats, config, isCompact = false, onRemove, timeControls = [], matchIds = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!player || stats.games === 0) return null;

  // Calcular média de minutos jogados usando timeControls filtrados pelas partidas
  const playerTimeControls = timeControls.filter(tc => {
    const playerMatch = String(tc.playerId).trim() === String(player.id).trim();
    // Se matchIds foi fornecido, filtrar apenas pelas partidas filtradas
    if (matchIds && matchIds.length > 0) {
      return playerMatch && matchIds.includes(tc.matchId);
    }
    return playerMatch;
  });
  const totalMinutesPlayed = playerTimeControls.reduce((sum, tc) => sum + (tc.totalTime || 0), 0);
  // Usar o número de partidas que têm timeControls registrados, ou o número total de partidas do jogador
  const gamesCount = playerTimeControls.length > 0 ? playerTimeControls.length : stats.games;
  const avgMinutesPlayed = gamesCount > 0 ? Math.round(totalMinutesPlayed / gamesCount) : 0;
  
  // Debug: log apenas se houver timeControls
  if (timeControls.length > 0) {
    console.log(`📊 Player ${player.name} (${player.id}):`, {
      totalTimeControls: timeControls.length,
      playerTimeControlsCount: playerTimeControls.length,
      totalMinutes: totalMinutesPlayed,
      gamesCount: gamesCount,
      avgMinutes: avgMinutesPlayed,
      matchIds: matchIds
    });
  } 

  // Averages for the Pentagonal Chart (garantir divisão por zero)
  const avgShotsOn = stats.games > 0 ? stats.shotsOn / stats.games : 0;
  const avgShotsOff = stats.games > 0 ? stats.shotsOff / stats.games : 0;
  const avgTackles = stats.games > 0 ? stats.tacklesTotal / stats.games : 0;
  const avgTransitionError = stats.games > 0 ? stats.wrongPassesTransition / stats.games : 0;
  const avgCounterAttack = stats.games > 0 ? stats.tacklesCounterAttack / stats.games : 0;

  const attributes = [
    { 
      subject: 'No Gol', 
      label: 'Chutes no Gol',
      fullValue: stats.shotsOn, 
      A: normalizeStat(avgShotsOn, 5), 
      fullMark: 100 
    },
    { 
      subject: 'P/ Fora', 
      label: 'Chutes p/ Fora',
      fullValue: stats.shotsOff,
      A: normalizeStat(avgShotsOff, 5), 
      fullMark: 100 
    }, 
    { 
      subject: 'Desarmes', 
      label: 'Desarmes Totais',
      fullValue: stats.tacklesTotal,
      A: normalizeStat(avgTackles, 15), 
      fullMark: 100 
    },
    { 
      subject: 'Transição', 
      label: 'Erro Transição',
      fullValue: stats.wrongPassesTransition,
      A: normalizeStat(avgTransitionError, 3), 
      fullMark: 100 
    },
    { 
      subject: 'Contra-Atq', 
      label: 'Contra-Ataque',
      fullValue: stats.tacklesCounterAttack,
      A: normalizeStat(avgCounterAttack, 5), 
      fullMark: 100 
    },
  ];

  const toggleExpand = () => {
      if(!isExpanded) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
      setIsExpanded(!isExpanded);
  }

  // Common inner content for both views
  const CardContent = ({ large = false }) => (
    <>
       {/* FIFA Style Card - Cinza, Branco Gelo e Laranja */}
      <div className={`relative ${large ? 'w-[500px] h-[700px]' : isCompact ? 'w-72 h-[420px]' : 'w-[300px] h-[440px]'} bg-gradient-to-br from-zinc-700 via-zinc-600 to-orange-500 p-[2px] rounded-3xl shadow-[0_0_60px_rgba(113,113,122,0.6),0_0_120px_rgba(251,146,60,0.4)] transform transition-transform shrink-0 overflow-hidden`}>
         <div className="absolute inset-[2px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-[22px] overflow-hidden">
            {/* Gradient overlay - Cinza e Laranja */}
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-700/20 via-transparent to-orange-500/20"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-zinc-600/10 via-transparent to-orange-400/10"></div>

            {/* Jersey Number on Top - Estilo Futurista */}
            <div className={`absolute top-6 left-6 flex flex-col items-center z-10`}>
                <span className={`${large ? 'text-8xl' : isCompact ? 'text-4xl' : 'text-7xl'} font-black bg-gradient-to-br from-slate-200 via-white to-orange-400 bg-clip-text text-transparent leading-none drop-shadow-[0_0_30px_rgba(251,146,60,0.9)]`}>{player.jerseyNumber}</span>
                <span className={`${large ? 'text-2xl' : isCompact ? 'text-sm' : 'text-lg'} font-bold text-orange-300 uppercase tracking-widest mt-1 drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]`}>{player.position.substring(0, 3)}</span>
            </div>

            <div className={`absolute ${large ? 'bottom-32 right-[-20px] w-[450px] h-[550px]' : isCompact ? 'bottom-20 right-[-10px] w-60 h-72' : 'bottom-48 right-[-20px] w-[500px] h-[600px]'} z-0`}>
               <img 
                 src={player.photoUrl} 
                 alt={player.name} 
                 className="w-full h-full object-cover object-top drop-shadow-2xl"
                 style={{ 
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' 
                 }}
               />
            </div>

            <div className={`absolute bottom-6 left-0 right-0 text-center z-10`}>
                <div className="mx-6 border-b border-zinc-500/60 mb-3 shadow-[0_1px_15px_rgba(113,113,122,0.7)]"></div>
                <h2 className={`${large ? 'text-5xl' : isCompact ? 'text-xl' : 'text-4xl'} font-black text-slate-100 uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] truncate px-4 italic`}>{player.name}</h2>
                <p className={`bg-gradient-to-r from-slate-200 to-orange-400 bg-clip-text text-transparent font-bold ${large ? 'text-sm' : isCompact ? 'text-xs' : 'text-sm'} uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]`}>{avgMinutesPlayed} min/jogo</p>
                <div className={`flex justify-center gap-4 mt-2 ${large ? 'text-xl' : isCompact ? 'text-xs' : 'text-sm'} font-bold uppercase tracking-wider`}>
                   <span className="text-slate-300 drop-shadow-[0_0_10px_rgba(148,163,184,0.7)]">{stats.games} JOG</span>
                   <span className="text-slate-200 drop-shadow-[0_0_10px_rgba(241,245,249,0.7)]">{stats.goals} GOLS</span>
                   <span className="text-orange-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.7)]">{stats.assists} ASS</span>
                </div>
            </div>
         </div>
      </div>

      {/* Radar Chart & Data List */}
      <div className={`flex-1 w-full ${large ? 'h-full flex flex-row gap-8 items-center max-w-5xl' : isCompact ? 'max-w-xs' : 'max-w-4xl'} bg-zinc-950/90 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col`}>
         <div className={`flex items-center justify-between mb-2 ${large ? 'hidden' : ''}`}>
            <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                Performance (Média)
            </h3>
         </div>
         
         <div className={`${large ? 'h-[700px] w-1/2' : isCompact ? 'h-[320px]' : 'h-[600px]'} relative shrink-0`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={large ? "80%" : isCompact ? "70%" : "75%"} data={attributes} margin={{ top: 80, right: 80, bottom: 80, left: 80 }}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={renderCustomAxisTick}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name={player.name}
                        dataKey="A"
                        stroke="#10b981"
                        strokeWidth={large ? 6 : 4}
                        fill="#10b981"
                        fillOpacity={0.4}
                        isAnimationActive={true}
                    />
                </RadarChart>
            </ResponsiveContainer>
         </div>
         
         <div className={`grid ${large ? 'grid-cols-1 w-1/2 gap-4' : isCompact ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'} mt-4 bg-black p-4 rounded-xl border border-zinc-800`}>
             <h3 className={`${large ? 'text-2xl mb-4' : 'hidden'} text-white font-bold uppercase tracking-wider border-b border-zinc-800 pb-2`}>Estatísticas (Totais)</h3>
             {attributes.map((attr) => (
                 <div key={attr.subject} className={`flex justify-between items-center ${large ? 'py-4' : 'pb-2'} text-xs border-b border-zinc-900 last:border-0 last:pb-0`}>
                     <span className={`text-zinc-400 ${large ? 'text-lg' : 'text-[10px]'} uppercase font-bold tracking-wider`}>{attr.label}</span>
                     <span className={`font-bold ${large ? 'text-3xl' : 'text-lg'} ${attr.subject === 'Transição' ? 'text-red-400' : 'text-[#10b981]'}`}>
                        {attr.fullValue}
                     </span>
                 </div>
             ))}
         </div>
      </div>
    </>
  );

  if (isExpanded) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in">
            <button 
                onClick={toggleExpand}
                className="absolute top-8 right-8 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-full z-50 transition-colors"
                title="Fechar"
            >
                <Minimize2 size={32} />
            </button>
            <div className="flex flex-row items-center gap-12 w-full justify-center h-full">
                <CardContent large={true} />
            </div>
        </div>
    );
  }

  return (
    <div className={`flex ${isCompact ? 'flex-col' : 'flex-col xl:flex-row'} gap-6 h-full items-center justify-center animate-fade-in relative group`}>
      
      {onRemove && (
          <button 
            onClick={onRemove}
            className="absolute -top-2 -right-2 z-50 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
            title="Remover Atleta"
          >
              <X size={16} />
          </button>
      )}

      <button 
        onClick={toggleExpand}
        className="absolute top-2 right-10 z-50 bg-zinc-800 text-zinc-300 hover:text-[#10b981] rounded-full p-2 shadow-lg hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
        title="Expandir Card"
      >
          <Maximize2 size={16} />
      </button>

      <CardContent large={false} />
    </div>
  );
};

export const IndividualScout: React.FC<IndividualScoutProps> = ({ config, currentUser, matches, players, timeControls = [] }) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [competition, setCompetition] = useState<string>('Todas');
  const [month, setMonth] = useState<string>('Todos');
  const [positionFilter, setPositionFilter] = useState<string>('');

  const isAthlete = currentUser?.role === 'Atleta';

  const MONTHS = [
    { value: 'Todos', label: 'Todos' },
    { value: '0', label: 'Jan' },
    { value: '1', label: 'Fev' },
    { value: '2', label: 'Mar' },
    { value: '3', label: 'Abr' },
    { value: '4', label: 'Mai' },
    { value: '5', label: 'Jun' },
    { value: '6', label: 'Jul' },
    { value: '7', label: 'Ago' },
    { value: '8', label: 'Set' },
    { value: '9', label: 'Out' },
    { value: '10', label: 'Nov' },
    { value: '11', label: 'Dez' },
  ];

  useEffect(() => {
      if (isAthlete && currentUser?.linkedPlayerId) {
          setSelectedPlayerIds([currentUser.linkedPlayerId]);
      } else if (players.length > 0 && selectedPlayerIds.length === 0) {
          // Default select first player if none selected and not athlete restricted
          setSelectedPlayerIds([players[0].id]);
      }
  }, [isAthlete, currentUser, players]);

  const availablePlayers = useMemo(() => {
    return players.filter(p => !selectedPlayerIds.includes(p.id));
  }, [selectedPlayerIds, players]);

  const handleAddPlayer = (id: string) => {
    if (isAthlete) return;
    if (selectedPlayerIds.length < 4 && id) {
        setSelectedPlayerIds([...selectedPlayerIds, id]);
        setPositionFilter('');
    }
  };

  const handleRemovePlayer = (id: string) => {
    if (isAthlete) return;
    if (selectedPlayerIds.length > 1) { 
        setSelectedPlayerIds(selectedPlayerIds.filter(pid => pid !== id));
        setPositionFilter('');
    }
  };

  const handlePositionChange = (pos: string) => {
      if (isAthlete) return;
      setPositionFilter(pos);
      if (pos) {
          const playersInPos = players.filter(p => p.position === pos).slice(0, 4);
          if (playersInPos.length > 0) {
              setSelectedPlayerIds(playersInPos.map(p => p.id));
          }
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-black/90 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 shadow-xl sticky top-4 z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end w-full">
            
            <div className="w-full">
                <label className="text-xs text-zinc-400 block mb-1 font-bold uppercase">Competição</label>
                <select 
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] text-sm font-medium transition-colors"
                >
                    <option value="Todas">Todas</option>
                    <option value="Copa Santa Catarina">Copa SC</option>
                    <option value="Série Prata">Série Prata</option>
                    <option value="JASC">JASC</option>
                </select>
            </div>
            
            <div className="w-full">
                    <label className="text-xs text-zinc-400 block mb-1 font-bold uppercase">Mês</label>
                    <select 
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] text-sm font-medium transition-colors"
                >
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {!isAthlete ? (
                <div className="w-full">
                    <label className="text-xs text-zinc-400 block mb-1 font-bold uppercase flex items-center gap-1">
                        <Users size={12} /> Comparar por Posição
                    </label>
                    <select 
                        value={positionFilter}
                        onChange={(e) => handlePositionChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-white p-3 outline-none focus:border-[#10b981] text-sm font-medium transition-colors"
                    >
                        <option value="">Selecione...</option>
                        {config.positions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
            ) : (
                 <div className="w-full flex items-end">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 p-3 w-full text-center text-sm font-medium opacity-50 cursor-not-allowed">
                        Acesso Restrito
                    </div>
                 </div>
            )}

        </div>

        {!isAthlete && selectedPlayerIds.length < 4 && (
            <div className="mt-4 flex justify-end">
                <div className="relative group w-full md:w-auto">
                    <select
                        onChange={(e) => {
                            handleAddPlayer(e.target.value);
                            e.target.value = ''; 
                        }}
                        className="w-full md:w-auto appearance-none bg-[#10b981] hover:bg-[#34d399] text-white font-bold pl-4 pr-10 py-2 rounded-lg cursor-pointer outline-none transition-all text-xs uppercase tracking-wide"
                        value=""
                    >
                        <option value="" disabled>+ Adicionar Atleta Manualmente</option>
                        {availablePlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                        ))}
                    </select>
                    <Plus size={14} className="absolute right-3 top-2.5 text-black pointer-events-none" />
                </div>
            </div>
        )}
      </div>

      <div className={`
        grid gap-8 
        ${selectedPlayerIds.length === 1 ? 'grid-cols-1' : ''}
        ${selectedPlayerIds.length === 2 ? 'grid-cols-1 xl:grid-cols-2' : ''}
        ${selectedPlayerIds.length >= 3 ? 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4' : ''}
      `}>
        
        {selectedPlayerIds.map((playerId) => {
            const player = players.find(p => p.id === playerId);
            const filteredMatches = matches.filter(m => {
                const matchDate = new Date(m.date);
                const monthMatch = month === 'Todos' || matchDate.getMonth().toString() === month;
                const compMatch = competition === 'Todas' || m.competition === competition;
                return monthMatch && compMatch;
            });
            const stats = calculatePlayerStats(playerId, competition, month, matches);
            const matchIds = filteredMatches.map(m => m.id);
            
            return (
                <div key={playerId} className="flex justify-center">
                    <PlayerCard 
                        player={player} 
                        stats={stats} 
                        config={config} 
                        isCompact={selectedPlayerIds.length > 1}
                        onRemove={(!isAthlete && selectedPlayerIds.length > 1) ? () => handleRemovePlayer(playerId) : undefined}
                        timeControls={timeControls}
                        matchIds={matchIds}
                    />
                </div>
            );
        })}
        
        {!isAthlete && selectedPlayerIds.length < 4 && selectedPlayerIds.length > 1 && (
             <div className="hidden 2xl:flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl p-8 opacity-50 min-h-[500px]">
                 <UserIcon size={48} className="text-zinc-700 mb-2" />
                 <p className="text-zinc-600 text-sm font-bold uppercase">Espaço Disponível</p>
             </div>
        )}

      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { MonitorPlay, Save, Link as LinkIcon, PlayCircle, PlusCircle, History, Clock, Shield, AlertTriangle, Goal, ArrowRightLeft, Zap, Info, ExternalLink } from 'lucide-react';
import { SportConfig, MatchRecord, Player } from '../types';

interface VideoScoutProps {
  config: SportConfig;
  matches: MatchRecord[];
  players: Player[];
}

interface ActionLog {
  id: number;
  realTime: string;
  period: string;
  matchTimeRange: string;
  player: string;
  action: string;
}

const TIME_RANGES = [
  "19:59 - 15:00",
  "14:59 - 10:00",
  "09:59 - 05:00",
  "04:59 - 02:00",
  "01:59 - 00:01"
];

export const VideoScout: React.FC<VideoScoutProps> = ({ config, matches, players }) => {
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Initialize with match URL if available, ensures sync when switching matches
  const [videoUrl, setVideoUrl] = useState(selectedMatch?.videoUrl || '');
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Context States
  const [selectedPeriod, setSelectedPeriod] = useState<'1º Tempo' | '2º Tempo'>('1º Tempo');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(TIME_RANGES[0]);

  const [logs, setLogs] = useState<ActionLog[]>([]);

  // Effect to update local videoUrl state when the selected match changes
  useEffect(() => {
    setVideoUrl(selectedMatch?.videoUrl || '');
    setLogs([]); // Clear logs for new match context
  }, [selectedMatchId, selectedMatch]);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    
    let videoId = '';

    // Regex to capture ID from various YouTube URL formats including mobile and shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);

    if (match && match[2].length === 11) {
        videoId = match[2];
    } else {
        // Fallback for short links specifically if regex fails
        if (cleanUrl.includes('/shorts/')) {
            videoId = cleanUrl.split('/shorts/')[1]?.split(/[?#&]/)[0];
        }
    }

    if (videoId && videoId.length === 11) {
        // Rel=0 ensures related videos are from the same channel
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&origin=${window.location.origin}`;
    }
    
    return null;
  };

  const handleAction = (actionName: string) => {
    if (!selectedPlayerId) {
        alert("Selecione um jogador primeiro!");
        return;
    }
    
    const player = players.find(p => p.id === selectedPlayerId);
    
    const newLog: ActionLog = {
        id: Date.now(),
        realTime: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        period: selectedPeriod,
        matchTimeRange: selectedTimeRange,
        player: player?.name || 'Desconhecido',
        action: actionName
    };
    
    setLogs([newLog, ...logs]);
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="space-y-6 animate-fade-in pb-12 h-[calc(100vh-6rem)]">
      
      {/* Top Bar - Black Piano */}
      <div className="bg-black p-4 rounded-3xl border border-zinc-800 shadow-lg flex flex-col lg:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="bg-[#10b981]/10 p-2 rounded-xl border border-[#10b981]/20">
                <MonitorPlay className="text-[#10b981]" size={24} />
            </div>
            <div>
                <h2 className="text-white font-black uppercase tracking-wider">Cabine de Vídeo</h2>
                <p className="text-zinc-500 text-xs font-bold">Análise Pós-Jogo</p>
            </div>
         </div>

         <div className="flex-1 flex gap-4 w-full">
             <select 
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-zinc-950/50 border border-zinc-800 text-white p-3 rounded-xl outline-none focus:border-[#10b981] w-1/3 text-sm font-medium transition-colors"
             >
                {matches.map(m => (
                    <option key={m.id} value={m.id}>{m.date} - vs {m.opponent}</option>
                ))}
             </select>

             <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Cole o link do YouTube (Vídeo, Shorts ou Live)..." 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-[#10b981] transition-colors text-sm font-medium"
                />
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         
         {/* Left Column: Video Player */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="relative w-full pt-[56.25%] bg-black overflow-hidden border border-zinc-800 shadow-2xl group rounded-3xl">
                {embedUrl ? (
                    <>
                        <iframe 
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full z-10"
                            title="Match Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                        
                        {/* FALLBACK BUTTON FOR ERROR 153/BLOCKS */}
                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-colors border border-red-500"
                             >
                                <ExternalLink size={14} />
                                Assistir no YouTube (Se houver erro)
                             </a>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                        <PlayCircle size={64} className="mb-4 opacity-50" />
                        <p className="font-bold uppercase tracking-widest text-center px-4">
                            {videoUrl.length > 5 ? 'Link Inválido ou Não Reconhecido' : 'Aguardando Link do Vídeo'}
                        </p>
                        {videoUrl.length > 5 && <p className="text-xs text-zinc-700 mt-2">Verifique se o link está correto.</p>}
                    </div>
                )}
            </div>
            
            {/* Disclaimer for Embed Error */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-900">
                 <Info size={14} className="text-[#10b981]" />
                 <span>
                     <strong>Nota:</strong> Canais oficiais (como LNF/SporTV) frequentemente bloqueiam a reprodução externa (Erro 150/153). 
                     Se o vídeo não carregar acima, use o botão vermelho para assistir diretamente no YouTube.
                 </span>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center shadow-lg">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Gols Pró</p>
                    <p className="text-3xl font-bold text-white">{selectedMatch?.teamStats.goals}</p>
                </div>
                <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center shadow-lg">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Gols Contra</p>
                    <p className="text-3xl font-bold text-[#ff0055]">{selectedMatch?.teamStats.goalsConceded}</p>
                </div>
                <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center shadow-lg">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Desarmes</p>
                    <p className="text-3xl font-bold text-[#ccff00]">{selectedMatch?.teamStats.tacklesWithBall}</p>
                </div>
                 <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center shadow-lg">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Erros</p>
                    <p className="text-3xl font-bold text-orange-500">{selectedMatch?.teamStats.passesWrong}</p>
                </div>
            </div>
         </div>

         {/* Right Column: Scouting Controls */}
         <div className="bg-black rounded-3xl border border-zinc-800 flex flex-col h-full overflow-hidden shadow-xl">
             
             {/* 1. Context Controls (Period & Time Range) */}
             <div className="p-4 bg-zinc-950 border-b border-zinc-800 space-y-3">
                 
                 {/* Period Selector */}
                 <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button 
                        onClick={() => setSelectedPeriod('1º Tempo')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${selectedPeriod === '1º Tempo' ? 'bg-[#10b981] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        1º Tempo
                    </button>
                    <button 
                         onClick={() => setSelectedPeriod('2º Tempo')}
                         className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${selectedPeriod === '2º Tempo' ? 'bg-[#10b981] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        2º Tempo
                    </button>
                 </div>

                 {/* Time Range Selector */}
                 <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-1">
                        <Clock size={10} /> Faixa de Tempo
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {TIME_RANGES.map(range => (
                            <button
                                key={range}
                                onClick={() => setSelectedTimeRange(range)}
                                className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all truncate ${
                                    selectedTimeRange === range 
                                    ? 'bg-zinc-900 border-[#10b981] text-[#10b981]' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                 </div>
             </div>

             {/* 2. Player Selection */}
             <div className="p-4 border-b border-zinc-800 bg-zinc-950/30">
                <div className="grid grid-cols-4 gap-2">
                    {players.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlayerId(p.id)}
                            className={`flex flex-col items-center justify-center p-1.5 border rounded-xl transition-all ${
                                selectedPlayerId === p.id 
                                ? 'bg-[#10b981] border-[#10b981] text-white' 
                                : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                        >
                            <span className="font-black text-xs">{p.jerseyNumber}</span>
                            <span className="text-[10px] uppercase font-bold opacity-70 truncate w-full text-center">{p.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
             </div>

             {/* 3. Action Buttons */}
             <div className="p-4 grid grid-cols-2 gap-2 flex-1 overflow-y-auto bg-black content-start">
                 {/* Offensive / Neutral */}
                 <ActionButton label="GOL PRÓ" color="bg-white text-black border-white" icon={Goal} onClick={() => handleAction('Gol Pró')} />
                 <ActionButton label="ASSISTÊNCIA" color="bg-zinc-700 text-white border-zinc-600" icon={PlusCircle} onClick={() => handleAction('Assistência')} />
                 
                 {/* Defensive Positive */}
                 <ActionButton label="DESARME (POSSE)" color="bg-[#ccff00] text-black border-[#ccff00]" icon={Shield} onClick={() => handleAction('Desarme c/ Posse')} />
                 <ActionButton label="DESARME (S/ POSSE)" color="bg-yellow-500 text-black border-yellow-500" icon={Shield} onClick={() => handleAction('Desarme s/ Posse')} />
                 <ActionButton label="DESARME (CONTRA-ATQ)" color="bg-[#10b981] text-white border-[#10b981]" icon={Zap} onClick={() => handleAction('Desarme Contra-Ataque')} />

                 {/* Negative / Defensive Errors */}
                 <ActionButton label="ERRO (TRANSIÇÃO)" color="bg-orange-600 text-white border-orange-600" icon={ArrowRightLeft} onClick={() => handleAction('Erro Transição')} />
                 <ActionButton label="GOL TOMADO" color="bg-[#ff0055] text-white border-[#ff0055]" icon={AlertTriangle} onClick={() => handleAction('Gol Tomado')} />
                 
                 {/* Other */}
                 <ActionButton label="FINALIZAÇÃO" color="bg-purple-600 text-white border-purple-600" icon={PlusCircle} onClick={() => handleAction('Finalização')} />
             </div>

             {/* 4. Action Log */}
             <div className="h-48 bg-zinc-950 border-t border-zinc-800 flex flex-col">
                <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-400 uppercase">Log de Eventos</span>
                    </div>
                    <span className="text-[10px] text-zinc-600">{logs.length} eventos</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {logs.length === 0 && <p className="text-zinc-600 text-[10px] text-center mt-4 font-medium">Nenhuma ação registrada.</p>}
                    {logs.map(log => (
                        <div key={log.id} className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800 animate-fade-in group hover:border-zinc-700">
                            <div className="flex flex-col">
                                <div className="flex gap-2 items-center">
                                    <span className="text-[#10b981] text-[10px] font-bold uppercase">{log.period}</span>
                                    <span className="text-zinc-500 text-[10px] font-mono">[{log.matchTimeRange}]</span>
                                </div>
                                <span className="text-white text-xs font-bold mt-0.5">{log.player}</span>
                            </div>
                            <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                                log.action.includes('Tomado') || log.action.includes('Erro') ? 'bg-red-900/50 text-red-400' :
                                log.action.includes('Gol Pró') ? 'bg-green-900/50 text-green-400' :
                                'bg-zinc-800 text-zinc-300'
                            }`}>
                                {log.action}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
         </div>

      </div>
    </div>
  );
};

const ActionButton: React.FC<{ label: string, color: string, icon: any, onClick: () => void }> = ({ label, color, icon: Icon, onClick }) => (
    <button 
        onClick={onClick}
        className={`${color} border p-3 font-bold uppercase tracking-tight text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 rounded-xl`}
    >
        <Icon size={14} strokeWidth={3} />
        {label}
    </button>
);
import React from 'react';
import { Play, Sheet, Calendar, ArrowLeft } from 'lucide-react';

export type CollectionType = 'realtime' | 'postmatch';

interface MatchContext {
  date: string;
  opponent: string;
  competition?: string;
}

interface CollectionTypeSelectorProps {
  matchContext: MatchContext;
  onSelect: (type: CollectionType) => void;
  onBack: () => void;
  onRealtimeSelect?: () => void; // Função opcional para abrir nova aba quando tempo real for selecionado
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
};

export const CollectionTypeSelector: React.FC<CollectionTypeSelectorProps> = ({
  matchContext,
  onSelect,
  onBack,
  onRealtimeSelect,
}) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
          Tipo de Coleta
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Calendário
        </button>
      </div>

      {/* Contexto da partida */}
      <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
        <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
          <Calendar className="text-[#00f0ff]" size={16} /> Partida
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Data</span>
            <p className="text-white font-bold text-sm">{formatDate(matchContext.date)}</p>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Adversário</span>
            <p className="text-white font-bold text-sm">{matchContext.opponent || '-'}</p>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Competição</span>
            <p className="text-white font-bold text-sm">{matchContext.competition || '-'}</p>
          </div>
        </div>
      </div>

      {/* Opções de tipo de coleta */}
      <div className="bg-black rounded-3xl border border-zinc-900 p-6 shadow-lg">
        <p className="text-zinc-400 text-sm mb-6">
          Escolha como os dados serão coletados para esta partida:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              if (onRealtimeSelect) {
                onRealtimeSelect();
              } else {
                onSelect('realtime');
              }
            }}
            className="flex items-center gap-4 p-6 bg-zinc-950 border-2 border-zinc-800 rounded-xl hover:border-[#00f0ff]/50 transition-colors text-left group"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#00f0ff]/20 border-2 border-[#00f0ff]/50 flex items-center justify-center group-hover:bg-[#00f0ff]/30">
              <Play className="text-[#00f0ff]" size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-lg uppercase tracking-tight">Tempo real</div>
              <div className="text-zinc-500 text-sm mt-1">
                Coleta durante a partida. Escalação, cronômetro e registro de ações em tempo real.
              </div>
            </div>
          </button>

            <button
            type="button"
            onClick={() => onSelect('postmatch')}
            className="flex items-center gap-4 p-6 bg-zinc-950 border-2 border-zinc-800 rounded-xl hover:border-[#00f0ff]/50 transition-colors text-left group"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#00f0ff]/20 border-2 border-[#00f0ff]/50 flex items-center justify-center group-hover:bg-[#00f0ff]/30">
              <Sheet className="text-[#00f0ff]" size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-lg uppercase tracking-tight">Depois da partida</div>
              <div className="text-zinc-500 text-sm mt-1">
                Preencher planilha com finalizações, passes, gols, assistências e desarmes.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

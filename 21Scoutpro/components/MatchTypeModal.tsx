import React, { useState } from 'react';
import { X, Clock, Trophy } from 'lucide-react';

export type MatchType = 'normal' | 'extraTime' | 'penalties' | 'extraTimePenalties';

interface MatchTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (matchType: MatchType, extraTimeMinutes?: number) => void;
}

export const MatchTypeModal: React.FC<MatchTypeModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [matchType, setMatchType] = useState<MatchType>('normal');
  const [extraTimeMinutes, setExtraTimeMinutes] = useState<number>(5);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (matchType === 'extraTime' || matchType === 'extraTimePenalties') {
      onConfirm(matchType, extraTimeMinutes);
    } else {
      onConfirm(matchType);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#00f0ff]" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-wide">Tipo de Partida</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-400 text-sm mb-6">
            Selecione o tipo de partida antes de iniciar a coleta de dados:
          </p>

          {/* Opções de Tipo */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
              <input
                type="radio"
                name="matchType"
                value="normal"
                checked={matchType === 'normal'}
                onChange={() => setMatchType('normal')}
                className="w-5 h-5 text-[#00f0ff] border-zinc-700 focus:ring-[#00f0ff] focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Partida Normal</div>
                <div className="text-zinc-500 text-xs">Dois tempos de 20 minutos</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
              <input
                type="radio"
                name="matchType"
                value="extraTime"
                checked={matchType === 'extraTime'}
                onChange={() => setMatchType('extraTime')}
                className="w-5 h-5 text-[#00f0ff] border-zinc-700 focus:ring-[#00f0ff] focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Com Acréscimo</div>
                <div className="text-zinc-500 text-xs">Partida normal + tempo extra</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
              <input
                type="radio"
                name="matchType"
                value="penalties"
                checked={matchType === 'penalties'}
                onChange={() => setMatchType('penalties')}
                className="w-5 h-5 text-[#00f0ff] border-zinc-700 focus:ring-[#00f0ff] focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Direto para Pênaltis</div>
                <div className="text-zinc-500 text-xs">Sem tempo normal, apenas pênaltis</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
              <input
                type="radio"
                name="matchType"
                value="extraTimePenalties"
                checked={matchType === 'extraTimePenalties'}
                onChange={() => setMatchType('extraTimePenalties')}
                className="w-5 h-5 text-[#00f0ff] border-zinc-700 focus:ring-[#00f0ff] focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Acréscimo + Pênaltis</div>
                <div className="text-zinc-500 text-xs">Partida normal + acréscimo + pênaltis</div>
              </div>
            </label>
          </div>

          {/* Input de minutos de acréscimo */}
          {(matchType === 'extraTime' || matchType === 'extraTimePenalties') && (
            <div className="mb-6">
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">
                Minutos de Acréscimo
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={extraTimeMinutes}
                  onChange={(e) => setExtraTimeMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-[#00f0ff]"
                />
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Clock size={16} />
                  <span>minutos</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-[#00f0ff] hover:bg-[#00d9e6] text-black font-black uppercase text-xs rounded-xl transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              Iniciar Scout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

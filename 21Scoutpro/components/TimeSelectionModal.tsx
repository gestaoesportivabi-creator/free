import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';

interface TimeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minute: number, second: number) => void;
  initialMinute?: number;
  initialSecond?: number;
  title?: string;
}

export const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialMinute = 0,
  initialSecond = 0,
  title = 'Selecionar Tempo'
}) => {
  const [minute, setMinute] = useState(initialMinute);
  const [second, setSecond] = useState(initialSecond);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const secondScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMinute(initialMinute);
      setSecond(initialSecond);
      // Scroll para o valor inicial após um pequeno delay
      setTimeout(() => {
        scrollToValue('minute', initialMinute);
        scrollToValue('second', initialSecond);
      }, 100);
    }
  }, [isOpen, initialMinute, initialSecond]);

  const scrollToValue = (type: 'minute' | 'second', value: number) => {
    const ref = type === 'minute' ? minuteScrollRef : secondScrollRef;
    if (ref.current) {
      const itemHeight = 50; // Altura de cada item
      const scrollPosition = value * itemHeight;
      ref.current.scrollTop = scrollPosition;
    }
  };

  const handleScroll = (type: 'minute' | 'second', scrollTop: number) => {
    const itemHeight = 50;
    const index = Math.round(scrollTop / itemHeight);
    const maxValue = type === 'minute' ? 40 : 59;
    const value = Math.max(0, Math.min(index, maxValue));
    
    if (type === 'minute') {
      setMinute(value);
    } else {
      setSecond(value);
    }
  };

  const handleConfirm = () => {
    onConfirm(minute, second);
    onClose();
  };

  if (!isOpen) return null;

  const formatTime = (value: number) => String(value).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Clock className="text-[#00f0ff]" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-wide">{title}</h3>
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
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* Minuto Selector */}
            <div className="flex flex-col items-center">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Minuto</label>
              <div className="relative">
                <div
                  ref={minuteScrollRef}
                  className="h-48 w-20 overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
                  onScroll={(e) => handleScroll('minute', e.currentTarget.scrollTop)}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <div className="py-24">
                    {Array.from({ length: 41 }, (_, i) => (
                      <div
                        key={i}
                        className="h-12 flex items-center justify-center snap-start text-white text-2xl font-bold cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => {
                          setMinute(i);
                          scrollToValue('minute', i);
                        }}
                      >
                        {formatTime(i)}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Overlay indicador de seleção */}
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 pointer-events-none border-t-2 border-b-2 border-[#00f0ff] bg-[#00f0ff]/10" />
              </div>
            </div>

            {/* Separador */}
            <div className="text-4xl font-black text-[#00f0ff]">:</div>

            {/* Segundo Selector */}
            <div className="flex flex-col items-center">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Segundo</label>
              <div className="relative">
                <div
                  ref={secondScrollRef}
                  className="h-48 w-20 overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
                  onScroll={(e) => handleScroll('second', e.currentTarget.scrollTop)}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <div className="py-24">
                    {Array.from({ length: 60 }, (_, i) => (
                      <div
                        key={i}
                        className="h-12 flex items-center justify-center snap-start text-white text-2xl font-bold cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => {
                          setSecond(i);
                          scrollToValue('second', i);
                        }}
                      >
                        {formatTime(i)}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Overlay indicador de seleção */}
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 pointer-events-none border-t-2 border-b-2 border-[#00f0ff] bg-[#00f0ff]/10" />
              </div>
            </div>
          </div>

          {/* Preview do tempo selecionado */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6 text-center">
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Tempo Selecionado</p>
            <p className="text-3xl font-black text-[#00f0ff]">
              {formatTime(minute)}:{formatTime(second)}
            </p>
          </div>

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
              Confirmar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};


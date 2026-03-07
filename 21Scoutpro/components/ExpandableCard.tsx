import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ExpandableCardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: React.ElementType;
  headerColor?: string; // Used for icon accent only now
  noPadding?: boolean;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({ 
  title, 
  children, 
  className = "", 
  icon: Icon,
  headerColor = "text-[#10b981]", 
  noPadding = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to extract color class for icon accents only
  const getIconColor = () => {
    if (headerColor.includes('cyan') || headerColor.includes('#10b981')) return 'text-[#10b981]';
    if (headerColor.includes('magenta') || headerColor.includes('pink') || headerColor.includes('#ff0055')) return 'text-[#ff0055]';
    if (headerColor.includes('lime') || headerColor.includes('#ccff00')) return 'text-[#ccff00]';
    if (headerColor.includes('orange') || headerColor.includes('#ff9900')) return 'text-orange-500';
    if (headerColor.includes('purple')) return 'text-purple-500';
    return 'text-[#10b981]'; 
  };

  const accentColor = getIconColor();

  const toggleExpand = () => {
    if (!isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    setIsExpanded(!isExpanded);
  };

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-hidden">
        <div className={`w-full h-full max-w-7xl bg-black rounded-3xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden`}>
          
          {/* Expanded Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-black">
            <div className="flex items-center gap-4">
               {Icon && (
                   <Icon size={24} className={accentColor} />
               )}
               <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                 {title}
               </h2>
            </div>
            <button 
              onClick={toggleExpand}
              className="bg-zinc-900 hover:bg-zinc-800 text-white p-3 rounded-full transition-colors border border-zinc-700"
              title="Minimizar"
            >
              <Minimize2 size={24} />
            </button>
          </div>

          {/* Expanded Content */}
          <div className={`flex-1 overflow-auto bg-black ${noPadding ? '' : 'p-8'}`}>
             <div className="h-full w-full min-h-[500px] flex flex-col">
                {children}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Neon Card State
  return (
    <div 
        className={`
            bg-black 
            rounded-3xl border border-zinc-900
            shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-zinc-700
            transition-all duration-300
            flex flex-col group
            ${className}
        `}
    >
      {/* Header */}
      {(title || Icon) && (
          <div className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
                {Icon && (
                    <Icon size={20} className={accentColor} />
                )}
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors">
                    {title}
                </h3>
            </div>
            <button 
                onClick={toggleExpand}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-[#10b981] p-1"
                title="Expandir"
            >
                <Maximize2 size={16} />
            </button>
          </div>
      )}

      {/* Button fallback if no header */}
      {!title && !Icon && (
         <button 
            onClick={toggleExpand}
            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-400 hover:text-[#10b981] p-2 rounded-lg border border-zinc-800"
            title="Expandir"
         >
            <Maximize2 size={16} />
         </button>
      )}

      <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>
    </div>
  );
};
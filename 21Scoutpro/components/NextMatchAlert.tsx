import React, { useState, useEffect } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { ChampionshipMatch } from '../types';

interface NextMatchAlertProps {
  matches: ChampionshipMatch[];
}

export const NextMatchAlert: React.FC<NextMatchAlertProps> = ({ matches }) => {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number } | null>(null);
  const [nextMatch, setNextMatch] = useState<ChampionshipMatch | null>(null);

  useEffect(() => {
    const calculateNextMatch = () => {
      const now = new Date();
      const currentTime = now.getTime();

      // Filtrar partidas futuras
      const futureMatches = matches.filter(match => {
        if (!match.date || !match.time) return false;
        
        try {
          // Combinar data e hora
          const matchDateStr = match.date;
          const matchTimeStr = match.time;
          
          // Parsear data (formato YYYY-MM-DD)
          const [year, month, day] = matchDateStr.split('-').map(Number);
          
          // Parsear hora (formato HH:MM)
          let hours = 0;
          let minutes = 0;
          
          if (matchTimeStr.includes(':')) {
            const [h, m] = matchTimeStr.split(':').map(Number);
            hours = h || 0;
            minutes = m || 0;
          } else {
            // Tentar parsear como timestamp ISO (caso venha do Google Sheets)
            try {
              const timeDate = new Date(matchTimeStr);
              if (!isNaN(timeDate.getTime())) {
                hours = timeDate.getHours();
                minutes = timeDate.getMinutes();
              }
            } catch {
              // Se falhar, usar hora padrão
              hours = 20;
              minutes = 0;
            }
          }
          
          const matchDateTime = new Date(year, month - 1, day, hours, minutes);
          const matchTime = matchDateTime.getTime();
          
          return matchTime > currentTime;
        } catch (error) {
          console.warn('Erro ao processar data/hora da partida:', match, error);
          return false;
        }
      });

      if (futureMatches.length === 0) {
        setNextMatch(null);
        setTimeRemaining(null);
        return;
      }

      // Ordenar por data e hora (mais próxima primeiro)
      futureMatches.sort((a, b) => {
        try {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          
          // Se mesma data, ordenar por hora
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          
          const [hA, mA] = timeA.split(':').map(Number);
          const [hB, mB] = timeB.split(':').map(Number);
          
          const timeAValue = (hA || 0) * 60 + (mA || 0);
          const timeBValue = (hB || 0) * 60 + (mB || 0);
          
          return timeAValue - timeBValue;
        } catch {
          return 0;
        }
      });

      const nearestMatch = futureMatches[0];
      setNextMatch(nearestMatch);

      // Calcular tempo restante
      try {
        const matchDateStr = nearestMatch.date;
        const matchTimeStr = nearestMatch.time || '20:00';
        
        const [year, month, day] = matchDateStr.split('-').map(Number);
        
        let hours = 0;
        let minutes = 0;
        
        if (matchTimeStr.includes(':')) {
          const [h, m] = matchTimeStr.split(':').map(Number);
          hours = h || 0;
          minutes = m || 0;
        } else {
          try {
            const timeDate = new Date(matchTimeStr);
            if (!isNaN(timeDate.getTime())) {
              hours = timeDate.getHours();
              minutes = timeDate.getMinutes();
            }
          } catch {
            hours = 20;
            minutes = 0;
          }
        }
        
        const matchDateTime = new Date(year, month - 1, day, hours, minutes);
        const matchTime = matchDateTime.getTime();
        const now = new Date();
        const currentTime = now.getTime();
        
        const diff = matchTime - currentTime;
        
        // Verificar se está dentro de 24 horas (86400000 ms)
        if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
          const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
          const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          setTimeRemaining({ hours: hoursRemaining, minutes: minutesRemaining });
        } else {
          setTimeRemaining(null);
        }
      } catch (error) {
        console.warn('Erro ao calcular tempo restante:', error);
        setTimeRemaining(null);
      }
    };

    // Calcular imediatamente
    calculateNextMatch();

    // Atualizar a cada minuto
    const interval = setInterval(calculateNextMatch, 60000);

    return () => clearInterval(interval);
  }, [matches]);

  // Não mostrar se não houver próximo jogo ou se não estiver dentro de 24h
  if (!nextMatch || !timeRemaining) {
    return null;
  }

  // Não mostrar se já passou o horário do jogo
  if (timeRemaining.hours === 0 && timeRemaining.minutes === 0) {
    return null;
  }

  return (
    <div className="bg-[#00f0ff]/20 border-l-4 border-[#00f0ff] rounded-r-lg px-3 py-2 backdrop-blur-sm shadow-md">
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          <Clock className="text-[#00f0ff]" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0">
            <Trophy className="text-[#00f0ff]" size={12} />
            <span className="text-white font-bold text-xs uppercase truncate">
              {nextMatch.opponent || 'Próximo Jogo'}
            </span>
            {nextMatch.competition && (
              <span className="text-zinc-400 text-[10px] font-medium truncate">
                ({nextMatch.competition})
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-[10px] font-bold uppercase">
            Tempo faltante
          </p>
          <span className="text-[#00f0ff] font-black text-base">
            {timeRemaining.hours > 0 ? `${timeRemaining.hours}h` : ''} {timeRemaining.minutes > 0 ? `${timeRemaining.minutes}min` : 'agora'}
          </span>
        </div>
      </div>
    </div>
  );
};

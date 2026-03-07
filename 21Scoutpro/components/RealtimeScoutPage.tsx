import React, { useState, useEffect } from 'react';
import { MatchScoutingWindow } from './MatchScoutingWindow';
import { MatchRecord, Player, Team } from '../types';
import { MatchType } from './MatchTypeModal';
import { matchesApi } from '../services/api';

interface RealtimeScoutData {
  matchId?: string;
  date: string;
  opponent: string;
  competition?: string;
  players: Player[];
  teams: Team[];
  matchType: MatchType;
  extraTimeMinutes: number;
  selectedPlayerIds?: string[];
}

export const RealtimeScoutPage: React.FC = () => {
  const [scoutData, setScoutData] = useState<RealtimeScoutData | null>(null);
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados do localStorage
    try {
      const storedData = localStorage.getItem('realtimeScoutData');
      if (!storedData) {
        setError('Nenhum dado de partida encontrado. Por favor, selecione uma partida novamente.');
        setIsLoading(false);
        return;
      }

      const data: RealtimeScoutData = JSON.parse(storedData);
      setScoutData(data);

      // Criar MatchRecord a partir dos dados
      const matchRecord: MatchRecord = {
        id: data.matchId || `temp-${Date.now()}`,
        date: data.date,
        opponent: data.opponent,
        competition: data.competition,
        status: 'not_executed',
        result: 'E',
        goalsFor: 0,
        goalsAgainst: 0,
        teamStats: {
          goals: 0,
          assists: 0,
          passesCorrect: 0,
          passesWrong: 0,
          shotsOnTarget: 0,
          shotsOffTarget: 0,
          tacklesWithBall: 0,
          tacklesWithoutBall: 0,
          tacklesCounterAttack: 0,
          transitionErrors: 0,
        },
        playerStats: [],
      };

      setMatch(matchRecord);
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados da partida:', err);
      setError('Erro ao carregar dados da partida. Por favor, tente novamente.');
      setIsLoading(false);
    }
  }, []);

  // Manter URL sempre em /scout-realtime: não permitir voltar para /dashboard nesta aba
  useEffect(() => {
    if (window.location.pathname !== '/scout-realtime') {
      window.history.replaceState({}, '', '/scout-realtime');
    }
    const handlePopState = () => {
      if (window.location.pathname !== '/scout-realtime') {
        window.history.replaceState({}, '', '/scout-realtime');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSave = async (savedMatch: MatchRecord) => {
    try {
      if (!savedMatch || !savedMatch.teamStats) {
        alert('Dados da partida incompletos. Não foi possível salvar.');
        return;
      }
      const saved = await matchesApi.create(savedMatch);
      if (saved) {
        localStorage.removeItem('realtimeScoutData');
        alert('Partida salva com sucesso! Os dados foram gravados no sistema.');
        window.close();
      } else {
        alert('Erro ao salvar a partida no servidor. Verifique sua conexão e tente novamente. Os dados NÃO foram gravados.');
      }
    } catch (err) {
      console.error('Erro ao salvar partida:', err);
      alert('Erro ao salvar partida no servidor. Os dados NÃO foram gravados. Verifique o console (F12) e tente novamente.');
    }
  };

  const handleClose = () => {
    // Limpar dados e fechar aba
    localStorage.removeItem('realtimeScoutData');
    window.close();
  };

  if (isLoading) {
    return (
      <div className="w-screen h-dvh min-h-dvh bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00f0ff] text-2xl font-black uppercase mb-4">Carregando...</div>
          <div className="text-zinc-400 text-sm">Preparando interface de coleta</div>
        </div>
      </div>
    );
  }

  if (error || !scoutData || !match) {
    return (
      <div className="w-screen h-dvh min-h-dvh bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-400 text-xl font-black uppercase mb-4">Erro</div>
          <div className="text-zinc-400 text-sm mb-6">{error || 'Dados da partida não encontrados'}</div>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-sm rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-dvh min-h-dvh overflow-hidden bg-black">
      <MatchScoutingWindow
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        match={match}
        players={scoutData.players}
        teams={scoutData.teams}
        matchType={scoutData.matchType}
        extraTimeMinutes={scoutData.extraTimeMinutes}
        selectedPlayerIds={scoutData.selectedPlayerIds}
      />
    </div>
  );
};

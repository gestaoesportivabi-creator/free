import React, { useState, useEffect } from 'react';
import { MatchScoutingWindow } from './MatchScoutingWindow';
import { MatchRecord, Player, Team } from '../types';
import { MatchType } from './MatchTypeModal';
import { matchesApi } from '../services/api';
import { upsertMatchRecord } from '../utils/matchUpsert';
import { resolveCollectionExperience, withCollectionExperience } from '../utils/collectionExperience';

function getRecordedByUserFromSession(): { id?: string; name: string } | undefined {
  try {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return undefined;
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as {
      userId?: string;
      email?: string;
    };
    if (!payload.userId && !payload.email) return undefined;
    return { id: payload.userId, name: payload.email ?? 'Operador autenticado' };
  } catch {
    return undefined;
  }
}

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
  const collectionExperience = resolveCollectionExperience(
    typeof window !== 'undefined' ? window.location.search : undefined
  );

  useEffect(() => {
    const loadRealtimeMatch = async () => {
      try {
        const storedData = localStorage.getItem('realtimeScoutData');
        if (!storedData) {
          setError('Nenhum dado de partida encontrado. Por favor, selecione uma partida novamente.');
          setIsLoading(false);
          return;
        }

        const data: RealtimeScoutData = JSON.parse(storedData);
        setScoutData(data);

        // Base local (fallback)
        let matchRecord: MatchRecord = {
          id: data.matchId || `temp-${Date.now()}`,
          date: data.date,
          opponent: data.opponent,
          competition: data.competition,
          status: 'disponivel',
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
          playerStats: {},
        };

        if (data.matchId) {
          try {
            const dbMatch = await matchesApi.getById(data.matchId);
            if (
              dbMatch?.id &&
              (dbMatch.status === 'em_andamento' ||
                dbMatch.status === 'disponivel' ||
                dbMatch.status === 'nao_executado' ||
                (dbMatch.postMatchEventLog && dbMatch.postMatchEventLog.length > 0))
            ) {
              matchRecord = dbMatch;
            }
          } catch (fetchErr) {
            console.warn('Falha ao buscar partida incompleta no banco, usando dados locais.', fetchErr);
          }
        }

        setMatch(matchRecord);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados da partida:', err);
        setError('Erro ao carregar dados da partida. Por favor, tente novamente.');
        setIsLoading(false);
      }
    };

    void loadRealtimeMatch();
  }, []);

  // Manter URL sempre em /scout-realtime: não permitir voltar para /dashboard nesta aba
  useEffect(() => {
    const realtimeUrl = `/scout-realtime${window.location.search || ''}`;
    if (window.location.pathname !== '/scout-realtime') {
      window.history.replaceState({}, '', realtimeUrl);
    }
    const handlePopState = () => {
      if (window.location.pathname !== '/scout-realtime') {
        window.history.replaceState({}, '', realtimeUrl);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const exitRealtimeScout = () => {
    localStorage.removeItem('realtimeScoutData');
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    window.location.assign(withCollectionExperience('/dashboard', window.location.search));
  };

  const handleSave = async (
    savedMatch: MatchRecord,
    options?: { source?: 'manual' | 'autosave'; saveAsIncomplete?: boolean }
  ) => {
    const isAutosave = options?.source === 'autosave';
    const saveAsIncomplete = options?.saveAsIncomplete === true;
    try {
      if (!savedMatch || !savedMatch.teamStats) {
        if (!isAutosave) alert('Dados da partida incompletos. Não foi possível salvar.');
        return;
      }
      const { saved } = await upsertMatchRecord(savedMatch);
      if (saved?.id) {
        setMatch((prev) => (prev ? { ...prev, ...saved, id: saved.id } : saved));
      }
      if (saved && !isAutosave) {
        alert(
          saveAsIncomplete
            ? 'Dados guardados como incompleto. Pode continuar a coleta mais tarde.'
            : 'Partida salva com sucesso! Os dados foram gravados no sistema.'
        );
        exitRealtimeScout();
      } else if (!saved && !isAutosave) {
        alert('Erro ao salvar a partida no servidor. Verifique sua conexão e tente novamente. Os dados NÃO foram gravados.');
      } else if (!saved && isAutosave) {
        throw new Error('Autosave não foi confirmado pelo servidor.');
      }
      return saved;
    } catch (err) {
      console.error('Erro ao salvar partida:', err);
      if (isAutosave) throw err;
      if (!isAutosave) {
        alert('Erro ao salvar partida no servidor. Os dados NÃO foram gravados. Verifique o console (F12) e tente novamente.');
      }
    }
    return undefined;
  };

  const handleClose = () => {
    exitRealtimeScout();
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
            onClick={exitRealtimeScout}
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
        collectionExperience={collectionExperience}
        recordedByUser={getRecordedByUserFromSession()}
      />
    </div>
  );
};

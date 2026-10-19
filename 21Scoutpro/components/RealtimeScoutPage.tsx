import React, { useState, useEffect } from 'react';
import { MatchScoutingWindow } from './MatchScoutingWindow';
import { MatchRecord, Player, Team } from '../types';
import { MatchType } from './MatchTypeModal';
import { matchesApi } from '../services/api';
import { upsertMatchRecord } from '../utils/matchUpsert';
import {
  SAVE_UNCONFIRMED_MESSAGE,
  isUnconfirmedSaveError,
  verifyPostMatchEventLog,
} from '../utils/verifyPostMatchEventLog';
import { isEmptyUnionEventLogError } from '../utils/eventLogConflict';
import {
  stashOpenMatchAnalysis,
  OPEN_MATCH_ANALYSIS_KEY,
  markKeepSessionAfterFinalize,
} from '../utils/openMatchAnalysis';
import { performFinalizeNavigation } from '../utils/sessionRestore';
import { isTrialExpiredSaveError } from '../utils/trialExpiredSave';

// Recurso legado: tempo real está isolado/desativado na UI principal.
// Este componente permanece para possível reativação futura controlada.

interface RealtimeScoutData {
  matchId?: string;
  date: string;
  opponent: string;
  competition?: string;
  /** Mandante / Visitante — propagado da tabela de campeonato / partida salva */
  location?: string;
  players: Player[];
  teams: Team[];
  matchType: MatchType;
  extraTimeMinutes: number;
  selectedPlayerIds?: string[];
}

export const RealtimeScoutPage: React.FC<{
  /** Mesma aba: router da App, sem `location.assign` / reload. */
  onSoftNavigateDashboard?: () => void;
}> = ({ onSoftNavigateDashboard }) => {
  const [scoutData, setScoutData] = useState<RealtimeScoutData | null>(null);
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const locationFromPrep =
          typeof data.location === 'string' && data.location.trim() ? data.location.trim() : undefined;

        // Base local (fallback)
        let matchRecord: MatchRecord = {
          id: data.matchId || `temp-${Date.now()}`,
          date: data.date,
          opponent: data.opponent,
          competition: data.competition,
          location: locationFromPrep,
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
              matchRecord = {
                ...dbMatch,
                location: dbMatch.location?.trim() || locationFromPrep,
              };
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

  const exitRealtimeScout = () => {
    localStorage.removeItem('realtimeScoutData');
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    window.location.assign('/dashboard');
  };

  const handoffToDashboardAnalysis = (finalizedId: string) => {
    stashOpenMatchAnalysis(finalizedId);
    markKeepSessionAfterFinalize();
    // Only clear scout bootstrap payload — never touch `token` / `user`.
    localStorage.removeItem('realtimeScoutData');
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.localStorage.setItem(OPEN_MATCH_ANALYSIS_KEY, finalizedId);
        try {
          window.opener.sessionStorage.setItem(
            'scout21_keep_session_until',
            String(Date.now() + 25_000)
          );
        } catch {
          /* ignore */
        }
        window.close();
        return;
      } catch {
        /* fall through to same-tab dashboard */
      }
    }
    // Soft navigation — reload via location.assign remontava o App e caía em /login.
    performFinalizeNavigation({
      hasLiveOpener: false,
      pushState: (url) => window.history.pushState({}, '', url),
      assign: (url) => window.location.assign(url),
      close: () => window.close(),
      softRoute: onSoftNavigateDashboard,
    });
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
      if (!saved) {
        if (!isAutosave) alert(SAVE_UNCONFIRMED_MESSAGE);
        return undefined;
      }
      const expectedLogLength = Array.isArray(savedMatch.postMatchEventLog) ? savedMatch.postMatchEventLog.length : 0;
      const verified = await verifyPostMatchEventLog(saved, expectedLogLength);
      const kept = verified.match;
      if (verified.status === 'unavailable') {
        console.warn('GET de verificação da fita falhou; a coleta do PUT foi mantida.', kept.id);
      } else if (verified.status === 'shorter') {
        console.warn(
          `Fita confirmada com ${verified.serverLogLength ?? 0} lance(s); a coleta local tem ${expectedLogLength} e foi mantida.`,
          kept.id
        );
        setMatch((prev) => (prev ? { ...prev, ...kept, id: kept.id, postMatchEventLog: savedMatch.postMatchEventLog } : kept));
        if (!isAutosave) alert(SAVE_UNCONFIRMED_MESSAGE);
        return undefined;
      }
      if (kept?.id) {
        setMatch((prev) => (prev ? { ...prev, ...kept, id: kept.id } : kept));
      }
      if (kept && !isAutosave) {
        // Finalizar coleta: sem alert nativo (e2e + UX); abre Análise em Dados do Jogo
        if (savedMatch.status === 'encerrado') {
          const finalizedId = String(kept.id || savedMatch.id || '').trim();
          if (finalizedId) handoffToDashboardAnalysis(finalizedId);
          return kept;
        }
        alert(
          saveAsIncomplete
            ? 'Dados guardados como incompleto. Pode continuar a coleta mais tarde.'
            : 'Partida salva com sucesso! Os dados foram gravados no sistema.'
        );
        exitRealtimeScout();
      }
      return kept;
    } catch (err) {
      console.error('Erro ao salvar partida:', err);
      if (isTrialExpiredSaveError(err)) {
        // A coleta permanece na tela; só o autosave engole o 402 para não interromper o relógio.
        if (!isAutosave) throw err;
        return undefined;
      }
      if (isEmptyUnionEventLogError(err)) {
        throw err;
      }
      if (isUnconfirmedSaveError(err)) {
        const expectedLogLength = Array.isArray(savedMatch.postMatchEventLog) ? savedMatch.postMatchEventLog.length : 0;
        const id = savedMatch.id != null ? String(savedMatch.id).trim() : '';
        if (id && expectedLogLength > 0) {
          const verified = await verifyPostMatchEventLog({ ...savedMatch, id }, expectedLogLength);
          if (verified.status === 'confirmed') {
            setMatch((prev) => (prev ? { ...prev, ...verified.match, id: verified.match.id } : verified.match));
            return verified.match;
          }
        }
      }
      if (!isAutosave) alert(SAVE_UNCONFIRMED_MESSAGE);
    }
    return undefined;
  };

  const handleClose = () => {
    exitRealtimeScout();
  };

  const handleCollectionFinalized = (_matchId: string) => {
    // Handoff (stash + /dashboard) already ran inside handleSave for status=encerrado.
    // Do not call onClose/exitRealtimeScout here — that raced with navigation and beforeunload.
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
        onCollectionFinalized={handleCollectionFinalized}
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

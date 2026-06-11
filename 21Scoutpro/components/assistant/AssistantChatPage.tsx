import React, { useEffect, useState } from 'react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { AssistantWelcome } from './AssistantWelcome';
import { AssistantMessageList } from './AssistantMessageList';
import { AssistantQuickActions } from './AssistantQuickActions';
import { AssistantInputBar } from './AssistantInputBar';
import { useAssistantChat } from './useAssistantChat';
import {
  fetchWebAssistantStatus,
  type WebAssistantStatus,
} from '../../services/assistantChatApi';

interface AssistantChatPageProps {
  onBack: () => void;
}

export const AssistantChatPage: React.FC<AssistantChatPageProps> = ({ onBack }) => {
  const {
    messages,
    streaming,
    streamingPhase,
    streamingHint,
    error,
    sendMessage,
    sendWelcome,
    setError,
  } = useAssistantChat({ isAdmin: status?.role === 'ADMINISTRADOR' });
  const [status, setStatus] = useState<WebAssistantStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    let cancelled = false;
    fetchWebAssistantStatus().then((s) => {
      if (!cancelled) {
        setStatus(s);
        setStatusLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (statusLoading || !status?.enabled || offline) return;
    void sendWelcome();
  }, [statusLoading, status?.enabled, offline, sendWelcome]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const isAthlete = status?.userType === 'athlete';
  const assistantEnabled = status?.enabled !== false;
  const hasUserMessages = messages.some((m) => m.role === 'user');
  const inputDisabled = streaming || offline || !assistantEnabled;

  return (
    <div className="assistant-shell platform-font flex flex-col bg-black text-zinc-100">
      <header className="assistant-safe-top sticky top-0 z-10 flex items-center gap-3 h-14 px-3 sm:px-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 text-zinc-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50"
          aria-label="Voltar"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">Assistente Scout21</h1>
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                offline ? 'bg-zinc-600' : assistantEnabled ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              aria-hidden="true"
            />
            {offline ? 'Offline' : assistantEnabled ? 'Online' : 'Indisponível'}
          </p>
        </div>
      </header>

      {offline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/40 border-b border-amber-900/50 text-amber-200 text-sm">
          <WifiOff size={16} className="shrink-0" />
          Sem conexão. Verifique a internet e tente novamente.
        </div>
      )}

      {!statusLoading && status && !assistantEnabled && (
        <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 text-sm text-zinc-400">
          O assistente ainda não está configurado no servidor. Entre em contato com o suporte.
        </div>
      )}

      <AssistantMessageList
        messages={messages}
        streaming={streaming}
        streamingPhase={streamingPhase}
        streamingHint={streamingHint}
      />

      {!hasUserMessages && !streaming && (
        <div className="px-3 sm:px-4 pb-2 shrink-0">
          <AssistantWelcome status={status} loading={statusLoading} onSuggest={sendMessage} />
        </div>
      )}

      {error && (
        <div className="px-4 py-2 flex items-center justify-between gap-3 bg-red-950/40 border-t border-red-900/50 text-sm text-red-200">
          <span className="min-w-0 truncate">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 min-h-[44px] px-3 text-[#00f0ff] hover:text-white"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <AssistantQuickActions
        isAthlete={isAthlete}
        isAdmin={status?.role === 'ADMINISTRADOR'}
        disabled={inputDisabled}
        onSelect={sendMessage}
      />

      <AssistantInputBar disabled={inputDisabled} onSend={sendMessage} />
    </div>
  );
};

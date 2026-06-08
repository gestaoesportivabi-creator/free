import React from 'react';
import { Youtube } from 'lucide-react';
import type { WebAssistantStatus } from '../../services/assistantChatApi';

interface AssistantWelcomeProps {
  status: WebAssistantStatus | null;
  loading: boolean;
  onSuggest?: (message: string) => void;
}

export const AssistantWelcome: React.FC<AssistantWelcomeProps> = ({
  status,
  loading,
  onSuggest,
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse px-1" aria-hidden="true">
        <div className="h-5 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-full max-w-sm bg-zinc-800/80 rounded-lg" />
        <div className="h-4 w-3/4 max-w-xs bg-zinc-800/60 rounded-lg" />
      </div>
    );
  }

  const name = status?.userName?.split(' ')[0] ?? 'técnico';
  const isAthlete = status?.userType === 'athlete';

  if (isAthlete) {
    return (
      <div className="px-1 py-2">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Olá, {name}!</h2>
        <p className="text-[15px] leading-relaxed text-zinc-400">
          Sou seu assistente pessoal. Posso ajudar com PSE, bem-estar, agenda e informações do
          elenco.
        </p>
      </div>
    );
  }

  const youtubePrompt =
    'Quero usar o YouTube Scout PRO: explique como colar um link do YouTube para extrair scout do meu time ou de um adversário.';

  return (
    <div className="px-1 py-2 space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-white">Olá, {name}!</h2>
      <p className="text-[15px] leading-relaxed text-zinc-400">
        Sou seu <span className="text-zinc-200">analista Scout21</span>. Sua conta está conectada
        — consulte jogos, elenco e adversários sem sair do dashboard.
      </p>
      <ul className="text-[14px] leading-relaxed text-zinc-500 space-y-1 list-disc pl-4">
        <li>Resumir último jogo e campanha</li>
        <li>Listar elenco e artilheiros</li>
        <li>Dossiê de adversários</li>
        <li>Prontidão e bem-estar da equipe</li>
      </ul>

      <div className="rounded-xl border border-[#00f0ff]/35 bg-[#00f0ff]/8 p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <Youtube size={20} className="text-[#00f0ff] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#00f0ff]">YouTube Scout (PRO)</p>
            <p className="text-[14px] leading-relaxed text-zinc-300 mt-1">
              Cole o link do YouTube de um jogo — do seu time ou de adversários — e extraio o scout:
              escalação, gols, pontos fortes/fracos e insights táticos.
            </p>
            {onSuggest && (
              <button
                type="button"
                onClick={() => onSuggest(youtubePrompt)}
                className="mt-3 min-h-[44px] px-4 py-2 rounded-full border border-[#00f0ff]/40 text-sm font-medium text-[#00f0ff] hover:bg-[#00f0ff]/15 transition-colors"
              >
                Colar link do YouTube
              </button>
            )}
          </div>
        </div>
      </div>

      {status?.lastMatch && (
        <p className="text-[13px] text-zinc-500">
          Último jogo: <span className="text-zinc-400">{status.lastMatch.opponent}</span>
          {status.lastMatch.result ? ` (${status.lastMatch.result})` : ''}
          {status.lastMatch.videoUrl ? ' · vídeo disponível' : ''}
        </p>
      )}

      {status?.videoCount != null && status.videoCount > 0 && (
        <p className="text-xs text-zinc-500">
          {status.videoCount} vídeo{status.videoCount > 1 ? 's' : ''} no dossiê de adversários.
        </p>
      )}

      {status?.equipeCount != null && status.equipeCount > 0 && (
        <p className="text-xs text-zinc-500">
          {status.equipeCount} equipe{status.equipeCount > 1 ? 's' : ''} vinculada
          {status.equipeCount > 1 ? 's' : ''} à sua conta.
        </p>
      )}
    </div>
  );
};

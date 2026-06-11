import { useCallback, useRef, useState } from 'react';
import type { AssistantChatMessage, StreamingPhase } from '../../services/assistantChatApi';
import { streamWebAssistantChat } from '../../services/assistantChatApi';
import { containsYouTubeUrl, normalizeMessageYoutubeUrls } from '../../utils/youtubeDetect';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME_STAFF =
  'Olá! Mostre o menu de boas-vindas STAFF com YouTube Scout PRO (ultimo jogo, elenco, adversarios).';
const WELCOME_ADMIN =
  'Olá! Mostre o menu de boas-vindas ADMINISTRADOR (plataforma, usuarios, tenants, assistente, YouTube Scout). NAO use menu de tecnico.';

export function useAssistantChat(options?: { isAdmin?: boolean }) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>('idle');
  const [streamingHint, setStreamingHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const welcomeSentRef = useRef(false);

  const runStream = useCallback(
    async (
      history: { role: 'user' | 'assistant'; content: string }[],
      assistantId: string,
      hint?: string | null
    ) => {
      setStreamingHint(hint ?? null);
      setStreamingPhase('thinking');
      let gotDelta = false;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        await streamWebAssistantChat(
          history,
          (delta) => {
            if (!gotDelta) {
              gotDelta = true;
              setStreamingPhase('streaming');
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m
              )
            );
          },
          abortRef.current.signal
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(msg);
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content.length > 0)
        );
        throw err;
      } finally {
        setStreaming(false);
        setStreamingPhase('idle');
        setStreamingHint(null);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string, opts?: { silent?: boolean }) => {
      const trimmed = normalizeMessageYoutubeUrls(text.trim());
      if (!trimmed || streaming) return;

      setError(null);
      const userMsg: AssistantChatMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      };

      const assistantId = newId();
      const visibleUser = opts?.silent ? [] : [userMsg];
      setMessages((prev) => [
        ...prev,
        ...visibleUser,
        { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() },
      ]);
      setStreaming(true);

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const hint = containsYouTubeUrl(trimmed)
        ? 'Salvando vídeo e preparando scout...'
        : 'Consultando dados no Scout21...';

      await runStream(history, assistantId, hint);
    },
    [messages, streaming, runStream]
  );

  const sendWelcome = useCallback(async () => {
    if (welcomeSentRef.current || streaming) return;
    welcomeSentRef.current = true;
    const trigger = options?.isAdmin ? WELCOME_ADMIN : WELCOME_STAFF;
    try {
      await sendMessage(trigger, { silent: true });
    } catch {
      welcomeSentRef.current = false;
    }
  }, [sendMessage, streaming, options?.isAdmin]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamingPhase('idle');
    setStreamingHint(null);
  }, []);

  return {
    messages,
    streaming,
    streamingPhase,
    streamingHint,
    error,
    sendMessage,
    sendWelcome,
    stop,
    setError,
  };
}

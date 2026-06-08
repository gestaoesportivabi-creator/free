import { useCallback, useRef, useState } from 'react';
import type { AssistantChatMessage } from '../../services/assistantChatApi';
import { streamWebAssistantChat } from '../../services/assistantChatApi';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    const userMsg: AssistantChatMessage = {
      id: newId(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };

    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() },
    ]);
    setStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await streamWebAssistantChat(
        history,
        (delta) => {
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
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.length > 0));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, stop, setError };
}

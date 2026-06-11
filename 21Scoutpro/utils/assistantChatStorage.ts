import type { AssistantChatMessage } from '../services/assistantChatApi';

const PREFIX = 'scout21-assistant-chat:';
const MAX_MESSAGES = 80;

function storageKey(userId: string) {
  return `${PREFIX}${userId}`;
}

export function loadAssistantChatHistory(userId: string): AssistantChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m) =>
          m &&
          typeof m.id === 'string' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          (m.content.length > 0 || m.role === 'user')
      )
      .slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
}

export function saveAssistantChatHistory(userId: string, messages: AssistantChatMessage[]): void {
  try {
    const toSave = messages
      .filter((m) => m.content.length > 0 || m.role === 'user')
      .slice(-MAX_MESSAGES);
    localStorage.setItem(storageKey(userId), JSON.stringify(toSave));
  } catch {
    /* quota / private mode */
  }
}

export function clearAssistantChatHistory(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}

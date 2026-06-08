import React, { useCallback, useRef, useState } from 'react';
import { Send } from 'lucide-react';

interface AssistantInputBarProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export const AssistantInputBar: React.FC<AssistantInputBarProps> = ({ disabled, onSend }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    const maxH = 96;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  };

  return (
    <div className="assistant-safe-bottom border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-3 sm:px-4 py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Mensagem..."
          className="flex-1 resize-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/40 disabled:opacity-50 min-h-[52px] max-h-24"
          aria-label="Mensagem para o assistente"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50"
          aria-label="Enviar mensagem"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

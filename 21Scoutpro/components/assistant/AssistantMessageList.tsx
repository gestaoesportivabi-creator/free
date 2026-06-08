import React, { useEffect, useRef } from 'react';
import type { AssistantChatMessage } from '../../services/assistantChatApi';

function renderLightMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split('\n').map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

interface AssistantMessageListProps {
  messages: AssistantChatMessage[];
  streaming: boolean;
}

export const AssistantMessageList: React.FC<AssistantMessageListProps> = ({
  messages,
  streaming,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const visible = messages.filter((m) => m.content.length > 0 || m.role === 'user');

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 custom-scrollbar">
      {visible.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#00f0ff]/15 text-zinc-100'
                : 'bg-zinc-800/80 text-zinc-200'
            }`}
          >
            {renderLightMarkdown(msg.content)}
            {msg.role === 'assistant' &&
              streaming &&
              msg.id === visible[visible.length - 1]?.id &&
              msg.content.length > 0 && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-[#00f0ff]/60 animate-pulse motion-reduce:animate-none align-middle" />
              )}
          </div>
        </div>
      ))}
      {streaming && visible.length > 0 && visible[visible.length - 1]?.role === 'assistant' && visible[visible.length - 1]?.content === '' && (
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl px-4 py-3 bg-zinc-800/80">
            <span className="assistant-typing-dots text-zinc-500 text-sm">digitando</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
};

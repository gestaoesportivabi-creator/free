import React, { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardPaste } from 'lucide-react';
import {
  blockingRosterLines,
  parseRoster,
  ROSTER_PASTE_LIMIT,
  type RosterLine,
  savableRosterLines,
} from '../../utils/rosterParser';

/**
 * Colagem de elenco a partir de planilha.
 *
 * O texto é interpretado por `utils/rosterParser`. Esta tela só mostra o
 * resultado e impede gravar enquanto houver erro — a menos que o treinador
 * escolha ignorar as linhas ruins.
 */

interface RosterPasteProps {
  onParsed: (players: RosterLine[]) => void;
  disabled?: boolean;
  /** Números de camisa do elenco que já está na tela. */
  existingNumbers?: readonly number[];
  /** Erro do servidor (409, rede) preso à linha original. */
  serverErrors?: Readonly<Record<number, string>>;
  onDraftChange?: () => void;
}

export const RosterPaste: React.FC<RosterPasteProps> = ({
  onParsed,
  disabled,
  existingNumbers,
  serverErrors,
  onDraftChange,
}) => {
  const [raw, setRaw] = useState('');
  const existingKey = existingNumbers?.join(',') ?? '';

  const result = useMemo(() => {
    const numbers = existingKey
      ? existingKey.split(',').map((part) => Number(part)).filter((value) => Number.isFinite(value))
      : [];
    return parseRoster(raw, { existingNumbers: numbers });
  }, [raw, existingKey]);

  const ready = savableRosterLines(result.lines);
  const blocking = blockingRosterLines(result.lines);
  const warningCount = result.lines.filter((line) => line.warnings.length > 0).length;

  return (
    <div className="space-y-3">
      <label htmlFor="roster-paste" className="flex items-center gap-2 text-xs text-zinc-400">
        <ClipboardPaste size={14} />
        Cole a lista do Excel, Sheets ou digite uma linha por atleta
      </label>

      <textarea
        id="roster-paste"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          onDraftChange?.();
        }}
        disabled={disabled}
        rows={7}
        spellCheck={false}
        placeholder={'Nome\tNúmero\tPosição\n1\tRicardo Alves\tGoleiro\n7\tRafael Souza\tAla\n9\tThiago Barros\tPivô'}
        className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm
                   font-mono placeholder:text-zinc-700 outline-none transition-colors
                   focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/40 resize-y"
      />

      {result.overflowCount > 0 && (
        <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="text-xs text-amber-100 leading-relaxed">
            Limite de {ROSTER_PASTE_LIMIT} atletas por colagem. {result.overflowCount}{' '}
            {result.overflowCount === 1 ? 'linha a mais fica de fora' : 'linhas a mais ficam de fora'} — elas
            aparecem na prévia e não serão salvas.
          </p>
        </div>
      )}

      {result.lines.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              {ready.length} pronto{ready.length === 1 ? '' : 's'}
              {blocking.length > 0 ? ` · ${blocking.length} com erro` : ''}
              {warningCount > 0 ? ` · ${warningCount} aviso${warningCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-900">
            {result.lines.map((player) => {
              const serverMessage = serverErrors?.[player.lineNumber];
              const hasError = player.errors.length > 0 || Boolean(serverMessage);
              return (
              <div
                key={player.lineNumber}
                className={hasError ? 'bg-red-500/[0.06]' : undefined}
              >
                <div className="px-4 py-2 flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 font-mono text-[10px] text-zinc-600">L{player.lineNumber}</span>
                  <span className="w-8 shrink-0 font-mono text-[#00f0ff] text-xs">
                    {player.number != null ? `#${player.number}` : '—'}
                  </span>
                  <span className="flex-1 text-zinc-200 truncate">{player.name || 'Sem nome'}</span>
                  <span className="text-[11px] text-zinc-500 shrink-0">{player.position ?? 'sem posição'}</span>
                </div>
                {(hasError || player.warnings.length > 0) && (
                  <div className="px-4 pb-2 space-y-0.5">
                    {player.errors.map((message, index) => (
                      <p key={`e-${player.lineNumber}-${index}`} className="text-[11px] text-red-300 leading-relaxed">
                        {message}
                      </p>
                    ))}
                    {serverMessage && (
                      <p className="text-[11px] text-red-300 leading-relaxed">{serverMessage}</p>
                    )}
                    {player.warnings.map((message, index) => (
                      <p key={`w-${player.lineNumber}-${index}`} className="text-[11px] text-amber-200/80 leading-relaxed">
                        {message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onParsed(ready)}
        disabled={disabled || ready.length === 0 || blocking.length > 0}
        className="w-full bg-[#00f0ff] hover:bg-[#00d4e6] disabled:bg-zinc-800 disabled:text-zinc-500
                   text-black font-bold text-sm uppercase tracking-wide rounded-xl py-3 transition-colors"
      >
        {ready.length > 0 && blocking.length === 0
          ? `Adicionar ${ready.length} atleta${ready.length === 1 ? '' : 's'}`
          : blocking.length > 0
            ? 'Corrija os erros para adicionar'
            : 'Cole a lista acima'}
      </button>

      {blocking.length > 0 && ready.length > 0 && (
        <button
          type="button"
          onClick={() => onParsed(ready)}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 border border-amber-500/40 text-amber-100
                     hover:bg-amber-500/10 disabled:opacity-50 text-xs font-semibold rounded-xl py-3 transition-colors"
        >
          <AlertTriangle size={14} />
          Ignorar {blocking.length} {blocking.length === 1 ? 'linha com erro' : 'linhas com erro'} e adicionar{' '}
          {ready.length}
        </button>
      )}
    </div>
  );
};

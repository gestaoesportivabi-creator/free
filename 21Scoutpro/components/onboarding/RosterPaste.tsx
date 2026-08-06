import React, { useMemo, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

/**
 * Colagem de elenco a partir de planilha.
 *
 * Quase todo treinador já tem a lista do elenco num Excel ou Sheets. Obrigá-lo a
 * digitar atleta por atleta no primeiro acesso é a forma mais rápida de perder
 * um teste. Aceitar um colar resolve o passo em segundos.
 */

export interface ParsedPlayer {
  numero: number | null;
  nome: string;
  funcao: string | null;
}

const POSITION_ALIASES: Record<string, string> = {
  goleiro: 'Goleiro', gol: 'Goleiro', gk: 'Goleiro', g: 'Goleiro',
  fixo: 'Fixo', zagueiro: 'Fixo', defensor: 'Fixo',
  ala: 'Ala', alaesquerda: 'Ala', aladireita: 'Ala', lateral: 'Ala',
  pivo: 'Pivô', 'pivô': 'Pivô', atacante: 'Pivô',
  universal: 'Universal',
};

function normalizePosition(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/[\s_-]/g, '');
  if (!key) return null;
  return POSITION_ALIASES[key] ?? (raw.trim() ? raw.trim().slice(0, 30) : null);
}

/** Separa "7 Rafael Souza" em número + nome; devolve o nome inteiro se não houver número. */
function splitLeadingNumber(cell: string, funcao: string | null): ParsedPlayer | null {
  const value = cell.trim();
  if (!value) return null;

  const match = value.match(/^(\d{1,3})[\s.\-]+(.+)$/);
  if (match) return { numero: parseInt(match[1], 10), nome: match[2].trim(), funcao };

  return { numero: null, nome: value, funcao };
}

/**
 * Parser tolerante: aceita tab (Excel), vírgula, ponto-e-vírgula ou espaços
 * múltiplos como separador, e detecta o número da camisa em qualquer coluna —
 * inclusive quando vem colado ao nome ("7 Rafael Souza").
 */
export function parseRoster(input: string): ParsedPlayer[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line
        .split(/\t|;|,|\s{2,}/)
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (cells.length === 0) return null;

      // Uma célula só: pode ser "10 João Silva" ou apenas "João Silva".
      if (cells.length === 1) {
        return splitLeadingNumber(cells[0], null);
      }

      const numberIndex = cells.findIndex((cell) => /^\d{1,3}$/.test(cell));
      const rest = numberIndex >= 0 ? cells.filter((_, index) => index !== numberIndex) : cells;
      const funcao = rest[1] ? normalizePosition(rest[1]) : null;

      if (numberIndex >= 0) {
        const nome = rest[0] ?? '';
        return nome ? { numero: parseInt(cells[numberIndex], 10), nome, funcao } : null;
      }

      // Sem célula puramente numérica: o número pode estar colado ao nome,
      // como em "7 Rafael Souza, Ala" — formato comum ao colar de planilha.
      return splitLeadingNumber(rest[0] ?? '', funcao);
    })
    .filter((entry): entry is ParsedPlayer => entry !== null)
    .slice(0, 60);
}

interface RosterPasteProps {
  onParsed: (players: ParsedPlayer[]) => void;
  disabled?: boolean;
}

export const RosterPaste: React.FC<RosterPasteProps> = ({ onParsed, disabled }) => {
  const [raw, setRaw] = useState('');

  const parsed = useMemo(() => parseRoster(raw), [raw]);

  return (
    <div className="space-y-3">
      <label htmlFor="roster-paste" className="flex items-center gap-2 text-xs text-zinc-400">
        <ClipboardPaste size={14} />
        Cole a lista do Excel, Sheets ou digite uma linha por atleta
      </label>

      <textarea
        id="roster-paste"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        disabled={disabled}
        rows={7}
        spellCheck={false}
        placeholder={'1\tRicardo Alves\tGoleiro\n7\tRafael Souza\tAla\n9\tThiago Barros\tPivô'}
        className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm
                   font-mono placeholder:text-zinc-700 outline-none transition-colors
                   focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/40 resize-y"
      />

      {parsed.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              {parsed.length} atleta{parsed.length === 1 ? '' : 's'} reconhecido{parsed.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="max-h-44 overflow-y-auto divide-y divide-zinc-900">
            {parsed.map((player, index) => (
              <div key={index} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 font-mono text-[#00f0ff] text-xs">
                  {player.numero != null ? `#${player.numero}` : '—'}
                </span>
                <span className="flex-1 text-zinc-200 truncate">{player.nome}</span>
                <span className="text-[11px] text-zinc-500 shrink-0">{player.funcao ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onParsed(parsed)}
        disabled={disabled || parsed.length === 0}
        className="w-full bg-[#00f0ff] hover:bg-[#00d4e6] disabled:bg-zinc-800 disabled:text-zinc-500
                   text-black font-bold text-sm uppercase tracking-wide rounded-xl py-3 transition-colors"
      >
        {parsed.length > 0 ? `Adicionar ${parsed.length} atleta${parsed.length === 1 ? '' : 's'}` : 'Cole a lista acima'}
      </button>
    </div>
  );
};

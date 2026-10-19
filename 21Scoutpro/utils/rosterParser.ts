import type { Player, Position } from '../types';

/**
 * Colagem de elenco (Excel / Sheets → wizard).
 * Puro: sem DOM, sem API. O wizard só grava o que este módulo aceitar.
 */

export const ROSTER_PASTE_LIMIT = 60;

export const ROSTER_NAME_ERROR = 'Informe o nome do atleta.';
export const ROSTER_NUMBER_WARNING = 'Sem número de camisa.';
export const ROSTER_POSITION_WARNING = 'Sem posição.';

export function rosterLimitMessage(): string {
  return `Limite de ${ROSTER_PASTE_LIMIT} atletas por colagem. Esta linha fica de fora.`;
}

export function rosterPositionError(raw: string): string {
  return `Posição "${raw.trim()}" não reconhecida. Use Goleiro, Fixo, Ala ou Pivô.`;
}

export function rosterDuplicateError(jersey: number): string {
  return `Número ${jersey} repetido na lista.`;
}

export function rosterExistingNumberError(jersey: number): string {
  return `Número ${jersey} já está no elenco.`;
}

export type RosterSeparator = 'tab' | 'semicolon' | 'comma' | 'spaces' | 'none';

export interface RosterLine {
  /** Linha original no texto colado (1 = primeira). */
  lineNumber: number;
  name: string;
  number: number | null;
  position: Position | null;
  errors: string[];
  warnings: string[];
  /** Passou de ROSTER_PASTE_LIMIT. Não entra no salvamento. */
  overLimit: boolean;
}

export interface RosterParseResult {
  lines: RosterLine[];
  separator: RosterSeparator;
  overflowCount: number;
  /** Erro em linha que ainda cabe no limite — bloqueia salvar até o usuário ignorar. */
  hasBlockingErrors: boolean;
}

export interface ParseRosterOptions {
  /** Números já usados no elenco que está na tela. */
  existingNumbers?: Iterable<number | null | undefined>;
}

const POSITION_ALIASES: Record<string, Position> = {
  goleiro: 'Goleiro',
  gol: 'Goleiro',
  gk: 'Goleiro',
  g: 'Goleiro',
  fixo: 'Fixo',
  fix: 'Fixo',
  zagueiro: 'Fixo',
  defensor: 'Fixo',
  ala: 'Ala',
  aladireita: 'Ala',
  alaesquerda: 'Ala',
  lateral: 'Ala',
  pivo: 'Pivô',
  piv: 'Pivô',
  atacante: 'Pivô',
};

/** Não existe no modelo (`Position`). Não pode cair em Ala. */
const INVALID_POSITION_ALIASES = new Set(['universal', 'uni']);

const NAME_SUFFIX = /^(jr|junior|filho|neto|sobrinho|ii|iii|iv)$/i;

type ColumnRole = 'name' | 'number' | 'position';

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

function normalizeToken(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function positionKind(raw: string): 'empty' | 'valid' | 'invalid' | 'unknown' {
  const key = normalizeToken(raw);
  if (!key) return 'empty';
  if (POSITION_ALIASES[key]) return 'valid';
  if (INVALID_POSITION_ALIASES.has(key)) return 'invalid';
  return 'unknown';
}

function resolvePosition(raw: string): { position: Position | null; error: string | null } {
  const kind = positionKind(raw);
  if (kind === 'empty') return { position: null, error: null };
  if (kind === 'valid') {
    return { position: POSITION_ALIASES[normalizeToken(raw)], error: null };
  }
  return { position: null, error: rosterPositionError(raw) };
}

function isHeaderCell(cell: string): boolean {
  const key = normalizeToken(cell);
  if (!key) return false;
  if (key === 'n' || key === 'no' || key === 'num' || key === 'nro') return true;
  if (
    key === 'nome' ||
    key === 'name' ||
    key === 'atleta' ||
    key === 'jogador' ||
    key === 'player' ||
    key === 'numero' ||
    key === 'number' ||
    key === 'jersey' ||
    key === 'camisa' ||
    key === 'posicao' ||
    key === 'position' ||
    key === 'funcao' ||
    key === 'role'
  ) {
    return true;
  }
  return (
    key.startsWith('nome') ||
    key.startsWith('numero') ||
    key.startsWith('posicao') ||
    key.startsWith('camisa') ||
    key.startsWith('funcao') ||
    key.startsWith('jersey')
  );
}

function headerRole(cell: string): ColumnRole | null {
  const key = normalizeToken(cell);
  if (!key) return null;
  if (key.startsWith('posicao') || key.startsWith('funcao') || key === 'position' || key === 'role') {
    return 'position';
  }
  if (
    key.startsWith('numero') ||
    key.startsWith('camisa') ||
    key.startsWith('jersey') ||
    key === 'n' ||
    key === 'no' ||
    key === 'num' ||
    key === 'nro' ||
    key === 'number'
  ) {
    return 'number';
  }
  if (key.startsWith('nome') || key === 'name' || key === 'atleta' || key === 'jogador' || key === 'player') {
    return 'name';
  }
  return null;
}

function isHeaderLine(cells: string[]): boolean {
  const filled = cells.map((cell) => cell.trim()).filter(Boolean);
  if (filled.length === 0) return false;
  if (filled.some((cell) => /^\d{1,3}$/.test(cell))) return false;
  if (filled.some((cell) => positionKind(cell) === 'valid' || positionKind(cell) === 'invalid')) return false;
  if (!filled.every(isHeaderCell)) return false;
  if (filled.length === 1 && normalizeToken(filled[0]).length < 3) return false;
  return true;
}

function splitComma(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function commaIsTabular(lines: string[]): boolean {
  if (!lines.some((line) => line.includes(','))) return false;
  const rows = lines.map(splitComma);
  const suffixOnly = rows.every((cells) => {
    const filled = cells.map((cell) => cell.trim()).filter(Boolean);
    if (filled.length <= 1) return true;
    if (filled.length === 2 && NAME_SUFFIX.test(filled[1].replace(/\./g, ''))) return true;
    return false;
  });
  if (suffixOnly) return false;

  let signals = 0;
  let considered = 0;
  for (const cells of rows) {
    const filled = cells.map((cell) => cell.trim()).filter(Boolean);
    if (filled.length === 0) continue;
    considered += 1;
    const hasNumber = filled.some((cell) => /^\d{1,3}$/.test(cell));
    const hasPosition = filled.some((cell) => {
      const kind = positionKind(cell);
      return kind === 'valid' || kind === 'invalid';
    });
    if ((hasNumber || hasPosition) && filled.length >= 2) signals += 1;
  }
  return considered > 0 && signals >= Math.ceil(considered / 2);
}

function detectSeparator(lines: string[]): RosterSeparator {
  if (lines.some((line) => line.includes('\t'))) return 'tab';
  if (lines.some((line) => line.includes(';'))) return 'semicolon';
  if (commaIsTabular(lines)) return 'comma';
  if (lines.some((line) => /\s{2,}/.test(line))) return 'spaces';
  return 'none';
}

function splitBy(line: string, separator: RosterSeparator): string[] {
  if (separator === 'tab') return line.split('\t').map((cell) => cell.trim());
  if (separator === 'semicolon') return line.split(';').map((cell) => cell.trim());
  if (separator === 'comma') return splitComma(line);
  if (separator === 'spaces') {
    return line
      .trim()
      .split(/\s{2,}/)
      .map((cell) => cell.trim())
      .filter(Boolean);
  }
  const trimmed = line.trim();
  return trimmed ? [trimmed] : [];
}

/** Se a linha não trouxe o separador do bloco, ainda aceita colunas alinhadas por espaços. */
function splitLine(line: string, separator: RosterSeparator): string[] {
  const primary = splitBy(line, separator);
  const filled = primary.map((cell) => cell.trim()).filter(Boolean);
  if (separator !== 'spaces' && separator !== 'none' && filled.length <= 1 && /\s{2,}/.test(line)) {
    return splitBy(line, 'spaces');
  }
  return primary;
}

function joinName(parts: string[]): string {
  const out: string[] = [];
  for (const part of parts) {
    const clean = collapseSpaces(part);
    if (!clean) continue;
    const suffixKey = clean.replace(/\./g, '');
    if (out.length > 0 && NAME_SUFFIX.test(suffixKey)) {
      out[out.length - 1] = `${out[out.length - 1]}, ${clean}`;
    } else {
      out.push(clean);
    }
  }
  return collapseSpaces(out.join(' '));
}

function splitLeadingNumber(cell: string): { number: number | null; name: string } {
  const value = collapseSpaces(cell);
  if (/^\d{1,3}$/.test(value)) {
    return { number: parseInt(value, 10), name: '' };
  }
  const match = value.match(/^(\d{1,3})[\s.\-]+(.+)$/);
  if (match) {
    return { number: parseInt(match[1], 10), name: collapseSpaces(match[2]) };
  }
  return { number: null, name: value };
}

function parseWithRoles(
  cells: string[],
  roles: Array<ColumnRole | null>,
): { name: string; number: number | null; positionRaw: string | null } {
  const names: string[] = [];
  let number: number | null = null;
  let positionRaw: string | null = null;

  cells.forEach((cell, index) => {
    const value = cell.trim();
    const role = roles[index] ?? null;
    if (role === 'number') {
      if (/^\d{1,3}$/.test(value)) number = parseInt(value, 10);
      return;
    }
    if (role === 'position') {
      if (value) positionRaw = value;
      return;
    }
    if (role === 'name') {
      if (value) names.push(value);
      return;
    }
    if (!value) return;
    if (number == null && /^\d{1,3}$/.test(value)) {
      number = parseInt(value, 10);
      return;
    }
    names.push(value);
  });

  let name = joinName(names);
  if (number == null) {
    const split = splitLeadingNumber(name);
    if (split.number != null && split.name) {
      number = split.number;
      name = split.name;
    }
  }
  return { name, number, positionRaw };
}

function parseCells(cells: string[]): { name: string; number: number | null; positionRaw: string | null } {
  const compact = cells.map((cell) => cell.trim()).filter(Boolean);
  if (compact.length === 0) return { name: '', number: null, positionRaw: null };

  if (compact.length === 1) {
    const split = splitLeadingNumber(compact[0]);
    return { name: split.name, number: split.number, positionRaw: null };
  }

  let number: number | null = null;
  const numberIdx = compact.findIndex((cell) => /^\d{1,3}$/.test(cell));
  if (numberIdx >= 0) number = parseInt(compact[numberIdx], 10);
  const rest = compact.filter((_, index) => index !== numberIdx);

  let posIdx = -1;
  for (let index = 0; index < rest.length; index += 1) {
    const kind = positionKind(rest[index]);
    if (kind === 'valid' || kind === 'invalid') posIdx = index;
  }

  if (posIdx === -1 && rest.length >= 2) {
    const last = rest[rest.length - 1];
    const nameCandidate = rest.slice(0, -1).join(' ');
    const lastIsSingle = !last.includes(' ');
    const nameLooksLikeName = nameCandidate.includes(' ') || number != null;
    if (lastIsSingle && nameLooksLikeName) posIdx = rest.length - 1;
  }

  let positionRaw: string | null = null;
  let nameParts = rest;
  if (posIdx >= 0) {
    positionRaw = rest[posIdx];
    nameParts = rest.filter((_, index) => index !== posIdx);
  }

  let name = joinName(nameParts);
  if (number == null) {
    const split = splitLeadingNumber(name);
    if (split.number != null && split.name) {
      number = split.number;
      name = split.name;
    }
  }
  return { name, number, positionRaw };
}

function collectExisting(numbers: Iterable<number | null | undefined> | undefined): Set<number> {
  const existing = new Set<number>();
  if (!numbers) return existing;
  for (const value of numbers) {
    if (typeof value === 'number' && Number.isFinite(value)) existing.add(value);
  }
  return existing;
}

export function parseRoster(input: string, options?: ParseRosterOptions): RosterParseResult {
  const text = input.replace(/^\uFEFF/, '');
  const rawLines = text.split(/\r?\n/);
  const nonEmpty = rawLines
    .map((line, index) => ({ lineNumber: index + 1, text: line }))
    .filter((line) => line.text.trim().length > 0);

  const separator = detectSeparator(nonEmpty.map((line) => line.text));
  const existing = collectExisting(options?.existingNumbers);

  let roles: Array<ColumnRole | null> | null = null;
  let start = 0;
  if (nonEmpty.length > 0) {
    const firstCells = splitLine(nonEmpty[0].text, separator);
    if (isHeaderLine(firstCells)) {
      roles = firstCells.map(headerRole);
      start = 1;
    }
  }

  const data = nonEmpty.slice(start);
  const overflowCount = Math.max(0, data.length - ROSTER_PASTE_LIMIT);
  const limitMessage = rosterLimitMessage();

  const lines: RosterLine[] = data.map((row, index) => {
    const cells = splitLine(row.text, separator);
    const parsed = roles ? parseWithRoles(cells, roles) : parseCells(cells);
    const overLimit = index >= ROSTER_PASTE_LIMIT;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parsed.name) errors.push(ROSTER_NAME_ERROR);

    let position: Position | null = null;
    if (parsed.positionRaw) {
      const resolved = resolvePosition(parsed.positionRaw);
      position = resolved.position;
      if (resolved.error) errors.push(resolved.error);
    } else {
      warnings.push(ROSTER_POSITION_WARNING);
    }

    if (parsed.number == null) warnings.push(ROSTER_NUMBER_WARNING);
    if (overLimit) errors.push(limitMessage);

    return {
      lineNumber: row.lineNumber,
      name: parsed.name,
      number: parsed.number,
      position,
      errors,
      warnings,
      overLimit,
    };
  });

  const counts = new Map<number, number>();
  for (const line of lines) {
    if (line.overLimit || line.number == null) continue;
    counts.set(line.number, (counts.get(line.number) ?? 0) + 1);
  }
  for (const line of lines) {
    if (line.number == null) continue;
    if (!line.overLimit && (counts.get(line.number) ?? 0) > 1) {
      line.errors.push(rosterDuplicateError(line.number));
    }
    if (existing.has(line.number)) {
      line.errors.push(rosterExistingNumberError(line.number));
    }
  }

  return {
    lines,
    separator,
    overflowCount,
    hasBlockingErrors: lines.some((line) => !line.overLimit && line.errors.length > 0),
  };
}

/** Linhas que podem ser gravadas: dentro do limite e sem erro. */
export function savableRosterLines(lines: RosterLine[]): RosterLine[] {
  return lines.filter((line) => !line.overLimit && line.errors.length === 0 && line.name.trim().length > 0);
}

/** Erros que bloqueiam o botão principal (não inclui o corte do limite). */
export function blockingRosterLines(lines: RosterLine[]): RosterLine[] {
  return lines.filter((line) => !line.overLimit && line.errors.length > 0);
}

export interface RosterPlayerDraft {
  id: string;
  name: string;
  nickname: string;
  position?: Position;
  jerseyNumber?: number;
  dominantFoot: Player['dominantFoot'];
  age: number;
  height: number;
}

/** Payload do create. Sem número não vira 0. Sem posição não vira Ala. */
export function toRosterPlayer(entry: {
  name: string;
  number: number | null;
  position: Position | null;
}): RosterPlayerDraft {
  const name = collapseSpaces(entry.name);
  return {
    id: '',
    name,
    nickname: name.split(' ')[0] || name,
    ...(entry.position ? { position: entry.position } : {}),
    ...(entry.number != null ? { jerseyNumber: entry.number } : {}),
    dominantFoot: 'Destro',
    age: 0,
    height: 0,
  };
}

export function rosterAthleteKey(name: string, number: number | null, occurrence = 0): string {
  const base = `${collapseSpaces(name).toLowerCase()}#${number ?? ''}`;
  return occurrence === 0 ? base : `${base}~${occurrence}`;
}

export function planRosterSave<T extends { name: string; number: number | null }>(
  players: T[],
  savedKeys: ReadonlySet<string>,
): { keys: string[]; pending: T[]; alreadySaved: number } {
  const seen = new Map<string, number>();
  const keys = players.map((player) => {
    const base = rosterAthleteKey(player.name, player.number);
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return rosterAthleteKey(player.name, player.number, occurrence);
  });
  const pending = players.filter((_, index) => !savedKeys.has(keys[index]));
  return { keys, pending, alreadySaved: players.length - pending.length };
}

export function rosterSaveFailureMessage(saved: number, total: number): string {
  if (saved <= 0) {
    return 'Não foi possível salvar o elenco. Nenhum atleta foi gravado. Você pode tentar de novo ou adicionar pelo menu Elenco.';
  }
  return `Salvamos ${saved} de ${total} atletas. Quem já entrou fica salvo — tentar de novo não duplica esses.`;
}

export interface RosterSaveItem {
  name: string;
  number: number | null;
  lineNumber?: number;
}

export type RosterSaveResult =
  | { ok: true; saved: number; total: number }
  | {
      ok: false;
      saved: number;
      total: number;
      message: string;
      cause: string;
      failedLineNumber?: number;
    };

/**
 * Grava em sequência. A chave nome+número fica no set só depois do create resolver,
 * então um retry não repete quem já entrou nesta sessão.
 */
export async function runRosterSave<T extends RosterSaveItem>(options: {
  items: T[];
  savedKeys: Set<string>;
  create: (item: T) => Promise<void>;
  onProgress?: (saved: number, total: number) => void;
}): Promise<RosterSaveResult> {
  const total = options.items.length;
  if (total === 0) return { ok: true, saved: 0, total: 0 };

  const plan = planRosterSave(options.items, options.savedKeys);
  if (plan.pending.length === 0) return { ok: true, saved: total, total };

  let saved = plan.alreadySaved;
  options.onProgress?.(saved, total);

  try {
    for (let index = 0; index < options.items.length; index += 1) {
      const key = plan.keys[index];
      if (options.savedKeys.has(key)) continue;
      await options.create(options.items[index]);
      options.savedKeys.add(key);
      saved += 1;
      options.onProgress?.(saved, total);
    }
    return { ok: true, saved, total };
  } catch (error) {
    const cause = error instanceof Error && error.message.trim()
      ? error.message.trim()
      : 'Não foi possível salvar o atleta.';
    const failedIndex = options.items.findIndex((_, index) => !options.savedKeys.has(plan.keys[index]));
    const failedLineNumber = failedIndex >= 0 ? options.items[failedIndex].lineNumber : undefined;
    return {
      ok: false,
      saved,
      total,
      message: rosterSaveFailureMessage(saved, total),
      cause,
      failedLineNumber,
    };
  }
}

import { prepSquadIdsFromLineup } from './startingLineupDraft';

/** F5 de uma coleta ainda não confirmada volta para a Preparação desta partida. */
export const OPEN_PREP_KEY = 'scout21_open_prep';

/**
 * Intenção da ação "Iniciar Scout da Partida" / "Confirmar e Iniciar".
 * A leitura não apaga a marca: uma segunda avaliação do efeito não devolve a Preparação.
 * Sai só quando a pessoa deixa a coleta.
 */
export const REALTIME_FRESH_KEY = 'scout21_realtime_fresh';

const COURT_LIMIT = 5;

const TEAM_STAT_KEYS = [
  'goals',
  'assists',
  'passesCorrect',
  'passesWrong',
  'shotsOnTarget',
  'shotsOffTarget',
  'tacklesWithBall',
  'tacklesWithoutBall',
  'tacklesCounterAttack',
  'transitionErrors',
] as const;

export interface PrepReopenLineup {
  players?: readonly string[];
  bench?: readonly string[];
  selectedPlayerIds?: readonly string[];
  ballPossessionStart?: string;
  clockSnapshot?: { state?: string } | null;
}

/** Forma mínima, compatível com MatchRecord. Não exige o placar. */
export interface PrepReopenMatch {
  status?: string;
  postMatchEventLog?: readonly unknown[] | null;
  postMatchEventCount?: number;
  teamStats?: object | null;
  playerStats?: object | null;
  lineup?: PrepReopenLineup | null;
}

export interface OpenPrepRequest {
  matchId?: string;
  agendaMatchId?: string;
}

export interface DefaultLineupAthlete {
  id: string;
  position?: string;
  jerseyNumber?: number | null;
  name?: string;
}

function uniqueIds(ids: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function eventCountOf(match: PrepReopenMatch): number {
  if (Array.isArray(match.postMatchEventLog)) return match.postMatchEventLog.length;
  return match.postMatchEventCount ?? 0;
}

function asRecord(value: object | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function hasCollectedNumbers(match: PrepReopenMatch): boolean {
  const team = asRecord(match.teamStats);
  if (team && TEAM_STAT_KEYS.some((key) => Number(team[key] ?? 0) > 0)) return true;
  const players = asRecord(match.playerStats);
  if (!players) return false;
  for (const row of Object.values(players)) {
    if (!row || typeof row !== 'object') continue;
    for (const value of Object.values(row as Record<string, unknown>)) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) return true;
    }
  }
  return false;
}

/**
 * A coleta já foi confirmada: relógio de verdade, 5 titulares com posse,
 * fita, placar/estatística ou partida encerrada.
 * Relógio PRE_JOGO não conta. `em_andamento` sem esses sinais também não.
 */
export function lineupConfirmed(match: PrepReopenMatch | null | undefined): boolean {
  if (!match) return false;
  if (match.status === 'encerrado') return true;
  if (eventCountOf(match) > 0) return true;
  if (hasCollectedNumbers(match)) return true;
  const lineup = match.lineup;
  const clockState = lineup?.clockSnapshot?.state;
  if (clockState && clockState !== 'PRE_JOGO') return true;
  const players = uniqueIds([...(lineup?.players ?? [])]);
  return players.length === COURT_LIMIT && Boolean(lineup?.ballPossessionStart);
}

/** Para onde a reabertura do calendário deve ir. */
export function prepReopenTarget(
  match: PrepReopenMatch | null | undefined
): 'selector' | 'preparation' | 'collection' {
  if (!match) return 'selector';
  if (lineupConfirmed(match)) return 'collection';
  if (prepSquadIdsFromLineup(match.lineup).length > 0) return 'preparation';
  return 'selector';
}

/**
 * Tabela de Campeonato → Preparação.
 * Sem coleta, ou só com convocação, abre. Encerrada ou já confirmada não abre.
 * Não substitui o início explícito: esse continua na coleta.
 */
export function agendaCanOpenPreparation(
  match: PrepReopenMatch | null | undefined
): boolean {
  return prepReopenTarget(match) !== 'collection';
}

/**
 * Iniciar de propósito fica na coleta, mesmo com relógio PRE_JOGO e zero eventos.
 * Sem essa intenção, a reabertura de uma convocação pura volta para a Preparação.
 */
export function realtimeEntryDecision(
  match: PrepReopenMatch | null | undefined,
  explicitStart: boolean
): 'collection' | 'preparation' {
  if (explicitStart) return 'collection';
  return prepReopenTarget(match) === 'preparation' ? 'preparation' : 'collection';
}

/** A página de coleta só volta para a Preparação quando a decisão é preparation. */
export function shouldReturnUnconfirmedRealtimeToPrep(
  match: PrepReopenMatch | null | undefined,
  explicitStart: boolean
): boolean {
  return realtimeEntryDecision(match, explicitStart) === 'preparation';
}

/** Payload gravado por Iniciar/Confirmar, ou a marca da mesma aba. Qualquer um basta. */
export function isExplicitScoutStart(payload: { explicitStart?: boolean } | null | undefined): boolean {
  return payload?.explicitStart === true || hasExplicitScoutStart();
}

function byJerseyThenName(a: DefaultLineupAthlete, b: DefaultLineupAthlete): number {
  const jerseyA = Number(a.jerseyNumber) || 999;
  const jerseyB = Number(b.jerseyNumber) || 999;
  if (jerseyA !== jerseyB) return jerseyA - jerseyB;
  return (a.name || '').localeCompare(b.name || '', 'pt-BR');
}

/**
 * Padrão 1+4. O pool é só a convocação (ou quem já está no modal).
 * Não entra atleta de fora dessa lista. Ordem: camisa, depois nome.
 * Sem 1 goleiro e 4 de linha, devolve null e a escalação não muda.
 */
export function pickDefaultLineup(
  pool: DefaultLineupAthlete[]
): { court: string[]; bench: string[] } | null {
  const athletes: DefaultLineupAthlete[] = [];
  const seen = new Set<string>();
  for (const athlete of pool) {
    const id = String(athlete?.id ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    athletes.push({ ...athlete, id });
  }
  const goalkeeper = athletes.filter((athlete) => athlete.position === 'Goleiro').sort(byJerseyThenName)[0];
  const outfield = athletes
    .filter((athlete) => athlete.position !== 'Goleiro' && athlete.id !== goalkeeper?.id)
    .sort(byJerseyThenName)
    .slice(0, 4);
  if (!goalkeeper || outfield.length < 4) return null;
  const court = [goalkeeper.id, ...outfield.map((athlete) => athlete.id)];
  const courtSet = new Set(court);
  return {
    court,
    bench: athletes.map((athlete) => athlete.id).filter((id) => !courtSet.has(id)),
  };
}

/** Quadra = no máximo 5 titulares. O restante da lista fica no banco. */
export function splitCourtAndBench(input: {
  players?: string[];
  bench?: string[];
  selectedPlayerIds?: string[];
}): { court: string[]; bench: string[] } {
  const listed = uniqueIds(input.players ?? []);
  const court = listed.slice(0, COURT_LIMIT);
  const courtSet = new Set(court);
  const bench = uniqueIds([
    ...listed.slice(COURT_LIMIT),
    ...(input.bench ?? []),
    ...(input.selectedPlayerIds ?? []),
  ]).filter((id) => !courtSet.has(id));
  return { court, bench };
}

/**
 * Banco do modal antes do apito. Convocação gravada não vira o elenco inteiro.
 * Sem convocação, o modal continua oferecendo o elenco do clube.
 */
export function benchForLineupModal(input: {
  selectedPlayerIds?: string[];
  lineup?: PrepReopenLineup | null;
  rosterIds: string[];
}): string[] {
  const court = new Set(uniqueIds([...(input.lineup?.players ?? [])]).slice(0, COURT_LIMIT));
  const fromProp = uniqueIds([...(input.selectedPlayerIds ?? [])]);
  const fromLineup = uniqueIds([...(input.lineup?.selectedPlayerIds ?? [])]);
  const convocation = fromProp.length > 0 ? fromProp : fromLineup;
  if (convocation.length > 0) return convocation.filter((id) => !court.has(id));
  const savedBench = uniqueIds([...(input.lineup?.bench ?? [])]).filter((id) => !court.has(id));
  if (savedBench.length > 0) return savedBench;
  return uniqueIds(input.rosterIds);
}

export function stashOpenPrep(request: OpenPrepRequest): void {
  const matchId = String(request.matchId || '').trim();
  const agendaMatchId = String(request.agendaMatchId || '').trim();
  if (!matchId && !agendaMatchId) return;
  try {
    localStorage.setItem(
      OPEN_PREP_KEY,
      JSON.stringify({
        ...(matchId ? { matchId } : {}),
        ...(agendaMatchId ? { agendaMatchId } : {}),
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekOpenPrep(): OpenPrepRequest | null {
  try {
    const raw = localStorage.getItem(OPEN_PREP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OpenPrepRequest;
    const matchId = String(parsed?.matchId || '').trim();
    const agendaMatchId = String(parsed?.agendaMatchId || '').trim();
    if (!matchId && !agendaMatchId) return null;
    return {
      ...(matchId ? { matchId } : {}),
      ...(agendaMatchId ? { agendaMatchId } : {}),
    };
  } catch {
    return null;
  }
}

export function consumeOpenPrep(): OpenPrepRequest | null {
  const pending = peekOpenPrep();
  if (!pending) return null;
  try {
    localStorage.removeItem(OPEN_PREP_KEY);
  } catch {
    /* ignore */
  }
  return pending;
}

export function markExplicitScoutStart(): void {
  try {
    sessionStorage.setItem(REALTIME_FRESH_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Não remove a chave. A segunda leitura do efeito de carga continua vendo a intenção. */
export function hasExplicitScoutStart(): boolean {
  try {
    return sessionStorage.getItem(REALTIME_FRESH_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearExplicitScoutStart(): void {
  try {
    sessionStorage.removeItem(REALTIME_FRESH_KEY);
  } catch {
    /* ignore */
  }
}

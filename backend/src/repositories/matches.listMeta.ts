/**
 * Metadados da listagem de partidas, sem carregar post_match_event_log.
 * Uma query junta status, contagem de lances, métodos e tempos de gol (sem o log).
 */

const GOAL_TIME_LOG = `CASE
              WHEN jsonb_typeof(j.post_match_event_log) = 'array' THEN j.post_match_event_log
              ELSE '[]'::jsonb
            END`;

/** Tempo no formato que o gráfico já lê: "03:00 (1T)". Não devolve o log. */
const GOAL_TIME_ENTRIES_SQL = (conceded: boolean) => `(
              SELECT COALESCE(
                jsonb_agg(
                  jsonb_strip_nulls(
                    jsonb_build_object(
                      'time', btrim(elem->>'time') || ' (' || COALESCE(NULLIF(btrim(elem->>'period'), ''), '1T') || ')',
                      'method', NULLIF(btrim(COALESCE(elem->>'goalMethod', '')), '')
                    )
                  )
                  ORDER BY ord
                ),
                '[]'::jsonb
              )
              FROM jsonb_array_elements(${GOAL_TIME_LOG}) WITH ORDINALITY AS goal_src(elem, ord)
              WHERE elem->>'action' = 'goal'
                AND btrim(COALESCE(elem->>'time', '')) <> ''
                AND ${conceded ? '' : 'NOT '}(
                  lower(COALESCE(elem->>'isOpponentGoal', '')) IN ('true', 't', '1')
                  OR COALESCE(elem->>'subtipo', '') = 'Contra'
                )
            )`;

export const LIST_MATCH_META_SQL = `SELECT j.id,
            j.status,
            CASE
              WHEN j.post_match_event_log IS NULL THEN 0
              WHEN jsonb_typeof(j.post_match_event_log) = 'array' THEN jsonb_array_length(j.post_match_event_log)
              ELSE 0
            END::int AS event_count,
            e.metodo_gol,
            e.metodo_gol_tomado,
            ${GOAL_TIME_ENTRIES_SQL(false)} AS goal_times,
            ${GOAL_TIME_ENTRIES_SQL(true)} AS goals_conceded_times
     FROM jogos j
     LEFT JOIN jogos_estatisticas_equipe e ON e.jogo_id = j.id
     WHERE j.id = ANY($1::text[])
       AND j.equipe_id = ANY($2::text[])`;

export interface GoalTimeEntry {
  time: string;
  method?: string;
}

export interface ListMatchMetaRow {
  id: string;
  status: string | null;
  event_count: number | string | null;
  metodo_gol: string | null;
  metodo_gol_tomado: string | null;
  goal_times?: unknown;
  goals_conceded_times?: unknown;
}

export interface ListMatchMeta {
  status?: string;
  eventCount: number;
  metodoGol?: string;
  metodoGolTomado?: string;
  goalTimes: GoalTimeEntry[];
  goalsConcededTimes: GoalTimeEntry[];
}

export function normalizeGoalTimeEntries(raw: unknown): GoalTimeEntry[] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const entries: GoalTimeEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const time = String((item as { time?: unknown }).time ?? '').trim();
    if (!time) continue;
    const methodRaw = (item as { method?: unknown }).method;
    const method = typeof methodRaw === 'string' ? methodRaw.trim() : '';
    entries.push(method ? { time, method } : { time });
  }
  return entries;
}

export function listMatchMetaFromRows(rows: ListMatchMetaRow[]): Map<string, ListMatchMeta> {
  const map = new Map<string, ListMatchMeta>();
  for (const row of rows) {
    const eventCount = Number(row.event_count ?? 0);
    map.set(row.id, {
      status: row.status || undefined,
      eventCount: Number.isFinite(eventCount) ? eventCount : 0,
      metodoGol: row.metodo_gol || undefined,
      metodoGolTomado: row.metodo_gol_tomado || undefined,
      goalTimes: normalizeGoalTimeEntries(row.goal_times),
      goalsConcededTimes: normalizeGoalTimeEntries(row.goals_conceded_times),
    });
  }
  return map;
}

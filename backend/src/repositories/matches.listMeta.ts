/**
 * Metadados da listagem de partidas, sem carregar post_match_event_log.
 * Uma query junta status, contagem de lances e os dois métodos de gol.
 */

export const LIST_MATCH_META_SQL = `SELECT j.id,
            j.status,
            CASE
              WHEN j.post_match_event_log IS NULL THEN 0
              WHEN jsonb_typeof(j.post_match_event_log) = 'array' THEN jsonb_array_length(j.post_match_event_log)
              ELSE 0
            END::int AS event_count,
            e.metodo_gol,
            e.metodo_gol_tomado
     FROM jogos j
     LEFT JOIN jogos_estatisticas_equipe e ON e.jogo_id = j.id
     WHERE j.id = ANY($1::text[])
       AND j.equipe_id = ANY($2::text[])`;

export interface ListMatchMetaRow {
  id: string;
  status: string | null;
  event_count: number | string | null;
  metodo_gol: string | null;
  metodo_gol_tomado: string | null;
}

export interface ListMatchMeta {
  status?: string;
  eventCount: number;
  metodoGol?: string;
  metodoGolTomado?: string;
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
    });
  }
  return map;
}

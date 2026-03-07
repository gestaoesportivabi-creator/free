-- Migration 013: Enable Row Level Security (RLS) for multi-tenant isolation
-- Policies use session variables app.equipe_ids, app.tecnico_id, app.clube_id set by the backend per request.

-- ---------------------------------------------------------------------------
-- 1. Helper function: current_equipe_ids_array()
-- Returns uuid[] from session variable app.equipe_ids (comma-separated). Empty/null => no access.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_equipe_ids_array()
RETURNS uuid[] AS $$
DECLARE
  s text;
BEGIN
  s := current_setting('app.equipe_ids', true);
  IF s IS NULL OR trim(s) = '' THEN
    RETURN ARRAY[]::uuid[];
  END IF;
  RETURN (
    SELECT COALESCE(array_agg(trim(x)::uuid), ARRAY[]::uuid[])
    FROM unnest(string_to_array(trim(s), ',')) AS t(x)
    WHERE trim(x) <> ''
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN ARRAY[]::uuid[];
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on tenant-scoped tables
-- ---------------------------------------------------------------------------
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos_estatisticas_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos_estatisticas_jogador ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacoes_dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonatos_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_estatisticas ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Policies: equipes (tecnico_id or clube_id matches session)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_equipes_select ON equipes FOR SELECT USING (
  (NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid IS NOT NULL AND tecnico_id = NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid)
  OR
  (NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid IS NOT NULL AND clube_id = NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid)
);

CREATE POLICY rls_equipes_insert ON equipes FOR INSERT WITH CHECK (
  (NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid IS NOT NULL AND tecnico_id = NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid)
  OR
  (NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid IS NOT NULL AND clube_id = NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid)
);

CREATE POLICY rls_equipes_update ON equipes FOR UPDATE USING (
  (NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid IS NOT NULL AND tecnico_id = NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid)
  OR
  (NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid IS NOT NULL AND clube_id = NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid)
);

CREATE POLICY rls_equipes_delete ON equipes FOR DELETE USING (
  (NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid IS NOT NULL AND tecnico_id = NULLIF(trim(current_setting('app.tecnico_id', true)), '')::uuid)
  OR
  (NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid IS NOT NULL AND clube_id = NULLIF(trim(current_setting('app.clube_id', true)), '')::uuid)
);

-- ---------------------------------------------------------------------------
-- 4. Policies: equipes_jogadores (equipe_id in tenant's equipe_ids)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_equipes_jogadores_all ON equipes_jogadores FOR ALL USING (
  equipe_id = ANY(current_equipe_ids_array())
) WITH CHECK (
  equipe_id = ANY(current_equipe_ids_array())
);

-- ---------------------------------------------------------------------------
-- 5. Policies: jogos (equipe_id in tenant's equipe_ids)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_jogos_all ON jogos FOR ALL USING (
  equipe_id = ANY(current_equipe_ids_array())
) WITH CHECK (
  equipe_id = ANY(current_equipe_ids_array())
);

-- ---------------------------------------------------------------------------
-- 6. Policies: jogadores (must be linked to tenant via equipes_jogadores)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_jogadores_select ON jogadores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = jogadores.id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
);

CREATE POLICY rls_jogadores_insert ON jogadores FOR INSERT WITH CHECK (true);
-- Insert allowed; tenant check is enforced when linking in equipes_jogadores

CREATE POLICY rls_jogadores_update ON jogadores FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = jogadores.id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
);

CREATE POLICY rls_jogadores_delete ON jogadores FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = jogadores.id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 7. Policies: jogos_estatisticas_equipe (via jogo.equipe_id)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_jogos_estatisticas_equipe_all ON jogos_estatisticas_equipe FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 8. Policies: jogos_estatisticas_jogador (via jogo.equipe_id)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_jogos_estatisticas_jogador_all ON jogos_estatisticas_jogador FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 9. Policies: jogos_eventos (via jogo.equipe_id)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_jogos_eventos_all ON jogos_eventos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM jogos j WHERE j.id = jogo_id AND j.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 10. Policies: lesoes (jogador must belong to tenant)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_lesoes_all ON lesoes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = lesoes.jogador_id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = lesoes.jogador_id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 11. Policies: avaliacoes_fisicas (jogador must belong to tenant)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_avaliacoes_fisicas_all ON avaliacoes_fisicas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = avaliacoes_fisicas.jogador_id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipes_jogadores ej
    WHERE ej.jogador_id = avaliacoes_fisicas.jogador_id
    AND ej.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 12. Policies: programacoes (equipe_id in tenant's equipe_ids)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_programacoes_all ON programacoes FOR ALL USING (
  equipe_id = ANY(current_equipe_ids_array())
) WITH CHECK (
  equipe_id = ANY(current_equipe_ids_array())
);

-- ---------------------------------------------------------------------------
-- 13. Policies: programacoes_dias (via programacao.equipe_id)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_programacoes_dias_all ON programacoes_dias FOR ALL USING (
  EXISTS (
    SELECT 1 FROM programacoes p
    WHERE p.id = programacoes_dias.programacao_id
    AND p.equipe_id = ANY(current_equipe_ids_array())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM programacoes p
    WHERE p.id = programacoes_dias.programacao_id
    AND p.equipe_id = ANY(current_equipe_ids_array())
  )
);

-- ---------------------------------------------------------------------------
-- 14. Policies: campeonatos (equipe_id null or in tenant's equipe_ids)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_campeonatos_all ON campeonatos FOR ALL USING (
  equipe_id IS NULL OR equipe_id = ANY(current_equipe_ids_array())
) WITH CHECK (
  equipe_id IS NULL OR equipe_id = ANY(current_equipe_ids_array())
);

-- ---------------------------------------------------------------------------
-- 15. Policies: campeonatos_jogos (via campeonato.equipe_id)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_campeonatos_jogos_all ON campeonatos_jogos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campeonatos c
    WHERE c.id = campeonatos_jogos.campeonato_id
    AND (c.equipe_id IS NULL OR c.equipe_id = ANY(current_equipe_ids_array()))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM campeonatos c
    WHERE c.id = campeonatos_jogos.campeonato_id
    AND (c.equipe_id IS NULL OR c.equipe_id = ANY(current_equipe_ids_array()))
  )
);

-- ---------------------------------------------------------------------------
-- 16. Policies: metas_estatisticas (equipe_id null or in tenant's equipe_ids)
-- ---------------------------------------------------------------------------
CREATE POLICY rls_metas_estatisticas_all ON metas_estatisticas FOR ALL USING (
  equipe_id IS NULL OR equipe_id = ANY(current_equipe_ids_array())
) WITH CHECK (
  equipe_id IS NULL OR equipe_id = ANY(current_equipe_ids_array())
);

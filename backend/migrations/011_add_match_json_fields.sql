-- Adicionar campos JSON na tabela jogos para postMatchEventLog, playerRelationships, lineup, substitutionHistory
-- Migration: 009_add_match_json_fields

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS post_match_event_log JSONB,
ADD COLUMN IF NOT EXISTS player_relationships JSONB,
ADD COLUMN IF NOT EXISTS lineup JSONB,
ADD COLUMN IF NOT EXISTS substitution_history JSONB;

COMMENT ON COLUMN jogos.post_match_event_log IS 'Log de eventos da partida (passes com receptor, etc.)';
COMMENT ON COLUMN jogos.player_relationships IS 'Relações entre jogadores (passes/assistências entre pares)';
COMMENT ON COLUMN jogos.lineup IS 'Escalação (players, bench, ballPossessionStart)';
COMMENT ON COLUMN jogos.substitution_history IS 'Histórico de substituições';

-- Adicionar colunas de posse de bola em segundos na tabela jogos
-- possession_seconds_with = tempo com posse (nossa equipe)
-- possession_seconds_without = tempo sem posse (adversário)

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS possession_seconds_with INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS possession_seconds_without INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN jogos.possession_seconds_with IS 'Segundos com posse de bola (nossa equipe)';
COMMENT ON COLUMN jogos.possession_seconds_without IS 'Segundos sem posse de bola';

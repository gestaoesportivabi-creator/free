-- Remover colunas de posse de bola (não usadas na versão pós-partida)
-- Funciona mesmo se as colunas não existirem (IF EXISTS)

ALTER TABLE jogos DROP COLUMN IF EXISTS possession_seconds_with;
ALTER TABLE jogos DROP COLUMN IF EXISTS possession_seconds_without;

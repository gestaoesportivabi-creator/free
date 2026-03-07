-- Adicionar campos location e scoreTarget na tabela campeonatos_jogos
-- Migration: 008_add_championship_fields

ALTER TABLE campeonatos_jogos
ADD COLUMN IF NOT EXISTS local VARCHAR(50),
ADD COLUMN IF NOT EXISTS meta_pontuacao VARCHAR(255);

COMMENT ON COLUMN campeonatos_jogos.local IS 'Mandante ou Visitante';
COMMENT ON COLUMN campeonatos_jogos.meta_pontuacao IS 'Meta de pontuação para a partida (ex: Vencer por 2 gols)';

-- Migration 004: Adicionar campos em programacoes_dias e campeonatos_jogos
-- Aplicar ajustes recomendados da Seção 11.2.A (itens 8, 9)

-- 1. Adicionar dia_semana_numero em programacoes_dias
ALTER TABLE programacoes_dias 
ADD COLUMN IF NOT EXISTS dia_semana_numero INTEGER CHECK (dia_semana_numero >= 0 AND dia_semana_numero <= 6);

-- Calcular a partir de data se existir (0=Dom, 6=Sáb)
UPDATE programacoes_dias 
SET dia_semana_numero = EXTRACT(DOW FROM data)
WHERE dia_semana_numero IS NULL AND data IS NOT NULL;

-- 2. Adicionar jogo_id em campeonatos_jogos
ALTER TABLE campeonatos_jogos 
ADD COLUMN IF NOT EXISTS jogo_id UUID REFERENCES jogos(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_campeonatos_jogos_jogo ON campeonatos_jogos(jogo_id);


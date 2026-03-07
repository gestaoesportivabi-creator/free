-- Migration 010: Adicionar campos de Academia em programacoes_dias
-- exercicio_id: ID do exercício (para match com carga máxima do atleta)
-- carga_percent: Porcentagem da carga máxima (1-100)

ALTER TABLE programacoes_dias 
ADD COLUMN IF NOT EXISTS exercicio_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS carga_percent INT;

-- Migration 002: Normalizar relacionamento jogos -> competicoes
-- Aplicar ajuste recomendado da Seção 11.2.A (item 4)

-- Adicionar competicao_id mantendo campeonato para compatibilidade
ALTER TABLE jogos 
ADD COLUMN IF NOT EXISTS competicao_id UUID REFERENCES competicoes(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_jogos_competicao ON jogos(competicao_id);

-- Comentário para marcar campeonato como legado
COMMENT ON COLUMN jogos.campeonato IS 'DEPRECADO: usar competicao_id. Mantido para compatibilidade durante migração.';


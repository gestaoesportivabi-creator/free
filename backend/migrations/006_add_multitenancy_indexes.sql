-- Migration 006: Adicionar índices de multi-tenancy
-- Aplicar ajuste recomendado da Seção 11.2.B (item 11)

-- Índices para performance em queries filtradas por tenant
CREATE INDEX IF NOT EXISTS idx_equipes_tecnico ON equipes(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_equipes_clube ON equipes(clube_id);

-- Índice composto para queries de jogos por equipe (tenant)
CREATE INDEX IF NOT EXISTS idx_jogos_equipe_tenant ON jogos(equipe_id, data DESC);

-- Índices adicionais para isolamento de tenant em outras tabelas
CREATE INDEX IF NOT EXISTS idx_programacoes_equipe_tenant ON programacoes(equipe_id);
CREATE INDEX IF NOT EXISTS idx_metas_estatisticas_equipe_tenant ON metas_estatisticas(equipe_id);
CREATE INDEX IF NOT EXISTS idx_campeonatos_equipe_tenant ON campeonatos(equipe_id);


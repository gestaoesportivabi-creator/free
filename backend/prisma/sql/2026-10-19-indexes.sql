-- Índices equivalentes aos @@index de 2026-10-19 em schema.prisma.
-- Nomes de tabela/coluna vêm de @@map e @map.
-- Nomes de índice seguem o padrão do Prisma: {tabela}_{coluna}_idx
-- (igual a users_jogador_id_idx em backend/migrations/021_add_athlete_user.sql).
--
-- CREATE INDEX CONCURRENTLY não pode correr dentro de uma transação.
-- Não aplicar por backend/scripts/apply-migration.ts (esse script abre BEGIN).
-- Correr com autocommit na ligação direta (DIRECT_URL / session mode), não no pooler de transação.
-- O script não altera dados nem o isolamento multi-tenant.

CREATE INDEX CONCURRENTLY IF NOT EXISTS jogos_eventos_jogo_id_idx
  ON jogos_eventos (jogo_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS jogos_eventos_jogador_id_idx
  ON jogos_eventos (jogador_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS programacoes_dias_programacao_id_idx
  ON programacoes_dias (programacao_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS campeonatos_jogos_campeonato_id_idx
  ON campeonatos_jogos (campeonato_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS users_role_id_idx
  ON users (role_id);

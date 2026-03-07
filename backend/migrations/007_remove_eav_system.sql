-- Migration 007: Remover sistema EAV (Entity-Attribute-Value)
-- 
-- Esta migration remove as tabelas do sistema EAV que não estão sendo utilizadas.
-- As tabelas removidas são:
-- - registros_valores
-- - registros
-- - campos
-- - subcategorias
-- - categorias
--
-- IMPORTANTE: Esta migration deve ser executada apenas se você tem certeza
-- de que não há dados importantes nessas tabelas e que não há planos de
-- implementar o sistema EAV no futuro.

-- Remover tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS registros_valores CASCADE;
DROP TABLE IF EXISTS registros CASCADE;
DROP TABLE IF EXISTS campos CASCADE;
DROP TABLE IF EXISTS subcategorias CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- Nota: As foreign keys serão removidas automaticamente pelo CASCADE

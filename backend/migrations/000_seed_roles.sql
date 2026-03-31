-- Migration: Seed inicial de Roles
-- Cria as roles básicas do sistema

-- Inserir roles apenas se não existirem
INSERT INTO roles (id, name, description, created_at)
VALUES 
  (gen_random_uuid(), 'ADMINISTRADOR', 'Administrador - Acesso total', NOW()),
  (gen_random_uuid(), 'ESSENCIAL', 'Plano Essencial', NOW()),
  (gen_random_uuid(), 'COMPETICAO', 'Plano Competicao', NOW()),
  (gen_random_uuid(), 'PERFORMANCE', 'Plano Performance', NOW())
ON CONFLICT (name) DO NOTHING;


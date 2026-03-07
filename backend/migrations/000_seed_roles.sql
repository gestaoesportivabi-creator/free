-- Migration: Seed inicial de Roles
-- Cria as roles básicas do sistema

-- Inserir roles apenas se não existirem
INSERT INTO roles (id, name, description, created_at)
VALUES 
  (gen_random_uuid(), 'ADMIN', 'Administrador do sistema', NOW()),
  (gen_random_uuid(), 'TECNICO', 'Técnico/Treinador', NOW()),
  (gen_random_uuid(), 'CLUBE', 'Clube', NOW()),
  (gen_random_uuid(), 'ATLETA', 'Atleta', NOW())
ON CONFLICT (name) DO NOTHING;


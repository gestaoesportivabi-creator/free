-- Migration: Conta do Atleta — role ATLETA + vínculo users.jogador_id

INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'ATLETA', 'Atleta — acesso ao portal de fisiologia', NOW())
ON CONFLICT (name) DO NOTHING;

-- jogadores.id pode ser TEXT no Supabase legado (não UUID)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS jogador_id TEXT UNIQUE REFERENCES jogadores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_jogador_id_idx ON users(jogador_id);

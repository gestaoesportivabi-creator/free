-- Nome e escudo do time (exibição) por usuário — persistem ao trocar de dispositivo
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS team_display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS team_shield_url TEXT;

COMMENT ON COLUMN users.team_display_name IS 'Nome do time para exibição (Configurações)';
COMMENT ON COLUMN users.team_shield_url IS 'URL ou base64 do escudo da equipe (Configurações)';

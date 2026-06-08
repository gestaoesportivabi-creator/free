-- Adversários (dossiê tático) e canais YouTube por equipe — Assistant API / bot técnico

CREATE TABLE IF NOT EXISTS adversarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id TEXT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  apelidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  competicao VARCHAR(255),
  tecnico_nome VARCHAR(255),
  youtube_channel_url TEXT,
  youtube_channel_id VARCHAR(64),
  pontos_fortes TEXT,
  pontos_fracos TEXT,
  analise_texto TEXT,
  analise_atualizada_em TIMESTAMPTZ,
  video_url TEXT,
  proximo_jogo_data DATE,
  proximo_jogo_local VARCHAR(255),
  monitorado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS adversarios_equipe_nome_uidx
  ON adversarios (equipe_id, lower(trim(nome)));

CREATE INDEX IF NOT EXISTS adversarios_equipe_id_idx ON adversarios (equipe_id);
CREATE INDEX IF NOT EXISTS adversarios_monitorado_idx ON adversarios (equipe_id, monitorado);

CREATE TABLE IF NOT EXISTS youtube_canais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id TEXT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  channel_url TEXT NOT NULL,
  channel_id VARCHAR(64),
  tipo VARCHAR(32) NOT NULL DEFAULT 'oficial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_canais_equipe_id_idx ON youtube_canais (equipe_id);

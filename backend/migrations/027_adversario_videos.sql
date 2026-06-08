-- Vídeos múltiplos por adversário (cadastro via bot Telegram / Assistant API)

CREATE TABLE IF NOT EXISTS adversario_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adversario_id UUID NOT NULL REFERENCES adversarios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label VARCHAR(255),
  data_jogo DATE,
  fonte VARCHAR(64) NOT NULL DEFAULT 'telegram',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS adversario_videos_adv_url_uidx
  ON adversario_videos (adversario_id, url);

CREATE INDEX IF NOT EXISTS adversario_videos_adversario_id_idx
  ON adversario_videos (adversario_id);

CREATE INDEX IF NOT EXISTS adversario_videos_created_at_idx
  ON adversario_videos (created_at DESC);

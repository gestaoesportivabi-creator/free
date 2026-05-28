-- Sessões de conversa do bot Telegram (fluxos multi-passo no serverless)

CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id TEXT PRIMARY KEY,
  step TEXT NOT NULL DEFAULT 'idle',
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telegram_sessions_updated_at_idx ON telegram_sessions(updated_at);

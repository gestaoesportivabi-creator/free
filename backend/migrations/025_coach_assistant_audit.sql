-- Auditoria de chamadas da Assistant API (admin observa atividade dos técnicos)
CREATE TABLE IF NOT EXISTS coach_assistant_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  endpoint TEXT NOT NULL,
  method VARCHAR(8) NOT NULL,
  question TEXT,
  status_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_audit_created_at ON coach_assistant_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_audit_chat_id ON coach_assistant_audit (telegram_chat_id);

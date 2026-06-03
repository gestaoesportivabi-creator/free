-- Vincular conta STAFF (técnico/clube) ao chat do bot coach (@scout21coachbot)
-- Separado de telegram_chat_id (bot do atleta @scout21bot)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_coach_chat_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS users_telegram_coach_chat_id_idx ON users(telegram_coach_chat_id);

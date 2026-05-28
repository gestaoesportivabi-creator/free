-- Vincular conta ATLETA ao chat do Telegram (um chat por usuário)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS users_telegram_chat_id_idx ON users(telegram_chat_id);

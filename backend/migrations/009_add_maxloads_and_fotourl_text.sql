-- Migration: Adicionar maxLoadsJson e alterar foto_url para TEXT
-- Permite salvar cargas máximas (exercícios) e fotos em base64

-- Alterar foto_url para TEXT (suporta base64 longo)
ALTER TABLE jogadores ALTER COLUMN foto_url TYPE TEXT;

-- Adicionar coluna max_loads_json para cargas máximas
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS max_loads_json JSONB;

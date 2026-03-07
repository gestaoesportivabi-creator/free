-- Migration 001: Adicionar campos ausentes em users e jogadores
-- Aplicar ajustes recomendados da Seção 11.2.A (itens 1, 2, 3)

-- 1. Adicionar campos name e photo_url em users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Tornar name obrigatório após popular dados existentes (se houver)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE name IS NULL) THEN
    UPDATE users SET name = email WHERE name IS NULL;
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- 2. Adicionar campo idade em jogadores
ALTER TABLE jogadores 
ADD COLUMN IF NOT EXISTS idade INTEGER CHECK (idade >= 0 AND idade <= 150);

-- Calcular idade a partir de data_nascimento se existir
UPDATE jogadores 
SET idade = EXTRACT(YEAR FROM AGE(data_nascimento))
WHERE idade IS NULL AND data_nascimento IS NOT NULL;


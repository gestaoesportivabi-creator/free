-- Migration 005: Adicionar constraints EAV e validação de email
-- Aplicar ajustes recomendados da Seção 11.2.A (itens 10, 17)

-- 1. Adicionar constraint de validação de tipo vs valor em registros_valores
-- Nota: Esta constraint é complexa e pode impactar performance
-- Considerar validação na aplicação também

ALTER TABLE registros_valores
DROP CONSTRAINT IF EXISTS check_tipo_valor;

-- Constraint que valida se o tipo do valor corresponde ao tipo do campo
ALTER TABLE registros_valores
ADD CONSTRAINT check_tipo_valor CHECK (
  (
    (SELECT tipo FROM campos WHERE id = campo_id) = 'INTEGER' 
    AND valor_numero IS NOT NULL 
    AND valor_numero = FLOOR(valor_numero)
  ) OR
  (
    (SELECT tipo FROM campos WHERE id = campo_id) = 'DECIMAL' 
    AND valor_numero IS NOT NULL
  ) OR
  (
    (SELECT tipo FROM campos WHERE id = campo_id) = 'TEXT' 
    AND valor_texto IS NOT NULL
  ) OR
  (
    (SELECT tipo FROM campos WHERE id = campo_id) = 'BOOLEAN' 
    AND valor_boolean IS NOT NULL
  ) OR
  (
    (SELECT tipo FROM campos WHERE id = campo_id) = 'DATE' 
    AND valor_data IS NOT NULL
  )
);

-- 2. Adicionar validação de email em users
-- Remover constraint antiga se existir
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_check;

-- Adicionar constraint de validação de email
ALTER TABLE users
ADD CONSTRAINT users_email_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');


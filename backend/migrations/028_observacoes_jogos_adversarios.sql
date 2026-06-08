-- Campo observações (notas livres) em jogos e adversários

ALTER TABLE jogos
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE adversarios
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

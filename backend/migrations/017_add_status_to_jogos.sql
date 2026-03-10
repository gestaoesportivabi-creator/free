-- Adiciona coluna status na tabela jogos (encerrado, em_andamento, nao_executado)
ALTER TABLE jogos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'encerrado';

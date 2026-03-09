-- Adicionar coluna metodo_gol (TEXT) na tabela jogos_estatisticas_equipe
-- Armazena os métodos dos gols da partida (JSON text: {"Ataque": 2, "Contra-ataque": 1})

ALTER TABLE jogos_estatisticas_equipe ADD COLUMN IF NOT EXISTS metodo_gol TEXT;

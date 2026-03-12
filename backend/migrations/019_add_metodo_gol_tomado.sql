-- Adicionar coluna metodo_gol_tomado (TEXT) na tabela jogos_estatisticas_equipe
-- Armazena os métodos dos gols sofridos (JSON: {"Cabeça": 1, "Pé direito": 2, ...})
-- Usado pelo Scout Coletivo para exibir gráfico de métodos de gols tomados.

ALTER TABLE jogos_estatisticas_equipe ADD COLUMN IF NOT EXISTS metodo_gol_tomado TEXT;

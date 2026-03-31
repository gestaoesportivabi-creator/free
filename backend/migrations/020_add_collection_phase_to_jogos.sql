-- Fase da coleta scout (persistente): 0 não iniciada, 1 primeiro tempo, 2 segundo tempo
ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS collection_phase SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN jogos.collection_phase IS 'Coleta: 0 não iniciada, 1º tempo, 2º tempo';

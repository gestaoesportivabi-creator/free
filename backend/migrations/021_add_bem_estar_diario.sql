-- Migration: Tabela bem_estar_diario (registro diário por atleta)
-- Escalas opcionais 0–10 (SMALLINT); nulos = campo não preenchido.

CREATE TABLE IF NOT EXISTS public.bem_estar_diario (
  id              TEXT PRIMARY KEY,
  equipe_id       TEXT NOT NULL REFERENCES public.equipes (id) ON DELETE CASCADE,
  jogador_id      TEXT NOT NULL REFERENCES public.jogadores (id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  nivel_stress    SMALLINT NULL,
  qual_sono       SMALLINT NULL,
  humor_mot       SMALLINT NULL,
  dor_muscular    SMALLINT NULL,
  satisfacao      SMALLINT NULL,
  observacoes     TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bem_estar_diario_jogador_data_key UNIQUE (jogador_id, data)
);

CREATE INDEX IF NOT EXISTS bem_estar_diario_equipe_id_data_idx ON public.bem_estar_diario (equipe_id, data);
CREATE INDEX IF NOT EXISTS bem_estar_diario_jogador_id_idx ON public.bem_estar_diario (jogador_id);

COMMENT ON TABLE public.bem_estar_diario IS 'Bem-estar diário por atleta (stress, sono, humor, dor muscular, satisfação).';

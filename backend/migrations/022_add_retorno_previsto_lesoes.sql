-- Migration: Coluna retorno_previsto em lesões (data prevista de retorno às atividades)

ALTER TABLE public.lesoes
  ADD COLUMN IF NOT EXISTS retorno_previsto DATE NULL;

COMMENT ON COLUMN public.lesoes.retorno_previsto IS 'Data prevista de retorno do atleta às atividades.';

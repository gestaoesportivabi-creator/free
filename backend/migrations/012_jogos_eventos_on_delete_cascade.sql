-- Migration 012: ON DELETE CASCADE em jogos_eventos.jogador_id
-- Permite excluir jogador mesmo tendo eventos de jogo associados (eventos são removidos em cascata).

-- Remover FK antiga e recriar com ON DELETE CASCADE
ALTER TABLE jogos_eventos
  DROP CONSTRAINT IF EXISTS jogos_eventos_jogador_id_fkey;

ALTER TABLE jogos_eventos
  ADD CONSTRAINT jogos_eventos_jogador_id_fkey
  FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE;

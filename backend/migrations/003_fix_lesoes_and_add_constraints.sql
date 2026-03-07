-- Migration 003: Ajustar lesoes e adicionar constraints críticas
-- Aplicar ajustes recomendados da Seção 11.2.A (itens 5, 6)

-- 1. Adicionar data_inicio em lesoes (mantendo data para compatibilidade)
ALTER TABLE lesoes 
ADD COLUMN IF NOT EXISTS data_inicio DATE;

-- Copiar dados existentes de data para data_inicio
UPDATE lesoes 
SET data_inicio = data 
WHERE data_inicio IS NULL AND data IS NOT NULL;

-- Tornar data_inicio obrigatório
ALTER TABLE lesoes ALTER COLUMN data_inicio SET NOT NULL;

-- Manter coluna 'data' temporariamente para compatibilidade
COMMENT ON COLUMN lesoes.data IS 'DEPRECADO: usar data_inicio. Será removido após migração completa.';

-- 2. Adicionar constraint de validação de sequência ENTRADA/SAÍDA em jogos_eventos
-- Implementado via trigger para melhor performance

CREATE OR REPLACE FUNCTION check_entrada_saida_sequence()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_evento = 'ENTRADA' THEN
    -- Verificar se já existe entrada sem saída para este jogador neste jogo
    IF EXISTS (
      SELECT 1 FROM jogos_eventos je
      WHERE je.jogo_id = NEW.jogo_id
      AND je.jogador_id = NEW.jogador_id
      AND je.tipo_evento = 'ENTRADA'
      AND je.id != NEW.id
      AND NOT EXISTS (
        SELECT 1 FROM jogos_eventos je2
        WHERE je2.jogo_id = je.jogo_id
        AND je2.jogador_id = je.jogador_id
        AND je2.tipo_evento = 'SAIDA'
        AND (je2.minuto > je.minuto OR (je2.minuto = je.minuto AND je2.segundo > je.segundo))
        AND (je2.minuto < NEW.minuto OR (je2.minuto = NEW.minuto AND je2.segundo < NEW.segundo))
      )
    ) THEN
      RAISE EXCEPTION 'Jogador já possui entrada sem saída correspondente neste jogo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_check_entrada_saida ON jogos_eventos;
CREATE TRIGGER trigger_check_entrada_saida
BEFORE INSERT OR UPDATE ON jogos_eventos
FOR EACH ROW
EXECUTE FUNCTION check_entrada_saida_sequence();


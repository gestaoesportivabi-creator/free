/**
 * Service para Competições
 * Nota: Competições são globais, não filtradas por tenant
 * Frontend espera array de strings, não objetos
 */

import { competitionsRepository } from '../repositories/competitions.repository';

export const competitionsService = {
  /**
   * Buscar todas as competições
   * Retorna array de strings para compatibilidade com frontend
   */
  async getAll(): Promise<string[]> {
    const competicoes = await competitionsRepository.findAll();
    // Transformar objetos em array de strings (nomes)
    return competicoes.map(c => c.nome).filter(nome => nome);
  },

  /**
   * Buscar competição por ID
   */
  async getById(id: string) {
    return competitionsRepository.findById(id);
  },

  /**
   * Criar competição
   * Recebe string (nome) do frontend
   */
  async create(data: { name: string } | string) {
    // Frontend pode enviar string diretamente ou objeto com 'name'
    const nome = typeof data === 'string' ? data : data.name;
    
    // Verificar se já existe
    const existing = await competitionsRepository.findByName(nome);
    if (existing) {
      return existing;
    }

    return competitionsRepository.create({ nome });
  },
};


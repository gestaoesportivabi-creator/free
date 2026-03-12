import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos para auxiliar
type WellnessType = 'pse-treino' | 'pse-jogo' | 'psr-treino' | 'psr-jogo' | 'qualidade-sono';

const getModelInfo = (type: WellnessType) => {
  switch (type) {
    case 'pse-treino': return { model: prisma.pseTreino, idField: 'equipeId', foreignLabel: 'equipe', dateField: 'data' };
    case 'pse-jogo': return { model: prisma.pseJogo, idField: 'jogoId', foreignLabel: 'jogo', dateField: undefined };
    case 'psr-treino': return { model: prisma.psrTreino, idField: 'equipeId', foreignLabel: 'equipe', dateField: 'data' };
    case 'psr-jogo': return { model: prisma.psrJogo, idField: 'jogoId', foreignLabel: 'jogo', dateField: undefined };
    case 'qualidade-sono': return { model: prisma.qualidadeSono, idField: 'equipeId', foreignLabel: 'equipe', dateField: 'data' };
    default: throw new Error('Tipo inválido');
  }
};

export const wellnessController = {
  // GET getAll by Type
  async getAll(req: Request, res: Response) {
    try {
      const { type } = req.params as { type: WellnessType };
      const { model } = getModelInfo(type);
      
      const data = await (model as any).findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`Erro ao buscar dados de ${req.params.type}:`, error);
      res.status(500).json({ success: false, error: 'Erro ao buscar dados.' });
    }
  },

  // POST Create Multiple (Bulk Insert)
  async saveBulk(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params as { type: WellnessType };
      const { items } = req.body;
      const { model, idField, dateField } = getModelInfo(type);

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Lista de dados inválida.' });
        return;
      }

      const results = [];
      for (const item of items) {
         const { jogadorId, value, observacoes, data, jogoId, equipeId } = item;
         
         const fkId = idField === 'jogoId' ? jogoId : equipeId;
         if (!fkId || !jogadorId || value === undefined) continue;

         // Verifica se já existe um registro para o jogador naquele evento
         let existingRecord = null;
         
         if (dateField === 'data') {
             // Treinos/Sono: Unicidade por equipe, jogador e data
             // Devido a ausência de Unique Compound completa no schema gerado rápido, vamos por findFirst
             existingRecord = await (model as any).findFirst({
                 where: {
                     jogadorId,
                     [idField]: fkId,
                     [dateField]: new Date(data)
                 }
             });
         } else {
             // Jogos: Unicidade por jogador e jogo
             existingRecord = await (model as any).findFirst({
                 where: {
                     jogadorId,
                     [idField]: fkId
                 }
             });
         }

         if (existingRecord) {
             // Atualizar
             const updated = await (model as any).update({
                 where: { id: existingRecord.id },
                 data: { valor: value, observacoes }
             });
             results.push(updated);
         } else {
             // Criar novo
             const dataToCreate: any = {
                 jogadorId,
                 [idField]: fkId,
                 valor: value,
                 observacoes
             };
             if (dateField === 'data') dataToCreate[dateField] = new Date(data);
             
             const created = await (model as any).create({ data: dataToCreate });
             results.push(created);
         }
      }

      res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      console.error(`Erro ao salvar dados de ${req.params.type}:`, error);
      res.status(500).json({ success: false, error: 'Erro ao salvar os dados.' });
    }
  }
};

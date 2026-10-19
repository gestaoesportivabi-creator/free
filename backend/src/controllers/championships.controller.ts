import { Request, Response } from 'express';
import {
  createChampionship,
  deleteChampionship,
  listChampionships,
  prismaChampionshipStore,
  updateChampionship,
} from '../services/championships.service';

function bodyOf(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return {};
  return req.body as Record<string, unknown>;
}

export const championshipsController = {
  async getAll(req: Request, res: Response) {
    try {
      const outcome = await listChampionships(prismaChampionshipStore, req.tenantInfo);
      return res.status(outcome.status).json(outcome.body);
    } catch (error) {
      console.error('Erro ao buscar campeonatos:', error);
      return res.status(500).json({ success: false, error: 'Erro ao buscar campeonatos' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const outcome = await createChampionship(prismaChampionshipStore, req.tenantInfo, bodyOf(req));
      return res.status(outcome.status).json(outcome.body);
    } catch (error) {
      console.error('Erro ao criar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao criar campeonato' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const outcome = await updateChampionship(
        prismaChampionshipStore,
        req.tenantInfo,
        req.params.id,
        bodyOf(req)
      );
      return res.status(outcome.status).json(outcome.body);
    } catch (error) {
      console.error('Erro ao atualizar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar campeonato' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const outcome = await deleteChampionship(prismaChampionshipStore, req.tenantInfo, req.params.id);
      return res.status(outcome.status).json(outcome.body);
    } catch (error) {
      console.error('Erro ao deletar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao deletar campeonato' });
    }
  },
};

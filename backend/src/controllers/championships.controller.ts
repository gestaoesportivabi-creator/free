import { Request, Response } from 'express';
import prisma from '../config/database';

export const championshipsController = {
  async getAll(req: Request, res: Response) {
    try {
      const tenantInfo = (req as any).tenantInfo;
      const equipeIds = tenantInfo?.equipe_ids || [];
      if (equipeIds.length === 0) return res.json({ success: true, data: [] });

      const campeonatos = await prisma.campeonato.findMany({
        where: { equipeId: { in: equipeIds } },
        orderBy: { createdAt: 'desc' },
      });

      // Transformar para o formato do frontend
      const result = campeonatos.map((c: any) => ({
        id: c.id,
        name: c.nome,
        equipeId: c.equipeId,
        createdAt: c.createdAt?.toISOString(),
        ...(c.dados || {}),
      }));

      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('Erro ao buscar campeonatos:', error);
      return res.status(500).json({ success: false, error: 'Erro ao buscar campeonatos' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const tenantInfo = (req as any).tenantInfo;
      const equipeIds = tenantInfo?.equipe_ids || [];
      if (equipeIds.length === 0) return res.status(400).json({ success: false, error: 'Nenhuma equipe' });

      const body = req.body;
      const { name, id: _clientId, equipeId: _eqId, createdAt: _ca, ...dados } = body;

      const campeonato = await prisma.campeonato.create({
        data: {
          nome: name || body.nome || '',
          equipeId: body.equipeId || equipeIds[0],
          dados: dados,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: campeonato.id,
          name: campeonato.nome,
          equipeId: campeonato.equipeId,
          createdAt: campeonato.createdAt?.toISOString(),
          ...(campeonato.dados as object || {}),
        },
      });
    } catch (error) {
      console.error('Erro ao criar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao criar campeonato' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;
      const { name, id: _clientId, equipeId: _eqId, createdAt: _ca, ...dados } = body;

      const campeonato = await prisma.campeonato.update({
        where: { id },
        data: {
          nome: name || body.nome || undefined,
          dados: dados,
        },
      });

      return res.json({
        success: true,
        data: {
          id: campeonato.id,
          name: campeonato.nome,
          equipeId: campeonato.equipeId,
          createdAt: campeonato.createdAt?.toISOString(),
          ...(campeonato.dados as object || {}),
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar campeonato' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.campeonato.delete({ where: { id } });
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar campeonato:', error);
      return res.status(500).json({ success: false, error: 'Erro ao deletar campeonato' });
    }
  },
};

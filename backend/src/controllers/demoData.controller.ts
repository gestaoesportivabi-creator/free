/**
 * Controller de dados de demonstração — usado no passo 2 do wizard de boas-vindas.
 */

import { Request, Response } from 'express';
import { clearDemoData, seedDemoData } from '../services/demoData.service';

function resolveEquipeId(req: Request): string | null {
  const ids = req.tenantInfo?.equipe_ids ?? [];
  return ids[0] ?? null;
}

export const demoDataController = {
  /** POST /api/me/demo-data */
  seed: async (req: Request, res: Response) => {
    try {
      if (req.access?.isExpired) {
        return res.status(402).json({ success: false, error: 'trial_expired' });
      }

      const equipeId = resolveEquipeId(req);
      if (!equipeId) {
        return res.status(400).json({
          success: false,
          error: 'no_team',
          message: 'Cadastre uma equipa antes de carregar os dados de demonstração.',
        });
      }

      const result = await seedDemoData(equipeId);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('[demoData] Erro ao criar dados de demonstração:', error);
      return res.status(500).json({ success: false, error: 'Erro ao criar dados de demonstração' });
    }
  },

  /** DELETE /api/me/demo-data */
  clear: async (req: Request, res: Response) => {
    try {
      const equipeId = resolveEquipeId(req);
      if (!equipeId) {
        return res.status(400).json({ success: false, error: 'no_team' });
      }

      const result = await clearDemoData(equipeId);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('[demoData] Erro ao remover dados de demonstração:', error);
      return res.status(500).json({ success: false, error: 'Erro ao remover dados de demonstração' });
    }
  },
};

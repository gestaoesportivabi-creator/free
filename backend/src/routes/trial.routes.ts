/**
 * Cron do ciclo de vida do teste gratuito.
 * Segue o mesmo padrão de autenticação do cron do Telegram: Bearer CRON_SECRET.
 */

import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { runTrialLifecycle } from '../services/trialLifecycle.service';

const router = Router();

async function handleLifecycleCron(req: Request, res: Response) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }

  try {
    const result = await runTrialLifecycle();
    console.log('[cron/trial-lifecycle]', result);
    return res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no cron';
    console.error('[cron/trial-lifecycle] falhou:', error);
    return res.status(500).json({ success: false, error: message });
  }
}

// GET e POST: o Vercel Cron usa GET; POST fica disponível para disparo manual.
router.get('/trial-lifecycle', handleLifecycleCron);
router.post('/trial-lifecycle', handleLifecycleCron);

export default router;

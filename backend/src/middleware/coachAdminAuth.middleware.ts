import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { validateAssistantServiceToken } from './assistantAuth.middleware';

const ADMIN_KEY_HEADER = 'x-coach-admin-key';

/** Token de serviço + chave admin (COACH_ADMIN_AUDIT_KEY) */
export function validateCoachAdminAccess(req: Request, res: Response, next: NextFunction) {
  validateAssistantServiceToken(req, res, () => {
    const key = req.headers[ADMIN_KEY_HEADER] as string | undefined;
    if (!env.COACH_ADMIN_AUDIT_KEY?.trim()) {
      return res.status(503).json({
        success: false,
        error: 'COACH_ADMIN_AUDIT_KEY não configurado no servidor',
      });
    }
    if (!key || key !== env.COACH_ADMIN_AUDIT_KEY) {
      return res.status(401).json({ success: false, error: 'Chave de admin inválida' });
    }
    next();
    return;
  });
}

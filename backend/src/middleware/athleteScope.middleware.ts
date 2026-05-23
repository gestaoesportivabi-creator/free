/**
 * Middleware: apenas staff (não atleta)
 */

import { Request, Response, NextFunction } from 'express';

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role_id === 'ATLETA') {
    return res.status(403).json({
      success: false,
      error: 'Acesso restrito à comissão técnica',
    });
  }
  next();
  return;
}

/**
 * Middleware: apenas atleta
 */
export function requireAthlete(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role_id !== 'ATLETA' || !req.user?.jogador_id) {
    return res.status(403).json({
      success: false,
      error: 'Acesso restrito a atletas',
    });
  }
  next();
  return;
}

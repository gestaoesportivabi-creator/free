import { Request, Response, NextFunction } from 'express';

export function requirePlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role_id !== 'ADMINISTRADOR') {
    return res.status(403).json({
      success: false,
      error: 'Acesso restrito a administradores da plataforma',
    });
  }
  next();
  return;
}

/** Após resolveUserFromServiceContext — admin via assistente web/Hermes */
export function requireAssistantPlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return requirePlatformAdmin(req, res, next);
}

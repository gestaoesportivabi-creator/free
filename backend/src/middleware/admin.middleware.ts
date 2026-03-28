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

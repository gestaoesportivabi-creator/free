/**
 * Middleware de tratamento de erros
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Se já foi enviada resposta, passar para próximo handler
  if (res.headersSent) {
    return next(err);
  }

  // Log do erro
  logger.error('Erro capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Se for AppError, usar status code e código personalizados
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}


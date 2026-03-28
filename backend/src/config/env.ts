/**
 * Configuração de variáveis de ambiente
 */

import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN?.trim() || '8h') as string,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Admin
  MAX_REGISTERED_USERS: process.env.MAX_REGISTERED_USERS
    ? parseInt(process.env.MAX_REGISTERED_USERS, 10)
    : null as number | null,
};

// Validações
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada');
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'change-me-in-production') {
  throw new Error('JWT_SECRET deve ser alterado em produção');
}


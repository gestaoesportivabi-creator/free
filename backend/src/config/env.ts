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

  // Telegram (@scout21bot)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  /** Token secreto no header X-Telegram-Bot-Api-Secret-Token (setWebhook) */
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  /** Desenvolvimento local: long polling em vez de webhook */
  TELEGRAM_POLLING: process.env.TELEGRAM_POLLING === 'true',

  /** URL pública da API (webhook Telegram), ex. https://seu-app.vercel.app */
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',

  /** Protege POST /api/telegram/cron/reminders (Vercel Cron) */
  CRON_SECRET: process.env.CRON_SECRET || '',

  /** Token de serviço Hermes → Assistant API (/api/assistant/*) */
  ASSISTANT_SERVICE_TOKEN: process.env.ASSISTANT_SERVICE_TOKEN || '',

  /** Admin: GET /api/assistant/admin/activity (header X-Coach-Admin-Key) */
  COACH_ADMIN_AUDIT_KEY: process.env.COACH_ADMIN_AUDIT_KEY || '',

  /** User IDs (UUID, vírgula) que podem vincular Telegram sem senha via POST /link-open */
  ASSISTANT_AUTO_LINK_USER_IDS: (process.env.ASSISTANT_AUTO_LINK_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /** Hermes Web API (dashboard chat) — URL pública do proxy VPS + Bearer key */
  HERMES_WEB_API_URL: process.env.HERMES_WEB_API_URL || '',
  HERMES_WEB_API_KEY: process.env.HERMES_WEB_API_KEY || '',

  /** Resend — e-mails transacionais (1A) */
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'SCOUT21 <scout21@intersomos.com.br>',
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO || 'scout21@intersomos.com.br',
  /** Desliga envio real (útil em dev); tokens ainda são gerados */
  EMAIL_DISABLED: process.env.EMAIL_DISABLED === 'true',

  // ── Teste gratuito de 30 dias (docs/PLANO_MESTRE_TRIAL_30D.md) ──

  /** Duração do teste em dias. */
  TRIAL_DURATION_DAYS: parseInt(process.env.TRIAL_DURATION_DAYS || '30', 10),
  /** Plano concedido durante o teste — completo, é o que vende o produto. */
  TRIAL_PLAN: process.env.TRIAL_PLAN || 'PERFORMANCE',
  /** Dias de tolerância antes de exigir e-mail verificado para escrever. */
  EMAIL_VERIFICATION_GRACE_DAYS: parseInt(process.env.EMAIL_VERIFICATION_GRACE_DAYS || '7', 10),
  /** Freio de emergência: desliga o auto-cadastro sem precisar de deploy. */
  SIGNUP_ENABLED: process.env.SIGNUP_ENABLED !== 'false',
  /** Tentativas de cadastro por IP por hora. */
  SIGNUP_RATE_LIMIT_PER_IP_HOUR: parseInt(process.env.SIGNUP_RATE_LIMIT_PER_IP_HOUR || '3', 10),
  /** Bloqueio de e-mails descartáveis no cadastro. */
  DISPOSABLE_EMAIL_BLOCKLIST: process.env.DISPOSABLE_EMAIL_BLOCKLIST !== 'false',
};

// Validações
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada');
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'change-me-in-production') {
  throw new Error('JWT_SECRET deve ser alterado em produção');
}


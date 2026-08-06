/**
 * Aplicação Express Principal
 * SCOUT 21 PRO - Backend PostgreSQL
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { requireStaff } from './middleware/athleteScope.middleware';
import {
  requireActiveSubscription,
  subscriptionContext,
} from './middleware/subscription.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import playersRoutes from './routes/players.routes';
import matchesRoutes from './routes/matches.routes';
import schedulesRoutes from './routes/schedules.routes';
import assessmentsRoutes from './routes/assessments.routes';
import competitionsRoutes from './routes/competitions.routes';
import statTargetsRoutes from './routes/statTargets.routes';
import championshipMatchesRoutes from './routes/championshipMatches.routes';
import timeControlsRoutes from './routes/timeControls.routes';
import teamsRoutes from './routes/teams.routes';
import wellnessRoutes from './routes/wellness.routes';
import championshipsRoutes from './routes/championships.routes';
import leadsRoutes from './routes/leads.routes';
import trialRoutes from './routes/trial.routes';
import meRoutes from './routes/me.routes';
import telegramRoutes from './routes/telegram.routes';
import assistantRoutes from './routes/assistant.routes';
import webAssistantRoutes from './routes/webAssistant.routes';
import { startTelegramPolling } from './services/telegram/telegramPolling';

const app: Express = express();

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Em desenvolvimento, aceitar qualquer localhost
    if (env.NODE_ENV === 'development') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
    }
    
    // Se estiver rodando no Vercel (serverless), aceitar requisições do mesmo domínio
    if (process.env.VERCEL === '1') {
      // No Vercel, aceitar requisições do mesmo domínio
      callback(null, true);
      return;
    }
    
    // Em produção tradicional, usar a origem configurada
    if (origin === env.CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parser de JSON (aumentado para suportar foto base64 no cadastro/edição de atleta)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SCOUT 21 PRO Backend is running' });
});

// Rotas públicas (sem autenticação)
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
// Cron do ciclo de vida do teste — protegido por Bearer CRON_SECRET no próprio router.
app.use('/api/cron', trialRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/assistant', assistantRoutes);

// Assistente web (dashboard) — JWT + tenant; todos os usuarios logados
app.use('/api/web-assistant', authMiddleware, tenantMiddleware(), webAssistantRoutes);

// Portal do atleta e contexto da conta.
// Recebe subscriptionContext() mas NÃO requireActiveSubscription(): precisa responder
// mesmo com o teste expirado, senão o frontend não consegue mostrar a tela de expiração.
app.use('/api/me', authMiddleware, subscriptionContext(), tenantMiddleware(), meRoutes);

/**
 * Rotas de dados (staff).
 * Ordem obrigatória: auth → assinatura → tenant → papel.
 * A assinatura vem antes do tenant porque o 402 de teste expirado não depende de equipa.
 */
const staffGuard = [
  authMiddleware,
  subscriptionContext(),
  requireActiveSubscription(),
  tenantMiddleware(),
  requireStaff,
] as const;

app.use('/api/teams', ...staffGuard, teamsRoutes);
app.use('/api/players', ...staffGuard, playersRoutes);
app.use('/api/matches', ...staffGuard, matchesRoutes);
app.use('/api/schedules', ...staffGuard, schedulesRoutes);
app.use('/api/assessments', ...staffGuard, assessmentsRoutes);
app.use('/api/stat-targets', ...staffGuard, statTargetsRoutes);
app.use('/api/championship-matches', ...staffGuard, championshipMatchesRoutes);
app.use('/api/time-controls', ...staffGuard, timeControlsRoutes);
app.use('/api/wellness', ...staffGuard, wellnessRoutes);
app.use('/api/championships', ...staffGuard, championshipsRoutes);

// Competições são globais (sem tenant, mas com auth) — staff only
app.use('/api/competitions', authMiddleware, subscriptionContext(), requireActiveSubscription(), requireStaff, competitionsRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorMiddleware);

// Iniciar servidor apenas se não estiver rodando como serverless function
// O Vercel não precisa do app.listen()
if (process.env.VERCEL !== '1') {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`🚀 SCOUT 21 PRO Backend rodando em http://localhost:${PORT}`);
    console.log(`📚 Ambiente: ${env.NODE_ENV}`);
    console.log(`🔗 CORS habilitado para: ${env.CORS_ORIGIN}`);
    startTelegramPolling();
  });
}

export default app;


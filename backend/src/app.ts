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
import meRoutes from './routes/me.routes';
import telegramRoutes from './routes/telegram.routes';
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
app.use('/api/telegram', telegramRoutes);

// Portal do atleta
app.use('/api/me', authMiddleware, tenantMiddleware(), meRoutes);

// Rotas protegidas (staff — com autenticação e tenant)
app.use('/api/teams', authMiddleware, tenantMiddleware(), requireStaff, teamsRoutes);
app.use('/api/players', authMiddleware, tenantMiddleware(), requireStaff, playersRoutes);
app.use('/api/matches', authMiddleware, tenantMiddleware(), requireStaff, matchesRoutes);
app.use('/api/schedules', authMiddleware, tenantMiddleware(), requireStaff, schedulesRoutes);
app.use('/api/assessments', authMiddleware, tenantMiddleware(), requireStaff, assessmentsRoutes);
app.use('/api/stat-targets', authMiddleware, tenantMiddleware(), requireStaff, statTargetsRoutes);
app.use('/api/championship-matches', authMiddleware, tenantMiddleware(), requireStaff, championshipMatchesRoutes);
app.use('/api/time-controls', authMiddleware, tenantMiddleware(), requireStaff, timeControlsRoutes);
app.use('/api/wellness', authMiddleware, tenantMiddleware(), requireStaff, wellnessRoutes);
app.use('/api/championships', authMiddleware, tenantMiddleware(), requireStaff, championshipsRoutes);

// Competições são globais (sem tenant, mas com auth) — staff only
app.use('/api/competitions', authMiddleware, requireStaff, competitionsRoutes);

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


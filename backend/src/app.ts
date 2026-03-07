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

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SCOUT 21 PRO Backend is running' });
});

// Rotas públicas (sem autenticação)
app.use('/api/auth', authRoutes);

// Rotas protegidas (com autenticação e tenant)
app.use('/api/teams', authMiddleware, tenantMiddleware(), teamsRoutes);
app.use('/api/players', authMiddleware, tenantMiddleware(), playersRoutes);
app.use('/api/matches', authMiddleware, tenantMiddleware(), matchesRoutes);
app.use('/api/schedules', authMiddleware, tenantMiddleware(), schedulesRoutes);
app.use('/api/assessments', authMiddleware, tenantMiddleware(), assessmentsRoutes);
app.use('/api/stat-targets', authMiddleware, tenantMiddleware(), statTargetsRoutes);
app.use('/api/championship-matches', authMiddleware, tenantMiddleware(), championshipMatchesRoutes);
app.use('/api/time-controls', authMiddleware, tenantMiddleware(), timeControlsRoutes);

// Competições são globais (sem tenant, mas com auth)
app.use('/api/competitions', authMiddleware, competitionsRoutes);

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
  });
}

export default app;


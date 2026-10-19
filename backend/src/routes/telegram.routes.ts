import { Router } from 'express';
import { telegramController } from '../controllers/telegram.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePlatformAdmin } from '../middleware/admin.middleware';
import { telegramWebhookSecretMiddleware } from '../middleware/telegramWebhook.middleware';

const router = Router();

/** Operação do bot (status, diagnóstico, registro do webhook). Não cobre o cron. */
const telegramAdmin = [authMiddleware, requirePlatformAdmin] as const;

router.get('/status', ...telegramAdmin, telegramController.status);
router.get('/diagnose', ...telegramAdmin, telegramController.diagnose);
router.post('/webhook', telegramWebhookSecretMiddleware, telegramController.webhook);
router.post('/register-webhook', ...telegramAdmin, telegramController.registerWebhook);
router.post('/delete-webhook', ...telegramAdmin, telegramController.deleteWebhook);
router.get('/cron/reminders', telegramController.cronReminders);
router.post('/cron/reminders', telegramController.cronReminders);

export default router;

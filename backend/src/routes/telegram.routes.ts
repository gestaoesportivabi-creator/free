import { Router } from 'express';
import { telegramController } from '../controllers/telegram.controller';
import { telegramWebhookSecretMiddleware } from '../middleware/telegramWebhook.middleware';

const router = Router();

router.get('/status', telegramController.status);
router.get('/diagnose', telegramController.diagnose);
router.post('/webhook', telegramWebhookSecretMiddleware, telegramController.webhook);
router.post('/register-webhook', telegramController.registerWebhook);
router.post('/delete-webhook', telegramController.deleteWebhook);
router.get('/cron/reminders', telegramController.cronReminders);
router.post('/cron/reminders', telegramController.cronReminders);

export default router;

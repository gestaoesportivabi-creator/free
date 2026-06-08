import { Router } from 'express';
import { webAssistantController } from '../controllers/webAssistant.controller';

const router = Router();

router.get('/status', (req, res) => webAssistantController.status(req, res));
router.post('/chat/stream', (req, res) => webAssistantController.chatStream(req, res));

export default router;

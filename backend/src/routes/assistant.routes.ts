/**
 * Rotas Assistant API — Hermes @scout21coachbot
 */

import { Router } from 'express';
import { env } from '../config/env';
import {
  assistantController,
  assistantProtectedChain,
} from '../controllers/assistant.controller';
import { validateAssistantServiceToken } from '../middleware/assistantAuth.middleware';
import { validateCoachAdminAccess } from '../middleware/coachAdminAuth.middleware';

const router = Router();

function cronAuth(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  const auth = req.headers.authorization;
  const expected = env.CRON_SECRET?.trim();
  if (!expected) {
    return res.status(503).json({ success: false, error: 'CRON_SECRET não configurado' });
  }
  if (auth !== `Bearer ${expected}`) {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }
  next();
  return;
}

router.get('/status', assistantController.status);

router.post('/link', validateAssistantServiceToken, assistantController.link);
router.post('/link-open', validateAssistantServiceToken, assistantController.linkOpen);
router.post('/unlink', validateAssistantServiceToken, assistantController.unlink);

router.get('/briefing', ...assistantProtectedChain, assistantController.briefing);
router.get('/readiness', ...assistantProtectedChain, assistantController.readiness);
router.get('/roster-status', ...assistantProtectedChain, assistantController.rosterStatus);
router.get('/last-match', ...assistantProtectedChain, assistantController.lastMatch);
router.get('/matches', ...assistantProtectedChain, assistantController.matches);
router.get('/opponents', ...assistantProtectedChain, assistantController.opponents);
router.get('/opponents/:key', ...assistantProtectedChain, assistantController.opponentDetail);
router.post('/opponents/:key/videos', ...assistantProtectedChain, assistantController.addOpponentVideo);
router.get('/videos/registry', ...assistantProtectedChain, assistantController.videoRegistry);
router.post('/youtube/paste', ...assistantProtectedChain, assistantController.youtubePaste);
router.post('/youtube-channels', ...assistantProtectedChain, assistantController.addYoutubeChannel);
router.get('/player/:id', ...assistantProtectedChain, assistantController.playerStatus);
router.get('/wellness-engagement', ...assistantProtectedChain, assistantController.wellnessEngagement);
router.get('/pending-wellness', ...assistantProtectedChain, assistantController.pendingWellness);
router.post('/query', ...assistantProtectedChain, assistantController.query);

router.get('/admin/coaches', validateCoachAdminAccess, assistantController.adminCoaches);
router.get('/admin/coach/:chatId/pack', validateCoachAdminAccess, assistantController.adminCoachPack);
router.get('/admin/activity', validateCoachAdminAccess, assistantController.adminActivity);

router.get('/cron/briefings', cronAuth, assistantController.cronBriefings);
router.post('/cron/briefings', cronAuth, assistantController.cronBriefings);

export default router;

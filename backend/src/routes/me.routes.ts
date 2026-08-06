/**
 * Rotas /api/me — portal do atleta
 */

import { Router } from 'express';
import { requireAthlete } from '../middleware/athleteScope.middleware';
import { meController } from '../controllers/me.controller';
import { accountController } from '../controllers/account.controller';
import { demoDataController } from '../controllers/demoData.controller';

const router = Router();

/**
 * Rotas de conta — declaradas ANTES do gate de atleta porque servem
 * técnicos e clubes. Movê-las para depois do `router.use(requireAthlete)`
 * as tornaria inacessíveis a quem realmente precisa delas.
 */
router.get('/subscription', accountController.getSubscription);
router.get('/onboarding', accountController.getOnboarding);
router.post('/demo-data', demoDataController.seed);
router.delete('/demo-data', demoDataController.clear);

router.use(requireAthlete);

router.get('/profile', meController.getProfile);
router.put('/profile', meController.updateProfile);
router.get('/schedule-context', meController.getScheduleContext);
router.get('/wellness/today', meController.getWellnessToday);
router.get('/wellness/:type', meController.getWellnessByType);
router.post('/wellness/:type', meController.saveWellnessByType);

export default router;

/**
 * Rotas /api/me — portal do atleta
 */

import { Router } from 'express';
import { requireAthlete } from '../middleware/athleteScope.middleware';
import { meController } from '../controllers/me.controller';

const router = Router();

router.use(requireAthlete);

router.get('/profile', meController.getProfile);
router.put('/profile', meController.updateProfile);
router.get('/schedule-context', meController.getScheduleContext);
router.get('/wellness/today', meController.getWellnessToday);
router.get('/wellness/:type', meController.getWellnessByType);
router.post('/wellness/:type', meController.saveWellnessByType);

export default router;

/**
 * Routes para Controle de Tempo Jogado
 */

import { Router } from 'express';
import { timeControlsController } from '../controllers/timeControls.controller';

const router = Router();

// GET /api/time-controls?matchId=xxx
router.get('/', timeControlsController.getByMatchId);
// POST /api/time-controls (body: { matchId, timeControls })
router.post('/', timeControlsController.saveForMatch);

export default router;


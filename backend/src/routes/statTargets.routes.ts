/**
 * Routes para Metas de Estatísticas
 */

import { Router } from 'express';
import { statTargetsController } from '../controllers/statTargets.controller';

const router = Router();

// GET retorna array para compatibilidade com frontend
router.get('/', statTargetsController.getAll);
// PUT não precisa de ID
router.put('/', statTargetsController.update);

export default router;


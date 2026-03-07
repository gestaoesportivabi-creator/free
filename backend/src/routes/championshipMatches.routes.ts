/**
 * Routes para Jogos de Campeonato
 */

import { Router } from 'express';
import { championshipMatchesController } from '../controllers/championshipMatches.controller';

const router = Router();

router.get('/', championshipMatchesController.getAll);
router.get('/:id', championshipMatchesController.getById);
router.post('/', championshipMatchesController.create);
router.put('/:id', championshipMatchesController.update);
router.delete('/:id', championshipMatchesController.delete);

export default router;


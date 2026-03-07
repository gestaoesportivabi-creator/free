/**
 * Routes para Jogos/Matches
 */

import { Router } from 'express';
import { matchesController } from '../controllers/matches.controller';

const router = Router();

router.get('/', matchesController.getAll);
router.get('/:id', matchesController.getById);
router.post('/', matchesController.create);
router.put('/:id', matchesController.update);
router.delete('/:id', matchesController.delete);

export default router;


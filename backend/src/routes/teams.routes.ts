/**
 * Routes para Equipes
 */

import { Router } from 'express';
import { teamsController } from '../controllers/teams.controller';

const router = Router();

router.get('/', teamsController.getAll);
router.get('/:id', teamsController.getById);
router.post('/', teamsController.create);
router.put('/:id', teamsController.update);
router.delete('/:id', teamsController.delete);

export default router;

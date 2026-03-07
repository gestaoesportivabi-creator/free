/**
 * Routes para Avaliações Físicas
 */

import { Router } from 'express';
import { assessmentsController } from '../controllers/assessments.controller';

const router = Router();

router.get('/', assessmentsController.getAll);
router.get('/:id', assessmentsController.getById);
router.post('/', assessmentsController.create);
router.put('/:id', assessmentsController.update);
router.delete('/:id', assessmentsController.delete);

export default router;


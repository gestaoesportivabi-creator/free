/**
 * Routes para Programações
 */

import { Router } from 'express';
import { schedulesController } from '../controllers/schedules.controller';

const router = Router();

router.get('/', schedulesController.getAll);
router.get('/:id', schedulesController.getById);
router.post('/', schedulesController.create);
router.put('/:id', schedulesController.update);
router.delete('/:id', schedulesController.delete);

export default router;


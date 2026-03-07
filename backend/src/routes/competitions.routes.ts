/**
 * Routes para Competições
 */

import { Router } from 'express';
import { competitionsController } from '../controllers/competitions.controller';

const router = Router();

router.get('/', competitionsController.getAll);
router.get('/:id', competitionsController.getById);
router.post('/', competitionsController.create);

export default router;


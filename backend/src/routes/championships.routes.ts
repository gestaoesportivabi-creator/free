import { Router } from 'express';
import { championshipsController } from '../controllers/championships.controller';

const router = Router();

router.get('/', championshipsController.getAll);
router.post('/', championshipsController.create);
router.put('/:id', championshipsController.update);
router.delete('/:id', championshipsController.delete);

export default router;

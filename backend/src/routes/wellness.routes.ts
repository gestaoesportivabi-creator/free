import { Router } from 'express';
import { wellnessController } from '../controllers/wellness.controller';

const router = Router();

// Funções soltas: passar o método do objeto ao Express zera `this` e o
// ramo bem-estar-diario virava TypeError → 500 em todo GET/POST.
router.get('/:type', (req, res, next) => {
  wellnessController.getAll(req, res).catch(next);
});

router.post('/:type/bulk', (req, res, next) => {
  wellnessController.saveBulk(req, res).catch(next);
});

export default router;

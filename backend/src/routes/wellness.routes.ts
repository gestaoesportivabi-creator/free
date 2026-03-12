import { Router } from 'express';
import { wellnessController } from '../controllers/wellness.controller';

const router = Router();

// Buscar todos de um tipo específico (pse-treino, pse-jogo, psr-treino, psr-jogo, qualidade-sono)
router.get('/:type', wellnessController.getAll);

// Salvar / Sincronizar em lote
router.post('/:type/bulk', wellnessController.saveBulk);

export default router;

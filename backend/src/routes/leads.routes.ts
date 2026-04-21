/**
 * Rota pública de captura de leads.
 * Não requer autenticação nem tenant — ver [leads.controller.ts] para rate-limit.
 */
import { Router } from 'express';
import { leadsController } from '../controllers/leads.controller';

const router = Router();

router.post('/', leadsController.create);

export default router;

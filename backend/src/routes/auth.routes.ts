/**
 * Routes para Autenticação
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePlatformAdmin } from '../middleware/admin.middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authMiddleware, authController.profile);
router.put('/profile', authMiddleware, authController.updateProfile);

router.post('/admin/users', authMiddleware, requirePlatformAdmin, authController.adminCreateUser);
router.get('/admin/users', authMiddleware, requirePlatformAdmin, authController.listUsers);
router.patch('/admin/users/:userId', authMiddleware, requirePlatformAdmin, authController.adminUpdateUser);
router.get('/admin/stats', authMiddleware, requirePlatformAdmin, authController.adminStats);

export default router;

/**
 * Routes para Autenticação
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authEmailController } from '../controllers/authEmail.controller';
import { platformAdminController } from '../controllers/platformAdmin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePlatformAdmin } from '../middleware/admin.middleware';

const router = Router();
const admin = [authMiddleware, requirePlatformAdmin] as const;

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authEmailController.forgotPassword);
router.post('/reset-password', authEmailController.resetPassword);
router.post('/magic-link', authEmailController.requestMagicLink);
router.post('/magic-link/verify', authEmailController.verifyMagicLink);
router.post('/verify-email', authEmailController.verifyEmail);
router.get('/profile', authMiddleware, authController.profile);
router.put('/profile', authMiddleware, authController.updateProfile);

router.post('/admin/users', ...admin, authController.adminCreateUser);
router.get('/admin/users', ...admin, authController.listUsers);
router.get('/admin/users/:userId/insights', ...admin, platformAdminController.userInsights);
router.get('/admin/users/:userId', ...admin, platformAdminController.userDetail);
router.patch('/admin/users/:userId', ...admin, authController.adminUpdateUser);
router.get('/admin/stats', ...admin, authController.adminStats);

router.get('/admin/overview', ...admin, platformAdminController.overview);
router.get('/admin/tenants', ...admin, platformAdminController.tenants);
router.get('/admin/assistant/activity', ...admin, platformAdminController.assistantActivity);
router.get('/admin/system/health', ...admin, platformAdminController.systemHealth);

export default router;

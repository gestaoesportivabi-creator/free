/**
 * Routes para Autenticação
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authEmailController } from '../controllers/authEmail.controller';
import { platformAdminController } from '../controllers/platformAdmin.controller';
import { trialAdminController } from '../controllers/trialAdmin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePlatformAdmin } from '../middleware/admin.middleware';
import { emailKey, rateLimit } from '../middleware/rateLimit.middleware';

const router = Router();
const admin = [authMiddleware, requirePlatformAdmin] as const;

const HOUR = 60 * 60 * 1000;

/**
 * Limites do cadastro público. Dois eixos, porque cada um cobre um ataque diferente:
 * por IP trava criação em massa de uma origem; por e-mail trava retentativa
 * insistente no mesmo endereço.
 */
const signupIpLimit = rateLimit({
  scope: 'signup-ip',
  windowMs: HOUR,
  max: parseInt(process.env.SIGNUP_RATE_LIMIT_PER_IP_HOUR || '3', 10),
  message: 'Muitas tentativas de cadastro. Tente novamente dentro de uma hora.',
});

const signupEmailLimit = rateLimit({
  scope: 'signup-email',
  windowMs: 24 * HOUR,
  max: 1,
  keyFrom: emailKey('signup'),
  message: 'Já existe um cadastro recente com este e-mail. Verifique a sua caixa de entrada.',
});

/** Rotas que disparam e-mail: mais frouxas que o cadastro, mas não abertas. */
const emailSendLimit = rateLimit({
  scope: 'auth-email',
  windowMs: HOUR,
  max: 5,
  message: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.',
});

/** Login: trava força-bruta sem punir quem só errou a senha uma vez. */
const loginLimit = rateLimit({
  scope: 'login',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de login. Aguarde 15 minutos.',
});

router.post('/login', loginLimit, authController.login);
router.post('/register', signupIpLimit, signupEmailLimit, authController.register);
router.post('/check-email', rateLimit({ scope: 'check-email', windowMs: HOUR, max: 30 }), authController.checkEmail);
router.post('/forgot-password', emailSendLimit, authEmailController.forgotPassword);
router.post('/reset-password', authEmailController.resetPassword);
router.post('/magic-link', emailSendLimit, authEmailController.requestMagicLink);
router.post('/magic-link/verify', authEmailController.verifyMagicLink);
router.post('/verify-email', authEmailController.verifyEmail);
router.post('/resend-verification', authMiddleware, emailSendLimit, authEmailController.resendVerification);
router.get('/profile', authMiddleware, authController.profile);
router.put('/profile', authMiddleware, authController.updateProfile);

router.post('/admin/users', ...admin, authController.adminCreateUser);
router.get('/admin/users', ...admin, authController.listUsers);
router.get('/admin/users/:userId/insights', ...admin, platformAdminController.userInsights);
router.get('/admin/users/:userId', ...admin, platformAdminController.userDetail);
router.patch('/admin/users/:userId', ...admin, authController.adminUpdateUser);
router.get('/admin/stats', ...admin, authController.adminStats);

router.get('/admin/trials', ...admin, trialAdminController.list);
router.post('/admin/trials/:userId/extend', ...admin, trialAdminController.extend);

router.get('/admin/overview', ...admin, platformAdminController.overview);
router.get('/admin/tenants', ...admin, platformAdminController.tenants);
router.get('/admin/assistant/activity', ...admin, platformAdminController.assistantActivity);
router.get('/admin/system/health', ...admin, platformAdminController.systemHealth);

export default router;

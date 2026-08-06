/**
 * Fluxos de e-mail transacional na autenticação (1A).
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { EmailAuthPurpose } from '@prisma/client';
import prisma from '../config/database';
import { consumeEmailAuthToken } from '../services/email/authToken.service';
import {
  resendVerificationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
} from '../services/email/email.service';
import { buildAuthSessionForUser } from '../utils/authSession.helper';
import { normalizeAccessEmail } from '../utils/athleteAccount.helper';

const GENERIC_OK =
  'Se existir uma conta com este e-mail, você receberá as instruções em instantes.';

async function findActiveUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: normalizeAccessEmail(email) },
    select: { id: true, email: true, name: true, isActive: true },
  });
}

export const authEmailController = {
  /** POST /api/auth/forgot-password */
  forgotPassword: async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim();
      if (!email) {
        return res.status(400).json({ success: false, error: 'E-mail é obrigatório' });
      }

      const user = await findActiveUserByEmail(email);
      if (user?.isActive) {
        await sendPasswordResetEmail({
          userId: user.id,
          email: user.email,
          name: user.name,
        }).catch((err) => console.error('[auth/forgot-password] email:', err));
      }

      return res.json({ success: true, message: GENERIC_OK });
    } catch (error) {
      console.error('[auth/forgot-password]', error);
      return res.status(500).json({ success: false, error: 'Erro ao processar pedido' });
    }
  },

  /** POST /api/auth/reset-password */
  resetPassword: async (req: Request, res: Response) => {
    try {
      const token = String(req.body?.token || '').trim();
      const password = String(req.body?.password || '');

      if (!token || !password) {
        return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      const consumed = await consumeEmailAuthToken(token, EmailAuthPurpose.password_reset);
      if (!consumed) {
        return res.status(400).json({ success: false, error: 'Link inválido ou expirado' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: consumed.userId },
        data: { passwordHash },
      });

      return res.json({ success: true, message: 'Senha redefinida com sucesso. Você já pode entrar.' });
    } catch (error) {
      console.error('[auth/reset-password]', error);
      return res.status(500).json({ success: false, error: 'Erro ao redefinir senha' });
    }
  },

  /** POST /api/auth/magic-link */
  requestMagicLink: async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim();
      if (!email) {
        return res.status(400).json({ success: false, error: 'E-mail é obrigatório' });
      }

      const user = await findActiveUserByEmail(email);
      if (user?.isActive) {
        await sendMagicLinkEmail({
          userId: user.id,
          email: user.email,
          name: user.name,
        }).catch((err) => console.error('[auth/magic-link] email:', err));
      }

      return res.json({ success: true, message: GENERIC_OK });
    } catch (error) {
      console.error('[auth/magic-link]', error);
      return res.status(500).json({ success: false, error: 'Erro ao processar pedido' });
    }
  },

  /** POST /api/auth/magic-link/verify */
  verifyMagicLink: async (req: Request, res: Response) => {
    try {
      const token = String(req.body?.token || '').trim();
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token é obrigatório' });
      }

      const consumed = await consumeEmailAuthToken(token, EmailAuthPurpose.magic_link);
      if (!consumed) {
        return res.status(400).json({ success: false, error: 'Link inválido ou expirado' });
      }

      const session = await buildAuthSessionForUser(consumed.userId);
      return res.json({ success: true, data: session });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'USER_INACTIVE') {
        return res.status(401).json({ success: false, error: 'Conta inativa' });
      }
      console.error('[auth/magic-link/verify]', error);
      return res.status(500).json({ success: false, error: 'Erro ao validar link' });
    }
  },

  /** POST /api/auth/verify-email */
  verifyEmail: async (req: Request, res: Response) => {
    try {
      const token = String(req.body?.token || '').trim();
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token é obrigatório' });
      }

      const consumed = await consumeEmailAuthToken(token, EmailAuthPurpose.email_verify);
      if (!consumed) {
        return res.status(400).json({ success: false, error: 'Link inválido ou expirado' });
      }

      await prisma.user.update({
        where: { id: consumed.userId },
        data: { emailVerifiedAt: new Date() },
      });

      return res.json({ success: true, message: 'E-mail confirmado com sucesso.' });
    } catch (error) {
      console.error('[auth/verify-email]', error);
      return res.status(500).json({ success: false, error: 'Erro ao confirmar e-mail' });
    }
  },

  /**
   * POST /api/auth/resend-verification — autenticado.
   * Serve o banner "confirme seu e-mail" do dashboard. Ao contrário do
   * forgot-password, aqui o utilizador já provou identidade com o JWT.
   */
  resendVerification: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, emailVerifiedAt: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      }

      if (user.emailVerifiedAt) {
        return res.json({ success: true, message: 'Seu e-mail já está confirmado.', alreadyVerified: true });
      }

      await resendVerificationEmail({ userId: user.id, email: user.email, name: user.name });

      return res.json({
        success: true,
        message: 'Enviámos um novo link de confirmação para o seu e-mail.',
      });
    } catch (error) {
      console.error('[auth/resend-verification]', error);
      return res.status(500).json({ success: false, error: 'Erro ao reenviar confirmação' });
    }
  },
};

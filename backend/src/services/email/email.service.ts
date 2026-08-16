import { EmailAuthPurpose } from '@prisma/client';
import { env } from '../../config/env';
import {
  buildFrontendAuthUrl,
  createEmailAuthToken,
  getTokenTtlHours,
  getTokenTtlMinutes,
} from './authToken.service';
import { getResendClient, isEmailSendingEnabled } from './resend.client';
import { renderEmailVerifyEmail } from './templates/email-verify';
import { renderMagicLinkEmail } from './templates/magic-link';
import { renderPasswordResetEmail } from './templates/password-reset';
import { renderWelcomeEmail } from './templates/welcome';
import { renderTrialWelcomeEmail } from './templates/trial-welcome';
import { renderTrialLifecycleEmail, type TrialEmailKey } from './templates/trial-lifecycle';
import type { EmailRecipient, SendEmailResult } from './types';

async function deliverEmail(
  id: SendEmailResult['id'],
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  if (!isEmailSendingEnabled()) {
    if (env.NODE_ENV === 'production') {
      // Em produção este caminho é uma falha operacional, não um modo de dev:
      // o token é criado e o utilizador nunca recebe o link. Silenciar isto
      // custou um diagnóstico inteiro — ver docs/DOMINIO_SCOUT21.md §7.
      console.error(
        `[email] NÃO ENVIADO (${id}) → ${to}: ${
          env.EMAIL_DISABLED ? 'EMAIL_DISABLED=true' : 'RESEND_API_KEY ausente'
        }`
      );
    } else {
      console.info(`[email] skip send (${id}) → ${to} | ${subject}`);
    }
    return { id, skipped: true };
  }

  const resend = getResendClient();
  if (!resend) {
    return { id, skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
  });

  if (error) {
    console.error(`[email] Resend error (${id}):`, error);
    throw new Error(error.message || 'Falha ao enviar e-mail');
  }

  return { id, providerId: data?.id };
}

export async function sendPasswordResetEmail(recipient: EmailRecipient): Promise<SendEmailResult> {
  const { rawToken } = await createEmailAuthToken(recipient.userId, EmailAuthPurpose.password_reset);
  const resetUrl = buildFrontendAuthUrl('/login/reset-password', rawToken);
  const { subject, html } = renderPasswordResetEmail({
    recipientName: recipient.name,
    resetUrl,
    expiresMinutes: getTokenTtlMinutes(EmailAuthPurpose.password_reset),
  });
  return deliverEmail('password_reset', recipient.email, subject, html);
}

export async function sendMagicLinkEmail(recipient: EmailRecipient): Promise<SendEmailResult> {
  const { rawToken } = await createEmailAuthToken(recipient.userId, EmailAuthPurpose.magic_link);
  const loginUrl = buildFrontendAuthUrl('/login/magic-link', rawToken);
  const { subject, html } = renderMagicLinkEmail({
    recipientName: recipient.name,
    loginUrl,
    expiresMinutes: getTokenTtlMinutes(EmailAuthPurpose.magic_link),
  });
  return deliverEmail('magic_link', recipient.email, subject, html);
}

export async function sendWelcomeEmail(recipient: EmailRecipient): Promise<SendEmailResult> {
  const loginUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/login`;
  const { subject, html } = renderWelcomeEmail({
    recipientName: recipient.name,
    loginUrl,
  });
  return deliverEmail('welcome', recipient.email, subject, html);
}

export async function sendEmailVerificationEmail(recipient: EmailRecipient): Promise<SendEmailResult> {
  const { rawToken } = await createEmailAuthToken(recipient.userId, EmailAuthPurpose.email_verify);
  const verifyUrl = buildFrontendAuthUrl('/login/verify-email', rawToken);
  const { subject, html } = renderEmailVerifyEmail({
    recipientName: recipient.name,
    verifyUrl,
    expiresHours: getTokenTtlHours(EmailAuthPurpose.email_verify),
  });
  return deliverEmail('email_verify', recipient.email, subject, html);
}

/**
 * Boas-vindas do auto-cadastro: um único e-mail que junta acolhimento,
 * verificação e a promessa de não-cobrança.
 *
 * Substitui o par welcome+verify para quem entra pelo teste gratuito — dois
 * e-mails ao mesmo tempo diluem a atenção e dobram o risco de spam.
 */
export async function sendTrialWelcomeEmail(params: {
  userId: string;
  email: string;
  name: string;
  trialEndsAt: Date;
  trialDays: number;
}): Promise<SendEmailResult | void> {
  try {
    const { rawToken } = await createEmailAuthToken(params.userId, EmailAuthPurpose.email_verify);
    const verifyUrl = buildFrontendAuthUrl('/login/verify-email', rawToken);
    const { subject, html } = renderTrialWelcomeEmail({
      recipientName: params.name,
      verifyUrl,
      trialEndsAt: params.trialEndsAt,
      trialDays: params.trialDays,
    });
    return await deliverEmail('trial_welcome', params.email, subject, html);
  } catch (error) {
    // Nunca derruba o cadastro: a conta já existe e o utilizador já tem sessão.
    console.error('[email] trial welcome failed:', error);
  }
}

/** Reenvio do link de verificação, a pedido do utilizador. */
export async function resendVerificationEmail(recipient: EmailRecipient): Promise<SendEmailResult | void> {
  try {
    return await sendEmailVerificationEmail(recipient);
  } catch (error) {
    console.error('[email] resend verification failed:', error);
  }
}

/** E-mail do ciclo de vida do teste, disparado pelo cron diário. */
export async function sendTrialLifecycleEmail(
  key: TrialEmailKey,
  recipient: EmailRecipient,
  context: { daysRemaining: number; trialDays: number; playerCount: number; matchCount: number }
): Promise<SendEmailResult> {
  const appUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/dashboard`;
  const { subject, html } = renderTrialLifecycleEmail(key, {
    recipientName: recipient.name,
    appUrl,
    ...context,
  });
  return deliverEmail('trial_lifecycle', recipient.email, subject, html);
}

/** Boas-vindas + verificação opcional após cadastro */
export async function sendAccountCreatedEmails(recipient: EmailRecipient): Promise<void> {
  await sendWelcomeEmail(recipient).catch((err) => {
    console.error('[email] welcome failed:', err);
  });
  await sendEmailVerificationEmail(recipient).catch((err) => {
    console.error('[email] verify failed:', err);
  });
}

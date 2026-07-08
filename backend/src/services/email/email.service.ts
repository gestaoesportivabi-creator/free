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
import type { EmailRecipient, SendEmailResult } from './types';

async function deliverEmail(
  id: SendEmailResult['id'],
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  if (!isEmailSendingEnabled()) {
    if (env.NODE_ENV === 'development') {
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

/** Boas-vindas + verificação opcional após cadastro */
export async function sendAccountCreatedEmails(recipient: EmailRecipient): Promise<void> {
  await sendWelcomeEmail(recipient).catch((err) => {
    console.error('[email] welcome failed:', err);
  });
  await sendEmailVerificationEmail(recipient).catch((err) => {
    console.error('[email] verify failed:', err);
  });
}

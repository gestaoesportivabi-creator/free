import { Resend } from 'resend';
import { env } from '../../config/env';

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY || env.EMAIL_DISABLED) return null;
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export function isEmailSendingEnabled(): boolean {
  return Boolean(env.RESEND_API_KEY) && !env.EMAIL_DISABLED;
}

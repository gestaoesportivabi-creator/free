/**
 * Tipos do sistema de e-mail transacional (1A).
 * Templates HTML aqui espelham props futuras de React Email (.tsx).
 */

export type TransactionalEmailId =
  | 'password_reset'
  | 'magic_link'
  | 'welcome'
  | 'email_verify';

export interface EmailRecipient {
  userId: string;
  email: string;
  name: string;
}

export interface PasswordResetTemplateProps {
  recipientName: string;
  resetUrl: string;
  expiresMinutes: number;
}

export interface MagicLinkTemplateProps {
  recipientName: string;
  loginUrl: string;
  expiresMinutes: number;
}

export interface WelcomeTemplateProps {
  recipientName: string;
  loginUrl: string;
}

export interface EmailVerifyTemplateProps {
  recipientName: string;
  verifyUrl: string;
  expiresHours: number;
}

export interface SendEmailResult {
  id: TransactionalEmailId;
  providerId?: string;
  skipped?: boolean;
}

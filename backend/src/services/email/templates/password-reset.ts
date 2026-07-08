import type { PasswordResetTemplateProps } from '../types';
import { emailLayout, primaryButton } from './base';

export function renderPasswordResetEmail(props: PasswordResetTemplateProps): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#fafafa;">Olá, <strong>${escapeHtml(props.recipientName)}</strong>.</p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d4d4d8;">Recebemos um pedido para redefinir a senha da sua conta no SCOUT21.</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">O link abaixo expira em <strong>${props.expiresMinutes} minutos</strong>.</p>
    ${primaryButton(props.resetUrl, 'Redefinir senha')}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#71717a;word-break:break-all;">Ou copie e cole no navegador:<br/><span style="color:#a1a1aa;">${escapeHtml(props.resetUrl)}</span></p>
  `;

  return {
    subject: 'Redefinir sua senha — SCOUT21',
    html: emailLayout(content),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

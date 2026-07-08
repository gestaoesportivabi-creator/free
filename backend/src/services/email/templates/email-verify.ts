import type { EmailVerifyTemplateProps } from '../types';
import { emailLayout, primaryButton } from './base';

export function renderEmailVerifyEmail(props: EmailVerifyTemplateProps): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#fafafa;">Olá, <strong>${escapeHtml(props.recipientName)}</strong>.</p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d4d4d8;">Confirme seu endereço de e-mail para concluir o cadastro no SCOUT21.</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">Este link expira em <strong>${props.expiresHours} horas</strong>.</p>
    ${primaryButton(props.verifyUrl, 'Confirmar e-mail')}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#71717a;word-break:break-all;">Link alternativo:<br/><span style="color:#a1a1aa;">${escapeHtml(props.verifyUrl)}</span></p>
  `;

  return {
    subject: 'Confirme seu e-mail — SCOUT21',
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

import type { MagicLinkTemplateProps } from '../types';
import { emailLayout, primaryButton } from './base';

export function renderMagicLinkEmail(props: MagicLinkTemplateProps): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#fafafa;">Olá, <strong>${escapeHtml(props.recipientName)}</strong>.</p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d4d4d8;">Use o link abaixo para entrar no SCOUT21 sem digitar senha.</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">Válido por <strong>${props.expiresMinutes} minutos</strong>.</p>
    ${primaryButton(props.loginUrl, 'Entrar no SCOUT21')}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#71717a;word-break:break-all;">Link alternativo:<br/><span style="color:#a1a1aa;">${escapeHtml(props.loginUrl)}</span></p>
  `;

  return {
    subject: 'Seu link de acesso — SCOUT21',
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

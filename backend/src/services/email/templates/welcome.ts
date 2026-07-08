import type { WelcomeTemplateProps } from '../types';
import { emailLayout, primaryButton } from './base';

export function renderWelcomeEmail(props: WelcomeTemplateProps): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#fafafa;">Bem-vindo(a), <strong>${escapeHtml(props.recipientName)}</strong>!</p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d4d4d8;">Sua conta no SCOUT21 foi criada com sucesso. A partir de agora você pode acompanhar performance, bem-estar e gestão do seu time em um só lugar.</p>
    ${primaryButton(props.loginUrl, 'Acessar plataforma')}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">Dúvidas? Responda este e-mail ou fale conosco pelo suporte.</p>
  `;

  return {
    subject: 'Bem-vindo ao SCOUT21',
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

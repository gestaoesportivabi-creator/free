/**
 * Boas-vindas do teste gratuito — o único e-mail que TODO utilizador recebe.
 *
 * Três trabalhos, nesta ordem de importância:
 *  1. dizer com todas as letras que não haverá cobrança (objeção nº 1 de qualquer trial);
 *  2. dar o link de verificação;
 *  3. levar de volta ao produto.
 */

import type { TrialWelcomeTemplateProps } from '../types';
import { emailLayout, primaryButton } from './base';

export function renderTrialWelcomeEmail(props: TrialWelcomeTemplateProps): {
  subject: string;
  html: string;
} {
  const endLabel = props.trialEndsAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const content = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#fafafa;">
      Bem-vindo, <strong>${escapeHtml(props.recipientName)}</strong>.
    </p>

    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#d4d4d8;">
      A sua conta do SCOUT21 está pronta e o teste de <strong>${props.trialDays} dias</strong> começou.
      Você tem acesso completo à plataforma até <strong>${endLabel}</strong>.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="margin:20px 0;background:#0f0f10;border:1px solid #27272a;border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;">
            Sem surpresas
          </p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#d4d4d8;">
            Não pedimos cartão de crédito nem Pix. <strong style="color:#fafafa;">Nada será cobrado</strong>
            ao fim do teste — nem automaticamente, nem depois. Quando os ${props.trialDays} dias acabarem,
            os seus dados continuam salvos e acessíveis.
          </p>
        </td>
      </tr>
    </table>

    ${primaryButton(props.verifyUrl, 'Confirmar e-mail e começar')}

    <p style="margin:20px 0 8px;font-size:13px;line-height:1.7;color:#d4d4d8;">
      <strong style="color:#fafafa;">Para tirar valor logo no primeiro dia:</strong>
    </p>
    <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;line-height:1.9;color:#d4d4d8;">
      <li>Cadastre o seu elenco (dá para colar direto de uma planilha)</li>
      <li>Registe um jogo — ao vivo ou pela súmula</li>
      <li>Veja os indicadores da equipa e de cada atleta</li>
    </ol>

    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
      Precisa de ajuda? Responda a este e-mail — uma pessoa lê.
    </p>
  `;

  return {
    subject: `Seu teste de ${props.trialDays} dias no SCOUT21 começou`,
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

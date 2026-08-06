/**
 * E-mails do ciclo de vida do teste gratuito.
 *
 * Regras que valem para todos:
 *  - tom informativo, nunca alarmista: o utilizador não fez nada de errado;
 *  - dizer sempre o que acontece com os dados (a ansiedade real é perder trabalho);
 *  - um único call-to-action por e-mail.
 *
 * As chaves (`TrialEmailKey`) são gravadas em `trial_email_logs` e garantem que
 * o cron nunca envia o mesmo e-mail duas vezes.
 */

import { emailLayout, primaryButton } from './base';

export type TrialEmailKey =
  | 'trial_day1_start'
  | 'trial_day3_tip'
  | 'trial_day7_checkin'
  | 'trial_day15_midpoint'
  | 'trial_day23_ending'
  | 'trial_day28_final'
  | 'trial_expired'
  | 'trial_winback';

export interface TrialLifecycleProps {
  recipientName: string;
  appUrl: string;
  daysRemaining: number;
  trialDays: number;
  /** Contexto para personalizar: o que a conta já tem. */
  playerCount: number;
  matchCount: number;
}

interface Rendered {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#d4d4d8;">${text}</p>`;
}

function calloutBox(title: string, body: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="margin:18px 0;background:#0f0f10;border:1px solid #27272a;border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 6px;font-size:11px;line-height:1.6;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;">${title}</p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#d4d4d8;">${body}</p>
    </td></tr>
  </table>`;
}

const NO_CHARGE_NOTE =
  'Continuamos sem pedir cartão. <strong style="color:#fafafa;">Nada será cobrado</strong> — nem agora, nem no fim do teste.';

export function renderTrialLifecycleEmail(key: TrialEmailKey, props: TrialLifecycleProps): Rendered {
  const name = escapeHtml(props.recipientName.split(' ')[0] || props.recipientName);

  switch (key) {
    case 'trial_day1_start':
      return {
        subject: 'Três passos para tirar valor do SCOUT21 hoje',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph('Reparámos que a sua conta ainda está a começar. Estes três passos levam menos de cinco minutos e já mostram o produto a trabalhar:')}
          <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:2;color:#d4d4d8;">
            <li><strong style="color:#fafafa;">Cadastre o elenco</strong> — dá para colar de uma planilha</li>
            <li><strong style="color:#fafafa;">Registe um jogo</strong> — ao vivo ou pela súmula</li>
            <li><strong style="color:#fafafa;">Abra os indicadores</strong> — é onde o valor aparece</li>
          </ol>
          ${paragraph('Se preferir ver o sistema já preenchido antes de lançar os seus dados, carregue os dados de demonstração no painel e remova depois com um clique.')}
          ${primaryButton(props.appUrl, 'Continuar de onde parei')}
        `),
      };

    case 'trial_day3_tip':
      return {
        subject: 'Como registar um jogo em menos de 2 minutos',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph('A coleta do SCOUT21 tem dois modos, e escolher o certo poupa muito tempo:')}
          ${calloutBox(
            'Ao vivo',
            'Cronómetro, atalhos de teclado e registo por toque. Ideal para quem acompanha o jogo da beira da quadra.'
          )}
          ${calloutBox(
            'Pela súmula',
            'Lançamento depois do jogo, com o tempo digitado. Ideal para quem recebe a folha pronta ou revê o vídeo.'
          )}
          ${paragraph('Os dois alimentam exatamente os mesmos indicadores — pode alternar entre eles quando quiser.')}
          ${primaryButton(props.appUrl, 'Registar um jogo')}
        `),
      };

    case 'trial_day7_checkin':
      return {
        subject: 'Uma semana de SCOUT21 — como está a correr?',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph(
            props.matchCount > 0
              ? `Já tem <strong style="color:#fafafa;">${props.matchCount} jogo(s)</strong> e <strong style="color:#fafafa;">${props.playerCount} atleta(s)</strong> registados. A partir do terceiro jogo os gráficos de tendência começam a ficar úteis de verdade.`
              : 'A sua conta está pronta mas ainda sem jogos registados. Um único jogo já liga os indicadores da equipa e o ranking individual.'
          )}
          ${paragraph('Se alguma coisa não está a encaixar no seu fluxo de trabalho, responda a este e-mail a dizer o quê. Lemos todas as respostas e isso orienta o que construímos a seguir.')}
          ${primaryButton(props.appUrl, 'Abrir o SCOUT21')}
        `),
      };

    case 'trial_day15_midpoint':
      return {
        subject: `Metade do teste — faltam ${props.daysRemaining} dias`,
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph(`Passaram 15 dias do seu teste e faltam <strong style="color:#fafafa;">${props.daysRemaining}</strong>.`)}
          ${paragraph('Se ainda não explorou, estas três áreas costumam ser as que mais surpreendem:')}
          <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:2;color:#d4d4d8;">
            <li><strong style="color:#fafafa;">Scout individual</strong> — evolução atleta a atleta</li>
            <li><strong style="color:#fafafa;">Bem-estar e PSE</strong> — carga e recuperação do elenco</li>
            <li><strong style="color:#fafafa;">Relatório gerencial</strong> — o resumo para levar à direção</li>
          </ul>
          ${primaryButton(props.appUrl, 'Explorar')}
        `),
      };

    case 'trial_day23_ending':
      return {
        subject: `Faltam ${props.daysRemaining} dias do seu teste`,
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph(`O seu teste do SCOUT21 termina em <strong style="color:#fafafa;">${props.daysRemaining} dias</strong>.`)}
          ${calloutBox(
            'O que acontece depois',
            'Você continua a poder consultar e exportar tudo o que registou. O que fica bloqueado é apenas o lançamento de novos dados. Nada é apagado.'
          )}
          ${paragraph(NO_CHARGE_NOTE)}
          ${primaryButton(props.appUrl, 'Abrir o SCOUT21')}
        `),
      };

    case 'trial_day28_final':
      return {
        subject: 'Seu teste termina em 2 dias',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph('Faltam dois dias para o fim do seu período de teste.')}
          ${paragraph(
            props.matchCount > 0
              ? `Neste período registou <strong style="color:#fafafa;">${props.matchCount} jogo(s)</strong> com <strong style="color:#fafafa;">${props.playerCount} atleta(s)</strong>. Tudo isso continua seu.`
              : 'Ainda dá tempo de registar um jogo e ver os indicadores a funcionar com os seus próprios dados.'
          )}
          ${calloutBox(
            'Sem cobrança automática',
            'Não temos o seu cartão e não vamos pedir. Ao fim do teste o acesso passa a leitura e exportação — sem nenhuma cobrança.'
          )}
          ${primaryButton(props.appUrl, 'Abrir o SCOUT21')}
        `),
      };

    case 'trial_expired':
      return {
        subject: 'Seu teste do SCOUT21 terminou',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph('O seu período de teste de 30 dias chegou ao fim. Obrigado por experimentar o SCOUT21.')}
          ${calloutBox(
            'Seus dados continuam seus',
            `${props.matchCount > 0 ? `Os ${props.matchCount} jogo(s) que registou continuam` : 'Tudo o que registou continua'} disponível para consulta e exportação. Não apagámos nada.`
          )}
          ${paragraph('Se quiser continuar a lançar dados novos, responda a este e-mail e falamos sobre as opções. Se quiser mais tempo para avaliar, também podemos estender o teste — basta pedir.')}
          ${primaryButton(props.appUrl, 'Ver e exportar meus dados')}
        `),
      };

    case 'trial_winback':
      return {
        subject: 'Podemos estender seu teste do SCOUT21?',
        html: emailLayout(`
          ${paragraph(`Olá, ${name}.`)}
          ${paragraph('Passou uma semana desde o fim do seu teste. Se não deu para avaliar como queria — temporada parada, correria, o que for — podemos reabrir o acesso por mais uns dias.')}
          ${paragraph('Basta responder a este e-mail com um "quero mais tempo". Sem formulário, sem compromisso.')}
          ${paragraph('E se o SCOUT21 simplesmente não é para si agora, também ajuda saber porquê. Uma linha basta.')}
          ${primaryButton(props.appUrl, 'Ver minha conta')}
        `),
      };
  }
}

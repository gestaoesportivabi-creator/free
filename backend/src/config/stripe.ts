/**
 * Configuração do Stripe — 100% por variáveis de ambiente, lidas sob demanda
 * (testes e redeploys mudam a env sem reiniciar o módulo).
 *
 * Sem as variáveis o app funciona normalmente: o billing fica desligado e o
 * frontend esconde os botões de pagamento. Ver docs/STRIPE_SETUP.md.
 */

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  pricePro: string;
  /** Para onde o Stripe devolve o cliente depois do checkout/portal. */
  frontendUrl: string;
  /** Plano Scout concedido pelo preço PRO. */
  proPlan: 'PERFORMANCE';
}

function clean(value: string | undefined): string {
  return (value || '').trim();
}

export function getStripeConfig(): StripeConfig {
  return {
    secretKey: clean(process.env.STRIPE_SECRET_KEY),
    webhookSecret: clean(process.env.STRIPE_WEBHOOK_SECRET),
    pricePro: clean(process.env.STRIPE_PRICE_ID_PRO),
    frontendUrl:
      clean(process.env.FRONTEND_URL) ||
      (process.env.NODE_ENV === 'production' ? 'https://scout21.com.br' : 'http://localhost:5173'),
    proPlan: 'PERFORMANCE',
  };
}

/** Checkout e portal precisam de chave secreta + preço PRO. */
export function isCheckoutEnabled(config: StripeConfig = getStripeConfig()): boolean {
  return Boolean(config.secretKey && config.pricePro);
}

/** O portal só exige a chave secreta (o cliente já existe). */
export function isPortalEnabled(config: StripeConfig = getStripeConfig()): boolean {
  return Boolean(config.secretKey);
}

/** O webhook só aceita eventos com segredo de assinatura configurado. */
export function isWebhookEnabled(config: StripeConfig = getStripeConfig()): boolean {
  return Boolean(config.webhookSecret);
}

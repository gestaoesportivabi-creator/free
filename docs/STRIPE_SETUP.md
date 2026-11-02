# Stripe — como ligar o pagamento do plano PRO

O código já está pronto. Sem as variáveis abaixo **nada muda**: o app funciona normal, o webhook responde 503 e os botões de pagamento não aparecem (o aviso de teste expirado continua mostrando o contato por e-mail).

PRO = plano `PERFORMANCE`. Não há mudança obrigatória no banco (ver `docs/STRIPE_SQL.md`).

## 1. Variáveis (Vercel → Project → Settings → Environment Variables)

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (teste) ou `sk_live_...` | sim, para checkout e portal |
| `STRIPE_PRICE_ID_PRO` | `price_...` do plano PRO (recorrente) | sim, para checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` do endpoint de webhook | sim, para o webhook |
| `ADMIN_PRO_EMAILS` | e-mails separados por vírgula, ex.: `a@x.com,b@y.com` | não |
| `FRONTEND_URL` | já existe (`https://scout21.com.br`); usado nas URLs de retorno | — |

Use chaves **de teste** em Preview e **live** só em Production. Nunca coloque chaves no git.

## 2. Webhook no Stripe

Dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://scout21.com.br/api/stripe/webhook`
- **Eventos:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copie o *Signing secret* (`whsec_...`) para `STRIPE_WEBHOOK_SECRET` e faça redeploy.

A rota passa pelo `api/index.ts` (rewrite `/api/*` já existente) e usa o corpo cru para conferir a assinatura.

## 3. Portal do cliente

Dashboard → Settings → Billing → Customer portal: ative e permita **cancelar assinatura** e atualizar forma de pagamento.

## 4. Admins PRO para sempre

`ADMIN_PRO_EMAILS` (e/ou a constante `ADMIN_PRO_EMAILS_CONSTANT` em `backend/src/utils/adminPro.ts`). Essas contas são PRO antes de qualquer trial/status do Stripe, nunca expiram e não recebem e-mails de fim de teste. Só liste e-mails de contas **já cadastradas**.

## 5. Testar com Stripe CLI (modo teste)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook   # imprime o whsec_ local
```

Rode o backend com `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_PRICE_ID_PRO`, e o `STRIPE_WEBHOOK_SECRET` impresso pelo `listen`. Depois:

1. Entre no app com uma conta de teste (não-admin) e clique em **Assinar o plano PRO** (cartão `4242 4242 4242 4242`). O webhook ativa o PRO.
2. Cancelar: botão **Gerenciar assinatura** → portal → cancelar; ou `stripe trigger customer.subscription.deleted`.
3. Falha de pagamento: `stripe trigger invoice.payment_failed`.

Observação: `stripe trigger` usa dados fictícios, sem o `userId` da sua conta — serve para ver a rota respondendo 200, mas só o fluxo real de checkout ativa uma conta.

Falha de pagamento coloca a conta em `past_due` (período de cortesia, acesso mantido); o corte vem quando o Stripe cancela a assinatura (`updated`/`deleted`).

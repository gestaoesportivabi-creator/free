# Stripe — SQL pendente (para o Bruno rodar)

**Nada foi aplicado em nenhum banco.**

## Obrigatório

Nenhum. `scout_subscriptions` já tem `provider`, `provider_customer_id`, `provider_subscription_id`, `current_period_end` e `canceled_at`, e o enum `scout_subscription_status` já tem `active`, `past_due` e `canceled`.

## Opcional (performance)

O webhook busca assinatura por `provider_subscription_id` e `provider_customer_id`. A tabela é pequena, então funciona sem índice; com volume, rode no Supabase SQL editor:

```sql
CREATE INDEX IF NOT EXISTS scout_subscriptions_provider_subscription_id_idx
  ON scout_subscriptions (provider_subscription_id);
CREATE INDEX IF NOT EXISTS scout_subscriptions_provider_customer_id_idx
  ON scout_subscriptions (provider_customer_id);
```

Depois, para o Prisma refletir o banco, adicionar no `model Subscription` do `backend/prisma/schema.prisma` (não alterei o schema):

```prisma
  @@index([providerSubscriptionId])
  @@index([providerCustomerId])
```

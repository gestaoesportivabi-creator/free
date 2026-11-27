# Bypass e-mail verificado — contas QA

## Problema (histórico)
`POST /api/championship-matches` (e qualquer escrita) devolvia `403 email_not_verified` quando o **teste (`trialing`)** passava da graça (`EMAIL_VERIFICATION_GRACE_DAYS`, default 7) e `email_verified_at` era null — ex.: `joao.nardimiranda@gmail.com` no dia 7 do trial.

Assinatura `active` legada também já foi atingida quando a graça usava `subscription.created_at` do backfill (`menegattb@gmail.com`).

## Solução (código)
- `requireActiveSubscription()` **já não** devolve 403 por e-mail; o banner no React continua a pedir confirmação.
- `isEmailVerificationOverdue()` só marca bandeira para UI em `trialing` e ignora QA:
  - `qa.scout21+*`
  - `qa.scout21@*`
  - `*@qa.scout21.local`
- `backend/src/utils/qaEmail.ts` → `isQaTestEmail()`

## Desbloqueio imediato (produção)
Também marcar `email_verified_at = now()` nas contas QA existentes (feito via SQL no incidente 22/09/2026).

## Como o tester retoma
1. Logout / login (ou hard refresh) na conta `qa.scout21+jose@gmail.com`
2. Banner “Confirme seu e-mail” deve sumir
3. Criar partida (Tabela → Nova Partida) sem 403
4. Seguir checklist denso

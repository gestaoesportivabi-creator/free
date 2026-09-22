# Bypass e-mail verificado — contas QA

## Problema
`POST /api/championship-matches` (e qualquer escrita) retorna `403 email_not_verified` quando o trial passou da graça (`EMAIL_VERIFICATION_GRACE_DAYS`, default 7) e `email_verified_at` é null.

Conta afetada no ciclo José: `qa.scout21+jose@gmail.com`.

## Solução (código)
- `backend/src/utils/qaEmail.ts` → `isQaTestEmail()`
- `isEmailVerificationOverdue()` ignora:
  - `qa.scout21+*`
  - `qa.scout21@*`
  - `*@qa.scout21.local`

## Desbloqueio imediato (produção)
Também marcar `email_verified_at = now()` nas contas QA existentes (feito via SQL no incidente 22/09/2026).

## Como o tester retoma
1. Logout / login (ou hard refresh) na conta `qa.scout21+jose@gmail.com`
2. Banner “Confirme seu e-mail” deve sumir
3. Criar partida (Tabela → Nova Partida) sem 403
4. Seguir checklist denso

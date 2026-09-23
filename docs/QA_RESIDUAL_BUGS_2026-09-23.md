# Bugs residuais QA José — handoff 2026-09-23

**Domínio:** https://scout21.com.br  
**Conta:** qa.scout21+jose · Time QA Jose  
**Base:** PASS9 `f588b01` (Bug 1 reopen/snapshot — **não retrabalhar**)

## Status após este ciclo de código

| ID | Bug | Ação |
|----|-----|------|
| BUG-REOPEN-SNAPSHOT-00 | Reopen 00:00 | **PASS PASS10** (base `f588b01`) |
| BUG-TIRO-LIVRE-TOOLTIP | Tooltip flaky | **PASS PASS10** |
| BUG-CTA-PADRAO-REINGRESSO | CTA some no reopen | **PASS PASS10** |
| BUG-LOGOUT-POS-FINALIZAR | Logout intermitente | **PASS PASS10 (5/5)** |
| BUG-OOM-INDEXEDDB-RESIDUAL | Memória / autosave | **PASS observado PASS10** — 507 evt sem crash |

**Fechamento:** `docs/PASS10_FINAL_BUGS_1_5.md` (23/09/2026).

## Validação

```bash
node 21Scoutpro/scripts/qa-jose-static-verify.mjs
```

QA operacional: revalidar PASS9 reopen + bugs 2–4 em produção; load test ≥1500 evt ainda recomendado para Bug 5.

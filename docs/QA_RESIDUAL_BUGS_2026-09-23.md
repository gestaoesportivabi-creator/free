# Bugs residuais QA José — handoff 2026-09-23

**Domínio:** https://scout21.com.br  
**Conta:** qa.scout21+jose · Time QA Jose  
**Base:** PASS9 `f588b01` (Bug 1 reopen/snapshot — **não retrabalhar**)

## Status após este ciclo de código

| ID | Bug | Ação |
|----|-----|------|
| BUG-REOPEN-SNAPSHOT-00 | Reopen 00:00 | **Preservado** (`f588b01`) — regressão obrigatória |
| BUG-TIRO-LIVRE-TOOLTIP | Tooltip flaky | **Fix** — overlay + `title` + hint visível `tiro-livre-rule-hint` |
| BUG-CTA-PADRAO-REINGRESSO | CTA some no reopen | **Fix** — modal abre se `tit.length < 5` mesmo com fita; label “Reaplicar padrão” |
| BUG-LOGOUT-POS-FINALIZAR | Logout intermitente | **Fix** — `markKeepSessionAfterFinalize` + retry profile + cache `user` |
| BUG-OOM-INDEXEDDB-RESIDUAL | Memória / autosave | **Hardening** — assinatura leve (sem stringify fita a cada render); debounce 0.8→8s por volume; intervalo 30→45s ≥200 evt. Sem IndexedDB no produto (fita = API). |

## Validação

```bash
node 21Scoutpro/scripts/qa-jose-static-verify.mjs
```

QA operacional: revalidar PASS9 reopen + bugs 2–4 em produção; load test ≥1500 evt ainda recomendado para Bug 5.

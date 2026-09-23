# QA José — backlog e correções

## Validação produção (~3h) — 23/09/2026

**Conta:** `qa.scout21+jose@gmail.com` · Rival QA Verify 1–7 · ~820 eventos

### Confirmado PASS
Agenda/CTA, padrão 1GK+4 (1ª abertura), 2T relativo, faltas do tempo, menos pausas, Finalizar→Análise, LOCAL, stats≈fita, próximo jogo vazio, TIRO LIVRE ≥5, sem perda 2T / sem QA47 nesta janela.

### Ciclo pós-verify (código)

| Item | Status |
|------|--------|
| Reabrir → PAUSADO 00:00 / sem snapshot | **FIX** — sempre persiste `lineup.clockSnapshot`; se ausente, infere da fita; assinatura pós-hydrate |
| Tooltip TIRO LIVRE | **FIX** — overlay + title + hint visível (`tiro-livre-rule-hint`) |
| Selecionar padrão no reingresso | **FIX** — modal se escalação incompleta mesmo com fita; “Reaplicar padrão” |
| Logout pós-Finalizar | **FIX** — grace `KEEP_SESSION_AFTER_FINALIZE` + retry profile + cache `user` |
| OOM / IndexedDB | **PASS observado PASS10** — 507 evt Rival QA 15; sem crash; ver `docs/PASS10_FINAL_BUGS_1_5.md` |

Ver também `docs/QA_EMAIL_BYPASS.md`, `docs/QA_RESIDUAL_BUGS_2026-09-23.md` e **`docs/PASS10_FINAL_BUGS_1_5.md`**.

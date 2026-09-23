# QA José — backlog e correções

## Validação produção (~3h) — 23/09/2026

**Conta:** `qa.scout21+jose@gmail.com` · Rival QA Verify 1–7 · ~820 eventos

### Confirmado PASS
Agenda/CTA, padrão 1GK+4 (1ª abertura), 2T relativo, faltas do tempo, menos pausas, Finalizar→Análise, LOCAL, stats≈fita, próximo jogo vazio, TIRO LIVRE ≥5, sem perda 2T / sem QA47 nesta janela.

### Ciclo pós-verify (código)

| Item | Status |
|------|--------|
| Reabrir → PAUSADO 00:00 / sem snapshot | **FIX** — sempre persiste `lineup.clockSnapshot`; se ausente, infere da fita; assinatura pós-hydrate |
| Tooltip TIRO LIVRE | **FIX** — `title` no botão + wrapper (disabled) |
| Selecionar padrão no reingresso | **FIX** — CTA sempre no prep; pool com roster completo |
| Logout pós-Finalizar | **FIX** — limpa token só em 401/403; handoff sem race `onClose` |
| OOM / IndexedDB | Residual — não quebrou em ~820; load test profundo ainda não feito |

Ver também `docs/QA_EMAIL_BYPASS.md`.

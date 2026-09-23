# PASS10 Final — Bugs 1–5 (PRODUÇÃO)

**Data:** 23/09/2026 (UTC-3)  
**Conta/time:** QA Scout 21 / Time QA Jose  
**Ambiente:** https://scout21.com.br  
**Deploy base:** `3936409` (+ reopen `f588b01`)  
**Resultado:** **FEITO — Bugs 1–5 PASS**

| Bug | Resultado | Evidência |
|-----|-----------|-----------|
| 1 — Reopen snapshot | **PASS** | Rival QA 15: reingresso 1T 03:22 e 2T 03:07; sem snapshot ausente |
| 2 — TIRO LIVRE hint | **PASS** | Disabled até 4 faltas com hint; habilitado após 5; tiro livre defendido registrado |
| 3 — CTA padrão | **PASS** | Selecionar padrão (1 GK + 4) → Reaplicar padrão |
| 4 — Finalizar → Análise | **PASS (5/5)** | Cinco ciclos → Análise sem login |
| 5 — Stress denso / memória | **PASS observado** | 507 eventos; 4×2; sem crash/freeze/perda de sessão; Finalizar → Análise OK |

## Bug 5 — detalhes

- Partida: Rival QA 15 (reutilizada incompleta; criação de nova partida não usada nesta sessão)
- Sem trial novo / sem Ads
- Modal Finalizar: **507** eventos
- Placar: **4×2**
- Heap/IndexedDB: não observáveis pela UI; sem OOM observado
- Análise carregada sem login
- Prints (workspace QA): `shots/pass10/stress-507-live.png`, `finalizar-507-modal.png`, `analise-4x2.png`

## Prints anexados na conversa (Cursor)

- Coleta ao vivo com hint TIRO LIVRE + laterais densos
- Modal Finalizar com 507 eventos
- Análise da Partida Vitória Mandante 4×2 (LOCAL = Mandante)

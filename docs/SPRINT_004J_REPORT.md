# Sprint 004J — A/B, decisão e (não) promoção

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Escopo: `docs/PLANO_MESTRE_COLETA_V2.md` §12 (004J) e §14  
Commit: nenhum

## Decisão

**Não promover o Shell a default.**

Documento normativo do portão: [`SPRINT_004J_DECISION_GATE.md`](./SPRINT_004J_DECISION_GATE.md).

- Default permanece `current` (`21Scoutpro/utils/collectionExperience.ts` → `resolveCollectionExperience`).
- Ativação experimental: `?coleta=shell` / preferência settings.
- Rollback: `?coleta=atual`.
- Flag **não** foi invertida.

Motivo: preferência de operadores reais e TTE/taps de campo com baseline **não medidos**. Equivalência automatizada sozinha não fecha o portão.

---

## O que está production-ready *experimentalmente*

O Shell V2 pode ser usado em produção **como opt-in** (`?coleta=shell`), com rollback imediato:

| Capacidade | Evidência |
| --- | --- |
| Casca sobre domínio existente (`registerSharedEvent`) | 004D–004F |
| Eventos LIVE + compostos + presets + substituição pura | 004D–004E |
| Equivalência de payload vs fluxo atual | `shell-equivalence` verde |
| REVIEW enrichments, ZONE, timestamp override, RECOVERY | 004F |
| Fila local + estado de persistência | 004G |
| A11y, teclado, portrait block, métricas estendidas | 004H |
| Acesso/settings/`?coleta=*` | 004C.1B + access specs |

## O que ainda exige humano antes de promoção

| Item | Por quê |
| --- | --- |
| Rodada A/B com operadores reais | Critério 7 (≥ 70%) |
| TTE / taps / cancel / undo / eventos·min vs baseline | Critérios 1–5 |
| Revisão cega de atribuição | Critério 6 |
| Reorder do Action Deck com frequência re-rodada | Dados amplos mudaram vs amostra de 13 eventos |

Protocolo: `SPRINT_004H_OPERATOR_READINESS.md` + `SHELL_METRICS_OPERATOR_COLLECTION.md`.

---

## Frequência de eventos (re-rodada §5)

Fonte: Supabase Scout, `jogos.post_match_event_log`, 2026-07-29.

- 45 partidas com log · **2.871** eventos  
- Ranking: Passe 35,8% · Desarme 24,0% · Finalização 20,5% · Defesa 8,3% · Gol 6,1% · Falta 5,3%  
- Detalhe e implicações: ver `SPRINT_004J_DECISION_GATE.md`  
- **Deck não reordenado nesta sprint** (promoção bloqueada; reorder fica como pré-requisito de promoção futura).

Nota de segurança observada no MCP: várias tabelas Scout estão sem RLS. Fora do escopo 004J; não remediar automaticamente aqui.

---

## Evidência agregada 004D → 004H

| Sprint | Entrega principal | Verificação reportada |
| --- | --- | --- |
| 004D | Dispatcher + specs 1–7 + 5 zonas | Build OK; E2E bloqueado no macOS (`cmd.exe`) na época |
| 004E | Compostos, presets, substituição pura, equivalência | Equivalence **verde**; finalization **verde**; access 4/5 |
| 004F | ZONE, REVIEW enrichments, timestamp, RECOVERY; posse adiada | Specs REVIEW/RECOVERY + build OK |
| 004G | Fila local + backoff + Command Bar persistence | Domain + save-queue + equivalence verdes |
| 004H | Contraste, a11y, portrait, métricas summary, protocolo operadores | Accessibility + metrics domain + finalization verdes; A/B humano pendente |

Nenhum relatório inventou preferência de operador ou TTE de ginásio.

---

## Regressão 004J (execução desta sprint)

Comando (workers=1):

```text
npx playwright test \
  e2e/specs/shell-finalization.spec.ts \
  e2e/specs/collection-experience-access.spec.ts \
  e2e/specs/shell-equivalence.spec.ts \
  e2e/specs/shell-save-queue.spec.ts \
  e2e/specs/shell-accessibility.spec.ts \
  e2e/specs/shell-review-recovery.spec.ts \
  e2e/specs/shell-metrics-domain.spec.ts
```

### Resultados exatos (suíte combinada, ~17,8 min)

| Spec | Resultado |
| --- | --- |
| `collection-experience-access.spec.ts` | **7 passed** (inclui default=`current`, settings shell, `?coleta=shell`/`atual`) |
| `shell-accessibility.spec.ts` | **3 passed** |
| `shell-equivalence.spec.ts` | **1 passed** |
| `shell-finalization.spec.ts` | **3 passed** |
| `shell-metrics-domain.spec.ts` | **1 passed** |
| `shell-review-recovery.spec.ts` | **3 passed** |
| `shell-save-queue.spec.ts` | **1 failed** — após `online`, `queuedEntries` ficou em `1` (esperado `0`) no poll de 20s; UI de fila tinha entrado no caminho offline |
| **Total** | **18 passed / 1 failed** |

Retry isolado de `shell-save-queue.spec.ts` em seguida: **falhou na abertura QA** (`waitForRealtimeScout` / escalação), não revalidou o assert de reconciliação. Em 004G/004H a mesma spec havia passado isolada.

Leitura honesta: núcleo de paridade, acesso, finalização, a11y, REVIEW/RECOVERY e métricas domain estão verdes nesta rodada; a prova E2E de drain da fila sob reconnect **não fechou verde** nesta execução 004J e não deve ser inventada como pass.

### Correção posterior do drain da fila (mesma working tree)

A falha acima foi investigada e corrigida — detalhe técnico em [SPRINT_004G_REPORT.md](./SPRINT_004G_REPORT.md#correção-pós-004j--drain-confiável-na-reconexão). Resumo: reagendamentos de autosave executavam closures antigas de `saveSilently`, que gravavam na fila um snapshot sem os últimos lances e disputavam com a versão atual; somaram-se a isso a assinatura de fila baseada no relógio corrente e o backoff que não zerava na reconexão.

Reexecução após a correção:

| Execução | Resultado |
| --- | --- |
| `shell-save-queue.spec.ts` `--repeat-each=3` | **3 passed** |
| Suíte focada (`finalization`, `save-queue`, `equivalence`, `review-recovery`, `accessibility` + 4 domain specs) | **22 passed / 1 failed** — a única falha foi `shell-review-recovery` na abertura QA (`Esperava a coleta realtime abrir...`), o flake conhecido de entrada |
| `shell-review-recovery.spec.ts` isolada | **3 passed** |
| `npx vite build` + type-check filtrado nos arquivos tocados | build OK, sem erros novos |

Com isso o critério de dados/resiliência do portão passa a ter evidência verde; os itens pendentes seguem sendo apenas os de operador humano (preferência e TTE de campo).

---

## Arquivos desta sprint

| Arquivo | Papel |
| --- | --- |
| `docs/SPRINT_004J_DECISION_GATE.md` | Portão §14 + decisão não promover |
| `docs/SPRINT_004J_REPORT.md` | Este relatório |
| `docs/SHELL_METRICS_OPERATOR_COLLECTION.md` | Como coletar summary na rodada |
| `docs/README.md` | Índice leve Coleta V2 |
| `docs/SPRINT_004H_OPERATOR_READINESS.md` | Link para o guia de métricas |

Código de produto: **sem inversão de default**; working tree de 004D–004H preservada.

---

## Critérios §12 004J — status

| Item | Status |
| --- | --- |
| Rodada QA comparativa com operadores reais | ❌ não executada |
| Comparar metrics vs baseline §6.1 | ❌ não medido em campo |
| Re-rodar frequência §5 | ✅ documentada (45 jogos / 2871 eventos) |
| Decisão explícita promover/ajustar/matar | ✅ **não promover** (ajustar + A/B pendente) |
| Se promovido, inverter default | N/A — não promovido; `?coleta=atual` permanece |

---

## Próximo passo humano

1. Executar protocolo A/B e preencher readiness.  
2. Exportar `__scout21CollectionShellMetricSummary__` + baseline atual.  
3. Reordenar Deck LIVE conforme frequência (Desarme → Finalização → Defesa → …) se A/B confirmar.  
4. Só então reabrir o portão e, se verde, inverter default.

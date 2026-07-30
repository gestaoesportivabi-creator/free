# Sprint 004J — Portão de decisão (Coleta V2 / Shell)

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Fonte: `docs/PLANO_MESTRE_COLETA_V2.md` §12 (004J) e §14.2  

## Decisão explícita

**NÃO promover o Shell a default.**

Motivo: pelo menos dois critérios obrigatórios do portão (§14.2) estão **não medidos** (preferência de operadores reais e TTE/taps de campo com baseline). Promover com métrica vermelha ou ausente viola a regra do plano: *"Não promover com métrica vermelha."* / *"Se isso não mostrar ganho operacional, o Shell não deve escalar."*

Estado operacional recomendado:

- Default continua: experiência **atual** (`resolveCollectionExperience` → `current`).
- Ativação experimental: `?coleta=shell` e/ou preferência em settings / `localStorage`.
- Rollback: `?coleta=atual` (e preferência `current`).

Nenhuma inversão de flag foi feita nesta sprint.

---

## Os 8 critérios de promoção

| # | Critério | Alvo | Evidência atual | Status |
| --- | --- | --- | --- | --- |
| 1 | TTE p50 | ≤ 1.200 ms **e** melhor que baseline do fluxo atual | Instrumentação existe (`durationMs` + `__scout21CollectionShellMetricSummary__`). Sem rodada A/B de campo nem baseline operacional exportada. | **not measured** |
| 2 | Taps/evento (média ponderada) | ≤ 2,4 | `interactionCount` em success metrics; sem amostra de operadores reais ponderada por frequência. E2E de teclado observa 2 taps em finalização sticky, mas isso **não** substitui média ponderada de campo. | **not measured** |
| 3 | Cancel rate | ≤ 5% | Tipo `cancel` instrumentado; sem sessão operacional agregada. | **not measured** |
| 4 | Undo rate | ≤ 3% | Tipo `undo` instrumentado; sem sessão operacional agregada. | **not measured** |
| 5 | Eventos/min | ≥ baseline | Summary calcula `eventsPerMinute` localmente; baseline do fluxo atual **não** foi coletada em paralelo. | **not measured** |
| 6 | Erros de atribuição (revisão cega) | ≤ baseline | Mitigações de sticky (eco de nome, glow, undo 30s) implementadas; revisão cega com operadores **não executada**. | **not measured** |
| 7 | Preferência de operadores reais | ≥ 70% preferem V2 | Protocolo em `SPRINT_004H_OPERATOR_READINESS.md`. **Nenhuma preferência inventada.** Rodada A/B humana pendente. | **blocked** |
| 8 | Equivalência de dados | 100% (diff vazio) | `shell-equivalence.spec.ts` **passou** na regressão 004J (18/19 da suíte focada; falha isolada foi `shell-save-queue`, não equivalência). | **pass** (automatizado) |

### Leitura do portão

- **Pass:** 1/8 (equivalência automatizada).
- **Not measured / blocked:** 7/8.
- Regra: falhar **qualquer** um → ajustar ou matar; não promover.
- Recomendação: **manter Shell experimental** até A/B humano + export de métricas de campo preencherem 1–7.

---

## Evidência automatizada disponível (não substitui A/B)

| Área | Resultado agregado (004D→004H + 004J) |
| --- | --- |
| Paridade de domínio / `registerSharedEvent` | Implementado aditivamente; handlers originais preservados |
| Equivalência de payload | Spec verde |
| Finalização / acesso / rollback `?coleta=atual` | Specs verdes nas execuções estáveis |
| REVIEW / RECOVERY / ZONE / enrichments | 004F report + specs |
| Fila local / persistência | 004G report + specs |
| A11y / teclado / portrait / métricas domain | 004H report + specs |
| Preferência / TTE de ginásio | **ausente** |

---

## Frequência de eventos (§5 re-rodada)

Consulta em 2026-07-29 via Supabase Scout (`jogos.post_match_event_log`), partidas encerradas/finalizadas ou `collection_phase >= 2`:

- **n matches com log:** 45  
- **n eventos:** 2.871  

| Família | n | % |
| --- | --: | --: |
| Passe (`passCorrect`/`passWrong`) | 1.028 | 35,8% |
| Desarme | 688 | 24,0% |
| Finalização | 589 | 20,5% |
| Defesa | 238 | 8,3% |
| Gol | 176 | 6,1% |
| Falta | 152 | 5,3% |

Top actions brutas: `passCorrect` 623, `passWrong` 405, `tackleWithoutBall` 302, `shotOff` 266, `shotOn` 248, `save` 238, `tackleWithBall` 234, `goal` 176, `falta` 152.

### Implicações honestas para o Deck

1. A amostra original do plano (2 jogos QA, 13 eventos) **não generaliza**. Passe domina o dataset acumulado, mas continua **Classe D no realtime** — não entra no Deck LIVE.
2. Ranking LIVE sugerido pelos dados (excluindo passe): **Desarme → Finalização → Defesa → Gol → Falta**. O Deck atual ainda prioriza Gol/Finalização/Falta antes de Desarme/Defesa em partes do layout; **reordenar antes de qualquer promoção**, não nesta decisão de default.
3. Trave no dataset amplo: 9/589 finalizações (~1,5%) — bem abaixo dos 33% da amostra de 13 eventos. Manter Trave no fluxo (já implementada); não usar o % antigo como argumento de promoção.
4. `goalMethod`: Ataque/Contra-ataque lideram no dataset amplo; bola parada continua relevante. Presets de bola parada permanecem úteis; não inventar reorder de métodos sem A/B.

**Ação:** documentar (feito). **Não** inverter default. Reorder do Deck fica como follow-up pré-promoção.

---

## Checklist de promoção (quando humano fechar o portão)

- [ ] Exportar métricas Shell e baseline atual da mesma sequência
- [ ] Preencher `SPRINT_004H_OPERATOR_READINESS.md` com preferência ≥ 70%
- [ ] Confirmar critérios 1–6 com números reais
- [ ] Reavaliar ordem do Action Deck com a frequência acima
- [ ] Só então: inverter default + manter `?coleta=atual`

Até lá: **DO NOT PROMOTE.**

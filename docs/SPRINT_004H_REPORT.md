# Sprint 004H — Polimento e acessibilidade

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Escopo: §12 do `docs/PLANO_MESTRE_COLETA_V2.md`  
Commit: nenhum (working tree preservada; sem commit)

## Entregas

### 1. Contraste e alvo de toque

- Bordas e textos do Shell passaram de `zinc-800/500` para tons com maior contraste (`zinc-700/600/300/100`).
- Ações de fluxo mantêm `min-h-14` (≥ 56px); utilitários do Command Bar e Timeline usam `size-11` / `min-h-11` (≥ 44px).
- Foco visível padronizado: anel cyan de 2px (`focus-visible:outline-cyan-300`) em Stage, Deck, Rail, Command Bar e Timeline.
- Layout §7.4: Rail horizontal abaixo de 1280px; aviso de viewport degradada abaixo de 1024px.
- Auditoria automatizada em viewports 1600×900, 1280×800, 1024×768 e 900×600 (sem overflow horizontal).

### 2. `prefers-reduced-motion`, `aria-live` e teclado

- CSS escopado ao Shell desliga animações/transições sob `prefers-reduced-motion`.
- Regiões `aria-live="polite"` (passo/status) e `aria-live="assertive"` (registro, erro, undo).
- Teclado completo: atalhos de evento, 1–9 atletas/opções, `0` skip, setas entre controles, Esc/Enter, Space no relógio, `?` overlay, Shift+Enter para presets, trap de foco nos diálogos.
- Overlay de atalhos e presets fecha com Esc e captura Tab.

### 3. Bloqueio de tablet retrato

- Gate exclusivo do Shell: `(orientation: portrait) and (min-width: 600px) and (max-width: 1024px)`.
- Mensagem “Gire o tablet”; coleta Shell não renderiza Deck/Stage enquanto bloqueado.
- Interface atual permanece operável em retrato (asserção E2E dedicada).

### 4. Prontidão de operadores

- Protocolo em `docs/SPRINT_004H_OPERATOR_READINESS.md`.
- **Nenhum resultado de preferência inventado.** A rodada com operadores reais permanece pendente para 004J.

### 5. Métricas do decision gate

- Instrumentação estendida: `start | interaction | cancel | confirm | success | error | undo | preset | shortcut | skip`.
- Contadores de `interactionCount`, `durationMs` e `inputMethod` no fluxo ativo.
- Helper `summarizeShellMetrics` + `window.__scout21CollectionShellMetricSummary__()` para TTE p50/p95, cancel/undo rate, taps/evento e eventos/min.
- Métricas deixam de ser restritas a localhost (úteis na rodada operacional).

## Arquivos tocados nesta sprint

| Arquivo | Mudança |
| --- | --- |
| `21Scoutpro/components/CollectionShellExperimental.tsx` | live regions, portrait gate, viewport warning, métricas, teclado |
| `21Scoutpro/components/collection-shell/ShellStage.tsx` | contraste, alvos, foco, labels |
| `21Scoutpro/components/collection-shell/ShellActionDeck.tsx` | contraste, foco, presets via teclado, trap |
| `21Scoutpro/components/collection-shell/ShellAthleteRail.tsx` | contraste, alvos, aria-label, layout ≤1279px |
| `21Scoutpro/components/collection-shell/ShellCommandBar.tsx` | contraste, foco, status live |
| `21Scoutpro/components/collection-shell/ShellTimelineStrip.tsx` | alvos ≥44px, contraste |
| `21Scoutpro/components/collection-shell/useShellShortcuts.ts` | setas, skip `0` |
| `21Scoutpro/components/collection-shell/metrics.ts` | **novo** resumo operacional |
| `21Scoutpro/e2e/specs/shell-accessibility.spec.ts` | **novo** teclado + portrait + viewports |
| `21Scoutpro/e2e/specs/shell-metrics-domain.spec.ts` | **novo** domínio do resumo |
| `21Scoutpro/e2e/helpers/scout-flow.ts` | detecção mais robusta do botão de escalação |
| `docs/SPRINT_004H_OPERATOR_READINESS.md` | **novo** protocolo sem resultados inventados |
| `docs/SPRINT_004H_REPORT.md` | este relatório |

Documentação/onboarding não relacionada (`AGENTS.md`, `ONBOARDING_*`, etc.) foi preservada sem alteração nesta sprint.

## Verificação

| Checagem | Resultado |
| --- | --- |
| `vite build` | ✅ exit 0 |
| `npm run type-check` filtrado aos arquivos Shell 004H | ✅ sem erros novos nos arquivos tocados (dívida histórica fora do escopo permanece) |
| `shell-metrics-domain.spec.ts` | ✅ 1 passed |
| `shell-accessibility.spec.ts` | ✅ 3 passed (última execução estável) |
| `shell-finalization.spec.ts` | ✅ 3 passed (última execução completa) |
| `shell-save-queue.spec.ts` | ✅ 1 passed |
| `shell-equivalence.spec.ts` | ✅ passou na suíte combinada anterior à estabilização final |

### Observações honestas sobre flakiness

- Houve falhas intermitentes de entrada QA (`waitForRealtimeScout` / login) sob carga serial longa, com UI ainda em escalação ou “Carregando…”.
- Mitigação aplicada: priorizar botão de escalação por role e evitar viewport portrait **antes** da navegação nos testes de orientação.
- As falhas não indicaram regressão funcional do polish; reexecuções isoladas passaram.

## Critérios §12 — status

| Critério | Status |
| --- | --- |
| Auditoria contraste/alvo nas viewports §7.4 | ✅ automatizada + ajustes CSS |
| `prefers-reduced-motion` | ✅ |
| `aria-live` | ✅ |
| Navegação completa por teclado | ✅ coberta por E2E |
| Bloqueio tablet retrato (somente Shell) | ✅ |
| Rodada com operadores reais | ❌ **não executada** — protocolo preparado |
| Extensão de métricas para decision gate | ✅ |
| Build + suíte shell relevante | ✅ com flakiness de entrada QA documentada |
| Relatório honesto | ✅ |

## Lacunas / próximos passos (004J)

1. Executar a rodada qualitativa do protocolo e preencher preferência/métricas reais.
2. Comparar `__scout21CollectionShellMetricSummary__()` contra baseline do fluxo atual.
3. Re-rodar frequência de eventos (§5) se o dataset acumulado mudar o ranking do Deck.
4. Decisão explícita: promover / ajustar / matar.
5. Opcional: auditoria visual pixel-perfect do harness `.codex-artifacts/shell-visual-audit/` (não reexecutada nesta máquina).

## Invariantes preservados

- Fluxo atual permanece default.
- Shell continua casca; handlers de domínio não foram reescritos nesta sprint.
- Nenhum commit foi criado.

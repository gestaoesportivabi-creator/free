# QA José (14–19/09/2026) — backlog e correções

Checklist do relatório técnico. Itens marcados foram corrigidos neste ciclo (edits locais, sem commit).

## Corrigido

- [x] **Programação vs Nova partida scout (P0 UX)** — Sidebar/App: “Agenda de treinos”; Schedule com CTA “Criar partida para scout” → Tabela de Campeonato; ChampionshipTable “Nova Partida” com subtítulo scoutável.
- [x] **2T timestamps 20:xx (P1)** — Fita recente e tabela de eventos: tempo relativo ao tempo (mm:ss) + badge 1T/2T (storage inalterado).
- [x] **Faltas label (P1)** — Label “Faltas do tempo” junto ao placar.
- [x] **TIRO LIVRE tooltip (P1)** — `title`: “Disponível após 5 faltas (nossas ou do adversário) neste tempo”.
- [x] **After Finalizar → analysis (P1)** — Modal in-app; `RealtimeScoutPage` grava `scout21_open_match_analysis` e volta ao dashboard **sem** `alert` nativo; App abre aba Dados do Jogo; ScoutTable seleciona a partida em Análise. Postmatch: `onCollectionFinalized` mantém análise. App não redireciona para Scout Coletivo ao finalizar.
- [x] **SELECIONAR padrão lineup (P1)** — Botão “Selecionar padrão (1 GK + 4)” no modal de escalação.
- [x] **LOCAL Mandante (P1)** — `location` propagado em `realtimeScoutData` → `MatchRecord` / `buildMatchSnapshot`; análise com fallback championship por data+adversário.
- [x] **PRÓXIMO JOGO stale (P1)** — Parse local de data/hora (sem `Date` ISO ambíguo); empty state “Sem próximo jogo”.
- [x] **Finalize modal (P2)** — Confirmação in-app com contagem de eventos + retry em falha; e2e usa `finalize-collection-*` (não `dialog.accept` no finalize).
- [x] **Event tape virtualization (P0 partial)** — Cap ~40 na fita; tabela de logs últimos 100 com aviso; limpeza de UI efêmera no finalize. **Não** limita o array `matchEvents` em memória nem o payload de autosave.
- [x] **Reconcile on finalize (P0 partial)** — Compara `postMatchEventLog` enviado vs retorno; alerta + retry se divergir / falhar / `onSave` void.
- [x] **DOB pt-BR** — `lang="pt-BR"` + preview `toLocaleDateString('pt-BR')`.
- [x] **Menos overlays de pausa (P2)** — `matchClockEventRules`: pausa só em gol / pênalti / fluxo de tiro livre; falta, bloqueio, escanteio, lateral, chute fora não travam mais o pad. (Sem runner de unit tests no frontend; regras conferidas no código.)
- [x] **Stats = fita (P1 parcial)** — Cards extras na análise derivados de `postMatchEventLog` (faltas, cartões, escanteios, laterais, bloqueios, defesas, pênaltis, tiros livres, finalizações). Cards “oficiais” de teamStats podem ainda divergir da fita.
- [x] **E2E full-match-cycle** — Modal de finalizar + tempos relativos `02:40` no 2T + redirect para Análise (não `/dashboard` cego / não `22:40`).

## Não feito / residual (honestidade QA)

- [ ] **P0 memória / crash sob volume (QA47)** — Cap de UI (40/100) **não** resolve OOM: `matchEvents` + `postMatchEventLog` + autosave JSON continuam crescendo sem bound; sem virtualização de estado, IndexedDB offload, ou amostragem. **Sem certeza absoluta** abaixo de 100+ eventos densos / loops QA4–46.
- [ ] **P0 sync 2T / opacidade do pad** — Sem mudança de arquitetura de sync; apenas menos pausas automáticas (P2). Risco de corrida autosave vs finalize mitigado por `waitForAutosaveIdle`, não eliminado sob rede lenta.
- [ ] **P1 stats = fita (completo)** — Cards derivados da fita são **aditivos**; placar/teamStats históricos e GeneralScout ainda usam agregados oficiais — possíveis divergências vs fita.
- [ ] **P0 nav “onde crio partida scoutável”** — Copy/CTA melhorados; onboarding/empty-state dedicado e telemetria de confusão **não** medidos em produção.
- [ ] **E2E regressão completa** — Specs atualizadas no papel; **não executadas** neste review (Playwright contra ambiente QA).
- [ ] **`showScoutingWindow` (realtime embutido)** — Path em ScoutTable ainda parece morto (`setShowScoutingWindow(true)` ausente); coleta realtime real = `/scout-realtime`.

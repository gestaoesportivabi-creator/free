# SPRINT 003C QA AUTOMATION REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Data: `2026-07-15`

## Resumo executivo

A Sprint 003C configurou a primeira base de automacao E2E para o fluxo autenticado da coleta e do cronometro usando Playwright.

O trabalho entregue nesta rodada inclui:

- infraestrutura Playwright no frontend;
- arquivo local de exemplo para credenciais E2E;
- seletores estaveis (`data-testid`) para login, navegacao, partida QA, coleta, cronometro, eventos e logs;
- helpers reutilizaveis para o fluxo QA;
- specs para smoke, controles do cronometro, persistencia e cleanup em `--dry-run`;
- reativacao do caminho dedicado `/scout-realtime` para permitir acesso real ao cronometro autenticado.

## Ferramenta escolhida

- Ferramenta: `Playwright`
- Justificativa:
  - nao havia ferramenta E2E instalada no frontend;
  - Playwright oferece bom suporte a fluxo autenticado, trace, screenshot e relatorio HTML;
  - a suite fica preparada para uso futuro em CI sem introduzir concorrencia de ferramentas.

## Estado do repositorio

- `git branch --show-current`: `feature/cronometro-partida`
- upstream da branch: ausente
- `git log --oneline -15`: commits das sprints anteriores confirmados
- commits obrigatorios encontrados:
  - `287a881`
  - `2f5c7bc`

## Infraestrutura criada

Arquivos criados:

- `21Scoutpro/.env.e2e.example`
- `21Scoutpro/playwright.config.ts`
- `21Scoutpro/e2e/README.md`
- `21Scoutpro/e2e/helpers/env.ts`
- `21Scoutpro/e2e/helpers/scout-flow.ts`
- `21Scoutpro/e2e/specs/qa-smoke.spec.ts`
- `21Scoutpro/e2e/specs/clock-controls.spec.ts`
- `21Scoutpro/e2e/specs/persistence.spec.ts`
- `21Scoutpro/e2e/specs/cleanup-dry-run.spec.ts`
- `docs/SPRINT_003C_QA_AUTOMATION_REPORT.md`

Arquivos atualizados:

- `21Scoutpro/package.json`
- `21Scoutpro/.gitignore`
- `21Scoutpro/App.tsx`
- `21Scoutpro/components/CollectionTypeSelector.tsx`
- `21Scoutpro/components/Login.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/components/RealtimeScoutPage.tsx`
- `21Scoutpro/components/ScoutTable.tsx`
- `21Scoutpro/components/Sidebar.tsx`
- `docs/QA_GUIDE.md`

## Seletores e helpers

Seletores principais adicionados:

- `login-email`
- `login-password`
- `login-submit`
- `nav-dados-jogo`
- `match-card`
- `collection-status`
- `scouting-open-realtime`
- `scouting-open`
- `reopen-match`
- `match-clock-panel`
- `clock-state`
- `clock-time`
- `clock-start`
- `clock-pause`
- `clock-continue`
- `clock-sync`
- `clock-sync-minute`
- `clock-sync-second`
- `clock-sync-confirm`
- `clock-sync-cancel`
- `player-selector`
- `event-selector-pass`
- `event-selector-shot`
- `event-selector-foul`
- `save-match`
- `event-log-row`

Helpers reutilizaveis criados:

- `loginComoQa()`
- `abrirDadosDoJogo()`
- `abrirPartidaQa()`
- `iniciarColeta()`
- `selecionarAtletaQa()`
- `registrarEvento()`
- `salvarPartida()`
- `reabrirPartida()`

## Cenarios automatizados

Specs atualmente modeladas:

- smoke autenticado de login, abertura da coleta, evento simples, salvamento e reabertura;
- inicio do cronometro e avanço do relogio;
- pausa manual e retomada;
- sincronizacao valida;
- cancelamento da sincronizacao;
- validacao de entrada invalida no modal de sincronizacao;
- evento nao pausavel;
- evento pausavel;
- persistencia e edicao via logs;
- cleanup QA em `--dry-run`.

Listagem validada localmente:

- total de testes listados pelo Playwright: `8`

## Validacoes executadas

Executado com sucesso:

- `backend type-check`
- `frontend build` fora do sandbox
- `playwright test --list`
- `cleanup:qa-environment -- --dry-run` com acesso ao banco online
- `backend /health`

Resultado do cleanup `--dry-run`:

- registros QA localizados: `22`
- nenhuma alteracao realizada

## Bugs e inconsistencias encontrados

### QA-AUTO-001

- Severidade: `P1`
- Titulo: fluxo dedicado do cronometro estava inacessivel pela UI principal
- Evidencia:
  - `RealtimeScoutPage` existia no codigo;
  - a rota `/scout-realtime` redirecionava para `/dashboard`;
  - o fluxo de preparacao salvava `realtimeScoutData`, mas desviava para `showPostMatchSheet`.
- Tratamento:
  - corrigido nesta branch para reativar a rota dedicada e a retomada autenticada da coleta em tempo real.

### QA-AUTO-002

- Severidade: `P2`
- Titulo: `type-check` do frontend possui falhas historicas fora do escopo da sprint
- Evidencia:
  - a rodada `npm run type-check` falhou em diversos arquivos nao relacionados a esta entrega;
  - as falhas incluem `types`, blog, admin, schedule e componentes antigos.
- Tratamento:
  - nao corrigido nesta sprint para nao ampliar escopo;
  - build do frontend permaneceu aprovado.

### QA-AUTO-003

- Severidade: `P2`
- Titulo: suite autenticada depende da senha QA oficial fora do Git
- Evidencia:
  - `QA_ENVIRONMENT_PASSWORD` nao estava disponivel no ambiente local desta execucao;
  - foi necessario usar `.env.e2e` ficticio apenas para compilar e listar a suite.
- Tratamento:
  - infraestrutura concluida;
  - execucao autenticada real permanece pendente da credencial QA local.

## Resultado operacional desta rodada

- login QA real: nao executado nesta maquina por ausencia da senha QA oficial local
- abertura autenticada da coleta: nao executada nesta maquina pela mesma dependencia de credencial
- cronometro autenticado ponta a ponta: infraestrutura pronta, execucao pendente
- persistencia ponta a ponta: cenarios implementados, execucao pendente

## Credenciais

- confirmadas como nao versionadas: `SIM`
- `.env.e2e` real deve permanecer local e ignorado
- nenhuma senha real foi gravada no repositorio

## Limites e riscos remanescentes

- a massa QA oficial ainda e compartilhada, entao a suite permanece serial;
- a senha QA precisa ser provisionada localmente antes da rodada autenticada;
- o frontend acumula erros antigos de tipagem fora da Sprint 003C;
- warnings antigos de build (env/chunk) continuam existindo.

## Backlog recomendado para a proxima sprint

- provisionar a senha QA localmente e executar a rodada autenticada completa;
- publicar a suite em CI apos estabilizar as credenciais seguras;
- criar mais de uma partida QA para reduzir acoplamento serial;
- cobrir o fluxo pendente de `gol` com tratamento explicito do tempo manual;
- investigar e reduzir o conjunto historico de erros de `type-check` do frontend.

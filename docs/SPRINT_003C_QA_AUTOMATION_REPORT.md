# SPRINT 003C QA AUTOMATION REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Data: `2026-07-15`
Atualizacao 003C.1: `2026-07-15`
Atualizacao 003C.2: `2026-07-15`
Atualizacao 003C.2B: `2026-07-16`

## Atualizacao 003C.2B

### Escopo desta rodada

Objetivo executado em `2026-07-16`:

- redefinir exclusivamente a senha da conta `qa.scout21@qa.scout21.local`;
- validar login em sessao limpa;
- atualizar apenas o `.env.e2e` local;
- rerodar o smoke autenticado e a bateria associada.

### Revisao das alteracoes locais antes do reset

Classificacao aplicada antes de qualquer nova escrita no banco:

- `backend/scripts/reset-qa-password.ts`
  - necessaria para redefinicao segura da credencial QA
- `backend/package.json`
  - necessario para expor `qa:reset-password`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
  - correcao necessaria para validacao E2E
- `21Scoutpro/e2e/helpers/scout-flow.ts`
  - correcao necessaria para validacao E2E
- `docs/QA_GUIDE.md`
  - documentacao
- `docs/SPRINT_003C_QA_AUTOMATION_REPORT.md`
  - documentacao
- `21Scoutpro/dist/index.html`
  - arquivo gerado automaticamente
- `21Scoutpro/public/sitemap.xml`
  - arquivo gerado automaticamente

Arquivos gerados automaticamente nao foram tratados como mudanca de produto e nao devem entrar em commit desta sprint, salvo exigencia formal do repositorio.

### Redefinicao segura da credencial

Mecanismo utilizado:

- `npm run qa:reset-password`
- entrada por variaveis locais:
  - `QA_USER_EMAIL`
  - `QA_USER_PASSWORD`

Validacoes executadas:

- `dry-run` aprovado
- usuario QA localizado
- tenant/estrutura QA validados
- apenas `password_hash` atualizado
- nenhum outro registro alterado

Conta validada:

- `qa.scout21@qa.scout21.local`

### Login em sessao limpa

Resultado:

- `APROVADO`

Validacoes confirmadas:

- backend local ativo em `http://localhost:3000/health`
- frontend local ativo em `http://127.0.0.1:5173/login`
- autenticacao com credencial explicita aprovada
- dashboard carregado
- tenant `QA SCOUT 21` visivel na UI
- `Dados do Jogo` acessivel
- partida QA acessivel

### Atualizacao do `.env.e2e`

Resultado:

- arquivo local atualizado com o email QA oficial e a senha local valida
- `git ls-files 21Scoutpro/.env.e2e`: vazio
- `git check-ignore -v 21Scoutpro/.env.e2e`: confirmado
- `git log --all -- 21Scoutpro/.env.e2e`: sem historico versionado
- `.env.e2e` permaneceu fora do Git

### Validacao automatizada desta rodada

Resultado do smoke:

- `qa-smoke.spec.ts --headed`: `REPROVADO`
- autenticacao: `APROVADA`
- falha funcional atual:
  - `event-log-row` nao apareceu apos o registro do evento

Demais testes executados:

- `clock-controls.spec.ts`
  - `4` cenarios aprovados
  - `1` falha funcional remanescente
- `persistence.spec.ts`
  - reprovado
- `cleanup-dry-run.spec.ts`
  - aprovado
- `npm run test:e2e`
  - `4` aprovados
  - `3` falhos
  - `1` nao executado apos falha anterior
  - duracao: `7.2m`

Falhas consolidadas da rodada:

- `qa-smoke.spec.ts`
  - `event-log-row` ausente apos registro do evento
- `persistence.spec.ts`
  - falha na mesma familia de persistencia/reabertura
- `clock-controls.spec.ts`
  - falha remanescente em fluxo do cronometro

Correcao E2E adicional aplicada nesta rodada:

- `selecionarAtletaQa()` passou a ignorar o atleta preferido quando ele estiver desabilitado e cair para o primeiro jogador habilitado

### Seguranca

Confirmacoes:

- nenhuma senha em arquivos versionados
- nenhuma senha em documentacao
- nenhuma senha em logs entregues
- nenhuma senha em commit
- nenhum hash exposto no relatorio
- busca por exposicao acidental da senha fora do `.env.e2e` local retornou `0`

Orientacao obrigatoria:

- a senha oficial da conta QA deve ser compartilhada exclusivamente por canal privado ou gerenciador de senhas

### Validacoes tecnicas

- `backend type-check`: `APROVADO`
- `frontend build`: `APROVADO`
  - observacao: no sandbox padrao houve falha ambiental de acesso ao `vite.config.ts`; fora da restricao, o build passou

### Status final desta rodada

- credencial QA: `REGULARIZADA`
- login manual em sessao limpa: `APROVADO`
- login E2E: `APROVADO`
- smoke autenticado: `REPROVADO`
- status final: `CONCLUIDA PARCIALMENTE COM CREDENCIAL REGULARIZADA E BUGS FUNCIONAIS REMANESCENTES`

## Atualizacao 003C.2

### Resumo executivo

A conta QA foi auditada por leitura de codigo e validacao segura contra o banco online. A divergencia de credencial vinha do fato de que o seed oficial QA cria `passwordHash` apenas quando o usuario ainda nao existe; quando a conta QA ja esta criada, o seed permanece idempotente e nao reprovisiona a senha.

Foi criado o utilitario `backend/scripts/reset-qa-password.ts` com atalho `npm run qa:reset-password` para padronizar apenas a senha da conta QA usando `QA_USER_EMAIL` e `QA_USER_PASSWORD`, com validacao de email, role, tecnico, clube e equipe QA antes de qualquer escrita.

Depois da padronizacao:

- o login QA passou a funcionar em contexto limpo;
- a suite deixou de falhar na autenticacao;
- a rodada E2E revelou dois bugs funcionais estaveis do produto e uma instabilidade adicional de UI.

### Origem da credencial QA

- e-mail QA oficial: `qa.scout21@qa.scout21.local`
- script de criacao: `backend/scripts/seed-qa-environment.ts`
- campo usado: `users.password_hash`
- algoritmo: `bcrypt`
- endpoint de login: `POST /api/auth/login`
- verificacao de conta no login: `isActive === true`
- confirmacao de e-mail: existe no sistema, mas nao e exigida pelo login por senha
- tenant QA validado por estrutura associada:
  - `QA SCOUT 21`
  - `QA FUTSAL CLUBE`
  - `QA PRINCIPAL`

### Sessao persistida

O frontend restaura autenticacao a partir de `localStorage.token` no bootstrap de `21Scoutpro/App.tsx`, e o componente `21Scoutpro/components/Login.tsx` grava esse token apos o `POST /auth/login`.

Conclusao operacional:

- um login manual anterior em navegador comum poderia depender de sessao antiga;
- a validacao oficial desta sprint passou a usar contexto limpo do Playwright;
- a autenticacao atual foi confirmada com credencial explicita, sem reaproveitar sessao salva.

### Mecanismo adotado

- novo script: `backend/scripts/reset-qa-password.ts`
- comando: `npm run qa:reset-password`
- entrada local: `QA_USER_EMAIL` e `QA_USER_PASSWORD`
- garantias:
  - nao cria usuario;
  - nao altera tenant;
  - nao altera role;
  - nao altera clube, equipe, atletas ou partida;
  - falha se a identidade QA divergir;
  - usa `bcrypt` oficial da aplicacao;
  - nao imprime senha, hash, token ou cookie.

Idempotencia validada:

- primeira execucao: redefiniu apenas `password_hash` do usuario QA;
- segunda execucao com `--dry-run`: retornou `Credencial QA ja estava padronizada. Nenhuma alteracao foi necessaria.`

### Validacao de login e ambiente local

- backend local: `http://localhost:3000/health` aprovado
- frontend antigo em `5173`: servia uma versao sem os seletores mais novos
- frontend atual da sprint: iniciado localmente em `http://127.0.0.1:4173`
- `.env.e2e` local: mantido fora do Git e atualizado apenas localmente para apontar a nova base URL

Resultado do login em sessao limpa:

- autenticacao QA aprovada
- dashboard carregado
- acesso a `Dados do Jogo` aprovado
- abertura da partida QA aprovada
- entrada na coleta em tempo real aprovada

### Execucoes E2E 003C.2

Ordem executada:

1. `qa-smoke.spec.ts --headed`
2. `clock-controls.spec.ts`
3. `persistence.spec.ts`
4. `cleanup-dry-run.spec.ts`
5. `npm run test:e2e`
6. `npm run test:e2e` novamente

Resultados individuais:

- `qa-smoke.spec.ts --headed`
  - autenticacao: aprovada
  - cronometro: abre e inicia
  - falha final: apos salvar e reabrir, `event-log-row` nao reaparece
- `clock-controls.spec.ts`
  - 4 cenarios aprovados na rodada dedicada
  - 1 falha estavel: `clock-end-period` nao ficou clicavel
- `persistence.spec.ts`
  - falha estavel na reabertura: eventos nao reaparecem no log
- `cleanup-dry-run.spec.ts`
  - aprovado

Rodada completa 1:

- aprovados: `5/8`
- falhos: `3/8`
- falhas:
  - encerramento do primeiro tempo
  - persistencia e reabertura
  - smoke na reabertura do evento
- duracao: `5.3m`

Rodada completa 2:

- aprovados: `3/8`
- falhos: `3/8`
- nao executados apos falha previa: `2/8`
- falhas:
  - sincronizacao com entrada invalida (instavel por interceptacao de clique no modal)
  - persistencia e reabertura
  - smoke na reabertura do evento
- duracao: `4.7m`

### Bugs confirmados na 003C.2

### QA-AUTO-005

- Severidade: `P1`
- Titulo: eventos nao persistem de forma reabrivel no fluxo QA do cronometro
- Evidencia:
  - `qa-smoke.spec.ts` falha apos `save + reabrir`
  - `persistence.spec.ts` falha no mesmo ponto
  - `event-log-row` nao reaparece na reabertura
- Impacto:
  - quebra o objetivo central de validacao ponta a ponta da coleta autenticada

### QA-AUTO-006

- Severidade: `P2`
- Titulo: encerramento do primeiro tempo nao fica disponivel de forma automatizavel
- Evidencia:
  - `clock-controls.spec.ts` falha ao clicar `clock-end-period`
  - a falha se repetiu na rodada dedicada e na rodada completa
- Impacto:
  - impede cobrir intervalo e segundo tempo com confiabilidade

### QA-AUTO-007

- Severidade: `P3`
- Titulo: modal de sincronizacao apresenta instabilidade de clique em entrada invalida
- Evidencia:
  - segunda rodada completa falhou em `clock-sync-confirm`
  - o proprio Playwright registrou interceptacao e elemento instavel
- Impacto:
  - comportamento nao foi estavel entre rodadas, indicando flakiness de UI/modal

### Resultado operacional 003C.2

- login QA real: `APROVADO`
- abertura autenticada da coleta: `APROVADA`
- cronometro autenticado:
  - fluxo principal: `PARCIALMENTE APROVADO`
  - intervalo/segundo tempo: `REPROVADO`
- persistencia ponta a ponta: `REPROVADA`
- suite completa: `EXECUTADA DUAS VEZES`
- bloqueio por credencial: `RESOLVIDO`

Classificacao consolidada:

- aprovados estaveis:
  - `cleanup-dry-run.spec.ts`
  - `clock-controls.spec.ts` cenarios 1, 2, 3 e 4 na rodada dedicada
- falhos estaveis:
  - reabertura/persistencia
  - encerramento de periodo
- instaveis:
  - validacao de entrada invalida no modal de sincronizacao

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
- `cleanup-dry-run.spec.ts`

Resultado do cleanup `--dry-run`:

- registros QA localizados: `22`
- nenhuma alteracao realizada

## Execucao autenticada da Sprint 003C.1

Resultado da rodada autenticada:

- `qa-smoke.spec.ts --headed`: `BLOQUEADO POR CREDENCIAL OU AMBIENTE`
- causa identificada: `credencial invalida`
- evidencias:
  - screenshot: `21Scoutpro/test-results/qa-smoke-QA-smoke-do-crono-8a3cc-o-simples-save-e-reabertura-chromium/test-failed-1.png`
  - video: `21Scoutpro/test-results/qa-smoke-QA-smoke-do-crono-8a3cc-o-simples-save-e-reabertura-chromium/video.webm`
  - contexto Playwright: `21Scoutpro/test-results/qa-smoke-QA-smoke-do-crono-8a3cc-o-simples-save-e-reabertura-chromium/error-context.md`

Diagnostico objetivo:

- o navegador permaneceu na tela de login;
- a UI exibiu `Credenciais invalidas`;
- o seletor `nav-dados-jogo` nao apareceu porque a autenticacao nao foi concluida;
- nao houve evidencia de falha do cronometro, da coleta, da massa QA ou do helper de navegacao nesta rodada.

Classificacao:

- categoria: `ambiente / credencial`
- severidade: `bloqueador operacional`
- impacto na sprint: impede executar smoke, cronometro, persistencia e suite completa autenticada.

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

### QA-AUTO-004

- Severidade: `BLOQUEADA POR CREDENCIAL OU AMBIENTE`
- Titulo: `.env.e2e` local possui senha presente, mas nao valida para a conta QA
- Evidencia:
  - auditoria confirmou `E2E_QA_PASSWORD=set` sem expor o valor;
  - o smoke autenticado retornou `Credenciais invalidas`;
  - a navegacao nao saiu da tela de login.
- Tratamento:
  - nenhuma correcao de produto aplicada;
  - necessario provisionar a senha QA oficial valida fora do Git antes de retomar a sprint.

## Resultado operacional desta rodada

- login QA real: `REPROVADO POR CREDENCIAL INVALIDA`
- abertura autenticada da coleta: `BLOQUEADA`
- cronometro autenticado ponta a ponta: `BLOQUEADO`
- persistencia ponta a ponta: `BLOQUEADA`
- suite completa `npm run test:e2e`: `NAO EXECUTADA`
- segunda rodada consecutiva: `NAO EXECUTADA`

Classificacao dos testes nesta atualizacao:

- aprovados:
  - `cleanup-dry-run.spec.ts`
- reprovados:
  - nenhum teste de produto reprovado
- instaveis:
  - nenhum identificado, pois a rodada autenticada nao avancou
- bloqueados:
  - `qa-smoke.spec.ts`
  - `clock-controls.spec.ts`
  - `persistence.spec.ts`
  - `npm run test:e2e`

## Credenciais

- confirmadas como nao versionadas: `SIM`
- `.env.e2e` real deve permanecer local e ignorado
- nenhuma senha real foi gravada no repositorio
- `git ls-files 21Scoutpro/.env.e2e`: vazio
- `git check-ignore -v 21Scoutpro/.env.e2e`: confirmado
- `git log --all -- 21Scoutpro/.env.e2e`: sem historico versionado

## Limites e riscos remanescentes

- a massa QA oficial ainda e compartilhada, entao a suite permanece serial;
- a senha QA precisa ser provisionada localmente e validada antes da rodada autenticada;
- o frontend acumula erros antigos de tipagem fora da Sprint 003C;
- warnings antigos de build (env/chunk) continuam existindo.

## Decisao final da Sprint 003C

- status final: `BLOQUEADA POR CREDENCIAL OU AMBIENTE`
- motivo:
  - a infraestrutura E2E esta pronta;
  - o cleanup em `--dry-run` esta aprovado;
  - a execucao autenticada obrigatoria nao pode ser concluida porque a credencial local atual da conta QA foi rejeitada no login.

Pendencia objetiva para retomada:

1. provisionar uma senha QA valida em `21Scoutpro/.env.e2e`;
2. rerodar `qa-smoke.spec.ts --headed`;
3. se o smoke passar, executar `clock-controls.spec.ts`, `persistence.spec.ts` e duas rodadas consecutivas de `npm run test:e2e`.

## Backlog recomendado para a proxima sprint

- provisionar a senha QA localmente e executar a rodada autenticada completa;
- publicar a suite em CI apos estabilizar as credenciais seguras;
- criar mais de uma partida QA para reduzir acoplamento serial;
- cobrir o fluxo pendente de `gol` com tratamento explicito do tempo manual;
- investigar e reduzir o conjunto historico de erros de `type-check` do frontend.

## Decisao atualizada da Sprint 003C.2

- status final: `PARCIALMENTE CONCLUIDA COM BUGS DE PRODUTO IDENTIFICADOS`
- motivo:
  - a credencial QA foi recuperada e padronizada;
  - o login autenticado em sessao limpa foi validado;
  - a suite completa foi executada duas vezes;
  - permanecem bugs reais de persistencia/reabertura e de encerramento de periodo;
  - existe uma instabilidade de UI no modal de sincronizacao.

Pendencias objetivas para continuidade:

1. corrigir persistencia/reabertura dos eventos QA;
2. corrigir o fluxo de encerramento do primeiro tempo;
3. estabilizar o modal de sincronizacao para entradas invalidas;
4. rerodar a suite completa apos as correcoes;
5. revisar o frontend `type-check` historico fora do escopo do cronometro.

## Atualizacao 003D

Data: `2026-07-16`

### Escopo coberto

- fechamento explicito do ciclo realtime;
- unificacao do timestamp do gol;
- recuperacao correta da reabertura;
- validacao automatizada do ciclo completo;
- endurecimento dos helpers E2E contra `POS-JOGO` inicial e modal de newsletter.

### Resultado funcional

Rodada consolidada final:

- comando: `npx playwright test e2e/specs/qa-smoke.spec.ts e2e/specs/clock-controls.spec.ts e2e/specs/persistence.spec.ts e2e/specs/cleanup-dry-run.spec.ts e2e/specs/full-match-cycle.spec.ts --workers=1`
- resultado: `10/10` aprovados
- duracao: aproximadamente `4.5m`

Suites aprovadas:

- `qa-smoke.spec.ts`
- `clock-controls.spec.ts`
- `persistence.spec.ts`
- `cleanup-dry-run.spec.ts`
- `full-match-cycle.spec.ts`

### Bugs tratados na 003D

- leitura incorreta de `GET /matches/:id` na reabertura realtime;
- fluxo de gol ainda dependente de tempo manual;
- ausencia de explicacao operacional para `Finalizar Coleta`;
- falso positivo de `beforeunload`;
- flakiness de clique causada por modal de newsletter e sobreposicao de layout em viewport real.

### Validacoes tecnicas

- `backend type-check`: aprovado
- `backend /health`: aprovado
- `frontend build`: aprovado
- `frontend type-check`: continua reprovado por passivo historico fora do escopo
- `cleanup --dry-run`: aprovado com acesso autorizado ao banco QA online

### Observacoes finais

- a massa QA oficial permaneceu isolada;
- `dist/index.html` e `public/sitemap.xml` continuaram como artefatos gerados locais, fora de commit planejado;
- a automacao ficou estavel em execucao serial sobre a partida QA oficial.

# QA GUIDE

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Status: `AMBIENTE QA OFICIAL CRIADO`

## Finalidade

Este guia documenta o ambiente oficial de QA criado para validar o cronometro e o fluxo de coleta sem usar dados reais.

Objetivos atendidos:
- criar uma massa permanente e identificavel por prefixo `QA`;
- permitir login funcional no frontend local com backend local apontando para banco online;
- permitir abertura da partida, entrada na coleta, salvamento e reabertura;
- manter criacao e limpeza rastreaveis e reversiveis.

## Arquitetura

```text
User (ESSENCIAL)
  -> Tecnico
  -> Clube
    -> Equipe
      -> EquipesJogadores
        -> Jogadores
      -> Campeonato
        -> CampeonatosJogos
      -> Jogo
        -> JogosEstatisticasEquipe
        -> JogosEventos
        -> JogosEstatisticasJogador
```

## Nomenclatura

Todos os registros oficiais deste ambiente usam prefixo `QA`.

Pacote criado:
- Tenant: `QA SCOUT 21`
- Usuario: `qa.scout21@qa.scout21.local`
- Clube: `QA FUTSAL CLUBE`
- Equipe: `QA PRINCIPAL`
- Atletas:
  - `QA ATLETA 01`
  - `QA ATLETA 02`
  - `QA ATLETA 03`
  - `QA ATLETA 04`
  - `QA ATLETA 05`
  - `QA ATLETA 06`
- Competicao: `QA CRONOMETRO 003B`
- Partida: `QA CRONOMETRO 003B`
- Adversario: `QA ADVERSARIO`
- Local: `QA ARENA LOCAL`

Senha:
- nunca versionar em Git;
- sempre injetar por `QA_ENVIRONMENT_PASSWORD` no momento do seed;
- a credencial usada na execucao desta sprint foi provisionada fora do repositorio.

Padronizacao da credencial QA:
- a partir da Sprint 003C.2, a redefinicao segura da senha QA pode ser feita por `QA_USER_EMAIL` e `QA_USER_PASSWORD`;
- o comando oficial e `npm run qa:reset-password`;
- a senha continua local, nao versionada e nunca deve ir para log.
- a senha oficial da conta QA deve ser compartilhada exclusivamente por canal privado ou gerenciador de senhas.

## Convencoes

- nenhum dado real pode ser reutilizado;
- nenhum tenant, clube ou partida existente pode ser alterado;
- todo filtro destrutivo precisa ser exato por email, nome, data e adversario QA;
- `seed` e `cleanup` precisam suportar `--dry-run`;
- `seed` so roda com `ALLOW_QA_SEED=true`;
- `cleanup` so roda com `ALLOW_QA_CLEANUP=true` e `QA_CLEANUP_CONFIRM=DELETE_QA_ENVIRONMENT`.

## Matriz de scripts

Nao foram encontrados arquivos dedicados de `builders`, `factories` ou `fixtures` no backend atual. O reaproveitamento se concentra em `seeds` e `helpers`.

| Script | Finalidade | Idempotente | Seguro | Pode reutilizar? |
| --- | --- | --- | --- | --- |
| `backend/scripts/seed-roles.ts` | Garante roles base do sistema | Sim | Parcial | Nao para a massa QA; apenas como pre-requisito global |
| `backend/scripts/seed-admin.ts` | Cria/atualiza admin padrao e tecnico vinculado | Parcial | Nao | Nao |
| `backend/scripts/seed-demo-data.ts` | Popula demo ampla e pode limpar tenant por `--clean` | Nao | Nao | Nao |
| `backend/scripts/seed-chopinzinho-lnf.ts` | Popula tenant real/especifico com IDs fixos | Parcial | Nao | Nao |
| `backend/scripts/helpers/name-generator.ts` | Gera nomes ficticios para seeds de demo | Sim | Sim | Nao necessario para o seed oficial QA |
| `backend/scripts/helpers/data-generators.ts` | Gera dados auxiliares de demo | Sim | Sim | Nao necessario para o seed oficial QA |
| `backend/scripts/helpers/stats-generator.ts` | Gera estatisticas de demo | Sim | Sim | Nao necessario para o seed oficial QA |
| `backend/scripts/helpers/qa-environment.ts` | Centraliza nomes, guards e data oficial do ambiente QA | Sim | Sim | Sim |
| `backend/scripts/seed-qa-environment.ts` | Cria o ambiente oficial QA de forma idempotente | Sim | Sim | Sim |
| `backend/scripts/cleanup-qa-environment.ts` | Remove somente o pacote QA oficial com dupla confirmacao | Sim | Sim | Sim |
| `backend/scripts/reset-qa-password.ts` | Redefine somente `password_hash` do usuario QA oficial | Sim | Sim | Sim |

## Criacao

Comandos:

```powershell
cmd /c npm run seed:qa-environment -- --dry-run
```

```powershell
$env:ALLOW_QA_SEED='true'
$env:QA_ENVIRONMENT_PASSWORD='<senha-nao-versionada>'
cmd /c npm run seed:qa-environment
```

Comportamento do seed oficial:
- exige role `ESSENCIAL` existente;
- nao altera roles;
- nao altera usuarios reais;
- nao altera tenants existentes;
- nao altera clubes existentes;
- nao altera partidas existentes;
- so cria o que estiver faltando;
- imprime quantidade prevista antes de gravar;
- imprime quantidade criada ao final.

Resultado desta execucao:

| Registro | Criado |
| --- | ---: |
| `user` | 1 |
| `tecnico` | 1 |
| `clube` | 1 |
| `equipe` | 1 |
| `competicao` | 1 |
| `campeonato` | 1 |
| `jogo` | 1 |
| `jogos_estatisticas_equipe` | 1 |
| `campeonatos_jogos` | 1 |
| `jogadores` | 6 |
| `equipes_jogadores` | 6 |
| **Total** | **21** |

Idempotencia validada:
- o `dry-run` apos a execucao retornou `total: 0`.

## Recuperacao da credencial QA

Quando o usuario QA ja existe, o seed QA nao atualiza `password_hash`; ele apenas cria o usuario quando necessario. Por isso, divergencias de senha devem ser tratadas pelo reset oficial, nao por rerun do seed.

Comandos:

```powershell
$env:QA_USER_EMAIL='qa.scout21@qa.scout21.local'
$env:QA_USER_PASSWORD='<senha-nao-versionada>'
cmd /c npm run qa:reset-password
```

Dry-run opcional:

```powershell
$env:QA_USER_EMAIL='qa.scout21@qa.scout21.local'
$env:QA_USER_PASSWORD='<senha-nao-versionada>'
cmd /c npx tsx scripts/reset-qa-password.ts --dry-run
```

Garantias do reset:
- valida o email QA oficial;
- valida role, tecnico, clube e equipe QA antes de escrever;
- usa `bcrypt`;
- nao cria usuario novo;
- nao altera outros registros;
- e idempotente quando a senha ja estiver sincronizada.

## Limpeza

Comandos:

```powershell
cmd /c npm run cleanup:qa-environment -- --dry-run
```

```powershell
$env:ALLOW_QA_CLEANUP='true'
$env:QA_CLEANUP_CONFIRM='DELETE_QA_ENVIRONMENT'
cmd /c npm run cleanup:qa-environment
```

Comportamento do cleanup oficial:
- localiza o usuario por email QA exato;
- valida nome do tenant QA, clube QA, equipe QA, competicao QA, adversario QA e data QA;
- remove em ordem segura de dependencias;
- nao usa filtros amplos;
- falha se encontrar conflito de identidade.

Validacao desta sprint:
- `dry-run` confirmou 21 registros QA localizados;
- o cleanup real nao foi executado porque o ambiente precisava permanecer disponivel ao final da sprint.

## Responsabilidades

- Engenharia:
  - manter o seed QA idempotente;
  - manter o cleanup reversivel;
  - nao versionar credenciais;
  - documentar qualquer alteracao futura do pacote QA.
- QA:
  - usar somente a massa com prefixo `QA`;
  - registrar inconsistencias do fluxo em `docs/SPRINT_003B_1_QA_REPORT.md`;
  - nao reaproveitar partidas reais como atalho.
- Operacao:
  - se precisar trocar senha, reprovisionar fora do Git;
  - se precisar zerar o ambiente, usar primeiro o `dry-run` do cleanup.

## Riscos

- o fluxo de coleta abre com os atletas bloqueados e exige o operador entender o modo `Ativos`;
- durante a validacao real, o cronometro visivel coexistiu com captura manual de tempo do gol;
- navegar para fora da coleta pode disparar dialogo do navegador se houver estado nao descartado;
- `vite build` atualiza `public/sitemap.xml` no `prebuild`, gerando ruido de diff local;
- o frontend ainda emite warnings antigos de env/chunk no build.

## Limitacoes

- o guia nao versiona senha;
- o cleanup nao foi executado nesta sprint, apenas validado em `dry-run`;
- a massa criada contem um gol QA salvo em `00:15` para validar persistencia e reabertura;
- o ambiente valida a infraestrutura de QA, nao conclui sozinho a auditoria funcional completa do cronometro.

## Polish visual da coleta

Na revisao de 2026-07-17, a coleta realtime recebeu um polish visual controlado sem mudanca de regra funcional.

Ajustes principais:
- `Jogador` foi reduzido na interface realtime em favor de `Atleta`;
- `Logs` passou a aparecer como `Eventos da partida`;
- `Guardar como incompleto` passou a `Salvar como incompleta`;
- `Encerrar partida` ganhou modal interno para substituir a confirmacao nativa;
- o rodape `Eventos recentes` passou a exibir horario absoluto e resumo sem duplicacao.

Escopo preservado:
- sem alteracao de backend;
- sem alteracao de payload;
- sem alteracao do `ClockService`;
- sem alteracao da regra de save;
- sem alteracao da reabertura.

## Automacao E2E

Estrutura criada na Sprint 003C:

- `21Scoutpro/playwright.config.ts`
- `21Scoutpro/.env.e2e.example`
- `21Scoutpro/e2e/helpers/`
- `21Scoutpro/e2e/specs/`
- `21Scoutpro/e2e/README.md`

Scripts do frontend:

```powershell
cmd /c npm run test:e2e
cmd /c npm run test:e2e:headed
cmd /c npm run test:e2e:ui
cmd /c npm run test:e2e:report
```

Variaveis locais obrigatorias:

- `E2E_BASE_URL`
- `E2E_API_URL`
- `E2E_QA_EMAIL`
- `E2E_QA_PASSWORD`

Variaveis locais auxiliares para manutencao da conta QA:

- `QA_USER_EMAIL`
- `QA_USER_PASSWORD`

Variaveis opcionais:

- `E2E_QA_MATCH_OPPONENT`
- `E2E_QA_MATCH_COMPETITION`
- `E2E_QA_PLAYER_NAME`

Convencoes da suite:

- execucao serial (`workers: 1`) para evitar concorrencia sobre a massa QA oficial;
- `trace` em primeira repeticao;
- screenshot em falha;
- video retido em falha;
- relatorio HTML em `21Scoutpro/playwright-report/`.

Instalacao local:

```powershell
cd 21Scoutpro
cmd /c npm install
cmd /c npx playwright install chromium
```

Modo de execucao segura:

1. subir backend local com acesso ao banco online;
2. subir frontend local;
3. criar `21Scoutpro/.env.e2e` a partir de `.env.e2e.example`;
4. preencher a senha QA fora do Git;
5. rodar a suite desejada.

Observacao operacional da Sprint 003C.2:

- se a instancia local em `5173` estiver servindo bundle antigo sem os `data-testid` mais recentes, subir uma instancia nova do frontend em porta dedicada e apontar `E2E_BASE_URL` localmente para essa porta;
- na execucao desta sprint foi usada uma instancia fresca em `http://127.0.0.1:4173`.

Regras de seguranca da automacao:

- nao versionar `21Scoutpro/.env.e2e`;
- nao imprimir senha em log;
- nao trocar autenticacao por workaround local;
- nao executar cleanup real na Sprint 003C;
- usar somente a massa QA oficial.

Cobertura prevista:

- smoke autenticado de login e abertura da coleta;
- controles do cronometro;
- persistencia e reabertura;
- cleanup QA em `--dry-run`.

Limitacoes atuais da automacao:

- a execucao autenticada depende da senha QA oficial disponivel localmente;
- o frontend possui erros historicos de `type-check` fora do escopo desta sprint;
- a credencial QA foi recuperada e o login voltou a funcionar, mas a automacao ainda encontra falhas reais de persistencia/reabertura e encerramento de periodo;
- o cleanup `--dry-run` precisa de acesso de rede ao banco online.

Resultado da atualizacao 003C.1:

- o arquivo `21Scoutpro/.env.e2e` permaneceu fora do Git e ignorado;
- as quatro variaveis obrigatorias foram encontradas localmente;
- o smoke autenticado falhou na etapa de login com mensagem `Credenciais invalidas`;
- por isso o fechamento da Sprint 003C ficou `BLOQUEADO POR CREDENCIAL OU AMBIENTE` ate a senha QA valida ser provisionada fora do Git.

Resultado da atualizacao 003C.2:

- a senha QA foi padronizada com reset seguro;
- o login QA em contexto limpo foi aprovado;
- `cleanup-dry-run.spec.ts` permaneceu aprovado;
- quatro cenarios principais de `clock-controls.spec.ts` passaram;
- permaneceram bugs reais em persistencia/reabertura e encerramento de periodo;
- a segunda rodada completa mostrou flakiness adicional no modal de sincronizacao.

Resultado da validacao complementar em `2026-07-16`:

- a conta `qa.scout21@qa.scout21.local` foi redefinida novamente por `QA_USER_EMAIL` + `QA_USER_PASSWORD`, sem alterar tenant, role, clube, equipe, atletas ou partida;
- o login em sessao limpa foi aprovado em `http://127.0.0.1:5173/login`;
- o tenant `QA SCOUT 21` ficou visivel na UI;
- a partida `QA CRONOMETRO 003B` permaneceu acessivel em `Dados do Jogo`;
- o `qa-smoke.spec.ts --headed` autenticou com sucesso, mas continuou reprovado porque `event-log-row` nao apareceu apos o registro do evento;
- `clock-controls.spec.ts` manteve aprovados os cenarios principais do cronometro, com falha remanescente em fluxo funcional;
- `cleanup-dry-run.spec.ts` permaneceu seguro;
- o `backend type-check` passou;
- o `frontend build` passou quando executado fora das restricoes do sandbox.

Resultado da Sprint 003D em `2026-07-16`:

- o fluxo realtime passou a explicar explicitamente quando `Finalizar Coleta` depende de `ENCERRADO`;
- o gol realtime passou a usar apenas o timestamp oficial do cronometro;
- a reabertura voltou a carregar o snapshot salvo corretamente com `matchesApi.getById()` ajustado;
- o helper E2E passou a recuperar a partida QA quando ela abrir em `POS-JOGO`, usando `Guardar como incompleto` antes de reabrir o realtime;
- o helper E2E tambem fecha o modal de newsletter quando ele intercepta a coleta;
- a rodada consolidada `qa-smoke + clock-controls + persistence + cleanup-dry-run + full-match-cycle` terminou com `10/10` aprovados em execucao serial;
- o `cleanup-dry-run` continua exigindo acesso autorizado ao banco QA online;
- `dist/index.html` e `public/sitemap.xml` seguem como artefatos gerados e nao devem entrar em commit sem justificativa formal.

Resultado da Sprint 003G em `2026-07-22`:

- o payload compartilhado `postMatchEventLog` passou a persistir tambem `card`, `block`, `corner`, `freeKick`, `penalty` e `lateral`;
- a reabertura voltou a reconstruir esses eventos no `MatchScoutingWindow`, com `result`, `cardType`, `cardTeam`, `isForUs` e cobrador quando aplicavel;
- `freeKick` e `penalty` com `result = goal` passaram a recompor o placar corretamente apos save e reopen;
- a automacao ganhou `21Scoutpro/e2e/specs/postmatch-data-entry.spec.ts` para validar `corner + card + goal` no mesmo pipeline compartilhado;
- na massa QA disponivel em `2026-07-22`, o card oficial reutilizavel abre primeiro a janela compartilhada de coleta, entao a validacao automatizada ficou focada no gargalo arquitetural comum entre Realtime e Pos-Jogo;
- a selecao explicita de assistente continuou limitada no replay salvo atual e foi registrada como risco operacional remanescente.

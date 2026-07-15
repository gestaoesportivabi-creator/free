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
- a suite foi compilada e listada com sucesso, mas a rodada autenticada completa nao pode ser concluida sem a credencial QA real;
- o cleanup `--dry-run` precisa de acesso de rede ao banco online.

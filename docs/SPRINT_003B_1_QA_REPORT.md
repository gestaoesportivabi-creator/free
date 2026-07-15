# SPRINT 003B.1 QA REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Status final: `CONCLUIDA COM RESSALVAS`

## Ambiente

- Data: `2026-07-15`
- Responsavel: Codex
- Frontend local: `http://localhost:5173`
- Backend local: `http://localhost:3000`
- Banco: online, acessado pelo backend local
- Upstream da branch: nao configurado

## Resultado executivo

A Sprint 003B.1 deixou de estar bloqueada por falta de massa de QA.

Resultado obtido:
- ambiente QA oficial criado no banco online;
- login funcional validado no frontend local;
- tenant, clube, equipe, atletas e partida QA confirmados na interface;
- abertura da coleta validada;
- salvamento e reabertura validados;
- cleanup validado em `dry-run`;
- principal ressalva operacional mapeada: o cronometro fica visivel na coleta, mas o registro de gol ainda exige digitacao manual do tempo do evento.

## Massa oficial criada

Identidade do pacote QA:
- Tenant: `QA SCOUT 21`
- Usuario: `qa.scout21@qa.scout21.local`
- Clube: `QA FUTSAL CLUBE`
- Equipe: `QA PRINCIPAL`
- Atletas: `QA ATLETA 01` a `QA ATLETA 06`
- Competicao: `QA CRONOMETRO 003B`
- Partida: `QA CRONOMETRO 003B`
- Adversario: `QA ADVERSARIO`
- Local: `QA ARENA LOCAL`

Senha:
- provisionada fora do Git via `QA_ENVIRONMENT_PASSWORD`;
- nao registrada em arquivo versionado nem em relatorio.

Quantidade prevista antes da execucao:

| Registro | Previsto |
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

Quantidade criada na execucao oficial:

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

Idempotencia:
- `seed:qa-environment -- --dry-run` apos a criacao retornou `total: 0`;
- nenhum registro duplicado foi planejado ou criado no segundo passe.

## Validacao operacional executada

### Login

- tela de login aberta com sucesso;
- autenticacao com o usuario QA concluida com sucesso;
- redirecionamento para `/dashboard` confirmado;
- tenant exibido na UI: `QA SCOUT 21`.

### Tenant, clube, equipe e atletas

Confirmacoes visuais:
- header lateral exibiu `QA SCOUT 21`;
- papel exibido: `Treinador`;
- `Scout Coletivo` listou `QA ATLETA 01` a `QA ATLETA 06`;
- o dashboard passou a refletir `6` atletas e `1` jogo apos a persistencia do primeiro evento.

### Partida QA

Confirmacoes visuais:
- `Dados do Jogo` listou a partida `QA ADVERSARIO / QA CRONOMETRO 003B`;
- card do calendario exibiu status `Incompleto`;
- ao abrir a partida, a UI mostrou a etapa `Tipo de Coleta`.

### Abertura da coleta

Fluxo validado:
1. abrir `Dados do Jogo`;
2. abrir a partida `QA ADVERSARIO`;
3. selecionar `Adicionar dados da Partida`;
4. abrir `DADOS DA PARTIDA`.

Resultado:
- coleta abriu com placar `0 x 0`;
- cronometro visivel na tela: `50:00`;
- `collectionPhase` permaneceu operacional para reabrir a partida.

### Registro de evento e salvamento

Fluxo executado:
1. abrir modo `Ativos` para liberar jogadores em quadra;
2. ajustar a selecao para `5/5`;
3. selecionar `QA ATLETA 02`;
4. abrir fluxo `GOL -> Gol Nosso -> Ataque -> Sem assistencia`;
5. informar `00:15`;
6. confirmar gol;
7. acionar `Guardar como incompleto`.

Resultado:
- placar passou a `1 x 0`;
- ultimo comando exibido:
  - `00:15`
  - `QA ATLETA 02`
  - `Gol A favor`
- dashboard posterior passou a mostrar:
  - `6` atletas
  - `1` jogo
  - artilheiro `QA ATLETA 02`

### Reabertura

Fluxo executado:
1. retornar ao dashboard;
2. abrir `Dados do Jogo`;
3. reabrir a mesma partida;
4. abrir `Analise da Partida`;
5. usar `Editar Dados`.

Resultado:
- analise exibiu `Vitoria 1 x 0`;
- estatisticas da equipe exibiram `Gols: 1`;
- `Editar Dados` reabriu a coleta;
- ultimo comando `00:15 / QA ATLETA 02 / Gol A favor` foi reidratado na UI.

## Cleanup

Validacao executada:
- `cleanup:qa-environment -- --dry-run`

Resumo localizado para remocao:

| Registro | Encontrado |
| --- | ---: |
| `campeonatos_jogos` | 1 |
| `jogos_estatisticas_equipe` | 1 |
| `jogos_estatisticas_jogador` | 0 |
| `jogos_eventos` | 0 |
| `jogo` | 1 |
| `campeonato` | 1 |
| `competicao` | 1 |
| `equipes_jogadores` | 6 |
| `jogadores` | 6 |
| `equipe` | 1 |
| `clube` | 1 |
| `tecnico` | 1 |
| `user` | 1 |
| **Total** | **21** |

Observacao:
- o cleanup real nao foi executado para preservar o ambiente QA ao final da sprint.

## Validacoes tecnicas executadas

- `git status`: repositorio limpo antes do inicio
- `git branch --show-current`: `feature/cronometro-partida`
- `git log --oneline -12`: sprints anteriores do cronometro confirmadas
- `backend health check`: aprovado
- `frontend local`: respondendo
- `backend type-check`: aprovado
- `seed:qa-environment -- --dry-run`: aprovado
- `seed:qa-environment`: aprovado
- `seed:qa-environment -- --dry-run` apos execucao: aprovado com `total: 0`
- `cleanup:qa-environment -- --dry-run`: aprovado
- `frontend build`: aprovado fora do sandbox, com warnings antigos de env/chunk

## Inconsistencias registradas

### QA-001

- Severidade: `P1`
- Titulo: tempo do evento continua manual apesar do cronometro visivel
- Evidencia:
  - a coleta mostra o cronometro na tela;
  - ao registrar gol, a UI abriu a etapa `Tempo do gol`;
  - foi necessario preencher manualmente `00:15`.
- Impacto:
  - a validacao do ambiente QA passou;
  - a validacao funcional do cronometro precisa conferir se o preenchimento manual e comportamento esperado ou defeito residual.

### QA-002

- Severidade: `P2`
- Titulo: modo `Ativos` exige descoberta manual do operador
- Evidencia:
  - a coleta abriu com todos os jogadores bloqueados;
  - foi necessario entrar em `Ativos`, ajustar `5/5` e sair do modo para selecionar o jogador.
- Impacto:
  - nao bloqueia QA;
  - aumenta risco de erro operacional e de falsa impressao de tela travada.

### QA-003

- Severidade: `P2`
- Titulo: sair da coleta pode disparar dialogo de navegador
- Evidencia:
  - ao tentar navegar para tras apos salvamento, a aba acusou dialogo JavaScript ativo.
- Impacto:
  - comportamento precisa ser retestado com roteiro controlado;
  - nao impediu a persistencia final do dado QA.

## Decisao final

- Aprovacao operacional do ambiente QA: `SIM`
- Liberacao para Sprint 003C: `SIM, COM RESSALVAS`

Ressalvas para a 003C:
- automatizar o fluxo `Ativos -> jogador -> evento -> salvar`;
- validar se o timestamp do evento deve ser preenchido pelo cronometro ou permanecer manual;
- adicionar cobertura para reabertura da coleta com ultimo comando e placar persistidos.

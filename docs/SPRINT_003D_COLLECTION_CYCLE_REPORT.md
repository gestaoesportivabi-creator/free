# Sprint 003D
## Fechamento do Ciclo de Coleta e Unificacao dos Timestamps

Projeto: `SCOUT 21 PRO`
Repositorio: `free`
Branch: `feature/cronometro-partida`
Data: `2026-07-16`

## Resumo executivo

A Sprint 003D fechou o ciclo funcional da coleta realtime sem alterar banco, migrations ou seeds. O fluxo agora deixa explicito por que `Finalizar Coleta` fica bloqueado, o gol em realtime usa exclusivamente o timestamp oficial do cronometro, a reabertura volta a carregar o snapshot salvo corretamente e o warning de saida nao dispara sem alteracao real pendente.

Tambem foi concluida a primeira validacao automatizada do ciclo completo da partida QA:

- login QA;
- abertura da coleta;
- multiplos eventos em `1T`;
- intervalo;
- multiplos eventos em `2T`;
- gol com timestamp oficial;
- encerramento da partida;
- finalizacao da coleta;
- reabertura;
- persistencia integral do log.

## Correcoes implementadas

### 1. Regra de finalizacao explicita

Arquivos centrais:

- `21Scoutpro/components/MatchScoutingWindow.tsx`

Resultado:

- `Finalizar Coleta` continua dependente de `ClockState = ENCERRADO`;
- a UI agora exibe `collection-status` com estado atual e proximo passo esperado;
- o segundo tempo ganhou acao explicita `Encerrar partida`;
- o operador recebe mensagem coerente em `PRE_JOGO`, `PRIMEIRO_TEMPO`, `INTERVALO`, `SEGUNDO_TEMPO`, `PAUSADO`, `SINCRONIZANDO` e `ENCERRADO`.

### 2. Timestamp oficial do gol unificado

Arquivos centrais:

- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `docs/EVENT_MATRIX.md`

Resultado:

- em realtime o gol nao passa mais pela etapa manual de tempo;
- o carimbo vem de `getOfficialEventStamp()` no momento da confirmacao;
- o valor exibido no log e o mesmo que persiste;
- em `2T` o log continua renderizando o tempo absoluto da partida, por exemplo `22:40` com `period = 2T`.

### 3. Reabertura e snapshot

Arquivos centrais:

- `21Scoutpro/services/api.ts`
- `21Scoutpro/components/MatchScoutingWindow.tsx`

Resultado:

- `matchesApi.getById()` voltou a usar `getOne()` em vez de tratar a resposta como array;
- o snapshot salvo passou a atualizar uma assinatura persistida confiavel;
- lineup, log, `collectionPhase` e status salvo deixaram de sofrer falso positivo de alteracao pendente na reabertura.

### 4. Beforeunload e silent save

Arquivos centrais:

- `21Scoutpro/components/MatchScoutingWindow.tsx`

Resultado:

- o aviso nativo so arma quando ha risco real de perda;
- o close silencioso nao executa rede se nada mudou;
- finalizacao e save manual suprimem o warning corretamente.

### 5. Estabilizacao E2E

Arquivos centrais:

- `21Scoutpro/e2e/helpers/scout-flow.ts`
- `21Scoutpro/e2e/specs/clock-controls.spec.ts`
- `21Scoutpro/e2e/specs/full-match-cycle.spec.ts`
- `21Scoutpro/components/ScoutTable.tsx`

Resultado:

- selecao da partida QA ficou deterministica por adversario + competicao;
- o helper passou a recuperar entrada `POS-JOGO` para `em_andamento` usando o proprio fluxo oficial de `Guardar como incompleto`;
- o helper fecha o modal de newsletter quando ele tenta interceptar a coleta;
- cliques criticos afetados pelo layout responsivo passaram a usar o proprio elemento alvo quando necessario;
- foi adicionada a suite `full-match-cycle.spec.ts`.

## Validacao funcional

### Rodada consolidada aprovada em `2026-07-16`

Comando:

```powershell
cmd /c npx playwright test e2e/specs/qa-smoke.spec.ts e2e/specs/clock-controls.spec.ts e2e/specs/persistence.spec.ts e2e/specs/cleanup-dry-run.spec.ts e2e/specs/full-match-cycle.spec.ts --workers=1
```

Resultado:

- `10/10` testes aprovados;
- duracao aproximada: `4.5m`;
- execucao serial;
- `cleanup-dry-run` validado com acesso autorizado ao banco QA online.

Cobertura aprovada:

- smoke autenticado;
- controles do cronometro;
- persistencia e reabertura;
- cleanup QA em `--dry-run`;
- partida completa com dez eventos e gol realtime.

## Validacoes tecnicas

- `backend type-check`: `APROVADO`
- `backend /health`: `APROVADO`
- `frontend build`: `APROVADO`
- `frontend type-check`: `REPROVADO POR PASSIVO HISTORICO FORA DO ESCOPO`

Observacoes de validacao:

- `git diff --check` continua reprovando por trailing whitespace em `21Scoutpro/dist/index.html`, artefato gerado/local preexistente;
- `21Scoutpro/public/sitemap.xml` tambem continua como artefato gerado de build;
- ambos ficaram fora do escopo de commit desta sprint.

## Bugs confirmados e resolvidos

- `P1` reabertura realtime usando leitura incorreta de `GET /matches/:id`
- `P1` gol realtime ainda admitindo tempo manual
- `P1` operador sem indicacao clara de por que `Finalizar Coleta` estava bloqueado
- `P2` smoke falhando por procurar `event-log-row` sem abrir logs
- `P2` warning de saida indevido apos save
- `P2` flakiness de E2E por modal de newsletter e sobreposicao de clique em viewport real

## Riscos remanescentes

- o frontend continua com alto passivo de `type-check` fora do modulo do cronometro;
- a massa QA ainda depende de uma unica partida oficial, o que pressiona a execucao serial;
- o layout da coleta em viewport menor continua sensivel a sobreposicao de elementos, embora os helpers atuais contornem isso na automacao.

## Recomendacao para a proxima sprint

- manter a massa QA em mais de uma partida oficial para reduzir acoplamento serial;
- criar backlog especifico para o modal promocional nao disputar foco com a coleta;
- atacar o passivo historico de `type-check` do frontend em trilha separada do cronometro.

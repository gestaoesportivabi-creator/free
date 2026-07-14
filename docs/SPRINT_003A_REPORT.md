# SPRINT 003A REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Origem da branch: `main`

## Resumo tecnico

A Sprint 003A centralizou a logica de tempo do fluxo ativo de coleta em um servico puro, sem alterar backend, API, banco, autosave ou payload.

O comportamento visual de `MatchScoutingWindow` foi preservado. A mudanca principal foi estrutural:
- `ClockService` passou a ser a fonte oficial de tempo.
- `getEventStamp()` passou a ser a unica origem de timestamp para os eventos registrados na janela.
- `MatchScoutingWindow` passou a consumir um unico `clockSnapshot`, em vez de manter varios `useState` paralelos para o relogio.

## Arquivos criados

- `21Scoutpro/services/clockService.ts`
- `docs/EVENT_MATRIX.md`
- `docs/SPRINT_003A_REPORT.md`

## Arquivos alterados

- `21Scoutpro/components/MatchScoutingWindow.tsx`

## Responsabilidades do ClockService

- Manter o tempo atual do fluxo de coleta.
- Manter o periodo atual (`1T` ou `2T`).
- Manter o estado do relogio (`PRE_JOGO`, `PRIMEIRO_TEMPO`, `PAUSADO`, `SINCRONIZANDO`, `INTERVALO`, `SEGUNDO_TEMPO`, `ENCERRADO`).
- Iniciar, pausar, retomar, sincronizar e resetar o relogio.
- Formatar tempo para exibicao.
- Gerar o timestamp oficial dos eventos via `getEventStamp()`.

## Diagrama textual da arquitetura

```text
MatchScoutingWindow
  -> atualiza UI local (botoes, modais, labels)
  -> delega mudancas de tempo ao ClockService
  -> recebe snapshot do ClockService
  -> usa getEventStamp() para criar timestamps canonicos
  -> monta MatchEvent[]
  -> converte MatchEvent[] em MatchRecord
  -> autosave/manual save continuam iguais
  -> API/backend permanecem inalterados

ClockService
  -> nao importa React
  -> nao acessa DOM
  -> nao acessa banco
  -> nao acessa API
  -> nao salva eventos
  -> apenas controla estado, tempo e timestamp oficial

ClockSnapshot
  -> representa o estado canonico consumido pela interface
  -> evita duplicacao de `matchTime`, `currentPeriod`, `isRunning`, `firstHalfLocked`
```

## Diagrama textual da maquina de estados

```text
PRE_JOGO
  -> PRIMEIRO_TEMPO (start)
  -> SINCRONIZANDO (syncTime)

PRIMEIRO_TEMPO
  -> PAUSADO (pause)
  -> INTERVALO (enterInterval)
  -> SEGUNDO_TEMPO (startSecondHalf)
  -> SINCRONIZANDO (syncTime)
  -> ENCERRADO (end)

PAUSADO
  -> PRIMEIRO_TEMPO (resume no 1T)
  -> SEGUNDO_TEMPO (resume no 2T)
  -> INTERVALO (enterInterval)
  -> SINCRONIZANDO (syncTime)
  -> ENCERRADO (end)

SINCRONIZANDO
  -> PRE_JOGO
  -> PRIMEIRO_TEMPO
  -> PAUSADO
  -> INTERVALO
  -> SEGUNDO_TEMPO
  -> ENCERRADO

INTERVALO
  -> SEGUNDO_TEMPO (startSecondHalf)
  -> SINCRONIZANDO (syncTime)
  -> ENCERRADO (end)

SEGUNDO_TEMPO
  -> PAUSADO (pause)
  -> PRIMEIRO_TEMPO (returnToFirstHalf)
  -> SINCRONIZANDO (syncTime)
  -> ENCERRADO (end)

ENCERRADO
  -> SINCRONIZANDO (reidratacao/edicao)
  -> PRE_JOGO / PRIMEIRO_TEMPO / PAUSADO / SEGUNDO_TEMPO
```

## Auditoria Arquitetural

### Decisoes confirmadas

- `ClockService` manteve responsabilidade unica: controlar estado, tempo e timestamp.
- Nao foi encontrado acoplamento com React, DOM, banco, API, Supabase ou localStorage dentro do servico.
- Nao foi encontrada dependencia circular. O servico importa apenas `21Scoutpro/utils/matchPeriod.ts`.
- A maquina de estados continua explicita e apta para evolucao incremental.
- O build permaneceu funcional sem alterar comportamento de UX.

### Decisoes revistas

- A integracao inicial ainda espelhava o relogio em varios `useState` da interface (`matchTime`, `currentPeriod`, `isRunning`, `firstHalfLocked`, `isMatchEnded`).
- A API publica expunha redundancia entre a funcao exportada `getEventStamp()` e o metodo publico `buildEventStamp()`.

### Problemas encontrados

- Duplicacao de estado temporal no `MatchScoutingWindow`.
- Sincronizacao manual desnecessaria entre `ClockService` e estados React derivados.
- API publica de timestamp com dois pontos de acesso equivalentes.

### Problemas corrigidos

- `MatchScoutingWindow` agora consome um unico `clockSnapshot` como fonte canonica do relogio.
- `matchTime`, `currentPeriod`, `isRunning`, `firstHalfLocked` e `isMatchEnded` passaram a ser valores derivados do snapshot.
- `getEventStamp()` permaneceu como unica API publica de timestamp; o metodo redundante foi removido do servico.

### Riscos encontrados

- Ainda existe logica temporal de apoio espalhada fora do `ClockService`, mas agora ela e claramente separada por responsabilidade:
  - `21Scoutpro/components/MatchScoutingWindow.tsx`: parsing/mascara de entrada manual, regras de UI para tempo digitado, `setInterval` visual e fluxo de modais.
  - `21Scoutpro/utils/matchPeriod.ts`: conversoes canonicas entre tempo absoluto, tempo relativo por periodo e legado.
  - `21Scoutpro/components/ScoutTable.tsx`: cronometro legado fora do fluxo ativo.
  - `21Scoutpro/components/TimeSelectionModal.tsx`: formatacao visual de selecao de minutos/segundos.
- `MatchScoutingWindow` continua grande e com alta densidade de regras de orquestracao.

### Riscos eliminados

- Eliminado o risco de divergencia entre snapshot do servico e cinco estados React paralelos do relogio.
- Eliminado o risco de manter duas APIs publicas equivalentes para gerar timestamps.

### Recomendacoes para Sprint 003B

- Extrair um adaptador/hook de interface para reduzir o tamanho de `MatchScoutingWindow` sem mover regra de tempo de volta para React.
- Unificar ou aposentar o cronometro legado de `ScoutTable` quando o fluxo ativo estiver estabilizado.
- Avaliar comandos futuros do `ClockService` para play oficial, replay e importacao de eventos mantendo o snapshot como contrato central.
- Criar testes unitarios do `ClockService` e testes de integracao da coleta usando o snapshot como superficie principal.
- Manter `matchPeriod.ts` como modulo tecnico de conversao, sem trazer semantica de UI para dentro dele.

## Riscos tecnicos

- `MatchScoutingWindow` continua sendo um componente muito grande, entao a integracao ficou propositalmente concentrada em um espelhamento do servico para reduzir impacto.
- O fluxo de gol tem varias etapas e regras de negocio; ele agora usa a mesma origem de timestamp, mas continua sendo a parte mais sensivel da coleta.
- Existem eventos no fluxo ativo sem mapeamento completo para `PostMatchAction` (`block`, `corner`, `freeKick`, `penalty`, `lateral`), o que segue como inconsistencia estrutural previa.
- O type-check completo do frontend ja falha em muitos arquivos fora do escopo desta Sprint, o que reduz a protecao automatica do repositorio.

## Limitacoes restantes

- `ScoutTable` permanece intacto, incluindo caminhos legados.
- `RealtimeScoutPage` permanece intacto e segue desativado no fluxo principal.
- Nao houve sincronizacao com servidor, botao de sync, play oficial, websocket ou mudancas em autosave.
- O servico ainda nao controla regras esportivas mais avancadas (prorrogacao, pausas automaticas, acrescimos, etc.).

## Backlog sugerido para Sprint 003B

- Conectar `ClockService` ao fluxo realtime hoje desativado.
- Decidir com a comissao tecnica a matriz funcional definitiva de pausa por evento.
- Revisar persistencia dos eventos que hoje nao viram `PostMatchAction`.
- Extrair o fluxo de coleta de `MatchScoutingWindow` para modulos menores.
- Consolidar a logica temporal legada ainda existente em `ScoutTable`.
- Criar testes unitarios para transicoes do `ClockService`.
- Criar type-check/lint confiaveis para o frontend.

## Resultado das validacoes

- `build`: aprovado
  - Backend compilou com sucesso.
  - Frontend compilou com sucesso.
  - Permanecem warnings antigos do Vite sobre env vars/chunks.

- `backend type-check`: aprovado

- `frontend type-check`: reprovado
  - Ja existiam muitos erros tipados fora do escopo da Sprint em `App.tsx`, modulos de blog, dashboard, schedule, API e outros componentes.
  - A checagem filtrada da auditoria nao retornou erros em `21Scoutpro/components/MatchScoutingWindow.tsx` nem em `21Scoutpro/services/clockService.ts`.

- `lint`: reprovado por configuracao ausente
  - O script `backend lint` existe, mas o repositorio nao possui arquivo de configuracao do ESLint detectavel.
  - Nao existe script dedicado de lint para o frontend.

## Escopo preservado

- Nenhuma alteracao no backend.
- Nenhuma alteracao na API.
- Nenhuma alteracao no banco.
- Nenhuma migration.
- Nenhum seed.
- Nenhuma alteracao em `ScoutTable`.
- Nenhuma alteracao em `RealtimeScoutPage`.

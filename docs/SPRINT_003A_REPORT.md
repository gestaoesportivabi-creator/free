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
- `MatchScoutingWindow` ficou responsavel por espelhar o estado do servico em React, em vez de recalcular tempo em varios pontos.

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
  - Tambem havia inconsistencias tipadas preexistentes em partes de `MatchScoutingWindow`, tratadas apenas no necessario para esta integracao.

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

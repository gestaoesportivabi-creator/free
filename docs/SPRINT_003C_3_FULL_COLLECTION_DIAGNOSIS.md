## Sprint 003C.3
### Diagnóstico do Ciclo Completo de Coleta

Projeto: SCOUT 21 PRO

Data da análise: 2026-07-16

Branch analisada: `feature/cronometro-partida`

### 1. Resumo executivo

O ciclo atual da coleta em tempo real é centrado em `MatchScoutingWindow` e usa três eixos de estado ao mesmo tempo:

- o relógio oficial (`ClockService` + `useMatchClock`);
- o progresso operacional da coleta (`isMatchStarted`, lineup, `collectionPhase`);
- o log acumulado de eventos (`matchEvents` ↔ `postMatchEventLog`).

O botão `Finalizar Coleta` não depende da quantidade de eventos no modo realtime. Ele só habilita quando `isMatchEnded === true`, e isso só acontece quando o relógio entra em `ENCERRADO`.

Em outras palavras: registrar eventos, encerrar a coleta do 1º tempo, salvar, reabrir ou estar em `collectionPhase = 2` não libera o botão por si só.

O fluxo de múltiplos eventos existe e usa append, não overwrite. O problema observado no smoke atual não prova perda de evento: o seletor `event-log-row` só existe quando a visão de logs é aberta, então o teste atual pode falhar mesmo com evento já salvo em memória.

O timestamp oficial já foi centralizado para quase todos os eventos via `getOfficialEventStamp()`. A principal exceção operacional continua sendo o fluxo de gol, que ainda pode depender de um passo manual de tempo antes da confirmação final.

### 2. Diagrama do ciclo atual

#### 2.1 Máquina principal

```text
ABRIR PARTIDA
-> carregar `match` do banco e `realtimeScoutData` do localStorage
-> hidratar lineup, log e `collectionPhase`
-> mostrar modal de escalação se a coleta realtime ainda não estiver pronta

ESCALAÇÃO CONFIRMADA
-> `isMatchStarted = true`
-> `showLineupModal = false`
-> autosave inicial do lineup
-> cronômetro disponível em `PRE_JOGO`

PRE_JOGO
-> botão `clock-start`
-> `iniciarPrimeiroTempo()`
-> estado `PRIMEIRO_TEMPO`

PRIMEIRO_TEMPO
-> eventos usam `getOfficialEventStamp()`
-> autosave por debounce e intervalo
-> se `matchTime >= 20:00`, pode chamar `handleEndTime()`
-> ou operador pode usar `Encerrar coleta do 1º tempo`

INTERVALO
-> `encerrarPrimeiroTempo()`
-> estado `INTERVALO`
-> `clock-start-second-half`

SEGUNDO_TEMPO
-> `iniciarSegundoTempo()`
-> novos eventos passam a ser `period = 2T`
-> se `matchTime >= 20:00`, `handleEndTime()` chama `encerrarPartida()`

ENCERRADO
-> `isMatchEnded = true`
-> `Finalizar Coleta` habilita
-> `handleEndCollection()` salva com `status = encerrado`
-> fecha a tela
```

#### 2.2 Estados relevantes

`ClockState`

- `PRE_JOGO`
- `PRIMEIRO_TEMPO`
- `PAUSADO`
- `SINCRONIZANDO`
- `INTERVALO`
- `SEGUNDO_TEMPO`
- `ENCERRADO`

Estados derivados em `MatchScoutingWindow`

- `isMatchStarted`
- `isRunning`
- `isMatchEnded`
- `isPausedByEvent`
- `isRealtimeActionLocked`
- `showLineupModal`
- `showLogsView`
- `showIntervalAnalysis`
- `autosaveSkipRef`
- `matchEvents`

Persistência operacional

- `collectionPhase = 0 | 1 | 2`
- `postMatchEventLog = []`
- `lineup`
- `substitutionHistory`

### 3. Regra exata de finalização

Componente do botão:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:3134)

Condição:

```ts
disabled={isPostmatch ? matchEvents.length < 1 : !isMatchEnded}
```

Definição de `isMatchEnded`:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:499)

```ts
const isMatchEnded = clockSnapshot.state === 'ENCERRADO';
```

Transição para `ENCERRADO`:

- [useMatchClock.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/hooks/useMatchClock.ts:170)
- [clockService.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/services/clockService.ts:223)

Só ocorre quando:

1. o período atual é `2T`;
2. o estado atual é `SEGUNDO_TEMPO` ou `PAUSADO`;
3. a UI chama `encerrarPartida()`;
4. `handleEndTime()` só tenta isso quando `matchTime >= 20:00`.

Conclusão comprovada:

- `Finalizar Coleta` no realtime não depende de `collectionPhase`;
- não depende do número de eventos;
- não depende do save manual;
- depende exclusivamente do relógio ter chegado ao estado `ENCERRADO`.

### 4. Causa do botão desabilitado

#### 4.1 Causa raiz confirmada

O operador consegue:

- abrir a coleta;
- escalar o time;
- iniciar o relógio;
- registrar eventos;
- guardar como incompleto;
- reabrir;
- encerrar a coleta do 1º tempo.

Mas isso não encerra a partida.

O botão permanece desabilitado porque o estado interno do relógio continua em:

- `PRE_JOGO`, ou
- `PRIMEIRO_TEMPO`, ou
- `PAUSADO`, ou
- `INTERVALO`, ou
- `SEGUNDO_TEMPO`.

Enquanto isso acontecer, `isMatchEnded` segue `false`.

#### 4.2 Fator de UX que amplia a confusão

A UI mostra o botão `Finalizar Coleta` desde o início, mas o pré-requisito real fica implícito.

Além disso, existe outro botão com nome forte:

- `Encerrar coleta do 1º tempo`

Esse botão muda a coleta para o segundo tempo, salva `collectionPhase = 2`, mas não aproxima o operador do estado `ENCERRADO`.

Resultado prático:

- visualmente parece que a coleta está "andando";
- internamente ainda falta passar por `INTERVALO -> SEGUNDO_TEMPO -> ENCERRADO`.

### 5. Fluxo de múltiplos eventos

#### 5.1 Criação

O fluxo base é:

```text
selecionar jogador
-> selecionar ação
-> escolher detalhe/subtipo
-> resolver passos complementares
-> capturar timestamp oficial
-> criar `newEvent`
-> `setMatchEvents(prev => [...prev, newEvent])`
-> aplicar regra do relógio
```

Os registradores usam append explícito:

- passe
- chute
- falta
- desarme
- defesa
- bloqueio
- escanteio
- lateral
- gol
- cartão
- tiro livre
- pênalti

Todos seguem o mesmo padrão de acumulação:

```ts
setMatchEvents(prev => [...prev, newEvent])
```

Conclusão:

- o frontend não sobrescreve o log por desenho;
- o modelo mental é "lista acumulada de eventos".

#### 5.2 Visualização

A tabela de logs só existe quando `showLogsView === true`.

Trecho:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:3183)

As linhas `event-log-row` ficam dentro dessa visão.

Trecho:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:3219)

Conclusão comprovada no ambiente QA:

- com logs fechados, `event-log-row` não existe no DOM;
- ao abrir `Logs`, os eventos aparecem normalmente.

Isso explica a falha do smoke atual:

- o teste trata "linha invisível" como "evento não criado";
- o produto, nesse ponto específico, está escondendo a tabela, não apagando o evento.

#### 5.3 Persistência

O save transforma `matchEvents` em `postMatchEventLog` completo:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1519)

Depois envia o snapshot completo para:

- `upsertMatchRecord()`
- `matchesApi.update()` ou `matchesApi.create()`

Arquivos:

- [matchUpsert.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/utils/matchUpsert.ts:17)
- [api.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/services/api.ts:325)

No backend:

- `matches.service.update/create`
- `matches.repository.update/create`
- coluna `post_match_event_log`

Arquivos:

- [matches.service.ts](C:/Users/Pichau/Documents/Scout%2021/free/backend/src/services/matches.service.ts:377)
- [matches.repository.ts](C:/Users/Pichau/Documents/Scout%2021/free/backend/src/repositories/matches.repository.ts:167)
- [schema.prisma](C:/Users/Pichau/Documents/Scout%2021/free/backend/prisma/schema.prisma:218)

Conclusão:

- o payload leva todos os eventos acumulados;
- o backend persiste o array inteiro;
- a reabertura reconstrói `matchEvents` a partir desse array.

### 6. Origem dos timestamps

#### 6.1 Fonte oficial

Fonte central:

- `getOfficialEventStamp` vindo de `useMatchClock()`
- que delega para `ClockService`

Arquivos:

- [useMatchClock.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/hooks/useMatchClock.ts:260)
- [clockService.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/services/clockService.ts:280)

Wrapper usado na tela:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:846)

```ts
const eventTimeAndPeriod = (rawSeconds, periodOverride) => {
  return getOfficialEventStamp(rawSeconds, periodOverride);
};
```

#### 6.2 Matriz atual

| Evento | Origem do tempo | Período | Persistência | Risco |
| --- | --- | --- | --- | --- |
| Passe | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Chute no gol | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Chute pra fora | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Chute bloqueado | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Falta | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Cartão | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Desarme | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Defesa | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Bloqueio | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Escanteio | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Lateral | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | baixo |
| Tiro livre sem gol | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | médio |
| Pênalti sem gol | `getOfficialEventStamp()` | oficial | `postMatchEventLog` | médio |
| Gol | `getOfficialEventStamp()`, mas pode passar por etapa manual de tempo | oficial ou informado no fluxo do gol | `postMatchEventLog` | alto |

#### 6.3 Caso especial: gol

O gol usa:

- `pendingGoalTime`
- `goalStep = 'time'`
- `completeGoalFromTimeStep()`
- `handleRegisterGoal()`

Trechos:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:2466)
- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:2545)

Conclusão:

- o carimbo final continua passando pelo mesmo serviço oficial;
- mas o valor bruto pode vir de uma entrada manual no fluxo do gol;
- essa é a divergência funcional mais sensível entre "fonte única do relógio" e "tempo informado pelo operador".

### 7. Matriz operacional de pausa do relógio

Fonte:

- [matchClockEventRules.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/utils/matchClockEventRules.ts:24)

Resumo:

| Evento | Pausa antes | Pausa depois | Situação |
| --- | --- | --- | --- |
| Passe | não | não | validado |
| Chute no gol | não | não | validado |
| Chute pra fora | não | por evento | validado |
| Chute na trave | não | não | validado |
| Chute bloqueado | não | não | validado |
| Falta | manual | por evento | validado |
| Gol | manual | por evento | validado |
| Cartão | não | não | validado |
| Desarme | não | não | validado |
| Defesa | não | não | validado |
| Bloqueio | manual | preserva estado atual | pendente |
| Escanteio | manual | preserva estado atual | pendente |
| Tiro livre | manual | preserva estado atual | pendente |
| Pênalti | manual | preserva estado atual | pendente |
| Lateral | manual | preserva estado atual | pendente |

Evidência operacional observada em QA:

- `shot:outside` colocou o relógio em `PAUSADO`;
- a UI passou a mostrar `Evento pausou o relógio. Use continuar partida para retomar.`;
- enquanto isso, novos registros ficaram bloqueados.

Esse comportamento é coerente com a regra atual.

### 8. Comportamento do save

#### 8.1 Fontes de save

Existem três caminhos:

1. autosave por debounce;
2. autosave periódico;
3. save manual.

Trechos:

- debounce: [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1889)
- intervalo: [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1938)
- save manual: [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1839)

#### 8.2 Payload

O snapshot enviado contém:

- `status`
- `collectionPhase`
- `postMatchEventLog`
- `lineup`
- `substitutionHistory`
- `playerStats`
- `teamStats`
- posse

Origem:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1736)

#### 8.3 Destino

Frontend:

```text
MatchScoutingWindow
-> onSave(snapshot)
-> RealtimeScoutPage.handleSave()
-> upsertMatchRecord()
-> matchesApi.update/create()
-> PUT/POST /api/matches
```

Backend:

```text
controller / route matches
-> matches.service.update/create
-> matches.repository.update/create
-> jogos.post_match_event_log
-> jogos.collection_phase
-> adapter transformMatchToFrontend
-> resposta ao frontend
```

### 9. Comportamento da reabertura

#### 9.1 Rehidratação

Na rota realtime:

- `RealtimeScoutPage` lê `realtimeScoutData` do `localStorage`;
- se existir `matchId`, faz `matchesApi.getById(matchId)`;
- se a partida estiver disponível/em andamento/não executada ou já tiver log, usa a versão do banco.

Arquivo:

- [RealtimeScoutPage.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/RealtimeScoutPage.tsx:29)

Na janela de coleta:

- `match.postMatchEventLog` é convertido de volta para `matchEvents`;
- `collectionPhase` ajuda a inferir se a reabertura volta em `1T` ou `2T`.

Trecho:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1213)

#### 9.2 Resultado arquitetural

- a reabertura foi desenhada para reconstruir a sequência inteira;
- não há deduplicação explícita do log;
- não há overwrite "por índice";
- o risco principal está em salvar snapshot incompleto, não em sobrescrever só o último lance.

### 10. Aviso ao sair

Origem:

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx:1948)

Comportamento:

```ts
const onBeforeUnload = (event) => {
  void saveSilently();
  event.preventDefault();
  event.returnValue = '';
};
```

Conclusões:

- o navegador sempre recebe um `beforeunload` enquanto a janela está aberta;
- isso dispara tentativa de autosave;
- isso também força o diálogo nativo do navegador;
- a regra não verifica se houve ou não mudança pendente antes de armar o aviso.

Risco:

- pode gerar falso positivo mesmo depois de save recente;
- pode passar a sensação de coleta "sempre aberta";
- não é a causa raiz do botão desabilitado, mas piora a percepção do fluxo.

### 11. Execução observada no ambiente QA

Fluxo comprovado em sessão limpa:

1. login QA funcional;
2. tenant QA visível;
3. partida `QA CRONOMETRO 003B` visível;
4. `Retomar Coleta` abre `/scout-realtime`;
5. reabertura volta exigindo escalação inicial;
6. após escalação, a coleta entra em `PRE_JOGO`;
7. evento simples em `1T` é criado com timestamp oficial;
8. `event-log-row` não existe com logs fechados;
9. `event-log-row` aparece ao abrir `Logs`;
10. múltiplos eventos foram acumulados em sequência no log;
11. um chute `Pra fora` pausou o relógio e bloqueou novos eventos até `Continuar Partida`.

Limitação da execução desta análise:

- o encerramento completo até `ENCERRADO` ficou parcialmente condicionado ao relógio visível avançar após sincronização em aba controlada em background;
- a regra de código, porém, é inequívoca: sem `clockSnapshot.state === 'ENCERRADO'`, o botão nunca habilita.

### 12. Bugs identificados

#### P1

`Finalizar Coleta` não habilita enquanto a partida não entra em `ENCERRADO`, mas a UI não comunica isso claramente.

Causa:

- dependência rígida de `isMatchEnded`;
- sem feedback textual específico do bloqueio.

#### P1

Fluxo de gol ainda mantém divergência operacional por etapa manual de tempo.

Causa:

- `goalStep = 'time'` ainda deixa o operador informar o tempo antes da confirmação final.

#### P2

Smoke E2E atual usa `event-log-row` sem abrir a visão de logs.

Causa:

- seletor acoplado à tabela oculta;
- falso negativo de teste.

#### P2

Reabertura da coleta realtime pode voltar exigindo escalação antes de liberar o cronômetro, mesmo quando o operador entende que está apenas retomando a partida.

Causa:

- dependência de `lineupPlayers`, `ballPossessionStart` e `isMatchStarted`;
- UX não deixa claro se a escalação salva foi ou não restaurada.

#### P2

Diálogo de saída é armado sempre que a janela está aberta.

Causa:

- `beforeunload` não distingue "sem alteração pendente" de "alteração pendente".

### 13. Causa raiz consolidada

O sistema não está modelado em torno de "encerrar coleta" como conceito próprio.

Ele está modelado em torno de:

- relógio oficial da partida;
- log acumulado de eventos;
- snapshot completo da partida.

Por isso:

- evento salvo não encerra partida;
- `collectionPhase = 2` não encerra partida;
- botão de finalizar não responde ao log;
- só o estado final do relógio manda no encerramento realtime.

Modelo mental atual do software:

```text
partida = snapshot editável
eventos = lista acumulada que recalcula estatísticas
cronômetro = autoridade de período/tempo
save = serialização completa do snapshot
```

O domínio está mais próximo de:

- eventos
- estatísticas derivadas de eventos

e menos de:

- workflow operacional explícito de fechamento.

### 14. Plano de correção em pequenas missões

#### Missão 1

Explicitar a regra de bloqueio do botão `Finalizar Coleta`.

Objetivo:

- mostrar ao operador que falta encerrar a partida no relógio;
- alinhar texto, estado visual e expectativa.

#### Missão 2

Separar "evento criado" de "tabela de logs aberta".

Objetivo:

- corrigir o smoke E2E sem mascarar bug real;
- usar seletor de evidência de evento fora da tela de logs, ou abrir logs explicitamente.

#### Missão 3

Fechar a divergência do tempo manual no fluxo de gol.

Objetivo:

- alinhar gol à mesma fonte única de timestamp;
- eliminar risco de divergência entre operador e relógio oficial.

#### Missão 4

Tornar o ciclo realtime mais explícito entre `1T`, `intervalo`, `2T` e `encerrado`.

Objetivo:

- reduzir perda de contexto operacional;
- evitar que `Encerrar coleta do 1º tempo` pareça fim do processo.

#### Missão 5

Revisar `beforeunload` e critérios de autosave pendente.

Objetivo:

- remover falso positivo de saída;
- manter proteção de dados sem prender a sessão desnecessariamente.

### 15. Arquivos centrais analisados

Frontend

- [MatchScoutingWindow.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/MatchScoutingWindow.tsx)
- [useMatchClock.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/hooks/useMatchClock.ts)
- [clockService.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/services/clockService.ts)
- [matchClockEventRules.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/utils/matchClockEventRules.ts)
- [RealtimeScoutPage.tsx](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/components/RealtimeScoutPage.tsx)
- [matchUpsert.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/utils/matchUpsert.ts)
- [api.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/services/api.ts)
- [scout-flow.ts](C:/Users/Pichau/Documents/Scout%2021/free/21Scoutpro/e2e/helpers/scout-flow.ts)

Backend

- [matches.service.ts](C:/Users/Pichau/Documents/Scout%2021/free/backend/src/services/matches.service.ts)
- [matches.repository.ts](C:/Users/Pichau/Documents/Scout%2021/free/backend/src/repositories/matches.repository.ts)
- [match.adapter.ts](C:/Users/Pichau/Documents/Scout%2021/free/backend/src/adapters/match.adapter.ts)
- [schema.prisma](C:/Users/Pichau/Documents/Scout%2021/free/backend/prisma/schema.prisma)

## Atualizacao da Sprint 003D

As hipoteses centrais deste diagnostico foram confirmadas e tratadas na implementacao seguinte:

- a regra final de encerramento permaneceu `ClockState = ENCERRADO`, mas ganhou explicacao operacional visivel na UI;
- o fluxo de gol em realtime deixou de aceitar tempo manual e passou a usar apenas `getOfficialEventStamp()`;
- a reabertura realtime voltou a buscar corretamente a partida salva depois da correcao de `matchesApi.getById()` para `getOne()`;
- o log E2E passou a abrir a visao de `Logs` explicitamente antes de validar `event-log-row`;
- o `beforeunload` passou a depender de alteracao pendente real;
- o ciclo completo com dez eventos, gol, encerramento, finalizacao e reabertura foi validado no ambiente QA.

Resultado consolidado da validacao de `2026-07-16`:

- `qa-smoke.spec.ts`: aprovado
- `clock-controls.spec.ts`: aprovado
- `persistence.spec.ts`: aprovado
- `cleanup-dry-run.spec.ts`: aprovado
- `full-match-cycle.spec.ts`: aprovado

Rodada consolidada final:

- `10/10` testes aprovados
- execucao serial
- massa QA oficial preservada

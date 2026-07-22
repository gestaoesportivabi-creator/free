# SPRINT 003G POSTMATCH DIAGNOSIS

Projeto: `SCOUT 21 PRO`  
Repositório: `free`  
Branch: `fix/compatibilidade-pos-jogo`  
Data: `2026-07-22`

## Objetivo desta leitura

Mapear como o modo Pós-Jogo funciona hoje, quais partes ele compartilha com o Realtime e onde surgiram as regressões após a integração do novo cronômetro.

## Arquivos principais envolvidos

- `21Scoutpro/components/ScoutTable.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/hooks/useMatchClock.ts`
- `21Scoutpro/services/clockService.ts`
- `21Scoutpro/utils/matchPeriod.ts`
- `21Scoutpro/utils/matchUpsert.ts`
- `21Scoutpro/types.ts`
- `backend/src/services/matches.service.ts`
- `backend/src/adapters/match.adapter.ts`
- `backend/src/types/frontend.ts`

## Como o Pós-Jogo nasce hoje

### Entrada no fluxo

O acesso começa em `ScoutTable.tsx`.

- Partida programada:
  - o usuário escolhe `postmatch` no `CollectionTypeSelector`;
  - seleciona atletas;
  - `ScoutTable` abre `MatchScoutingWindow` com `mode="postmatch"`.
- Partida salva:
  - se a partida ainda não foi executada, o seletor também oferece `postmatch`;
  - se a partida já existe, o botão `reopen-match` reabre a mesma `MatchScoutingWindow` em `mode="postmatch"`.

### Componente principal

O modo Pós-Jogo não usa mais `PostMatchCollectionSheet` no fluxo ativo.

Hoje o fluxo oficial de Pós-Jogo passa pelo mesmo componente do Realtime:

- `MatchScoutingWindow`

Diferença principal:

- `mode="realtime"` usa cronômetro em andamento;
- `mode="postmatch"` usa tempo manual, mas continua hidratando o mesmo `ClockService`.

## Como nasce um evento

O evento nasce dentro de `MatchScoutingWindow.tsx`.

Fluxo atual:

1. o usuário escolhe uma ação na grade de botões;
2. o componente monta estados intermediários como `actionFlow`, `goalStep`, `selectedAction`;
3. se o evento exigir jogador, goleiro, detalhe ou tempo, o fluxo avança por etapas;
4. ao confirmar, um handler `handleRegister*` cria um objeto `MatchEvent`;
5. esse `MatchEvent` entra em `matchEvents`;
6. `buildMatchSnapshot()` converte `matchEvents` em `MatchRecord`;
7. `onSave` persiste via `upsertMatchRecord()`.

## Como nasce um gol

O gol nasce em `MatchScoutingWindow.tsx` via:

- `goalStep`
- `pendingGoalType`
- `pendingGoalIsOpponent`
- `pendingGoalPlayerId`
- `pendingAssistPlayerId`
- `pendingGoalMethod`
- `pendingGoalTime`

Fluxo atual:

1. escolher `Gol`;
2. escolher time do gol;
3. escolher autor;
4. escolher método;
5. escolher assistência opcional;
6. em Pós-Jogo, abrir passo manual de tempo;
7. `handleRegisterGoal()` cria `MatchEvent` do tipo `goal`;
8. o placar local é atualizado com `setGoalsFor` ou `setGoalsAgainst`;
9. a assistência é salva como metadado do gol, não como evento separado.

## Como nasce uma assistência

Hoje a assistência nasce como atributo de um gol.

Ela não nasce como `MatchEvent` separado no fluxo moderno.

No `handleRegisterGoal()`:

- `assistPlayerId`
- `assistPlayerName`

são gravados diretamente no mesmo evento de gol.

Observação importante:

- `types.ts` ainda define `PostMatchAction = 'assist'`;
- `PostMatchCollectionSheet.tsx` ainda contém um fluxo legado com `assist` separado;
- `MatchScoutingWindow.tsx` não produz esse evento separado no fluxo ativo.

## Quem gera o timestamp

O timestamp atual é centralizado em:

- `getOfficialEventStamp()`
- que delega para `getEventStamp()` de `clockService`

No Pós-Jogo:

- `getTimeForEvent()` devolve `manualMinute * 60 + manualSecond`;
- `eventTimeAndPeriod()` chama `getOfficialEventStamp(rawSeconds, periodOverride)`;
- `ClockService` em `mode='postmatch'` converte esse tempo absoluto para:
  - `period`
  - `time` relativo à metade

Resumo:

- a origem do tempo é manual;
- a normalização técnica do timestamp ainda passa pelo mesmo relógio oficial.

## Quem gera o período

No fluxo ativo, o período também é derivado do mesmo pipeline.

No Pós-Jogo:

- `manualMinute/manualSecond` representam tempo absoluto;
- `clockService` + `matchPeriod.absoluteSecondsToStored()` determinam `1T` ou `2T`;
- `currentPeriod` continua sendo usado em vários fluxos de UI;
- `collectionPhase` também influencia a hidratação inicial do estado.

## Quem salva

O save nasce em `MatchScoutingWindow.tsx`.

Fluxo:

1. `buildMatchSnapshot(status)`
2. `convertMatchEventsToMatchRecord(matchEvents)`
3. `onSave(savedMatch, options)`
4. `ScoutTable` ou `RealtimeScoutPage` chama `upsertMatchRecord()`
5. `upsertMatchRecord()` usa:
   - `matchesApi.update()` se o ID já existe no servidor
   - `matchesApi.create()` se for `temp-` ou `sched-`

No backend:

- `matches.service.ts` aceita `postMatchEventLog` e `collectionPhase`
- o campo `post_match_event_log` é persistido como JSON

## Quem reabre

A reabertura também passa por `MatchScoutingWindow.tsx`.

Fluxo:

1. `ScoutTable` passa a partida salva para `MatchScoutingWindow`;
2. ao abrir, um `useEffect` lê:
   - `match.postMatchEventLog`
   - `match.lineup`
   - `match.collectionPhase`
3. `postMatchEventLogToMatchEvents()` reconstrói `matchEvents`;
4. `recalcGoalsAndFoulsFromEvents()` reconstrói placar e faltas;
5. o estado manual/clock é reidratado conforme `collectionPhase` e presença de eventos de `2T`.

## Componentes compartilhados entre Realtime e Pós-Jogo

- `MatchScoutingWindow`
- `useMatchClock`
- `ClockService`
- `matchPeriod.ts`
- `buildMatchSnapshot`
- `convertMatchEventsToMatchRecord`
- `postMatchEventLogToMatchEvents`
- tela de logs/edição
- fluxo de save/autosave

## Estados compartilhados entre Realtime e Pós-Jogo

- `matchEvents`
- `goalsFor`
- `goalsAgainst`
- `selectedPlayerId`
- `selectedAction`
- `actionFlow`
- `goalStep`
- `pendingGoal*`
- `editingEventId`
- `editDraft`
- `currentPeriod`
- `clockSnapshot`
- `persistedMatchIdRef`
- `autosave*`

## Helpers compartilhados

- `getOfficialEventStamp`
- `eventTimeAndPeriod`
- `getTipoSubtipo`
- `buildMatchSnapshot`
- `convertMatchEventsToMatchRecord`
- `postMatchEventLogToMatchEvents`
- `recalcGoalsAndFoulsFromEvents`
- `storedToAbsoluteSeconds`
- `absoluteSecondsToStored`
- `canonicalizePostMatchEventClock`

## Tabela de responsabilidades

| Item | Realtime | Pós-Jogo |
| --- | --- | --- |
| Origem do tempo | cronômetro vivo | `manualMinute` + `manualSecond` |
| Origem do período | estado do relógio | derivado do tempo manual + `ClockService` |
| Origem do timestamp | `getOfficialEventStamp()` | `getOfficialEventStamp()` |
| ClockService | obrigatório | ainda obrigatório para normalizar tempo/período |
| Evento | `MatchEvent` | `MatchEvent` |
| Gol | `MatchEvent` + fluxo `goalStep` | mesmo fluxo `goalStep` |
| Assistência | atributo do gol | atributo do gol |
| Save | `buildMatchSnapshot` + `onSave` | mesmo pipeline |
| Reabertura | `postMatchEventLogToMatchEvents` | mesmo pipeline |
| Payload | `MatchRecord` | `MatchRecord` |
| Persistência | `postMatchEventLog` + stats | mesma persistência |
| Tabela/log | tela de logs do `MatchScoutingWindow` | mesma tela |

## Causa-raiz provável observada já no diagnóstico

### 1. Persistência parcial do catálogo de eventos

O fluxo da UI registra mais tipos de `MatchEvent` do que o payload `PostMatchAction` suporta hoje.

`matchEventToPostMatchAction()` só persiste:

- `goal`
- `passCorrect`
- `passWrong`
- `shotOn`
- `shotOff`
- `shotZonaChute`
- `falta`
- `tackleWithBall`
- `tackleWithoutBall`
- `tackleCounter`
- `save`

Hoje ficam fora da persistência:

- `card`
- `block`
- `corner`
- `freeKick`
- `penalty`
- `lateral`

Impacto:

- o operador consegue registrar esses eventos na UI;
- o save não leva todos para `postMatchEventLog`;
- a reabertura perde esses eventos;
- o Pós-Jogo aparenta funcionar, mas não é compatível end-to-end.

### 2. Modelo misto entre legado da planilha e fluxo novo

O domínio ainda carrega dois modelos concorrentes:

- legado: `PostMatchCollectionSheet` com `assist` separado e catálogo antigo;
- fluxo atual: `MatchScoutingWindow` com assistência embutida no gol e catálogo realtime ampliado.

Impacto:

- parte das tipagens e expectativas de payload ainda refletem o modelo antigo;
- o componente novo escreve um conjunto de eventos maior do que o log legado entende;
- `save` e `reopen` viram o gargalo de compatibilidade.

### 3. Dependência indevida do pipeline do Realtime

Mesmo no Pós-Jogo, o fluxo depende de:

- `ClockService`
- `clockSnapshot`
- `collectionPhase`
- `goalStep`
- `actionFlow`
- hidratação compartilhada com o Realtime

Isso não é necessariamente um erro, mas hoje aumenta o risco de regressão porque:

- qualquer mudança de relógio ou fase afeta também o Pós-Jogo;
- o modo manual não está isolado o suficiente da arquitetura realtime.

## Hipótese operacional para os bugs reportados

Os sintomas mais prováveis do Pós-Jogo hoje são:

- eventos registrados na tela, mas sumindo após salvar e reabrir;
- eventos com payload parcial ou não persistido;
- inconsistência entre o que a UI promete e o que `postMatchEventLog` suporta;
- risco maior em `gol + assistência`, `edição`, `múltiplos eventos` e reabertura.

## Próximos passos desta Sprint

1. reproduzir o fluxo completo no ambiente QA em `mode="postmatch"`;
2. classificar cada evento como funciona/parcial/quebra;
3. alinhar o catálogo da UI com o catálogo persistível;
4. restaurar save + reabertura sem quebrar o Realtime;
5. cobrir o Pós-Jogo com Playwright.

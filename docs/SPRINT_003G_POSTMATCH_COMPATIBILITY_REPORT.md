# SPRINT 003G POSTMATCH COMPATIBILITY REPORT

Projeto: `SCOUT 21 PRO`  
Repositorio: `free`  
Branch: `fix/compatibilidade-pos-jogo`  
Data: `2026-07-22`

## Resumo executivo

A incompatibilidade principal nao estava no backend nem no banco.

Ela estava no contrato compartilhado entre:

- `MatchScoutingWindow`
- `convertMatchEventsToMatchRecord()`
- `postMatchEventLog`
- `postMatchEventLogToMatchEvents()`

O fluxo ativo ja criava `MatchEvent` para `card`, `block`, `corner`, `freeKick`, `penalty` e `lateral`, mas o snapshot salvo ainda so entendia o catalogo antigo do Pos-Jogo.

Resultado anterior:

- o operador registrava o evento na UI;
- o save parecia funcionar;
- a reabertura descartava parte dos eventos;
- `freeKick` e `penalty` com gol ainda podiam voltar sem recompor o placar corretamente.

## Causa raiz

### 1. Payload menor que a UI

`matchEventToPostMatchAction()` ignorava:

- `card`
- `block`
- `corner`
- `freeKick`
- `penalty`
- `lateral`

### 2. Rehidratacao incompleta

`postMatchEventLogToMatchEvents()` nao sabia reconstruir esses tipos nem seus metadados operacionais.

Campos que faltavam no contrato:

- `result`
- `cardType`
- `cardTeam`
- `isForUs`
- `kickerId`
- `kickerName`

### 3. Placar recomposto so por `goal`

`recalcGoalsAndFoulsFromEvents()` ignorava gols vindos de:

- `freeKick`
- `penalty`

## Correcoes aplicadas

### Dominio e payload

Arquivos:

- `21Scoutpro/types.ts`
- `backend/src/types/frontend.ts`

Ajustes:

- ampliado `PostMatchAction` para refletir o catalogo real do fluxo ativo;
- adicionados campos opcionais para reabrir os eventos sem perda de informacao.

### Janela compartilhada de coleta

Arquivo:

- `21Scoutpro/components/MatchScoutingWindow.tsx`

Ajustes:

- serializacao de `card`, `block`, `corner`, `freeKick`, `penalty` e `lateral`;
- reidratacao desses eventos no reopen;
- preservacao de `cardType`, `cardTeam`, `result`, `isForUs`, `kickerId` e `kickerName`;
- `freeKick` e `penalty` contra passaram a usar `OPPONENT_FAKE_PLAYER_ID`, evitando perda no save;
- recalc de placar passou a considerar gols de bola parada;
- adicionados `data-testid` minimos para seletores de eventos do fluxo coberto.

### Legado tipado

Arquivo:

- `21Scoutpro/components/PostMatchCollectionSheet.tsx`

Ajuste:

- tabela local de `ACTION_TIPO_SUBTIPO` alinhada com o `PostMatchAction` novo para nao quebrar `type-check` legado.

## Reproducao validada

Arquivo:

- `21Scoutpro/e2e/specs/postmatch-data-entry.spec.ts`

Cenario coberto:

1. abrir coleta QA autenticada;
2. registrar `corner`;
3. registrar `card`;
4. registrar `goal`;
5. salvar;
6. reabrir;
7. confirmar persistencia dos eventos e dos timestamps.

Observacao importante:

Na massa QA disponivel em `2026-07-22`, o card reutilizavel abre primeiro a janela compartilhada de coleta. Por isso a automacao desta Sprint validou diretamente o gargalo arquitetural comum:

`MatchScoutingWindow -> postMatchEventLog -> save/reopen`

Esse e exatamente o ponto de compatibilidade compartilhado entre Realtime e Pos-Jogo.

## Validacoes executadas

### E2E

Com `E2E_BASE_URL=http://localhost:5176`:

- `qa-smoke.spec.ts`: aprovado
- `postmatch-data-entry.spec.ts`: aprovado

### Ambiente

- backend local: `GET /health` aprovado
- frontend local: servido em `http://localhost:5176`

## Riscos remanescentes

### 1. Entrada operacional explicita no Pos-Jogo

A massa QA atual nao oferece um card programado reutilizavel abrindo o seletor de Pos-Jogo no mesmo ponto em todas as execucoes.

Impacto:

- a automacao precisou validar o pipeline compartilhado, e nao a navegacao completa pelo seletor `scouting-open`.

### 2. Selecao explicita de assistencia no replay salvo atual

Na coleta QA reaproveitada desta data, a lateral ativa nao expunha mais de um atleta habilitado no passo de assistencia.

Impacto:

- o fluxo automatizado fechou o gol com `Sem assistencia`;
- a limitacao foi registrada como pendencia operacional, nao como falha da persistencia corrigida nesta Sprint.

## Recomendacao para a proxima Sprint

Prioridade sugerida:

1. estabilizar uma partida QA dedicada para Pos-Jogo puro;
2. cobrir `assistencia` explicita no E2E com massa previsivel;
3. adicionar cenario dedicado para `freeKick` e `penalty` com `result = goal`;
4. decidir se o replay salvo deve abrir em Pos-Jogo, Realtime ou oferecer escolha explicita quando o estado estiver inconsistente.

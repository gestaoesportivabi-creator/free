# SPRINT 003G POSTMATCH COMPATIBILITY REPORT

Projeto: `SCOUT 21 PRO`  
Repositorio: `free`  
Branch: `fix/compatibilidade-pos-jogo`  
Data: `2026-07-23`

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

## Atualizacao 003G.1 - fechamento operacional

### Causa raiz confirmada do placar `1 x 0`

O defeito confirmado estava na reidratacao local apos autosave do `1T`.

Quando a partida QA pos-jogo abria de um fixture vazio:

- o primeiro gol do `2T` entrava corretamente;
- o autosave anterior do intervalo atualizava `match` com snapshot antigo;
- o `useEffect` de hidratacao de `MatchScoutingWindow` reaplicava estado vazio ou defasado;
- `matchEvents` perdia o primeiro gol do `2T`;
- o segundo gol ficava como unico evento contabilizado;
- o placar derivado aparecia como `1 x 0`.

Correcao aplicada:

- marcar a hidratacao inicial como consumida mesmo quando o fixture pos-jogo comeca vazio;
- impedir que autosaves subsequentes do mesmo `match.id` limpem o estado local em andamento.

Resultado validado:

- dois gols consecutivos agora geram dois eventos distintos;
- o log mostra dois gols;
- o placar local vai para `2 x 0`;
- save e reopen preservam autor, assistencia opcional, periodo e horario.

### Causa da abertura imprevisivel de `QA POS-JOGO 003G`

O problema era o reaproveitamento do mesmo fixture QA entre execucoes.

Quando a partida ficava salva ou incompleta:

- o card deixava de entrar por `scouting-open`;
- `ScoutTable` passava a abrir `reopen-match`;
- dependendo de `status`, `lineup` e ids ativos, o caminho de reabertura podia priorizar realtime.

Correcao aplicada:

- a seed oficial passou a manter e normalizar uma partida QA dedicada para pos-jogo;
- `QA POS-JOGO 003G` volta sempre para `status = disponivel`, `collectionPhase = 0`, placar `0 x 0` e log vazio;
- `postmatch-data-entry.spec.ts` chama essa normalizacao antes da abertura inicial;
- o helper de abertura inicial do pos-jogo falha cedo se nao encontrar o seletor dedicado.

### Automacao validada

Rodada nominal:

- `postmatch-data-entry.spec.ts`: aprovado
- `qa-smoke.spec.ts`: aprovado
- `clock-controls.spec.ts`: aprovado
- `persistence.spec.ts`: aprovado
- `full-match-cycle.spec.ts`: aprovado
- `cleanup-dry-run.spec.ts`: aprovado

Suite completa:

- 1a execucao: `11/11` aprovados
- 2a execucao: `11/11` aprovados

Duracao observada:

- suite completa 1: ~`5.7 min`
- suite completa 2: ~`6.0 min`

### Validacoes tecnicas desta rodada

- backend `GET /health`: aprovado
- backend `npm run type-check`: aprovado
- frontend `npm run build`: aprovado
- frontend `npm run type-check`: reprovado por erros historicos fora do escopo da Sprint

Observacao:

- o `build` atualiza artefatos gerados (`public/sitemap.xml` e `dist/index.html`);
- esses arquivos nao fazem parte da correcao funcional do pos-jogo e nao devem entrar em commit desta Sprint sem justificativa adicional.

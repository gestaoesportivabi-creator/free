# EVENT_MATRIX

Documento informativo da Sprint 003A.

Objetivo: registrar o comportamento atual dos eventos da coleta em `MatchScoutingWindow`.

Importante:
- Nenhuma regra de execucao depende deste arquivo nesta Sprint.
- Onde houver ambiguidade funcional, foi registrado `Pendente de validacao com a comissao tecnica.`

## Matriz

| Evento | Categoria | Pausa cronometro | Confirmacao | Informacao complementar | Comportamento esperado | Observacoes |
| --- | --- | --- | --- | --- | --- | --- |
| `pass` | Posse / construcao | Nao | Nao | Resultado (`correct` ou `wrong`), receptor opcional, flag de transicao no passe errado | Registra timestamp oficial, jogador, resultado e opcionalmente receptor. Passe certo pode manter fluxo aguardando receptor. | `passCorrect` e `passWrong` vao para `postMatchEventLog`. Variantes `passTransicao` e `passProgressao` existem no dominio legado, mas nao sao produzidas pelo fluxo ativo. |
| `shot` | Finalizacao | `outside` pausa; demais tentam retomar | Nao | Resultado (`inside`, `outside`, `post`, `blocked`) | Registra finalizacao com timestamp oficial e resultado. | `blocked` e persistido como `shotZonaChute`. |
| `goal` | Finalizacao decisiva | Sim | Sim, via fluxo de time/autor/assistencia/metodo | Time do gol, autor, assistencia opcional e metodo do gol | Registra gol com timestamp oficial, atualiza placar e fecha fluxo pendente. | Desde a Sprint 003D, em realtime nao existe mais digitacao manual de tempo; em `2T` o log exibe tempo absoluto da partida, por exemplo `22:40` com `period = 2T`. Gol do adversario e gol contra usam jogador fake. |
| `foul` | Interrupcao / disciplina | Sim no clique do botao em realtime | Parcial | Time faltoso (`for` ou `against`) e, no fluxo atual, zona em alguns atalhos | Registra falta com timestamp oficial e atualiza contagem por periodo. | A zona nao e persistida no payload atual da falta. Pendente de validacao com a comissao tecnica. |
| `card` | Disciplina | Nao ha pausa dedicada no fluxo atual | Sim, escolha de tipo | Tipo (`yellow`, `secondYellow`, `red`) e time (`for` ou `against`) | Registra cartao com timestamp oficial; para nossa equipe atualiza `playerCards`. | Desde a Sprint 003G, o cartao tambem entra em `postMatchEventLog` e volta na reabertura com `cardType` e `cardTeam`. |
| `tackle` | Recuperacao / defesa | Nao | Nao | Tipo (`withBall`, `withoutBall`, `counter`) | Registra desarme com timestamp oficial e ajusta posse atual. | Eventos ativos persistem como `tackleWithBall`, `tackleWithoutBall` e `tackleCounter`. |
| `save` | Defesa do goleiro | Nao | Nao | Tipo (`simple`, `hard`, `outside`) e goleiro escolhido | Registra defesa com timestamp oficial e pode retomar o relogio. | `outside` continua tratado como defesa, nao como novo tipo de evento. |
| `block` | Defesa de linha | Pode pausar antes do registro em realtime | Nao | Jogador ou marcador fake de equipe | Registra bloqueio com timestamp oficial e tenta retomar o relogio. | Desde a Sprint 003G, possui `PostMatchAction` proprio e persiste na reabertura. |
| `corner` | Bola parada | Sim | Nao | Zona opcional | Registra escanteio com timestamp oficial. | Desde a Sprint 003G, possui `PostMatchAction` proprio e persiste zona + timestamp na reabertura. |
| `freeKick` | Bola parada | Sim | Sim, via time/cobrador/resultado | Time, cobrador, resultado (`goal`, `saved`, `outside`, `post`, `noGoal`) | Registra tiro livre com timestamp oficial, atualiza placar se necessario e pode retomar apos atraso curto. | Desde a Sprint 003G, persiste `result`, `isForUs`, cobrador e volta com placar recomposto quando `result = goal`. |
| `penalty` | Bola parada | Sim | Sim, via time/cobrador/resultado | Time, cobrador, resultado (`goal`, `saved`, `outside`, `post`, `noGoal`) | Registra penalti com timestamp oficial, atualiza placar se necessario e pode retomar apos atraso curto. | Desde a Sprint 003G, persiste `result`, `isForUs`, cobrador e volta com placar recomposto quando `result = goal`. |
| `lateral` | Reposicao | Sim no clique do atalho em realtime | Nao | Zona opcional | Registra lateral com timestamp oficial. | Desde a Sprint 003G, possui `PostMatchAction` proprio e persiste zona + timestamp na reabertura. |

## Leituras rapidas

- Eventos hoje persistidos com correspondencia direta em `postMatchEventLog`: `goal`, `pass`, `shot`, `foul`, `card`, `tackle`, `save`, `block`, `corner`, `freeKick`, `penalty`, `lateral`.
- `goal` continua sendo o unico evento com assistencia embutida no payload ativo; `assist` separado permanece apenas no dominio legado.
- `freeKick` e `penalty` com `result = goal` agora recompõem placar corretamente no save e na reabertura.
- Regra atual de timestamp do gol: realtime sempre usa `getOfficialEventStamp()`; entrada manual continua restrita ao fluxo explicitamente pos-jogo.

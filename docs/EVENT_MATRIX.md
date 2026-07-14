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
| `goal` | Finalizacao decisiva | Sim | Sim, via fluxo de time/autor/assistencia/metodo/tempo | Time do gol, autor, assistencia opcional, metodo do gol, tempo | Registra gol com timestamp oficial, atualiza placar e fecha fluxo pendente. | Gol do adversario e gol contra usam jogador fake. |
| `foul` | Interrupcao / disciplina | Sim no clique do botao em realtime | Parcial | Time faltoso (`for` ou `against`) e, no fluxo atual, zona em alguns atalhos | Registra falta com timestamp oficial e atualiza contagem por periodo. | A zona nao e persistida no payload atual da falta. Pendente de validacao com a comissao tecnica. |
| `card` | Disciplina | Nao ha pausa dedicada no fluxo atual | Sim, escolha de tipo | Tipo (`yellow`, `secondYellow`, `red`) e time (`for` ou `against`) | Registra cartao com timestamp oficial; para nossa equipe atualiza `playerCards`. | Cartoes nao viram `PostMatchAction`; entram apenas em estatisticas do jogador. |
| `tackle` | Recuperacao / defesa | Nao | Nao | Tipo (`withBall`, `withoutBall`, `counter`) | Registra desarme com timestamp oficial e ajusta posse atual. | Eventos ativos persistem como `tackleWithBall`, `tackleWithoutBall` e `tackleCounter`. |
| `save` | Defesa do goleiro | Nao | Nao | Tipo (`simple`, `hard`, `outside`) e goleiro escolhido | Registra defesa com timestamp oficial e pode retomar o relogio. | `outside` continua tratado como defesa, nao como novo tipo de evento. |
| `block` | Defesa de linha | Pode pausar antes do registro em realtime | Nao | Jogador ou marcador fake de equipe | Registra bloqueio com timestamp oficial e tenta retomar o relogio. | Nao possui `PostMatchAction` correspondente no payload persistido. Pendente de validacao com a comissao tecnica. |
| `corner` | Bola parada | Sim | Nao | Zona opcional | Registra escanteio com timestamp oficial. | Nao possui `PostMatchAction` correspondente no payload persistido. Pendente de validacao com a comissao tecnica. |
| `freeKick` | Bola parada | Sim | Sim, via time/cobrador/resultado | Time, cobrador, resultado (`goal`, `saved`, `outside`, `post`, `noGoal`) | Registra tiro livre com timestamp oficial, atualiza placar se necessario e pode retomar apos atraso curto. | Nao possui `PostMatchAction` correspondente no payload persistido. Pendente de validacao com a comissao tecnica. |
| `penalty` | Bola parada | Sim | Sim, via time/cobrador/resultado | Time, cobrador, resultado (`goal`, `saved`, `outside`, `post`, `noGoal`) | Registra penalti com timestamp oficial, atualiza placar se necessario e pode retomar apos atraso curto. | Nao possui `PostMatchAction` correspondente no payload persistido. Pendente de validacao com a comissao tecnica. |
| `lateral` | Reposicao | Sim no clique do atalho em realtime | Nao | Zona opcional | Registra lateral com timestamp oficial. | Nao possui `PostMatchAction` correspondente no payload persistido. Pendente de validacao com a comissao tecnica. |

## Leituras rapidas

- Eventos hoje persistidos com correspondencia direta em `postMatchEventLog`: `goal`, `pass`, `shot`, `foul`, `tackle`, `save`.
- Eventos hoje mantidos no fluxo ativo, mas sem mapeamento completo para `PostMatchAction`: `block`, `corner`, `freeKick`, `penalty`, `lateral`.
- `card` segue regra propria: afeta estatisticas do jogador, mas nao entra como `PostMatchAction`.

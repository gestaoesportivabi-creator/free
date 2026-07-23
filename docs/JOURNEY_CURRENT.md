# JOURNEY_CURRENT

Projeto: `SCOUT 21 PRO`
Sprint: `004A`
Data: `2026-07-23`
Escopo: descoberta da jornada atual, sem alteracao funcional.

## Resumo executivo

Hoje a coleta ja funciona, mas a jornada foi crescendo em camadas:

- `ScoutTable` decide o tipo de partida e o modo de coleta.
- `CollectionTypeSelector` abre uma bifurcacao entre realtime e pos-jogo.
- `ScoutTable` ainda tem uma tela de preparacao diferente para cada modo.
- `MatchScoutingWindow` concentra quase toda a operacao real.
- `RealtimeScoutPage` abre o realtime em nova aba.

O resultado operacional e:

- muitas telas antes da primeira acao de scout;
- muitos estados intermediarios invisiveis;
- dependencia forte de memoria operacional do usuario;
- fluxo de registro centrado em `Atleta -> Evento`, mesmo quando a intencao mental do scout costuma ser `Evento -> Atleta`.

## Telas atuais da jornada

| Ordem | Tela | Componente principal | Objetivo atual |
| --- | --- | --- | --- |
| 1 | Login | `Login` | Autenticar e gravar token |
| 2 | Dashboard | `App` + navegacao lateral | Entrar no modulo `Dados do Jogo` |
| 3 | Lista de partidas | `ScoutTable` | Escolher card de partida |
| 4 | Seletor de tipo de coleta | `CollectionTypeSelector` | Decidir `realtime` ou `postmatch` |
| 5 | Preparacao realtime | `ScoutTable` | Selecionar atletas e abrir nova aba |
| 6 | Preparacao pos-jogo | `ScoutTable` | Selecionar atletas e abrir coleta em modal |
| 7 | Coleta realtime | `RealtimeScoutPage` + `MatchScoutingWindow` | Rodar partida ao vivo |
| 8 | Coleta pos-jogo | `MatchScoutingWindow` | Lancar eventos manualmente |
| 9 | Logs e edicao | tabela interna de `MatchScoutingWindow` | Revisar, editar, excluir |
| 10 | Modais auxiliares | sync, tempo manual, gol, encerramento | Resolver passos complementares |

## Modelo mental atual do fluxo

Fluxo predominante atual:

`Partida -> Modo -> Preparacao -> Atleta -> Evento -> Resultado/Detalhe -> Tempo -> Save`

Para o scout, isso gera um desvio:

- o scout pensa primeiro no lance;
- a UI pede primeiro o atleta;
- os detalhes do evento aparecem depois;
- o tempo as vezes aparece tarde;
- em lances complexos, o fluxo muda de forma no meio da acao.

## Jornada atual: realtime

### Caminho base

| Passo | Tela | Acao | Cliques | Tempo estimado | Informacoes exigidas | Possiveis erros |
| --- | --- | --- | ---: | --- | --- | --- |
| 1 | Login | Preencher email e senha | 3 | 5 a 12 s | Credenciais | erro de login, sessao antiga, token expirado |
| 2 | Dashboard | Clicar em `Dados do Jogo` | 1 | 1 a 2 s | nenhuma | clique bloqueado por modal de newsletter |
| 3 | Lista de partidas | Localizar card correto | 1 | 2 a 8 s | data, adversario, competicao | card salvo vs programado confunde entrada |
| 4 | Tipo de coleta | Escolher `Abrir Scout em Tempo Real` | 1 | 1 a 2 s | decisao de modo | escolha errada abre pos-jogo |
| 5 | Preparacao | Filtrar/selecionar atletas | 1 a 8 | 4 a 20 s | disponibilidade, suspensao, lesao | selecionar elenco incompleto, errar goleiro, ignorar pendurados |
| 6 | Preparacao | Clicar em `Iniciar Scout da Partida` | 1 | 1 s | min. de atletas | abre nova aba, troca de contexto |
| 7 | Lineup modal | Escolher 5 atletas em quadra | 5 | 4 a 8 s | quinteto inicial | ordem errada, numero errado, atleta indisponivel |
| 8 | Lineup modal | Informar posse inicial | 1 | 1 s | bola inicial | usuario esquece posse |
| 9 | Lineup modal | Confirmar inicio | 1 | 1 s | lineup completo | falha se 5 atletas nao estiverem validos |
| 10 | Coleta | Iniciar partida | 1 | 1 s | nenhuma | usuario tenta registrar evento antes de iniciar |
| 11 | Coleta | Selecionar atleta | 1 | 0.5 a 2 s | atleta correto | atleta nao esta ativo, grid apertado |
| 12 | Coleta | Selecionar evento | 1 | 0.5 a 1.5 s | tipo do lance | clique em evento errado, evento bloqueado por estado |
| 13 | Coleta | Resolver detalhe | 0 a 4 | 0 a 5 s | resultado, metodo, assistencia, recebedor, etc. | fluxo muda conforme evento; popup pode confundir |
| 14 | Coleta | Retomar/pause clock quando preciso | 0 a 1 | 0 a 2 s | entender estado do relogio | esquecer relogio pausado por evento |
| 15 | Coleta | Abrir logs para revisar | 1 | 1 s | nenhuma | tabela rouba espaco operacional |
| 16 | Coleta | Salvar como incompleta ou finalizar | 1 a 2 | 1 a 3 s | estado do periodo | usuario nao entende por que nao pode finalizar |

### Cliques minimos para o primeiro evento realtime

Sem contar login e busca visual:

- 1 clique no card
- 1 clique no tipo de coleta
- 1 clique em `Selecionar todos` ou varios cliques nos atletas
- 1 clique para iniciar
- 5 cliques para o quinteto
- 1 clique para posse
- 1 clique para confirmar lineup
- 1 clique para iniciar partida
- 1 clique no atleta
- 1 clique no evento

Total minimo realista: `14 a 18 cliques` antes do primeiro evento simples.

## Jornada atual: pos-jogo

### Caminho base

| Passo | Tela | Acao | Cliques | Tempo estimado | Informacoes exigidas | Possiveis erros |
| --- | --- | --- | ---: | --- | --- | --- |
| 1 | Login | Preencher email e senha | 3 | 5 a 12 s | credenciais | mesmo risco do realtime |
| 2 | Dashboard | Clicar em `Dados do Jogo` | 1 | 1 a 2 s | nenhuma | modal de newsletter |
| 3 | Lista de partidas | Localizar card | 1 | 2 a 8 s | data, adversario, competicao | card salvo/incompleto muda o caminho |
| 4 | Tipo de coleta | Escolher `Adicionar dados da Partida` | 1 | 1 a 2 s | decisao de modo | escolha errada manda ao realtime |
| 5 | Preparacao pos-jogo | Selecionar atletas | 1 a 8 | 4 a 20 s | elenco base da analise | usuario pode incluir atletas desnecessarios |
| 6 | Preparacao pos-jogo | `Continuar para coleta de dados` | 1 | 1 s | min. de atletas | sem clareza do que muda a seguir |
| 7 | Coleta pos-jogo | Selecionar atleta | 1 | 0.5 a 2 s | atleta correto | pensamento natural costuma ser evento primeiro |
| 8 | Coleta pos-jogo | Selecionar evento | 1 | 0.5 a 1.5 s | tipo do lance | usuario perde tempo procurando botao |
| 9 | Coleta pos-jogo | Resolver detalhe | 0 a 4 | 0 a 6 s | resultado, autor, assistencia, metodo | variacao por evento, falta previsibilidade |
| 10 | Coleta pos-jogo | Informar tempo manual | 1 a 3 | 1 a 5 s | minuto e segundo | tempo aparece tarde no fluxo |
| 11 | Coleta pos-jogo | Trocar periodo quando necessario | 1 | 1 s | 1T vs 2T | usuario pode esquecer de encerrar o 1T |
| 12 | Coleta pos-jogo | Abrir logs | 1 | 1 s | nenhuma | perde area principal da tela |
| 13 | Coleta pos-jogo | Editar/excluir eventos | 1 a 5 | 2 a 10 s | tempo, tipo, assistencia | edicao e poderosa, mas lenta |
| 14 | Coleta pos-jogo | Salvar | 1 | 1 a 3 s | consistencia do log | usuario so descobre conflitos no fim |

### Cliques minimos para o primeiro evento pos-jogo

Sem contar login e busca visual:

- 1 clique no card
- 1 clique no tipo de coleta
- 1 clique em `Selecionar todos` ou varios cliques nos atletas
- 1 clique em `Continuar`
- 1 clique no atleta
- 1 clique no evento
- 1 clique no detalhe
- 2 cliques no tempo manual
- 1 clique para confirmar

Total minimo realista: `9 a 14 cliques` antes do primeiro evento simples.

## Fluxos atuais por tipo de evento

### Evento simples

Exemplo: passe certo no realtime

1. selecionar atleta
2. clicar em `PASSE`
3. clicar em `Certo`
4. opcionalmente resolver recebedor

### Evento medio

Exemplo: falta no pos-jogo

1. selecionar atleta
2. clicar em `FALTA`
3. escolher `Nosso` ou `Adversario`
4. abrir popup de tempo manual
5. escolher minuto
6. escolher segundo
7. confirmar

### Evento complexo

Exemplo: gol no pos-jogo

1. selecionar atleta ou autor
2. clicar em `GOL`
3. escolher equipe
4. escolher metodo
5. escolher assistencia opcional
6. preencher tempo manual
7. confirmar

Observacao: o fluxo do gol mistura logica de placar, autoria, assistencia e tempo dentro do mesmo ciclo, mas o operador so ve a maior parte dessas exigencias depois de ja ter clicado no evento.

## Informacoes exigidas hoje por camada

| Camada | Informacoes exigidas |
| --- | --- |
| Escolha da partida | data, adversario, competicao, tipo do card |
| Escolha do modo | realtime vs postmatch |
| Preparacao | elenco, disponibilidade, goleiros, posse inicial |
| Registro do evento | atleta, tipo do evento, detalhe, time do lance |
| Confirmacao | tempo, periodo, metodo, assistencia, receptor |
| Persistencia | integridade do `matchEvents`, `postMatchEventLog`, placar, `collectionPhase` |

## Componentes atuais envolvidos

### UI principal

- `ScoutTable`
- `CollectionTypeSelector`
- `RealtimeScoutPage`
- `MatchScoutingWindow`
- `NewsletterPopup` (interferencia externa real)

### Subfluxos internos de `MatchScoutingWindow`

- painel de atleta
- painel central de eventos
- painel de relogio
- tabela de logs e edicao
- modal de lineup
- modal de sync do relogio
- modal de encerramento
- dialogos de gol
- dialogo de tempo manual no pos-jogo

### Hooks, services e utilitarios

- `useMatchClock`
- `ClockService`
- `matchUpsert`
- `matchesApi`

## Endpoints e persistencia usados no fluxo

| Momento | Endpoint/artefato |
| --- | --- |
| Login | autenticacao com token gravado em `localStorage` |
| Carregar lista | `matchesApi` / recursos de partidas |
| Reabrir partida | `matchesApi.getById()` |
| Salvar partida | `matchesApi.create()` ou `matchesApi.update()` via `upsertMatchRecord()` |
| Realtime em nova aba | `localStorage.realtimeScoutData` |
| Estado do clock | `ClockService` + `useMatchClock` |

## Onde o operador perde mais tempo hoje

1. antes do primeiro evento, por excesso de preparacao e contexto espalhado;
2. no switch mental entre `atleta primeiro` e `evento primeiro`;
3. nos eventos com mais de uma etapa, porque o sistema revela as exigencias em parcelas;
4. na revisao por logs, porque a grade toma a tela inteira e interrompe o ritmo do scout;
5. no pos-jogo, ao precisar voltar o olhar para o controle de periodo e depois para o popup de tempo manual.

## Conclusao da jornada atual

O sistema atual esta funcional, mas foi modelado para ser preciso antes de ser rapido.

Ele privilegia:

- consistencia interna;
- reutilizacao do mesmo componente para modos diferentes;
- protecoes de clock e persistencia;

Mas paga um custo alto em operacao:

- entrada longa;
- excesso de cliques antes do primeiro registro;
- baixa previsibilidade do proximo passo;
- pouco aproveitamento da area livre para contexto tatico.

# JOURNEY_CURRENT

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: auditoria operacional da jornada atual como sistema.

## Pergunta central

Qual e a menor quantidade de informacao que o scout precisa fornecer ao vivo para que o sistema consiga reconstruir corretamente o jogo e produzir analises uteis?

Toda a leitura abaixo usa essa pergunta como filtro.

## Resumo executivo

O sistema atual ja cobre:

- entrada na partida;
- preparacao;
- coleta realtime;
- coleta pos-jogo;
- save;
- reopen;
- reconciliacao de estado com `ClockService`.

Mas a jornada ainda foi modelada como:

`Partida -> Modo -> Preparacao -> Atleta -> Evento -> Detalhe -> Tempo -> Confirmacao -> Save`

O scout, porem, tende a pensar assim:

`Lance observado -> Relevancia -> Evento -> Participantes -> Confirmacao`

Essa diferenca explica a maior parte da friccao atual.

## Mapa macro do sistema atual

| Etapa | Componente principal | Decisao exigida | Mudanca de contexto |
| --- | --- | --- | --- |
| Entrada na partida | `ScoutTable` | qual card abrir | alta |
| Tipo de coleta | `CollectionTypeSelector` | realtime vs pos-jogo | media |
| Preparacao | `ScoutTable` | atletas elegiveis | alta |
| Inicio | `RealtimeScoutPage` ou `MatchScoutingWindow` | lineup / posse / start | alta |
| Evento | `MatchScoutingWindow` | atleta primeiro, evento depois | alta |
| Confirmacao | fluxos internos | detalhe, tempo, assistencia, resultado | alta |
| Atualizacao do estado | `MatchScoutingWindow` + `useMatchClock` | quase invisivel ao usuario | baixa |
| Feedback | placar, logs, ultimos eventos, alertas | entender se o sistema aceitou o evento | media |
| Save / Reopen | `onSave`, `matchUpsert`, `matchesApi` | concluir ou continuar depois | media |
| Pos-jogo | `MatchScoutingWindow` | revisar, editar, enriquecer | media |

## Jornada detalhada: realtime

### Sequencia operacional atual

| Etapa | Acao | Cliques | Tempo estimado | Informacao solicitada | Necessidade real ao vivo | Possibilidade de inferencia | Possibilidade de enriquecimento posterior | Risco de erro |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 | abrir `Dados do Jogo` | 1 | 1 a 2 s | nenhuma | obrigatoria | nao | nao | baixa |
| 2 | localizar a partida | 1 | 2 a 8 s | data, adversario, competicao | obrigatoria | nao | nao | media |
| 3 | escolher `Abrir Scout em Tempo Real` | 1 | 1 a 2 s | modo | obrigatoria | nao | nao | media |
| 4 | selecionar elenco | 1 a 8 | 4 a 20 s | atletas disponiveis | parcial | parcialmente por lineup padrao, no futuro | sim | alta |
| 5 | abrir nova aba | 1 | 1 s | nenhuma | tecnica, nao operacional | sim | nao | media |
| 6 | definir 5 em quadra | 5 | 4 a 8 s | quinteto inicial | obrigatoria | parcialmente, no futuro | sim | alta |
| 7 | definir posse inicial | 1 | 1 s | bola inicial | util, mas nao sempre critica | talvez, com origem de kick-off | nao | media |
| 8 | iniciar partida | 1 | 1 s | nenhuma | obrigatoria | nao | nao | baixa |
| 9 | selecionar atleta | 1 | 0.5 a 2 s | participante principal | depende do evento | as vezes | nao | alta |
| 10 | selecionar evento | 1 | 0.5 a 1.5 s | tipo do lance | obrigatoria | nao | nao | media |
| 11 | resolver detalhe | 0 a 4 | 0 a 5 s | resultado, metodo, assistencia, etc. | varia por evento | sim em parte | sim | alta |
| 12 | retomar relogio se pausou | 0 a 1 | 0 a 2 s | estado do clock | obrigatoria so em alguns eventos | nao | nao | alta |
| 13 | revisar log | 1 | 1 s | nenhuma | raramente obrigatoria | nao | sim | media |
| 14 | salvar como incompleta / finalizar | 1 a 2 | 1 a 3 s | estado de periodo | obrigatoria | nao | nao | media |

### Baseline operacional realtime

- Cliques minimos realistas ate o primeiro evento simples: `14 a 18`
- Tempo provavel ate o primeiro evento simples: `18 a 45 s`
- Cliques para um gol realtime completo: `4 a 8` apos a partida ja estar em curso
- Tempo provavel para um gol realtime completo: `3 a 7 s`

## Jornada detalhada: pos-jogo

### Sequencia operacional atual

| Etapa | Acao | Cliques | Tempo estimado | Informacao solicitada | Necessidade real ao vivo | Possibilidade de inferencia | Possibilidade de enriquecimento posterior | Risco de erro |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 | abrir `Dados do Jogo` | 1 | 1 a 2 s | nenhuma | obrigatoria | nao | nao | baixa |
| 2 | localizar a partida | 1 | 2 a 8 s | data, adversario, competicao | obrigatoria | nao | nao | media |
| 3 | escolher `Adicionar dados da Partida` | 1 | 1 a 2 s | modo | obrigatoria | nao | nao | media |
| 4 | selecionar atletas | 1 a 8 | 4 a 20 s | elenco a considerar | parcial | talvez por lineup salvo | sim | media |
| 5 | continuar para coleta | 1 | 1 s | nenhuma | obrigatoria | nao | nao | baixa |
| 6 | selecionar atleta | 1 | 0.5 a 2 s | participante principal | depende do evento | as vezes | nao | alta |
| 7 | selecionar evento | 1 | 0.5 a 1.5 s | tipo do lance | obrigatoria | nao | nao | media |
| 8 | resolver detalhe | 0 a 4 | 0 a 6 s | resultado, autor, assistencia, metodo | varia | sim em parte | sim | alta |
| 9 | informar tempo manual | 1 a 3 | 1 a 5 s | minuto e segundo | obrigatoria no modelo atual | nao | nao | alta |
| 10 | trocar periodo | 1 | 1 s | 1T vs 2T | obrigatoria por bloco | parcialmente | nao | media |
| 11 | revisar e editar logs | 1 a 5 | 2 a 10 s | tempo, tipo, assistencia | alta relevancia pos-jogo | nao | sim | media |
| 12 | salvar | 1 | 1 a 3 s | consistencia do log | obrigatoria | nao | nao | media |

### Baseline operacional pos-jogo

- Cliques minimos realistas ate o primeiro evento simples: `9 a 14`
- Tempo provavel ate o primeiro evento simples: `12 a 30 s`
- Cliques para um gol pos-jogo completo: `5 a 9`
- Tempo provavel para um gol pos-jogo completo: `4 a 9 s`

## Auditoria por fase do sistema

### 1. Entrada na partida

Decisao exigida:

- identificar card correto;
- entender se o card esta programado, salvo ou incompleto.

Problema:

- o tipo do card muda o caminho visual;
- isso e uma decisao de sistema, nao do scout.

### 2. Preparacao

Decisao exigida:

- quem participa do scout;
- quem esta em quadra;
- qual lado inicia com a bola.

Problema:

- alto numero de cliques antes de qualquer dado novo;
- mesma intencao aparece em mais de uma tela;
- o operador ainda nao entrou no ritmo do jogo.

### 3. Inicio

Decisao exigida:

- iniciar o clock;
- reconhecer se a partida esta em `PRE_JOGO`, `PAUSADO`, `INTERVALO` ou `ENCERRADO`.

Problema:

- o estado do relogio influencia o que pode ser feito;
- mas o sistema mistura operacao do scout com semantica interna do motor.

### 4. Registro do evento

Decisao exigida:

- escolher atleta antes do evento na maioria dos casos;
- entender o detalhe exigido so depois do clique.

Problema:

- alto custo de contexto;
- excesso de tela olhando para a interface.

### 5. Confirmacao

Decisao exigida:

- confirmar tempo, detalhe, participantes secundarios e metodo.

Problema:

- os requisitos aparecem em cascata;
- eventos parecidos nao seguem a mesma escada visual.

### 6. Atualizacao do estado

Estado alterado hoje por evento:

- cronometro
- periodo
- placar
- faltas
- posse
- historico de eventos

Problema:

- o sistema atual cuida bem do motor;
- mas nao traduz esse motor em fluxo operacional simples.

### 7. Save, reopen e pos-jogo

Ponto forte:

- o dominio atual ja suporta save, reopen e reconciliacao consistente.

Problema:

- essa forca arquitetural ainda nao virou uma jornada mais leve.

## O que realmente precisa ser coletado ao vivo

Leitura preliminar da jornada atual:

- nem todo clique atual justifica sua existencia;
- muitos dados hoje pedidos ao vivo poderiam ser:
  - enriquecidos depois;
  - inferidos no futuro;
  - removidos do realtime sem perda critica.

Hipotese forte para a Sprint 004B:

- realtime deve registrar apenas o que altera estado e contexto tatico imediato;
- pos-jogo deve absorver profundidade;
- futuro automatico deve absorver inferencia e sugestao.

## Principais pontos de friccao observados

1. `Atleta -> Evento` contraria a ordem mental do operador.
2. O primeiro evento exige preparacao longa.
3. O sistema pede profundidade ao vivo demais para alguns lances.
4. Tempo manual aparece tarde no pos-jogo.
5. O log ocupa espaco demais para a funcao que cumpre durante a partida.
6. O caminho do card ainda vaza regras internas do sistema para o operador.

## Conclusao

Hoje a plataforma esta pronta para uma coleta hibrida, mas a jornada ainda nao esta.

O motor esta mais maduro do que a experiencia.

Isso abre uma oportunidade clara:

- manter o mesmo dominio;
- manter o mesmo `ClockService`;
- manter o mesmo save;
- mas separar com clareza:
  - o que e essencial ao vivo;
  - o que e enriquecimento pos-jogo;
  - o que deve virar inferencia futura.

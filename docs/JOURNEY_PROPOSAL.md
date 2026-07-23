# JOURNEY_PROPOSAL

Projeto: `SCOUT 21 PRO`
Sprint: `004A`
Data: `2026-07-23`
Escopo: proposta de redesenho, sem implementacao.

## Resumo executivo

A proposta central desta Sprint e simples:

`Evento -> Atleta -> Detalhes -> Confirmar`

Em vez do fluxo atual:

`Atleta -> Evento -> Detalhes -> Tempo`

Objetivo:

- reduzir cliques;
- reduzir troca de contexto;
- reduzir erro de selecao;
- aumentar velocidade em lances repetitivos;
- deixar a tela principal mais profissional e orientada a operacao.

## Principios de redesenho

1. A UI deve seguir a ordem mental do scout, nao a ordem tecnica do estado interno.
2. O proximo passo precisa ser sempre previsivel.
3. O tempo do evento deve aparecer cedo, nao tarde.
4. O atleta so deve ser pedido quando realmente for necessario.
5. O log deve ajudar sem roubar a tela.
6. O modo realtime e o pos-jogo podem compartilhar motor, mas nao precisam compartilhar a mesma jornada visual.

## Proposta de fluxo: Evento -> Atleta

### Fluxo base

1. scout escolhe o tipo de lance
2. sistema destaca apenas os atletas elegiveis
3. scout toca no atleta
4. sistema abre detalhes minimos do evento
5. sistema confirma automaticamente quando o evento for simples
6. sistema pede tempo cedo no pos-jogo e usa timestamp oficial no realtime

### Exemplos

#### Passe certo

1. clicar `Passe`
2. clicar `Atleta`
3. confirmar `Certo`
4. opcional: recebedor so se a equipe realmente usar essa coleta

#### Falta

1. clicar `Falta`
2. escolher `Nosso` ou `Adversario`
3. clicar atleta apenas se a falta for nossa
4. informar tempo cedo no pos-jogo
5. confirmar

#### Gol

1. clicar `Gol`
2. escolher equipe
3. clicar autor
4. escolher assistencia opcional
5. escolher metodo
6. confirmar tempo
7. ver placar atualizado no mesmo lugar

## Comparacao: fluxo atual vs fluxo proposto

| Criterio | Atual | Proposto |
| --- | --- | --- |
| Primeira decisao do usuario | atleta | evento |
| Visibilidade do proximo passo | variavel | previsivel |
| Tempo aparece | tarde | cedo |
| Simples vs complexo | mistura na mesma grade | escada progressiva |
| Repeticao de lances | lenta | mais rapida |
| Reentrada cognitiva apos cada evento | alta | media/baixa |
| Escalabilidade para atalhos | baixa | alta |

## Vantagens do fluxo Evento -> Atleta

### Operacionais

- diminui erro de clicar atleta certo e evento errado;
- melhora a memoria muscular do scout;
- acelera lances repetitivos como passe, falta, chute e lateral;
- reduz a sensacao de popup arbitrario.

### Arquiteturais

- mantem `MatchScoutingWindow` como engine de estado;
- permite adaptar a camada visual sem reescrever `ClockService`;
- conserva `matchEvents`, `postMatchEventLog` e `upsertMatchRecord`;
- facilita manter Playwright por meio de novos `data-testid` estaveis.

## Uso da area livre

Hoje a tela gasta area com:

- espacos vazios laterais;
- logs muito largos quando abertos;
- botoes em grade sem hierarquia de prioridade;
- pouco contexto tatico.

A proposta para a area livre:

### Coluna contextual fixa

- ultimos 5 eventos
- placar
- estado do clock
- faltas por periodo
- posse atual

### Painel tatico opcional

- mini-quadra
- lado da acao
- pressao/posse
- mapa de calor simplificado por evento, se existir dado suficiente

### Faixa de produtividade

- evento em andamento
- atleta selecionado
- detalhe pendente
- alerta de relogio pausado

## Catalogo de componentes

### Pode permanecer quase intacto

- `useMatchClock`
- `ClockService`
- `matchUpsert`
- estrutura de `MatchEvent`
- persistencia `matchesApi`

### Deve permanecer, mas com nova casca visual

- `MatchScoutingWindow`
- `ScoutTable`
- `CollectionTypeSelector`
- tabela de logs

### Deve virar subcomponente explicito

- painel de selecao de evento
- painel de atleta
- painel de contexto do jogo
- painel de revisao rapida
- fluxo de gol
- fluxo de tempo manual

### Deve perder protagonismo

- `PostMatchCollectionSheet` legado
- logs full-screen como modo principal de revisao
- lineup modal com logica operacional espalhada

### Deve desaparecer no futuro

- bifurcacoes visuais que repetem a mesma preparacao em duas telas diferentes;
- logica de entrada que depende de o usuario descobrir sozinho se o card e `saved`, `scheduled` ou `incomplete`.

## Migracao sem quebrar o que ja estabilizou

### Fase 1 - shell visual

- manter `MatchScoutingWindow` e reorganizar so a ordem de apresentacao;
- preservar payload, hooks e handlers;
- adicionar uma camada `journeyMode = current | v2`.

### Fase 2 - evento primeiro

- introduzir um novo painel de eventos;
- ao selecionar evento, destacar atletas elegiveis;
- manter handlers atuais como adaptadores.

### Fase 3 - unificacao de detalhes

- concentrar detalhes em um painel lateral unico;
- reduzir modais isolados;
- manter o gol como fluxo especial, mas com layout consistente.

### Fase 4 - revisao e area livre

- trocar a tabela de logs por resumo lateral e drawer de auditoria;
- manter a tabela completa para edicao pesada, nao para uso continuo.

### Fase 5 - retirada de legado

- apos validacao QA e Playwright, desativar caminhos duplicados;
- congelar `PostMatchCollectionSheet` apenas como fallback historico.

## Impacto esperado

| Objetivo | Ganho esperado |
| --- | --- |
| Velocidade do primeiro evento | queda de 20% a 40% nos cliques |
| Velocidade de eventos repetitivos | ganho alto |
| Clareza de proximo passo | ganho alto |
| Erros de periodo/tempo | ganho medio |
| Treinamento de novos operadores | ganho alto |

## Plano recomendado para Sprint 004B

1. implementar o shell `Evento -> Atleta` apenas no realtime, mantendo feature flag;
2. preservar payload e handlers atuais;
3. cobrir com Playwright o novo caminho principal;
4. migrar gol e falta primeiro;
5. depois trazer pos-jogo para o mesmo shell visual;
6. so no fim remover as telas duplicadas de preparacao e revisao.

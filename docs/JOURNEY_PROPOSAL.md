# JOURNEY_PROPOSAL

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: modelagem do fluxo hibrido e planejamento do experimento do Shell.

## Resumo executivo

A proposta deixa de tratar realtime e pos-jogo como duas variacoes do mesmo formulario.

Eles passam a ter propositos diferentes:

- realtime registra o minimo necessario para controlar a partida e gerar contexto imediato;
- pos-jogo revisa, corrige, enriquece e relaciona;
- futuro automatico infere padroes, sugere contexto e reduz captura manual.

## Modelo hibrido proposto

### Realtime

Objetivo:

- velocidade
- baixo numero de cliques
- foco no estado do jogo
- feedback imediato

Regra:

- perguntar apenas o necessario para gravar um evento confiavel.

### Pos-jogo

Objetivo:

- profundidade
- correcao
- enriquecimento
- auditoria

Regra:

- abrir o evento salvo e permitir completar os campos que nao valia a pena pedir ao vivo.

### Futuro automatico

Objetivo:

- reduzir trabalho manual
- sugerir ligacoes
- detectar padroes
- aumentar confiabilidade do contexto

Regra:

- o sistema deve inferir o que for repetitivo, caro ou pouco valioso de capturar manualmente ao vivo.

## Fluxo hibrido

### Coleta ao vivo

`Evento essencial -> minimo de perguntas -> confirmacao -> atualizacao do estado -> memoria da partida`

### Pos-jogo

`Revisar evento -> enriquecer -> corrigir -> relacionar -> validar`

### Futuro

`Inferir -> detectar padroes -> gerar insights -> recomendar atencao`

## Proposta operacional do Shell

### Ordem base

`Evento -> Participantes -> Detalhe curto -> Confirmar`

### Diferencas por modo

#### Realtime

- tempo e periodo automaticos
- menos passos
- menos texto
- menos campos

#### Pos-jogo

- tempo e periodo editaveis
- mais detalhes
- mais relacao entre eventos
- revisao e correcao fortes

## Microfluxo do Gol

Gol e o unico evento explicitamente composto e prioritario no Shell.

### Fluxo base

`Gol -> equipe -> autor -> origem -> assistencia quando aplicavel -> confirmacao`

### O que deve aparecer ao vivo

- equipe: nossa, adversario, contra
- autor: obrigatorio para gol nosso
- origem curta:
  - jogada individual
  - erro do adversario
  - rebote
  - bola parada
  - sem assistencia
  - desconhecida
- assistencia:
  - so quando fizer sentido
  - nunca como obrigatoria em todo gol

### O que pode ser enriquecido depois

- classificacao tatico-detalhada da origem
- contexto da jogada
- zona inicial
- relacao com sequencia ofensiva

### Gol adversario

Ao vivo:

- nao exigir autor quando isso atrasar a operacao
- registrar imediatamente placar, tempo e periodo
- permitir origem curta opcional

Pos-jogo:

- se houver video ou memoria confiavel, completar autor ou origem

### Wireframe conceitual do Gol

```text
[GOL]
  -> [NOSSO] [ADVERSARIO] [CONTRA]
  -> se NOSSO:
       [ATLETA]
       [JOGADA INDIVIDUAL] [ERRO ADV] [REBOTE] [BOLA PARADA] [SEM ASSIST] [DESCONHECIDA]
       se origem comportar assistencia:
         [ASSISTENCIA OPCIONAL]
  -> [CONFIRMAR]
```

Meta operacional:

- realtime: registrar gol em `<= 5 s`
- pos-jogo: registrar gol completo em `<= 8 s`

## Painel contextual recomendado

### Informacoes permanentes - maximo 4

1. tempo
2. periodo
3. placar
4. faltas acumuladas

### Informacoes contextuais - maximo 3

1. posse atual
2. ultimos eventos
3. proximo passo esperado

### Alerta prioritario - maximo 1 por vez

Exemplos:

- relogio pausado por evento
- proxima falta acumulada critica
- evento incompleto aguardando confirmacao

## Metricas de sucesso

### Baseline observado

- cliques ate primeiro evento realtime: `14 a 18`
- tempo ate primeiro evento realtime: `18 a 45 s`
- cliques ate primeiro evento pos-jogo: `9 a 14`
- tempo ate primeiro evento pos-jogo: `12 a 30 s`
- gol realtime: `3 a 7 s`
- gol pos-jogo: `4 a 9 s`

### Metas propostas para o Shell

| Metrica | Baseline atual | Meta inicial |
| --- | --- | --- |
| Cliques ate primeiro evento realtime | 14 a 18 | reduzir em 30% |
| Tempo ate primeiro evento realtime | 18 a 45 s | ficar abaixo de 15 s |
| Registro de evento simples ao vivo | 2 a 5 s | `<= 2 s` |
| Registro de gol ao vivo | 3 a 7 s | `<= 5 s` |
| Cancelamentos por fluxo confuso | sem baseline firme | reduzir visivelmente em QA |
| Eventos duplicados | risco atual baixo, mas existente | zero em fluxo piloto |
| Popup sem saida clara | existe em alguns eventos | zero no Shell |

## Experimento do Shell

### Regra obrigatoria

O Shell e um experimento de jornada, nao um fork do dominio.

Permanece igual:

- `ClockService`
- save
- reopen
- API
- payload
- pos-jogo
- tipos de evento persistidos

### Flag recomendada

`SCOUT_SHELL_V2_ENABLED`

Uso:

- `false` por padrao
- `true` apenas para QA e pessoas autorizadas

### Publico inicial

- ambiente QA oficial
- operador interno
- validacao da comissao tecnica

### Eventos piloto

1. finalizacao
2. falta
3. defesa

Gol nao entra no piloto inicial.

### Periodo do experimento

- janela inicial sugerida: `2 semanas`
- rodada 1: QA interno
- rodada 2: validacao assistida com operacao real simulada

### Criterios para virar default

- eventos simples mais rapidos que o fluxo atual
- sem regressao em save/reopen
- sem regressao em realtime
- feedback operacional positivo
- nenhuma ambiguidade grave de proximo passo

### Criterios para morrer

- nao reduzir cliques ou tempo de forma relevante
- introduzir erros novos de registro
- criar divergencia de payload ou dominio
- exigir suporte operacional constante

### Plano de rollback

- flag volta para `false`
- fluxo antigo continua default durante todo o experimento
- nenhum dado precisa de migracao

### Data de morte

Data de morte operacional proposta: `2026-09-01`.

Assuncao usada nesta documentacao:

- o experimento nasce na esteira da Sprint `004C`;
- a decisao final precisa acontecer, no maximo, ate o encerramento planejado da Sprint `004G`.

Se o Shell nao cumprir os criterios de aprovacao ate `2026-09-01`, ele deve ser descontinuado ou replanejado explicitamente.

## Recomendacao para a Sprint 004C

Objetivo de 004C:

- preparar infraestrutura do Shell experimental sem alterar o motor.

Escopo recomendado:

1. criar flag `SCOUT_SHELL_V2_ENABLED`
2. isolar shell visual da coleta
3. introduzir painel contextual
4. garantir compatibilidade com Playwright e QA
5. nao tocar ainda em gol composto

## Conclusao

A coleta hibrida proposta resolve o conflito central da plataforma:

- o sistema atual sabe persistir bem;
- agora ele precisa perguntar menos ao vivo.

Decisao estrutural da Sprint:

- realtime serve ao controle da partida;
- pos-jogo serve ao enriquecimento;
- futuro serve a inferencia;
- o Shell so muda jornada, nunca o motor.

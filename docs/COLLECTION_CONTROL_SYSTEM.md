# COLLECTION_CONTROL_SYSTEM

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: modelagem da coleta como sistema de controle.

## Visao geral

A coleta precisa ser entendida como um sistema de controle em tempo real com enriquecimento posterior.

O operador nao alimenta um formulario.

O operador alimenta um controlador de estado da partida.

## Diagrama textual

```text
ENTRADAS
  evento observado
  equipe
  atleta
  participante secundario
  detalhe
  tempo
  periodo
  posse

CONTROLADOR
  validacao do evento
  regras do evento
  regras de pause/continue
  regras de placar
  regras de faltas
  regras de assistencia
  politica realtime / pos-jogo

ESTADO
  cronometro
  periodo
  placar
  faltas
  posse
  atletas em quadra
  log de eventos
  alertas

SAIDAS
  evento persistido
  feedback visual
  placar atualizado
  estatisticas
  contexto rapido
  alerta prioritario
  dado para analise

REALIMENTACAO
  estado atual muda as opcoes disponiveis
  eventos recentes influenciam alertas
  faltas influenciam risco
  posse influencia contexto
  encerramento muda as acoes possiveis
```

## Entradas

### Entrada observacional

- evento observado
- equipe envolvida
- posse percebida

### Entrada humana estruturada

- atleta principal
- participante secundario
- detalhe do evento
- tempo e periodo quando manual

### Regra da coleta hibrida

No realtime:

- tempo e periodo devem vir do motor
- entradas humanas precisam ser minimas

No pos-jogo:

- tempo e periodo podem ser informados manualmente
- detalhes e relacoes podem ser enriquecidos

## Controlador

### Responsabilidades

1. validar se o evento pode existir nesse estado
2. decidir se o evento altera placar
3. decidir se o evento altera faltas
4. decidir se o evento pausa ou nao o cronometro
5. decidir se o evento exige participante adicional
6. decidir o que e obrigatorio no realtime
7. decidir o que e apenas enriquecimento pos-jogo

### Politica realtime

- velocidade acima de profundidade
- dados nao essenciais sao adiados
- eventos de Classe D nao entram no painel principal

### Politica pos-jogo

- profundidade acima de velocidade
- revisao acima de captura
- correcoes e relacoes sao aceitas

## Estado

### Estado central

- `cronometro`
- `periodo`
- `placar`
- `faltas`
- `posse`
- `atletas em quadra`
- `eventos recentes`
- `evento em andamento`

### Estado de persistencia

- `matchEvents`
- `postMatchEventLog`
- `collectionPhase`
- resultado salvo

### Estado de orientacao

- proximo passo esperado
- alerta prioritario
- acao bloqueada

## Saidas

### Saidas imediatas

- evento aceito
- placar atualizado
- faltas atualizadas
- clock pausado ou mantido
- feedback visual curto

### Saidas de memoria da partida

- historico de eventos
- contexto recente
- dado para pos-jogo

### Saidas para analise futura

- materia-prima para inferencia
- sequencias
- tendencias
- sugestoes

## Realimentacao

### O estado muda a interface

Exemplos:

- se o clock esta pausado por evento, o proximo passo muda
- se as faltas estao altas, o alerta muda
- se o periodo mudou, as opcoes manuais mudam
- se o gol acabou de sair, o placar e o log mudam imediatamente

### O historico muda a leitura

- ultimos eventos influenciam pressao percebida
- faltas recentes influenciam risco
- posse recente influencia contexto operacional

## Politica de dados por camada

### Realtime

Perguntar:

- o necessario para controlar a partida
- o necessario para reconstruir eventos criticos

Nao perguntar:

- detalhe de baixo valor imediato
- repeticao de microeventos

### Pos-jogo

Permitir:

- correcao
- enriquecimento
- relacao entre eventos
- ajuste de contexto

### Futuro

Automatizar:

- inferencias de sequencia
- sugestoes de origem
- contextos recorrentes
- padroes taticos

## Conclusao

O Shell experimental nao deve mudar esse sistema de controle.

Ele deve mudar apenas:

- a ordem da conversa com o operador;
- a quantidade de perguntas;
- a visibilidade do contexto;
- a velocidade da confirmacao.

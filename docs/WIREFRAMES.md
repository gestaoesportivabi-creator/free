# WIREFRAMES

Projeto: `SCOUT 21 PRO`
Sprint: `004A`
Data: `2026-07-23`
Escopo: wireframes conceituais, sem implementacao.

## Premissas

- modo escuro continua como base visual;
- prioridade para velocidade operacional;
- painel central deve respirar mais;
- logs nao devem cobrir a tela inteira no uso normal.

## Desktop

### Realtime - shell proposto

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Partida | Placar | Periodo | Clock | Estado | Save | Finalizar | Ultimos alertas        |
+---------------------------+--------------------------------------+-----------------------------+
| EVENTOS                    | AREA OPERACIONAL                    | CONTEXTO RAPIDO            |
|                            |                                      |                           |
| [Gol] [Passe] [Chute]      | Atleta selecionavel por contexto     | Ultimos eventos           |
| [Falta] [Cartao] [Esc]     |                                      | 22:05 Gol QA 02          |
| [TL] [Penalti] [Lateral]   |  [1] [2] [3] [4] [5] [6]            | 21:10 Gol QA 04          |
| [Defesa] [Desarme] [Blk]   |                                      | Falta 22:10 Adv          |
|                            |  Painel inferior de detalhes         |                           |
| Filtro: simples / avancado |  evento: Gol                         | Posse / faltas / resumo   |
|                            |  autor: QA 02                        |                           |
|                            |  assist: QA 03                       |                           |
|                            |  tempo: 20:45                        |                           |
|                            |  [Confirmar] [Cancelar]              |                           |
+---------------------------+--------------------------------------+-----------------------------+
```

### Pos-jogo - shell proposto

```text
+--------------------------------------------------------------------------------------------------+
| HEADER: Partida | Placar | Bloco ativo 1T/2T | Save | Reabrir | Atalhos de tempo            |
+---------------------------+--------------------------------------+-----------------------------+
| EVENTOS                    | ELENCO / QUADRA / DETALHES          | REVISAO                    |
|                            |                                      |                           |
| [Gol] [Passe] [Chute]      | Grade de atletas contextual         | Ultimos 10 eventos        |
| [Falta] [Cartao] [Esc]     |                                      | Editar rapido             |
| [TL] [Penalti] [Lateral]   | Tempo fica visivel antes da         | Validacao de placar       |
| [Defesa] [Desarme] [Blk]   | confirmacao final                   | Alertas de consistencia   |
|                            |                                      |                           |
| Atalhos 00:00 / 05:00      | [evento] [atleta] [detalhes]        |                           |
| 10:00 / 15:00 / 20:00      | [tempo] [confirmar]                 |                           |
+---------------------------+--------------------------------------+-----------------------------+
```

## Notebook

```text
+--------------------------------------------------------------------------------------+
| Partida | Placar | Clock/Periodo | Save | Finalizar                                 |
+----------------------+-------------------------------------------+-------------------+
| EVENTOS              | ZONA PRINCIPAL                            | LOG LATERAL       |
|                      |                                           |                   |
| Gol                  | Atletas contextuais                       | 3 ultimos         |
| Passe                |                                           |                   |
| Chute                | Detalhes compactos                        |                   |
| Falta                |                                           |                   |
| Cartao               | Confirmacao                              |                   |
| ...                  |                                           |                   |
+----------------------+-------------------------------------------+-------------------+
```

Observacao:

- em notebook, o log lateral precisa ser colapsavel;
- sem isso, os botoes principais ficam espremidos.

## Tablet horizontal

```text
+----------------------------------------------------------------------------+
| Partida | Placar | Periodo | Save                                          |
+----------------------+------------------------------+----------------------+
| EVENTOS              | ATLETAS                      | DETALHES             |
| Gol                  | [1] [2] [3]                 | evento               |
| Passe                | [4] [5] [6]                 | tempo                |
| Chute                |                              | subtipo              |
| Falta                |                              | confirmar            |
| ...                  |                              |                      |
+----------------------+------------------------------+----------------------+
| Clock / ultimos eventos / alertas compactos                                 |
+----------------------------------------------------------------------------+
```

## Tablet vertical

```text
+--------------------------------------------------------------+
| Partida | Placar | Periodo | Save                            |
+--------------------------------------------------------------+
| EVENTOS em carrossel                                          |
| [Gol] [Passe] [Chute] [Falta] [Cartao] ...                    |
+--------------------------------------------------------------+
| ATLETAS                                                       |
| [1] [2] [3] [4] [5] [6]                                       |
+--------------------------------------------------------------+
| DETALHES / TEMPO / CONFIRMACAO                                |
+--------------------------------------------------------------+
| ULTIMOS EVENTOS                                                |
+--------------------------------------------------------------+
```

## Modo escuro

Direcao visual recomendada:

- fundo principal quase preto, mas nao chapado;
- destaque ciano apenas para a acao primaria;
- verde para sucesso/confirmado;
- amber para alerta operacional;
- vermelho para risco, cartao, time adversario e bloqueio;
- log secundario em cinza quente, nao branco puro.

## Uso da area livre

### O que pode entrar sem poluir

- mini-quadra simplificada
- ultimos 5 eventos
- placar por periodo
- contagem de faltas
- posse atual
- indicador de relogio pausado

### O que nao deve ocupar a area livre

- textos longos
- tabela completa o tempo inteiro
- modais grandes para eventos simples
- redundancia de status que ja aparece no header

## Regras de ouro para 004B

1. Cada tela deve responder "qual e o proximo clique?".
2. O detalhe do evento deve aparecer sem cobrir a tela toda.
3. O log completo deve virar ferramenta de auditoria, nao o centro do fluxo.
4. O atleta deve ficar mais perto do evento, nao como etapa anterior fixa.

# WIREFRAMES

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: wireframes conceituais do modelo hibrido, sem implementacao.

## Guardrails

- no maximo 4 informacoes permanentes;
- no maximo 3 informacoes contextuais;
- no maximo 1 alerta prioritario por vez;
- o proximo clique precisa ser obvio;
- o painel principal deve servir ao evento atual, nao ao historico completo.

## Informacoes permanentes

1. tempo
2. periodo
3. placar
4. faltas acumuladas

## Informacoes contextuais

1. posse atual
2. ultimos eventos
3. proximo passo

## Alerta prioritario

Apenas um por vez:

- relogio pausado por evento
- ultima falta antes do limite
- evento aguardando confirmacao

## Desktop - realtime

```text
+--------------------------------------------------------------------------------------------------+
| [Tempo] [Periodo] [Placar] [Faltas]                          [Salvar] [Finalizar] [Alerta unico] |
+---------------------------+--------------------------------------+-----------------------------+
| EVENTOS ESSENCIAIS        | EVENTO EM ANDAMENTO                 | CONTEXTO RAPIDO            |
|                           |                                      |                           |
| [Gol] [Finalizacao]       | passo 1: evento                      | Posse atual               |
| [Falta] [Cartao]          | passo 2: atleta ou lado              | Ultimos eventos           |
| [Defesa] [Rec Posse]      | passo 3: detalhe curto               | Proximo passo             |
| [Perda Posse] [Esc]       | passo 4: confirmar                   |                           |
| [Penalti] [TL] [Subs]     |                                      |                           |
|                           | [Confirmar] [Cancelar]               |                           |
+---------------------------+--------------------------------------+-----------------------------+
```

## Desktop - pos-jogo

```text
+--------------------------------------------------------------------------------------------------+
| [Tempo manual] [Periodo] [Placar] [Faltas]                    [Salvar] [Reabrir] [Alerta unico]  |
+---------------------------+--------------------------------------+-----------------------------+
| EVENTOS / FILTROS         | ENRIQUECIMENTO DO EVENTO             | REVISAO RAPIDA            |
|                           |                                      |                           |
| [Gol] [Finalizacao]       | autor                                 | ultimos 8 eventos        |
| [Falta] [Cartao]          | participante secundario               | inconsistencias          |
| [Defesa] [Esc]            | origem / metodo / observacao          | editar rapido            |
| [Penalti] [TL]            | tempo / periodo                       |                           |
|                           | [Confirmar]                           |                           |
+---------------------------+--------------------------------------+-----------------------------+
```

## Notebook

```text
+--------------------------------------------------------------------------------------+
| [Tempo] [Periodo] [Placar] [Faltas]                           [Salvar] [Alerta]      |
+----------------------+-------------------------------------------+-------------------+
| EVENTOS              | OPERACAO                                 | CONTEXTO          |
|                      |                                           |                   |
| [Gol]                | atleta / lado / detalhe                  | ultimos 3         |
| [Finalizacao]        |                                           | posse             |
| [Falta]              | confirmar                                 | proximo passo     |
| [Defesa]             |                                           |                   |
| [Cartao]             |                                           |                   |
+----------------------+-------------------------------------------+-------------------+
```

## Tablet horizontal

```text
+----------------------------------------------------------------------------+
| [Tempo] [Periodo] [Placar] [Faltas]                    [Salvar] [Alerta]   |
+----------------------+------------------------------+----------------------+
| EVENTOS              | PARTICIPANTES               | DETALHES             |
| [Gol]                | [1] [2] [3]                | detalhe curto        |
| [Finalizacao]        | [4] [5] [6]                | confirmacao          |
| [Falta]              | lado do evento             |                      |
| [Defesa]             |                            |                      |
+----------------------+------------------------------+----------------------+
| Posse | Ultimos eventos | Proximo passo                                     |
+----------------------------------------------------------------------------+
```

## Tablet vertical

```text
+--------------------------------------------------------------+
| [Tempo] [Periodo] [Placar] [Faltas]                          |
+--------------------------------------------------------------+
| EVENTOS EM CARROSSEL                                         |
| [Gol] [Finalizacao] [Falta] [Defesa] [Cartao] ...            |
+--------------------------------------------------------------+
| PARTICIPANTES / LADO                                          |
+--------------------------------------------------------------+
| DETALHE CURTO / CONFIRMACAO                                   |
+--------------------------------------------------------------+
| CONTEXTO                                                      |
| posse | ultimos eventos | proximo passo                       |
+--------------------------------------------------------------+
```

## Goal micro-wireframe

### Realtime

```text
[GOL]
  [NOSSO] [ADVERSARIO] [CONTRA]
  -> se NOSSO:
       [ATLETA]
       [JOGADA INDIVIDUAL] [ERRO ADV] [REBOTE] [BOLA PARADA] [SEM ASSIST] [DESCONHECIDA]
       [ASSISTENCIA OPCIONAL]
  [CONFIRMAR]
```

### Pos-jogo

```text
[GOL]
  [NOSSO] [ADVERSARIO] [CONTRA]
  [AUTOR]
  [ORIGEM]
  [ASSISTENCIA OPCIONAL]
  [TEMPO]
  [PERIODO]
  [CONFIRMAR]
```

## Uso da area livre

### Deve entrar

- posse atual
- ultimos eventos
- proximo passo
- alerta unico

### Pode entrar depois

- mini-quadra
- pressao recente
- sequencia ofensiva

### Nao deve entrar

- tabela completa permanente
- texto longo de instrucao
- popup gigante para eventos simples
- mais de um alerta ao mesmo tempo

## Conclusao visual

O painel contextual do Shell precisa ser pequeno, confiavel e sempre visivel.

Ele nao pode competir com o evento atual.

Seu papel e:

- orientar;
- reduzir duvida;
- lembrar estado;
- nunca sequestrar a atencao do scout.

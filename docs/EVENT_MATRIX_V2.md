# EVENT_MATRIX_V2

Projeto: `SCOUT 21 PRO`
Sprint: `004A`
Data: `2026-07-23`
Escopo: matriz de informacoes realmente necessarias por evento.

## Leitura rapida

Legenda:

- `Obrigatorio`: sem isso o evento nao existe
- `Opcional`: melhora analise, mas nao bloqueia o registro
- `Inferido`: pode ser derivado do contexto

## Matriz

| Evento | Informacoes obrigatorias | Informacoes opcionais | Pode ser inferido | Ordem recomendada no fluxo V2 |
| --- | --- | --- | --- | --- |
| Gol a favor | autor, equipe, tempo, periodo | assistencia, metodo | placar atual | evento -> equipe -> autor -> assistencia/metodo -> tempo -> confirmar |
| Gol contra/adversario | equipe, tempo, periodo | metodo | placar atual | evento -> equipe -> tempo -> confirmar |
| Passe certo | executor | recebedor | tempo realtime, periodo realtime | evento -> atleta -> resultado -> recebedor opcional |
| Passe errado | executor | flag de transicao | tempo realtime, periodo realtime | evento -> atleta -> resultado |
| Chute no gol | executor | zona, contexto tatico | tempo realtime, periodo realtime | evento -> atleta -> resultado |
| Chute fora | executor | zona, contexto tatico | tempo realtime, periodo realtime | evento -> atleta -> resultado |
| Chute na trave | executor | zona, contexto tatico | tempo realtime, periodo realtime | evento -> atleta -> resultado |
| Chute bloqueado | executor | zona, contexto tatico | tempo realtime, periodo realtime | evento -> atleta -> resultado |
| Falta nossa | executor, time faltoso | zona | tempo realtime, periodo realtime | evento -> lado -> atleta -> tempo se pos-jogo |
| Falta do adversario | time faltoso | zona | periodo e tempo | evento -> lado -> tempo se pos-jogo |
| Cartao nosso | atleta, tipo do cartao | nenhuma | tempo realtime, periodo realtime | evento -> lado -> atleta -> tipo |
| Cartao adversario | tipo do cartao | nenhuma | tempo realtime, periodo realtime | evento -> lado -> tipo |
| Desarme com posse | executor | nenhuma | tempo realtime, periodo realtime | evento -> atleta -> subtipo |
| Desarme sem posse | executor | nenhuma | tempo realtime, periodo realtime | evento -> atleta -> subtipo |
| Desarme contra-ataque | executor | nenhuma | tempo realtime, periodo realtime | evento -> atleta -> subtipo |
| Defesa do goleiro | goleiro, subtipo | nenhuma | tempo realtime, periodo realtime | evento -> goleiro -> subtipo |
| Bloqueio | executor | nenhuma | tempo realtime, periodo realtime | evento -> atleta |
| Escanteio nosso | executor | zona | tempo realtime, periodo realtime | evento -> lado -> atleta |
| Escanteio adversario | nenhuma | zona | periodo, tempo | evento -> lado |
| Lateral nosso | executor | zona | tempo realtime, periodo realtime | evento -> lado -> atleta |
| Lateral adversario | nenhuma | zona | periodo, tempo | evento -> lado |
| Tiro livre nosso | cobrador, resultado | zona | tempo realtime, periodo realtime | evento -> lado -> resultado -> cobrador se necessario |
| Tiro livre adversario | resultado | zona | periodo, tempo | evento -> lado -> resultado |
| Penalti nosso | cobrador, resultado | nenhuma | tempo realtime, periodo realtime | evento -> lado -> resultado -> cobrador |
| Penalti adversario | resultado | nenhuma | periodo, tempo | evento -> lado -> resultado |

## Regras de simplificacao recomendadas

### 1. Atleta so quando houver autor real

Nao pedir atleta primeiro para:

- falta do adversario
- cartao adversario
- escanteio adversario
- lateral adversario
- gol adversario sem autor identificado

### 2. Tempo deve entrar cedo no pos-jogo

Para pos-jogo, o tempo precisa ficar visivel logo que o evento e escolhido.

Motivo:

- o operador costuma lembrar primeiro "foi aos 12:40";
- hoje o sistema pede o tempo tarde demais.

### 3. Periodo quase sempre pode ser herdado

Periodo nao precisa ser perguntado a cada evento se:

- existe periodo ativo visivel;
- o usuario esta trabalhando dentro de um bloco claro `1T` ou `2T`.

### 4. Recebedor de passe nao deve bloquear o registro padrao

Recebedor e dado de profundidade.

Recomendacao:

- `OFF` por padrao operacional;
- `ON` apenas em cenarios analiticos especificos.

### 5. Metodo do gol deve ser curto

Metodo do gol e importante, mas nao pode virar um labirinto.

Recomendacao:

- expor 4 a 6 opcoes no maximo;
- evitar submenu profundo;
- permitir `sem classificar agora` se a operacao exigir velocidade.

## Eventos por complexidade operacional

### Baixa complexidade

- passe
- chute
- bloqueio
- desarme

### Media complexidade

- falta
- cartao
- escanteio
- lateral
- defesa

### Alta complexidade

- gol
- tiro livre
- penalti

## Ordem recomendada de redesign em 004B

1. passe
2. chute
3. falta
4. gol
5. cartao
6. bola parada restante

Motivo:

- cobre maior volume de uso primeiro;
- reduz risco de quebrar o pipeline inteiro;
- entrega ganho operacional visivel cedo.

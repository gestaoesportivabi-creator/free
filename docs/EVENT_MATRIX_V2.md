# EVENT_MATRIX_V2

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: taxonomia operacional final dos eventos da coleta hibrida.

## Pergunta central

Qual e a menor quantidade de informacao que o scout precisa fornecer ao vivo para que o sistema consiga reconstruir corretamente o jogo e produzir analises uteis?

## Taxonomia operacional

### Classe A

Eventos que alteram o estado do jogo e devem ser registrados imediatamente.

Criterios:

- mexem em placar, faltas, disponibilidade de jogador ou reinicio relevante;
- precisam de feedback instantaneo;
- geram contexto para o resto da partida.

### Classe B

Eventos relevantes para leitura ao vivo, com registro rapido.

Criterios:

- ajudam a interpretar pressao, volume, dominancia ou risco;
- nao precisam de profundidade total;
- devem caber em uma interacao curta.

### Classe C

Eventos ou detalhes de enriquecimento.

Criterios:

- melhoram a analise;
- nao precisam interromper a atencao do operador ao vivo;
- podem ser completados no pos-jogo.

### Classe D

Eventos que nao devem ser coletados manualmente ao vivo sem justificativa forte.

Criterios:

- alta frequencia;
- baixo valor imediato;
- alto custo operacional;
- maior chance de desviar o scout do jogo.

## Decisao sobre Passe

Decisao final:

- `Passe` generico sai do realtime principal.
- `Passe` permanece no pos-jogo como enriquecimento opcional, se a equipe realmente precisar desse nivel de detalhe.
- Ao vivo, o sistema deve preferir eventos derivados de maior valor:
  - assistencia;
  - passe-chave;
  - perda de posse;
  - sequencia que gera finalizacao.

Justificativa:

- frequencia muito alta;
- custo operacional excessivo;
- baixo valor imediato para um unico scout;
- compete com lances mais importantes;
- varios efeitos analiticos do passe podem ser recuperados por outros eventos ou inferencia futura.

## Matriz principal

| Evento | Classe | Realtime | Pos-jogo | Futuro automatico | Prioridade | Exige atleta | Exige participante secundario | Exige detalhe | Altera placar | Altera faltas | Altera posse | Pausa clock | Gera alerta | Confirmacao em um toque | Pode enriquecer depois |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gol nosso | A | Sim | Sim | Parcial | Muito alta | Sim | Assistente opcional | Origem/metodo | Sim | Nao | Nao | Sim | Sim | Nao | Sim |
| Gol adversario | A | Sim | Sim | Parcial | Muito alta | Nao obrigatorio | Nao | Origem opcional | Sim | Nao | Nao | Sim | Sim | Quase | Sim |
| Cartao nosso | A | Sim | Sim | Nao | Alta | Sim | Nao | Tipo do cartao | Nao | Nao | Nao | Nao | Sim | Nao | Pouco |
| Cartao adversario | A | Sim | Sim | Nao | Alta | Nao obrigatorio | Nao | Tipo do cartao | Nao | Nao | Nao | Nao | Sim | Quase | Pouco |
| Expulsao | A | Sim | Sim | Nao | Alta | Sim ou adversario | Nao | Origem do cartao/causa | Nao | Nao | Nao | Nao | Sim | Nao | Pouco |
| Penalti | A | Sim | Sim | Nao | Alta | So se a favor | Nao | Resultado | Pode | Nao | Nao | Sim | Sim | Nao | Sim |
| Tiro livre | A | Sim | Sim | Nao | Alta | So se a favor | Nao | Resultado | Pode | Nao | Nao | Sim | Sim | Nao | Sim |
| Falta acumulada nossa | A | Sim | Sim | Sim | Alta | Sim | Nao | Lado opcional | Nao | Sim | Nao | Sim | Sim | Quase | Sim |
| Falta acumulada adversaria | A | Sim | Sim | Sim | Alta | Nao obrigatorio | Nao | Lado opcional | Nao | Sim | Nao | Sim | Sim | Quase | Sim |
| Substituicao | A | Sim | Opcional | Sim no futuro | Alta | Sim | Sim | entrada/saida | Nao | Nao | Nao | Nao | Baixo | Nao | Pouco |
| Tempo tecnico | A | Sim | Opcional | Nao | Media | Nao | Nao | equipe | Nao | Nao | Nao | Sim | Media | Sim | Nao |
| Finalizacao no gol | B | Sim | Sim | Sim | Alta | Sim | Nao | resultado | Nao | Nao | Nao | Nao | Media | Sim | Sim |
| Finalizacao fora | B | Sim | Sim | Sim | Alta | Sim | Nao | resultado | Nao | Nao | Nao | Nao | Baixo | Sim | Sim |
| Finalizacao na trave | B | Sim | Sim | Sim | Alta | Sim | Nao | resultado | Nao | Nao | Nao | Nao | Media | Sim | Sim |
| Defesa | B | Sim | Sim | Sim | Alta | Sim | Nao | tipo de defesa | Nao | Nao | Nao | Nao | Media | Quase | Sim |
| Perda de posse | B | Sim | Sim | Sim | Alta | Sim | Nao | causa opcional | Nao | Nao | Sim | Nao | Media | Sim | Sim |
| Recuperacao de posse | B | Sim | Sim | Sim | Alta | Sim | Nao | origem opcional | Nao | Nao | Sim | Nao | Media | Sim | Sim |
| Desarme | B | Sim | Sim | Sim | Media | Sim | Nao | subtipo | Nao | Nao | Pode | Nao | Baixo | Sim | Sim |
| Bloqueio | B | Sim | Sim | Sim | Media | Sim | Nao | nenhuma | Nao | Nao | Nao | Nao | Baixo | Sim | Sim |
| Escanteio | B | Sim | Sim | Sim | Media | So se nosso | Nao | lado opcional | Nao | Nao | Nao | Sim | Baixo | Quase | Sim |
| Lateral | C | Nao como botao principal | Sim | Sim | Baixa | So se nosso | Nao | lado opcional | Nao | Nao | Nao | Sim | Baixo | Sim | Sim |
| Assistencia | C | Nao como evento isolado | Sim como enriquecimento do gol | Sim | Alta no pos-jogo | Sim | Sim | vinculacao ao gol | Nao | Nao | Nao | Nao | Nao | Nao | Sim |
| Passe-chave | C | Nao | Sim | Sim | Media | Sim | Sim | ligacao com finalizacao | Nao | Nao | Nao | Nao | Nao | Nao | Sim |
| Passe generico | D | Nao | Opcional | Sim | Baixa | Sim | Recebedor opcional | tipo do passe | Nao | Nao | Nao | Nao | Nao | Nao | Sim |
| Conducao / microacao | D | Nao | Nao | Sim | Muito baixa | Sim | Nao | varia | Nao | Nao | Nao | Nao | Nao | Nao | Sim |

## Regras finais de produto por grupo

### O que precisa existir no realtime

- Classe A inteira
- Classe B prioritaria
- nenhum item da Classe D como botao principal

### O que pode existir so no pos-jogo

- assistencia como enriquecimento
- passe-chave
- lateral detalhado
- zonas e origem taticas
- observacao textual

### O que deve migrar para inferencia futura

- passes genericos em volume
- padroes de sequencia ofensiva
- algumas relacoes de posse e transicao
- sugestao de pressao recente
- agrupamento de origem de jogada

## Microfluxos prioritarios

### 1. Gol

`Gol -> equipe -> autor -> origem curta -> assistencia se aplicavel -> confirmar`

Origem curta visivel ao vivo:

- jogada individual
- erro do adversario
- rebote
- bola parada
- sem assistencia
- desconhecida

Origem que pode ficar para pos-jogo:

- recuperacao alta
- tipo detalhado de ataque
- classificacao tatico-contextual mais fina

### 2. Finalizacao

`Finalizacao -> atleta -> resultado -> confirmar`

Detalhes opcionais depois:

- zona
- origem da jogada
- pressao sofrida

### 3. Defesa

`Defesa -> goleiro -> tipo -> confirmar`

Detalhes opcionais depois:

- zona do chute
- origem do ataque

### 4. Falta

`Falta -> nosso ou adversario -> atleta se nosso -> confirmar`

Detalhes opcionais depois:

- lado
- zona
- contexto tatico

### 5. Cartao

`Cartao -> nosso ou adversario -> atleta se nosso -> tipo -> confirmar`

### 6. Escanteio

`Escanteio -> nosso ou adversario -> atleta se nosso -> confirmar`

### 7. Perda de posse

`Perda de posse -> atleta -> causa curta opcional -> confirmar`

### 8. Recuperacao de posse

`Recuperacao de posse -> atleta -> origem curta opcional -> confirmar`

### 9. Substituicao

`Substituicao -> sai -> entra -> confirmar`

### 10. Penalti

`Penalti -> nosso ou adversario -> resultado -> cobrador se nosso -> confirmar`

### 11. Tiro livre

`Tiro livre -> nosso ou adversario -> resultado -> cobrador se nosso -> confirmar`

## Conclusao

A coleta hibrida recomendada para o SCOUT 21 PRO fica assim:

- realtime: Classe A + Classe B essencial
- pos-jogo: enriquecimento da Classe C
- futuro: inferencia da Classe D e parte da Classe C

Decisao mais importante desta Sprint:

- `Passe` nao deve permanecer como evento principal no realtime.

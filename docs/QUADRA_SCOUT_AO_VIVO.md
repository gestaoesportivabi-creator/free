# Quadra do scout ao vivo

Tela de coleta no telefone do treinador. A quadra fica no centro. Os botões de ação ficam em volta, como arquibancada. O cronômetro fica na linha do meio, semitransparente, com pausa num toque.

## Quadra

- Fundo escuro, cantos bem arredondados. As oito zonas são a própria quadra: gol adversário em cima, nosso gol embaixo, cronômetro na faixa do meio.
- Oito zonas, olhando do nosso gol (embaixo) para o gol adversário (cima):
  - Ataque final: esquerda / direita (`AT2_ESQ`, `AT2_DIR`)
  - Ataque meio: esquerda / direita (`AT1_ESQ`, `AT1_DIR`)
  - Defesa saída: esquerda / direita (`DF2_ESQ`, `DF2_DIR`)
  - Defesa fundo: esquerda / direita (`DF1_ESQ`, `DF1_DIR`)
- Esquerda e direita são do ponto de vista de quem está atrás do nosso gol.

## Como marcar o chute

1. Com posse, o botão da direita é **CHUTE** (nosso). Sem posse, é **CHUTE (ADVERSÁRIO)** — o mesmo fluxo de defesa que já existia.
2. A quadra arma. O próximo toque numa zona grava a origem.
3. Em seguida abre o resultado que já existia: no gol / fora / trave / bloqueado, ou o tipo de defesa do chute sofrido.
4. Atleta, tempo e cronômetro seguem as regras atuais. Cancelar na quadra abandona o lance sem gravar.

A zona não substitui o resultado. Sem resultado a estatística de chute no gol, para fora e bloqueado se perde.

## O que é gravado

Cada finalização nossa e cada chute sofrido (defesa) pode levar `shotOriginZone` no lance da fita (`postMatchEventLog`).

O campo `zone` antigo não é reutilizado. Ele continua sendo lateral e escanteio (`AT_ESQ`, `AT_DIR`, `DF_ESQ`, `DF_DIR`). Lance antigo sem `shotOriginZone` abre, edita e salva como antes. Editar o lance na tabela preserva a zona. Trocar o tipo para algo que não é chute ou defesa tira a zona.

## Cronômetro

O relógio fica na faixa central da quadra: tempo grande, botão redondo de pausar / continuar / iniciar. Sincronizar, encerrar tempo e encerrar partida ficam logo abaixo da quadra, para não cobrir as zonas.

A pausa fácil não muda o motor do relógio. Com o relógio pausado, os botões de evento continuam bloqueados — ver a lista de bloqueios.

## Pós-jogo

Na Análise da Partida, o mapa de calor usa as mesmas 8 zonas. Ciano é chute nosso. Rosa é chute sofrido. A intensidade segue a zona com mais chutes. O centro mostra os totais.

Chute sofrido, neste protótipo, é o evento de defesa (chute do adversário). Gol sofrido continua no fluxo de gol e não pinta a quadra.

## Banco

Não há migração. `shotOriginZone` mora dentro do JSON `jogos.post_match_event_log`, que já aceita campos novos. A união da fita copia o objeto inteiro do lance, então a zona não é descartada no PUT.

SQL para o dono rodar: nenhum.

Em `npm run dev`, `http://127.0.0.1:5173/dev/quadra` mostra a quadra com dados fictícios e não grava partida. A rota não responde fora de localhost.

## Fora deste protótipo

- Editar a zona depois, na tabela de lances.
- Zona no gol sofrido e na bola parada.
- Soltar os bloqueios listados em `docs/BLOQUEIOS_SCOUT_AO_VIVO.md`.

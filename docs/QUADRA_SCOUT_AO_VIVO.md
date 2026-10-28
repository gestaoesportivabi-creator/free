# Quadra do scout ao vivo

A quadra fica no centro da coleta. Os botões de ação ficam em volta. Os cinco atletas em quadra e o banco ficam sempre na mesma tela, em dois grupos, sem modal: no celular, acima da quadra; no desktop, na coluna ao lado. O cronômetro fica na linha do meio, semitransparente. Só o botão de pausa recebe o toque; o resto do relógio deixa a região do centro clicável.

## Quadra

Desenho de futsal, 40 m × 20 m, olhando do nosso gol (embaixo) para o gol adversário (cima). Linhas oficiais, e só elas:

- laterais e linhas de fundo
- linha de meio
- círculo central (3 m)
- áreas de 6 m (quartos de círculo a partir de cada trave, fechados por um segmento reto — a meia-lua da área)
- marca do pênalti (6 m) e marca de 10 m
- gol, só para orientar a ponta

Não há grade. A divisão em regiões não é pintada. Ela aparece no toque e no mapa de calor.

Regiões, da esquerda de quem está atrás do nosso gol:

- área adversária e a nossa área
- entre a área e os 10 m, em cada metade
- faixa central de ataque e faixa central de defesa
- lateral esquerda e direita de ataque e de defesa (os 5 m junto à linha lateral)
- círculo central

Chute nosso e chute sofrido usam a mesma quadra.

## Como marcar

1. Toque a região. Toque de novo, ou em Limpar, para soltar.
2. Toque o evento. Vale para passe, chute, falta, desarme, bloqueio, defesa (chute adversário), escanteio e lateral.
3. Daí em diante o fluxo é o que já existia: resultado, atleta, tempo, cronômetro. Gol, cartão, pênalti e tiro livre não usam a região e seguem o fluxo próprio.
4. Sem região o lance grava do mesmo jeito. A região não é trava.

As travas de `docs/BLOQUEIOS_SCOUT_AO_VIVO.md` continuam. Com o relógio parado, no intervalo, na sincronização ou com a partida encerrada, a quadra não aceita região nova.

## O que é gravado

O lance pode levar `shotOriginZone` na fita (`postMatchEventLog`). O campo `zone` antigo não é reutilizado: ele continua sendo lateral e escanteio (`AT_ESQ`, `AT_DIR`, `DF_ESQ`, `DF_DIR`).

Lance antigo sem `shotOriginZone` abre, edita e salva como antes. Editar o lance preserva a região. Trocar o tipo para gol, cartão, pênalti ou tiro livre tira a região. Trocar entre eventos que acontecem na quadra mantém.

Ids do protótipo de grade (`AT2_ESQ` e os outros sete) ainda são lidos e caem na região mais próxima. Não são mais oferecidos na coleta.

## Cronômetro

O relógio fica sobre o círculo central: tempo e o botão de pausar / continuar / iniciar. Sincronizar, encerrar tempo e encerrar partida ficam abaixo da quadra.

A pausa fácil não muda o motor do relógio. Com o relógio pausado, os botões de evento continuam bloqueados.

## Pós-jogo

Na Análise da Partida, o mapa de finalizações usa a mesma quadra, com fundo azul escuro. Cada metade fica em quatro zonas. A cor vai de verde a amarelo, laranja e vermelho conforme a contagem. O número aparece em cada zona. Há uma versão contínua, no mesmo desenho, para comparar.

O 1º tempo ataca para cima. No intervalo o lado inverte sozinho: no 2º tempo atacamos para baixo, e o lance entra na metade de ataque do desenho. Feitas e sofridas ficam separadas.

Gol sofrido continua no fluxo de gol e não pinta a quadra. Passe, falta e os outros lances com região ficam na fita e não entram no mapa. Lance sem região também não entra.

## Banco

Não há migração. `shotOriginZone` mora dentro do JSON `jogos.post_match_event_log`, que já aceita campos novos. A união da fita copia o objeto inteiro do lance, então a região não é descartada no PUT.

SQL para o dono rodar: nenhum.

Em `npm run dev`, `http://127.0.0.1:5173/dev/quadra` mostra a quadra com dados fictícios e não grava partida. A rota não responde fora de localhost.

## Fora deste protótipo

- Editar a região depois, na tabela de lances.
- Região no gol e na bola parada.
- Soltar os bloqueios listados em `docs/BLOQUEIOS_SCOUT_AO_VIVO.md`.

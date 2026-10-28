# Bloqueios do scout ao vivo

Levantamento do que trava o treinador na coleta ao vivo (`MatchScoutingWindow` + `useMatchClock`). Nenhum item foi removido nesta entrega. Nenhum é seguro de tirar sem mudar estatística, cronômetro ou a fita.

## Manter

| Bloqueio | Onde | Recomendação |
| --- | --- | --- |
| Escalação de 5 (1 goleiro + 4) e quem começa com a bola, antes de qualquer comando. O modal não fecha antes disso. | Modal de escalação | Manter. Sem os cinco, o lance não tem autor. |
| Partida não iniciada no relógio (`PRE_JOGO`) desliga os botões de evento. | `canRegisterRealtimeEvent` | Manter. O tempo do lance precisa de um relógio em jogo. |
| Intervalo bloqueia evento até "Iniciar segundo tempo". | idem | Manter. |
| Sincronização aberta bloqueia evento até confirmar ou cancelar. | estado `SINCRONIZANDO` | Manter. Dois tempos ao mesmo tempo estragam a fita. |
| Partida encerrada bloqueia evento novo. A edição volta pelo fluxo de reabrir. | estado `ENCERRADO` | Manter. |
| Partida sem snapshot de relógio exige sincronizar antes de registrar. | `needsClockSyncFallback` | Manter. É a proteção do restore do cronômetro. Não mexer sem regressão. |
| Pênalti em andamento desabilita o resto dos botões até o resultado ou o cancelamento. | `isBlockedByPenalty` | Manter. Pênalti pela metade corrompe o placar. |
| Finalizar coleta ao vivo só com a partida encerrada no cronômetro. No pós-jogo, só com pelo menos um lance. Fita vazia no modo união é recusada. | botão Finalizar coleta | Manter. Evita encerrar uma coleta oca. |
| "Encerrar tempo" do 1º tempo só depois de 20:00. "Encerrar coleta do 1º tempo" aparece antes e já é o atalho. | cronômetro | Manter os dois. Um é regra de jogo, o outro é a coleta. |
| Atleta fora dos 5 em quadra, ou expulso, não recebe toque. | lista da esquerda | Manter. |
| Sincronizar fica desligado com a partida encerrada ou com o modal já aberto. | botão Sincronizar | Manter. |
| Tiro livre e pênalti a favor exigem cobrador escolhido. | alertas dos modais | Manter. A falta acumulada e o placar dependem de quem cobrou. |
| Passe, chute nosso, lateral e cartão nosso exigem atleta na lista. | `handleSelectAction` | Manter para evento nosso. O número do atleta é a estatística. |
| Com posse a direita mostra Passe e Chute. Sem posse mostra Desarme, Chute do adversário e Bloqueio. | miolo da tela | Manter neste protótipo. Esconder o que não cabe na posse evita toque errado no telefone. |

## Candidatos a sair, numa entrega seguinte

Não saíram agora.

| Bloqueio | Por que incomoda | Por que não saiu agora |
| --- | --- | --- |
| Relógio pausado bloqueia todo evento. A mensagem pede para retomar a partida. | A pausa fácil no meio da quadra serve para pensar, e o lance que motivou a pausa não pode ser marcado até o relógio voltar a correr. | A trava está no motor (`isRunning` + estados em jogo), não num botão solto. O restore de `clockSnapshot` é área sensível. Soltar isso muda o carimbo de tempo de toda a fita. Recomendação: permitir registrar com o relógio pausado, usando o segundo em que parou, e manter bloqueados pré-jogo, intervalo, sincronização e encerrado. |
| Gol exige um atleta nosso selecionado antes de abrir "gol nosso ou gol do adversário". | Para marcar gol sofrido é preciso escolher um jogador nosso que não entra no lance. | O fluxo de autor do gol nosso assume que esse atleta já está escolhido. Tirar o alerta sem separar os dois caminhos marca gol nosso sem autor. Recomendação: abrir a escolha de equipe sem atleta; só o gol nosso continua exigindo autor. |
| Resultado do chute ainda é um modal por cima da quadra (no gol, fora, trave, bloqueado), depois da zona. | São dois toques além do botão. | Sem o resultado, chute no gol, para fora e bloqueado deixam de existir na estatística. A zona entrou antes do modal, não no lugar dele. Recomendação: manter o resultado; não voltar a pedir zona num segundo modal. |

## O que já está solto e deve continuar solto

- Receptor do passe é opcional (o interruptor "Pedir quem recebeu o passe").
- Cartão do adversário não pede atleta nosso.
- Desarme, bloqueio e chute do adversário, sem posse, registram na equipe quando não há atleta escolhido.
- Passe, chute, falta, desarme, defesa, escanteio e lateral não pausam o relógio depois de gravar. A pausa longa ficou em gol, pênalti e no meio do tiro livre.

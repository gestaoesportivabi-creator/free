# Levantamento de lances — 2ª partida (mesmo time)

Vídeo curto pra domingo (Scout). Mesmo elenco **AFC Futsal Sub-20**. **Nova partida amistosa**. Tempo real. Sem súmula. Sem abrir Sincronizar. Sem cadastro novo.

Login: `gestaoesportivabi+crono2608@gmail.com` / `Scout21ensaio` (se falhar: `+crono2608b` ou a conta que já tem o elenco).

Objetivo: usar **todos** os tipos da coleta e ver se os bugs do take 1 voltaram.

## Regras rápidas

- Checkbox **Partida Amistosa**
- **Abrir Scout em Tempo Real**
- Quinteto: Hugo, Marquinhos, Thiago, Caio, Léo
- Relógio corre. **Não** abrir sincronizar. Se pausar: **CONTINUAR PARTIDA**
- Clique único, sem loop
- Placar **4-4**. Faltas **2-2**. Amarelos **1-1**

## Matriz (usar tudo)

| # | Tempo | Tipo | Detalhe | Time |
| ---: | --- | --- | --- | --- |
| 1 | 1T | Passe certo | Caio → Thiago | nós |
| 2 | 1T | Passe errado | Caio | nós |
| 3 | 1T | Finalização no gol | Léo | nós |
| 4 | 1T | Finalização fora | Caio (pausa → CONTINUAR) | nós |
| 5 | 1T | Gol | Léo, assistência Caio | **1-0** nós |
| 6 | 1T | Gol | adversário | **1-1** |
| 7 | 1T | Falta | nossa | 1-0 faltas |
| 8 | 1T | Falta | deles | 1-1 faltas |
| 9 | 1T | Amarelo | nosso (Marquinhos) | 1-0 cartões |
| 10 | 1T | Amarelo | deles | 1-1 cartões |
| 11 | 1T | Desarme com bola | Thiago | nós |
| 12 | 1T | Defesa | Hugo | nós |
| 13 | 1T | Bloqueio | Marquinhos | nós |
| 14 | 1T | Escanteio | nosso | nós |
| 15 | 1T | Lateral | nosso | nós |
| — | 20:00 | Encerrar 1º tempo | — | 1-1 |
| 16 | 2T | Tiro livre | Caio, fora ou no gol | nós |
| 17 | 2T | Pênalti | Léo, gol **2-1** | nós |
| 18 | 2T | Gol | adversário | **2-2** |
| 19 | 2T | Gol | Caio | **3-2** |
| 20 | 2T | Gol | adversário | **3-3** |
| 21 | 2T | Falta | nossa | 2-1 faltas |
| 22 | 2T | Falta | deles | 2-2 faltas |
| 23 | 2T | Gol | Léo | **4-3** |
| 24 | 2T | Gol | adversário | **4-4** |
| — | fim | Encerrar partida | — | **4-4** |

Cobertura: passe, chute, gol, falta, cartão, desarme, defesa, bloqueio, escanteio, lateral, tiro livre, pênalti. Nós e eles.

## Bugs a olhar (take 1)

- Wizard some elenco (não entra neste take)
- Autocomplete
- Login de atleta obrigatório
- Abrir/fechar cronômetro a cada lance
- Continuar cinza sem atleta
- Placar diferente do que foi clicado

Anotar em [UX_FRICTION_LOG.md](./UX_FRICTION_LOG.md) só o que **voltar**.

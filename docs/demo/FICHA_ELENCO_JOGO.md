# Ficha do ensaio — AFC Futsal Sub-20

Dados inventados para o take filmado. Não usar nomes de atletas reais da base Scout. Seguir esta lista na ordem.

Take: 2026-08-26. Playbook: [BOT_ONBOARDING_FILMADO.md](./BOT_ONBOARDING_FILMADO.md).

## Conta e equipe

| Campo | Valor |
| --- | --- |
| Técnico | Rafael Mendes |
| E-mail | `gestaoesportivabi+ensaio2608@gmail.com` |
| Senha | `Scout21ensaio` |
| Equipe | AFC Futsal Sub-20 |
| Categoria (se pedir) | Sub-20 |
| Cidade (se pedir) | Belo Horizonte |

Se o e-mail já existir: `gestaoesportivabi+ensaio2608b@gmail.com`.

## Como pensar o time (narrar na landing, antes do cadastro)

Formação base 1-2-1: goleiro, dois fixos/alas nas laterais, um ala de construção, um pivô. Banco com segundo goleiro, um fixo de contenção, alas de recuo e um pivô de área.

Capitão: **#8 Caio Prado** (ala, destro, cobra falta).  
Goleiro titular: **#1 Hugo Bento**.  
Pivô de referência: **#9 Léo Vargas**.  
Quem sai na linha: **#10 Nando Dias** (ala canhoto).

## Elenco (14 atletas)

Wizard (Digitar agora): só nº, nome, posição — atletas **1 a 5**.  
Elenco (Novo atleta): ficha completa — atletas **6 a 14**, e edição dos 1–5 se o sistema exigir nascimento/altura/peso.

Posições oficiais do app: Goleiro, Fixo, Ala, Pivô.

| # | Ordem | Nome completo | Apelido | Posição | Pé | Nascimento | Altura | Peso | Papel no time |
| ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | --- |
| 1 | 1 (wizard) | Hugo Bento da Silva | Hugo | Goleiro | Destro | 2006-03-12 | 184 | 78 | Titular |
| 12 | 2 (wizard) | Pedro Alcântara Nunes | Pedrão | Goleiro | Canhoto | 2007-01-22 | 181 | 76 | Reserva |
| 3 | 3 (wizard) | Marcos Vinícius Rocha | Marquinhos | Fixo | Destro | 2006-07-04 | 176 | 72 | Titular, marcação |
| 4 | 4 (wizard) | Thiago Moura Alves | Thiago | Fixo | Destro | 2005-11-18 | 178 | 74 | Titular, saída |
| 8 | 5 (wizard) | Caio Prado Ferreira | Caio | Ala | Destro | 2006-05-09 | 174 | 70 | Capitão, falta |
| 10 | 6 | Fernando Dias Costa | Nando | Ala | Canhoto | 2006-09-30 | 173 | 68 | Titular, 10 |
| 7 | 7 | Rafael Souza Lima | Rafinha | Ala | Destro | 2007-02-14 | 172 | 67 | Titular, recuo |
| 9 | 8 | Leonardo Vargas Pinto | Léo | Pivô | Destro | 2005-08-21 | 180 | 79 | Titular, área |
| 11 | 9 | Bruno Henrique Castro | Bruninho | Pivô | Canhoto | 2007-04-03 | 177 | 75 | Reserva, pivô |
| 2 | 10 | Igor Mendes Carvalho | Igor | Fixo | Destro | 2006-12-01 | 175 | 73 | Banco, contenção |
| 5 | 11 | Lucas Ferreira Pinto | Lucão | Ala | Destro | 2007-06-17 | 171 | 66 | Banco |
| 6 | 12 | André Luiz Ramos | Dedé | Ala | Canhoto | 2006-10-08 | 174 | 69 | Banco, esquerdo |
| 14 | 13 | Matheus Oliveira Cruz | Matheus | Ala | Destro | 2007-08-25 | 170 | 65 | Banco, velocidade |
| 15 | 14 | Samuel Rocha Dias | Samuel | Pivô | Destro | 2005-12-29 | 182 | 80 | Banco, pivô alvo |

Não cadastrar e-mail de acesso de atleta neste take. Foto e último clube: deixar em branco.

### Quinteto inicial (pós-jogo)

Quadra: **#1 Hugo**, **#3 Marquinhos**, **#4 Thiago**, **#8 Caio**, **#9 Léo**.  
Banco imediato: Pedrão, Nando, Rafinha, Bruninho, Igor.

## Jogo inventado

| Campo | Valor |
| --- | --- |
| Adversário | Minas Tênis Clube Sub-20 |
| Data | 2026-08-25 (ontem, para justificar súmula) |
| Horário (se pedir) | 20:00 |
| Local | Ginásio AFC — Belo Horizonte |
| Competição | Estadual Sub-20 — 1ª fase |
| Tipo de coleta | Pós-jogo / **Adicionar dados da Partida** |
| Posse inicial | Nossa equipe |
| Placar alvo | 4 × 2 (nós) |

Contexto para narrar: clássico local, ginásio cheio, Minas sai na pressão. AFC segura o 1º tempo 2–1 e mata no 2º com o pivô e o 10.

## Eventos a lançar (ordem)

Tempo no formato da coleta pós-jogo (minuto / segundo se o dialog pedir). Período: 1T ou 2T.

| # | Período | Tempo | Evento | Quem / detalhe | Resultado esperado |
| ---: | --- | --- | --- | --- | --- |
| 1 | 1T | 01:20 | Passe certo | Caio → Thiago | Log de passe |
| 2 | 1T | 03:45 | Finalização | Léo, chute de dentro | Fora / `outside` |
| 3 | 1T | 06:10 | Falta contra | Marquinhos sofre | Falta nossa favor |
| 4 | 1T | 06:40 | Tiro livre | Cobrador Caio, resultado gol | 1–0, se o fluxo aceitar gol de falta |
| 5 | 1T | 09:15 | Escanteio | Nossa, zona esquerda se pedir | Corner |
| 6 | 1T | 12:00 | Gol | Autor Léo, assistência Caio, método (cabeça/giro se houver) | 2–0 |
| 7 | 1T | 16:30 | Gol adversário | Fake / contra, se o fluxo tiver “deles” | 2–1 |
| 8 | 1T | 18:50 | Cartão amarelo | Rafinha, nosso | Card yellow |
| 9 | 2T | 22:10 | Desarme com bola | Thiago | Tackle withBall |
| 10 | 2T | 25:40 | Defesa difícil | Hugo | Save hard |
| 11 | 2T | 28:05 | Gol | Autor Nando, assistência Léo | 3–1 |
| 12 | 2T | 33:20 | Gol | Autor Léo, sem assistência | 4–1 |
| 13 | 2T | 36:00 | Gol adversário | Deles | 4–2 |
| 14 | 2T | 38:15 | Lateral | Nosso, zona direita se pedir | Lateral |

Se um tipo de evento não existir no pós-jogo (botão ausente), **não forçar realtime**. Anotar P1 no log e pular para o próximo evento da lista. Encerrar depois do item 14, ou antes se o relógio/período travar — anotar.

Não inventar eventos extra só para “encher. 14 já passa de 8–12 pedidos no plano; se o take apertar, o mínimo aceitável é 1–12.

## Checklist rápido no take

- [ ] 5 do wizard salvos
- [ ] 9 restantes no Elenco, um a um
- [ ] 1–5 editados se faltar nascimento/altura/peso
- [ ] Partida Minas criada
- [ ] Coleta = Adicionar dados da Partida
- [ ] Quinteto inicial conferido
- [ ] Eventos 1–12 lançados (14 se der)
- [ ] Partida encerrada
- [ ] Log de atritos atualizado

# UX friction log — ensaio filmado Scout21

Sessão: 2026-08-26 (take do zero, conta nova).  
Playbook: [BOT_ONBOARDING_FILMADO.md](./BOT_ONBOARDING_FILMADO.md).  
Ficha: [FICHA_ELENCO_JOGO.md](./FICHA_ELENCO_JOGO.md).  
Ambiente: produção `https://scout21.com.br`. Modelo: Grok 4.6 high. Gravação: externa.

Severidade: **P0** bloqueia · **P1** o técnico erraria/desistiria · **P2** ruído.

## Durante o take

| Hora | Tela | Ação | O que aconteceu | Sev. | Ideia de melhoria |
| --- | --- | --- | --- | --- | --- |
| take 2 | Landing scout21.com.br | Abrir site deslogado | Landing carregou. Banner de cookies (Recusar/Aceitar). CTA Criar conta visível. | P2 | Manter cookie abaixo da dobra do hero. |
| take 2 | `/criar-conta` | Cadastrar Rafael Mendes | Conta criada: `gestaoesportivabi+takezero1515@gmail.com`, equipe AFC Futsal Sub-20, trial 30d. | — | Fluxo de signup funcionou. |
| take 2 | WelcomeWizard passo 2 | Digitar 5 atletas | Autocomplete do browser misturou nomes (ex.: “Lucas Silva” virou lixo concatenado). | P1 | `autocomplete="off"` nos campos de atleta. |
| take 2 | WelcomeWizard passo 2 | Salvar elenco | Os 5 nomes digitados **não apareceram** depois no Elenco nem na seleção da partida. | P0 | Persistência do wizard tem que gravar de verdade em `playersApi.create`, com feedback de falha. |
| take 2 | WelcomeWizard passo 2 | Posição nas 5 linhas | Default “Ala” em todo mundo; fácil salvar elenco inteiro de ala. | P2 | Sem default, ou exigir escolha. |
| take 2 | WelcomeWizard passo 3 | Tenho uma súmula para lançar | Caiu no dashboard sem CTA óbvio de “criar o jogo agora”. | P1 | Destino súmula deveria abrir Dados do Jogo / Nova Partida. |
| take 2 | Tabela de Campeonato | Achou Nova Partida | Partida vs Minas só depois de caçar menu. Adversário Minas, 26/08/2026 20:00, amistoso. | P1 | Atalho no onboarding: Criar meu primeiro jogo. |
| take 2 | Depois da partida — Selecionar atletas | Continuar para coleta | “Nenhum jogador nesta categoria”. CONTINUAR cinza, sem tooltip. Elenco vazio. Take de eventos **bloqueado**. | P0 | Se elenco=0, CTA “Ir para Elenco” + copy do porquê. Não deixar criar coleta vazia. |
| take 2 | Selecionar atletas | Procurar voltar | Sem breadcrumb claro para sair e ir ao Elenco. | P1 | Voltar / “Cadastrar elenco primeiro”. |
| take 2 | Elenco → Novo atleta | Salvar ficha | E-mail + senha de acesso do atleta **obrigatórios** (8+ chars). Técnico é forçado a inventar login. ~10–15 campos por atleta, 2–3 min cada. | P1 | Acesso ao app do atleta opcional no primeiro cadastro; senão bloquear só no convite. |
| take 2 | Elenco | Data de nascimento | Date picker em formato mm/dd/yyyy no take (máquina US) vs expectativa BR. | P1 | Forçar locale pt-BR ou máscara dd/mm/aaaa. |
| take 2 | Elenco | Tab entre campos | Tab pula/não foca alguns campos. | P2 | Ordem de tab alinhada ao formulário. |
| take 2 | Elenco | Camisa #10 | Validação vermelha ao tentar #10 (conflito ou regra). | P1 | Mensagem explícita de camisa duplicada no wizard/elenco. |
| take 2 | Dados do Jogo / Minas | Adicionar dados da Partida | Depois de 6 atletas (Hugo, Pedrão, Marquinhos, Thiago, Caio, Léo), a seleção de 5 funcionou. | — | Coleta desbloqueia quando o Elenco existe. |
| take 2 | Coleta pós-jogo | Lançar evento | Evento gravado: 00:00 Leonardo Vargas Pinto — Passe certo. | — | Pipeline de súmula funciona após o elenco. |

## Notas livres (modais, esperas, desvios de roteiro)

- URL de partida: `https://scout21.com.br`
- Conta usada: `gestaoesportivabi+takezero1515@gmail.com` / senha `Scout21ensaio` / AFC Futsal Sub-20
- E-mail fallback? não (este foi o take do zero)
- Wizard: 5 atletas salvos? **não persistiram no Elenco**
- Elenco final (quantidade): **9** — Hugo, Pedrão, Marquinhos, Thiago, Caio, Léo, Nando (#16, porque #10 bloqueou), Rafinha #7, Bruninho #11. Faltam Igor, Lucão, Dedé, Matheus, Samuel.
- Tipo de coleta usado: Adicionar dados da Partida (pós-jogo)
- Eventos lançados: pelo menos 1 passe certo do Léo a 00:00
- Take abortado? não. Do zero: landing → conta nova → wizard → bloqueio sem elenco → Elenco um a um → Minas desbloqueou
- Quinteto que abriu a coleta: Hugo #1, Marquinhos #3, Thiago #4, Caio #8, Léo #9
- Login de atleta usado no form: `takezero.{camisa}@scout21.demo` / `Scout21ensaio`

## Top 10 depois do take

O que um técnico novo mais sente. Ordenar do mais grave ao menos.

1. Digitei o elenco no wizard e o sistema fingiu que estava pronto — na hora do jogo não tinha ninguém. **Causa:** o App carregava o elenco vazio no signup e não recarregava depois do wizard (já corrigido nesta branch).
2. Não consigo lançar a súmula porque CONTINUAR está cinza e ninguém explica o porquê.
3. Depois de “tenho uma súmula”, não tem um botão óbvio de criar o jogo.
4. Tive que achar Nova Partida na Tabela de Campeonato sozinho.
5. O browser completa nome de atleta sozinho e bagunça a ficha.
6. Não achei um Voltar claro da seleção de atletas para o Elenco.
7. Todo mundo nasce Ala se eu não reparar no select.
8. O wizard deixa salvar atleta sem número de camisa / ficha completa, e o Elenco depois exige o resto.
9. Cookie banner na cara na primeira visita (ruído, não bloqueia).
10. Signup em si foi o trecho mais limpo do take.

## Pacote para o time Scout

- Vídeo (quem filma): gravar a janela **Computer / Browser desta sessão do agente**, não o editor local
- Duração: take 2 em andamento (signup + wizard + bloqueio na seleção)
- Este log: preenchido com o P0 de persistência do wizard
- Recorte recomendado: do CTA Criar conta até a tela “Nenhum jogador nesta categoria”

---

## Partida 2 — amistosa realtime (2026-08-27)

Conta: `gestaoesportivabi+crono2608@gmail.com` · AFC Futsal Sub-20 · Minas · Scout Tempo Real · sem súmula · sem Sync · sem demo.

Resultado: **4-4 ENCERRADO**. Quinteto Hugo / Marquinhos (Marcos) / Thiago / Caio / Léo. 1º e 2º tempo encerrados. Sincronizar não aberto.

| Hora | Tela | Ação | O que aconteceu | Sev. | Ideia |
| --- | --- | --- | --- | --- | --- |
| p2 | Login | Campo e-mail | Input é `type=text` (“e-mail ou nome”), não `type=email`. | P2 | Documentar / `data-testid` ok. |
| p2 | Coleta live | Finalização / gol | Relógio pausa; precisa **CONTINUAR PARTIDA** (voltou do take 1). | P1 | Manter, mas CTA mais óbvio pós-evento. |
| p2 | Coleta 2T | Tiro livre | Botão **desabilitado** com &lt;5 faltas no período. Matriz pedia tiro livre com faltas 2-2. | P1 | Ou liberar tiro livre “comum”, ou avisar no UI por que está cinza. |
| p2 | Coleta 2T | Pênalti | Ordem cobrador/time confusa; alert “Selecione o cobrador primeiro”; gol de pênalti não gravou na 1ª tentativa. | P1 | Fluxo linear: time → cobrador → resultado, sem alert nativo. |
| p2 | Header faltas | Após 2T | Display `1 F \| 1 F` (período?) com 2 faltas por lado no total da matriz. | P2 | Deixar claro se o contador é do período ou da partida. |

Cobertura: passe certo/errado, chute in/out, gol (nós+eles), falta, amarelo (nós+eles), desarme, defesa, bloqueio, escanteio, lateral. Tiro livre skip. Pênalti falhou → gol normal no lugar para fechar 4-4.

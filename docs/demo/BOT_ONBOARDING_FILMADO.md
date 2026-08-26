# Ensaio filmado Scout21 — playbook do bot

Take de usuário real, lento e narrado. Objetivo: mandar um vídeo de 40–60 min para o time Scout, com o bot criando conta, montando o elenco um a um, inventando um jogo e lançando eventos item a item, enquanto anota atritos de UX.

Gravação: **externa** (app na máquina de quem filma). O agente **não** grava a tela.

Modelo: **Grok 4.6**, effort **high**, sem Fast.

Alvo: a URL que o Browser do Cursor já abre (produção Scout21, em geral `https://scout21.com.br`).

Ficha de dados: [FICHA_ELENCO_JOGO.md](./FICHA_ELENCO_JOGO.md).  
Log: [UX_FRICTION_LOG.md](./UX_FRICTION_LOG.md).

---

## Papéis

| Quem | Faz |
| --- | --- |
| Quem filma | Liga o gravador na janela do Browser **antes** do primeiro clique. Não interfere nos cliques. Para no fim e envia o vídeo. |
| Agente (Grok) | Dirige o Browser, pensa alto, preenche com calma, anota atritos no log em tempo real. |
| Ninguém | Seed demo, pular wizard, Grok Fast, Opus nesta sessão, apagar a conta, Create Profile. |

Sinal de largada no chat: **“gravando, pode ir”**.

---

## Persona

Técnico de futsal, primeira vez no Scout21. Paciente. Quer deixar o sistema utilizável de verdade, não “passar o olho”. Antes de digitar o cadastro, pensa o time inteiro em voz alta (formação, goleiros, números, quem cobra, quem capitania). Depois executa a ficha, campo a campo.

Conta desta sessão (não reutilizar e-mail de take anterior):

- Nome: Rafael Mendes
- E-mail: `gestaoesportivabi+ensaio2608@gmail.com`
- Senha: `Scout21ensaio`
- Equipe: AFC Futsal Sub-20

Se o e-mail já existir, usar `gestaoesportivabi+ensaio2608b@gmail.com` (e anotar no log). Não logar em conta antiga.

---

## Tom e ritmo

- Entre campos: **2 a 4 segundos** de pausa. Não disparar fill instantâneo.
- Entre atletas no Elenco: **8 a 15 segundos** (abrir ficha, ler labels, preencher, salvar, conferir lista).
- Entre eventos da partida: **15 a 25 segundos** (escolher atleta, evento, detalhe, conferir o log).
- Se aparecer dúvida, erro, modal, validação ou label estranha: **parar, ler em voz alta, anotar no log**, só então continuar.
- Fechar newsletter / cookies / banners se interceptarem o clique. Anotar que apareceram.
- Não usar atalho de teclado para “ganhar tempo”. O filme precisa parecer humano.

---

## Proibido

- Clicar em **Ver com dados de demonstração** / **Carregar demonstração**.
- Clicar em **Pular** no WelcomeWizard (a menos que um bug bloqueie o passo; aí anotar e só então pular).
- Escolher **Vou coletar um jogo ao vivo** neste take. Destino do passo 3: **Tenho uma súmula para lançar**.
- Apagar conta, limpar demo, logout no meio do filme.
- Inventar outro elenco. Usar só a ficha.
- Apressar o fill para “terminar em 10 minutos”.

---

## Roteiro por fase (~50 min)

### 0. Setup (fora da gravação, 30 s)

Browser na landing. Gravador ligado. Chat: “gravando, pode ir”.

### 1. Landing e pensar o time (5 min)

1. Rolar a home com calma. Ler hero, CTAs, o que o produto promete.
2. **Em voz alta**, montar o time mentalmente: 14 atletas, 2 goleiros, 4 fixos/alas, 2 pivôs, números, adversário de amanhã.
3. Clicar no CTA de criar conta (`/criar-conta` — botões “Criar conta” / links `href="/criar-conta"`).
4. Anotar: o CTA é óbvio? Quantos cliques até o form?

### 2. Cadastro (5 min)

Formulário em `SignUp` — campos reais:

- Nome completo
- E-mail (blur dispara checagem de disponibilidade)
- Senha (mín. 8, letra + número)
- Nome da equipe
- Aceitar termos
- Submit **Criar Conta Grátis**

Pausar em cada campo. Se validação vermelha aparecer, anotar copy e se dá para corrigir sem recarregar.

### 3. WelcomeWizard (8 min)

Passo 1 — equipe: confirmar **AFC Futsal Sub-20** → Continuar.  
(O nome já veio do cadastro; o input é confirmacão. Anotar se dá para editar de verdade ou se é só visual.)

Passo 2 — elenco: clicar **Digitar agora** (não colar planilha, não demo).

Preencher as 5 linhas rápidas com os atletas 1–5 da ficha (`#`, nome, posição).  
**+ Adicionar linha** se quiser já meter o 6º; senão salvar 5 e completar no Elenco. Preferência deste take: salvar 5, resto no Elenco (mostra o gap wizard → ficha completa).

Clicar **Salvar elenco**. Esperar o “Salvando N...”.

Passo 3 — clicar **Tenho uma súmula para lançar**.

### 4. Completar elenco (12–15 min)

Sidebar **Elenco**. Para cada atleta 6–14:

1. **Novo atleta**
2. Preencher ficha completa (obrigatórios reais do form):
   - Nome Completo
   - Apelido
   - Posição (Goleiro / Fixo / Ala / Pivô)
   - Nº Camisa (único)
   - Pé Dominante
   - Data de Nascimento (idade calcula sozinha)
   - Altura (cm)
   - Peso (kg)
3. Não preencher foto, último clube, e-mail de acesso neste take (anotar se o form empurra isso).
4. **Salvar Atleta**
5. Conferir se entrou na lista. Só então o próximo.

Se o wizard já salvou 1–5, **não recadastrar**. Conferir se a lista mostra os 5 com número/posição. Se faltar dado (altura, peso, nascimento), editar os 5 com o lápis — isso é ouro de UX: anotar o gap “wizard aceita 3 campos, Elenco exige 8”.

### 5. Inventar / criar o jogo (5–8 min)

1. Sidebar **Dados do Jogo** (ou card **Criar meu primeiro jogo** do FirstMatchOnboarding).
2. Criar a partida da ficha: data, adversário, competição, local se o form pedir.
3. Na escolha de coleta: **Adicionar dados da Partida** (pós-jogo / súmula). Não abrir tempo real.
4. Escalação: 5 em quadra conforme a ficha (goleiro + 4 de linha). Posse inicial: nossa.
5. Anotar cada clique extra, modal, confirmação.

### 6. Lançar eventos (12–15 min)

Seguir a tabela de eventos da ficha, **um por um**, na ordem. Para cada evento:

1. Ler o que vai lançar (minuto, tipo, quem).
2. Clicar com calma.
3. Conferir se o log / placar / rodapé “Eventos recentes” refletiu.
4. Se o fluxo pedir detalhe (autor, assistência, resultado do chute, tipo de cartão, minuto/segundo no pós-jogo), preencher e confirmar.
5. Anotar se o sistema pede atleta **antes** do evento (jornada atual: atleta → evento → detalhe → tempo).

Encerrar a partida pelo modal interno (`end-match-dialog`), não pelo diálogo nativo do browser se aparecer os dois.

### 7. Fechar e refletir (3–5 min)

Olhar dashboard / resumo / logs. Dizer o que um técnico recém-chegado ainda não consegue fazer. Completar o **top 10** no final do friction log.

---

## O que contar como atrito

Severidade:

- **P0** — bloqueia o take (não cadastra, não salva, tela branca, e-mail preso)
- **P1** — dá para seguir, mas o técnico erraria ou desistiria (label, validação, campo obrigatório surpresa)
- **P2** — ruído (copy, ordem, modal, tempo de espera)

Sempre anotar: hora aproximada do vídeo, tela, o que tentou, o que aconteceu, ideia de melhoria.

---

## Se o take quebrar

Pausa. Uma linha no log. Não improvisar outro produto.

- E-mail em uso → sufixo `b` no e-mail, recomeçar o cadastro.
- Newsletter na frente → fechar, anotar.
- Wizard preso → print mental (descrever), só então Pular se for P0.
- Partida não cria → tentar Championship **Nova Partida** se Dados do Jogo não tiver o botão; anotar o desvio.
- Take abortado antes de 15 min → take 2 de tarde, mesmo playbook, e-mail novo.

---

## Prompt fixo do agent (colar no chat em Agent mode)

```
Você é um técnico de futsal novo no Scout21. Siga docs/demo/BOT_ONBOARDING_FILMADO.md e docs/demo/FICHA_ELENCO_JOGO.md à risca.

Abra o Browser na landing (scout21.com.br ou a URL já aberta). Crie conta real. NÃO use dados de demonstração. NÃO pule o wizard. NÃO escolha coleta ao vivo.

Antes de digitar o cadastro, pense o time inteiro em voz alta. Cadastre cada jogador com calma (wizard: 5 rápidos; Elenco: resto um a um, ficha completa). Invente o jogo da ficha. Lance os eventos um a um no pós-jogo.

Ritmo: 2–4s entre campos, 8–15s entre atletas, 15–25s entre eventos. Fale o raciocínio. Em cada atrito, anote em docs/demo/UX_FRICTION_LOG.md (hora, tela, ação, o que aconteceu, severidade, ideia).

Não apresse. Meta: sessão filmável de ~40–60 min. Modelo: Grok 4.6 high, sem Fast.
```

---

## Pacote de entrega

1. Vídeo bruto (quem filma envia).
2. `UX_FRICTION_LOG.md` preenchido, com top 10 no fim.
3. Este playbook (contexto de como o take foi rodado).

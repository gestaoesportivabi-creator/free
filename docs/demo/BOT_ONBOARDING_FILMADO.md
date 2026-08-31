# Ensaio filmado Scout21 — playbook do bot

## Take definitivo (este)

**Cronômetro + dados em tempo real.** Não é súmula.

- Gravação: externa. Agente não grava.
- Modelo: Grok 4.6 high, sem Fast.
- Alvo: `https://scout21.com.br` (Production já tem o cronômetro).
- Placar: **4 a 4**. Dois tempos de **20 min**.
- Relógio: **Sincronizar cronômetro** para pular ao minuto do lance. Não esperar 40 min reais.
- Ficha: [FICHA_ELENCO_JOGO.md](./FICHA_ELENCO_JOGO.md). Log: [UX_FRICTION_LOG.md](./UX_FRICTION_LOG.md).

Sinal: **“gravando, pode ir”**.

Conta nova (não reusar takezero / ensaio2608):

- Nome: Rafael Mendes
- E-mail: `gestaoesportivabi+crono2608@gmail.com`
- Senha: `Scout21ensaio`
- Equipe: AFC Futsal Sub-20

---

## Proibido

- Dados de demonstração.
- **Adicionar dados da Partida** / súmula / “Tenho uma súmula”.
- Pular o wizard, salvo P0 (aí Elenco).
- Loop de apagar/redigitar o mesmo nome.
- Marcar login do atleta.
- Apagar conta no meio do filme.

---

## Clique inteligente

1. Um caminho só. Sem reabrir o mesmo form.
2. Autocomplete: limpa **uma vez**, digita, segue.
3. Wizard vazio no Elenco? Não volta. Cadastra no Elenco e segue (fix de refetch ainda não está no ar).
4. Evento que pausa o relógio → **CONTINUAR PARTIDA** antes do próximo.
5. Ordem: sincronizar → atleta → evento → olhar o log → próximo.

---

## Roteiro (~45–55 min)

1. Landing → Criar conta.
2. Wizard: equipe → Digitar agora (5 da ficha) → **Vou coletar um jogo ao vivo**.
3. Elenco: garantir Hugo, Marquinhos, Thiago, Caio, Léo (mínimo 5/5). Completar Nando e Rafinha se der tempo. Sem e-mail de atleta.
4. Dados do Jogo → Minas Tênis Clube Sub-20, 26/08/2026 20:00 → **Abrir Scout em Tempo Real**.
5. Escalação 5/5: Hugo, Marquinhos, Thiago, Caio, Léo. Posse nossa. Confirmar.
6. URL `/scout-realtime`. **INICIAR PARTIDA**.
7. 1T até **2-2**, encerrar 1º tempo.
8. **INICIAR SEGUNDO TEMPO**. 2T até **4-4**. **Encerrar partida**.

Eventos e minutos: tabela da ficha.

---

## Prompt do take

```
Take DEFINITIVO: cronômetro ao vivo, não súmula. scout21.com.br. Conta nova gestaoesportivabi+crono2608@gmail.com / Scout21ensaio / AFC Futsal Sub-20.

Siga docs/demo/BOT_ONBOARDING_FILMADO.md e FICHA_ELENCO_JOGO.md.

Wizard: Digitar agora, depois "Vou coletar um jogo ao vivo". NUNCA demo. NUNCA "Adicionar dados da Partida".

Se o elenco vier vazio, vai no Elenco e cadastra (não patina no wizard). Sem login de atleta.

Dados do Jogo → Minas → Abrir Scout em Tempo Real. Escalação Hugo Marquinhos Thiago Caio Léo. INICIAR PARTIDA.

Não espere 20 min: use Sincronizar cronômetro no minuto de cada lance. Evento que pausar → CONTINUAR PARTIDA.

1T termina 2-2. Intervalo. 2T termina 4-4. Encerrar partida. Clique uma vez, sem loop.

Anote atritos em docs/demo/UX_FRICTION_LOG.md.
```

---

## Take antigo (súmula) — não repetir

O 1h30 foi pós-jogo. Serviu de atrito. O filme que importa agora é o cronômetro.

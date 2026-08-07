# PLANO — NOVA LANDING PAGE

**Projeto:** SCOUT 21 PRO
**Documento:** `docs/PLANO_LANDING_PAGE_V2.md`
**Data:** 2026-08-06 · **Revisão:** 2026-08-07
**Objetivo:** substituir uma página que vende "gestão de equipe" por uma que mostra o que o sistema realmente é — e converter em cadastro no teste de 30 dias.

---

## REVISÃO 2026-08-07 — AUDITORIA CONTRA O CÓDIGO

A tese do plano **se mantém**. A landing vende planilha; o produto é ciência do esporte + coleta ao vivo + IA. Abaixo, correções factuais para a redação **não mentir**.

### Claims a remover ou reescrever

| No plano original | Realidade no código | Como falar |
|---|---|---|
| "Fila offline com reconciliação" | Autosave com debounce + handoff via `localStorage.realtimeScoutData`. **Não** há fila offline persistente | *"Autosave contínuo durante a coleta"* — sem prometer offline |
| "Atalhos de teclado" na coleta | Não há `keydown` na `MatchScoutingWindow` | *"Poucos toques por evento"* — sem atalhos até existirem |
| "Scout individual" e "Quarteto" no grid "tudo incluído" | UI existe, mas App renderiza **EmBreve / cadeado** | Fora do grid público, ou rótulo *"em breve"* |
| "VideoScout no menu" | Backend + `VideoScout.tsx` existem; **sem item no Sidebar** | Falar via assistente/YouTube Scout, não como tela principal |
| "222 arquivos TypeScript" | ~125 TS/TSX em `21Scoutpro/` (+ backend) | Preferir **117 endpoints · 34 models · 20 áreas no menu** |

### Achados que o plano original subestimou (bom para execução)

1. **Já existem mockups** em `21Scoutpro/public/scout21pro-*.jpg` (hero, dashboard, feature, how-it-works, testimonial) — **não usados**. A landing carrega 6–7 PNGs ChatGPT (~12 MB) e referencia um arquivo **ausente**.
2. Bundle: landing é **import eager** em `App.tsx`; chunk principal ~1,7 MB + `charts` ~423 KB no vendor split — visitante da home baixa o app.
3. Trial já libera plano efetivo **PERFORMANCE** por 30 dias — a página pode dizer "produto completo no teste" **desde que** não liste módulos EmBreve como prontos.

### Decisão de execução (resposta L1 vs L2)

**Começar pela L1 (conteúdo + prova visual).** Sem captura/redação verdadeira, quebrar o arquivo de 760 linhas só gera refatoração cosmélica.

**L0 em paralelo (meio dia, não bloqueia L1):**
- `React.lazy` da landing (ou do app autenticado) — tira charts/dashboard do first paint
- Trocar carrossel ChatGPT pelos `scout21pro-*` já no `public/`
- Remover referência à imagem ausente

Ordem: **L0 → L1 → L3 (seções) → L2 (quebra de arquivos, se ainda monolítico) → L4 (SEO/Lighthouse)**.

### Diretrizes de design (landing promocional)

- Hero = **uma composição**: marca dominante + 1 headline + 1 frase + 1 grupo de CTA + 1 visual full-bleed (produto). Sem cards no hero, sem strip de stats, sem badges flutuantes.
- Identidade atual (preto + ciano `#00f0ff`) **preservar** — não migrar para look genérico AI (roxo/creme/broadsheet).
- Grandeza = **específico verificável** (ACWR 7/28, readiness, 12 eventos, Telegram `/hoje`), não adjetivo.

---

## SUMÁRIO EXECUTIVO

### O diagnóstico em uma frase

A landing vende uma planilha bonita. O produto é um sistema de ciência do esporte com predição de risco de lesão, assistente de IA e coleta em tempo real — e nada disso aparece na página.

### A prova

Isto é o que a página promete hoje, palavra por palavra:

| Card atual | O que o sistema realmente faz |
|---|---|
| *"Gestão de Equipe — cadastro e histórico completo do atleta"* | Elenco + lesões + avaliação física + musculação + transferências, com portal próprio para o atleta |
| *"Scout de Jogo — registre dados individuais e coletivos"* | Coleta **ao vivo** com cronômetro oficial, atalhos de teclado, 12 tipos de evento, fila de gravação offline e reconciliação — mais coleta por súmula |
| *"Evolução e Ranking — acompanhe os resultados"* | **ACWR** (razão carga aguda:crônica em janelas de 7/28 dias), *readiness score* por atleta, alertas interpretativos e recomendação automática de intensidade de sessão |
| *(não mencionado)* | **Assistente de IA** com contexto do elenco, no dashboard e no Telegram |
| *(não mencionado)* | **Bot de Telegram** que coleta bem-estar do atleta e envia briefing ao treinador |
| *(não mencionado)* | **Scout de adversário** com registro de vídeos do YouTube |
| *(não mencionado)* | Tabela de campeonato, relatório gerencial, quarteto de alta performance |

### Os números reais do produto

| Dimensão | Escala |
|---|---|
| Endpoints de API | **117** |
| Modelos de dados | **34** |
| Telas/áreas funcionais | **20** |
| Arquivos TypeScript | **222** |
| Suítes de teste E2E | **7** |
| Idiomas no blog | **3** (pt-BR, en, es) |
| Canais de acesso | Web, Telegram (treinador), Telegram (atleta), portal do atleta |

### O erro central da página atual

Ela descreve **funcionalidades genéricas** que qualquer planilha compartilhada também teria. Não menciona uma única vez:

- que o sistema **prevê risco de lesão** com a mesma métrica usada por clubes profissionais;
- que existe uma **IA** que responde perguntas sobre o próprio elenco;
- que o atleta responde bem-estar **pelo Telegram**, sem instalar nada;
- que a coleta ao vivo funciona **com o jogo rolando**, à beira da quadra.

Um treinador que lê a página atual não tem como distinguir o SCOUT21 de um Google Sheets bem-feito. Essa é a lacuna que este plano fecha.

---

## PARTE I — AUDITORIA DA PÁGINA ATUAL

### 1.1 Estrutura existente

`components/LandingPage.tsx`, ~760 linhas, seções na ordem:

```
nav fixa
hero                    "Gestão esportiva na prática"
#para-quem-e            3 cards (clubes, universitários, comissões)
#desafio                dores genéricas
#solucao                4 cards de funcionalidade
#diferenciais           diferenciais
vestiário / DNA         narrativa de marca
como funciona           5 passos
carrossel               7 imagens
#teste-gratis           4 cards (adicionado no sprint do trial)
#contato                planos + formulário
widget WhatsApp
```

### 1.2 O que funciona e deve ser preservado

- **Identidade visual**: preto absoluto + ciano `#00f0ff`, tipografia itálica pesada. É distinta e madura. **Manter.**
- **Seção "para quem é"**: qualificar o público cedo está correto.
- **Seção do teste grátis**: recém-criada, remove a objeção de cobrança. **Manter como está.**
- **Animações por scroll** (`useInView`): bom ritmo de leitura.
- **Captura de leads** com UTM: instrumentação já pronta.

### 1.3 O que está errado

| # | Problema | Efeito |
|---|---|---|
| P1 | Funcionalidades descritas em nível genérico | Indistinguível de planilha |
| P2 | Zero menção a IA, Telegram, ACWR, coleta ao vivo | O maior valor fica invisível |
| P3 | Nenhuma imagem de produto real | Não há prova de que existe |
| P4 | Sem prova social — nenhum nome, número ou depoimento | Sem confiança |
| P5 | Carrossel de imagens genéricas de IA | Ocupa espaço nobre sem vender nada |
| P6 | Hero fala do produto, não do problema do treinador | Não gera identificação |
| P7 | Bundle de 1,73 MB (453 kB gzip) | LCP alto derruba conversão |
| P8 | Sem FAQ | Objeções morrem sem resposta |

---

## PARTE II — ESTRATÉGIA

### 2.1 A tese

> Um treinador de futsal não quer "gestão". Quer **decidir melhor** — quem escala, quanto treina, quem está por um fio.

A página deve provar que o SCOUT21 responde a **três perguntas concretas** que hoje o treinador responde no achismo:

1. **"Meu elenco aguenta treino forte hoje?"** → readiness + ACWR + recomendação de sessão
2. **"O que aconteceu no jogo, de verdade?"** → coleta ao vivo + scout coletivo e individual
3. **"Quem está em risco?"** → alertas interpretativos + lesões + bem-estar

### 2.2 Posicionamento

**De:** "plataforma de gestão esportiva"
**Para:** **"a inteligência que a comissão técnica não tem tempo de montar"**

O concorrente real não é outro software — é **a planilha do auxiliar** e **a memória do treinador**. A página precisa vencer esses dois.

### 2.3 Hierarquia de mensagem

```
1. Você decide no escuro.              (problema — identificação)
2. O SCOUT21 acende a luz.             (solução — promessa)
3. Veja funcionando.                   (produto — prova visual)
4. Isto é ciência do esporte de verdade. (autoridade — ACWR, IA)
5. Cabe na sua rotina.                 (objeção — Telegram, 2 min)
6. 30 dias, sem cartão.                (risco zero — conversão)
```

### 2.4 Princípio de redação

Cada afirmação da página deve ser **verificável dentro do produto**. Nada de "revolucionário", "inovador", "líder de mercado". A grandeza se mostra pelo **específico**, não pelo adjetivo:

- ❌ "Análise avançada de performance"
- ✅ "Razão carga aguda:crônica em janelas de 7 e 28 dias — a mesma métrica que clubes europeus usam para prever lesão"

---

## PARTE III — ESTRUTURA DA NOVA PÁGINA

### Seção 1 — HERO

**Objetivo:** identificação em 3 segundos + CTA.

```
                    PLATAFORMA DE PERFORMANCE PARA FUTSAL

           Seu elenco está pronto
           para treinar forte hoje?

    O SCOUT21 responde. Com dados de carga, sono e bem-estar
    de cada atleta — não com achismo.

    [ Começar teste de 30 dias ]   Ver como funciona ↓

    Sem cartão de crédito · Acesso completo · Cancele quando quiser
```

**À direita (desktop):** captura real do card de **prontidão da equipe**, com o score, a recomendação de sessão e dois atletas sinalizados. Produto real, não ilustração.

**Por que assim:** a pergunta do título é literalmente a que o treinador se faz toda terça-feira. Identificação imediata, sem jargão.

---

### Seção 2 — A DOR (nova)

**Objetivo:** nomear o problema antes de vender.

```
              Hoje a decisão é no escuro

  📋 A planilha        🧠 A memória          ⏱️ O tempo
  Dados espalhados     "Ele reclamou do      Ninguém tem 3h
  em 4 arquivos que    joelho semana         livres para montar
  ninguém abre depois  passada... acho"      relatório
```

Frase de fecho: *"Não falta empenho na comissão técnica. Falta sistema."*

---

### Seção 3 — AS TRÊS PERGUNTAS (núcleo da página)

**Objetivo:** mostrar profundidade real. Três blocos alternados (texto ↔ imagem), cada um com captura de tela verdadeira.

#### Bloco 1 — "Meu elenco aguenta hoje?"

> **Prontidão da equipe, calculada todo dia**
>
> O SCOUT21 cruza PSE, qualidade de sono e bem-estar de cada atleta e devolve um score de prontidão — com recomendação de intensidade para a sessão.
>
> Por trás do número está a **razão carga aguda:crônica (ACWR)**, comparando os últimos 7 dias contra os últimos 28. É o indicador que a literatura associa a risco de lesão, e que normalmente exige um preparador físico com planilha própria.
>
> `Score 62 · Sessão moderada · 3 atletas sinalizados`

#### Bloco 2 — "O que aconteceu no jogo?"

> **Coleta ao vivo, com o jogo rolando**
>
> Cronômetro oficial (FSM de período) e registro por toque. Gol, finalização, falta, desarme, defesa, cartão e mais — **12 tipos de evento**, cada um em poucos toques.
>
> Autosave contínuo enquanto o jogo roda. Prefere lançar pela súmula, depois? O mesmo sistema aceita — e alimenta os mesmos indicadores.
>
> ⚠️ Não prometer "offline com fila/reconciliação" nem "atalhos de teclado" até existirem no código.

#### Bloco 3 — "Quem está em risco?"

> **Alertas que explicam, não só apitam**
>
> "3 atletas em recuperação. Acompanhar evolução no departamento médico." Em vez de um número solto, uma frase que já diz o que fazer.
>
> Lesões ativas, carga acumulada, sono ruim e queda de bem-estar entram no mesmo radar — por atleta, com histórico.

---

### Seção 4 — O ASSISTENTE DE IA (nova, alto impacto)

**Objetivo:** o diferencial mais forte, hoje invisível na página.

```
        Pergunte. Ele conhece seu elenco.

  ┌─────────────────────────────────────────────┐
  │  Como está a carga do Rafael esta semana?   │
  │                                             │
  │  Rafael Souza teve PSE médio 7,2 nos        │
  │  últimos 3 treinos, acima da média dele     │
  │  (5,8). O sono caiu para 6h. Score de       │
  │  prontidão: 58. Sugiro carga reduzida.      │
  └─────────────────────────────────────────────┘

  No painel ou pelo Telegram. Sem exportar planilha,
  sem montar relatório.
```

---

### Seção 5 — O ATLETA RESPONDE PELO TELEGRAM (nova)

**Objetivo:** matar a objeção "meu time não vai preencher nada".

```
     O dado só serve se o atleta responder

  O SCOUT21 pergunta pelo Telegram — que todo mundo já tem.
  Sono, PSE, bem-estar: 30 segundos, sem instalar aplicativo,
  sem senha nova.

  /hoje       Status do dia + o que falta responder
  /preencher  Registrar pendências

  O treinador recebe consolidado. O atleta nem abre o sistema.
```

**Por que importa:** a maior causa de morte de ferramentas de monitoramento é atleta que não preenche. Resolver isso é diferencial competitivo real.

---

### Seção 6 — TUDO O QUE ESTÁ INCLUÍDO

**Objetivo:** mostrar amplitude sem virar lista chata. Grade de 4 colunas, agrupada:

| Elenco e rotina | Jogo | Fisiologia | Inteligência |
|---|---|---|---|
| Cadastro completo | Coleta ao vivo | PSE treinos e jogos | Assistente de IA |
| Programação semanal | Coleta por súmula | PSR treinos e jogos | Prontidão da equipe |
| Convocações | Scout coletivo | Qualidade de sono | Alertas interpretativos |
| Departamento médico | Ranking | Bem-estar diário | Briefing pré-jogo |
| Portal do atleta | Tabela de campeonato | Avaliação física | Scout adversário (YouTube) |
| — | Relatório gerencial / PDF | Musculação + lesões | — |

**Fora do grid (ainda EmBreve no app):** Scout individual, Quarteto. Não vender como pronto.

Rodapé da seção: *"20 áreas no menu · 117 endpoints · 34 modelos — um único lugar."*

---

### Seção 7 — PROVA SOCIAL (a construir)

**Estado:** hoje inexistente — é a maior lacuna de confiança da página.

Opções, por ordem de força:
1. Depoimento nomeado de treinador (nome, clube, foto)
2. Logos de clubes usuários
3. Números de uso agregados ("X jogos coletados", "Y atletas monitorados")
4. Print de conversa real (com autorização)

**Enquanto não houver:** usar transparência como substituto — *"Produto em uso por comissões técnicas de futsal no Sul do Brasil. Quer falar com quem já usa? Responda ao e-mail de boas-vindas."* Honesto e melhor que silêncio.

---

### Seção 8 — COMO COMEÇAR

```
  1. Crie a conta        2. Monte o elenco       3. Registre um jogo
     Menos de 1 minuto      Cole de uma            Ao vivo ou pela
     Sem cartão             planilha                súmula
```

Fecho: *"Em 5 minutos você já vê seus próprios indicadores."*

---

### Seção 9 — TESTE GRÁTIS

**Manter exatamente como está** (implementada no sprint do trial). Já responde à objeção nº 1.

---

### Seção 10 — FAQ (nova)

Objeções reais, respostas curtas:

- **Preciso de cartão para testar?** Não. Nem cartão, nem Pix. Nada é cobrado ao fim dos 30 dias.
- **Funciona para outras modalidades?** O sistema nasceu no futsal e é otimizado para ele. Handebol e basquete funcionam com adaptações.
- **Meus atletas precisam instalar algo?** Não. Respondem pelo Telegram, que já têm.
- **E se eu não tiver preparador físico?** É exatamente para esse caso. O sistema faz a leitura de carga que faltaria.
- **Meus dados ficam comigo?** Sim. Exportáveis a qualquer momento, inclusive após o teste.
- **Coleto sozinho durante o jogo?** Sim. A coleta ao vivo foi desenhada para uma pessoa só, com poucos toques por evento.
- **E se a conexão oscilar na quadra?** O sistema faz autosave contínuo durante a sessão. (Não prometer modo offline total até existir.)

---

### Seção 11 — CTA FINAL + CONTATO

Manter o formulário de leads (venda consultiva) e o WhatsApp de suporte. CTA principal continua sendo `/criar-conta`.

---

## PARTE IV — IMPLEMENTAÇÃO

### 4.1 Ordem das seções (final)

```
1. Hero                    ← reescrito
2. A dor                   ← nova
3. As três perguntas       ← nova (núcleo)
4. Assistente de IA        ← nova
5. Telegram do atleta      ← nova
6. Tudo incluído           ← reescrito
7. Prova social            ← nova
8. Como começar            ← ajustado
9. Teste grátis            ← mantido
10. FAQ                    ← nova
11. CTA + contato          ← mantido
```

**Removido:** carrossel de 7 imagens genéricas (ocupa espaço nobre sem vender), seção "vestiário/DNA" (narrativa de marca antes de provar valor).

### 4.2 O ativo que falta: capturas de tela

**Este é o item bloqueante da página.** Sem imagem real de produto, nenhuma promessa é crível.

Capturas necessárias (5):

| # | Tela | Onde aparece |
|---|---|---|
| 1 | Card de prontidão com score e sinalizados | Hero + Bloco 1 |
| 2 | Coleta ao vivo (Deck & Rail) em ação | Bloco 2 |
| 3 | Alertas interpretativos no painel | Bloco 3 |
| 4 | Conversa do assistente de IA | Seção 4 |
| 5 | Telegram do atleta respondendo bem-estar | Seção 5 |

**Como produzir sem expor dados reais:** usar o **seed de demonstração** já implementado (`POST /api/me/demo-data`) — cria elenco e 6 jogos fictícios com estatísticas coerentes. Zero risco de LGPD, zero necessidade de autorização.

### 4.3 Arquitetura de componentes

Hoje `LandingPage.tsx` tem ~760 linhas num arquivo só. A nova estrutura pede quebra:

```
components/landing/
  LandingPage.tsx          orquestrador (~120 linhas)
  sections/
    Hero.tsx
    PainPoints.tsx
    ThreeQuestions.tsx
    AiAssistant.tsx
    TelegramAthlete.tsx
    FeatureGrid.tsx
    SocialProof.tsx
    HowToStart.tsx
    FreeTrial.tsx          (mover a existente)
    Faq.tsx
    FinalCta.tsx
  shared/
    SectionHeading.tsx
    ScreenshotFrame.tsx    moldura com sombra e borda
    useInView.ts           extrair o hook existente
```

### 4.4 Performance — bloqueante para conversão

Bundle atual: **1,73 MB (454 kB gzip)**. A landing carrega o app inteiro para mostrar uma página estática.

| Ação | Ganho esperado |
|---|---|
| `React.lazy` no app autenticado — landing não importa dashboard, charts, coleta | −60% no first load |
| Imagens em WebP/AVIF com `<picture>` e `loading="lazy"` | −40% de peso de imagem |
| `fetchpriority="high"` só na imagem do hero | LCP mais cedo |
| Fontes com `font-display: swap` e preload | Remove flash de texto |

**Meta:** LCP < 2,5s e CLS < 0,1 em 4G. O `charts-BcZWQwzz.js` (433 kB) **não deve** entrar no bundle da landing.

### 4.5 SEO

- `<title>`: *"SCOUT21 — Prontidão, scout e carga de treino para futsal"*
- Meta description citando ACWR e coleta ao vivo (termos que ninguém mais usa → cauda longa sem concorrência)
- JSON-LD `SoftwareApplication` com `offers` (teste gratuito) e `FAQPage` na seção de FAQ
- `hreflang` já existe para pt/en/es — manter
- Headings em hierarquia real (um `h1`, `h2` por seção)

### 4.6 Acessibilidade

- Contraste do ciano `#00f0ff` sobre preto: verificar AA em texto pequeno (o ciano puro tende a falhar em corpo de texto — usar só em destaque e CTA)
- `prefers-reduced-motion` desligando as animações de scroll
- Todas as capturas com `alt` descritivo (também vale SEO)
- Navegação completa por teclado nos CTAs

---

## PARTE V — SPRINTS

### L0–L3 — Implementado (2026-08-07)

Entregue no código:
- Landing V2 modular em `21Scoutpro/components/landing/`
- Shell público `PublicApp.tsx` + `publicBoot.ts` — visitante da `/` **não** baixa `App` (~1,4 MB) nem `charts` (~433 KB)
- Chunks tipicos na home: `index` ~19 KB + `LandingPage` ~37 KB + `vendor` ~141 KB
- Copy verificável (ACWR, coleta ao vivo, IA, Telegram); sem offline/atalhos/EmBreve
- Assets `scout21pro-*` no lugar do carrossel ChatGPT
- FAQ + JSON-LD; meta/OG atualizados em `index.html`

Ainda aberto (L4 / prova):
- Capturas reais com seed demo (hoje: mock UI + mockups existentes)
- Depoimento nomeado
- Lighthouse formal + eventos `section_view`


| # | Entrega |
|---|---|
| 0a | `React.lazy` / code-split: visitante da `/` não baixa charts nem dashboard |
| 0b | Substituir carrossel ChatGPT (~12 MB) pelos `scout21pro-*.jpg` já em `public/` |
| 0c | Remover referência à imagem ausente; `loading="lazy"` fora do hero |

### L1 — Conteúdo e prova (bloqueante)

| # | Entrega |
|---|---|
| 1 | Gerar as 5 capturas com seed demo (`POST /api/me/demo-data`) — ou, no interim, enquadrar mockups `scout21pro-*` |
| 2 | Redação final (só claims verificáveis — ver revisão no topo) |
| 3 | Decidir prova social (depoimento, logo ou transparência honesta) |

### L2 — Refatoração estrutural (depois da copy travada)

| # | Entrega |
|---|---|
| 4 | Quebrar `LandingPage.tsx` em `components/landing/` |
| 5 | Extrair `useInView` e `ScreenshotFrame` |
| 6 | Completar code-split se L0 ainda deixar residual no chunk da home |

### L3 — Seções novas

| # | Entrega |
|---|---|
| 7 | Hero reescrito com captura |
| 8 | Dor + Três Perguntas |
| 9 | Assistente de IA + Telegram |
| 10 | Grade de recursos + FAQ |

### L4 — Performance, SEO e medição

| # | Entrega |
|---|---|
| 11 | WebP/AVIF, lazy loading, preload do hero |
| 12 | JSON-LD SoftwareApplication + FAQPage |
| 13 | Auditoria Lighthouse (meta: 90+ em Performance e SEO) |
| 14 | Eventos de funil por seção (`section_view`, `cta_click`) |

---

## PARTE VI — CRITÉRIOS DE ACEITE

### Conteúdo
- [ ] Toda afirmação da página é verificável dentro do produto
- [ ] ACWR, IA, Telegram e coleta ao vivo aparecem com destaque
- [ ] Nenhuma captura de tela contém dado real de atleta
- [ ] Zero adjetivo vazio ("revolucionário", "inovador", "líder")

### Técnico
- [ ] LCP < 2,5s e CLS < 0,1 em 4G simulado
- [ ] Bundle da landing sem `charts` nem código do dashboard
- [ ] Lighthouse ≥ 90 em Performance, SEO e Acessibilidade
- [ ] Funciona de 320px a 2560px sem scroll horizontal
- [ ] `prefers-reduced-motion` respeitado

### Conversão
- [ ] CTA de cadastro visível sem rolar, em mobile e desktop
- [ ] Nenhum CTA de aquisição apontando para WhatsApp
- [ ] Funil instrumentado por seção

### Metas (30 dias após publicar)
| Métrica | Hoje | Meta |
|---|---|---|
| Cliques no CTA / visitas | — | 8–15% |
| Rolagem até "Três Perguntas" | — | > 50% |
| Cadastros concluídos | — | +100% vs. atual |

---

## ANEXO A — INVENTÁRIO DO PRODUTO

Levantado do código em 2026-08-06. Base factual para toda a redação da página.

### Coleta e jogo
Coleta ao vivo com cronômetro oficial (FSM) · coleta por súmula · 12 tipos de evento · autosave contínuo · scout coletivo · ranking · tabela de campeonato · relatório gerencial / PDF · scout de adversário + YouTube (assistente/backend; UI de vídeo órfã no menu) · *EmBreve:* scout individual, quarteto

### Fisiologia e carga
PSE de treinos e jogos · PSR de treinos e jogos · qualidade de sono · bem-estar diário · avaliação física com dobras cutâneas · musculação e cargas máximas · departamento médico com histórico de lesões · **ACWR (7d:28d)** · readiness score por atleta · recomendação automática de intensidade de sessão

### Inteligência
Assistente de IA no dashboard · assistente no Telegram · alertas interpretativos · briefing pré-jogo · status do elenco · engajamento de preenchimento de bem-estar

### Gestão
Elenco com histórico completo · programação semanal · convocações · portal do atleta · multi-tenant com isolamento por clube/técnico · perfis de acesso por plano

### Canais
Web (desktop e mobile) · Telegram do treinador · Telegram do atleta · portal do atleta

### Plataforma
117 endpoints · 34 modelos Prisma · ~125 TS/TSX no frontend (+ backend) · 7 suítes E2E · blog em 3 idiomas · e-mail transacional · teste gratuito 30 dias (plano efetivo PERFORMANCE) · enforcement 402 na escrita pós-trial

---

**Fim do documento.**
Complementar a `PLANO_MESTRE_TRIAL_30D.md` — a landing entrega o tráfego ao cadastro; o trial converte. As duas peças precisam contar a mesma história.

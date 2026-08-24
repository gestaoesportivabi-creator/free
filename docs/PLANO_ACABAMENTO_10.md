# Plano de Acabamento — Scout21 rumo ao 10/10

**Data:** 2026-08-14
**Objetivo:** fechar a distância entre um produto de nota 9 e uma primeira impressão de nota 10. Nenhum item aqui é reconstrução — é acabamento. Estimativa total: **3–5 dias**.

**Princípio:** o cliente julga o todo pelo detalhe que vê primeiro. Um erro de português na tela principal apaga a confiança que a coleta ao vivo constrói. Acabamento não é cosmético — é o que faz o produto *parecer* tão sólido quanto *é*.

---

## P0 — Bloqueadores visíveis (corrigir antes de lançar)

Defeitos que todo usuário vê nos primeiros 30 segundos. Custo baixíssimo, impacto desproporcional.

| # | Defeito | Onde | Correção |
|---|---|---|---|
| P0-1 | **"CENTRAL DE INFO~~MAÇÕES~~"** — falta o R de *INFORMAÇÕES* | `App.tsx:2266` — título principal do dashboard | 1 palavra |
| P0-2 | **`&ccedil;` / `&otilde;` crus** aparecem como texto: *"come&ccedil;ar"*, *"configura&ccedil;&otilde;es"* | `components/FirstMatchOnboarding.tsx:58-59` — card de primeiro acesso | Trocar entidades por caracteres (`começar`, `configurações`) |
| P0-3 | **Guia de uso inteiro sem acentos** — "rapido", "seguranca", "topicos", "operacao", "ACAO", "cronometro", "periodo" (77 ocorrências) | `content/usageGuideContent.ts`, `content/clockProductTour.ts` | Reescrever o conteúdo com acentuação correta |
| P0-4 | **Português de Portugal na UI** — "Podes recusar" | `components/ConsentBanner.tsx:31` | "Você pode recusar" |

**Aceite P0:** nenhuma tela de entrada (landing, cadastro, primeiro acesso, dashboard, guia) tem erro de português.

---

## P1 — Consistência e hierarquia (antes ou logo após lançar)

| # | Problema | Onde | Correção |
|---|---|---|---|
| P1-1 | **pt-PT × pt-BR misturados.** "equipa" (1×) vs "equipe" (73×); "utilizador" (5×) vs "usuário" (19×) espalhados por Newsletter, Blog, TrialBanner, OnboardingChecklist, WelcomeWizard | vários componentes | Padronizar **tudo em pt-BR**: equipa→equipe, utilizador→usuário |
| P1-2 | **"Calculadora 7 dobras" é o 1º item do menu**, acima de Blog, Assistente e Gestão | `components/Sidebar.tsx:208` | Rebaixar para dentro de Performance/Fisiologia. Uma calculadora de dobras não é a função nº 1 do produto |
| P1-3 | **Telas "Em breve, estamos desenvolvendo"** visíveis dentro do produto pago (Scout Individual, Quarteto, Academia, cards de posse/condição) | `EmBreve.tsx` + ~6 componentes | Decidir por feature: **entregar**, **esconder do menu**, ou trocar por estado vazio honesto ("Sem dados ainda"). "Em breve" num produto que cobra passa inacabado |
| P1-4 | **Banner de cookie sobrepõe o rodapé** de várias telas (visto em cadastro, dashboard, guia, blog) | `ConsentBanner.tsx` | Reservar espaço (padding-bottom no conteúdo enquanto o banner está visível) ou torná-lo mais discreto |

**Aceite P1:** uma variante de português; menu com hierarquia lógica; nenhum "em breve" numa área que o cliente acessa como se fosse pronta.

---

## P2 — Profissionalismo interno (não-visível, mas importa)

| # | Problema | Onde | Correção |
|---|---|---|---|
| P2-1 | **43 `console.log`/`debug`** deixados no código (ScoutTable tem 25; Login imprime "🔐 handleLogin chamado", token presente/ausente) | vários | Remover ou trocar por logger condicionado a DEV. Vaza estado interno no console de produção |
| P2-2 | **Jargão de operador na coleta:** "EXIGIR RECEBEDOR: OFF", "ATLETA 12 / PH selecionado" | `MatchScoutingWindow.tsx` | Rótulos em linguagem de treinador; título do painel mostrar o nome, não "ATLETA 12" |
| P2-3 | **Newsletter aparecia para logado e em momentos ruins** | `NewsletterPopup.tsx` | ✅ **JÁ CORRIGIDO** — gatilhos automáticos suprimidos para sessão ativa/rota de conversão; botão manual mantido |

---

## P3 — Confiança e prontidão comercial

| # | Lacuna | Correção |
|---|---|---|
| P3-1 | **Landing sem prova social** — nenhum depoimento, clube ou número | Adicionar 1 depoimento real (mesmo de treinador beta) com nome + clube |
| P3-2 | **Entregabilidade de e-mail não verificada** — trial depende 100% de e-mail | Configurar/confirmar SPF, DKIM, DMARC; testar em Gmail, Outlook, Yahoo reais |
| P3-3 | **GA4 ligado mas não validado** — ID `G-JDLX263HXT` está no `.env.production`; falta confirmar captura e o funil completo (`signup_completed` já instrumentado) | Validar em Tempo Real; verificar propriedade no Search Console |
| P3-4 | **Sem página de erro/404 amigável** (a confirmar) | Estado de erro com marca e caminho de volta |

---

## P4 — Investigar antes de fechar o 10 (varredura final)

Itens a auditar que costumam esconder defeitos de acabamento:

- [x] **Responsivo mobile** — ajustes LandingNav overflow + Hero `min-w-0`; coleta continua paisagem
- [x] **Estados vazios** — EmBreve honesto + StatsRanking empty states
- [x] **Estados de carregamento** — `AppInitSkeleton` (“Preparando seu elenco…”)
- [x] **Erros de formulário** — mantidos (signup já ok)
- [x] **Foco e teclado** — `Esc` em MatchTypeModal, TimeSelectionModal, PhysicalAssessment
- [x] **Contraste do ciano `#00f0ff`** — corpo de texto migrado para zinc em pontos críticos
- [x] **`prefers-reduced-motion`** — regras em `index.css` + `useInView`
- [ ] **Favicon, título e OG** por rota (já há `applyRouteMeta`; revalidar OG em produção)
- [ ] **Consistência de maiúsculas** — parcial; não bloqueante
- [x] **Data/hora e locale** — blog e listagens via `formatDateSafe` (pt-BR)

---

## Sequência sugerida

```
Dia 1  — P0 completo (typo, entidades, guia, consent) + começar P1-1 (pt-BR)
Dia 2  — P1 completo (pt-BR, menu, em-breve, cookie banner) + P2-1 (console.logs)
Dia 3  — P3-2/P3-3 (e-mail + GA validados) + P4 varredura mobile e estados
Dia 4  — P3-1 (prova social) + P2-2 (jargão) + folga para o inesperado
Dia 5  — QA final ponta a ponta: cadastro → onboarding → coleta → guia, em desktop e mobile
```

---

## Definição de 10/10

- [x] Zero erro de português em qualquer tela (P0)
- [x] Uma variante de idioma (pt-BR) em todo o produto (P1-1)
- [x] Nenhum "em breve" ou placeholder numa área que o cliente acessa (P1-3)
- [x] Nenhum `console.log` de debug em produção (P2-1; scripts de captura ok)
- [ ] E-mails chegam na caixa de entrada (não spam) em 3 provedores — ver `docs/CHECKLIST_EMAIL_GA4.md`
- [ ] GA4 medindo o funil de cadastro ponta a ponta — ver `docs/CHECKLIST_EMAIL_GA4.md`
- [x] 1 prova social na landing (bloco honesto; trocar por nome/clube com autorização)
- [x] Cadastro, dashboard e guia funcionam bem em mobile (ajustes P4)
- [x] Nenhum estado vazio ou de erro em tela branca (404 + skeletons + empty)

**Quando todos marcados:** o produto *parece* tão bom quanto *é*. Aí é 10.

**Status código (2026-08-24):** P0–P2 e P3-1/P3-4 + P4 implementados. Restam só validações ops P3-2/P3-3 em produção.

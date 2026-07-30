# PLANO MESTRE — COLETA V2

### Novo layout, novo fluxo e paridade funcional completa do Shell de Coleta

Projeto: `SCOUT 21 PRO`
Branch base: `feature/shell-experimental-coleta`
Data: `2026-07-29`
Status: proposta técnica para aprovação
Substitui e absorve: `docs/PLANO_004D_004H_SHELL_PARIDADE.md`

---

## Índice

1. [Sumário executivo](#1-sumário-executivo)
2. [Pesquisa e inspirações](#2-pesquisa-e-inspirações)
3. [Auditoria completa de rotas e funcionalidades](#3-auditoria-completa-de-rotas-e-funcionalidades)
4. [Diagnóstico do gap real](#4-diagnóstico-do-gap-real)
5. [Dados: frequência real de eventos](#5-dados-frequência-real-de-eventos)
6. [Princípios de design e North Star](#6-princípios-de-design-e-north-star)
7. [O novo layout — Deck & Rail](#7-o-novo-layout--deck--rail)
8. [Modelo de interação](#8-modelo-de-interação)
9. [Arquitetura técnica](#9-arquitetura-técnica)
10. [Design tokens](#10-design-tokens)
11. [Especificação evento por evento](#11-especificação-evento-por-evento)
12. [Sprints](#12-sprints)
13. [Estratégia de testes](#13-estratégia-de-testes)
14. [Métricas e critério de decisão](#14-métricas-e-critério-de-decisão)
15. [Riscos e mitigação](#15-riscos-e-mitigação)
16. [Prompts de execução](#16-prompts-de-execução)
17. [Decisões pendentes](#17-decisões-pendentes)

---

## 1. Sumário executivo

### O problema

O Shell experimental (`?coleta=shell`) provou a tese arquitetural — casca visual isolada, domínio único, rollback trivial — mas cobre **1 evento de ~15**. E o fluxo atual (`MatchScoutingWindow`, 6.184 linhas) cobre tudo, mas com uma UX que o próprio `UX_BACKLOG.md` classifica como P0/P1: ambiguidade de fluxo, ordem mental invertida, dependência visual de estados internos do clock.

### A oportunidade que ninguém explorou

**Futsal tem 5 jogadores em quadra.** Futebol tem 11, basquete 5 mas com 12+ no banco e substituição livre. Nenhuma ferramenta genérica de scouting (Hudl, Nacsport, Wyscout) otimiza para 5 — todas usam listas roláveis ou grids de 11–25 botões de atleta.

Com 5 atletas, **a lista inteira cabe permanentemente na tela**. Isso permite eliminar o passo "selecionar atleta" da maioria dos fluxos, via seleção *sticky*. É a vantagem estrutural do produto e a base do layout proposto.

### A proposta

Um layout de 4 zonas fixas — **Command Bar, Athlete Rail, Stage, Action Deck** — com uma **Timeline Strip** de desfazer. O motor por trás é um **fluxo declarativo** (`eventSpecs.ts`): cada evento é uma spec de dados, não código de UI. Adicionar o 16º evento custa uma entrada no arquivo e zero JSX.

Ganho medido em taps para o evento mais frequente (Finalização, 46% do dataset):

| Fluxo | Sequência | Taps |
| --- | --- | --- |
| `MatchScoutingWindow` atual | evento → atleta → resultado | 3 |
| Shell 004C atual | iniciar → atleta → resultado → confirmar | 4 |
| **Coleta V2 (atleta sticky)** | **evento → resultado** | **2** |
| **Coleta V2 (preset)** | **long-press → opção** | **2** |

### North Star

> **TTE — Time To Event:** milissegundos entre a intenção do operador e o evento registrado, com os olhos de volta na quadra.

Tudo neste plano é subordinado a essa métrica. Toda decisão de design que aumente TTE precisa de justificativa explícita.

---

## 2. Pesquisa e inspirações

Levantamento feito em 29/07/2026. As referências abaixo são de ferramentas profissionais de notação de vídeo e de literatura de UX móvel/tablet.

### 2.1 Nacsport — o estado da arte em notação ao vivo

Quatro mecanismos que valem adaptar:

| Mecanismo | O que é | Como adaptamos |
| --- | --- | --- |
| **Clustered Buttons** | Botões sobrepostos: um clique registra a categoria do topo **e** todos os descritores abaixo. "Mais dados em menos cliques." | → **Presets** (§8.3). Long-press em `GOL` abre "Gol de escanteio", "Gol de contra-ataque". Um toque grava ação + método + contexto. |
| **Panel Flows** | Botões divididos em grupos; a ordem dos painéis segue como o analista realmente registra. Cada botão pode: abrir o próximo painel, abrir outro painel, ou permanecer. | → `ShellEventSpec.steps[]` (§9.2). A spec **é** o panel flow, versionado em código. |
| **Tolerance** (por painel) | Número máximo de cliques num painel antes de avançar automaticamente. | → **Auto-advance** (§8.2). Passo com 1 opção válida é pulado; último passo auto-confirma. |
| **Activation / Exclusion Links** | Cadeias de botões: clicar um ativa ou desativa outros. | → `ShellFlowStep.skipWhen` + `disabledWhen` (§9.2). Ex.: assistência desaparece quando método = "jogada individual". |

**Contraponto Hudl Sportscode/Coda:** janela única e estática, mais simples mas menos expressiva. A crítica pública ao Coda é justamente ter tudo numa janela estática. **Lição:** janela única é bom para *glanceability*, ruim para fluxos compostos. Nossa resposta: janela única **com um Stage que troca de conteúdo** — fixo onde importa (contexto), dinâmico onde precisa (decisão).

### 2.2 Thumb zone e alcance em tablet

- ~75% dos toques em telas touch são feitos com o polegar.
- Zonas: **verde** (alcance natural), **amarela** (exige estender), **vermelha** (canto superior — praticamente inalcançável).
- Em dispositivos acima de 6.5", elementos críticos devem ficar nos **dois terços inferiores**.
- Ações primárias vão para **base-esquerda e base-direita**.

**Aplicação direta:** o `Action Deck` (onde estão os eventos) e o `Athlete Rail` ficam ancorados na base. O `Command Bar` — que é **leitura, não toque** — fica no topo, na zona vermelha, de propósito.

### 2.3 UX de dados ao vivo

- Dado ao vivo tem que *parecer* ao vivo — o usuário sente quando está velho.
- **Progressive disclosure:** informação crítica no primeiro nível, riqueza a um toque de distância.
- Contraste de cor com significado (vermelho = ao vivo, cinza = encerrado), não decoração.
- Gestos reduzem fricção quando o operador está usando o aparelho de um jeito comprometido.

### 2.4 A síntese — o que nenhuma delas faz

Todas as ferramentas pesquisadas assumem que o operador está **assistindo a um vídeo**, com pausa e rewind disponíveis. Nosso operador está na **beira da quadra**, sem pausa, sem rewind, e cada olhada para a tela é uma jogada perdida.

Isso muda três coisas:

1. **Confirmação sem olhar.** Haptic + tick sonoro no registro. O operador levanta a cabeça antes do evento terminar de gravar.
2. **Desfazer em vez de confirmar.** Tela de revisão custa atenção *antes*; desfazer custa atenção só quando erra — e erro é minoria.
3. **Zero navegação.** Nenhum modal, nenhuma tela cheia, nenhuma troca de contexto durante os 40 minutos.

### Fontes

- [Nacsport — Panel Flows: An Evolution in Performance Analysis](https://nacsport.com/blog/en-gb/News/panel-flows-evolution-performance-analysis)
- [Nacsport — A Guide to Nacsport Clustered Buttons](https://www.nacsport.com/blog/en-gb/Tips/clustered-buttons)
- [Nacsport — A Guide to Nacsport Activation Links](https://downloads.nacsport.com/blog/en-gb/Tips/activation-links)
- [Nacsport vs Hudl Sportscode: A Complete Overview](https://www.analysispro.com/nacsport-vs-hudl-sportscode)
- [Hudl Coda — Customized Sportscode Windows and Live Coding](https://www.hudl.com/en_gb/products/coda)
- [Mastering the Thumb Zone: Mobile UX & UI Design Guide](https://parachutedesign.ca/blog/thumb-zone-ux/)
- [Designing for the Thumb Zone: A Modern Guide](https://timgraf.com/ux-design/designing-for-the-thumb-zone-a-modern-guide-to-mobile-ux-that-respects-human-anatomy/)
- [Sports App UX Design: Lessons from Live Score Platforms](https://thefinch.design/sports-app-ux-design-cricket-fantasy-live-score-platforms/)
- [Design patterns for sports apps and live event platforms — Ably](https://ably.com/blog/design-patterns-sports-live-events)

---

## 3. Auditoria completa de rotas e funcionalidades

### 3.1 Rotas de URL (SPA, roteamento manual em `App.tsx`)

O app **não usa react-router**. O roteamento é feito por `window.location.pathname` + estado.

| Rota | Handler | Autenticada | Observação |
| --- | --- | --- | --- |
| `/` | `currentRoute = 'landing'` | não | Landing pública |
| `/login` | `currentRoute = 'login'` | não | Também aceita `/registro`, `/register` |
| `/dashboard` | `currentRoute = 'login'` → app | sim | Shell da plataforma; view interna via `activeTab` |
| `/dashboard/assistente` | idem + `assistantOpen = true` | sim | Deep-link do assistente |
| `/scout-realtime` | `RealtimeScoutPage` | sim | **Rota de coleta.** Isolada: `popstate` é interceptado para impedir voltar (`RealtimeScoutPage.tsx:101`) |
| `/blog`, `/blog/:lang`, `/blog/:lang/:slug` | `currentRoute = 'blog'` | não | Blog público multi-idioma |
| `/auth/:action` | `matchAuthEmailPath()` | não | Ações por e-mail (reset de senha, link mágico) |

**Query params relevantes:**

| Param | Valores | Efeito |
| --- | --- | --- |
| `?coleta=` | `shell` \| `atual` \| `nao-informado` | Escolhe a experiência de coleta (`utils/collectionExperience.ts`) |
| `?experiencia=` | idem | Ativa **e persiste** em `localStorage.SCOUT_COLLECTION_EXPERIENCE` |
| `?token=` | JWT | Ações de e-mail |

**Achado 1 — a flag não sobrevive à navegação inteira.** `withCollectionExperience()` propaga `?coleta=` só onde é chamada explicitamente. A persistência em `localStorage` cobre o gap, mas cria um estado invisível: o operador pode estar no Shell sem que a URL diga isso. **Na V2 a flag precisa aparecer no `Command Bar`.**

### 3.2 Views internas do dashboard (`activeTab`)

| Grupo | Views |
| --- | --- |
| Geral | `dashboard` (Visão Geral) |
| Gestão de Equipe | `team` (Elenco), `schedule` (Programação), `championship` (Tabela de Campeonato), `management-report` (Relatório gerencial) |
| **Performance** | **`table` (Dados do Jogo ← entrada da coleta)**, `general` (Scout Coletivo), `individual` (Scout Individual), `ranking`, `quarteto` (Quarteto Alta Performance) |
| Fisiologia | `physical`, `athletes-physio`, `pse`, `psr`, `wellness`, `assessment`, `academia` |
| Outros | `video`, `admin`, `settings`, `blog` |
| Atleta (role `Atleta`) | `athlete-home`, `athlete-pse`, `athlete-psr`, `athlete-wellness`, `athlete-profile` |

### 3.3 O funil de coleta ponta a ponta (verificado em execução, 29/07/2026)

```
/dashboard  →  activeTab='table'  (Dados do Jogo)
                    │
                    ├─ Calendário de jogos, filtro por data
                    │  Badges: DISPONÍVEL · INCOMPLETO · FINALIZADO
                    ▼
              CollectionTypeSelector           "Tipo de Coleta"
                    ├─ 'realtime'  → Scout em Tempo Real
                    └─ 'postmatch' → Adicionar Dados da Partida (planilha)
                    ▼
              Preparação da Partida
                    ├─ tabs Goleiros / Atletas de linha
                    ├─ "Selecionar todos"
                    ├─ badges: suspenso (vermelho), lesão (laranja), pendurado (amarelo)
                    └─ "Iniciar Scout (abre em nova aba)"
                    ▼
              ScoutTable.openRealtimeScout()
                    ├─ localStorage.setItem('realtimeScoutData', …)
                    └─ window.location.assign('/scout-realtime' + search)
                    ▼
              /scout-realtime  →  RealtimeScoutPage
                    ├─ lê localStorage.realtimeScoutData
                    ├─ GET /api/matches/:id  (reidrata coleta incompleta)
                    └─ MatchScoutingWindow
                    ▼
              Modal ESCALAÇÃO INICIAL
                    ├─ 5 em quadra (1 goleiro + 4 linha) · banco
                    └─ "Quem começou com a bola?" (us | them)
                    ▼
              COLETA  ──►  ?coleta=shell → CollectionShellExperimental
                       └►  default        → grid do MatchScoutingWindow
                    ▼
              Finalizar coleta | Salvar como incompleta
                    ├─ PUT /api/matches/:id  (autosave + manual)
                    └─ exitRealtimeScout() → window.close() ou /dashboard
```

**Achado 2 — 4 telas antes do primeiro evento.** O `UX_BACKLOG.md` já marca isso como P1 ("Preparação longa antes do primeiro evento — valor demora a aparecer"). A V2 precisa de um caminho rápido: reabrir uma coleta incompleta deve cair direto na coleta, sem repetir escalação.

**Achado 3 — o transporte de dados é `localStorage`, não URL.** `openRealtimeScout` grava em `localStorage.realtimeScoutData` e navega. Consequência: **abrir `/scout-realtime` direto não funciona**, e dois jogos não podem ser coletados em paralelo em duas abas. É uma limitação real, fora do escopo desta V2, mas precisa estar documentada.

**Achado 4 — `RealtimeScoutPage` está marcado como legado.** O comentário em `RealtimeScoutPage.tsx:9-11` diz: *"Recurso legado: tempo real está isolado/desativado na UI principal."* Mas é exatamente o caminho que a coleta usa hoje. **Comentário obsoleto — remover na 004D** para não induzir ninguém ao erro.

### 3.4 Rotas de API consumidas pela coleta

| Método | Rota | Middleware | Uso na coleta |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | — | Autenticação (retorna JWT em `localStorage.token`) |
| `GET` | `/api/matches` | `auth` + `tenant` + `requireStaff` | Calendário de jogos |
| `GET` | `/api/matches/:id` | idem | Reidratar coleta incompleta |
| `PUT` | `/api/matches/:id` | idem | **Autosave + save manual** (único write da coleta) |
| `POST` | `/api/matches` | idem | Criar partida avulsa |
| `DELETE` | `/api/matches/:id` | idem | Excluir partida do calendário |
| `GET` | `/api/players` | idem | Elenco para escalação |
| `GET` | `/api/teams` | idem | Nome da equipe |
| `GET` | `/api/time-controls` | idem | Controle de tempo/minutagem |
| `GET` | `/api/championship-matches` | idem | Vínculo com campeonato |

Demais rotas do backend (`/api/assistant`, `/api/telegram`, `/api/wellness`, `/api/assessments`, `/api/stat-targets`, `/api/competitions`, `/api/schedules`, `/api/championships`, `/api/me`, `/api/web-assistant`, `/api/leads`) **não participam da coleta**. A V2 não toca em nenhuma.

**Achado 5 — a coleta inteira é um único `PUT`.** Todo o `postMatchEventLog` vai num payload só, a cada autosave. Verificado na aba de rede: dezenas de `PUT /api/matches/:id` sequenciais durante uma sessão curta.

Implicações:
- **Risco de perda:** falha de rede no meio de um jogo perde o delta desde o último save bem-sucedido.
- **Risco de corrida:** duas abas na mesma partida = último `PUT` ganha, silenciosamente.
- **Custo:** payload cresce linearmente com os eventos. Um jogo de 200 eventos reenvia 200 eventos a cada autosave.

**Não vamos consertar isso na V2** (violaria o invariante "sem API própria"), mas a V2 **precisa** de fila offline no cliente (§8.6) e a dívida fica registrada aqui para uma sprint de backend própria.

---

## 4. Diagnóstico do gap real

### 4.1 Correção de rota importante

Uma leitura ingênua do `types.ts:167` (`PostMatchAction`, 20 ações) diria "faltam 19 ações no Shell". **Isso levaria a construir o produto errado.**

A `EVENT_MATRIX_V2.md` (Sprint 004B) já classificou tudo em Classe A/B/C/D e **decidiu explicitamente**:

> *"`Passe` não deve permanecer como evento principal no realtime."*

Motivo: frequência muito alta, custo operacional excessivo, baixo valor imediato para um único scout, compete com lances mais importantes.

**Confirmação empírica (§5):** em 2 jogos completos coletados com a UI atual — que **oferece** o botão de passe — foram registrados **zero passes**. A decisão da 004B está validada pelos dados.

> ⚠️ Qualquer plano que peça "adicionar Passe ao Shell realtime" contradiz a Sprint 004B e os dados. Passe entra **só** em `mode='postmatch'`.

### 4.2 Cobertura por classe

#### Classe A — obrigatório ao vivo · **0 de 9 no Shell**

| Evento | Handler de domínio | Complexidade |
| --- | --- | --- |
| Gol nosso | `handleRegisterGoal()` :2951 | Composto: equipe → autor → método → assistência |
| Gol adversário | `handleRegisterGoal(_, true, …)` :2951 | Composto: equipe → origem opcional |
| Cartão nosso / adversário | `handleRegisterCard()` :3266 | Médio: equipe → atleta → tipo |
| Expulsão | `handleRegisterCard('red' \| 'secondYellow')` | Deriva de cartão |
| Pênalti | `handleRegisterPenalty()` :3146 | Composto: equipe → resultado → cobrador |
| Tiro livre | `handleRegisterFreeKick()` :3089 | Composto: equipe → resultado → cobrador |
| Falta acumulada | `handleRegisterFoul()` :2720 | Simples: equipe → atleta se nosso |
| Substituição | **não existe handler compartilhável** | Médio — exige extração |
| Tempo técnico | **não existe evento** | Baixo — decidir se persiste |

#### Classe B — prioritário ao vivo · **1 de 8 no Shell**

| Evento | Handler | Shell |
| --- | --- | --- |
| Finalização no gol / fora / bloqueada | `handleRegisterShot()` :2837 | ✅ |
| Finalização **na trave** (`post`) | `handleRegisterShot('post')` | ❌ **existe no domínio, ausente na UI do Shell — e é 33% das finalizações reais** |
| Defesa de goleiro | `handleRegisterSave()` :2634 | ❌ |
| Desarme | `handleRegisterTackle()` :2592 | ❌ |
| Bloqueio | `handleRegisterBlock()` :2685 | ❌ |
| Escanteio | `handleRegisterCorner()` :2881 | ❌ |
| Perda de posse | **não existe em lugar nenhum** | ❌ evento novo da matriz |
| Recuperação de posse | **não existe em lugar nenhum** | ❌ evento novo da matriz |

#### Classe C — pós-jogo · enriquecimento
`zone`, assistência avulsa, passe-chave, lateral detalhado. Não bloqueiam o realtime.

#### Classe D — **não construir ao vivo**
`passCorrect`, `passWrong`, `passTransicao`, `passProgressao`, condução/microação.

### 4.3 Campos do contrato que faltam na inserção

Comparando `PostMatchEvent` (`types.ts:189`) com o que o Shell produz hoje:

| Campo | Alimenta | Shell | Classe | Sprint |
| --- | --- | :---: | --- | --- |
| `playerId`, `time`, `period`, `action`, `tipo`, `subtipo`, `result` | tudo | ✅ | — | — |
| `assistPlayerId` / `assistPlayerName` | rede de conexões, quartetos | ❌ | A | 004E |
| `goalMethod` | análise por origem de jogada | ❌ | A | 004E |
| `isOpponentGoal` | placar, gols sofridos | ❌ | A | 004E |
| `foulTeam` (`for`/`against`) | faltas acumuladas, 6ª falta | ❌ | A | 004D |
| `cardType` / `cardTeam` | disciplina, disponibilidade | ❌ | A | 004E |
| `isForUs` | bola parada (pênalti/tiro livre) | ❌ | A | 004E |
| `zone` | mapa de calor | ❌ | C | 004F |
| `passToPlayerId` / `passToPlayerName` | grafo de passes | ❌ | C/D | 004F (postmatch) |
| `wrongPassGeneratedTransition` | gráfico Erros Críticos | ❌ | C/D | 004F (postmatch) |
| `recordedByUserId` / `recordedByName` | **auditoria** | ❌ | transversal | **004D** |

### 4.4 Operação de jogo ausente

| Lacuna | Onde vive hoje | Sprint |
| --- | --- | --- |
| Substituição em quadra | acoplada ao painel esquerdo (`MatchScoutingWindow.tsx:4107+`) | 004E |
| Desfazer último evento | só via Logs → localizar → Excluir | **004D** (é parte do layout) |
| Editar timestamp no realtime | `manualTime` só é passado quando `mode='postmatch'` (`:4086`) | 004F |
| Finalização na trave | resultado existe, UI não | **004D** |
| Guard de `hasUnsavedChanges` ao fechar | prop existe, guard não | 004D |

---

## 5. Dados: frequência real de eventos

Consulta em 29/07/2026 via `GET /api/matches/:id` nos 2 jogos com `status = encerrado`. **n = 13 eventos.** Amostra pequena — sinal preliminar, não decisão fechada.

### 5.1 Distribuição

| Ação | n | % | Sprint |
| --- | --: | --: | --- |
| Finalização (`shotOn`/`shotOff`/`shotZonaChute`) | 6 | 46% | 004D |
| Gol (`goal`) | 4 | 31% | 004E |
| Desarme (`tackleWithBall`) | 2 | 15% | 004D |
| Falta (`falta`) | 1 | 8% | 004D |
| Passe, Cartão, Defesa, Escanteio, Bloqueio, Pênalti/TL, Substituição, Posse | 0 | — | — |

### 5.2 Quatro achados que mudam o design

1. **Trave é 33% das finalizações** (2 de 6). Não é canto obscuro do domínio — é uso real e frequente. Prioridade máxima da 004D.
2. **75% dos gols vieram de bola parada** (Escanteio, Laterais, Tiro Livre) contra 25% "Ataque". O menu de `goalMethod` **não pode nascer só com Ataque/Contra-ataque** — bola parada precisa estar no topo. E justifica os presets (§8.3).
3. **`shotZonaChute` com subtipo "Bloqueado"** apareceu — ação distinta do `block` puro, e o Shell não cobre nenhuma das duas.
4. **Zero passes** com o botão disponível. Validação empírica da decisão da 004B.

### 5.3 Limitações honestas da amostra

- Nenhum gol adversário, nenhum gol contra → **não valida** a UI de evento de equipe.
- Nenhuma substituição, nenhum cartão → são Classe A **por regra**, não por frequência. Precisam existir mesmo sem aparecer aqui.
- 2 jogos são jogos de teste QA, não jogos reais de competição. A distribuição real pode diferir.

**Ação obrigatória:** re-rodar essa consulta em cada `SPRINT_<id>_REPORT.md`. Se em 10+ jogos a distribuição mudar, reordenar o Action Deck antes da 004J.

---

## 6. Princípios de design e North Star

### 6.1 North Star

> **TTE — Time To Event:** ms entre a intenção do operador e o evento registrado, com os olhos de volta na quadra.

Métricas de apoio:

| Métrica | Definição | Alvo V2 |
| --- | --- | --- |
| `TTE p50` | mediana do tempo do 1º toque ao registro | ≤ 1.200 ms |
| `TTE p95` | cauda — eventos compostos | ≤ 3.000 ms |
| `taps/evento` | toques por evento registrado | ≤ 2,4 (média ponderada por frequência) |
| `eyes-off-court` | proxy: tempo entre 1º e último toque do fluxo | ≤ 1.500 ms p50 |
| `cancel rate` | fluxos abandonados / iniciados | ≤ 5% |
| `undo rate` | eventos desfeitos / registrados | ≤ 3% |
| `eventos/min` | throughput | ≥ baseline do fluxo atual |

### 6.2 Os sete princípios

1. **Uma decisão por tela.** O Stage mostra o passo corrente e nada mais. Progressive disclosure, não densidade.
2. **Contexto nunca se move.** Tempo, placar, faltas, período: sempre no mesmo pixel. O operador aprende a posição e para de procurar.
3. **Desfazer, não confirmar.** Revisão custa atenção em 100% dos eventos; desfazer custa em ~3%. Registra otimista, oferece desfazer.
4. **Confirmação sem olhar.** Haptic + tick sonoro. O operador levanta a cabeça antes do evento terminar de gravar.
5. **Polegar manda.** Toda ação primária na metade inferior. O topo é para ler, não tocar.
6. **Zero navegação durante o jogo.** Nenhum modal, nenhuma tela cheia, nenhuma troca de contexto nos 40 minutos.
7. **Menos passos por dado, não menos dados.** A resposta para "coletar mais" é clustering e auto-advance, nunca formulário mais longo.

### 6.3 Anti-princípios — o que recusamos explicitamente

| Recusado | Por quê |
| --- | --- |
| Mini-quadra para posição x/y ao vivo | `UX_BACKLOG.md` já adiou; custo de precisão ao vivo é altíssimo. Fica no pós-jogo. |
| Passe genérico ao vivo | Classe D + zero uso real (§5). |
| Tela de logs em full-screen como centro da operação | `UX_BACKLOG.md` P1: "rouba área operacional". Vira a Timeline Strip. |
| Onboarding/tour dentro da coleta | O operador está num jogo. Ajuda vive fora. |
| Animação decorativa | Todo ms de animação é ms de atenção. Só motion funcional (§8.5). |

---

## 7. O novo layout — Deck & Rail

### 7.1 Arquitetura de zonas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ①  COMMAND BAR                                            56px · fixo · ler │
│ ⏱ 12:34  2T ● AO VIVO   │  NOSSO 2 × 1 ADV  │  FALTAS 3│2  │  ⌨ ⚙ ☰       │
├────────────┬─────────────────────────────────────────────────────────────────┤
│ ②  RAIL    │ ③  STAGE                                                       │
│  120px     │                                                                │
│  fixo      │    Área única de decisão. Mostra o passo corrente.             │
│            │    Vazia (IDLE) = último evento + contexto tático.             │
│ ┌────────┐ │                                                                │
│ │  #1 GK │ │    ┌─────────────────────────────────────────────────┐        │
│ │ MARCOS │ │    │  QUAL O RESULTADO?                              │        │
│ └────────┘ │    │  ┌──────────┬──────────┬──────────┬──────────┐ │        │
│ ┌────────┐ │    │  │  NO GOL  │  TRAVE   │  PRA     │ BLOQUE-  │ │        │
│ │  #7    │◄┼────┤  │          │          │  FORA    │  ADA     │ │        │
│ │ LUCAS  │ │STICKY └──────────┴──────────┴──────────┴──────────┘ │        │
│ │ ●●○○○  │ │    │                                    ↩ Voltar     │        │
│ └────────┘ │    └─────────────────────────────────────────────────┘        │
│ ┌────────┐ │                                                                │
│ │  #10   │ │                                                                │
│ │ PEDRO  │ │                                                                │
│ └────────┘ │                                                                │
│  … 5 total │                                                                │
│ ┌────────┐ │                                                                │
│ │ BANCO 2│ │                                                                │
│ └────────┘ │                                                                │
├────────────┴─────────────────────────────────────────────────────────────────┤
│ ④  ACTION DECK                                       ~180px · fixo · polegar│
│  ┌───────────┬───────────┬───────────┬───────────┐                          │
│  │    GOL    │FINALIZAÇÃO│   FALTA   │  DESARME  │  ← primários (frequência)│
│  │     G     │     F     │     L     │     D     │     long-press = presets │
│  └───────────┴───────────┴───────────┴───────────┘                          │
│  [Defesa E] [Escanteio C] [Cartão K] [Subst. S] [Bloqueio B] [＋ Mais]     │
├──────────────────────────────────────────────────────────────────────────────┤
│ ⑤  TIMELINE STRIP                                              48px · fixo  │
│ 12:31 #7 Final. no gol ↶ │ 11:58 #10 Desarme │ 10:04 #7 GOL escanteio │ →   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Especificação por zona

#### ① Command Bar — 56px, topo, **somente leitura**

Ocupa deliberadamente a zona vermelha do polegar: aqui não se toca.

| Slot | Conteúdo | Comportamento |
| --- | --- | --- |
| Relógio | `MM:SS` + período + estado | Tabular numbers. Estado com cor **e** ícone: `● AO VIVO` verde pulsante, `⏸ PAUSADO` âmbar, `⏱ PRÉ-JOGO` cinza, `⚠ SINCRONIZAR` vermelho |
| Placar | `NOSSO n × n ADV` | Nome real da equipe, truncado. Muda de escala 1.15× por 300ms ao alterar |
| Faltas | `FALTAS 3│2` | **5 faltas = badge âmbar; 6ª = badge vermelho pulsante** (regra do futsal: 6ª falta = tiro livre sem barreira) |
| Persistência | `☁ salvo 12s` / `⟳ salvando` / `⚠ 3 na fila` | Estado do autosave — visível sempre, nunca em toast |
| Experiência | `SHELL V2` | **Corrige o Achado 1:** a experiência ativa fica visível |
| Ações | `⌨` atalhos · `⚙` config · `☰` menu | Alvos de 44px, canto direito. Fora do fluxo. |

Regras:
- **Nunca** ocupada por alerta. Alertas vão para o Stage ou para um slot dedicado abaixo dela.
- **Nunca** muda de altura. Layout shift no topo desorienta.

#### ② Athlete Rail — 120px, esquerda, **seleção sticky**

A aposta central do layout. Com 5 atletas, a lista cabe inteira e permanente.

```
┌──────────────┐
│ #7           │  ← número: 20px, peso 900 (identificação primária)
│ LUCAS        │  ← nome/apelido: 11px, truncado
│ ALA          │  ← posição: 9px, uppercase, zinc-500
│ ●●○○○  4'    │  ← micro-stat: eventos no período · minutos em quadra
└──────────────┘
```

| Estado | Visual |
| --- | --- |
| Idle | borda `zinc-800`, fundo `zinc-950` |
| **Selecionado (sticky)** | borda `cyan-400` 2px + glow + faixa lateral cyan 4px |
| Goleiro | ícone de luva + borda inferior cyan sutil |
| Advertido (pendurado) | canto superior direito âmbar |
| Suspenso / lesionado | opacidade 40% + ícone; **não selecionável** |
| Sugerido | pulso 1× quando o fluxo requer atleta e nenhum está sticky |

**Comportamento sticky — o núcleo da economia de taps:**

1. Tocar um atleta o torna selecionado **e ele permanece** selecionado.
2. Com atleta sticky, o passo `ATHLETE` de qualquer spec é **pulado automaticamente**.
3. O sticky **não expira por tempo** (expirar geraria erro silencioso de atribuição).
4. O sticky é **limpo** em: substituição do atleta, virada de período, ou toque no atleta já selecionado (toggle).
5. `Shift`-tocar outro atleta durante um fluxo troca o alvo sem recomeçar.

**Banco de reservas:** card compacto `BANCO n` no pé do Rail. Toque expande em sheet inferior. Só aparece expandido durante o fluxo de substituição.

**Adaptação por viewport:** abaixo de 1024px de largura o Rail migra da esquerda para uma faixa horizontal **acima** do Action Deck — mantendo tudo em zona verde de polegar.

#### ③ Stage — flex, centro, **uma decisão**

Estados:

| Estado | Conteúdo |
| --- | --- |
| `IDLE` | Último evento registrado (grande, com desfazer), + contexto: posse %, sequência recente, próximo alerta tático |
| `STEP` | Título do passo (`"Qual o resultado?"`) + grid de opções + `↩ Voltar` + `✕ Cancelar` |
| `CONFIRMING` | Skeleton de 200ms com o resumo. Não pede clique. |
| `SUCCESS` | Check + resumo por 900ms, então volta a `IDLE` |
| `BLOCKED` | Motivo explícito + ação de destravar (ex.: "Inicie a partida" + botão Iniciar) |

Regras de grid de opções:
- **≤ 4 opções:** uma linha, botões grandes (min 96px de altura)
- **5–8 opções:** duas linhas
- **> 8 opções:** agrupar. Se não der para agrupar, a spec está errada — revisar o microfluxo.

Toda opção carrega **label + helper**. Ex.: `TRAVE` / *"Na trave, sem gol"*. Sem ícone-só.

#### ④ Action Deck — ~180px, base, **zona de polegar**

| Fila | Conteúdo | Tamanho do alvo |
| --- | --- | --- |
| Primária | 4 eventos mais frequentes, ordenados pelos dados de §5 | ≥ 96×72px |
| Secundária | 5–6 eventos Classe A/B restantes | ≥ 72×56px |
| Overflow | `＋ Mais` → sheet com o resto | 72×56px |

Cada botão traz:
- Label (`GOL`)
- Tecla de atalho num badge (`G`) — ensina o atalho pelo uso
- Cor semântica da família do evento (§10.3)
- **Long-press (400ms) → presets** (§8.3), sinalizado por um ponto no canto

Ordem primária inicial, conforme §5.1: `GOL · FINALIZAÇÃO · FALTA · DESARME`.

#### ⑤ Timeline Strip — 48px, base, **desfazer e confiança**

Substitui a tela de Logs em full-screen (P1 do `UX_BACKLOG.md`).

- Últimos 5 eventos, mais recente à esquerda, scroll horizontal.
- Cada chip: `MM:SS · #7 · Finalização no gol`.
- O mais recente tem **`↶` de desfazer visível por 30s**, depois esmaece.
- Toque num chip antigo → sheet de edição/exclusão (usa o caminho oficial já existente).
- `→` no fim abre o log completo (a tela atual, preservada).

### 7.3 Modos

| Modo | Quando | Diferenças |
| --- | --- | --- |
| **LIVE** | `mode='realtime'`, relógio rodando | Deck completo, auto-advance ligado, passos opcionais **pulados por padrão**, sem passo de tempo |
| **REVIEW** | `mode='postmatch'` | Passo de tempo manual obrigatório, passos opcionais **exibidos por padrão**, Passe e zona habilitados, sem pressão de relógio |
| **RECOVERY** | reabertura de coleta incompleta | Entra direto na coleta sem repetir escalação (**corrige o Achado 2**), banner "retomando de 12:34" |

### 7.4 Responsividade

| Viewport | Layout |
| --- | --- |
| ≥ 1600px | Rail esquerda · Stage largo · Deck 2 filas · Strip completa |
| 1280–1599px | idem, Stage mais estreito, helpers de opção truncados |
| 1024–1279px | Rail vira faixa horizontal acima do Deck; Strip mostra 3 chips |
| < 1024px | **Modo degradado documentado.** Rail horizontal rolável, Deck 1 fila + overflow. Aviso de "viewport abaixo do recomendado" na abertura. |
| Tablet retrato | Não suportado nesta versão. Bloquear com orientação sugerida. |

Baseline vem da Sprint 004C.1A: 1280×800 é o mínimo confiável, 1024×768 é limite diagnóstico.

### 7.5 Acessibilidade operacional

Condições reais: ginásio, luz irregular, adrenaline, às vezes luva.

| Requisito | Especificação |
| --- | --- |
| Contraste | ≥ 4.5:1 para texto, ≥ 3:1 para bordas de estado |
| Alvo de toque | ≥ 56px na altura menor para ações de fluxo; ≥ 44px para utilitários |
| Estado sem cor | Todo estado tem ícone **ou** texto além da cor |
| Foco visível | Anel de 2px cyan, nunca `outline: none` |
| Teclado | Fluxo inteiro operável sem mouse (§8.4) |
| Leitor de tela | `aria-live="polite"` no Stage anuncia o passo; `aria-live="assertive"` no registro |
| Redução de movimento | `prefers-reduced-motion` desliga pulso e escala, mantém mudança de cor |

---

## 8. Modelo de interação

### 8.1 O fluxo canônico

```
Estado sticky: atleta #7 selecionado

  Operador toca  FINALIZAÇÃO
        │
        ├─ spec 'shot': steps = [ATHLETE, RESULT]
        ├─ ATHLETE → pulado (sticky = #7)              ← economia de 1 tap
        ▼
  Stage: "Qual o resultado?"  [No gol] [Trave] [Pra fora] [Bloqueada]
        │
  Operador toca  TRAVE
        │
        ├─ último passo → auto-confirma                ← economia de 1 tap
        ├─ haptic tick + som curto                     ← confirmação sem olhar
        ├─ registerSharedEvent({ action:'shot', playerId:'#7', result:'post' })
        ├─ Timeline Strip recebe o chip com ↶ por 30s
        ▼
  Stage volta a IDLE em 900ms

  TOTAL: 2 taps · TTE estimado ~900ms · olhos na quadra depois do 2º tap
```

### 8.2 Auto-advance — adaptado do *tolerance* do Nacsport

Três regras, aplicadas em ordem:

1. **Passo com 1 opção válida é pulado** e o valor é aplicado automaticamente.
2. **Passo cujo `skipWhen(draft)` retorna true é pulado.**
3. **Último passo auto-confirma** — sem tela de revisão.

Isso responde a pergunta aberta da Sprint 004C.1A (*"medir se a etapa de confirmação compensa em campo"*): **em LIVE, não compensa.** A reversibilidade vem do desfazer de 30s, que custa atenção só quando há erro.

Exceção: eventos com `requiresExplicitConfirm: true` na spec mantêm o passo `REVIEW`. Candidatos: **Expulsão** (irreversível em campo) e **Substituição** (afeta quem pode receber eventos depois).

### 8.3 Presets — adaptado dos *clustered buttons* do Nacsport

Long-press (400ms) num botão do Deck abre um sheet com combinações pré-montadas. Um toque grava a cadeia inteira.

Presets iniciais, derivados de §5.2 (75% dos gols são bola parada):

| Botão | Presets |
| --- | --- |
| `GOL` | Gol de escanteio · Gol de tiro livre · Gol de lateral · Gol de contra-ataque · Gol contra |
| `FINALIZAÇÃO` | Finalização na trave · Finalização bloqueada |
| `FALTA` | 6ª falta nossa · 6ª falta adversária |
| `CARTÃO` | Amarelo nosso · Amarelo adversário |

Regras:
- Preset **nunca** é o único caminho. O fluxo passo a passo sempre existe.
- Preset é configurável por equipe numa sprint futura, **não** na V2.
- Preset grava exatamente o mesmo payload que o fluxo manual. Verificado pelo teste de equivalência (§13).

### 8.4 Camada de teclado

Para operadores em notebook — que a Sprint 004C.1A identificou como viewport principal.

| Tecla | Ação |
| --- | --- |
| `1`–`5` | Seleciona atleta em quadra (sticky) |
| `6`–`9` | Seleciona reserva |
| `G` | Gol |
| `F` | Finalização |
| `L` | Falta |
| `D` | Desarme |
| `E` | Defesa |
| `C` | Escanteio |
| `K` | Cartão |
| `S` | Substituição |
| `B` | Bloqueio |
| `1`–`4` *(dentro de um passo)* | Escolhe a n-ésima opção |
| `Enter` | Confirma (quando há `REVIEW`) |
| `Esc` | Volta um passo; dois `Esc` cancelam |
| `Cmd/Ctrl + Z` | Desfaz último evento |
| `Space` | Pausa/retoma relógio |
| `?` | Overlay de atalhos |

Conflito resolvido: dígitos selecionam **atleta** em `IDLE` e **opção** dentro de um passo. O overlay `?` explica.

### 8.5 Motion — só funcional

| Evento | Animação | Duração |
| --- | --- | --- |
| Troca de passo no Stage | fade + slide 8px | 140ms `ease-out` |
| Registro confirmado | check escala 0.8→1 | 200ms `ease-out` |
| Chip novo na Timeline | slide-in da esquerda | 180ms |
| Placar alterado | escala 1→1.15→1 | 300ms |
| 6ª falta | pulso da badge | 1s, 3× |
| Atleta sugerido | pulso da borda | 600ms, 1× |

Tudo desligado sob `prefers-reduced-motion`. **Nenhuma animação bloqueia input** — o operador pode tocar durante qualquer transição.

### 8.6 Resiliência — arena tem wifi ruim

Não muda a API (invariante), muda o cliente:

1. **Fila local.** Todo evento vai primeiro para uma fila em `localStorage`, depois entra no ciclo de autosave existente.
2. **Estado de persistência visível.** `☁ salvo 12s` / `⟳ salvando` / `⚠ 3 na fila` no Command Bar. Nunca toast — toast desaparece e o operador não vê.
3. **Backoff exponencial** nas retentativas, sem travar a UI.
4. **Aviso de saída.** `beforeunload` quando a fila não está vazia — **corrige a lacuna do guard de `hasUnsavedChanges`**.
5. **Retomada.** Ao reabrir, se a fila local tem mais eventos que o servidor, o Stage mostra um banner de reconciliação.

---

## 9. Arquitetura técnica

### 9.1 Invariantes — violar qualquer um invalida a entrega

1. O Shell **não** faz `fetch`. Nenhum acesso a API.
2. O Shell **não** monta objeto `MatchEvent`. Quem monta é `MatchScoutingWindow`.
3. O Shell **não** calcula tempo. `getOfficialEventStamp()` / `eventTimeAndPeriod()` seguem no domínio.
4. O Shell **não** salva. `onSave` → `handleSaveLater` existente.
5. Comportamento de relógio vem **sempre** de `getMatchClockEventRule()` (`utils/matchClockEventRules.ts`). Nunca regra nova no Shell.
6. Fluxo atual permanece default. Ativação só por `?coleta=shell`.
7. Rollback trivial: remover a flag volta ao estado anterior, sem migração.
8. Suíte Playwright verde (hoje 15/15).

### 9.2 A porta única de domínio

Hoje existe **uma** porta: `registerSharedFinalization()` (`MatchScoutingWindow.tsx:2866`).

Descoberta importante: `executeActionFlow()` (`:1127`) **já é um dispatcher genérico** que roteia `pass | shot | foul | tackle | card | save | lateral | corner | block`. Não precisamos de handler novo — precisamos generalizar a porta.

```ts
// MatchScoutingWindow.tsx
export interface SharedEventInput {
  action: MatchEvent['type'] | 'substitution' | 'possessionLost' | 'possessionWon';
  playerId?: string;              // ausente ⇒ TEAM_EVENT_FAKE_PLAYER_ID (:197)
  secondaryPlayerId?: string;     // assistência · quem entra na substituição
  result?: MatchEvent['result'];
  team?: 'for' | 'against';
  cardType?: 'yellow' | 'secondYellow' | 'red';
  goalMethod?: string;
  zone?: LateralResult;
  timeOverride?: number;
  periodOverride?: '1T' | '2T';
  recordedByUserId?: string;
  recordedByName?: string;
}

const registerSharedEvent = (input: SharedEventInput) => {
  // switch → handlers JÁ EXISTENTES. Nenhum handler é modificado.
};

// mantido como wrapper fino, para o e2e atual continuar verde sem alteração
const registerSharedFinalization = (i: { playerId: string; result: … }) =>
  registerSharedEvent({ action: 'shot', ...i });
```

Handlers de destino, todos já implementados:

| `action` | Handler | Linha |
| --- | --- | --- |
| `shot` | `handleRegisterShot` | 2837 |
| `goal` | `handleRegisterGoal` | 2951 |
| `foul` | `handleRegisterFoul` | 2720 |
| `tackle` | `handleRegisterTackle` | 2592 |
| `save` | `handleRegisterSave` | 2634 |
| `block` | `handleRegisterBlock` | 2685 |
| `corner` | `handleRegisterCorner` | 2881 |
| `lateral` | `handleRegisterLateral` | 2908 |
| `card` | `handleRegisterCard` | 3266 |
| `freeKick` | `handleRegisterFreeKick` | 3089 |
| `penalty` | `handleRegisterPenalty` | 3146 |
| `substitution` | **extrair na 004E** | — |
| `possessionLost` / `possessionWon` | **não existem** | — |

### 9.3 O motor declarativo

**O problema que evitamos:** hoje o Shell tem uma máquina de estados **fixa para um evento** (`ShellStep` = 6 valores). Se cada evento novo virar um `ShellStep` + uma prop + um bloco JSX, aos 15 eventos o componente vira o monólito de 3.000 linhas que o Shell nasceu para resolver.

```ts
// components/collection-shell/types.ts

export type ShellStepKind =
  | 'TEAM'               // nosso · adversário
  | 'ATHLETE'            // atleta principal (pulado se sticky)
  | 'SECONDARY_ATHLETE'  // assistente · quem entra
  | 'CHOICE'             // resultado · tipo de cartão · método do gol
  | 'ZONE'               // AT_ESQ · AT_DIR · DF_ESQ · DF_DIR
  | 'TIME'               // só REVIEW/postmatch
  | 'REVIEW';            // só quando requiresExplicitConfirm

export interface ShellChoiceOption {
  value: string;
  label: string;          // "TRAVE"
  helper?: string;        // "Na trave, sem gol"
  shortcut?: string;      // "2"
  tone?: SemanticTone;
}

export interface ShellFlowStep {
  id: string;
  kind: ShellStepKind;
  label: string;                                   // "Qual o resultado?"
  optional?: boolean;
  options?: ShellChoiceOption[];                   // só CHOICE
  skipWhen?: (draft: ShellEventDraft) => boolean;  // activation link
  disabledWhen?: (draft: ShellEventDraft) => boolean;
}

export interface ShellEventPreset {
  id: string;
  label: string;                                   // "Gol de escanteio"
  patch: Partial<ShellEventDraft>;                 // clustered button
}

export interface ShellEventSpec {
  id: string;                                      // 'shot' | 'goal' | …
  label: string;                                   // "Finalização"
  shortcut: string;                                // "F"
  classe: 'A' | 'B';
  tier: 'primary' | 'secondary' | 'overflow';
  modes: Array<'realtime' | 'postmatch'>;
  tone: SemanticTone;
  requiresExplicitConfirm?: boolean;
  steps: ShellFlowStep[];
  presets?: ShellEventPreset[];
  toDomainInput: (draft: ShellEventDraft) => SharedEventInput;
}
```

**Critério de sucesso não-negociável:** adicionar o 16º evento custa **uma entrada em `eventSpecs.ts` e zero JSX novo**. Se exigir JSX, o motor está errado.

### 9.4 Componentes

| Arquivo | Status | Responsabilidade |
| --- | --- | --- |
| `collection-shell/eventSpecs.ts` | **novo** | As ~15 specs. Único lugar que conhece eventos específicos. |
| `collection-shell/ShellCommandBar.tsx` | **novo** (absorve `ShellOperationalHeader`) | Zona ① |
| `collection-shell/ShellAthleteRail.tsx` | **novo** | Zona ② + lógica sticky |
| `collection-shell/ShellStage.tsx` | **novo** (generaliza `ShellFinalizationFlow`) | Zona ③ — renderizador genérico, **zero `if (evento === …)`** |
| `collection-shell/ShellActionDeck.tsx` | **novo** | Zona ④ + long-press de presets |
| `collection-shell/ShellTimelineStrip.tsx` | **novo** (generaliza `ShellRecentEvents`) | Zona ⑤ + desfazer |
| `collection-shell/useShellFlow.ts` | **novo** | Máquina de estados dirigida por spec + auto-advance |
| `collection-shell/useShellShortcuts.ts` | **novo** | Camada de teclado |
| `collection-shell/useShellFeedback.ts` | **novo** | Haptic + áudio |
| `collection-shell/types.ts` | **estende** | Tipos acima |
| `CollectionShellExperimental.tsx` | **reescreve** | Composição das 5 zonas + métricas |
| `ShellStatusPanel.tsx` | **absorvido** | Conteúdo migra para Command Bar e Stage IDLE |
| `MatchScoutingWindow.tsx` | **diff mínimo** | Só: `registerSharedEvent` + props do Shell. **Nenhum `handleRegister*` tocado.** |

### 9.5 Fronteira de dados

```
MatchScoutingWindow (domínio)
        │
        │  props (projeções somente-leitura)
        │  ├─ clockTimeLabel · clockStateLabel · currentPeriod
        │  ├─ score · fouls · possession
        │  ├─ athletes[] (em quadra + banco, com estado disciplinar)
        │  ├─ recentEvents[]
        │  ├─ persistenceState
        │  └─ availableEventIds[] (filtrado por modo e estado do relógio)
        │
        │  callbacks (as únicas saídas)
        │  ├─ onRegisterEvent(input: SharedEventInput)
        │  ├─ onUndoEvent(eventId)
        │  ├─ onEditEvent(eventId)
        │  ├─ onClockAction(action)
        │  ├─ onSave() · onOpenLogs() · onReturnToCurrentExperience()
        │  └─ onSelectAthlete(id)   ← sticky vive no domínio, não no Shell
        ▼
CollectionShellExperimental (casca)
```

Decisão relevante: **o atleta sticky vive no domínio**, não no Shell. Motivo — o fluxo atual também se beneficia dele, e duplicar esse estado nos dois shells criaria divergência.

---

## 10. Design tokens

Herdados de `index.css` e do uso real em `MatchScoutingWindow`. **Não inventar paleta nova.**

### 10.1 Superfícies e texto

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg-primary` | `#000000` | Fundo da coleta |
| `--bg-surface` | `#09090b` (zinc-950) | Cards, Rail, Deck |
| `--bg-elevated` | `#18181b` (zinc-900) | Opção em hover, sheet |
| `--border` | `#27272a` (zinc-800) | Borda padrão |
| `--border-strong` | `#3f3f46` (zinc-700) | Borda de botão |
| `--text-primary` | `#ffffff` | Label de ação |
| `--text-secondary` | `#a1a1aa` (zinc-400) | Helper |
| `--text-muted` | `#71717a` (zinc-500) | Metadado |

### 10.2 Acento e estado

| Token | Valor | Uso |
| --- | --- | --- |
| `--accent` | `#00f0ff` | Seleção, foco, ação primária |
| `--accent-dim` | `rgba(0,240,255,.15)` | Fundo de item selecionado |
| `--live` | `#22c55e` | Relógio rodando |
| `--paused` | `#f59e0b` | Relógio pausado, alerta |
| `--danger` | `#ef4444` | 6ª falta, expulsão, destrutivo |
| `--success` | `#22c55e` | Registro confirmado |

### 10.3 Tons semânticos por família de evento

Reaproveita as cores que `MatchScoutingWindow` (`:181-191`) já usa — trocar agora quebraria a memória visual de quem opera hoje.

| Família | Cor | Eventos |
| --- | --- | --- |
| Gol | `emerald-500` | Gol nosso, gol de bola parada |
| Gol contra / sofrido | `amber-500` | Gol contra, gol adversário |
| Finalização | `cyan-500` | No gol, trave, fora, bloqueada, zona de chute |
| Defensivo | `sky-500` | Desarme, bloqueio, defesa de goleiro |
| Infração | `red-500` | Falta, cartão, expulsão |
| Bola parada | `orange-500` | Escanteio, lateral, tiro livre, pênalti |
| Operacional | `zinc-400` | Substituição, tempo técnico, posse |

### 10.4 Tipografia

| Papel | Fonte | Especificação |
| --- | --- | --- |
| Relógio, placar | `Oswald` italic | 900, tabular-nums, tracking `-0.03em` |
| Label de ação | `Montserrat` | 800, uppercase, tracking `0.02em` |
| Número do atleta | `Oswald` | 900, 20px |
| Helper, metadado | `Calibri` (platform-font) | 400, 11–12px |
| Título de passo | `Montserrat` | 700, uppercase, 16px |

### 10.5 Espaçamento e raio

Escala de 4px. Raio: `12px` cards, `16px` painéis, `9999px` badges. Altura mínima de alvo: `56px` (fluxo), `44px` (utilitário).

---

## 11. Especificação evento por evento

Todas as specs derivam dos microfluxos já decididos na `EVENT_MATRIX_V2.md` §"Microfluxos prioritarios". **Não reinventar.**

Legenda: `A` = passo de atleta (pulado se sticky) · `T` = equipe · `C` = escolha · `S` = atleta secundário · `R` = revisão explícita

| # | Evento | Classe | Tier | Passos | Taps (sticky) | Handler | Sprint |
| --: | --- | :-: | --- | --- | :-: | --- | --- |
| 1 | Finalização | B | primary | `A → C{no gol, trave, fora, bloqueada}` | 2 | `handleRegisterShot` | **004D** |
| 2 | Falta | A | primary | `T → A(se nosso) → ⏎` | 2 | `handleRegisterFoul` | **004D** |
| 3 | Desarme | B | primary | `A → C{com bola, sem bola, em contra-ataque}` | 2 | `handleRegisterTackle` | **004D** |
| 4 | Defesa | B | secondary | `A(goleiro) → C{simples, difícil, saída}` | 2 | `handleRegisterSave` | **004D** |
| 5 | Bloqueio | B | secondary | `A → ⏎` | 1 | `handleRegisterBlock` | **004D** |
| 6 | Escanteio | B | secondary | `T → A(se nosso) → ⏎` | 2 | `handleRegisterCorner` | **004D** |
| 7 | Finalização em zona de chute | B | overflow | `A → ⏎` | 1 | `handleRegisterShot` (`shotZonaChute`) | **004D** |
| 8 | Gol | A | primary | `T → A(se nosso) → C{método} → S(assist, opcional) → ⏎` | 3 | `handleRegisterGoal` | 004E |
| 9 | Gol contra | A | overflow | `T → ⏎` | 2 | `handleRegisterGoal('contra')` | 004E |
| 10 | Cartão | A | secondary | `T → A(se nosso) → C{amarelo, 2º amarelo, vermelho}` | 3 | `handleRegisterCard` | 004E |
| 11 | Expulsão | A | overflow | `T → A → R` | 3 | `handleRegisterCard('red')` | 004E |
| 12 | Pênalti | A | secondary | `T → C{gol, defendido, fora, trave} → A(cobrador, se nosso)` | 3 | `handleRegisterPenalty` | 004E |
| 13 | Tiro livre | A | secondary | `T → C{gol, defendido, fora, trave} → A(cobrador, se nosso)` | 3 | `handleRegisterFreeKick` | 004E |
| 14 | Substituição | A | secondary | `A(sai) → S(entra) → R` | 3 | **extrair** | 004E |
| 15 | Lateral | C | overflow | `T → A(se nosso) → C{lado, opcional}` | 2 | `handleRegisterLateral` | 004F |
| 16 | Perda de posse | B | overflow | `A → C{causa, opcional}` | 1–2 | **não existe** | 004F ou adiar |
| 17 | Recuperação de posse | B | overflow | `A → C{origem, opcional}` | 1–2 | **não existe** | 004F ou adiar |
| 18 | Tempo técnico | A | overflow | `T → ⏎` | 2 | **decidir se persiste** | 004F |
| 19 | Passe | D | — | `A → C{certo, errado} → S(recebedor) → C{transição}` | 4 | `handleRegisterPass` | 004F **postmatch apenas** |
| 20 | Passe-chave / assistência avulsa | C | — | `A → S` | 2 | via `goal`/`pass` | 004F **postmatch apenas** |

**Média ponderada de taps** com a distribuição de §5.1: **~2,3 taps/evento** contra ~3,2 no fluxo atual — **28% menos**.

---

## 12. Sprints

Nomenclatura dá continuidade ao roadmap aprovado no `UX_BACKLOG.md` (004C→004G), estendido até 004J.

### Sprint 004D — Motor, layout e eventos simples

> A sprint mais pesada. Troca o motor e o layout de uma vez, porque fazer em duas etapas geraria um estado intermediário incoerente.

**Entregas**

1. `registerSharedEvent()` + `registerSharedFinalization` como wrapper (§9.2).
2. `eventSpecs.ts` + `useShellFlow.ts` com auto-advance (§8.2).
3. As 5 zonas: `ShellCommandBar`, `ShellAthleteRail`, `ShellStage`, `ShellActionDeck`, `ShellTimelineStrip`.
4. **Atleta sticky** (estado no domínio, §9.5).
5. **Desfazer** de 30s na Timeline Strip.
6. Camada de teclado (`useShellShortcuts`) + overlay `?`.
7. Feedback haptic + áudio (`useShellFeedback`).
8. **Eventos 1–7 da §11** — incluindo **trave** e **zona de chute**.
9. `recordedByUserId` / `recordedByName` em todo evento do Shell.
10. Guard de `beforeunload` com fila não vazia.
11. Remover o comentário obsoleto de "recurso legado" em `RealtimeScoutPage.tsx:9-11` (Achado 4).
12. Selo da experiência ativa no Command Bar (Achado 1).

**Fora de escopo:** gol, cartão, bola parada, substituição, zona, passe, presets.

**Critérios de aceite**

- [ ] Os 7 eventos gravam no log oficial **idênticos** aos equivalentes do fluxo atual
- [ ] `shell-finalization.spec.ts` passa **sem ter sido alterado**
- [ ] Suíte Playwright 15/15 verde
- [ ] Zero erro **novo** de type-check nos arquivos do Shell (registrar baseline antes — a dívida histórica é conhecida, ver 004C.1A §10)
- [ ] Nenhum `handleRegister*` modificado — mostrar o diff de `MatchScoutingWindow.tsx`
- [ ] `ShellStage.tsx` não contém nenhum `if` sobre id de evento específico
- [ ] Adicionar um 8º evento custa 1 entrada em `eventSpecs.ts` — demonstrar com exemplo comentado
- [ ] TTE p50 medido ≤ 1.200ms para Finalização com atleta sticky
- [ ] Header ≤ 56px e Stage começando acima de 200px em 1366×768

### Sprint 004E — Eventos compostos

**Entregas**

1. **Gol** nosso e adversário: `goalMethod`, `assistPlayerId`, `isOpponentGoal`. Métodos curtos ao vivo conforme `EVENT_MATRIX_V2` §1, **com bola parada no topo** (§5.2).
2. **Cartão** e **expulsão**: `cardType`, `cardTeam`. Expulsão com `requiresExplicitConfirm`.
3. **Pênalti** e **tiro livre**: `isForUs`, resultado, cobrador.
4. **Substituição** — único ponto do plano que cria domínio novo. Extrair função pura e testável **antes** de plugar no Shell.
5. **Presets** (§8.3) com long-press.
6. Banco de reservas expansível no Rail.

**Critério de aceite principal — teste de equivalência**

Criar `e2e/specs/shell-equivalence.spec.ts`: coletar a **mesma** sequência de 20 eventos (cobrindo Classe A e B) nos dois fluxos e comparar o array `matchEvents` normalizado, ignorando `id` e timestamps. **Diff precisa ser vazio.**

Se der diferença, o Shell forkou o domínio — corrigir a raiz, nunca o teste.

- [ ] Jogo completo coletável 100% no Shell
- [ ] Dashboard idêntico ao de um jogo coletado no fluxo atual
- [ ] Preset e fluxo manual geram payload idêntico
- [ ] `shell-equivalence.spec.ts` verde

### Sprint 004F — Modo REVIEW e enriquecimento

1. Passo `ZONE` opcional em qualquer evento.
2. `mode='postmatch'`: Passe (+ recebedor + `wrongPassGeneratedTransition`), passe-chave, assistência avulsa, lateral detalhado.
3. Edição de timestamp **também no realtime** (hoje `manualTime` só chega no postmatch, `:4086`).
4. Modo **RECOVERY** (§7.3) — reabrir incompleta sem repetir escalação (Achado 2).
5. Decidir e implementar perda/recuperação de posse **ou** documentar o adiamento com justificativa.

### Sprint 004G — Resiliência e fila offline

1. Fila local de eventos (§8.6).
2. Estado de persistência no Command Bar.
3. Backoff exponencial + reconciliação na retomada.
4. Documentar formalmente a dívida do `PUT` monolítico (Achado 5) como input para uma sprint de backend.

### Sprint 004H — Polimento e acessibilidade

1. Auditoria de contraste e alvo de toque em todas as viewports de §7.4.
2. `prefers-reduced-motion`, `aria-live`, navegação completa por teclado.
3. Bloqueio de tablet retrato com orientação sugerida.
4. Rodada com **operadores reais** — a pendência qualitativa aberta na 004C.1A §7.

### Sprint 004J — A/B, decisão e promoção

1. Rodada QA comparativa Shell V2 × fluxo atual com operadores reais.
2. Comparar `window.__scout21CollectionShellMetrics__` contra baseline em todas as métricas de §6.1.
3. Re-rodar a análise de frequência (§5) com o dataset acumulado; reordenar o Deck se mudou.
4. **Decisão explícita:** promover a default, ajustar, ou matar — conforme `UX_BACKLOG.md`: *"Se isso não mostrar ganho operacional, o Shell não deve escalar."*
5. Se promovido: inverter o default da flag, mantendo `?coleta=atual` como rollback.

---

## 13. Estratégia de testes

| Camada | Cobre | Onde |
| --- | --- | --- |
| Unitário | `toDomainInput()` de cada spec · `skipWhen` · auto-advance · extração da substituição | `__tests__/eventSpecs.test.ts`, `__tests__/useShellFlow.test.ts` |
| Contrato | `registerSharedEvent()` roteia para o handler certo com o payload certo | mock dos handlers |
| **Equivalência** | mesmo input no Shell e no fluxo atual ⇒ mesmo `matchEvents` | `e2e/specs/shell-equivalence.spec.ts` |
| Preset | preset e fluxo manual geram payload idêntico | incluído no de equivalência |
| E2E por família | um spec por família de evento | expandir `e2e/specs/shell-*.spec.ts` |
| Teclado | fluxo completo sem mouse | `e2e/specs/shell-keyboard.spec.ts` |
| Visual | densidade e layout nas 5 viewports de §7.4 | reaproveitar o harness de `.codex-artifacts/shell-visual-audit/` |
| Métrica | TTE e taps por evento | assert sobre `__scout21CollectionShellMetrics__` |
| Regressão | os 15 testes atuais, verdes em toda sprint | suíte existente |

O teste de **equivalência** é o mais importante do plano: é ele que prova que o Shell é casca, não fork.

---

## 14. Métricas e critério de decisão

### 14.1 Instrumentação

`window.__scout21CollectionShellMetrics__` já existe (`CollectionShellExperimental.tsx:18-31`) com `start | interaction | cancel | confirm | success | error`, `durationMs` e `interactionCount`. **Estender**, não substituir:

```ts
interface ShellMetricEntry {
  type: 'start' | 'interaction' | 'cancel' | 'confirm' | 'success' | 'error'
      | 'undo' | 'preset' | 'shortcut' | 'skip';   // novos
  mode: 'realtime' | 'postmatch';
  eventId?: string;        // novo — qual evento
  stepId?: string;         // novo — qual passo
  inputMethod?: 'touch' | 'keyboard' | 'preset';   // novo
  skippedSteps?: number;   // novo — economia do auto-advance
  durationMs?: number;
  interactionCount?: number;
  detail?: string;
  createdAt: string;
}
```

### 14.2 Portão de decisão da 004J

O Shell V2 é promovido a default **somente se** todos forem verdadeiros:

| Critério | Alvo |
| --- | --- |
| TTE p50 | ≤ 1.200ms *e* melhor que o baseline |
| Taps/evento (média ponderada) | ≤ 2,4 |
| Cancel rate | ≤ 5% |
| Undo rate | ≤ 3% |
| Eventos/min | ≥ baseline |
| Erros de atribuição em revisão cega | ≤ baseline |
| Preferência de operadores reais | ≥ 70% preferem o V2 |
| Equivalência de dados | 100% (diff vazio) |

Falhar em qualquer um: ajustar ou matar. **Não promover com métrica vermelha.**

---

## 15. Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| `MatchScoutingWindow.tsx` tem 6.184 linhas; mexer na porta pode quebrar o fluxo atual | Alto | A porta é **aditiva**. `registerSharedFinalization` continua existindo. Nenhum handler modificado. Diff auditado no aceite. |
| Atleta sticky causa atribuição errada silenciosa | **Alto** | Sticky sempre visível com glow forte; nome do atleta ecoado no título do passo (*"Finalização de LUCAS #7"*); desfazer de 30s; sticky limpo em substituição e virada de período |
| Auto-confirm registra evento indesejado | Médio | Desfazer de 30s + haptic imediato; `requiresExplicitConfirm` para expulsão e substituição; medir undo rate na 004J |
| Substituição não tem handler compartilhável | Médio | Extração isolada na 004E com teste unitário antes de plugar |
| `type-check` do frontend já falha (dívida histórica) | Médio | Não corrigir tudo. Garantir **zero erro novo** nos arquivos do Shell. Registrar baseline antes de começar. |
| Construir Passe genérico no realtime por engano | Alto (retrabalho) | §4.1 + dados de §5.2. Passe é Classe D. |
| Shell vira monólito ao crescer | Alto | Critério não-negociável de §9.3: novo evento = 1 entrada, 0 JSX |
| Perda/recuperação de posse não existe em lugar nenhum | Médio | São eventos **novos**. Decidir explicitamente na 004F. Não assumir que existem. |
| Redesenho grande de uma vez → regressão difícil de isolar | **Alto** | Flag `?coleta=shell` isola 100%. Fluxo atual intocado. Commits pequenos. Equivalência como rede de segurança. |
| `PUT` monolítico perde dados em rede ruim | Alto | Fila local na 004G; dívida de backend documentada em separado |
| Amostra de frequência é n=13 | Médio | Ordem do Deck é **configuração**, não estrutura. Re-medir em cada sprint. |

---

## 16. Prompts de execução

### 16.1 Prompt mestre — colar no início de qualquer sprint

```
Contexto: SCOUT 21 PRO, monorepo em apps/scout21, branch feature/shell-experimental-coleta.
Estou executando a COLETA V2: novo layout, novo fluxo e paridade funcional completa do
Shell de coleta (?coleta=shell).

ANTES DE ESCREVER QUALQUER CÓDIGO, leia nesta ordem:
1. docs/PLANO_MESTRE_COLETA_V2.md   ← fonte da verdade, leia inteiro
2. docs/EVENT_MATRIX_V2.md          ← taxonomia Classe A/B/C/D + os 11 microfluxos
3. docs/UX_BACKLOG.md               ← roadmap e itens que devem morrer
4. docs/SPRINT_004C_1A_SHELL_VISUAL_ARCHITECTURE_REPORT.md ← contrato de domínio

INVARIANTES — violar qualquer um invalida a entrega:
- O Shell NÃO faz fetch, NÃO monta objeto MatchEvent, NÃO calcula tempo, NÃO salva.
- Toda persistência passa pelos handlers já existentes em MatchScoutingWindow.tsx.
  Você pode ADICIONAR uma porta de roteamento. Você NÃO pode modificar um handleRegister*.
- Comportamento de pausa do relógio vem SEMPRE de getMatchClockEventRule()
  (utils/matchClockEventRules.ts). Nunca crie regra de clock nova no Shell.
- O fluxo atual continua sendo o default. Ativação só por ?coleta=shell.
- A suíte Playwright (15 testes) precisa terminar verde.
- Passe genérico NÃO entra no realtime (Classe D, decisão da Sprint 004B, e zero uso
  real nos dados — ver §5 do plano).
- ShellStage.tsx não pode conter nenhum if/switch sobre id de evento específico.
  Se você sentir necessidade disso, o motor declarativo está errado — pare e me avise.

MÉTRICA QUE MANDA:
TTE (Time To Event) — ms entre a intenção do operador e o evento registrado, com os
olhos de volta na quadra. Toda decisão que aumente TTE precisa de justificativa explícita.

MÉTODO:
1. Mapeie os arquivos que vai tocar e me mostre o plano ANTES de editar.
2. Commits pequenos, padrão do repo: feat(shell): / test(e2e): / docs(shell):
3. Rode nesta ordem: npm run build (frontend) → suíte Playwright → verificação manual
   em ?coleta=shell com o usuário QA.
4. Ao final escreva docs/SPRINT_<id>_REPORT.md no formato dos relatórios existentes,
   incluindo a re-medição da frequência de eventos (§5.3 do plano exige isso).

AMBIENTE LOCAL:
- Backend:  cd apps/scout21/backend && PORT=3000 npm run dev
- Frontend: cd apps/scout21/21Scoutpro && npm run dev     (porta 5173)
- QA: qa.scout21@qa.scout21.local / testeqascout
- Jogo de teste: "QA ADVERSARIO" 16/07/2026, status disponível
- ARMADILHA CONHECIDA: não rode `npm run dev` na raiz do monorepo com PORT no ambiente.
  O concurrently propaga a variável e o backend tenta subir na mesma porta do Vite,
  morre, e o login falha com "Erro de conexão". Suba os dois separados.
- A coleta abre em /scout-realtime e depende de localStorage.realtimeScoutData.
  Abrir /scout-realtime direto NÃO funciona — passe pelo funil (§3.3 do plano).

Se algo no plano conflitar com o que você encontrar no código, PARE e me avise antes
de decidir sozinho.
```

### 16.2 Prompt da Sprint 004D

```
Execute a Sprint 004D do docs/PLANO_MESTRE_COLETA_V2.md (§12). Aplique o prompt mestre
da §16.1. Esta é a sprint mais pesada: troca o motor E o layout.

ENTREGAS

1. PORTA ÚNICA DE DOMÍNIO (§9.2)
   Em components/MatchScoutingWindow.tsx crie registerSharedEvent(input: SharedEventInput).
   Roteie para os handlers que JÁ EXISTEM:
     handleRegisterShot :2837 · handleRegisterFoul :2720 · handleRegisterTackle :2592
     handleRegisterSave :2634 · handleRegisterBlock :2685 · handleRegisterCorner :2881
   Reaproveite a lógica de roteamento de executeActionFlow() :1127 — não duplique.
   registerSharedFinalization :2866 passa a ser wrapper fino dela.
   Eventos de equipe usam TEAM_EVENT_FAKE_PLAYER_ID :197.
   NÃO modifique nenhum handleRegister*. Apenas roteie.

2. MOTOR DECLARATIVO (§9.3)
   - collection-shell/eventSpecs.ts — as specs dos eventos 1 a 7 da §11
   - collection-shell/useShellFlow.ts — máquina de estados dirigida por spec, com as
     3 regras de auto-advance da §8.2
   - collection-shell/types.ts — ShellStepKind, ShellFlowStep, ShellEventSpec, ShellEventDraft

3. AS 5 ZONAS DO LAYOUT (§7.1 e §7.2)
   ShellCommandBar (56px, só leitura, com selo da experiência e estado de persistência)
   ShellAthleteRail (120px, seleção sticky, 5 em quadra + card de banco)
   ShellStage (uma decisão por vez, renderizador genérico)
   ShellActionDeck (zona de polegar, 4 primários + secundários + overflow)
   ShellTimelineStrip (48px, últimos 5 eventos, desfazer de 30s)
   Siga os tokens da §10 — NÃO invente paleta nova.

4. ATLETA STICKY (§7.2 ②)
   Estado vive no DOMÍNIO (MatchScoutingWindow), não no Shell — §9.5 explica por quê.
   Sticky pula o passo ATHLETE. Limpo em substituição e virada de período.
   MITIGAÇÃO OBRIGATÓRIA de atribuição errada: eco do nome do atleta no título do passo
   ("Finalização de LUCAS #7") + glow forte no card.

5. DESFAZER (§7.2 ⑤) — 30s no chip mais recente, usando o caminho oficial de exclusão.

6. TECLADO (§8.4) — useShellShortcuts + overlay '?'.

7. FEEDBACK SEM OLHAR (§8.5) — useShellFeedback: haptic (navigator.vibrate) + tick curto
   no registro. Respeitar prefers-reduced-motion e permitir desligar o som.

8. EVENTOS 1 a 7 DA §11
   Finalização (4 resultados — a TRAVE está faltando hoje e é 33% das finalizações reais),
   Falta (com foulTeam), Desarme, Defesa, Bloqueio, Escanteio, Finalização em zona de chute.

9. TRANSVERSAIS
   - recordedByUserId / recordedByName da sessão em todo evento
   - guard de beforeunload com fila não vazia
   - remover o comentário obsoleto "Recurso legado" em RealtimeScoutPage.tsx:9-11
   - selo da experiência ativa no Command Bar

CRITÉRIOS DE ACEITE — verifique um por um e me reporte cada linha:
[ ] Os 7 eventos gravam idênticos aos do fluxo atual
[ ] shell-finalization.spec.ts passa SEM ter sido alterado
[ ] Suíte Playwright 15/15 verde
[ ] Zero erro NOVO de type-check nos arquivos do Shell (registre o baseline antes)
[ ] Nenhum handleRegister* modificado — mostre o diff de MatchScoutingWindow.tsx
[ ] ShellStage.tsx sem nenhum if/switch sobre id de evento
[ ] Adicionar um 8º evento = 1 entrada em eventSpecs.ts — demonstre com exemplo comentado
[ ] TTE p50 ≤ 1200ms para Finalização com atleta sticky (meça de verdade)
[ ] Command Bar ≤ 56px e Stage começando acima de 200px em 1366×768

FORA DE ESCOPO: gol, cartão, pênalti, tiro livre, substituição, zona, passe, presets.
```

### 16.3 Prompt da Sprint 004E

```
Execute a Sprint 004E do docs/PLANO_MESTRE_COLETA_V2.md (§12). Aplique o prompt mestre
da §16.1. Pré-requisito: 004D concluída e verde.

ENTREGAS

1. GOL — nosso e adversário, via handleRegisterGoal :2951
   Microfluxo (EVENT_MATRIX_V2 §1): equipe → autor → origem curta → assistência → confirmar
   Origens curtas ao vivo: jogada individual, erro do adversário, rebote, bola parada,
   sem assistência, desconhecida.
   ATENÇÃO AOS DADOS (§5.2 do plano): 75% dos gols reais vieram de BOLA PARADA
   (escanteio, lateral, tiro livre). O menu de goalMethod NÃO pode nascer só com
   Ataque/Contra-ataque — bola parada vai no topo.
   Preencher goalMethod, assistPlayerId, isOpponentGoal.
   Gol adversário não exige atleta (TEAM_EVENT_FAKE_PLAYER_ID).

2. CARTÃO e EXPULSÃO — via handleRegisterCard :3266
   nosso/adversário → atleta se nosso → tipo. Preencher cardType e cardTeam.
   Expulsão com requiresExplicitConfirm: true (irreversível em campo).

3. PÊNALTI e TIRO LIVRE — via handleRegisterPenalty :3146 e handleRegisterFreeKick :3089
   equipe → resultado → cobrador se nosso. Preencher isForUs.

4. SUBSTITUIÇÃO — ÚNICO ponto do plano que cria domínio novo.
   Hoje vive acoplada ao painel esquerdo (MatchScoutingWindow.tsx:4107+).
   Extraia uma função PURA e TESTÁVEL com teste unitário próprio ANTES de plugar no Shell.
   Fluxo: sai → entra → confirmar (requiresExplicitConfirm).
   Precisa limpar o atleta sticky se o atleta que sai era o sticky.

5. PRESETS (§8.3) — long-press de 400ms, adaptação dos clustered buttons do Nacsport.
   Presets iniciais na tabela da §8.3. Preset grava payload IDÊNTICO ao fluxo manual.

6. BANCO DE RESERVAS expansível no Rail (pendência aberta na 004C.1A §12).

CRITÉRIO DE ACEITE PRINCIPAL — TESTE DE EQUIVALÊNCIA
Crie e2e/specs/shell-equivalence.spec.ts que colete a MESMA sequência de 20 eventos
(cobrindo todas as classes A e B) nos dois fluxos e compare o array matchEvents
normalizado, ignorando id e timestamps. O diff precisa ser VAZIO.
Se der diferença, o Shell forkou o domínio — corrija a raiz, NUNCA o teste.

[ ] Jogo completo coletável 100% no Shell
[ ] Dashboard idêntico ao de um jogo coletado no fluxo atual
[ ] Preset e fluxo manual geram payload idêntico
[ ] shell-equivalence.spec.ts verde
[ ] Substituição tem teste unitário da função pura
[ ] Suíte completa verde
```

### 16.4 Prompts 004F / 004G / 004H / 004J

Mesmo formato: referenciar a seção de §12 correspondente, herdar o prompt mestre de §16.1, e fechar com critérios de aceite verificáveis. **Detalhar apenas quando a sprint anterior estiver verde** — evita planejar sobre premissa não validada.

---

## 17. Decisões pendentes

Responder antes da 004D começar:

| # | Decisão | Contexto | Recomendação |
| --: | --- | --- | --- |
| 1 | **Auto-confirm em LIVE, sem tela de revisão?** | A 004C.1A deixou explicitamente em aberto: *"medir se a etapa de confirmação compensa em campo"*. §8.2 propõe remover em LIVE e compensar com desfazer de 30s. | **Sim, remover.** Revisão custa atenção em 100% dos eventos; desfazer custa em ~3%. Manter apenas para expulsão e substituição. |
| 2 | **Atleta sticky é aceitável operacionalmente?** | É a maior economia do plano (1 tap por evento) e o maior risco (atribuição errada silenciosa). | **Sim, com as 3 mitigações da §15.** Se a rodada com operadores da 004H reprovar, cai para seleção por evento sem quebrar o motor. |
| 3 | **Perda/recuperação de posse: 004F ou adiar?** | A matriz pede, mas não existem em lugar nenhum do código. Custam mais que os 5 eventos simples da 004D somados. | **Adiar para depois da 004J.** Só construir se o A/B provar que o Shell escala. |
| 4 | **Tempo técnico persiste como evento ou é só clock?** | Não existe hoje. A matriz lista como Classe A. | **Só clock na V2.** Persistir só se a análise pedir. |
| 5 | **A 004D pode entregar motor + layout juntos?** | Fazer em duas etapas geraria um estado intermediário incoerente (motor novo com layout velho). | **Sim, juntos.** A flag isola 100% do risco e o fluxo atual fica intocado. |
| 6 | **Tablet retrato: bloquear ou degradar?** | §7.4 propõe bloquear com orientação sugerida. | **Bloquear.** Coleta em retrato não tem espaço para Rail + Stage + Deck sem virar rolagem — e rolagem durante jogo é inaceitável. |

---

## Anexo A — Rastreabilidade das decisões

| Decisão deste plano | Origem |
| --- | --- |
| Taxonomia Classe A/B/C/D | `EVENT_MATRIX_V2.md` (Sprint 004B) |
| Passe fora do realtime | `EVENT_MATRIX_V2.md` §"Decisao sobre Passe" + dados de §5 |
| Os 11 microfluxos | `EVENT_MATRIX_V2.md` §"Microfluxos prioritarios" |
| Nomes das sprints | `UX_BACKLOG.md` §"Roadmap sugerido" |
| Contrato de domínio único | `SPRINT_004C_1A_...REPORT.md` §3 |
| Baseline de viewport (1280×800) | `SPRINT_004C_1A_...REPORT.md` §6 |
| Remover o passo de confirmação | pergunta aberta em `SPRINT_004C_1A_...REPORT.md` §12, respondida em §8.2/§17 |
| Trilha fixa de atletas | pergunta aberta em `SPRINT_004C_1A_...REPORT.md` §12, respondida em §7.2 ② |
| Presets / clustered buttons | Nacsport (§2.1) |
| Auto-advance / tolerance | Nacsport Panel Flows (§2.1) |
| `skipWhen` / activation links | Nacsport Activation Links (§2.1) |
| Deck e Rail na base | literatura de thumb zone (§2.2) |
| Uma decisão por tela | progressive disclosure (§2.3) |
| Confirmação haptic/sonora | síntese própria — nenhuma ferramenta pesquisada resolve "olhos na quadra" (§2.4) |
| Ordem do Action Deck | frequência real medida (§5.1) |
| Bola parada no topo do menu de gol | 75% dos gols reais (§5.2) |
| Trave como prioridade máxima | 33% das finalizações reais (§5.2) |

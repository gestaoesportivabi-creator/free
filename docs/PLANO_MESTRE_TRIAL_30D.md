# PLANO MESTRE — TESTE GRATUITO DE 30 DIAS (SELF-SERVICE)

**Projeto:** SCOUT 21 PRO
**Documento:** `docs/PLANO_MESTRE_TRIAL_30D.md`
**Data:** 2026-08-06
**Objetivo estratégico:** permitir que qualquer pessoa chegue à landing page, se cadastre sozinha e comece a usar o SCOUT21 por 30 dias — **sem cartão de crédito, sem Pix, sem WhatsApp, sem intervenção humana**.
**Restrição arquitetural:** o sistema de pagamento entra depois. Nada construído agora pode precisar de refatoração quando o pagamento chegar.

---

## SUMÁRIO EXECUTIVO

### O diagnóstico em uma frase

O backend já sabe criar contas. O frontend não sabe pedir. E ninguém sabe expirar.

### Os três achados que mudam o plano

**1. Não existe tela de cadastro. O endpoint existe e está órfão.**
`POST /api/auth/register` está implementado, funcional, cria `User` + `Tecnico`/`Clube`, dispara e-mail de boas-vindas e devolve JWT ([auth.controller.ts:183](../backend/src/controllers/auth.controller.ts#L183)). Mas **nenhuma linha do frontend chama esse endpoint** — `grep` por `authApi.register` retorna zero ocorrências em `App.tsx`, `Login.tsx` e `services/api.ts`. O `Login.tsx` até declara `initialMode?: 'login' | 'register'` na interface, mas o estado interno é `AuthMode = 'login' | 'forgot' | 'magic'` — o modo `register` nunca foi construído ([Login.tsx:12,19](../21Scoutpro/components/Login.tsx#L12)).

**Consequência:** o trabalho de backend de cadastro está ~80% pronto. O gargalo real é frontend + ciclo de vida.

**2. Não existe nenhuma trava de plano no servidor. Zero.**
Todo o gating de plano é **cosmético, no frontend**: `isFreePlan` aplica cadeado/blur em gráficos ([GeneralScout.tsx:1399](../21Scoutpro/components/GeneralScout.tsx#L1399), [ScoutTable.tsx:2472](../21Scoutpro/components/ScoutTable.tsx#L2472)). No backend, as rotas passam por `authMiddleware + tenantMiddleware + requireStaff` — e **nada mais**. Não há verificação de plano, quota, limite de jogos ou de campeonatos em nenhum controller ou service (`grep` por `maxMatches|limiteJogos|quota` retorna vazio).

**Consequência:** um trial que "expira" só no frontend é contornável com F12. **Se não houver enforcement de servidor, o teste de 30 dias é decorativo.** Este é o item de maior risco do projeto e precisa ser construído do zero.

**3. O primeiro acesso é um beco sem saída.**
`register` cria `User` + `Tecnico`, mas **não cria nenhuma `Equipe`**. Todo o `tenantMiddleware` resolve acesso via `equipe_ids` ([tenant.middleware.ts](../backend/src/middleware/tenant.middleware.ts)) — que virá **vazio**. O usuário passa na autenticação, entra no dashboard, e toda lista retorna `[]`. Sem elenco, sem jogos, sem programação, sem nada. Nenhum estado vazio guiado, nenhum wizard, nenhum dado de demonstração.

**Consequência:** mesmo que o cadastro funcionasse hoje, a taxa de ativação seria próxima de zero. Um trial que abre numa tela vazia é um trial perdido nos primeiros 90 segundos.

### O que já está pronto e é bom

| Ativo | Estado | Evidência |
|---|---|---|
| Endpoint de registro | Funcional, com criação de tenant | `auth.controller.ts:183` |
| Infra de e-mail transacional | Resend integrado, 4 templates prontos | `services/email/` |
| Tokens de e-mail (verify/magic/reset) | Hash SHA-256, TTL, uso único, invalidação | `authToken.service.ts` |
| Campo `emailVerifiedAt` | Existe no schema, endpoint `/verify-email` funciona | `schema.prisma:44` |
| Multi-tenancy | Sólido, com validação cruzada anti-vazamento | `tenant.middleware.ts` |
| Captura de leads | `POST /api/leads` com rate-limit, UTM, fallback 202 | `leads.controller.ts` |
| Landing page | 704 linhas, estrutura completa, tracking de eventos | `LandingPage.tsx` |
| Admin da plataforma | Overview, tenants, stats, health | `platformAdmin.controller.ts` |
| Seed de dados demo | Script existente, reaproveitável | `scripts/seed-demo-data.ts` |

### O que precisa ser construído

| Frente | Esforço | Bloqueia lançamento? |
|---|---|---|
| Tela de cadastro (frontend) | Médio | **Sim** |
| Modelo `Subscription` + expiração | Médio | **Sim** |
| Middleware de enforcement de trial | Médio | **Sim** |
| Primeiro acesso guiado (wizard/demo) | Alto | **Sim** — sem isso o trial não converte |
| Ciclo de e-mails do trial | Baixo | Não, mas derruba conversão |
| Domínio + DNS/SPF/DKIM | Baixo | **Sim** — e-mail em spam mata o funil |
| Landing revisada (WhatsApp → formulário) | Médio | **Sim** |
| Guia de uso | Médio | Não |
| Painel de funil do trial | Baixo | Não |
| Página legal (LGPD/Termos) | Baixo | **Sim** — obrigação legal |

---

## PARTE I — AUDITORIA DO ESTADO ATUAL

### 1.1 Arquitetura geral

```
apps/scout21/
├── 21Scoutpro/          Frontend — Vite + React + TypeScript + Tailwind
│   ├── App.tsx          2.183 linhas — roteamento SPA por pathname (sem react-router)
│   ├── components/      57 componentes
│   ├── services/api.ts  Cliente HTTP, auth via localStorage 'token'
│   └── config.ts        getApiUrl(), gating de plano no cliente
├── backend/             Express + Prisma + PostgreSQL (Supabase)
│   ├── src/routes/      17 grupos de rotas
│   ├── src/middleware/  auth, tenant, admin, athleteScope, validation
│   └── prisma/          32 models, 643 linhas de schema
├── api/                 Entrypoint serverless Vercel
└── docs/                Documentação técnica
```

**Deploy:** Vercel, deploy único (frontend + backend no mesmo domínio). Projeto `gestaoesportiva-free` ([.vercel/project.json](../.vercel/project.json)). Rewrites: `/api/*` → função serverless, `/*` → SPA.

### 1.2 Modelo de identidade e planos (a conflação central)

O sistema **não tem conceito de assinatura**. `Role` faz três trabalhos ao mesmo tempo:

```
Role.name → 1. Tipo de tenant   (ESSENCIAL cria Tecnico | COMPETICAO cria Clube)
          → 2. Nível de plano   (ESSENCIAL = free | PERFORMANCE = completo)
          → 3. Permissão        (ADMINISTRADOR = admin da plataforma)
```

Roles existentes ([seed-roles.ts](../backend/scripts/seed-roles.ts)): `ADMINISTRADOR`, `ESSENCIAL`, `COMPETICAO`, `PERFORMANCE` — mais `ATLETA`, criada em outro fluxo.

Isso importa muito para o trial. **Não se pode criar uma Role `TRIAL`**, porque:
- `tenant.middleware.ts` tem branch explícito `if (req.user.role_id === 'ESSENCIAL' && !tenantInfo.tecnico_id)` → erro 500;
- `mapRoleForFrontend()` mapeia roles conhecidas → `TECNICO`; uma role nova cai fora do mapa;
- `ALLOWED_REGISTER_ROLES` e `ADMIN_ASSIGNABLE_ROLES` são listas fechadas;
- todo o gating do frontend compara `planName` contra as 4 strings conhecidas.

**Decisão:** o trial **não** será uma Role. Ver §2.1.

### 1.3 Fluxo de cadastro hoje (real)

```
Landing (/)
  └─ "Cadastre-se" ────────────► wa.me/5548991486176  ❌ sai do produto
  └─ "Começar agora" ──────────► wa.me/...            ❌ sai do produto
  └─ "Cadastrar Grátis" ───────► wa.me/...            ❌ sai do produto
  └─ Formulário "proposta" ────► POST /api/leads      ⚠️ vira lead, não conta
  └─ "Entrar" ─────────────────► /login               ✅ mas só login

/login
  └─ login | forgot-password | magic-link             ✅ funcionam
  └─ registro                                          ❌ NÃO EXISTE
  └─ botão flutuante ──────────► wa.me/...            ❌ sai do produto
```

Todos os CTAs de aquisição terminam em WhatsApp ([LandingPage.tsx:156,249,285,584](../21Scoutpro/components/LandingPage.tsx#L156)). O único caminho para dentro do produto exige um humano criar a conta manualmente pelo painel admin.

### 1.4 Infraestrutura de e-mail

**Pronta e bem construída.** Resend como provedor ([resend.client.ts](../backend/src/services/email/resend.client.ts)), com kill-switch `EMAIL_DISABLED` para dev.

Templates existentes: `welcome`, `email-verify`, `magic-link`, `password-reset`, com layout base compartilhado.

Tokens ([authToken.service.ts](../backend/src/services/email/authToken.service.ts)): random 32 bytes → base64url, armazenado como hash SHA-256, TTL por propósito (verify 24h, reset 60min, magic 15min), invalidação de tokens anteriores em transação, uso único via `usedAt`. **Qualidade de produção.**

**Lacuna:** `EMAIL_FROM` aponta para `scout21@intersomos.com.br`, mas o domínio canônico é `scout21.vercel.app` ([seo.ts:7](../21Scoutpro/utils/seo.ts#L7)). Sem SPF/DKIM/DMARC configurados para o domínio remetente, e-mails de um `.vercel.app` vão para spam. **Num trial 100% dependente de e-mail, isso é falha crítica.**

### 1.5 Riscos de segurança no cadastro público

Abrir `/api/auth/register` ao mundo hoje expõe:

| Risco | Estado atual | Severidade |
|---|---|---|
| Sem rate-limit em `/auth/register` | `/api/leads` tem; `/auth/*` não tem nenhum | Alta |
| Sem política de senha | Aceita `"1"` como senha | Alta |
| Sem verificação de e-mail obrigatória | JWT emitido na hora; `emailVerifiedAt` nunca checado | Alta |
| Sem CAPTCHA / anti-bot | Nenhum | Média |
| `MAX_REGISTERED_USERS` | Se atingido, erro genérico e signup morre em silêncio | Média |
| Sem bloqueio de e-mail descartável | Nenhum | Baixa |
| `JWT_EXPIRES_IN = 8h`, sem refresh | Usuário deslogado várias vezes por semana durante o trial | Média (UX) |

### 1.6 Primeiro acesso — o beco sem saída

Sequência real hoje, se o cadastro existisse:

```
register → cria User + Tecnico          ✅
        → NÃO cria Equipe                ❌
        → login OK, JWT válido           ✅
        → tenantMiddleware: tecnico_id OK, equipe_ids = []   ⚠️
        → GET /api/players  → []
        → GET /api/matches  → []
        → GET /api/schedules → []
        → Dashboard renderiza tudo vazio, sem instrução      ❌
```

Não existe wizard, estado vazio guiado, tour, dados de exemplo, nem checklist. O usuário chega numa tela preta com contadores em zero.

### 1.7 Observabilidade

Existe `track()` na landing (`cta_whatsapp_click`, `contact_form_submit`, `cta_login_click`). Existe `platformAdmin` com overview, tenants, stats e `leadsLast30d`.

**Não existe:** funil de cadastro instrumentado, métrica de ativação, contagem de trials ativos/expirando/expirados, nem coorte.

---

## PARTE II — ARQUITETURA DA SOLUÇÃO

### 2.1 Decisão fundamental: `Subscription` desde o dia 1

**Rejeitado — Role `TRIAL`:** quebra tenant middleware, mapeamento de role e todo o gating do frontend. Reescrita garantida quando o pagamento chegar.

**Rejeitado — campos soltos em `User` (`trialEndsAt`, `isTrial`):** rápido, mas quando o pagamento entrar será preciso migrar para um modelo de assinatura de qualquer forma, com dados já em produção. Exatamente a refatoração que a restrição do projeto proíbe.

**Adotado — model `Subscription` 1:1 com `User`:**

```prisma
enum SubscriptionStatus {
  trialing      // teste de 30 dias em curso
  active        // pagante (futuro)
  past_due      // pagamento falhou (futuro)
  canceled      // cancelou, ainda dentro do período
  expired       // trial acabou sem conversão

  @@map("subscription_status")
}

model Subscription {
  id                     String             @id @default(uuid())
  userId                 String             @unique @map("user_id")

  plan                   String             @db.VarChar(30)   // ESSENCIAL | COMPETICAO | PERFORMANCE
  status                 SubscriptionStatus @default(trialing)

  trialStartedAt         DateTime?          @map("trial_started_at") @db.Timestamptz(6)
  trialEndsAt            DateTime?          @map("trial_ends_at")    @db.Timestamptz(6)
  currentPeriodEnd       DateTime?          @map("current_period_end") @db.Timestamptz(6)
  canceledAt             DateTime?          @map("canceled_at")     @db.Timestamptz(6)

  // Ganchos de pagamento — nulos até a integração
  provider               String?            @db.VarChar(30)   // stripe | mercadopago | asaas
  providerCustomerId     String?            @map("provider_customer_id")
  providerSubscriptionId String?            @map("provider_subscription_id")

  createdAt              DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime           @updatedAt      @map("updated_at") @db.Timestamptz(6)

  user                   User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status, trialEndsAt])
  @@map("subscriptions")
}
```

**Por que isso resolve tudo:**
- `User.roleId` continua intacto → zero quebra em tenant middleware e tipo de tenant;
- `Subscription.plan` vira a fonte de verdade de **features**;
- durante o trial: `status = trialing`, `plan = PERFORMANCE` → o usuário experimenta o produto completo (é isso que vende);
- na expiração: `status = expired` → acesso rebaixado ou bloqueado, sem tocar em `roleId`;
- quando o pagamento entrar: preenche `provider*`, muda `status` para `active`. **Zero refatoração.**

### 2.2 Plano efetivo — contrato único

Uma função pura, usada por backend e refletida no frontend:

```ts
// backend/src/utils/subscription.helper.ts
export type EffectiveAccess = {
  plan: 'ESSENCIAL' | 'COMPETICAO' | 'PERFORMANCE' | 'ADMINISTRADOR';
  status: SubscriptionStatus;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  isExpired: boolean;
};

export function resolveEffectiveAccess(user, subscription, now = new Date()): EffectiveAccess {
  if (user.role.name === 'ADMINISTRADOR')
    return { plan: 'ADMINISTRADOR', status: 'active', isTrialing: false, trialDaysRemaining: null, isExpired: false };

  if (!subscription)                       // contas legadas, criadas antes do trial
    return { plan: user.role.name, status: 'active', isTrialing: false, trialDaysRemaining: null, isExpired: false };

  if (subscription.status === 'trialing') {
    const expired = !subscription.trialEndsAt || subscription.trialEndsAt <= now;
    if (expired)
      return { plan: 'ESSENCIAL', status: 'expired', isTrialing: false, trialDaysRemaining: 0, isExpired: true };

    const days = Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / 86_400_000);
    return { plan: subscription.plan, status: 'trialing', isTrialing: true, trialDaysRemaining: days, isExpired: false };
  }

  if (subscription.status === 'expired' || subscription.status === 'canceled')
    return { plan: 'ESSENCIAL', status: subscription.status, isTrialing: false, trialDaysRemaining: 0, isExpired: true };

  return { plan: subscription.plan, status: subscription.status, isTrialing: false, trialDaysRemaining: null, isExpired: false };
}
```

**Regra de ouro:** o backend calcula por data em cada requisição. **Nunca confia num flag persistido de "expirado"**. Um cron pode marcar `expired` para relatórios, mas a autoridade é sempre `trialEndsAt <= now`.

### 2.3 Camada de enforcement (o que não existe hoje)

Novo middleware, aplicado **depois** de `authMiddleware`:

```ts
// backend/src/middleware/subscription.middleware.ts

// Anexa req.access — sempre, sem bloquear
export function subscriptionContext() { /* resolveEffectiveAccess → req.access */ }

// Bloqueia escrita quando expirado — leitura e exportação continuam liberadas
export function requireActiveSubscription() {
  return (req, res, next) => {
    if (!req.access?.isExpired) return next();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();  // read-only pós-expiração
    return res.status(402).json({
      success: false,
      error: 'trial_expired',
      message: 'Seu teste de 30 dias terminou. Seus dados estão salvos e podem ser exportados.',
      trialEndedAt: req.access.trialEndsAt,
    });
  };
}
```

**Semântica escolhida — degradação, não muro:**
- **Leitura sempre permitida.** O treinador nunca perde acesso ao que já coletou. É decência com o usuário e é a melhor alavanca de conversão: ele vê o valor acumulado.
- **Escrita bloqueada** com HTTP `402 Payment Required` — semanticamente correto e trivial de tratar no frontend.
- **Exportação sempre permitida.** LGPD (portabilidade) e boa-fé comercial.

Aplicação em [app.ts](../backend/src/app.ts):

```ts
const guarded = [authMiddleware, subscriptionContext(), requireActiveSubscription(), tenantMiddleware(), requireStaff];

app.use('/api/players',   ...guarded, playersRoutes);
app.use('/api/matches',   ...guarded, matchesRoutes);
// ... demais rotas de dados

// /api/me: contexto sim, bloqueio não — precisa responder mesmo expirado
app.use('/api/me', authMiddleware, subscriptionContext(), tenantMiddleware(), meRoutes);
```

### 2.4 Quotas por plano (fundação, não escopo do lançamento)

A landing já promete limites no plano Essencial: *"1 campeonato cadastrado", "Até 10 jogos registrados"* ([LandingPage.tsx:575](../21Scoutpro/components/LandingPage.tsx#L575)). Hoje **nenhum é aplicado**. Deixar essas promessas sem enforcement é dívida que vira problema no dia da cobrança.

Definir o mapa agora, aplicar apenas no rebaixamento pós-trial:

```ts
export const PLAN_QUOTAS = {
  ESSENCIAL:     { maxMatches: 10,       maxChampionships: 1,        maxPlayers: 30 },
  COMPETICAO:    { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: 60 },
  PERFORMANCE:   { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: Infinity },
  ADMINISTRADOR: { maxMatches: Infinity, maxChampionships: Infinity, maxPlayers: Infinity },
} as const;
```

Durante o trial o plano efetivo é `PERFORMANCE` → sem limites. Quotas só mordem depois de expirar.

---

## PARTE III — FLUXO DE CADASTRO

### 3.1 Jornada alvo

```
1. Landing (/)              → "Começar teste grátis de 30 dias"
2. /criar-conta             → formulário (nome, e-mail, senha, nome da equipe)
3. POST /api/auth/register  → cria User + Tecnico + Equipe + Subscription(trialing, 30d)
4. E-mail de verificação    → enviado imediatamente
5. Acesso liberado          → JWT emitido na hora (verificação não bloqueia o primeiro uso)
6. /bem-vindo               → wizard de 3 passos
7. /dashboard               → banner "Faltam 30 dias" + checklist de ativação
```

**Decisão sobre verificação de e-mail — soft gate:**
Bloquear o acesso até verificar mata 20–30% da ativação. Bloquear nada enche a base de lixo.

Meio-termo, que é o padrão do mercado:
- acesso imediato após cadastro;
- banner persistente "Confirme seu e-mail" com botão de reenvio;
- **sem verificação em 7 dias → escrita bloqueada** (mesmo mecanismo do trial expirado);
- e-mails do ciclo de vida só disparam para endereços verificados.

### 3.2 Campos do formulário

| Campo | Obrigatório | Validação | Destino |
|---|---|---|---|
| Nome completo | Sim | 3–255 caracteres | `User.name`, `Tecnico.nome` |
| E-mail | Sim | RFC + unicidade + bloqueio de descartáveis | `User.email` |
| Senha | Sim | mín. 8 caracteres, 1 letra + 1 número | `User.passwordHash` (bcrypt 10) |
| Nome da equipe | Sim | 2–255 caracteres | `Equipe.nome`, `User.teamDisplayName` |
| Modalidade | Não (default Futsal) | enum | `Equipe.modalidade` |
| Telefone | Não | E.164 flexível | `Lead.phone` (para follow-up) |
| Aceite de Termos + Privacidade | Sim | checkbox marcado | log com timestamp e IP |

**Deliberadamente fora:** CNPJ, cidade, estado, categoria, cargo. Cada campo extra derruba conversão. O resto se coleta no wizard, já dentro do produto, quando o usuário já investiu.

### 3.3 `register` reescrito — transação atômica

O `register` atual tem duas falhas graves para uso público: **não cria `Equipe`** (§1.6) e **não é transacional** (falha no meio deixa `User` órfão sem `Tecnico`, e o e-mail fica permanentemente bloqueado por unicidade).

```ts
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email, passwordHash, name, roleId: essencialRole.id, teamDisplayName: teamName },
  });

  const tecnico = await tx.tecnico.create({ data: { userId: user.id, nome: name } });

  // ⚠️ CRÍTICO — sem isto o dashboard nasce vazio e o trial morre
  const equipe = await tx.equipe.create({
    data: { nome: teamName, tecnicoId: tecnico.id, modalidade: modalidade ?? 'Futsal' },
  });

  const now = new Date();
  const subscription = await tx.subscription.create({
    data: {
      userId: user.id,
      plan: 'PERFORMANCE',              // trial dá o produto completo
      status: 'trialing',
      trialStartedAt: now,
      trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 86_400_000),
    },
  });

  return { user, tecnico, equipe, subscription };
});

// Efeitos colaterais fora da transação
void sendTrialWelcomeEmail({ ...result.user, trialEndsAt: result.subscription.trialEndsAt });
void recordLeadFromSignup({ ...payload, source: 'signup' });   // funil unificado
```

**Regras adicionais no endpoint:**
- rate-limit: 3 tentativas por IP por hora, 1 por e-mail por 24h;
- `MAX_REGISTERED_USERS` atingido → `503` com mensagem de lista de espera **e captura do lead** (nunca perder o contato);
- `roleName` **removido do body** — auto-registro sempre cria `ESSENCIAL`/`Tecnico`. Aceitar role do cliente é escalonamento de privilégio.

### 3.4 Superfície de API

| Método | Rota | Auth | Função |
|---|---|---|---|
| `POST` | `/api/auth/register` | Pública | Cria conta + equipe + trial |
| `POST` | `/api/auth/check-email` | Pública | Validação de unicidade em tempo real (rate-limited) |
| `POST` | `/api/auth/resend-verification` | JWT | Reenvia e-mail de verificação |
| `GET` | `/api/me/subscription` | JWT | Status do trial, dias restantes, plano efetivo |
| `GET` | `/api/me/onboarding` | JWT | Progresso do checklist de ativação |
| `GET` | `/api/admin/trials` | Admin | Funil de trials |
| `POST` | `/api/admin/trials/:userId/extend` | Admin | Estender trial (retenção manual) |
| `POST` | `/api/cron/trial-lifecycle` | `CRON_SECRET` | E-mails do ciclo + marcação de expirados |

---

## PARTE IV — PRIMEIRO ACESSO (onde o trial é ganho ou perdido)

> Este é o capítulo mais importante do documento. Cadastro é engenharia resolvida; **ativação é o produto.**

### 4.1 Wizard de boas-vindas — `/bem-vindo`

Três passos, todos puláveis, com progresso salvo:

**Passo 1 — Confirme sua equipe**
Nome (pré-preenchido do cadastro), modalidade, categoria, escudo (opcional).
→ atualiza a `Equipe` já criada no registro.

**Passo 2 — Monte seu elenco**
Três caminhos, e é aqui que a maioria dos produtos falha por oferecer só um:
- **Adição rápida:** grade de 5 linhas (nome + número + posição), sem sair da tela;
- **Colar de planilha:** textarea que aceita colar do Excel/Sheets — parseia nome/número/posição. Baixo custo, altíssimo valor para quem já tem a lista pronta;
- **Usar elenco de demonstração:** cria 12 atletas fictícios marcados `isDemo`, removíveis em um clique.

**Passo 3 — Escolha seu ponto de partida**
Três cartões que levam direto ao valor, em vez de largar o usuário no dashboard:
- *"Vou coletar um jogo ao vivo"* → prepara e abre a coleta;
- *"Tenho uma súmula para lançar"* → coleta pós-jogo;
- *"Quero explorar primeiro"* → dashboard com dados de demonstração.

### 4.2 Modo demonstração — a alavanca subestimada

Já existe `scripts/seed-demo-data.ts`. Transformar em serviço e expor:

```
POST /api/me/demo-data     → popula a equipe com 8 jogos, 12 atletas, eventos e bem-estar
DELETE /api/me/demo-data    → remove tudo marcado isDemo
```

Requer flag `isDemo Boolean @default(false)` em `Jogador`, `Jogo` e nas tabelas de estatística.

**Por que isso importa mais do que parece:** o SCOUT21 é um produto de *análise*. Sem dados, todo gráfico, ranking e insight é uma caixa vazia. Um treinador que entra e vê tela vazia não consegue avaliar nada. Com dados de demonstração ele vê o produto **funcionando** em 10 segundos — e depois substitui pelos dados reais. É a diferença entre "não entendi" e "entendi, quero".

### 4.3 Checklist de ativação (persistente no dashboard)

```
Comece por aqui                                        2 de 5
──────────────────────────────────────────────────────────────
✅ Conta criada
✅ Equipe cadastrada
⬜ Adicionar atletas ao elenco              → Elenco
⬜ Registrar o primeiro jogo                → Coleta
⬜ Confirmar e-mail                         → Reenviar
──────────────────────────────────────────────────────────────
```

Some sozinho ao completar. Sem X para fechar antes disso — é o mapa do usuário, não propaganda.

### 4.4 Definição de ativação

**Um trial está ativado quando o usuário registra o primeiro jogo com pelo menos um evento real (não-demo).**

É a métrica que separa curiosidade de uso. Deve ser rastreada por coorte e é o número que orienta toda otimização do funil.

---

## PARTE V — CICLO DE VIDA DO TRIAL

### 5.1 Máquina de estados

```
                    cadastro
                       │
                       ▼
                  ┌─────────┐   verifica e-mail  ┌──────────┐
                  │ trialing│ ─────────────────► │ trialing │
                  │ não-ver.│                    │ verific. │
                  └────┬────┘                    └─────┬────┘
                7 dias │ sem verificar                 │ dia 30
                       ▼                               ▼
                 ┌──────────┐                    ┌──────────┐
                 │ escrita  │                    │ expired  │
                 │ bloqueada│                    │ leitura  │
                 └──────────┘                    └────┬─────┘
                                                      │ pagamento (futuro)
                                                      ▼
                                                 ┌──────────┐
                                                 │  active  │
                                                 └──────────┘
```

### 5.2 Calendário de e-mails

| Quando | E-mail | Objetivo |
|---|---|---|
| D+0 imediato | **Bem-vindo + verificação** | Confirmar e-mail, link de acesso, data de término explícita |
| D+1 | **Primeiros passos** | 3 ações concretas; só se não ativou |
| D+3 | **Dica prática** | Como coletar o primeiro jogo; só se não ativou |
| D+7 | **Como está indo?** | Resumo do que já registrou; canal de suporte aberto |
| D+15 | **Meio do caminho** | Recurso ainda não usado + 15 dias restantes |
| D+23 | **Faltam 7 dias** | Primeiro aviso de fim, tom informativo |
| D+28 | **Faltam 2 dias** | Aviso claro; dados preservados |
| D+30 | **Teste encerrado** | O que foi construído, dados salvos, como continuar |
| D+37 | **Última chamada** | Retenção; oferta de extensão |

Todos com opt-out. Nenhum dispara para e-mail não verificado (exceto o D+0).

### 5.3 Cron diário

`vercel.json` já tem `crons` configurados. Adicionar:

```json
{ "path": "/api/cron/trial-lifecycle", "schedule": "0 12 * * *" }
```

Protegido por `CRON_SECRET` (padrão já existente). Idempotente — nova tabela `TrialEmailLog(userId, emailKey, sentAt)` com unique `(userId, emailKey)` impede envio duplicado se o cron rodar duas vezes.

### 5.4 Depois da expiração — política de dados

| Marco | Ação |
|---|---|
| D+30 | Escrita bloqueada. Leitura e exportação livres. |
| D+30 a D+90 | Dados intactos. Reativação instantânea. |
| D+90 | Aviso de arquivamento por e-mail (30 dias de antecedência). |
| D+120 | Conta arquivada (`isActive = false`). Dados preservados no banco. |
| Sob demanda | Exclusão total em até 30 dias (LGPD Art. 18). |

**Nunca apagar dados de um trial expirado sem aviso prévio.** Além de exigência legal, um treinador que perde uma temporada de coleta nunca mais volta — e conta para os colegas.

---

## PARTE VI — LANDING PAGE

### 6.1 O problema atual

Todos os CTAs de aquisição saem do produto para o WhatsApp. Isso impõe: (1) atrito de troca de app, (2) dependência de atendimento humano, (3) horário comercial como limite de conversão, (4) perda de rastreabilidade do funil, (5) teto de escala igual à capacidade de resposta de uma pessoa.

### 6.2 Substituições

| Local | Hoje | Novo |
|---|---|---|
| Nav desktop/mobile | `wa.me` "Cadastre-se" | `/criar-conta` — **"Teste grátis"** |
| Hero primário | `wa.me` "Começar agora" | `/criar-conta` — **"Começar teste de 30 dias"** |
| Hero secundário | `wa.me` "Entre em contato" | Âncora para seção "Como funciona" |
| Card Essencial | `wa.me` "Cadastrar Grátis" | `/criar-conta` |
| Card Competição | — | `/criar-conta` — "Testar 30 dias" |
| Plano personalizado | `wa.me` | **Mantido** — venda consultiva legítima |
| Widget flutuante | `wa.me` | **Mantido** — suporte, não aquisição |
| Formulário de contato | `POST /api/leads` | **Mantido**, reposicionado como "Falar com especialista" |

**O WhatsApp não sai do site.** Ele deixa de ser a porta de entrada e vira o canal de suporte e venda consultiva — que é o papel correto dele.

### 6.3 Nova seção obrigatória — "Como funciona o teste grátis"

O silêncio sobre condições gera desconfiança. Quatro cartões, acima da tabela de preços:

```
  ⏱️ 30 dias completos      💳 Sem cartão            🔓 Produto inteiro       💾 Dados preservados
  Acesso total, sem          Nenhum dado de           Todos os recursos       Ao final, seus dados
  compromisso.               pagamento é pedido.      liberados no teste.     continuam seus.
```

Abaixo, em texto de apoio: *"Ao final dos 30 dias você decide se continua. Sem cobrança automática, sem renovação surpresa. Seus dados permanecem acessíveis."*

**Isso remove a objeção número 1 de qualquer trial: "vão me cobrar sem avisar".**

### 6.4 Ajustes de conversão

- **Prova social:** hoje inexistente. Depoimento de treinador ou nome de clube usuário, logo abaixo do hero.
- **Captura de saída:** já existe `NewsletterPopup.tsx` — reaproveitar com oferta do trial em vez de newsletter.
- **Instrumentação de funil:** `landing_view → cta_signup_click → signup_form_start → signup_form_submit → signup_success → activation`.
- **Performance:** LCP < 2.5s e CLS < 0.1 na landing. Toda queda de performance é queda direta de conversão.

---

## PARTE VII — DOMÍNIO E INFRAESTRUTURA

### 7.1 Domínio

Situação: `scout21.vercel.app` como canônico; e-mail saindo de `intersomos.com.br`. Um `.vercel.app` sinaliza produto não-comercial e prejudica entregabilidade de e-mail.

Recomendação: **`scout21.com.br`** (ou `.com` se disponível), com `www` → apex por redirect 301.

Após a compra:
1. apontar DNS para a Vercel (A/CNAME conforme instrução do painel);
2. adicionar o domínio no projeto Vercel, aguardar emissão do certificado;
3. atualizar `CANONICAL_ORIGIN` em [seo.ts:7](../21Scoutpro/utils/seo.ts#L7);
4. atualizar `FRONTEND_URL`, `CORS_ORIGIN`, `PUBLIC_API_URL` nas env vars;
5. redirect 301 permanente de `scout21.vercel.app` (preserva SEO acumulado);
6. reenviar sitemap no Search Console.

### 7.2 Entregabilidade de e-mail — bloqueante

Um trial sem cartão depende inteiramente de e-mail: verificação, boas-vindas, avisos de expiração. E-mail em spam = trial invisível.

Checklist no DNS do domínio:

| Registro | Valor | Função |
|---|---|---|
| SPF | `v=spf1 include:_spf.resend.com ~all` | Autoriza a Resend a enviar |
| DKIM | Fornecido pela Resend | Assinatura criptográfica |
| DMARC | `v=DMARC1; p=quarantine; rua=mailto:dmarc@dominio` | Política e relatórios |
| MX | Provedor de recebimento | Recebe respostas |

Depois: verificar o domínio no painel da Resend, atualizar `EMAIL_FROM` para `SCOUT21 <nao-responda@scout21.com.br>`, `EMAIL_REPLY_TO` para um endereço **monitorado por humano**, e testar em Gmail, Outlook e Yahoo antes de abrir o cadastro.

### 7.3 Variáveis de ambiente novas

```bash
TRIAL_DURATION_DAYS=30
TRIAL_PLAN=PERFORMANCE
EMAIL_VERIFICATION_GRACE_DAYS=7
SIGNUP_RATE_LIMIT_PER_IP_HOUR=3
SIGNUP_ENABLED=true                 # kill-switch de emergência
DISPOSABLE_EMAIL_BLOCKLIST=true
FRONTEND_URL=https://scout21.com.br
CORS_ORIGIN=https://scout21.com.br
EMAIL_FROM="SCOUT21 <nao-responda@scout21.com.br>"
```

**`SIGNUP_ENABLED` como kill-switch:** se algo der errado no primeiro dia (bots, bug, custo), desliga o cadastro sem deploy.

---

## PARTE VIII — LGPD E OBRIGAÇÕES LEGAIS

Coletar nome, e-mail, telefone e dados de atletas (incluindo **dados de saúde**: lesões, bem-estar, PSE, qualidade de sono) torna a conformidade obrigatória, não opcional. Dados de saúde são **dados pessoais sensíveis** (LGPD Art. 5º, II) e exigem base legal e cuidado reforçados.

| Item | Estado | Ação |
|---|---|---|
| Banner de consentimento | `ConsentBanner.tsx` existe | Revisar e ligar às políticas |
| Política de Privacidade | Inexistente | Criar `/privacidade` |
| Termos de Uso | Inexistente | Criar `/termos` |
| Aceite no cadastro | Inexistente | Checkbox obrigatório + log (timestamp, IP, versão) |
| Exportação de dados | Parcial | Endpoint de exportação completa |
| Exclusão de conta | Inexistente | Autoatendimento em Configurações |
| Encarregado (DPO) | Indefinido | Nomear e publicar contato |
| Base legal p/ dados de atleta | Indefinida | Documentar; o clube é controlador, SCOUT21 é operador |

**Nota importante:** o técnico cadastra dados de terceiros (os atletas). Isso precisa estar explícito nos Termos — a responsabilidade pelo consentimento dos atletas é do clube/técnico (controlador); o SCOUT21 atua como operador. Sem essa cláusula, o risco recai sobre a plataforma.

---

## PARTE IX — MÉTRICAS

### 9.1 Funil

```
Visita landing                      100%
  └─ Clique em "Teste grátis"        8–15%   saudável
      └─ Início do formulário        60–75%
          └─ Cadastro concluído      70–85%
              └─ E-mail verificado   60–75%
                  └─ Ativação        35–50%   ← a métrica que importa
                      └─ Uso semanal 40–60%
                          └─ Conversão (futuro) 10–20%
```

### 9.2 North Star

**Trials ativados por semana** — usuários que registraram o primeiro jogo real (§4.4). Não "cadastros": cadastro sem ativação é ruído.

### 9.3 Painel admin — `/admin/trials`

Estender o `platformAdmin` existente:

```
Trials ativos          42     Expirando em 7 dias    8
Ativados               27     Expirados (30d)       15
Taxa de ativação      64%     Tempo médio p/ ativar  2,3 dias

[tabela: usuário · equipe · cadastro · dias restantes · ativado · último acesso · ações]
```

Ação por linha: estender trial, reenviar verificação, ver detalhe, contatar.

### 9.4 Alertas operacionais

- Taxa de ativação semanal < 30% → o onboarding quebrou;
- Zero cadastros em 48h → o funil quebrou;
- Bounce de e-mail > 5% → entregabilidade em risco;
- Cadastros > 50/h → provável ataque de bot.

---

## PARTE X — PLANO DE EXECUÇÃO

### Sprint T1 — Fundação (bloqueante)

| # | Entrega | Arquivos |
|---|---|---|
| 1 | Model `Subscription` + enum + migration | `prisma/schema.prisma` |
| 2 | Backfill: `Subscription(active)` para todos os usuários existentes | `scripts/backfill-subscriptions.ts` |
| 3 | `resolveEffectiveAccess()` + testes unitários | `utils/subscription.helper.ts` |
| 4 | `subscriptionContext()` + `requireActiveSubscription()` | `middleware/subscription.middleware.ts` |
| 5 | Aplicar middlewares nas rotas de dados | `app.ts` |
| 6 | `GET /api/me/subscription` | `me.routes.ts` |

**Aceite:** usuários existentes não percebem mudança nenhuma. Trial forjado com `trialEndsAt` no passado → `402` em escrita, `200` em leitura.

### Sprint T2 — Cadastro (bloqueante)

| # | Entrega | Arquivos |
|---|---|---|
| 7 | `register` transacional: User + Tecnico + **Equipe** + Subscription | `auth.controller.ts` |
| 8 | Rate-limit + política de senha + blocklist de descartáveis | `middleware/rateLimit.middleware.ts` |
| 9 | Remover `roleName` do body público | `auth.controller.ts` |
| 10 | `POST /api/auth/check-email` | `auth.routes.ts` |
| 11 | Tela `/criar-conta` | `components/SignUp.tsx` **(novo)** |
| 12 | `authApi.register()` no cliente | `services/api.ts` |
| 13 | Rota `/criar-conta` no SPA | `App.tsx` |
| 14 | E-mail de boas-vindas do trial (novo template) | `templates/trial-welcome.ts` |

**Aceite:** cadastro completo em navegador anônimo, sem contato humano, terminando logado no dashboard com equipe criada.

### Sprint T3 — Ativação (bloqueante para conversão)

| # | Entrega | Arquivos |
|---|---|---|
| 15 | Flag `isDemo` nos models relevantes | `schema.prisma` |
| 16 | `POST/DELETE /api/me/demo-data` | `services/demoData.service.ts` |
| 17 | Wizard `/bem-vindo` (3 passos) | `components/onboarding/` **(novo)** |
| 18 | Colar-de-planilha no passo de elenco | `components/onboarding/RosterPaste.tsx` |
| 19 | Checklist de ativação no dashboard | `components/OnboardingChecklist.tsx` |
| 20 | `GET /api/me/onboarding` | `me.controller.ts` |
| 21 | Banner de status do trial | `components/TrialBanner.tsx` |

**Aceite:** do cadastro ao primeiro jogo registrado em menos de 5 minutos, sem consultar documentação.

### Sprint T4 — Landing e domínio (bloqueante)

| # | Entrega |
|---|---|
| 22 | Substituir CTAs WhatsApp → `/criar-conta` |
| 23 | Seção "Como funciona o teste grátis" |
| 24 | Prova social no hero |
| 25 | Instrumentação do funil |
| 26 | Domínio comprado e apontado |
| 27 | SPF/DKIM/DMARC + verificação Resend |
| 28 | `/privacidade` e `/termos` + aceite no cadastro |

**Aceite:** e-mails chegam na caixa de entrada (Gmail, Outlook, Yahoo). Nenhum CTA de aquisição aponta para WhatsApp.

### Sprint T5 — Ciclo de vida

| # | Entrega |
|---|---|
| 29 | 9 templates de e-mail do ciclo |
| 30 | `TrialEmailLog` (idempotência) |
| 31 | `POST /api/cron/trial-lifecycle` + entrada no `vercel.json` |
| 32 | Soft gate de verificação (7 dias) |
| 33 | Tela de trial expirado com exportação |

### Sprint T6 — Guia e operação

| # | Entrega |
|---|---|
| 34 | Guia de uso (`/guia`, in-app, versionado com o produto) |
| 35 | Painel `/admin/trials` |
| 36 | Ação de estender trial |
| 37 | Alertas operacionais |
| 38 | E2E: cadastro → ativação → expiração |

### Ordem de dependências

```
T1 ──► T2 ──► T3 ──► lançamento possível
        │      │
        └──► T4 ┘        (T4 pode correr em paralelo a T3)
                └──► T5 ──► T6
```

**T1 → T2 → T3 → T4 é o caminho crítico.** T5 e T6 podem entrar com o trial já no ar.

---

## PARTE XI — RISCOS

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | E-mails em spam | Alta | Crítico | SPF/DKIM/DMARC antes de abrir cadastro; teste em 3 provedores |
| R2 | Bots inflando a base | Média | Alto | Rate-limit, blocklist, `SIGNUP_ENABLED`, alerta de volume |
| R3 | Ativação baixa (tela vazia) | Alta | Crítico | Wizard + dados demo + checklist (T3 é bloqueante) |
| R4 | Enforcement contornável | Média | Alto | Verificação server-side por data; nunca confiar no cliente |
| R5 | Custo de infra com volume | Baixa | Médio | `MAX_REGISTERED_USERS` como teto; monitorar Supabase |
| R6 | `MAX_REGISTERED_USERS` mata signup em silêncio | Média | Alto | `503` + captura de lead + alerta ao admin |
| R7 | Backfill quebra contas existentes | Média | Crítico | Fallback `!subscription → active`; testar em staging |
| R8 | JWT de 8h desloga durante o trial | Alta | Médio | Refresh token ou TTL de 30 dias com rotação |
| R9 | LGPD sem políticas publicadas | Alta | Alto | T4 bloqueante; não abrir cadastro sem `/termos` e `/privacidade` |
| R10 | Suporte sem escala | Média | Médio | Guia + FAQ antes de abrir; WhatsApp segue como suporte |
| R11 | Trial expira e usuário perde dados | Baixa | Crítico | Leitura e exportação sempre liberadas; nunca apagar sem aviso |

---

## PARTE XII — CRITÉRIOS DE ACEITE

### Critério de sucesso do usuário (a régua definida no briefing)

> *Uma pessoa consegue chegar à landing page, cadastrar-se e começar o teste sem precisar falar com a equipa pelo WhatsApp.*

Teste de validação, em navegador anônimo, sem nenhuma intervenção humana:

1. Acessar o domínio oficial → landing carrega em < 2,5s ✅
2. Clicar em "Começar teste grátis" → `/criar-conta` ✅
3. Preencher 4 campos + aceite → conta criada ✅
4. E-mail de boas-vindas na **caixa de entrada** em < 60s ✅
5. Redirecionado logado para `/bem-vindo` ✅
6. Concluir o wizard → equipe com elenco ✅
7. Registrar um jogo → dados persistidos ✅
8. Dashboard mostra "Faltam 30 dias" ✅
9. **Em nenhum momento foi necessário WhatsApp, cartão ou Pix** ✅

### Critérios técnicos

- [ ] Migration aplicada sem downtime; contas existentes intactas
- [ ] `resolveEffectiveAccess()` com cobertura de teste em todos os estados
- [ ] Trial expirado: `402` em escrita, `200` em leitura, exportação funcional
- [ ] Rate-limit verificado com carga sintética
- [ ] E-mails entregues em Gmail, Outlook e Yahoo (inbox, não spam)
- [ ] Cron idempotente — execução dupla não duplica e-mail
- [ ] E2E cobrindo cadastro → ativação → expiração
- [ ] Funil instrumentado ponta a ponta
- [ ] `/termos` e `/privacidade` publicados e vinculados ao cadastro
- [ ] `SIGNUP_ENABLED=false` derruba o cadastro sem deploy

### Metas dos primeiros 30 dias

| Métrica | Meta mínima | Meta boa |
|---|---|---|
| Cadastros | 20 | 50 |
| Verificação de e-mail | 60% | 75% |
| Ativação | 35% | 50% |
| Tempo até ativar | < 24h | < 1h |
| Uso na 2ª semana | 40% | 60% |

---

## PARTE XIII — GANCHO DE PAGAMENTO (futuro, sem retrabalho)

Quando o pagamento entrar, **nada do que foi construído muda**. Adiciona-se:

1. Provedor (Stripe, Mercado Pago ou Asaas) → preencher `provider`, `providerCustomerId`, `providerSubscriptionId`;
2. Webhook → `POST /api/billing/webhook` atualizando `status` e `currentPeriodEnd`;
3. Checkout → tela de upgrade a partir do banner de trial;
4. Portal do cliente → gestão de assinatura.

O `requireActiveSubscription()` já trata `past_due` e `canceled` — os estados existem no enum desde o dia 1. O middleware **não precisa ser tocado**.

---

## ANEXO A — MAPA DE ARQUIVOS

### Novos

```
backend/
  prisma/migrations/xxx_add_subscriptions/
  src/middleware/subscription.middleware.ts
  src/middleware/rateLimit.middleware.ts
  src/utils/subscription.helper.ts
  src/services/demoData.service.ts
  src/services/trialLifecycle.service.ts
  src/services/email/templates/trial-*.ts        (9 templates)
  src/controllers/billing.controller.ts          (stub para o futuro)
  scripts/backfill-subscriptions.ts

21Scoutpro/
  components/SignUp.tsx
  components/TrialBanner.tsx
  components/TrialExpired.tsx
  components/OnboardingChecklist.tsx
  components/onboarding/WelcomeWizard.tsx
  components/onboarding/RosterPaste.tsx
  components/legal/PrivacyPolicy.tsx
  components/legal/TermsOfService.tsx
  components/GuidePage.tsx
  hooks/useSubscription.ts

docs/
  GUIA_DE_USO.md
  TRIAL_OPERATIONS.md
```

### Modificados

```
backend/src/app.ts                      middlewares nas rotas
backend/src/controllers/auth.controller.ts   register transacional
backend/src/controllers/me.controller.ts     subscription + onboarding
backend/src/config/env.ts                    novas variáveis
backend/prisma/schema.prisma                 Subscription, isDemo, TrialEmailLog
21Scoutpro/App.tsx                           rotas novas
21Scoutpro/components/LandingPage.tsx        CTAs + seção do trial
21Scoutpro/components/Login.tsx              link para cadastro
21Scoutpro/services/api.ts                   register, subscription, demo
21Scoutpro/config.ts                         gating por plano efetivo
21Scoutpro/utils/seo.ts                      domínio canônico
vercel.json                                  cron do ciclo de vida
```

---

## ANEXO B — DECISÕES E JUSTIFICATIVAS

| # | Decisão | Por quê |
|---|---|---|
| D1 | `Subscription` em vez de campos em `User` | Pagamento futuro sem refatoração |
| D2 | Trial dá `PERFORMANCE`, não `ESSENCIAL` | Testar o produto capado não vende o produto |
| D3 | Expiração calculada por data, nunca por flag | Flag persistido dessincroniza; data é a verdade |
| D4 | Leitura liberada após expirar | Decência com o usuário + melhor alavanca de conversão |
| D5 | HTTP `402` para trial expirado | Semanticamente correto, trivial no cliente |
| D6 | Verificação de e-mail como soft gate (7 dias) | Bloquear na hora derruba ativação; não bloquear enche de lixo |
| D7 | 4 campos no formulário | Cada campo extra derruba conversão; o resto vem no wizard |
| D8 | `Equipe` criada no registro | Sem ela o dashboard nasce vazio — trial morto na chegada |
| D9 | Dados de demonstração | Produto de análise sem dados é caixa vazia |
| D10 | WhatsApp mantido como suporte | Canal legítimo; só deixa de ser a porta de entrada |
| D11 | Ativação = primeiro jogo real | Cadastro sem uso é ruído; jogo registrado é intenção |
| D12 | `SIGNUP_ENABLED` kill-switch | Cadastro público precisa de freio de emergência |

---

**Fim do documento.**
Supersede a parte de aquisição de `SCOUT21_MASTER_REF.md`. Complementar a `PLANO_MESTRE_COLETA_V2.md` (experiência de coleta), que permanece válido e é a peça que o trial precisa entregar bem para converter.

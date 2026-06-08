# Web Assistant (Assistente Scout21 no Dashboard)

Arquitetura do chat web integrado ao dashboard Scout21, usando Hermes como motor de conversa.

## Fluxo

```
Browser (JWT) → POST /api/web-assistant/chat/stream (Vercel BFF)
  → Hermes API VPS (/v1/chat/completions, Bearer HERMES_WEB_API_KEY)
    → Scout21 Assistant API (/api/assistant/*, X-Assistant-Token + X-Scout21-User-Id)
```

O browser **nunca** fala com a VPS diretamente. O `userId` vem exclusivamente do JWT (`req.user.id`); headers ou body do cliente são ignorados para escopo de dados.

## Variáveis de ambiente (Vercel)

| Variável | Descrição |
|----------|-----------|
| `HERMES_WEB_API_URL` | Base URL pública do Hermes web (ex. `https://vps.example.com/hermes-web`) |
| `HERMES_WEB_API_KEY` | Bearer token (`API_SERVER_KEY` gerado no VPS) |
| `ASSISTANT_SERVICE_TOKEN` | Token service-to-service Hermes → Scout21 (já existente) |

## Rotas BFF

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/web-assistant/status` | JWT + tenant | `{ enabled, userName, role, userType, equipeCount }` |
| POST | `/api/web-assistant/chat/stream` | JWT + tenant | Proxy SSE → Hermes |

Rate limit: 30 requisições/minuto por `userId`.

## Hermes VPS

Pacote: `vps/servidor/scout21-web-assistant/`

- API server na porta **8642**
- Caddy snippet: `docker/vps-caddy-hermes-web.snippet` → `/hermes-web/*`
- Skills usam header **`X-Scout21-User-Id`** (UUID do usuário da sessão web)

Deploy:

```bash
cd vps/servidor/scout21-web-assistant
cp secrets/hermes.env.example secrets/hermes.env
# editar secrets/hermes.env (OPENROUTER_API_KEY, ASSISTANT_SERVICE_TOKEN, SCOUT21_API_URL)
docker compose -f docker-compose.scout21-web-assistant-hermes.yml up -d
./scripts/configure-hermes.sh
# copiar API_SERVER_KEY para HERMES_WEB_API_KEY na Vercel
```

## Frontend

- Rota: `/dashboard/assistente` (History API, SPA)
- Componentes: `21Scoutpro/components/assistant/*`
- Entrada: card na Visão Geral, item no sidebar, atalho no header mobile

## Isolamento multi-tenant

1. JWT valida identidade → `req.user.id`
2. `tenantMiddleware` resolve `equipe_ids` / `jogador_id`
3. System prompt injeta `[SCOUT21_SESSION userId=... role=... equipeIds=...]`
4. Hermes skills chamam Assistant API com `X-Scout21-User-Id` — validado em `resolveUserFromServiceContext`

## Test plan

### Staff (Daniel / Chopinzinho)

1. Login como Daniel
2. Abrir `/dashboard/assistente`
3. Enviar: "Qual foi o último jogo?"
4. Confirmar dados apenas do Cel Chopinzinho

### Isolamento

1. Login como segundo usuário (outra equipe)
2. Mesma pergunta — não deve retornar dados do Chopinzinho

### Atleta

1. Login como atleta vinculado
2. Quick actions de PSE/bem-estar/agenda
3. Confirmar que endpoints staff não são expostos

### Reset Telegram Daniel

Daniel tinha `telegramCoachChatId` incorreto (chat de teste do Bruno). Executar:

```bash
cd apps/scout21/backend
npx tsx scripts/reset-daniel-telegram-link.ts
```

Web assistant **não depende** de `telegramCoachChatId`.

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `enabled: false` no status | `HERMES_WEB_API_URL` ou `HERMES_WEB_API_KEY` ausentes na Vercel |
| 502 no chat | Hermes VPS offline ou Caddy mal configurado |
| 429 | Rate limit — aguardar 1 minuto |
| Dados de outro clube | Bug crítico — verificar `X-Scout21-User-Id` nas skills e `resolveUserFromServiceContext` |

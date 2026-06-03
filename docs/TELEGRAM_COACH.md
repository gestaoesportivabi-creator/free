# Bot Telegram — Técnico (@scout21coachbot)

Assistente de IA para comissão técnica. **Separado** do bot de atleta [@scout21bot](TELEGRAM_BOT.md).

## Arquitetura

- **Hermes (VPS)** — dono da conversa no Telegram
- **Assistant API** (`/api/assistant/*`) — dados e insights multi-tenant
- **n8n** — não usado neste fluxo

## Variáveis (Vercel / `backend/.env`)

```env
ASSISTANT_SERVICE_TOKEN=     # openssl rand -hex 32 — compartilhado com Hermes VPS
CRON_SECRET=                 # já usado pelo cron de atleta
PUBLIC_API_URL=https://gestaoesportiva-free.vercel.app
```

## Migration

```bash
cd backend
npx prisma db execute --file migrations/024_add_telegram_coach_chat_id.sql
npx prisma generate
```

## Fluxo do técnico

1. Abre `@scout21coachbot` no Telegram
2. `/vincular email@clube.com senha` — Hermes chama `POST /api/assistant/link`
3. Perguntas em linguagem natural — Hermes consulta a API e responde

## Endpoints (Hermes consome)

| Endpoint | Uso |
|----------|-----|
| `POST /link` | Vincular chat |
| `POST /unlink` | Desvincular |
| `GET /briefing` | Briefing do dia / pré-jogo |
| `GET /readiness` | Prontidão 0-100 + alertas |
| `GET /roster-status` | Elenco (disponível/lesionado) |
| `GET /last-match` | Última partida |
| `GET /player/:id` | Status de um jogador |
| `GET /wellness-engagement` | Alertas bem-estar equipe |
| `GET /pending-wellness` | Quem não preencheu hoje |
| `POST /query` | Pacote consolidado |
| `GET /cron/briefings` | Cron — todos os técnicos vinculados |

Headers: `X-Assistant-Token`, `X-Telegram-Chat-Id`

## Cron

Vercel: `0 11 * * *` (8h BRT) → `/api/assistant/cron/briefings`

## Setup Hermes

Ver `vps/servidor/docker/scout21-coach-hermes-setup.md` e pacote `vps/servidor/scout21-coach/`.

## Segurança

- Técnico A nunca vê dados do clube B (tenant isolation)
- Não commitar `ASSISTANT_SERVICE_TOKEN`
- Roles permitidas: ESSENCIAL, COMPETICAO, PERFORMANCE, ADMINISTRADOR

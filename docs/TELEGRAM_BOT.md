# Bot Telegram — Scout 21 Pro (@scout21bot)

## Segurança do token

- **Nunca** commite `TELEGRAM_BOT_TOKEN` no Git.
- Se o token vazou (chat, print, etc.), revogue em [@BotFather](https://t.me/BotFather) → `/revoke` e gere um novo.
- Configure só em variáveis de ambiente (local `.env`, Vercel).

## Variáveis de ambiente (backend)

```env
TELEGRAM_BOT_TOKEN=          # BotFather
TELEGRAM_WEBHOOK_SECRET=     # string aleatória longa (ex. openssl rand -hex 32)
TELEGRAM_POLLING=false       # true só em dev local
PUBLIC_API_URL=https://gestaoesportiva-free.vercel.app
```

## Migration

```bash
cd backend
npx prisma db execute --file migrations/022_add_telegram_chat_id.sql
npx prisma generate
```

## Comandos do bot (atleta)

| Comando | Descrição |
|---------|-----------|
| `/start` ou `/ajuda` | Ajuda |
| `/vincular email@x.com senha` | Liga o Telegram à conta ATLETA |
| `/hoje` | O que falta preencher hoje (bem-estar, PSE, PSR) |
| `/sair` | Desvincula este chat |

Preenchimento completo de escalas pelo Telegram virá em fase 2; por ora use o app web após ver `/hoje`.

## Produção (Vercel + webhook)

1. Deploy com as env vars acima.
2. Registre o webhook (uma vez):

```bash
curl -X POST "https://gestaoesportiva-free.vercel.app/api/telegram/register-webhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://gestaoesportiva-free.vercel.app"}'
```

3. Teste no Telegram: [@scout21bot](https://t.me/scout21bot)

## Desenvolvimento local (polling)

Sem HTTPS público, use long polling:

```env
TELEGRAM_POLLING=true
TELEGRAM_BOT_TOKEN=...
# TELEGRAM_WEBHOOK_SECRET opcional em dev
```

```bash
cd backend && npm run dev
```

Mensagens ao bot são recebidas via `getUpdates`.

## Endpoints

| Método | Rota | Uso |
|--------|------|-----|
| POST | `/api/telegram/webhook` | Telegram envia updates (header `X-Telegram-Bot-Api-Secret-Token`) |
| GET | `/api/telegram/status` | Diagnóstico |
| POST | `/api/telegram/register-webhook` | Configura webhook na Meta API |
| POST | `/api/telegram/delete-webhook` | Remove webhook |

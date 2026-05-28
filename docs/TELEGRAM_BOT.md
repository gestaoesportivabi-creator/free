# Bot Telegram — Scout 21 Pro (@scout21bot)

## Segurança

- **Nunca** commite `TELEGRAM_BOT_TOKEN` nem `CRON_SECRET` no Git.
- Token vazado → [@BotFather](https://t.me/BotFather) `/revoke` e token novo.

## Variáveis (Vercel / `backend/.env`)

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=     # openssl rand -hex 32
PUBLIC_API_URL=https://gestaoesportiva-free.vercel.app
CRON_SECRET=                 # openssl rand -hex 32 (lembretes 7h BRT)
TELEGRAM_POLLING=false       # true só em dev local
```

## Migrations

```bash
cd backend
npx prisma db execute --file migrations/022_add_telegram_chat_id.sql
npx prisma db execute --file migrations/023_telegram_sessions.sql
npx prisma generate
```

## O que o bot faz (completo)

| Comando / ação | Função |
|----------------|--------|
| `/vincular email senha` | Liga Telegram à conta ATLETA |
| `/hoje` | Status do dia + botões do que falta |
| `/preencher` | Menu para registrar pendências |
| Botões 0–10 | Bem-estar (5 dimensões), PSE/PSR treino e jogo |
| Cron 10:00 UTC | Lembrete matinal (7h Brasil) se houver pendências |
| `/sair` | Desvincular |

Dados gravados no **mesmo Supabase** do app; cada dia renova tarefas; dias anteriores permanecem no banco.

## Bot não responde?

1. Vercel → `TELEGRAM_BOT_TOKEN` (token novo do BotFather) + redeploy.
2. Abra no navegador: `https://gestaoesportiva-free.vercel.app/api/telegram/diagnose`
3. Se `webhookMatches: false`, rode register-webhook (abaixo).
4. Se `last_error_message` aparecer, copie e corrija (geralmente token ou URL errada).

## Produção

1. Env vars no Vercel.
2. Migrations no banco.
3. Deploy.
4. Registrar webhook:

```bash
curl -X POST "https://gestaoesportiva-free.vercel.app/api/telegram/register-webhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://gestaoesportiva-free.vercel.app"}'
```

5. Testar [@scout21bot](https://t.me/scout21bot).

## Dev local (polling)

```env
TELEGRAM_POLLING=true
TELEGRAM_BOT_TOKEN=...
```

```bash
cd backend && npm run dev
```

## Cron manual (teste)

```bash
curl -X POST "https://gestaoesportiva-free.vercel.app/api/telegram/cron/reminders" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

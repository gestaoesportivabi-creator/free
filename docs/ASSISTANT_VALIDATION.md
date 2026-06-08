# Validação — Assistant API e multi-tenant

Checklist antes de produção no Supabase `mymuvraqtnoqrtuzoimj`.

## 1. Migrations aplicadas

Execute no SQL Editor ou via CLI:

```sql
-- 021: role ATLETA + users.jogador_id
SELECT id, name FROM roles WHERE name = 'ATLETA';

-- 022: telegram atleta
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'telegram_chat_id';

-- 023: telegram_sessions
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_sessions');

-- 024: telegram coach
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'telegram_coach_chat_id';
```

Via CLI:

```bash
cd backend
npx prisma db execute --file migrations/021_add_athlete_user.sql
npx prisma db execute --file migrations/022_add_telegram_chat_id.sql
npx prisma db execute --file migrations/023_telegram_sessions.sql
npx prisma db execute --file migrations/024_add_telegram_coach_chat_id.sql
```

## 2. Variáveis Vercel

- [ ] `ASSISTANT_SERVICE_TOKEN` definido
- [ ] `CRON_SECRET` definido
- [ ] `DATABASE_URL` aponta para `mymuvraqtnoqrtuzoimj`
- [ ] Redeploy após env vars

## 3. Testes manuais

```bash
# Status
curl https://gestaoesportiva-free.vercel.app/api/assistant/status

# Link (substituir valores)
curl -X POST .../api/assistant/link \
  -H "X-Assistant-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatId":"123","email":"tecnico@test.com","password":"..."}'

# Briefing (apos link)
curl .../api/assistant/briefing \
  -H "X-Assistant-Token: $TOKEN" \
  -H "X-Telegram-Chat-Id: 123"

# Historico de jogos
curl .../api/assistant/matches?limit=20 \
  -H "X-Assistant-Token: $TOKEN" \
  -H "X-Telegram-Chat-Id: 123"
```

## 4. Isolamento multi-tenant

- [ ] Técnico A com `telegram_coach_chat_id` X só vê equipes do tenant A
- [ ] `GET /player/:id` com jogador de outro clube → 404 ou 403
- [ ] Dois técnicos vinculados a chats diferentes não compartilham dados

Teste: vincular duas contas de clubes diferentes; confirmar elencos distintos.

## 5. Roles

- [ ] ATLETA não consegue linkar em `/assistant/link`
- [ ] ESSENCIAL/COMPETICAO/PERFORMANCE/ADMINISTRADOR conseguem

## 6. LGPD

- [ ] Hermes não loga senhas
- [ ] Memória Hermes não persiste dados clínicos desnecessários

## 7. Cron

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://gestaoesportiva-free.vercel.app/api/assistant/cron/briefings
```

Esperado: `{ success: true, data: { sent: N, briefings: [...] } }`

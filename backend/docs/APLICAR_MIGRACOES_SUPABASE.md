# Aplicar migrações faltantes no Supabase (produção)

Se GET /api/players ou GET /api/matches retornam 500 com erro do tipo **"column X does not exist"**, o banco em produção está sem colunas que o Prisma espera. Aplique as migrações abaixo no Supabase.

## Causa

- `jogadores.max_loads_json` não existe → migração **009**
- `jogos.post_match_event_log` (e colunas relacionadas) não existem → migração **011**

## Opção A – Supabase SQL Editor (recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard), abra o projeto e vá em **SQL Editor**.
2. Execute **primeiro** o bloco SQL da migração 009 (abaixo).
3. Depois execute o bloco SQL da migração 011 (abaixo).

Os scripts usam `ADD COLUMN IF NOT EXISTS`, então executar de novo não quebra nada.

### Migração 009 – jogadores (max_loads_json, foto_url TEXT)

```sql
-- Migration: Adicionar maxLoadsJson e alterar foto_url para TEXT
-- Permite salvar cargas máximas (exercícios) e fotos em base64

ALTER TABLE jogadores ALTER COLUMN foto_url TYPE TEXT;
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS max_loads_json JSONB;
```

### Migração 011 – jogos (post_match_event_log, lineup, etc.)

```sql
-- Adicionar campos JSON na tabela jogos
ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS post_match_event_log JSONB,
ADD COLUMN IF NOT EXISTS player_relationships JSONB,
ADD COLUMN IF NOT EXISTS lineup JSONB,
ADD COLUMN IF NOT EXISTS substitution_history JSONB;

COMMENT ON COLUMN jogos.post_match_event_log IS 'Log de eventos da partida (passes com receptor, etc.)';
COMMENT ON COLUMN jogos.player_relationships IS 'Relações entre jogadores (passes/assistências entre pares)';
COMMENT ON COLUMN jogos.lineup IS 'Escalação (players, bench, ballPossessionStart)';
COMMENT ON COLUMN jogos.substitution_history IS 'Histórico de substituições';
```

## Opção B – Linha de comando (psql)

Use a connection string **direta** do Supabase (porta 5432, a mesma de `DIRECT_URL`):

```bash
cd backend
psql "<DIRECT_URL>" -f migrations/009_add_maxloads_and_fotourl_text.sql
psql "<DIRECT_URL>" -f migrations/011_add_match_json_fields.sql
```

Substitua `"<DIRECT_URL>"` pela URL real (entre aspas se tiver caracteres especiais).

Ou use o script fornecido (requer `psql` e variável `DIRECT_URL`):

```bash
cd backend
./scripts/apply-migrations-supabase.sh
```

## Se ainda faltar coluna

Se outro endpoint passar a dar "column X does not exist", procure em [backend/migrations/](../migrations/) qual arquivo adiciona essa coluna e aplique-o no Supabase na ordem numérica (000, 001, …).

## Depois de aplicar

Não é necessário redeploy na Vercel. GET /api/players e GET /api/matches devem deixar de retornar 500 por coluna inexistente.

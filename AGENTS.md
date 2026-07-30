# AGENTS — SCOUT 21 PRO

Leia primeiro: **[docs/ONBOARDING_IA.md](./docs/ONBOARDING_IA.md)**

## Caminho local (obrigatório)

```
/Users/bno/Documents/Projetos/apps/scout21
```

Não use `/Users/bno/Documents/FREE Scout` — essa pasta **não existe** e quebra o terminal do Cursor.

## Stack rápida

| Camada | Pasta | Tech |
|--------|--------|------|
| Frontend | `21Scoutpro/` | React + Vite |
| Backend | `backend/` | Express + Prisma + PostgreSQL |
| Deploy | raiz (`vercel.json`, `api/`) | Vercel serverless |
| Banco | Supabase Scout | `mymuvraqtnoqrtuzoimj` |

## Produção

- App: https://gestaoesportiva-free.vercel.app
- Repo: https://github.com/gestaoesportivabi-creator/free
- Branch padrão: `main`

## MCP (Cursor)

Ver **[docs/MCP_CURSOR.md](./docs/MCP_CURSOR.md)**.  
Servidor principal do produto: **`supabase-scout`**.

## Segredos

- Nunca commitar `.env`, `.env.local`, `.env.vercel`, `docs/ACESSOS_*.local.md`
- Template sem segredo: `docs/ONBOARDING_COLABORADOR.template.md`
- Valores locais: `docs/ACESSOS_COLABORADOR.local.md` (gitignored) + `backend/.env`

## Regras

- Não fazer force-push em `main`
- Migrations DDL via SQL Editor / CLI se MCP estiver read-only
- Preferir API/Prisma; não inventar Google Sheets (legado em `_archived/`)

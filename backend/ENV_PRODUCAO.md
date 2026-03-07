# Variáveis de ambiente para produção (Vercel + Supabase)

Para que a aplicação em **produção** persista dados no **Supabase** (e não apenas localmente no navegador), configure as variáveis abaixo no projeto Vercel.

## Onde configurar

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard).
2. Abra **Settings** → **Environment Variables**.
3. Adicione cada variável para o ambiente **Production** (e opcionalmente Preview/Development).

## Variáveis obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| **DATABASE_URL** | Connection string do Supabase (PostgreSQL). Use a URL com **pooler** (porta 6543) para conexões serverless. | `postgresql://postgres.[ref]:[SENHA]@aws-0-[regiao].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| **DIRECT_URL** | URL direta (sem pooler) para migrações e operações que exigem conexão direta. Porta 5432. | `postgresql://postgres.[ref]:[SENHA]@aws-0-[regiao].pooler.supabase.com:5432/postgres` |
| **JWT_SECRET** | Chave secreta para assinatura dos tokens JWT (login). Use um valor forte e único em produção; não use o default de desenvolvimento. | string longa e aleatória |

## Variáveis opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| **NODE_ENV** | Ambiente de execução. O Vercel costuma definir como `production` automaticamente. | `production` no deploy |
| **CORS_ORIGIN** | Origem permitida para CORS. Em produção no Vercel, o backend costuma aceitar o mesmo domínio. | - |
| **JWT_EXPIRES_IN** | Validade do token (ex.: `7d`). | `7d` |

## Como obter DATABASE_URL e DIRECT_URL no Supabase

1. No [Supabase Dashboard](https://supabase.com/dashboard), abra o projeto.
2. Vá em **Project Settings** → **Database**.
3. Em **Connection string**, escolha **URI** e copie a connection string.
4. Para **DATABASE_URL**: use a opção **Transaction** (pooler, porta 6543) e adicione `?pgbouncer=true` ao final.
5. Para **DIRECT_URL**: use a opção **Session** (porta 5432) ou a mesma URL do banco direto.

Substitua `[YOUR-PASSWORD]` pela senha do banco (ou use a senha que você definiu no projeto).

## Sem essas variáveis

- **DATABASE_URL** ou **DIRECT_URL** ausentes: o Prisma não conecta ao Supabase; as rotas que acessam o banco (ex.: `POST /api/players`, `POST /api/matches`) retornam **500 Internal Server Error**.
- **JWT_SECRET** ausente ou igual ao default: risco de segurança; tokens podem ser forjados.

Após alterar variáveis no Vercel, faça um novo **Redeploy** do projeto para que as mudanças tenham efeito.

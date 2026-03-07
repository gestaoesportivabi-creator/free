# Setup da Versao Free (Git + Supabase + Vercel)

## 1) Git (repositorio novo)

Depois de criar o repositorio no GitHub, rode:

```bash
cd "/Users/bno/Documents/gestaoesportiva-free"
git remote add origin https://github.com/<seu-usuario-ou-org>/gestaoesportiva-free.git
git push -u origin main
```

## 2) Supabase (projeto novo)

No painel do projeto novo, copie estes valores:

- Project URL
- anon public key
- service_role key
- Database password
- Connection string Postgres

`DATABASE_URL` do backend deve ficar no formato:

```env
DATABASE_URL=postgresql://postgres:<DB_PASSWORD_URL_ENCODED>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

## 3) Backend local (`backend/.env`)

Crie/atualize:

```env
DATABASE_URL=postgresql://postgres:<DB_PASSWORD_URL_ENCODED>@db.<PROJECT_REF>.supabase.co:5432/postgres
PORT=3000
NODE_ENV=development
JWT_SECRET=<NOVO_SEGREDO_FORTE>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

## 4) Frontend local (`21Scoutpro/.env.local`)

```env
VITE_API_URL=http://localhost:3000/api
```

## 5) Vercel (projeto novo) - variaveis obrigatorias

Configure no novo projeto Vercel:

- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN=8h
- NODE_ENV=production
- PORT=3000
- CORS_ORIGIN=https://<dominio-free>.vercel.app
- FRONTEND_URL=https://<dominio-free>.vercel.app

Observacao:
- `VITE_API_URL` em producao normalmente nao e necessario neste projeto, pois o frontend usa `/api` quando `import.meta.env.PROD` e verdadeiro.
- Nunca reutilize `JWT_SECRET` nem `DATABASE_URL` da versao atual.

## 6) Migracoes no banco novo

```bash
cd "/Users/bno/Documents/gestaoesportiva-free/backend"
npx prisma generate
npx prisma migrate deploy
```

Se nao houver migracoes aplicaveis:

```bash
npx prisma db push
```

## 7) Deploy no Vercel

```bash
cd "/Users/bno/Documents/gestaoesportiva-free"
vercel login
vercel link
vercel --prod
```

## 8) Validacao final (isolamento)

- Criar/editar registro no ambiente Free
- Verificar no ambiente atual que nada mudou
- Confirmar que URLs e banco da Free nao apontam para producao atual

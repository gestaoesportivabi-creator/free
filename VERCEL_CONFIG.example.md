# ⚙️ Variáveis de Ambiente - Vercel

## Frontend (21Scoutpro)

```
VITE_API_URL=https://seu-backend.vercel.app/api
```

## Backend

```
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-forte-aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://seu-frontend.vercel.app
FRONTEND_URL=https://seu-frontend.vercel.app
```

## 🔑 Gerar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Como Configurar no Vercel

1. Acesse: **Settings → Environment Variables**
2. Adicione cada variável acima
3. Para `DATABASE_URL`: use a connection string do Supabase (se senha tiver `#`, codifique como `%23`)
4. Para `JWT_SECRET`: gere com o comando acima
5. Para `CORS_ORIGIN` e `FRONTEND_URL`: use a URL do seu frontend no Vercel
6. Faça **Redeploy** após adicionar

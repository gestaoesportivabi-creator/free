# ⚙️ Variáveis de Ambiente - Vercel

## 🚀 Método Rápido (Recomendado)

**Abra o arquivo `vercel-env.txt` e copie/cole as variáveis no Vercel!**

1. Abra: `vercel-env.txt` (neste repositório)
2. Acesse: https://vercel.com/dashboard → Seu Projeto → **Settings → Environment Variables**
3. Copie e cole cada variável do arquivo (uma por vez)
4. Marque: Production, Preview, Development
5. Clique em **Save**
6. Faça **Redeploy**

---

## 📋 Variáveis Necessárias

### Frontend (21Scoutpro)

**`VITE_API_URL`** = URL do seu backend no Vercel + `/api`

**Como descobrir:**
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto do **BACKEND** (não o frontend)
3. A URL estará no topo, exemplo: `https://scout21-backend-abc123.vercel.app`
4. Adicione `/api` no final: `https://scout21-backend-abc123.vercel.app/api`

```
VITE_API_URL=https://seu-backend.vercel.app/api
```

**⚠️ Substitua `seu-backend.vercel.app` pela URL real do seu backend!**

### Backend
```
DATABASE_URL=postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-forte-aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://seu-frontend.vercel.app
FRONTEND_URL=https://seu-frontend.vercel.app
```

## 🔑 Gerar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

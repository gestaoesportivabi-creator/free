# 🔧 Como Corrigir a Conexão com o Banco de Dados

## Acesso ao Supabase

- **Dashboard:** https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm
- **Login:** via GitHub

## Problema
Erro: `Can't reach database server at db.jhjrqnggsfeztgkpqcjm.supabase.co:5432`

---

## ⚠️ IP BANIDO (Fail2ban) - CAUSA COMUM

O Supabase **bane seu IP** após 2 tentativas de senha incorreta. O ban expira em 30 minutos.

### Como desbanir:
1. Acesse: [Database Settings → Banned IPs](https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm/settings/database#banned-ips)
2. Se seu IP aparecer na lista, clique em **Unban IP**
3. Aguarde 1-2 minutos e tente conectar novamente

---

## Soluções

### 1. Verificar DATABASE_URL no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **scout21**
3. Vá em: **Settings → Environment Variables**
4. Encontre **DATABASE_URL** e verifique se está correta:

```
postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres
```

**Importante:** O `#` na senha deve ser codificado como `%23` na URL.

### 2. Usar Connection Pooling (Recomendado para Vercel)

O Supabase oferece connection pooling que é melhor para serverless functions como o Vercel.

1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm) (login via GitHub)
2. Vá em: **Settings → Database**
3. Role até **Connection Pooling**
4. Copie a **Connection String** (formato: `postgresql://postgres.jhjrqnggsfeztgkpqcjm:...@aws-0-us-east-1.pooler.supabase.com:6543/postgres`)
5. Cole no Vercel como **DATABASE_URL**

**Vantagens:**
- Melhor para serverless functions
- Mais estável
- Melhor performance

### 3. Verificar Firewall do Supabase

1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm) (login via GitHub)
2. Vá em: **Settings → Database**
3. Verifique **Network Restrictions**
4. Se houver restrições, adicione os IPs do Vercel ou permita todas as conexões temporariamente

### 4. Testar Conexão Localmente

Para testar se a URL está correta:

```bash
cd backend
npm install
DATABASE_URL="postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres" npx prisma db pull
```

Se funcionar localmente mas não no Vercel, o problema é de firewall ou connection pooling.

### 5. Após Corrigir

1. Faça um **Redeploy** no Vercel:
   - Vercel Dashboard → Deployments → Último deploy → **Redeploy**
2. Teste novamente o cadastro de usuário

## URLs para `backend/.env`

### Connection Pooling (DATABASE_URL) - Recomendada
```
postgresql://postgres.jhjrqnggsfeztgkpqcjm:%23Gestaoesportiva21@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Nota:** Se a região for diferente (ex: `sa-east-1`), obtenha a URL exata em: **Supabase Dashboard → Settings → Database → Connection Pooling**

### Conexão Direta (DIRECT_URL) - Para migrations
```
postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres?sslmode=require
```

### Configuração completa no `backend/.env`
```env
DATABASE_URL=postgresql://postgres.jhjrqnggsfeztgkpqcjm:%23Gestaoesportiva21@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres?sslmode=require
```

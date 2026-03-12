# 🚀 Deploy Único - Frontend + Backend

## ✅ Configuração Completa

O projeto está configurado para fazer deploy único no Vercel, com frontend e backend no mesmo domínio.

## 📁 Estrutura

```
scout21.vercel.app/
├── / (Frontend React)
└── /api/* (Backend Express)
```

## 🔧 Arquivos Criados/Modificados

### 1. `vercel.json` (Raiz)
- Configura build do frontend
- Configura serverless functions para backend
- Rotas `/api/*` → backend
- Rotas `/*` → frontend

### 2. `api/index.ts` (Novo)
- Entry point para serverless function
- Wrapper do Express app

### 3. `backend/src/app.ts` (Modificado)
- Rotas ajustadas para não usar `/api` prefix (o Vercel já adiciona)
- CORS ajustado para funcionar no Vercel
- Não inicia servidor HTTP quando rodando como serverless

### 4. `21Scoutpro/config.ts` (Modificado)
- Usa URL relativa `/api` em produção
- Mantém `localhost:3000/api` em desenvolvimento

## 📋 Variáveis de Ambiente no Vercel

Configure no Vercel Dashboard → Settings → Environment Variables:

### Obrigatórias:
```
# DATABASE_URL - Pooler (porta 6543) para serverless
# Projeto Supabase: mymuvraqtnoqrtuzoimj - https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj
# Substitua [SENHA] pela senha do banco (Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres.mymuvraqtnoqrtuzoimj:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require

# DIRECT_URL - Obrigatório pelo Prisma schema (porta 5432)
DIRECT_URL=postgresql://postgres:[SENHA]@db.mymuvraqtnoqrtuzoimj.supabase.co:5432/postgres?sslmode=require

# Use o MESMO JWT_SECRET em backend/.env (local) para tokens funcionarem em ambos os ambientes
JWT_SECRET=sua-chave-secreta-forte-aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Opcionais:
```
CORS_ORIGIN=https://scout21.vercel.app
FRONTEND_URL=https://scout21.vercel.app
```

**⚠️ IMPORTANTE:** Sem `DIRECT_URL`, o Prisma falha no build. O schema exige essa variável.

**⚠️ NÃO precisa configurar `VITE_API_URL`** - o frontend usa `/api` relativo automaticamente!

## 🚀 Como Fazer Deploy

### Opção 1: Via Vercel CLI
```bash
vercel --prod
```

### Opção 2: Via GitHub (Recomendado)
1. Push para o repositório
2. O Vercel detecta automaticamente e faz deploy

## ✅ Verificar se Funcionou

1. **Frontend:** `https://scout21.vercel.app`
2. **Backend Health:** `https://scout21.vercel.app/api/health`
3. **Backend Auth:** `https://scout21.vercel.app/api/auth/register`

## 🔍 Troubleshooting

### Erro: "Cannot find module"
- Certifique-se de que todas as dependências estão instaladas
- O Vercel instala automaticamente, mas pode precisar de rebuild

### Erro: CORS
- O CORS está configurado para aceitar requisições do mesmo domínio no Vercel
- Não precisa configurar `CORS_ORIGIN` se frontend e backend estão no mesmo domínio

### Erro: Database connection
- Verifique se `DATABASE_URL` e `DIRECT_URL` estão configuradas corretamente
- `DATABASE_URL`: use pooler (porta 6543) para serverless
- `DIRECT_URL`: use conexão direta (porta 5432) - obrigatório pelo Prisma
- Certifique-se de que o Supabase permite conexões externas

### Erro: "Environment variable not found: DIRECT_URL"
- Adicione `DIRECT_URL` no Vercel Dashboard (Settings → Environment Variables)
- Use a connection string direta do Supabase (porta 5432)

## 📝 Notas Importantes

- ✅ Tudo que foi feito no backend (tabelas, código, funcionalidades) está preservado
- ✅ Apenas mudou a forma de deploy (de 2 projetos para 1)
- ✅ Frontend e backend compartilham o mesmo domínio
- ✅ Multi-tenancy continua funcionando normalmente
- ✅ Todas as rotas da API continuam funcionando


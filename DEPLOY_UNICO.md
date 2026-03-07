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
DATABASE_URL=postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-forte-aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Opcionais:
```
CORS_ORIGIN=https://scout21.vercel.app
FRONTEND_URL=https://scout21.vercel.app
```

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
- Verifique se `DATABASE_URL` está configurada corretamente
- Certifique-se de que o Supabase permite conexões externas

## 📝 Notas Importantes

- ✅ Tudo que foi feito no backend (tabelas, código, funcionalidades) está preservado
- ✅ Apenas mudou a forma de deploy (de 2 projetos para 1)
- ✅ Frontend e backend compartilham o mesmo domínio
- ✅ Multi-tenancy continua funcionando normalmente
- ✅ Todas as rotas da API continuam funcionando


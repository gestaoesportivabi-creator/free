# Setup Supabase Unificado (Local e Produção)

Este guia garante que o backend local e o deploy no Vercel acessem **o mesmo banco Supabase**, com tokens de login válidos em ambos os ambientes.

## Pré-requisitos

- Projeto Supabase configurado (ref: `jhjrqnggsfeztgkpqcjm` em `package.json` supabase:link)
- Senha do banco e connection strings do Supabase Dashboard

## Checklist de Configuração

### Passo 1: Copiar template para backend/.env

```bash
cp backend/.env.example backend/.env
```

### Passo 2: Preencher variáveis no backend/.env

Edite `backend/.env` com os valores do Supabase:

- **DATABASE_URL**: Connection string com pooler (porta 6543)  
  - Supabase Dashboard → Settings → Database → Connection string → **Transaction** (URI)
  - Adicione `?pgbouncer=true&sslmode=require` ao final
  - Senha com `#` → codifique como `%23`

- **DIRECT_URL**: Connection string direta (porta 5432)  
  - Supabase Dashboard → Settings → Database → Connection string → **Session** ou URI direta
  - Adicione `?sslmode=require` ao final

- **JWT_SECRET**: Chave secreta forte (ex.: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

Referência: `backend/env.supabase.example`

### Passo 3: Configurar as mesmas variáveis no Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto
3. Settings → Environment Variables
4. Adicione **as mesmas** variáveis: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`
5. Marque Production, Preview e Development

Referência: `vercel-env.txt`

### Passo 4: Garantir JWT_SECRET idêntico

O `JWT_SECRET` em `backend/.env` (local) **deve ser igual** ao configurado no Vercel. Caso contrário, tokens gerados em um ambiente não funcionam no outro.

### Passo 5: Redeploy no Vercel

Após alterar variáveis no Vercel:

- Vercel Dashboard → Deployments → último deploy → **Redeploy**

## Verificação

1. **Local**: `npm run dev` → login → dados carregam
2. **Produção**: acesse a URL do deploy → login → dados carregam
3. **Token cruzado**: login em produção → copie token (DevTools) → acesse local com mesmo token (ou vice-versa) → deve funcionar

## Arquivos de Referência

| Arquivo | Uso |
|---------|-----|
| `backend/.env.example` | Template com placeholders |
| `backend/env.supabase.example` | Referência para projeto jhjrqnggsfeztgkpqcjm |
| `vercel-env.txt` | Valores para copiar no Vercel |

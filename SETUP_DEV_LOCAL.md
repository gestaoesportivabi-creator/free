# 🚀 Setup para Desenvolvedor - Backend Local

## 📋 Pré-requisitos

- **Node.js:** 18+ (recomendado: v22.16.0)
- **npm** ou **yarn**
- **Git**

## 🔧 Passo 1: Clonar e Instalar

```bash
# Clonar o repositório (se ainda não tiver)
git clone <url-do-repositorio>
cd gestaoesportiva

# Instalar dependências do backend
cd backend
npm install
```

## 🔐 Passo 2: Configurar Variáveis de Ambiente

Crie o arquivo `.env` na pasta `backend/`:

```bash
cd backend
touch .env
```

Cole o seguinte conteúdo no arquivo `.env`:

```env
# Database - Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres

# Server
PORT=3000
NODE_ENV=development

# JWT - Chave secreta para autenticação
JWT_SECRET=scout21-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# CORS - URL do frontend local
CORS_ORIGIN=http://localhost:5173

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### ⚠️ Importante sobre DATABASE_URL

A senha do banco contém o caractere `#`, que deve ser codificado como `%23` na URL:
- Senha real: `#Gestaoesportiva21`
- Na URL: `%23Gestaoesportiva21`

## 🗄️ Passo 3: Configurar Prisma

```bash
cd backend

# Gerar o Prisma Client
npx prisma generate

# (Opcional) Verificar conexão com o banco
npx prisma db pull
```

## 🚀 Passo 4: Rodar o Backend

```bash
cd backend
npm run dev
```

O servidor estará rodando em: **http://localhost:3000**

## ✅ Verificar se Está Funcionando

### Health Check
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Testar Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}'
```

## 📊 Acessar Banco de Dados (Opcional)

### Prisma Studio (Interface Visual)
```bash
cd backend
npx prisma studio
```

Acesse: **http://localhost:5555**

### Credenciais do Supabase
- **Host:** `db.jhjrqnggsfeztgkpqcjm.supabase.co`
- **Porta:** `5432`
- **Database:** `postgres`
- **Usuário:** `postgres`
- **Senha:** `#Gestaoesportiva21`
- **Dashboard:** https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm (login via GitHub)

## 🔑 Credenciais de Teste

### Usuário Administrador
- **Email:** `admin@admin.com`
- **Senha:** `admin`
- **Role:** `TECNICO`

## 📝 Comandos Úteis

```bash
# Desenvolvimento (watch mode)
npm run dev

# Build para produção
npm run build

# Rodar em produção
npm run start

# Executar migrations
npm run migrate

# Popular dados de demonstração
npm run seed:demo

# Verificar tipos TypeScript
npm run type-check

# Linter
npm run lint
```

## 🆘 Problemas Comuns

### Erro: "DATABASE_URL não configurada"
- Verifique se o arquivo `.env` existe em `backend/`
- Verifique se a variável `DATABASE_URL` está correta
- Certifique-se de que o `#` na senha está codificado como `%23`

### Erro: "Cannot connect to database"
- Verifique sua conexão com a internet
- Verifique se o Supabase está acessível
- Teste a connection string diretamente:
  ```bash
  psql "postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres"
  ```

### Erro: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Erro: "Table does not exist"
As migrations já foram executadas no banco de produção. Se precisar recriar:
```bash
cd backend
npx prisma migrate dev
```

### Porta 3000 já em uso
```bash
# Verificar o que está usando a porta
lsof -ti:3000 | xargs kill -9

# Ou mudar a porta no .env
PORT=3001
```

## 📚 Estrutura do Projeto

```
backend/
├── src/
│   ├── app.ts              # Servidor Express
│   ├── config/             # Configurações
│   ├── controllers/        # Controllers das rotas
│   ├── middleware/         # Middlewares (auth, tenant, etc)
│   ├── repositories/       # Acesso ao banco
│   ├── routes/             # Definição de rotas
│   ├── services/           # Lógica de negócio
│   └── validators/         # Validações
├── prisma/
│   └── schema.prisma       # Schema do banco
├── migrations/             # Migrations SQL
├── scripts/                # Scripts utilitários
└── .env                    # Variáveis de ambiente (criar)
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- As credenciais acima são para **desenvolvimento local apenas**
- Em produção, use variáveis de ambiente seguras

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor no terminal
2. Verifique se todas as dependências foram instaladas: `npm install`
3. Verifique se o Prisma Client foi gerado: `npx prisma generate`
4. Verifique a conexão com o banco: `npx prisma db pull`

---

**Última atualização:** 2024

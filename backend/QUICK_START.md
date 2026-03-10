# 🚀 Quick Start - Backend PostgreSQL

## ⚠️ IMPORTANTE: PostgreSQL Necessário

O sistema precisa de um banco de dados PostgreSQL. Use **Supabase** (recomendado) ou PostgreSQL local.

## 📦 Opção 1: Supabase (Recomendado - Mais Fácil)

### 1. Criar Projeto no Supabase
- Acesse: https://supabase.com
- Crie um novo projeto
- Anote a connection string

### 2. Configurar .env
```bash
cd backend
cp .env.example .env
```

Edite `.env` com a connection string do Supabase:
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-forte
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### 3. Executar Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

Ou execute as migrations SQL manualmente (veja [SETUP_DATABASE.md](./SETUP_DATABASE.md)).

## 📦 Opção 2: Docker (PostgreSQL Local)

### 1. Criar Container
```bash
docker run --name scout21-postgres \
  -e POSTGRES_USER=scout21 \
  -e POSTGRES_PASSWORD=scout21 \
  -e POSTGRES_DB=scout21 \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Configurar .env
```env
DATABASE_URL="postgresql://scout21:scout21@localhost:5432/scout21?schema=public"
```

### 3. Executar Migrations
```bash
npx prisma migrate dev --name init
```

## 🚀 Iniciar Servidor

```bash
cd backend
npm install
npm run dev
```

O servidor estará em `http://localhost:3000`

## ✅ Verificar se Funcionou

```bash
# Health check
curl http://localhost:3000/health

# Deve retornar:
# {"success":true,"message":"SCOUT 21 Backend is running"}
```

## 📚 Documentação Completa

- **Setup Database:** [SETUP_DATABASE.md](./SETUP_DATABASE.md)
- **Conexão Supabase:** [CONEXAO_SUPABASE.md](./CONEXAO_SUPABASE.md)
- **Arquitetura:** [docs/architecture.md](./docs/architecture.md)

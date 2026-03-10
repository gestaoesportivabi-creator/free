# 📋 Instruções para Rodar o Backend

## ✅ Pré-requisitos

- Node.js 18+
- PostgreSQL (Supabase recomendado) ou Docker
- npm ou yarn

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:
- `DATABASE_URL` - Connection string do PostgreSQL/Supabase
- `JWT_SECRET` - Chave secreta para JWT (gere uma forte)
- `CORS_ORIGIN` - URL do frontend (ex: http://localhost:5173)

### 3. Configurar Banco de Dados

**Opção A - Supabase (Recomendado):**
- Veja [CONEXAO_SUPABASE.md](./CONEXAO_SUPABASE.md)

**Opção B - PostgreSQL Local:**
- Veja [SETUP_DATABASE.md](./SETUP_DATABASE.md)

### 4. Executar Migrations

```bash
# Usar Prisma Migrate (recomendado)
npx prisma migrate dev --name init

# OU executar migrations SQL manualmente
psql -d scout21 -f migrations/000_seed_roles.sql
# ... (executar todas as migrations na ordem)
```

### 5. Iniciar Servidor

```bash
npm run dev
```

O servidor estará em `http://localhost:3000`

## 🔍 Verificar se Está Funcionando

### Health Check
```bash
curl http://localhost:3000/health
```

### Testar API
```bash
# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@teste.com","password":"teste123"}'
```

## 📚 Comandos Úteis

```bash
npm run dev          # Desenvolvimento (watch mode)
npm run build        # Build TypeScript
npm run start        # Produção
npx prisma studio    # Interface visual do banco
npx prisma migrate dev  # Criar nova migration
```

## 🆘 Problemas Comuns

### Erro: "Cannot connect to database"
- Verifique se PostgreSQL/Supabase está acessível
- Verifique credenciais no `.env`
- Verifique se o banco existe

### Erro: "Table does not exist"
- Execute migrations: `npx prisma migrate dev`

### Erro: "Prisma Client not generated"
- Execute: `npx prisma generate`

## 📖 Documentação Adicional

- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Setup Database:** [SETUP_DATABASE.md](./SETUP_DATABASE.md)
- **Arquitetura:** [docs/architecture.md](./docs/architecture.md)

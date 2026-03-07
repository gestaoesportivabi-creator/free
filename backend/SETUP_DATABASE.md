# Setup do Banco de Dados PostgreSQL

## 📋 Opções de Instalação

### Opção 1: Docker (Recomendado - Mais Fácil)

1. **Instalar Docker Desktop:**
   - macOS: https://www.docker.com/products/docker-desktop/
   - Baixe e instale o Docker Desktop

2. **Executar o script de setup:**
   ```bash
   cd backend
   ./setup-database.sh
   ```

3. **Ou criar manualmente:**
   ```bash
   docker run --name scout21pro-postgres \
     -e POSTGRES_USER=scout21pro \
     -e POSTGRES_PASSWORD=scout21pro \
     -e POSTGRES_DB=scout21pro \
     -p 5432:5432 \
     -d postgres:14
   ```

### Opção 2: PostgreSQL Local (Homebrew)

1. **Instalar PostgreSQL:**
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Criar banco de dados:**
   ```bash
   createdb scout21pro
   ```

3. **Atualizar .env:**
   ```bash
   DATABASE_URL="postgresql://$(whoami)@localhost:5432/scout21pro?schema=public"
   ```

### Opção 3: PostgreSQL Local (Instalação Manual)

1. Baixe do site oficial: https://www.postgresql.org/download/
2. Siga as instruções de instalação
3. Crie o banco: `createdb scout21pro`
4. Atualize o `.env` com suas credenciais

## 🔄 Executar Migrations

Após configurar o PostgreSQL, execute:

```bash
cd backend

# Opção A: Usar Prisma Migrate (recomendado)
npx prisma migrate dev --name init

# Opção B: Executar migrations SQL manualmente
# Primeiro, execute a migration de roles:
psql -d scout21pro -f migrations/000_seed_roles.sql

# Depois, execute as outras migrations na ordem:
psql -d scout21pro -f migrations/001_add_missing_fields.sql
psql -d scout21pro -f migrations/002_normalize_competitions.sql
psql -d scout21pro -f migrations/003_fix_lesoes_and_add_constraints.sql
psql -d scout21pro -f migrations/004_add_programacoes_and_campeonatos_fields.sql
psql -d scout21pro -f migrations/005_add_eav_constraints_and_validation.sql
psql -d scout21pro -f migrations/006_add_multitenancy_indexes.sql
```

## ✅ Verificar se Está Funcionando

```bash
# Verificar conexão
cd backend
npx prisma db pull

# Ou testar conexão direta
psql -d scout21pro -c "SELECT version();"
```

## 🔧 Atualizar .env

Certifique-se de que o arquivo `.env` tem a URL correta:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/scout21pro?schema=public"
```

**Para Docker:**
```env
DATABASE_URL="postgresql://scout21pro:scout21pro@localhost:5432/scout21pro?schema=public"
```

**Para PostgreSQL local (sem senha):**
```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/scout21pro?schema=public"
```

## 🚨 Problemas Comuns

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Verifique se a porta 5432 está correta
- Verifique as credenciais no `.env`

### Erro: "database does not exist"
- Crie o banco: `createdb scout21pro`
- Ou use Docker que cria automaticamente

### Erro: "role does not exist"
- Execute a migration de roles: `psql -d scout21pro -f migrations/000_seed_roles.sql`


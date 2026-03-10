# 🗄️ Alternativas de Conexão com o Banco de Dados

Se o Supabase não estiver acessível, você pode usar outras opções:

---

## Opção 1: PostgreSQL Local com Docker (Recomendado)

Funciona **offline** e não depende de internet.

### Pré-requisito
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado

### Passos

**1. Subir o PostgreSQL:**
```powershell
docker run --name scout21-db -e POSTGRES_USER=scout21 -e POSTGRES_PASSWORD=scout21 -e POSTGRES_DB=scout21 -p 5432:5432 -d postgres:14
```

**2. Atualizar o `backend/.env`:**
```env
# PostgreSQL Local (Docker)
DATABASE_URL=postgresql://scout21:scout21@localhost:5432/scout21?schema=public
DIRECT_URL=postgresql://scout21:scout21@localhost:5432/scout21?schema=public
```

**3. Criar tabelas e popular dados:**
```powershell
cd backend
npx prisma db push
npx tsx scripts/seed-roles.ts
npm run seed:demo
```

**4. Reiniciar o backend:**
```powershell
npm run dev
```

### Comandos úteis Docker
```powershell
# Parar o banco
docker stop scout21-db

# Iniciar novamente
docker start scout21-db

# Remover (se precisar recriar)
docker rm -f scout21-db
```

---

## Opção 2: Neon (PostgreSQL na Nuvem - Gratuito)

Alternativa ao Supabase, com boa conectividade.

### Passos

1. Acesse: **https://neon.tech**
2. Crie uma conta (gratuita)
3. Crie um novo projeto
4. Copie a **Connection string** (formato: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
5. Cole no `backend/.env`:

```env
DATABASE_URL=postgresql://usuario:senha@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://usuario:senha@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

6. Crie as tabelas:
```powershell
cd backend
npx prisma db push
npx tsx scripts/seed-roles.ts
```

---

## Opção 3: PostgreSQL Instalado no Windows

Se preferir instalar o PostgreSQL diretamente (sem Docker):

1. Baixe: **https://www.postgresql.org/download/windows/**
2. Instale e anote a senha do usuário `postgres`
3. Crie o banco: `createdb scout21` (ou via pgAdmin)
4. Atualize o `.env`:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/scout21?schema=public
DIRECT_URL=postgresql://postgres:SUA_SENHA@localhost:5432/scout21?schema=public
```

---

## Resumo

| Opção | Requer Internet | Requer Instalação |
|-------|----------------|-------------------|
| **Docker + PostgreSQL** | ❌ Não | Docker Desktop |
| **Neon** | ✅ Sim | Nenhuma |
| **PostgreSQL Windows** | ❌ Não | PostgreSQL |
| **Supabase** | ✅ Sim | Nenhuma |

**Recomendação:** Use **Docker** para desenvolvimento local quando o Supabase não estiver acessível.

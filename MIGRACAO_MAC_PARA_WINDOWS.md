# 🪟 Migração Mac → Windows

Guia para rodar o projeto SCOUT 21 no Windows (o projeto foi desenvolvido no Mac).

---

## ✅ O que funciona igual

| Item | Mac | Windows |
|------|-----|---------|
| Node.js / npm | ✅ | ✅ |
| Backend (Express) | ✅ | ✅ |
| Frontend (Vite/React) | ✅ | ✅ |
| Conexão Supabase | ✅ | ✅ |
| Prisma / PostgreSQL | ✅ | ✅ |
| `npm run dev` | ✅ | ✅ |
| `path.join()`, `__dirname` | ✅ | ✅ |

O código principal é **cross-platform** e funciona em ambos.

---

## ⚠️ Possíveis diferenças

### 1. Scripts Shell (`.sh`)

Os arquivos `.sh` são para **Mac/Linux** e **não rodam nativamente** no Windows:

- `backend/setup-database.sh`
- `backend/check-database.sh`
- `vercel-env-setup.sh`
- `vercel-env-frontend.sh`

**Solução:** Use as alternativas em PowerShell ou rode os comandos manualmente.

**Exemplo – Banco com Docker (em vez de `setup-database.sh`):**
```powershell
docker run --name scout21-db -e POSTGRES_USER=scout21 -e POSTGRES_PASSWORD=scout21 -e POSTGRES_DB=scout21 -p 5432:5432 -d postgres:14
```

### 2. Separador de caminhos

- **Mac:** `/` (ex: `backend/dist/app.js`)
- **Windows:** `\` (ex: `backend\dist\app.js`)

O Node.js trata isso automaticamente com `path.join()` e `path.resolve()`, então não costuma dar problema.

### 3. Fim de linha (CRLF vs LF)

- **Mac:** LF (`\n`)
- **Windows:** CRLF (`\r\n`)

O Git pode ajustar isso com `core.autocrlf`. Se aparecer erro em scripts, vale conferir as configurações do Git.

### 4. PowerShell vs Bash

No Windows, o terminal padrão é **PowerShell**. Alguns comandos mudam:

| Mac (Bash) | Windows (PowerShell) |
|------------|----------------------|
| `&&` (em alguns casos) | `;` |
| `export VAR=valor` | `$env:VAR="valor"` |
| `./script.sh` | `.\script.ps1` |

O `npm run dev` e os scripts do `package.json` funcionam normalmente no Windows.

---

## 🔧 Problemas comuns no Windows

### "node não é reconhecido"
- Instale o Node.js e **reinicie o terminal**.
- Verifique: `node --version`

### "npm não é reconhecido"
- Mesmo caso: instale o Node.js e reinicie o terminal.

### Conexão com o banco falha
- Não é específico de Mac/Windows.
- Verifique: projeto Supabase pausado, IP banido, firewall, etc.
- Alternativa: use PostgreSQL local com Docker (veja `backend/ALTERNATIVAS_BANCO.md`).

### Porta em uso
```powershell
# Ver o que usa a porta 3000
netstat -ano | findstr :3000

# Encerrar processo (substitua PID pelo número)
taskkill /PID <PID> /F
```

---

## 📋 Checklist para rodar no Windows

1. [ ] Node.js 18+ instalado
2. [ ] `npm run install:all` executado
3. [ ] `backend/.env` configurado (DATABASE_URL, etc.)
4. [ ] `npx prisma generate` no backend
5. [ ] Banco: Supabase **ou** PostgreSQL local (Docker)
6. [ ] `npm run dev` na raiz do projeto

---

## 🚀 Comando para iniciar

```powershell
cd c:\Users\scout\Desktop\treinadores
npm run dev
```

Ou use o script PowerShell:
```powershell
.\iniciar.ps1
```

---

**Resumo:** O projeto é compatível com Windows. O que pode mudar são scripts `.sh` e alguns detalhes de terminal; o fluxo principal (`npm run dev`, backend, frontend, banco) funciona normalmente.

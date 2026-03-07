# Diagnóstico: Dependências e Possíveis Erros do Backend

## 1. Dependências do Backend

### Produção (dependencies)
| Pacote | Versão | Status | Observação |
|--------|--------|--------|------------|
| express | ^4.18.2 | OK | Servidor HTTP |
| cors | ^2.8.5 | OK | CORS |
| helmet | ^7.1.0 | OK | Segurança headers |
| dotenv | ^16.3.1 | OK | Variáveis de ambiente |
| bcrypt | ^5.1.1 | ⚠️ | **Pode falhar no Windows** (compilação nativa) |
| jsonwebtoken | ^9.0.2 | OK | JWT |
| zod | ^3.22.4 | OK | Validação |
| @prisma/client | ^5.7.1 | OK | ORM |
| pg | ^8.11.3 | OK | Driver PostgreSQL |

### Desenvolvimento (devDependencies)
| Pacote | Versão | Status |
|--------|--------|--------|
| prisma | ^5.7.1 | OK |
| tsx | ^4.7.0 | OK |
| typescript | ^5.3.3 | OK |
| eslint | ^8.56.0 | OK |

---

## 2. Possíveis Causas de Erro

### A) bcrypt – Falha de compilação no Windows
**Sintoma:** `Error: Could not locate the bindings file` ou `node-gyp rebuild failed`

**Causa:** bcrypt usa código nativo (C++) que precisa ser compilado. No Windows pode falhar se:
- Visual Studio Build Tools não estiver instalado
- Python não estiver no PATH
- Versão do Node incompatível

**Solução:** Trocar por `bcryptjs` (implementação em JavaScript puro, sem compilação):
```bash
npm uninstall bcrypt
npm install bcryptjs
npm install -D @types/bcryptjs
```
E no código: `import bcrypt from 'bcryptjs'` (API idêntica)

---

### B) Prisma / Banco de dados
**Sintoma:** `Can't reach database server` ou `Environment variable not found: DIRECT_URL`

**Causas:**
1. **DIRECT_URL ausente** – Prisma schema exige. ✅ Já corrigido no .env
2. **Supabase pausado** – Projetos gratuitos pausam após 7 dias
3. **IP banido** – Supabase bane após 2 senhas incorretas (30 min)
4. **SSL** – Supabase exige `?sslmode=require` ✅ Já no .env

**Verificar:** https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm

---

### C) Roles não existem no banco
**Sintoma:** `Role inválida` ao registrar

**Causa:** Tabela `roles` vazia. O registro espera roles: TECNICO, CLUBE, ADMIN, ATLETA.

**Solução:**
```bash
cd backend
npx tsx scripts/seed-roles.ts
```

---

### D) Técnico sem Equipe
**Sintoma:** Após login, listas vazias (players, schedules) ou erro ao criar programação

**Causa:** Ao registrar como TECNICO, cria-se User + Tecnico, mas **nenhuma Equipe**. O tenant retorna `equipe_ids: []`. Rotas como schedules/create usam `equipeIds[0]` – se vazio, falha.

**Solução:** O usuário precisa **criar uma equipe** primeiro (aba Gestão de Equipe ou similar). Ou ajustar o seed/registro para criar uma equipe padrão automaticamente.

---

### E) Clube – CNPJ vazio
**Sintoma:** Erro ao registrar como CLUBE

**Causa:** O registro usa `cnpj: cnpj || ''`. O campo é `@unique`. Dois clubes com CNPJ vazio violam a constraint.

**Solução:** Exigir CNPJ no formulário de registro de clube, ou usar valor único temporário (ex: UUID).

---

### F) CORS
**Sintoma:** Requisições do frontend bloqueadas no navegador

**Causa:** Frontend em porta diferente (ex: 5174) da configurada (5173)

**Verificar:** .env tem `CORS_ORIGIN=http://localhost:5173`. Se o Vite usar outra porta, ajustar.

---

## 3. Checklist de Verificação

- [ ] Backend inicia sem erro? (`npm run dev` na pasta backend)
- [ ] `npx prisma generate` executa sem erro?
- [ ] Roles existem? (`npx prisma studio` → tabela roles)
- [ ] Consegue registrar usuário?
- [ ] Consegue fazer login?
- [ ] Após login, consegue criar equipe?
- [ ] GET /health retorna 200? (http://localhost:3000/health)

---

## 4. Comandos Úteis

```bash
# Instalar dependências
cd backend && npm install

# Gerar Prisma Client
npx prisma generate

# Criar roles no banco
npx tsx scripts/seed-roles.ts

# Verificar conexão com banco
npx prisma db pull

# Rodar backend
npm run dev
```

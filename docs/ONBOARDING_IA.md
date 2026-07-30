# Onboarding para IA / Agente — SCOUT 21 PRO

Documento de entrada para qualquer agente (Cursor, Paperclip, colaborador humano técnico).

**Última atualização:** 2026-07-23

---

## 1. Onde está o código

| Item | Valor |
|------|--------|
| Pasta local | `/Users/bno/Documents/Projetos/apps/scout21` |
| Repo GitHub | `gestaoesportivabi-creator/free` |
| Branch padrão | `main` |
| Workspace Cursor | **deve** apontar para o caminho acima (não `FREE Scout`) |

### Abrir no Cursor

```bash
cursor "/Users/bno/Documents/Projetos/apps/scout21"
```

Se o terminal falhar com `FREE Scout does not exist`, use a tool `move_agent_to_root` do MCP `cursor-app-control` com:

`rootPath=/Users/bno/Documents/Projetos/apps/scout21`

---

## 2. O que é o produto

SCOUT 21 PRO — gestão esportiva (futsal): elenco, scout de partida (realtime + pós-jogo), cronômetro, bem-estar/PSE/PSR, programação, campeonatos, portal do atleta, assistente/Telegram.

**Fase recente (003):** estabilização da coleta (ClockService, realtime, pós-jogo, QA Playwright).  
**Próxima (004):** UX / jornada — proposta de “Shell” (flag) para comparar fluxo atual vs redesenhado **sem** duplicar o motor.

---

## 3. Arquitetura

```
scout21/
├── 21Scoutpro/          # Frontend React + Vite
├── backend/             # API Express + Prisma
├── api/index.ts         # Entry serverless Vercel
├── vercel.json
├── docs/                # Documentação
└── AGENTS.md            # Atalho para agentes
```

| Ambiente | Frontend | Backend API |
|----------|----------|-------------|
| Produção | mesmo domínio Vercel | `/api/*` |
| Local full | `localhost:5173` | `localhost:3000/api` |
| Local + API online | `localhost:5173` | `VITE_API_URL=https://gestaoesportiva-free.vercel.app/api` |

Proxy Vite (quando `VITE_API_URL=/api`): aponta `/api` → produção.

---

## 4. Como rodar local

```bash
cd "/Users/bno/Documents/Projetos/apps/scout21"
npm run install:all
cp backend/.env.example backend/.env   # se ainda não existir — preencher
# frontend:
#   VITE_API_URL=http://localhost:3000/api     → backend local
#   VITE_API_URL=https://gestaoesportiva-free.vercel.app/api  → API online
npm run dev
```

- Front: http://localhost:5173  
- Back: http://localhost:3000  

Prisma:

```bash
cd backend && npx prisma generate
# migrations: ver backend/docs/APLICAR_MIGRACOES_SUPABASE.md
```

---

## 5. URLs e IDs públicos

| Recurso | Valor |
|---------|--------|
| Produção | https://gestaoesportiva-free.vercel.app |
| Supabase Scout (produto) | project ref `mymuvraqtnoqrtuzoimj` |
| Supabase Fiscal (outro produto, read-only) | project ref `iomjrnvuvtmoteupzbuq` |
| Paperclip | ver `docs/INTEGRACAO_PAPERCLIP.md` |

Login seed admin (plataforma):

- Email: `admin@admin.com` (atalho: `admin`)
- Senha: `admin`  
  → **trocar em produção** quando possível; não é “segredo forte”.

---

## 6. Acessos e segredos

| Arquivo | Commit? | Conteúdo |
|---------|---------|----------|
| `docs/ONBOARDING_COLABORADOR.template.md` | sim | checklist sem senhas |
| `docs/ACESSOS_COLABORADOR.local.md` | **não** | preenchido localmente |
| `backend/.env` | **não** | DB, JWT, Resend, Telegram… |
| `21Scoutpro/.env.local` | **não** | `VITE_API_URL` |
| `.env.vercel` | **não** | espelho / export Vercel |
| `docs/MCP_CURSOR.md` | sim | como ligar MCPs |

**Nunca** colar API keys / PAT / senhas de DB no chat.

---

## 7. MCP (obrigatório para agentes no Cursor)

Leia **[MCP_CURSOR.md](./MCP_CURSOR.md)**.

Resumo:

| Server Cursor | Uso |
|---------------|-----|
| `supabase-scout` | Banco do SCOUT — tables, SQL, migrations, logs |
| `supabase-fiscal` | Outro projeto (somente leitura) |
| `cursor-app-control` | mover workspace root, etc. |
| Figma / Framelink / wpcom | design / WordPress — só se a tarefa pedir |

Config típica em `~/.cursor/mcp.json` (sem colar secrets no git):

```json
"supabase-scout": {
  "url": "https://mcp.supabase.com/mcp?project_ref=mymuvraqtnoqrtuzoimj"
},
"supabase-fiscal": {
  "url": "https://mcp.supabase.com/mcp?project_ref=iomjrnvuvtmoteupzbuq&read_only=true"
}
```

Autenticar no Cursor: **Settings → MCP → Connect** no servidor (OAuth Supabase).

**Importante:** MCP Scout às vezes está em transação **read-only** para DDL. Se `apply_migration` / `ALTER` falhar, usar Supabase SQL Editor ou `prisma db execute` com `DIRECT_URL`.

Prisma **não** usa MCP — usa `DATABASE_URL` / `DIRECT_URL` do `.env`.

---

## 8. Git / deploy

- Remote SSH (recomendado neste Mac): `git@github.com-gestao:gestaoesportivabi-creator/free.git`
- Conta: `gestaoesportivabi-creator` (não `coletivointersomos`)
- Deploy: push em `main` → Vercel
- Env de e-mail (Vercel): `RESEND_API_KEY`, `EMAIL_FROM=SCOUT21 <scout21@intersomos.com.br>`, `EMAIL_REPLY_TO`, `FRONTEND_URL`

---

## 9. O que ler por tarefa

| Tarefa | Docs |
|--------|------|
| Coleta / cronômetro / realtime | `docs/SPRINT_003*.md`, `docs/EVENT_MATRIX.md`, `docs/COLLECTION_UX_GLOSSARY.md` |
| QA / Playwright | `docs/QA_GUIDE.md`, `docs/QA_ENVIRONMENT.md`, `21Scoutpro/e2e/` |
| Atleta login | `docs/ACESSO_ATLETA.md` |
| Telegram / assistente | `docs/TELEGRAM_*.md`, `backend/docs/WEB_ASSISTANT.md` |
| Banco / schema | `backend/prisma/schema.prisma`, `docs/database/` |
| Deploy | `docs/setup/DEPLOY.md` |
| Paperclip | `docs/INTEGRACAO_PAPERCLIP.md` |

Ignorar como “fonte da verdade” atual: `docs/archive/*` e `_archived/google-sheets` (legado).

---

## 10. Convenções para agentes

1. Confirmar workspace path antes de comandos de terminal.
2. Não commitar segredos; não fazer force-push em `main`.
3. Preferir mudanças mínimas e alinhadas ao código existente.
4. E-mail transacional (1A) já existe: `backend/src/services/email/` — ponto B (onboarding operacional) ainda não.
5. Proposta Shell (UX 004): flag/UI paralela; **mesmo** ClockService / save / eventos.

---

## 11. Checklist “IA pronta”

- [ ] Pasta `/Users/bno/Documents/Projetos/apps/scout21` aberta no Cursor  
- [ ] Leu este arquivo + `AGENTS.md`  
- [ ] MCP `supabase-scout` conectado (`docs/MCP_CURSOR.md`)  
- [ ] `backend/.env` presente (ou front apontando API online)  
- [ ] `docs/ACESSOS_COLABORADOR.local.md` preenchido **ou** acesso ao dono do projeto  
- [ ] `git status` / branch correta antes de editar  

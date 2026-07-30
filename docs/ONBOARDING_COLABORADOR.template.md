# Template — Acessos colaborador / IA

**Este arquivo pode ir no git.** Não contém senhas.

1. Copie para `docs/ACESSOS_COLABORADOR.local.md` (gitignored).  
2. Preencha os campos.  
3. Nunca commite o `.local.md`.  
4. Para agentes: também leia `ONBOARDING_IA.md` e `MCP_CURSOR.md`.

---

## Identidade do ambiente

| Campo | Valor |
|-------|--------|
| Pasta local | `/Users/bno/Documents/Projetos/apps/scout21` |
| Repo | `https://github.com/gestaoesportivabi-creator/free` |
| Produção | `https://gestaoesportiva-free.vercel.app` |
| Branch padrão | `main` |

---

## Contas app

| Uso | Email / user | Senha | Onde |
|-----|--------------|-------|------|
| Admin plataforma (seed) | `admin@admin.com` / `admin` | _(preencher se mudou)_ | prod + local |
| QA | `qa.scout21@...` | _(só no .local)_ | ver `QA_ENVIRONMENT.md` |
| Conta teste operador | | | |

---

## Supabase Scout

| Campo | Valor |
|-------|--------|
| Project ref | `mymuvraqtnoqrtuzoimj` |
| Dashboard | `https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj` |
| DB password | _(só .local / .env — nunca git)_ |
| `DATABASE_URL` | _(pooler 6543 — ver backend/.env)_ |
| `DIRECT_URL` | _(direto 5432)_ |

## Supabase Fiscal (outro produto)

| Campo | Valor |
|-------|--------|
| Project ref | `iomjrnvuvtmoteupzbuq` |
| Modo MCP | read_only recomendado |

---

## MCP Cursor

| Server | Status | Notas |
|--------|--------|-------|
| supabase-scout | Connect OAuth | `MCP_CURSOR.md` |
| supabase-fiscal | Connect OAuth | read_only |
| cursor-app-control | built-in | move root |

Path do mcp.json do usuário: `~/.cursor/mcp.json`

---

## Vercel

| Campo | Valor |
|-------|--------|
| Projeto | _(nome no painel)_ |
| URL | `https://gestaoesportiva-free.vercel.app` |
| Envs críticas | `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_*`, Telegram, `CRON_SECRET` |

---

## E-mail (Resend)

| Campo | Valor |
|-------|--------|
| From | `SCOUT21 <scout21@intersomos.com.br>` |
| Reply-To | `scout21@intersomos.com.br` |
| Domínio | `intersomos.com.br` (verificado no Resend) |
| `RESEND_API_KEY` | _(só .env / Vercel)_ |
| Senha da caixa IMAP | **não** vai no app — só webmail |

---

## GitHub

| Campo | Valor |
|-------|--------|
| Conta correta | `gestaoesportivabi-creator` |
| Conta errada (sem write) | `coletivointersomos` |
| Auth recomendada | SSH `github.com-gestao` + chave `~/.ssh/id_ed25519_gestao` |

---

## Telegram / Assistente (se precisar)

| Campo | Onde preencher |
|-------|----------------|
| `TELEGRAM_BOT_TOKEN` | backend/.env + Vercel |
| `TELEGRAM_WEBHOOK_SECRET` | idem |
| `PUBLIC_API_URL` | URL pública da API |
| `ASSISTANT_SERVICE_TOKEN` | idem |
| Hermes | `HERMES_WEB_API_URL` / `HERMES_WEB_API_KEY` |

---

## Paperclip

Ver `docs/INTEGRACAO_PAPERCLIP.md` (URL UI + companyId).

---

## Checklist handoff

- [ ] `.local.md` preenchido e **fora** do git  
- [ ] `backend/.env` ok  
- [ ] MCP scout autenticado  
- [ ] `npm run install:all` + `npm run dev` (ou front → API online)  
- [ ] Login admin testado  
- [ ] SSH push testado (`git push` sem PAT no terminal)  

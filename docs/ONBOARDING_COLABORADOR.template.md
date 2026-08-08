# Scout 21 Pro — Onboarding colaborador

> **Uso:** duplique este arquivo como `ACESSOS_COLABORADOR.local.md`, preencha os campos `COLE_AQUI` e envie ao colaborador por canal **privado** (1Password, Signal, etc.).  
> **Nunca** commite o arquivo preenchido no Git.

---

## 1. Repositório e branch

| Item | Valor |
|------|--------|
| Repositório | https://github.com/gestaoesportivabi-creator/free |
| Branch base | `main` |
| Branch do colaborador | `feat/NOME_DO_COLABORADOR` |
| Produção (Vercel) | https://gestaoesportiva-free.vercel.app |

### Git — primeiro dia

```bash
git clone https://github.com/gestaoesportivabi-creator/free.git
cd free
git checkout main
git pull origin main
git checkout -b feat/NOME_DO_COLABORADOR
```

### Ao terminar análise / alterações

```bash
git add .
git commit -m "feat: descrição do que fez"
git push -u origin feat/NOME_DO_COLABORADOR
```

Abrir Pull Request para `main` no GitHub.

---

## 2. Pré-requisitos na máquina

- Node.js **18+** (`node -v`)
- npm **9+** (`npm -v`)
- Git
- Cursor ou VS Code (opcional)

---

## 3. Modo recomendado — só frontend (API de produção)

Não precisa de banco nem `.env` para a maioria dos testes de UI.

```bash
cd free
npm run install:all
cd 21Scoutpro
npm run dev
```

Abrir: **http://localhost:5173**

O Vite já encaminha `/api` para produção (`gestaoesportiva-free.vercel.app`).

---

## 4. Modo completo — backend local (opcional)

Crie o arquivo `backend/.env` com o conteúdo abaixo (valores preenchidos por você).

```env
# === BANCO (Supabase Scout) ===
# Projeto: mymuvraqtnoqrtuzoimj
# Painel: https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj
# LOCAL: use conexão direta :5432 (evita erro no pooler)
DATABASE_URL=COLE_AQUI_DATABASE_URL_5432
DIRECT_URL=COLE_AQUI_DIRECT_URL_5432

# === API ===
PORT=3000
NODE_ENV=development

# Mesmo JWT da Vercel (senão login local não funciona com tokens de prod)
JWT_SECRET=COLE_AQUI_JWT_SECRET
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# === Telegram (opcional — só se for testar bot local) ===
TELEGRAM_BOT_TOKEN=COLE_AQUI_OU_DEIXE_VAZIO
TELEGRAM_WEBHOOK_SECRET=COLE_AQUI_OU_DEIXE_VAZIO
PUBLIC_API_URL=http://localhost:3000
CRON_SECRET=COLE_AQUI_OU_DEIXE_VAZIO
TELEGRAM_POLLING=false
```

Subir tudo:

```bash
cd free
npm run install:all
cd backend && npx prisma generate && cd ..
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000  

---

## 5. Logins de teste

### Staff (comissão / admin)

| Campo | Valor |
|-------|--------|
| URL login | https://gestaoesportiva-free.vercel.app/login (ou localhost:5173/login) |
| Email | `COLE_AQUI_EMAIL_STAFF` |
| Senha | `COLE_AQUI_SENHA_STAFF` |
| Plano / role | `COLE_AQUI` (ex.: ADMINISTRADOR, PERFORMANCE) |

> Referência seed local (só se rodar `npm run seed:admin` em banco vazio): `admin@admin.com` / `admin` — **não usar em produção** sem confirmar com o responsável.

### Atleta (portal PSE/PSR/wellness)

| Campo | Valor |
|-------|--------|
| Email | `COLE_AQUI_EMAIL_ATLETA` |
| Senha | `COLE_AQUI_SENHA_ATLETA` |

Conta criada em: **Gestão de Equipe → Elenco → editar atleta → Permitir login**.

### Telegram (@scout21bot)

| Item | Valor |
|------|--------|
| Bot | https://t.me/scout21bot |
| Vincular | `/vincular email senha` (conta ATLETA) |
| Comandos | `/hoje`, `/preencher`, `/sair` |

---

## 6. Supabase (somente leitura / análise)

| Item | Valor |
|------|--------|
| Project ref | `mymuvraqtnoqrtuzoimj` |
| Dashboard | https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj |
| Acesso SQL Editor | `COLE_AQUI` (convite por email / sem acesso / só via app) |

### Cursor MCP (opcional)

No `~/.cursor/mcp.json`:

```json
"supabase-scout": {
  "url": "https://mcp.supabase.com/mcp?project_ref=mymuvraqtnoqrtuzoimj&read_only=true",
  "headers": {
    "Authorization": "Bearer COLE_AQUI_SUPABASE_PAT"
  }
}
```

PAT: https://supabase.com/dashboard/account/tokens

---

## 7. Vercel (opcional — só se precisar ver deploy)

| Item | Valor |
|------|--------|
| Projeto | `gestaoesportiva-free` (ou nome no painel) |
| URL | https://gestaoesportiva-free.vercel.app |
| Convite equipe | `COLE_AQUI_EMAIL_CONVIDADO_VERCEL` |

MCP Cursor (opcional):

```json
"vercel": {
  "url": "https://mcp.vercel.com"
}
```

Login OAuth em **Settings → MCP**.

---

## 8. O que **NÃO** fazer (colaborador em análise)

- Não rodar `npm run migrate`, `prisma migrate`, `supabase db push`
- Não rodar `seed:admin`, `seed:demo`, `seed:chopinzinho` em produção
- Não alterar env vars na Vercel sem autorização
- Não commitar `.env`, tokens, nem este arquivo preenchido
- Evitar criar/editar muitos dados em produção — preferir leitura e branch local

---

## 9. Checklist de testes

### Staff

- [ ] Login / logout
- [ ] Dashboard (visão geral)
- [ ] Elenco
- [ ] Programação
- [ ] Tabela de campeonato
- [ ] PSE / PSR / Bem-estar (dados via API)
- [ ] Monitoramento fisiológico
- [ ] Scout / dados do jogo
- [ ] Relatório gerencial (se tiver plano)

### Atleta

- [ ] Login portal atleta
- [ ] Hoje / PSE / PSR / Bem-estar / Perfil

### API rápida (produção)

```bash
curl -s https://gestaoesportiva-free.vercel.app/api/telegram/diagnose | head
```

---

## 10. Prompt para colar na IA (Cursor / ChatGPT)

Copie o bloco abaixo **depois** de preencher este documento:

```
Sou colaborador do Scout 21 Pro. Tenho este pacote de acesso:

- Repo: gestaoesportivabi-creator/free, branch feat/NOME
- Setup: npm run install:all → cd 21Scoutpro && npm run dev (API via proxy para produção)
- Login staff: EMAIL / SENHA (acima)
- Login atleta (opcional): EMAIL / SENHA (acima)
- Não devo rodar migrations nem seeds no banco
- Produção: https://gestaoesportiva-free.vercel.app

Me guie passo a passo para clonar, instalar, rodar local e testar os fluxos do checklist. Se eu precisar de backend local, monte o backend/.env com os valores que colei acima.
```

---

## 11. Contato

| | |
|---|---|
| Responsável | `COLE_AQUI_NOME` |
| WhatsApp / Slack | `COLE_AQUI` |
| Dúvidas de acesso | pedir antes de mudar Vercel ou Supabase |

---

*Template gerado para o projeto Scout 21 Pro — preencha e envie só por canal privado.*

# MCP no Cursor — SCOUT 21

Como conectar e usar os servidores MCP necessários para trabalhar neste repositório.

**Arquivo de config do usuário (não versionar secrets):** `~/.cursor/mcp.json`

---

## 1. Servidores do produto Scout

| Nome no Cursor | Tipo | Project ref | Uso |
|----------------|------|-------------|-----|
| **supabase-scout** | HTTP MCP Supabase | `mymuvraqtnoqrtuzoimj` | Banco **oficial** do SCOUT 21 |
| **supabase-fiscal** | HTTP MCP Supabase | `iomjrnvuvtmoteupzbuq` | Outro produto (preferir **read_only**) |

### Bloco sugerido em `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "supabase-scout": {
      "url": "https://mcp.supabase.com/mcp?project_ref=mymuvraqtnoqrtuzoimj",
      "headers": {}
    },
    "supabase-fiscal": {
      "url": "https://mcp.supabase.com/mcp?project_ref=iomjrnvuvtmoteupzbuq&read_only=true",
      "headers": {}
    },
    "cursor-app-control": {
      "url": "..."
    }
  }
}
```

(`cursor-app-control` costuma já vir do próprio Cursor.)

### Autenticar

1. Cursor → **Settings → MCP** (ou Tools & MCP)  
2. Em `supabase-scout` → **Connect / Authenticate** (OAuth Supabase)  
3. Confirme que o projeto ligado é o Scout (`mymuvraqtnoqrtuzoimj`)  
4. Repita para `supabase-fiscal` se for usar  

Sem auth, tools falham com `needsAuth`.

---

## 2. Tools úteis (`supabase-scout`)

| Tool | Quando usar |
|------|-------------|
| `list_tables` | Ver schema / contagens |
| `execute_sql` | SELECT / diagnóstico (cuidado com writes) |
| `apply_migration` | DDL versionado — pode falhar se MCP estiver read-only |
| `list_migrations` | Histórico de migrations no projeto |
| `get_logs` / `get_advisors` | Debug / segurança |
| `get_project_url` / `get_publishable_keys` | Integração client-side |
| `search_docs` | Docs Supabase |

### Regras

- **Produção:** não apagar dados reais; massa QA usa prefixo `QA` (ver `QA_ENVIRONMENT.md`).  
- Se DDL retornar *read-only transaction* → Supabase Dashboard → SQL Editor, ou:

```bash
cd backend
npx prisma db execute --file prisma/migrations/.../migration.sql --schema prisma/schema.prisma
```

- API do app **sempre** usa Prisma + `DATABASE_URL`, não o MCP.

---

## 3. Outros MCPs (opcionais)

| Server | Quando |
|--------|--------|
| `cursor-app-control` | `move_agent_to_root` se cwd quebrado (`FREE Scout`) |
| `cursor-ide-browser` | Testar UI no browser do Cursor |
| Figma / Framelink | Design — **não** colocar API key no git; configurar só no `mcp.json` local |
| `wpcom-mcp` | Sites WordPress.com (outro contexto) |

---

## 4. Checklist para outra IA

1. Workspace = `/Users/bno/Documents/Projetos/apps/scout21`  
2. `supabase-scout` aparece e status **ready** (não `needsAuth`)  
3. Consegue `list_tables` no Scout  
4. Sabe que fiscal ≠ scout  
5. Não pede nem cola chaves de `mcp.json` no chat  

---

## 5. Dashboard (humano)

- Scout: https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj  
- Fiscal: https://supabase.com/dashboard/project/iomjrnvuvtmoteupzbuq  

Quem configura MCP precisa estar logado na organização Supabase com acesso a esses projetos.

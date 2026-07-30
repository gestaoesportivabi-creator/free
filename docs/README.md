# Documentação SCOUT 21 PRO

## Comece aqui (IA / colaborador novo)

1. **[ONBOARDING_IA.md](./ONBOARDING_IA.md)** — caminho, stack, como rodar, regras  
2. **[MCP_CURSOR.md](./MCP_CURSOR.md)** — Supabase Scout/Fiscal + auth Cursor  
3. **[ONBOARDING_COLABORADOR.template.md](./ONBOARDING_COLABORADOR.template.md)** — checklist de acessos (sem senhas)  
4. `ACESSOS_COLABORADOR.local.md` — preenchido na máquina (**gitignored**)  
5. Raiz: **[AGENTS.md](../AGENTS.md)**

Pasta local correta: `/Users/bno/Documents/Projetos/apps/scout21`

---

## Coleta / cronômetro / QA (Fase 003)

- [QA_GUIDE.md](./QA_GUIDE.md)
- [QA_ENVIRONMENT.md](./QA_ENVIRONMENT.md)
- [EVENT_MATRIX.md](./EVENT_MATRIX.md)
- [COLLECTION_UX_GLOSSARY.md](./COLLECTION_UX_GLOSSARY.md)
- Relatórios: `SPRINT_003A_REPORT.md` … `SPRINT_003E_1_VISUAL_POLISH_REPORT.md`

## Coleta V2 / Shell experimental (Fase 004)

- [PLANO_MESTRE_COLETA_V2.md](./PLANO_MESTRE_COLETA_V2.md) — plano mestre (layout, sprints, portão §14)
- Relatórios: `SPRINT_004C_1A_SHELL_VISUAL_ARCHITECTURE_REPORT.md`, `SPRINT_004C_1B_SHELL_ACCESS_REPORT.md`, `SPRINT_004D_REPORT.md` … `SPRINT_004H_REPORT.md`
- [SPRINT_004H_OPERATOR_READINESS.md](./SPRINT_004H_OPERATOR_READINESS.md) — protocolo A/B (sem resultados inventados)
- [SHELL_METRICS_OPERATOR_COLLECTION.md](./SHELL_METRICS_OPERATOR_COLLECTION.md) — como exportar `__scout21CollectionShellMetricSummary__`
- [SPRINT_004J_DECISION_GATE.md](./SPRINT_004J_DECISION_GATE.md) — critérios de promoção e decisão **não promover**
- [SPRINT_004J_REPORT.md](./SPRINT_004J_REPORT.md) — fechamento 004J / evidência agregada

## Produto / integrações

- [ACESSO_ATLETA.md](./ACESSO_ATLETA.md)
- [TELEGRAM_BOT.md](./TELEGRAM_BOT.md) / [TELEGRAM_COACH.md](./TELEGRAM_COACH.md)
- [INTEGRACAO_PAPERCLIP.md](./INTEGRACAO_PAPERCLIP.md)
- [SETUP_SUPABASE_UNICO.md](./SETUP_SUPABASE_UNICO.md)

## Setup / deploy

- [setup/DEPLOY.md](./setup/DEPLOY.md)
- [setup/DATABASE_OPTIONS.md](./setup/DATABASE_OPTIONS.md)
- Backend: `../backend/docs/APLICAR_MIGRACOES_SUPABASE.md`

## Schema / banco (referência)

- Pasta [database/](./database/) — prompts de modelagem  
- Fonte viva: `backend/prisma/schema.prisma`

## Arquivo / legado

- [archive/](./archive/) — histórico (Google Sheets etc.). **Não** usar como verdade atual.

---

## Estrutura antiga (mapa)

### `/database`
Entidades e prompts de schema.

### `/setup`
Deploy e opções de banco (parte ainda cita Sheets — preferir Supabase).

### `/archive`
Debug e guias obsoletos.

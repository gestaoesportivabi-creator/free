# Scout 21 — notas para agentes

## Cursor Cloud

- Repo GitHub: `gestaoesportivabi-creator/free` (produto Scout 21 / scout21.com.br)
- Ambiente: `.cursor/environment.json` (`install:all` + Prisma generate; terminais backend + frontend)
- **Secrets** (dashboard Cloud Agents → Environment → Secrets), nunca no git:
  - Backend: `DATABASE_URL`, JWT/auth, e-mail (Resend), etc. (ver `backend/.env.example` se existir)
  - Frontend build/dev: `VITE_*` necessários (API URL, GA4 só se for testar analytics)
- Produção: Vercel em https://scout21.com.br — Cloud Agent **não** substitui deploy; use PR → main
- QA: conta `qa.scout21+jose` — não criar trial novo a cada ciclo; ver `docs/PASS10_FINAL_BUGS_1_5.md`
- **Não** retrabalhar restore de `clockSnapshot` (Bug 1 / `f588b01`) sem regressão explícita

## Layout

| Pasta | Papel |
|-------|--------|
| `21Scoutpro/` | Frontend Vite/React |
| `backend/` | API Express + Prisma |
| `docs/` | Planos, QA, domínio |

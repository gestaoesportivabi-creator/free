#!/usr/bin/env bash
#
# Scout 21 — install para Cloud Agent (roda uma vez; cria o snapshot do ambiente).
# Idempotente: pode rodar de novo com segurança.
#
# Estratégia de banco:
#   - Se DATABASE_URL já vier de um Secret do dashboard (ex.: Supabase), usa esse banco
#     e NÃO sobe Postgres local.
#   - Caso contrário, provisiona um Postgres local no próprio VM para um ambiente de dev
#     self-contained (não exige credenciais de produção).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/4] Dependências Node (root + frontend + backend)"
npm run install:all

echo "==> [2/4] Prisma Client"
npm run prisma:generate

if [ -n "${DATABASE_URL:-}" ]; then
  echo "==> DATABASE_URL detectada no ambiente — usando banco externo, pulando Postgres local."
else
  echo "==> [3/4] Provisionando Postgres local (nenhuma DATABASE_URL externa definida)"
  bash "$ROOT/.cursor/db-provision.sh" --seed
fi

echo "==> [4/4] Arquivos de env de desenvolvimento"
# Frontend aponta para o backend local
if [ ! -f "$ROOT/21Scoutpro/.env.local" ]; then
  echo "VITE_API_URL=http://localhost:3000/api" > "$ROOT/21Scoutpro/.env.local"
fi

echo "==> install concluído."

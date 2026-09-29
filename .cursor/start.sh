#!/usr/bin/env bash
#
# Scout 21 — start para Cloud Agent (roda a cada boot, antes dos terminais).
# Sobe o Postgres local (quando não há DATABASE_URL externa) e garante schema.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "==> DATABASE_URL externa definida — sem Postgres local para iniciar."
  exit 0
fi

bash "$ROOT/.cursor/db-provision.sh"
echo "==> start concluído (Postgres local pronto em localhost:5432)."

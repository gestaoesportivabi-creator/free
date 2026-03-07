#!/usr/bin/env bash
# Aplica migrações 009 e 011 no banco Supabase (produção).
# Uso: DIRECT_URL="postgresql://..." ./scripts/apply-migrations-supabase.sh
# Execute a partir da raiz do backend: cd backend && ./scripts/apply-migrations-supabase.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

if [ -z "${DIRECT_URL}" ]; then
  echo "Erro: defina DIRECT_URL com a connection string direta do Supabase (porta 5432)."
  echo "Ex.: export DIRECT_URL=\"postgresql://postgres.[ref]:[senha]@...\""
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "Erro: psql não encontrado. Instale o cliente PostgreSQL ou use o SQL Editor do Supabase."
  exit 1
fi

echo "Aplicando migração 009 (jogadores: max_loads_json, foto_url TEXT)..."
psql "$DIRECT_URL" -f migrations/009_add_maxloads_and_fotourl_text.sql
echo "Aplicando migração 011 (jogos: post_match_event_log, lineup, etc.)..."
psql "$DIRECT_URL" -f migrations/011_add_match_json_fields.sql
echo "Concluído."

#!/usr/bin/env bash
#
# Provisiona/garante um Postgres local para o dev do Scout 21 no Cloud Agent.
# Idempotente: seguro para rodar no install (uma vez) e no start (a cada boot).
#
#   db-provision.sh          -> garante servidor + banco + schema
#   db-provision.sh --seed   -> além disso, roda os seeds (admin sempre; demo se vazio)
set -euo pipefail

PG_VER=16
DB_NAME=scout21
DB_URL="postgresql://postgres:postgres@localhost:5432/${DB_NAME}?schema=public"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DO_SEED="${1:-}"

echo "--> Garantindo pacote postgresql-${PG_VER}"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

echo "--> Garantindo cluster online"
if ! sudo pg_lsclusters -h 2>/dev/null | awk '{print $4}' | grep -q online; then
  sudo pg_ctlcluster "$PG_VER" main start || true
fi

echo "--> Aguardando Postgres aceitar conexões"
for _ in $(seq 1 30); do
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "--> Garantindo senha do postgres + banco ${DB_NAME}"
sudo -u postgres psql -tAc "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" >/dev/null
fi

echo "--> Escrevendo backend/.env (dev local) se não existir"
if [ ! -f "$ROOT/backend/.env" ]; then
  cat > "$ROOT/backend/.env" <<EOF
DATABASE_URL=${DB_URL}
DIRECT_URL=${DB_URL}
PORT=3000
NODE_ENV=development
JWT_SECRET=dev-local-secret-change-me
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_DISABLED=true
EMAIL_FROM=SCOUT21 <contato@scout21.com.br>
EMAIL_REPLY_TO=gestaoesportivabi@gmail.com
EOF
fi

# Os scripts de seed usam o Prisma Client (src/config/database.ts), que NÃO carrega
# .env automaticamente (só o server via src/config/env.ts). Exportamos aqui para que
# push e seeds funcionem de forma determinística, independente de dotenv.
export DATABASE_URL="$DB_URL"
export DIRECT_URL="$DB_URL"

echo "--> Garantindo schema (prisma db push) se a tabela users não existir"
HAS_USERS="$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.users') IS NOT NULL;" | tr -d '[:space:]')"
if [ "$HAS_USERS" != "t" ]; then
  # A schema.prisma versionada usa @db.Uuid só em CoachAssistantAudit, o que quebra o
  # `db push` de um banco novo (FK uuid vs users.id text). Para o schema LOCAL de dev,
  # normalizamos p/ text — o Prisma trata uuid/text como String em runtime, então o
  # Client gerado do schema real continua funcionando igual.
  cp "$ROOT/backend/prisma/schema.prisma" /tmp/scout21.schema.local.prisma
  sed -i 's/ @db.Uuid//g' /tmp/scout21.schema.local.prisma
  ( cd "$ROOT/backend" && npx prisma db push --schema /tmp/scout21.schema.local.prisma --skip-generate )
fi

if [ "$DO_SEED" = "--seed" ]; then
  echo "--> Seed admin (upsert idempotente)"
  ( cd "$ROOT/backend" && npm run seed:admin >/dev/null )
  PLAYERS="$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT count(*) FROM jogadores;" 2>/dev/null | tr -d '[:space:]' || echo 0)"
  if [ "${PLAYERS:-0}" = "0" ]; then
    echo "--> Seed demo (banco vazio)"
    ( cd "$ROOT/backend" && npm run seed:demo >/dev/null )
  else
    echo "--> Demo já populado (${PLAYERS} jogadores) — pulando seed:demo"
  fi
fi

echo "--> db-provision OK (${DB_URL})"

#!/bin/bash

# Script para configurar o banco de dados PostgreSQL
# SCOUT 21 - Backend Setup

set -e

echo "🚀 Configurando banco de dados PostgreSQL para SCOUT 21..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Nome do container
CONTAINER_NAME="scout21-postgres"
DB_NAME="scout21"
DB_USER="scout21"
DB_PASSWORD="scout21"
DB_PORT="5432"

# Verificar se o container já existe
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "📦 Container $CONTAINER_NAME já existe"
    
    # Verificar se está rodando
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo "✅ Container já está rodando"
    else
        echo "🔄 Iniciando container existente..."
        docker start $CONTAINER_NAME
        sleep 3
    fi
else
    echo "🐳 Criando novo container PostgreSQL..."
    docker run --name $CONTAINER_NAME \
        -e POSTGRES_USER=$DB_USER \
        -e POSTGRES_PASSWORD=$DB_PASSWORD \
        -e POSTGRES_DB=$DB_NAME \
        -p $DB_PORT:5432 \
        -d postgres:14
    
    echo "⏳ Aguardando PostgreSQL iniciar..."
    sleep 5
fi

# Verificar se está rodando
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ PostgreSQL está rodando em localhost:$DB_PORT"
    echo ""
    echo "📝 Atualize o arquivo .env com:"
    echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME?schema=public\""
    echo ""
    echo "🔄 Agora execute as migrations:"
    echo "   cd backend"
    echo "   npx prisma migrate dev --name init"
    echo "   # Ou execute manualmente:"
    echo "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < migrations/000_seed_roles.sql"
else
    echo "❌ Erro ao iniciar o container PostgreSQL"
    exit 1
fi


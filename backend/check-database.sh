#!/bin/bash
echo "🔍 Verificando configuração do banco de dados..."
echo ""

# Verificar .env
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado"
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')
    echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
else
    echo "❌ Arquivo .env não encontrado"
fi

echo ""
echo "📦 Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado"
    if docker ps | grep -q scout21-postgres; then
        echo "✅ Container PostgreSQL rodando"
    else
        echo "⚠️  Container PostgreSQL não está rodando"
        echo "   Execute: docker start scout21-postgres"
    fi
else
    echo "⚠️  Docker não instalado"
fi

echo ""
echo "🐘 Verificando PostgreSQL local..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL CLI encontrado"
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "✅ PostgreSQL rodando na porta 5432"
    else
        echo "⚠️  PostgreSQL não está rodando na porta 5432"
    fi
else
    echo "⚠️  PostgreSQL CLI não encontrado"
fi

echo ""
echo "🔧 Testando conexão com Prisma..."
if npx prisma db pull --schema=prisma/schema.prisma &> /dev/null; then
    echo "✅ Conexão com banco OK!"
else
    echo "❌ Não foi possível conectar ao banco"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Instale Docker ou PostgreSQL"
    echo "   2. Configure o banco de dados"
    echo "   3. Execute as migrations"
    echo ""
    echo "   Veja: QUICK_START.md para instruções detalhadas"
fi

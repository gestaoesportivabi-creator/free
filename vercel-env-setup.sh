#!/bin/bash

# 🚀 Script de Configuração Automática - Vercel
# Configura todas as variáveis de ambiente no Vercel via CLI

set -e

echo "🚀 Configurando variáveis de ambiente no Vercel..."
echo ""

# Verifica se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado!"
    echo "📦 Instalando Vercel CLI..."
    npm i -g vercel
fi

# Verifica se está logado
if ! vercel whoami &> /dev/null; then
    echo "🔐 Faça login no Vercel:"
    vercel login
fi

echo ""
echo "📋 Vamos configurar as variáveis de ambiente!"
echo ""

# Pergunta qual projeto configurar
echo "Qual projeto você quer configurar?"
echo "1. Frontend (21Scoutpro) - só se tiver 2 projetos separados"
echo "2. Backend / Deploy único (recomendado - frontend+backend no mesmo domínio)"
read -p "Escolha (1 ou 2): " project_choice

if [ "$project_choice" = "1" ]; then
    PROJECT_TYPE="frontend"
    echo ""
    read -p "🔗 Digite a URL do seu BACKEND no Vercel (ex: https://scout21-backend-abc123.vercel.app): " BACKEND_URL
    VITE_API_URL="${BACKEND_URL}/api"
    
    echo ""
    echo "📝 Configurando variáveis para o FRONTEND..."
    echo ""
    
    # Configura VITE_API_URL
    echo "✅ Configurando VITE_API_URL..."
    echo "$VITE_API_URL" | vercel env add VITE_API_URL production preview development
    
    echo ""
    echo "✅ Frontend configurado com sucesso!"
    echo "   VITE_API_URL=$VITE_API_URL"
    
elif [ "$project_choice" = "2" ]; then
    PROJECT_TYPE="backend"
    
    # DATABASE_URL - Pooler (porta 6543) para serverless Vercel
    # Alinhado com package.json supabase:link - projeto jhjrqnggsfeztgkpqcjm
    DATABASE_URL="postgresql://postgres.jhjrqnggsfeztgkpqcjm:%23Gestaoesportiva21@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
    
    # DIRECT_URL - Obrigatório pelo Prisma schema (porta 5432)
    DIRECT_URL="postgresql://postgres:%23Gestaoesportiva21@db.jhjrqnggsfeztgkpqcjm.supabase.co:5432/postgres?sslmode=require"
    
    # Gera JWT_SECRET
    echo "🔑 Gerando JWT_SECRET..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo ""
    read -p "🔗 Digite a URL do seu deploy no Vercel (ex: https://seu-projeto.vercel.app): " FRONTEND_URL
    
    CORS_ORIGIN="$FRONTEND_URL"
    
    echo ""
    echo "📝 Configurando variáveis para o BACKEND..."
    echo ""
    
    # Configura DATABASE_URL
    echo "✅ Configurando DATABASE_URL..."
    echo "$DATABASE_URL" | vercel env add DATABASE_URL production preview development
    
    # Configura DIRECT_URL (obrigatório pelo Prisma schema)
    echo "✅ Configurando DIRECT_URL..."
    echo "$DIRECT_URL" | vercel env add DIRECT_URL production preview development
    
    # Configura JWT_SECRET
    echo "✅ Configurando JWT_SECRET..."
    echo "$JWT_SECRET" | vercel env add JWT_SECRET production preview development
    
    # Configura JWT_EXPIRES_IN
    echo "✅ Configurando JWT_EXPIRES_IN..."
    echo "7d" | vercel env add JWT_EXPIRES_IN production preview development
    
    # Configura NODE_ENV
    echo "✅ Configurando NODE_ENV..."
    echo "production" | vercel env add NODE_ENV production preview development
    
    # Configura CORS_ORIGIN
    echo "✅ Configurando CORS_ORIGIN..."
    echo "$CORS_ORIGIN" | vercel env add CORS_ORIGIN production preview development
    
    # Configura FRONTEND_URL
    echo "✅ Configurando FRONTEND_URL..."
    echo "$FRONTEND_URL" | vercel env add FRONTEND_URL production preview development
    
    echo ""
    echo "✅ Backend configurado com sucesso!"
    echo ""
    echo "⚠️  IMPORTANTE: Copie o JWT_SECRET abaixo para backend/.env (local) para que"
    echo "   tokens de login funcionem em ambos os ambientes (local e produção)."
    echo ""
    echo "📋 Variáveis configuradas:"
    echo "   DATABASE_URL=*** (pooler 6543)"
    echo "   DIRECT_URL=*** (direta 5432)"
    echo "   JWT_SECRET=$JWT_SECRET"
    echo "   JWT_EXPIRES_IN=7d"
    echo "   NODE_ENV=production"
    echo "   CORS_ORIGIN=$CORS_ORIGIN"
    echo "   FRONTEND_URL=$FRONTEND_URL"
    
else
    echo "❌ Opção inválida!"
    exit 1
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "⚠️  IMPORTANTE: Faça um Redeploy no Vercel para aplicar as mudanças!"
echo "   Vercel Dashboard → Deployments → Redeploy"

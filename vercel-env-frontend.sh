#!/bin/bash

# 🚀 Script para Configurar Frontend no Vercel
# Configura VITE_API_URL no projeto scout21
# Uso: ./vercel-env-frontend.sh [URL_DO_BACKEND]

set -e

echo "🚀 Configurando Frontend (scout21) no Vercel..."
echo ""

# Verifica se está logado
if ! vercel whoami &> /dev/null; then
    echo "🔐 Faça login no Vercel:"
    vercel login
fi

# Pega a URL do backend (parâmetro ou pergunta)
if [ -n "$1" ]; then
    BACKEND_URL="$1"
else
    echo ""
    read -p "🔗 Digite a URL do seu BACKEND API (ex: https://scout21-backend.vercel.app ou deixe vazio para usar localhost): " BACKEND_URL
fi

# Se vazio, usa localhost (desenvolvimento)
if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="http://localhost:3000"
    echo "⚠️  Usando localhost (desenvolvimento): $BACKEND_URL"
fi

# Remove /api se o usuário já colocou
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's|/api$||')
VITE_API_URL="${BACKEND_URL}/api"

echo ""
echo "📝 Configurando VITE_API_URL no projeto scout21..."
echo "   URL: $VITE_API_URL"
echo ""

# Tenta linkar o projeto se necessário (na pasta do frontend)
if [ -d "21Scoutpro" ]; then
    cd 21Scoutpro
    if [ ! -f ".vercel/project.json" ]; then
        echo "🔗 Linkando projeto scout21..."
        vercel link --project=scout21 --yes 2>/dev/null || echo "⚠️  Erro ao linkar (pode já estar linkado)"
    fi
    cd ..
fi

# Configura a variável de ambiente
echo "$VITE_API_URL" | vercel env add VITE_API_URL production preview development

echo ""
echo "✅ Frontend configurado com sucesso!"
echo ""
echo "📋 Variável configurada:"
echo "   VITE_API_URL=$VITE_API_URL"
echo ""
echo "⚠️  IMPORTANTE: Faça um Redeploy no Vercel para aplicar as mudanças!"
echo "   Vercel Dashboard → scout21 → Deployments → Redeploy"

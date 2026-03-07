# Script para configurar o banco de dados PostgreSQL no Windows
# SCOUT 21 PRO - Backend Setup (equivalente ao setup-database.sh do Mac)

Write-Host "Configurando banco de dados PostgreSQL para SCOUT 21 PRO..." -ForegroundColor Cyan

# Verificar se Docker está instalado
try {
    $null = docker --version
} catch {
    Write-Host "Docker nao esta instalado. Por favor, instale o Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

$CONTAINER_NAME = "scout21pro-db"
$DB_NAME = "scout21pro"
$DB_USER = "scout21pro"
$DB_PASSWORD = "scout21pro"
$DB_PORT = "5432"

# Verificar se o container já existe
$existing = docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
if ($existing -eq $CONTAINER_NAME) {
    Write-Host "Container $CONTAINER_NAME ja existe" -ForegroundColor Yellow
    
    $running = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
    if ($running -eq $CONTAINER_NAME) {
        Write-Host "Container ja esta rodando" -ForegroundColor Green
    } else {
        Write-Host "Iniciando container existente..." -ForegroundColor Yellow
        docker start $CONTAINER_NAME
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "Criando novo container PostgreSQL..." -ForegroundColor Green
    docker run --name $CONTAINER_NAME `
        -e POSTGRES_USER=$DB_USER `
        -e POSTGRES_PASSWORD=$DB_PASSWORD `
        -e POSTGRES_DB=$DB_NAME `
        -p "5432:5432" `
        -d postgres:14
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Banco configurado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Atualize o backend/.env com:" -ForegroundColor Yellow
Write-Host "DATABASE_URL=postgresql://scout21pro:scout21pro@localhost:5432/scout21pro?schema=public"
Write-Host "DIRECT_URL=postgresql://scout21pro:scout21pro@localhost:5432/scout21pro?schema=public"
Write-Host ""
Write-Host "Depois execute:" -ForegroundColor Yellow
Write-Host "  npx prisma db push"
Write-Host "  npx tsx scripts/seed-roles.ts"
Write-Host "  npm run seed:demo"
Write-Host ""

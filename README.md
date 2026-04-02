<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏆 SCOUT 21 PRO - Sistema de Gestão Esportiva

Sistema completo de scout, análise e gestão para equipes esportivas com backend PostgreSQL e deploy único no Vercel.

## 🚀 Deploy Online

**Para colocar o sistema online, consulte o guia completo:** [docs/setup/DEPLOY.md](./docs/setup/DEPLOY.md)

### Opções Rápidas:
- **Vercel** (Recomendado - Mais fácil): https://vercel.com
- **Netlify**: https://netlify.com
- **GitHub Pages**: Veja instruções em docs/setup/DEPLOY.md

O sistema está configurado para deploy único no Vercel (frontend + backend no mesmo domínio).
Último disparo manual de deploy na branch `versoes`: 2026-03-30.

## 💻 Executar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL (ou use Supabase - veja [backend/CONEXAO_SUPABASE.md](./backend/CONEXAO_SUPABASE.md))

### Instalação Completa

1. **Instalar dependências do projeto:**
   ```bash
   npm install
   cd 21Scoutpro && npm install
   cd ../backend && npm install
   ```

2. **Configurar backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Editar .env com suas configurações (veja backend/README.md)
   ```

3. **Configurar banco de dados:**
   - Veja [backend/SETUP_DATABASE.md](./backend/SETUP_DATABASE.md) para setup local
   - Ou [backend/CONEXAO_SUPABASE.md](./backend/CONEXAO_SUPABASE.md) para usar Supabase

4. **Executar migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

5. **Iniciar backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend estará em `http://localhost:3000`

6. **Iniciar frontend:**
   ```bash
   cd 21Scoutpro
   npm run dev
   ```
   Frontend estará em `http://localhost:5173`

7. **Criar conta:**
   - Acesse `http://localhost:5173`
   - Clique em "Criar Conta Grátis"
   - Preencha os dados e crie sua conta

## 📦 Build para Produção

```bash
cd 21Scoutpro
npm run build
```

Os arquivos otimizados serão gerados na pasta `21Scoutpro/dist/`.

## 📚 Documentação

A documentação está organizada na pasta `docs/`:

### Setup e Configuração
- **Deploy:** [docs/setup/DEPLOY.md](./docs/setup/DEPLOY.md)
- **Deploy Único (Vercel):** [DEPLOY_UNICO.md](./DEPLOY_UNICO.md)
- **Vercel Config:** [docs/setup/VERCEL_CONFIG.md](./docs/setup/VERCEL_CONFIG.md)
- **Google Apps Script:** [docs/setup/GOOGLE_APPS_SCRIPT_SETUP.md](./docs/setup/GOOGLE_APPS_SCRIPT_SETUP.md)
- **Database Options:** [docs/setup/DATABASE_OPTIONS.md](./docs/setup/DATABASE_OPTIONS.md)

### Backend
- **Backend:** [backend/README.md](./backend/README.md)
- **Arquitetura:** [backend/docs/architecture.md](./backend/docs/architecture.md)
- **Setup Database:** [backend/SETUP_DATABASE.md](./backend/SETUP_DATABASE.md)
- **Conexão Supabase:** [backend/CONEXAO_SUPABASE.md](./backend/CONEXAO_SUPABASE.md)

### Database Schema
- **Entidades Conceituais:** [docs/database/ENTIDADES_CONCEITUAIS_LANDING_PAGE.md](./docs/database/ENTIDADES_CONCEITUAIS_LANDING_PAGE.md)
- **Schema Final:** [docs/database/PROMPT_9_SCHEMA_FINAL.md](./docs/database/PROMPT_9_SCHEMA_FINAL.md)
- **Validação:** [docs/database/VALIDACAO_FINAL.md](./docs/database/VALIDACAO_FINAL.md)

### Arquivos Arquivados
Documentos temporários e de debug estão em `docs/archive/` para referência histórica.

## 🏗️ Arquitetura

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Supabase)
- **Deploy:** Vercel (deploy único)
- **Autenticação:** JWT
- **Multi-tenancy:** Isolamento completo por técnico/clube

## ⚠️ Importante

- O sistema usa **PostgreSQL** como banco de dados principal
- Dados são persistidos no banco (não localStorage)
- Suporta múltiplos técnicos com isolamento completo de dados
- Pronto para produção com deploy único no Vercel

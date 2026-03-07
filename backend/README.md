# SCOUT 21 PRO - Backend PostgreSQL

Backend completo para sistema de gestão esportiva, construído com Node.js, Express, TypeScript e PostgreSQL.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Editar .env com suas configurações
```

3. Executar migrations:
```bash
npm run migrate
```

4. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações
│   ├── models/          # Models do ORM (português)
│   ├── controllers/     # Controllers (inglês)
│   ├── services/        # Lógica de negócio
│   ├── repositories/    # Acesso a dados
│   ├── routes/          # Rotas RESTful
│   ├── middleware/      # Middlewares
│   ├── validators/      # Validações
│   ├── adapters/        # Adaptadores frontend
│   └── utils/           # Utilitários
├── migrations/          # Migrations SQL
├── docs/                # Documentação
└── prisma/              # Schema Prisma (se usar)
```

## 📚 Documentação

- [Convenções Arquiteturais](./docs/architecture.md)
- [Documentação da API](./docs/api.md)

## 🔧 Scripts

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm run start` - Inicia servidor em produção
- `npm run migrate` - Executa migrations
- `npm run lint` - Executa linter
- `npm run type-check` - Verifica tipos TypeScript

## 🔐 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias.

## 📖 Convenções

Consulte [docs/architecture.md](./docs/architecture.md) para convenções arquiteturais completas.

**Resumo:**
- API/Rotas → Inglês
- Domínio/Banco/Models → Português
- Controller → Service → Repository → Adapter

## 🗄️ Database

O sistema usa PostgreSQL com schema completo definido em `migrations/`.

Para criar o banco:
```bash
createdb scout21pro
npm run migrate
```

## 🧪 Desenvolvimento

O servidor usa hot-reload em desenvolvimento. Alterações em arquivos `.ts` reiniciam automaticamente.

## 📝 Licença

ISC


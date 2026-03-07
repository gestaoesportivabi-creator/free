# 🏆 SCOUT 21 PRO - Frontend

Frontend React + TypeScript do sistema de gestão esportiva.

## 🚀 Quick Start

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build

```bash
npm run build
```

## 📁 Estrutura

```
21Scoutpro/
├── components/      # Componentes React
├── services/        # Serviços de API
├── types.ts         # Definições de tipos
├── config.ts        # Configuração da API
└── App.tsx          # Componente principal
```

## 🔗 Integração com Backend

O frontend se conecta ao backend PostgreSQL via API REST:

- **Desenvolvimento:** `http://localhost:3000/api`
- **Produção:** `/api` (URL relativa quando deployado no Vercel)

A URL é configurada automaticamente em `config.ts`.

## 📚 Documentação

- **Deploy:** Veja [../DEPLOY_UNICO.md](../DEPLOY_UNICO.md)
- **Backend:** Veja [../backend/README.md](../backend/README.md)

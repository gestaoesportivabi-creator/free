# 🚀 Setup Inicial - Computador Novo

Este guia ajuda a configurar tudo do zero para rodar o **Backend** e **Frontend** do projeto SCOUT 21 PRO.

---

## 1️⃣ Instalar Node.js (OBRIGATÓRIO)

O projeto usa **Node.js** para rodar tanto o backend quanto o frontend.

### Passos:

1. Acesse: **https://nodejs.org**
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador (.msi)
4. Siga as instruções (Next, Next...)
5. **Marque a opção** "Automatically install necessary tools" (se aparecer)
6. Ao finalizar, **feche e abra o terminal** (PowerShell ou CMD) para que as alterações tenham efeito

### Verificar instalação:

```powershell
node --version
npm --version
```

Deve mostrar algo como `v22.x.x` e `10.x.x`.

---

## 2️⃣ Instalar Dependências do Projeto

Abra o terminal na pasta do projeto e execute:

```powershell
cd c:\Users\scout\Desktop\treinadores
npm run install:all
```

Isso instala as dependências da raiz, do backend e do frontend.

---

## 3️⃣ Configurar o Banco de Dados (Prisma)

O backend usa **Supabase** (PostgreSQL na nuvem). O arquivo `.env` já está configurado.

Gere o Prisma Client:

```powershell
cd backend
npx prisma generate
cd ..
```

---

## 4️⃣ Rodar Backend e Frontend

Na pasta raiz do projeto:

```powershell
npm run dev
```

Isso inicia:
- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5173

Abra o navegador em **http://localhost:5173** para usar o sistema.

---

## 🔑 Credenciais de Teste

- **Email:** admin@admin.com
- **Senha:** admin

---

## 🆘 Problemas Comuns

### "node não é reconhecido"
- Reinicie o terminal após instalar o Node.js
- Verifique se o Node.js foi instalado: `node --version`

### "Cannot connect to database"
- Verifique sua conexão com a internet
- O Supabase precisa estar acessível

### Porta já em uso
- Feche outros programas que usam as portas 3000 ou 5173
- Ou altere a porta no arquivo `backend/.env`

---

**Última atualização:** Janeiro 2025

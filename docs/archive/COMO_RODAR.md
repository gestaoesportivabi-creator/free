# 🚀 Como Rodar o Sistema - Guia Prático

## ⚡ Opção Rápida (AGORA - 30 segundos)

Se você quer **apenas testar** o sistema:

```bash
cd /Users/bno/Documents/gestaoesportiva/21Scoutpro
npm run dev
```

Acesse: **http://localhost:5173**

**Login:**
- Email: `treinador@clube.com`
- Senha: `afc25`

✅ **Pronto!** Você está dentro do sistema.

---

## 📝 Criar Seu Primeiro Treinador (5 minutos)

### Passo 1: Criar Treinador

```bash
node scripts/create-coach.js
```

**Exemplo de preenchimento:**
```
👤 Nome completo: João Silva
📧 Email (será o login): joao@email.com
🔒 Senha: senha123
⚽ Nome do time: AFC Lions
🏃 Esporte (futsal/futebol/handebol/basquete) [futsal]: futsal
📷 URL da foto (opcional, Enter para pular): [Enter]

✅ Confirmar criação? (s/n): s
```

### Passo 2: Ver Resultado

```bash
✅ TREINADOR CRIADO COM SUCESSO!

📁 Pasta criada em: data/coaches/joao@email.com

📝 Próximos passos:
1. Criar planilha no Google Sheets
2. Configurar Google Apps Script
3. Adicionar ID da planilha em: spreadsheet-id.txt
```

### Passo 3: Rodar Sistema

```bash
npm run dev
```

Acesse: **http://localhost:5173**
- Email: `joao@email.com`
- Senha: `senha123`

---

## ☁️ Sistema Completo com Google Drive (Automático)

### Pré-requisito: Configurar Google Cloud (1ª vez apenas)

1. **Acesse:** https://console.cloud.google.com

2. **Criar Projeto:**
   - Nome: "Scout 21 Pro"
   - Clique em "Criar"

3. **Habilitar APIs:**
   - Menu: APIs e Serviços > Biblioteca
   - Busque e ative:
     - ✅ Google Drive API
     - ✅ Google Sheets API

4. **Criar Credenciais:**
   - Menu: APIs e Serviços > Credenciais
   - Clique: "+ CRIAR CREDENCIAIS"
   - Escolha: "ID do cliente OAuth"
   - Tipo: "Aplicativo para computador"
   - Nome: "Scout 21 Pro CLI"

5. **Baixar JSON:**
   - Clique no ícone de download
   - Salve como: `scripts/google-credentials.json`

```bash
# Mover o arquivo baixado
mv ~/Downloads/client_secret_*.json scripts/google-credentials.json
```

### Testar Autorização

```bash
node scripts/test-google-auth.js
```

Autorize quando o navegador abrir.

### Criar Treinador (Tudo Automático!)

```bash
node scripts/create-coach-drive.js
```

**Resultado:**
```
✅ TREINADOR CRIADO COM SUCESSO!

📁 Estrutura Local: data/coaches/joao@email.com
☁️  Pasta Drive: https://drive.google.com/drive/folders/...
📊 Planilha: https://docs.google.com/spreadsheets/d/...

✅ Pasta criada no Drive
✅ Planilha criada com 11 abas
✅ Headers configurados
✅ Dados iniciais adicionados
✅ Apps Script preparado
```

### Implantar Apps Script

1. Abra a planilha (link fornecido acima)
2. Vá em **Extensões > Apps Script**
3. Cole o código de: `data/coaches/joao@email.com/apps-script.js`
4. Clique em **Salvar** (💾)
5. Clique em **Implantar > Nova implantação**
6. Tipo: **Aplicativo da Web**
7. Executar como: **Eu**
8. Quem tem acesso: **Qualquer pessoa**
9. Clique em **Implantar**
10. **Copie a URL** gerada

### Configurar API

Edite: `src/config.ts`

```typescript
export const API_URL = 'https://script.google.com/macros/s/SUA_URL_AQUI/exec';
```

### Rodar Sistema

```bash
npm run dev
```

Acesse: **http://localhost:5173**
- Email: `joao@email.com`
- Senha: `senha123`

---

## 📋 Comandos Úteis

```bash
# Ver treinadores cadastrados
node scripts/list-coaches.js

# Criar treinador (manual)
node scripts/create-coach.js

# Criar treinador (automático com Drive)
node scripts/create-coach-drive.js

# Deletar treinador
node scripts/delete-coach.js joao@email.com

# Rodar sistema
npm run dev

# Build para produção
npm run build

# Ver preview do build
npm run preview
```

---

## 🔍 Ver Status

### Listar Treinadores

```bash
node scripts/list-coaches.js
```

**Saída:**
```
🏆 SCOUT 21 PRO - Lista de Treinadores

📊 Total de treinadores: 2

1. ✅ Ativo | João Silva
   📧 Email: joao@email.com
   ⚽ Time: AFC Lions
   🏃 Esporte: futsal
   📅 Criado: 05/01/2024
   📊 Planilha: ✅ Configurada
   📁 Pasta: data/coaches/joao@email.com/

2. ✅ Ativo | Maria Santos
   📧 Email: maria@email.com
   ⚽ Time: FC Winners
   🏃 Esporte: futsal
   📅 Criado: 05/01/2024
   📊 Planilha: ⚠️  Pendente
   📁 Pasta: data/coaches/maria@email.com/
```

### Ver Detalhes de um Treinador

```bash
cat data/coaches/joao@email.com/config.json
```

---

## 🌐 Acessar o Sistema

### Desenvolvimento Local

```bash
npm run dev
```

**URL:** http://localhost:5173

### Build de Produção

```bash
# Gerar build
npm run build

# Testar build
npm run preview
```

**URL:** http://localhost:4173

---

## 🆘 Problemas Comuns

### Porta 5173 ocupada

```
Error: Port 5173 is already in use
```

**Solução:**
```bash
# Matar processo
lsof -ti:5173 | xargs kill -9

# Ou usar outra porta
npm run dev -- --port 3000
```

### Erro ao fazer login

```
❌ Coach não encontrado ou inativo
```

**Soluções:**
1. Verifique o email (case-sensitive)
2. Liste treinadores: `node scripts/list-coaches.js`
3. Verifique se `active: true` no config.json

### Planilha não carrega dados

```
❌ Erro ao carregar dados da API
```

**Soluções:**
1. Verifique se configurou `API_URL` no `config.ts`
2. Teste a URL: `[URL]/exec?path=players&method=GET`
3. Verifique console do navegador (F12)
4. Confirme que o Apps Script foi implantado

### Treinador não aparece

```bash
# Verifique se foi criado
ls -la data/coaches/

# Liste todos
node scripts/list-coaches.js

# Ver config
cat data/coaches/[email]/config.json
```

---

## 📱 Interface do Sistema

Após fazer login, você verá:

### Dashboard
- Frases motivacionais
- Alertas de programação
- Acesso rápido às funcionalidades

### Menu Lateral
- 🏠 Visão Geral
- 📊 Scout Coletivo
- 👤 Performance Atletas
- 📈 Ranking
- 💪 Scout Físico
- 🏃 Avaliação Física
- 🎥 Scout de Vídeo
- 📅 Programação
- 🏆 Tabela Campeonato
- 📝 Input de Dados
- ⏱️ Controle de Tempo
- 👥 Gestão de Equipe
- ⚙️ Configurações

---

## 🔄 Fluxo Recomendado

### Para Testar Rápido (5 min)
```
1. npm run dev
2. Login: treinador@clube.com / afc25
3. Explorar o sistema
```

### Para Uso Real (20 min primeira vez)
```
1. Configurar Google Cloud (15 min - 1ª vez)
2. node scripts/create-coach-drive.js (2 min)
3. Implantar Apps Script (2 min)
4. Configurar config.ts (1 min)
5. npm run dev
6. Fazer login e usar!
```

### Para Adicionar Mais Treinadores (2 min cada)
```
1. node scripts/create-coach-drive.js
2. Implantar Apps Script na planilha
3. Pronto!
```

---

## 📊 Resumo Visual

```
┌─────────────────────────────┐
│   OPÇÃO 1: Teste Rápido     │
│   npm run dev               │
│   (30 segundos)             │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Login: treinador@clube.com  │
│ Senha: afc25                │
└─────────────────────────────┘

──────────────────────────────

┌─────────────────────────────┐
│ OPÇÃO 2: Criar Treinador    │
│ create-coach.js             │
│ (5 minutos)                 │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Criar planilha manual       │
│ no Google Sheets            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ npm run dev                 │
│ Login: seu@email.com        │
└─────────────────────────────┘

──────────────────────────────

┌─────────────────────────────┐
│ OPÇÃO 3: Sistema Completo   │
│ Google Cloud + Drive        │
│ (15 min primeira vez)       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ create-coach-drive.js       │
│ (2 minutos)                 │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ ✅ Pasta criada no Drive     │
│ ✅ Planilha criada           │
│ ✅ Tudo configurado          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Implantar Apps Script       │
│ (2 minutos)                 │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ npm run dev                 │
│ Login: seu@email.com        │
│ 🎉 Tudo funcionando!         │
└─────────────────────────────┘
```

---

## 🎯 Recomendação

**Para começar AGORA:**
```bash
npm run dev
```
Login: `treinador@clube.com` / `afc25`

**Para usar com seus dados:**
```bash
node scripts/create-coach.js
```

**Para sistema completo (melhor opção):**
```bash
# Primeiro configure Google Cloud (veja GOOGLE_DRIVE_SETUP.md)
# Depois:
node scripts/create-coach-drive.js
```

---

## 📚 Mais Informações

- `INICIO_RAPIDO.md` - Guia de início rápido
- `GUIA_TREINADORES.md` - Guia completo
- `GOOGLE_DRIVE_SETUP.md` - Configurar Google Drive
- `RESUMO_SISTEMA_TREINADORES.md` - Visão técnica

---

**🏆 Scout 21 Pro - Escolha uma opção e comece agora!**


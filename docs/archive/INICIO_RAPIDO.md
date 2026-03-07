# 🚀 Início Rápido - Sistema Multi-Treinador

## ✅ O que você tem agora

Um sistema completo onde **cada treinador** tem:
- ✅ Login e senha próprios
- ✅ Pasta no Google Drive (criada automaticamente)
- ✅ Planilha Google Sheets (criada automaticamente com 11 abas)
- ✅ Dados isolados e seguros
- ✅ Sistema pronto para usar

---

## 🎯 Começar AGORA (3 opções)

### OPÇÃO 1: Tudo Automático com Google Drive ⭐ RECOMENDADO

**Tempo: ~15 minutos (primeira vez)**

#### 1️⃣ Configurar Google Cloud (APENAS 1ª VEZ)

```bash
# Siga o guia completo
cat GOOGLE_DRIVE_SETUP.md
```

**Resumo rápido:**
1. Acesse: https://console.cloud.google.com
2. Crie projeto "Scout 21 Pro"
3. Habilite APIs: Drive + Sheets
4. Crie credenciais OAuth 2.0
5. Baixe JSON → salve como `scripts/google-credentials.json`

#### 2️⃣ Testar Autorização

```bash
node scripts/test-google-auth.js
```

#### 3️⃣ Criar Seu Primeiro Treinador

```bash
node scripts/create-coach-drive.js
```

**Exemplo de preenchimento:**
```
👤 Nome completo: João Silva
📧 Email: joao@email.com
🔒 Senha: senha123
⚽ Nome do time: AFC Lions
🏃 Esporte: futsal
📷 URL da foto: [Enter para pular]
```

#### 4️⃣ Resultado

```
✅ TREINADOR CRIADO COM SUCESSO!

📁 Local: data/coaches/joao@email.com
☁️  Drive: https://drive.google.com/...
📊 Planilha: https://docs.google.com/spreadsheets/d/...
```

#### 5️⃣ Finalizar (Apenas Apps Script)

1. Abra a planilha (link acima)
2. Vá em **Extensões > Apps Script**
3. Cole o código de: `data/coaches/joao@email.com/apps-script.js`
4. Clique em **Implantar > Nova implantação**
5. Tipo: **Aplicativo da Web**
6. Quem tem acesso: **Qualquer pessoa**
7. Copie a **URL gerada**

#### 6️⃣ Configurar no Sistema

Edite: `src/config.ts`

```typescript
export const API_URL = 'https://script.google.com/macros/s/SUA_URL/exec';
```

#### 7️⃣ Usar o Sistema

```bash
npm run dev
```

Acesse: http://localhost:5173
- Email: joao@email.com
- Senha: senha123

🎉 **PRONTO!**

---

### OPÇÃO 2: Criação Manual (Sem Google Drive)

**Tempo: ~20 minutos**

```bash
# 1. Criar treinador
node scripts/create-coach.js

# 2. Criar planilha manualmente no Google Sheets
# 3. Seguir instruções em:
cat data/coaches/[email]/README.md
```

---

### OPÇÃO 3: Usar Demo (Sem criar treinador)

```bash
npm run dev
```

Acesse: http://localhost:5173
- Email: treinador@clube.com
- Senha: afc25

⚠️ **Nota:** Os dados não são persistidos (usa localStorage)

---

## 📋 Comandos Principais

```bash
# Ver treinadores cadastrados
node scripts/list-coaches.js

# Criar novo treinador (automático)
node scripts/create-coach-drive.js

# Criar novo treinador (manual)
node scripts/create-coach.js

# Deletar treinador
node scripts/delete-coach.js [email]

# Iniciar sistema
npm run dev

# Build para produção
npm run build
```

---

## 📁 Estrutura Criada

```
21Scoutpro/
├── data/
│   └── coaches/
│       └── joao@email.com/
│           ├── config.json          ← Dados do treinador
│           ├── spreadsheet-id.txt   ← ID da planilha
│           ├── apps-script.js       ← Código pronto
│           └── README.md            ← Instruções específicas
│
├── scripts/
│   ├── create-coach-drive.js        ← USAR ESTE ⭐
│   ├── create-coach.js
│   ├── list-coaches.js
│   ├── delete-coach.js
│   ├── test-google-auth.js
│   ├── google-drive-setup.js
│   └── google-credentials.json      ← VOCÊ CRIA (Google Cloud)
│
└── src/
    ├── config.ts                    ← Configurar API_URL aqui
    └── services/
        └── auth.ts                  ← Sistema de autenticação
```

---

## 🔐 Segurança IMPORTANTE

### Arquivos para NÃO commitar no Git:

```bash
# Já está no .gitignore
scripts/google-credentials.json     # Credenciais Google
scripts/google-token.json           # Token de acesso
data/coaches/                       # Dados dos treinadores
```

---

## 🎯 O que cada Treinador TEM

### Google Drive:
- 📁 Pasta: "Scout 21 Pro - [Time]"
- 📊 Planilha: "[Time] - Dados"
  - 11 abas pré-configuradas
  - Headers já adicionados
  - Dados iniciais (competições, metas)

### Sistema:
- 🔐 Login exclusivo
- 👥 Gestão de atletas
- 📊 Scout coletivo e individual
- 💪 Avaliação física
- 📅 Programação semanal
- 🏆 Tabela de campeonato
- ⏱️ Controle de tempo
- 📈 Rankings e estatísticas

### NÃO TEM (versão Clube):
- ❌ Orçamento
- ❌ Salários
- ❌ Gestão financeira

---

## 📚 Documentação Completa

1. **GUIA_TREINADORES.md** - Guia completo
2. **GOOGLE_DRIVE_SETUP.md** - Configurar Google Drive
3. **RESUMO_SISTEMA_TREINADORES.md** - Visão geral técnica
4. **scripts/README.md** - Documentação dos scripts
5. **data/coaches/[email]/README.md** - Instruções específicas

---

## 🆘 Problemas Comuns

### 1. Não encontra google-credentials.json

```
❌ Arquivo google-credentials.json não encontrado!
```

**Solução:** Baixe do Google Cloud Console e salve em `scripts/`

### 2. Erro de autorização

```
❌ Access denied
```

**Solução:** 
1. Verifique se as APIs estão habilitadas
2. Delete `scripts/google-token.json`
3. Execute novamente

### 3. Planilha não carrega dados

**Solução:**
1. Verifique se implantou o Apps Script
2. Teste a URL: `[URL]/exec?path=players&method=GET`
3. Veja logs no console (F12)

### 4. Treinador já existe

```
❌ Treinador com email X já existe!
```

**Solução:** Use outro email ou delete o existente primeiro

---

## ✅ Checklist Rápido

### Configuração Inicial (1ª vez)
- [ ] Criar projeto Google Cloud
- [ ] Habilitar APIs (Drive + Sheets)
- [ ] Criar credenciais OAuth
- [ ] Baixar google-credentials.json
- [ ] Executar `npm install`
- [ ] Testar autorização

### Para Cada Treinador
- [ ] Executar create-coach-drive.js
- [ ] Verificar pasta e planilha criadas
- [ ] Implantar Apps Script
- [ ] Copiar URL da API
- [ ] Configurar config.ts
- [ ] Testar login

---

## 🚀 Fluxo Visual

```
┌─────────────────────────────────┐
│ 1. Configurar Google Cloud      │ ← Apenas 1ª vez
│    (15 min)                      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. npm install                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. Testar autorização           │
│    test-google-auth.js          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. Criar treinador              │ ← 2 min por treinador
│    create-coach-drive.js        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ ✅ Pasta no Drive criada         │
│ ✅ Planilha criada               │
│ ✅ 11 abas configuradas          │
│ ✅ Headers adicionados           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. Implantar Apps Script        │ ← Apenas 1x por treinador
│    (manual - 2 min)             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 6. Configurar API URL           │
│    (config.ts)                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 7. npm run dev                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 🎉 SISTEMA FUNCIONANDO!          │
│    localhost:5173               │
└─────────────────────────────────┘
```

---

## 💡 Dicas Importantes

1. **Primeira vez leva ~15 min** (configurar Google Cloud)
2. **Depois: ~2 min por treinador** (tudo automático!)
3. **Backup automático** pelo Google Drive
4. **Cada treinador é independente**
5. **Escalável para centenas de treinadores**

---

## 🎯 Próximo Passo

**Execute agora:**

```bash
# Se já configurou Google Cloud:
node scripts/create-coach-drive.js

# Se é primeira vez:
cat GOOGLE_DRIVE_SETUP.md
```

---

**🏆 Scout 21 Pro - Sistema Profissional para Treinadores**

*Dúvidas? Consulte os arquivos de documentação ou execute os scripts para ver mensagens de ajuda.*


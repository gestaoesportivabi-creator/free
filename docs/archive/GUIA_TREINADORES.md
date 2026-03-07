# 👨‍🏫 Guia Completo - Versão para Treinadores

## 🎯 Visão Geral

Esta é a versão **Scout 21 Pro para Treinadores**, onde cada treinador tem:
- ✅ Login e senha próprios
- ✅ Pasta de dados exclusiva
- ✅ Planilha Google Sheets privada
- ✅ Gestão independente do time

---

## 📊 Funcionalidades Disponíveis

### ✅ Para Treinadores:
- Scout Coletivo (análise tática)
- Scout Individual (performance de atletas)
- Gestão de Atletas (sem dados financeiros)
- Avaliação Física
- Scout Físico (carga de treino)
- Vídeo Scout
- Programação Semanal
- Tabela de Campeonato
- Input de Dados de Partidas
- Controle de Tempo Jogado
- Ranking de Atletas
- Configurações

### ❌ Removidas (versão Clube):
- Orçamento (entradas e despesas)
- Salários dos jogadores
- Gestão financeira
- Relatórios gerenciais financeiros

---

## 🚀 Guia Rápido de Uso

### 1. Criar Novo Treinador

```bash
cd /Users/bno/Documents/gestaoesportiva/21Scoutpro
node scripts/create-coach.js
```

**Exemplo de preenchimento:**
```
👤 Nome completo: João Silva
📧 Email (será o login): joao@email.com
🔒 Senha: senha123
⚽ Nome do time: AFC Lions
🏃 Esporte (futsal/futebol/handebol/basquete) [futsal]: futsal
📷 URL da foto (opcional, Enter para pular): 
```

**Resultado:**
```
✅ TREINADOR CRIADO COM SUCESSO!
📁 Pasta criada em: data/coaches/joao@email.com
```

---

### 2. Ver Treinadores Cadastrados

```bash
node scripts/list-coaches.js
```

**Exemplo de saída:**
```
🏆 SCOUT 21 PRO - Lista de Treinadores

1. ✅ Ativo | João Silva
   📧 Email: joao@email.com
   ⚽ Time: AFC Lions
   🏃 Esporte: futsal
   📅 Criado: 05/01/2024
   📊 Planilha: ⚠️  Pendente
   📁 Pasta: data/coaches/joao@email.com/
```

---

### 3. Configurar Google Sheets

#### 3.1. Criar Planilha

1. Acesse: https://sheets.google.com
2. Clique em "➕ Nova planilha"
3. Renomeie para: **"AFC Lions - Scout 21 Pro"**

#### 3.2. Criar Abas

Crie 11 abas com estes nomes EXATOS:

1. `players`
2. `matches`
3. `match_player_stats`
4. `injuries`
5. `assessments`
6. `schedules`
7. `schedule_days`
8. `competitions`
9. `stat_targets`
10. `time_controls`
11. `championship_matches`

#### 3.3. Adicionar Headers

Na primeira linha de cada aba, cole os headers (veja `GOOGLE_SHEETS_SETUP.md`)

**Exemplo para aba `players`:**
```
id | name | nickname | position | photoUrl | jerseyNumber | dominantFoot | age | height | lastClub | isTransferred | transferDate
```

#### 3.4. Configurar Google Apps Script

1. Na planilha, vá em **Extensões > Apps Script**
2. Delete o código padrão
3. Cole o conteúdo de: `google-apps-script-COMPLETO.js`
4. Na linha `const SPREADSHEET_ID = '...'`, cole o ID da sua planilha:
   - URL: `https://docs.google.com/spreadsheets/d/ABC123XYZ/edit`
   - ID: `ABC123XYZ`
5. Clique em **Salvar** (💾)
6. Clique em **Executar** > `test` (para testar)
7. Autorize o script quando solicitado
8. Clique em **Implantar** > **Nova implantação**
9. Escolha **Aplicativo da Web**
10. Configure:
    - **Executar como:** Eu (seu email)
    - **Quem tem acesso:** Qualquer pessoa
11. Clique em **Implantar**
12. **Copie a URL** gerada (algo como: `https://script.google.com/macros/s/...`)

#### 3.5. Salvar ID da Planilha

```bash
# Edite o arquivo spreadsheet-id.txt
nano data/coaches/joao@email.com/spreadsheet-id.txt

# Cole apenas o ID (sem a URL completa):
ABC123XYZ
```

#### 3.6. Configurar URL da API no Sistema

Edite o arquivo: `src/config.ts`

```typescript
export const API_URL = 'https://script.google.com/macros/s/SUA_URL_AQUI/exec';
```

---

### 4. Fazer Login no Sistema

1. Inicie o servidor:
```bash
npm run dev
```

2. Acesse: http://localhost:5173

3. Faça login com:
   - **Email:** joao@email.com
   - **Senha:** senha123

4. Comece a usar! 🎉

---

## 📁 Estrutura de Arquivos

```
21Scoutpro/
├── data/
│   └── coaches/
│       ├── joao@email.com/
│       │   ├── config.json              # Dados do treinador
│       │   ├── spreadsheet-id.txt       # ID da planilha
│       │   └── README.md                # Instruções específicas
│       └── maria@email.com/
│           ├── config.json
│           ├── spreadsheet-id.txt
│           └── README.md
├── scripts/
│   ├── create-coach.js                  # Criar treinador
│   ├── list-coaches.js                  # Listar treinadores
│   ├── delete-coach.js                  # Deletar treinador
│   └── README.md                        # Documentação CLI
└── services/
    └── auth.ts                          # Sistema de autenticação
```

---

## 🔐 Segurança

### Senhas
- Armazenadas com hash SHA-256
- Nunca mostradas em logs ou arquivos
- Recomendado: mínimo 8 caracteres, letras e números

### Planilhas
- Cada treinador tem sua própria planilha
- Configure permissões no Google Sheets
- Não compartilhe com pessoas não autorizadas

### Dados Locais
- Arquivo `config.json` contém dados sensíveis
- Não commitar pasta `data/` no Git
- Fazer backup regular

---

## 🎨 Personalização

### Alterar Nome do Time

Edite: `data/coaches/[email]/config.json`

```json
{
  "teamName": "Novo Nome do Time"
}
```

### Alterar Esporte

```json
{
  "sport": "futebol"
}
```

Opções: `futsal`, `futebol`, `handebol`, `basquete`, `volei`

### Alterar Foto

```json
{
  "photoUrl": "https://nova-url-da-foto.com/foto.jpg"
}
```

---

## 🔄 Deploy em Produção

### Opção 1: Vercel (Recomendado)

```bash
npm run build
vercel --prod
```

### Opção 2: Netlify

```bash
npm run build
netlify deploy --prod
```

### Configuração Adicional para Produção:

1. **Variáveis de Ambiente:**
```
VITE_API_URL=https://script.google.com/macros/s/.../exec
VITE_ENVIRONMENT=production
```

2. **Autenticação Real:**
   - Implementar backend com JWT
   - Usar banco de dados (PostgreSQL/MySQL)
   - Adicionar refresh tokens

3. **Backup:**
   - Configurar backup automático das planilhas
   - Exportar dados periodicamente

---

## 🆘 Solução de Problemas

### Não consigo fazer login

1. Verifique se o email está correto
2. Execute: `node scripts/list-coaches.js`
3. Confirme que `active: true` no config.json
4. Tente resetar a senha (ver seção Manutenção)

### Planilha não carrega dados

1. Verifique se o ID está correto em `spreadsheet-id.txt`
2. Teste a URL da API no navegador: `[URL]/exec?path=players&method=GET`
3. Verifique permissões do Google Apps Script
4. Veja logs no console do navegador (F12)

### Erro ao criar treinador

```
❌ Treinador com email X já existe!
```
- Delete o treinador existente: `node scripts/delete-coach.js [email]`
- Ou use outro email

### Google Apps Script não autoriza

1. Acesse: https://myaccount.google.com/permissions
2. Remova permissões antigas do script
3. Autorize novamente ao executar `test()`

---

## 📊 Dados Necessários para Cada Treinador

```javascript
{
  "name": "Nome Completo",           // Obrigatório
  "email": "email@dominio.com",      // Obrigatório, único
  "password": "senha",               // Obrigatório, mínimo 4 caracteres
  "teamName": "Nome do Time",        // Obrigatório
  "sport": "futsal",                 // Obrigatório
  "photoUrl": "https://..."          // Opcional
}
```

---

## 🔧 Comandos Úteis

```bash
# Criar novo treinador
node scripts/create-coach.js

# Listar todos
node scripts/list-coaches.js

# Ver detalhes de um treinador
cat data/coaches/joao@email.com/config.json

# Deletar treinador
node scripts/delete-coach.js joao@email.com

# Iniciar sistema
npm run dev

# Build para produção
npm run build
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte o README.md na pasta do treinador
2. Veja a documentação completa na raiz do projeto
3. Execute os scripts com `-h` para ajuda

---

**🏆 Scout 21 Pro - Sistema Profissional de Gestão Esportiva**


# 📝 Configuração do Google Apps Script - SCOUT 21 PRO

## 🚀 Passo a Passo Completo

### **1. Abrir o Google Apps Script**

1. Abra sua planilha no Google Sheets
2. Vá em: **Extensões** > **Apps Script**
3. Uma nova aba será aberta com o editor de código

---

### **2. Colar o Código**

1. **DELETE** todo o código que está lá (função `myFunction`)
2. Abra o arquivo `google-apps-script.js` deste projeto
3. **COPIE TODO O CÓDIGO**
4. **COLE** no editor do Google Apps Script
5. Salve (Ctrl+S ou ícone de salvar)

---

### **3. Configurar o ID da Planilha** ⚠️ IMPORTANTE

1. No código, encontre a linha:
   ```javascript
   const SPREADSHEET_ID = 'SUA_PLANILHA_ID';
   ```

2. Encontre o ID da sua planilha:
   - Olhe a URL da planilha no navegador
   - URL exemplo: `https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit`
   - O ID é: `ABC123XYZ789` (a parte entre `/d/` e `/edit`)

3. Substitua `'SUA_PLANILHA_ID'` pelo ID real:
   ```javascript
   const SPREADSHEET_ID = 'ABC123XYZ789';
   ```

4. **SALVE** novamente (Ctrl+S)

---

### **4. Verificar Nomes das Abas**

Certifique-se que os nomes das abas na sua planilha correspondem exatamente aos nomes no código:

```javascript
const SHEETS = {
  players: 'players',
  matches: 'matches',
  matchPlayerStats: 'match_player_stats',
  injuries: 'injuries',
  assessments: 'assessments',
  schedules: 'schedules',
  scheduleDays: 'schedule_days',
  budgetEntries: 'budget_entries',
  budgetExpenses: 'budget_expenses',
  competitions: 'competitions',
  statTargets: 'stat_targets',
  users: 'users'
};
```

**Se os nomes forem diferentes, altere no código!**

---

### **5. Autorizar o Script** 🔐

1. No editor do Google Apps Script, clique no menu **Executar** > **doGet**
2. Será solicitada autorização:
   - Clique em **Revisar permissões**
   - Escolha sua conta Google
   - Clique em **Avançado** > **Ir para [nome do projeto] (não seguro)**
   - Clique em **Permitir**
3. Aguarde alguns segundos até aparecer "Autorização concedida"

---

### **6. Publicar como Aplicativo Web** 🌐

1. No editor do Google Apps Script, vá em **Publicar** > **Implantar como aplicativo da web**
2. Configure:
   - **Executar como:** Eu (seu e-mail)
   - **Quem tem acesso:** Qualquer pessoa, mesmo sem login
3. Clique em **Implantar**
4. **COPIE A URL** que aparece (algo como: `https://script.google.com/macros/s/ABC123/exec`)
5. **IMPORTANTE:** Guarde essa URL! Você precisará dela no código React

---

### **7. Testar a API**

Abra no navegador (substitua pela sua URL):

```
https://script.google.com/macros/s/SUA_URL/exec?path=players&method=GET
```

Deve retornar JSON com os dados da aba "players".

---

## 📡 Como Usar a API

### **Endpoints Disponíveis:**

#### **GET - Listar todos:**
```
GET /exec?path=players&method=GET
GET /exec?path=matches&method=GET
GET /exec?path=injuries&method=GET
... (todos os recursos)
```

#### **GET - Por ID:**
```
GET /exec?path=players/p1&method=GET
GET /exec?path=matches/m1&method=GET
```

#### **POST - Criar:**
```
POST /exec?path=players&method=POST
Body: { "id": "p1", "name": "João", "position": "Ala", ... }
```

#### **PUT - Atualizar:**
```
PUT /exec?path=players/p1&method=PUT
Body: { "name": "João Silva", ... }
```

#### **DELETE - Deletar:**
```
DELETE /exec?path=players/p1&method=DELETE
```

---

## 🔍 Recursos Disponíveis:

- `players`
- `matches`
- `match-player-stats`
- `injuries`
- `assessments`
- `schedules`
- `schedule-days`
- `budget-entries`
- `budget-expenses`
- `competitions`
- `stat-targets`
- `users`

---

## 🧪 Função de Teste

No editor do Google Apps Script, você pode executar a função `test()` para verificar se está funcionando:

1. Selecione a função `test` no dropdown
2. Clique em **Executar**
3. Veja os logs em **Execuções** (menu à esquerda)

---

## ⚠️ Problemas Comuns

### **Erro: "Script não autorizado"**
- Execute a função `doGet` novamente para autorizar

### **Erro: "Aba não encontrada"**
- Verifique se os nomes das abas correspondem exatamente
- Verifique se as abas existem na planilha

### **Erro: "ID não encontrado"**
- Certifique-se que a coluna "id" existe em todas as abas
- Verifique se o ID que está buscando realmente existe

### **Erro: "Acesso negado"**
- Na publicação, certifique-se que está como "Qualquer pessoa, mesmo sem login"

---

## 📝 Próximo Passo

Após configurar o Google Apps Script:

1. ✅ URL da API copiada
2. ✅ Testar endpoints no navegador
3. 🔄 Integrar no código React (próximo passo)

---

**✅ Pronto! Seu Google Apps Script está configurado e pronto para uso!**










# ⚠️ IMPORTANTE: Atualizar o Google Apps Script

## 🔴 Problema Identificado

O erro de CORS ocorre porque o Google Apps Script não suporta preflight requests (OPTIONS) quando usamos `Content-Type: application/json`.

## ✅ Solução Aplicada

Mudei a forma de enviar os dados para usar `application/x-www-form-urlencoded`, que evita o problema de CORS.

## 📝 O QUE VOCÊ PRECISA FAZER AGORA

### 1. Copiar o Código Atualizado

O arquivo `google-apps-script-COMPLETO.js` foi atualizado para processar dados como form-urlencoded.

### 2. Atualizar no Google Apps Script

1. Abra sua planilha no Google Sheets
2. Vá em **Extensões > Apps Script**
3. **DELETE todo o código atual**
4. Abra o arquivo `google-apps-script-COMPLETO.js` neste projeto
5. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
6. **Cole no Google Apps Script** (Ctrl+V)
7. **Salve** (Ctrl+S)

### 3. Fazer Novo Deploy (IMPORTANTE!)

1. No Google Apps Script, clique em **"Implantar"**
2. Clique em **"Gerenciar implantações"**
3. Clique no ícone de **lápis (editar)** na implantação existente
4. Em **"Versão"**, selecione **"Nova versão"**
5. Clique em **"Implantar"**

**OU**

1. No Google Apps Script, clique em **"Implantar"**
2. Clique em **"Implantar como aplicativo da web"**
3. Configure:
   - **Executar como:** Eu
   - **Quem tem acesso:** Qualquer pessoa, mesmo sem login
   - **Versão:** Nova versão
4. Clique em **"Implantar"**
5. Copie a URL gerada (se for diferente da anterior)

### 4. Atualizar a URL no Config (se necessário)

Se a URL mudou após o novo deploy, atualize o arquivo `config.ts` com a nova URL.

### 5. Testar Novamente

1. Recarregue a página do sistema (F5)
2. Tente cadastrar um atleta
3. Verifique se funciona!

## 🔍 O Que Mudou?

- **Antes:** Enviava dados como JSON (`Content-Type: application/json`)
- **Agora:** Envia dados como form-urlencoded (`Content-Type: application/x-www-form-urlencoded`)

Isso evita o problema de CORS porque não requer preflight request!









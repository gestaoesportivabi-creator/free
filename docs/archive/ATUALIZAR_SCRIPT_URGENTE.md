# 🚨 ATUALIZAÇÃO URGENTE DO GOOGLE APPS SCRIPT

## ⚠️ PROBLEMA
Erros "Record not found" ao deletar e ativar programações. O problema é que:
1. Os IDs não estavam sendo comparados corretamente (string vs número)
2. Arrays/objetos complexos (como `days`) não estavam sendo salvos corretamente

## ✅ SOLUÇÃO
O código do Google Apps Script foi corrigido para:
1. Comparar IDs como strings
2. Converter arrays/objetos para JSON ao salvar
3. Parsear JSON de volta ao ler

## 📝 O QUE FAZER

### 1. Abrir o Google Apps Script
- Abra sua planilha no Google Sheets
- Extensões > Apps Script

### 2. Copiar o Código Corrigido
- Abra o arquivo `google-apps-script-COMPLETO.js` neste projeto
- Selecione TODO o conteúdo (Ctrl+A)
- Copie (Ctrl+C)

### 3. Colar no Google Apps Script
- DELETE todo o código atual no Google Apps Script
- Cole o código novo (Ctrl+V)
- Salve (Ctrl+S)

### 4. Fazer Novo Deploy
- Clique em "Implantar" > "Gerenciar implantações"
- Clique no ícone de editar (lápis)
- Em "Versão", selecione "Nova versão"
- Clique em "Implantar"

### 5. Testar
- Tente deletar uma programação
- Tente ativar uma programação
- Deve funcionar agora!

---

## 🔍 O QUE FOI CORRIGIDO

1. **Comparação de IDs**: Agora todos os IDs são convertidos para string antes de comparar
2. **Arrays/Objetos**: Arrays como `days` são salvos como JSON string e parseados ao ler
3. **Funções afetadas**: `getDataById`, `updateData`, `deleteData`, `getAllData`, `insertData`, `rowToObject`, `objectToRow`

---

**IMPORTANTE**: Após atualizar o código, faça um NOVO DEPLOY para que as mudanças tenham efeito!









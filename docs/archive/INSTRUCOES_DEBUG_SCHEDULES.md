# 🔧 Debug: Deletar e Ativar Programações

## ⚠️ PROBLEMA
Não consegue deletar programações e não consegue ativar programações para que os alertas apareçam.

## ✅ CORREÇÕES APLICADAS

### 1. Logs de Debug Adicionados
- Logs detalhados no Google Apps Script para identificar o problema
- Logs no frontend (console) para rastrear requisições
- Logs mostram IDs, nomes de abas, e resultados

### 2. Melhorias no Código
- Validação melhorada de IDs
- Comparação de strings mais robusta
- Mensagens de erro mais detalhadas

## 📝 O QUE VOCÊ PRECISA FAZER

### 1. Atualizar o Google Apps Script (OBRIGATÓRIO!)
1. Abra sua planilha no Google Sheets
2. Extensões > Apps Script
3. DELETE todo o código atual
4. Copie TODO o conteúdo de `google-apps-script-COMPLETO.js`
5. Cole no Google Apps Script
6. Salve (Ctrl+S)
7. Fazer NOVO DEPLOY (Nova versão)

### 2. Testar e Verificar Logs
1. Recarregue a página (F5)
2. Abra o Console do navegador (F12 > Console)
3. Tente deletar uma programação
4. Tente ativar uma programação (bandeira)
5. Veja os logs no console:
   - `🗑️ Tentando deletar...`
   - `📡 URL da requisição...`
   - `📥 Resposta...`

### 3. Verificar Logs do Google Apps Script
1. No Google Apps Script, vá em "Execuções" (ícone de relógio)
2. Veja os logs das últimas execuções
3. Procure por mensagens que começam com:
   - `deleteData chamado...`
   - `updateData chamado...`
   - `ID encontrado...` ou `ID não encontrado...`

## 🔍 O QUE VERIFICAR

### Se o erro for "Record not found":
1. Verifique se o ID na planilha corresponde ao ID que está sendo enviado
2. Verifique se a aba `schedules` existe na planilha
3. Verifique se a coluna `id` existe na primeira linha da aba `schedules`
4. Verifique se os IDs na planilha são strings (não números)

### Se o erro for "ID column not found":
1. Verifique se a primeira linha da aba `schedules` tem uma coluna chamada `id` (exatamente assim, minúsculo)

### Se não aparecer nenhum erro mas não funcionar:
1. Verifique os logs do Google Apps Script
2. Me envie os logs do console e do Google Apps Script

## 📋 CHECKLIST

- [ ] Google Apps Script atualizado com o código novo
- [ ] Novo deploy feito (Nova versão)
- [ ] Página recarregada (F5)
- [ ] Console aberto (F12)
- [ ] Tentou deletar uma programação
- [ ] Tentou ativar uma programação
- [ ] Verificou os logs no console
- [ ] Verificou os logs no Google Apps Script

---

**IMPORTANTE**: Após atualizar o código e fazer o deploy, os logs vão mostrar exatamente onde está o problema!









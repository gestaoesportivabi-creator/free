# ✅ Teste da API - Google Apps Script

## 🎉 ID Configurado com Sucesso!

O ID da sua planilha já está configurado corretamente:
```
1h1EeCezkEfFZ-ox0brs3G8f0f4DODEsTXv10WYduL2w
```

---

## 🧪 Como Testar a API

### **1. Teste Básico no Navegador**

Abra esta URL no navegador (substitua pela sua URL real):

```
https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec?path=players&method=GET
```

**Resultado esperado:**
- Se as abas existirem e tiverem dados: Retorna JSON com os dados
- Se as abas estiverem vazias: Retorna `{"success": true, "data": []}`
- Se houver erro: Retorna `{"success": false, "error": "..."}`

---

### **2. Testar Outros Recursos**

Substitua `players` por outros recursos:

```
# Listar matches (jogos)
https://script.google.com/macros/s/SUA_URL/exec?path=matches&method=GET

# Listar competitions (competições)
https://script.google.com/macros/s/SUA_URL/exec?path=competitions&method=GET

# Listar budget-entries (entradas orçamentárias)
https://script.google.com/macros/s/SUA_URL/exec?path=budget-entries&method=GET
```

---

### **3. Testar no Console do Navegador (React)**

1. Abra o sistema React
2. Pressione **F12** para abrir o console
3. Você verá mensagens como:
   - `🔄 Carregando dados da API...`
   - `✅ Dados carregados com sucesso!`
   - Ou erros caso algo não funcione

---

## ✅ Checklist de Verificação

- [x] SPREADSHEET_ID configurado corretamente
- [x] Execução do script concluída sem erros
- [ ] Testar URL no navegador
- [ ] Verificar se as abas existem na planilha
- [ ] Testar sistema React carregando dados

---

## 🔍 Possíveis Problemas

### **Erro: "Resource not found"**

**Causa:** As abas não existem na planilha ou têm nomes diferentes

**Solução:**
1. Verifique se as abas existem na planilha
2. Os nomes devem ser exatamente:
   - `players`
   - `matches`
   - `match_player_stats`
   - `injuries`
   - `assessments`
   - `schedules`
   - `schedule_days`
   - `budget_entries`
   - `budget_expenses`
   - `competitions`
   - `stat_targets`
   - `users`

### **Erro: "Sheet not found"**

**Causa:** O ID da planilha está incorreto ou você não tem acesso

**Solução:**
1. Verifique se o ID está correto
2. Certifique-se de ter acesso à planilha

### **Erro: "Access denied"**

**Causa:** O Web App não está configurado corretamente

**Solução:**
1. Vá em: Publicar > Implantar como aplicativo da web
2. Configure:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa, mesmo sem login**
3. Clique em **Implantar** novamente

---

## 📝 Próximos Passos

1. ✅ **Testar URL no navegador** - Verificar se retorna dados
2. ✅ **Verificar abas na planilha** - Certificar que todas existem
3. ✅ **Abrir sistema React** - Ver se carrega os dados
4. ✅ **Testar criar/editar** - Verificar se salva na planilha

---

**✅ Tudo pronto! Agora é só testar!**










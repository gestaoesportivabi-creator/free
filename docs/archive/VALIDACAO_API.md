# ✅ Guia de Validação da API

## 🎯 Objetivo
Validar se o Google Apps Script está funcionando corretamente e se a integração com o frontend está operacional.

---

## 📋 Passo 1: Testar Função `test()` no Google Apps Script

### Como fazer:
1. No Google Apps Script, no dropdown superior, selecione a função `test`
2. Clique em **"▷ Executar"** (ou pressione Ctrl+Enter)
3. Aguarde a execução
4. Clique em **"Registro de execução"** para ver os logs

### ✅ Resultado esperado:
```
🧪 Testando conexão com planilha...
✅ Planilha obtida com sucesso!
📋 Nome da planilha: [Nome da sua planilha]
✅ Aba obtida/criada com sucesso!
✅ Dados obtidos: X registros
✅✅✅ Todos os testes passaram! ✅✅✅
```

### ❌ Se der erro:
- Verifique se a planilha está aberta
- Confirme que o script está dentro da planilha (Extensões > Apps Script)

---

## 🌐 Passo 2: Verificar Deploy da API

### Como fazer:
1. No Google Apps Script, clique em **"Implantar"** > **"Implantar como aplicativo da web"**
2. Verifique se está configurado:
   - **Executar como:** Eu
   - **Quem tem acesso:** Qualquer pessoa, mesmo sem login
   - **Versão:** Nova versão (ou a versão atual)
3. Copie a URL do aplicativo web

### ✅ URL esperada:
```
https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec
```

---

## 🔍 Passo 3: Testar API no Navegador

### Teste 1: Listar Players (GET)
Abra no navegador:
```
https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec?path=players&method=GET
```

### ✅ Resultado esperado:
```json
{
  "success": true,
  "data": []
}
```
*(Array vazio se não houver dados ainda)*

### Teste 2: Listar Matches (GET)
```
https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec?path=matches&method=GET
```

### Teste 3: Listar Budget Entries (GET)
```
https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec?path=budget-entries&method=GET
```

### ❌ Se der erro:
- Verifique se o deploy foi feito corretamente
- Confirme que a permissão está como "Qualquer pessoa, mesmo sem login"
- Verifique o console do navegador (F12) para ver erros detalhados

---

## 🧪 Passo 4: Testar Criação de Dados (POST)

### Como fazer:
1. Abra o **Console do Navegador** (F12)
2. Cole e execute este código:

```javascript
// Teste criar um player
fetch('https://script.google.com/macros/s/AKfycbwio6C5gzQ2_t3MQtOs-iuv6qccGQ6opUibDqGbO8CE9cWt0ez1dZ1l45eb_qaXxrQa/exec', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    path: 'players',
    method: 'POST',
    data: {
      id: 'test-' + Date.now(),
      name: 'Jogador Teste',
      position: 'Atacante',
      jerseyNumber: 99
    }
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Sucesso:', data);
})
.catch(err => {
  console.error('❌ Erro:', err);
});
```

### ✅ Resultado esperado:
```json
{
  "success": true,
  "data": {
    "id": "test-1234567890",
    "name": "Jogador Teste",
    "position": "Atacante",
    "jerseyNumber": 99
  }
}
```

### Verificar na Planilha:
1. Abra sua planilha do Google Sheets
2. Vá para a aba **"players"**
3. Deve aparecer o novo registro criado

---

## 🖥️ Passo 5: Testar no Sistema (Frontend)

### Como fazer:
1. Certifique-se de que o servidor de desenvolvimento está rodando:
   ```bash
   npm run dev
   ```
2. Acesse: `http://localhost:5173`
3. Faça login:
   - Email: `treinador@clube.com`
   - Senha: `afc25`
4. Teste as funcionalidades:
   - **Gestão de Equipe:** Adicione um novo atleta
   - **Orçamento:** Adicione uma entrada ou despesa
   - **Jogos:** Adicione um novo jogo

### ✅ Verificações:
- [ ] Os dados são salvos sem erros no console
- [ ] Os dados aparecem na planilha do Google Sheets
- [ ] Ao recarregar a página, os dados são carregados automaticamente
- [ ] Não há erros no console do navegador (F12)

---

## 🔧 Passo 6: Verificar Abas na Planilha

### Abas necessárias:
Certifique-se de que sua planilha tem estas 12 abas:

1. ✅ `players`
2. ✅ `matches`
3. ✅ `match_player_stats`
4. ✅ `injuries`
5. ✅ `assessments`
6. ✅ `schedules`
7. ✅ `schedule_days`
8. ✅ `budget_entries`
9. ✅ `budget_expenses`
10. ✅ `competitions`
11. ✅ `stat_targets`
12. ✅ `users`

### Como verificar:
1. Abra sua planilha do Google Sheets
2. Verifique se todas as abas existem
3. Se alguma não existir, o script criará automaticamente na primeira vez que for usada

---

## 📊 Checklist Final

Marque cada item conforme for validando:

- [ ] Função `test()` executou sem erros
- [ ] Deploy da API está configurado corretamente
- [ ] Teste GET no navegador retorna `{"success": true, "data": []}`
- [ ] Teste POST cria dados com sucesso
- [ ] Dados aparecem na planilha do Google Sheets
- [ ] Sistema frontend carrega dados da API
- [ ] Sistema frontend salva dados na API
- [ ] Todas as 12 abas existem na planilha
- [ ] Não há erros no console do navegador

---

## 🆘 Problemas Comuns

### Erro: "Resource not found"
- **Causa:** Nome da aba não corresponde ao esperado
- **Solução:** Verifique os nomes das abas na planilha (devem ser exatamente como em `SHEETS`)

### Erro: "CORS" ou "Access-Control-Allow-Origin"
- **Causa:** Deploy não está configurado corretamente
- **Solução:** Refazer o deploy com "Qualquer pessoa, mesmo sem login"

### Erro: "openById" ou "getActiveSpreadsheet"
- **Causa:** Script não está dentro da planilha
- **Solução:** Certifique-se de abrir o script via "Extensões > Apps Script" na própria planilha

### Dados não aparecem no frontend
- **Causa:** URL da API incorreta ou erro na requisição
- **Solução:** Verifique o console do navegador (F12) e confirme a URL em `config.ts`

---

## ✅ Tudo Funcionando?

Se todos os testes passaram, seu sistema está **100% integrado** com o Google Sheets! 🎉

Agora você pode:
- Usar o sistema normalmente
- Todos os dados serão salvos automaticamente no Google Sheets
- Acessar os dados de qualquer lugar
- Compartilhar a planilha com sua equipe









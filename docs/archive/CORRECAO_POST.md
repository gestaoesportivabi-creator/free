# 🔧 Correção do Erro de POST

## Problema Identificado
O erro ao salvar dados (cadastrar atleta) ocorre porque o Google Apps Script pode ter problemas ao processar POSTs quando há `method=POST` na query string.

## Solução Aplicada
A função `post` no arquivo `services/api.ts` foi corrigida para remover `&method=POST` da URL, já que quando usamos `fetch` com `method: 'POST'`, o Google Apps Script automaticamente chama `doPost()`.

## Mudança Realizada

**Antes:**
```typescript
const url = `${API_URL}?path=${resource}&method=POST`;
```

**Depois:**
```typescript
const url = `${API_URL}?path=${resource}`;
```

## Próximos Passos

1. ✅ Código corrigido no arquivo `services/api.ts`
2. ⏳ Testar novamente cadastrando um atleta
3. ⏳ Verificar se os dados aparecem no Google Sheets

## Se Ainda Der Erro

Se ainda der erro, verifique:
1. Abra o Console do Navegador (F12)
2. Veja a aba "Network" (Rede)
3. Tente cadastrar um atleta novamente
4. Clique na requisição que falhou
5. Veja a resposta do servidor

Isso ajudará a identificar o problema específico.









# 🔄 Integração com Google Apps Script API

## ⚠️ IMPORTANTE: Corrigir o Erro do SPREADSHEET_ID Primeiro

O erro que você está vendo (`openById on object SpreadsheetApp`) acontece porque o `SPREADSHEET_ID` não está configurado corretamente no Google Apps Script.

### Como Encontrar o ID da Planilha:

1. Abra sua planilha no Google Sheets
2. Olhe a URL no navegador:
   ```
   https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit
   ```
3. O ID é a parte entre `/d/` e `/edit`: `ABC123XYZ789`

### Como Configurar:

1. No Google Apps Script, encontre a linha:
   ```javascript
   const SPREADSHEET_ID = 'SUA_PLANILHA_ID';
   ```

2. Substitua pelo ID real:
   ```javascript
   const SPREADSHEET_ID = 'ABC123XYZ789'; // Seu ID real
   ```

3. Salve o arquivo (Ctrl+S)

4. Teste novamente executando a função `test()`

---

## 📋 Arquivos Criados

1. **`config.ts`** - Configuração da URL da API
2. **`services/api.ts`** - Serviço completo de API
3. Atualizações no **`App.tsx`** (próximo passo)

---

## 🔧 Configuração no Código React

### 1. Atualizar `config.ts`

A URL já está configurada com a sua URL do Google Apps Script. Se precisar alterar:

```typescript
export const API_URL = 'SUA_URL_AQUI';
```

---

## 🚀 Como Usar a API

### Exemplo de Uso:

```typescript
import { playersApi } from './services/api';

// Buscar todos os jogadores
const players = await playersApi.getAll();

// Criar novo jogador
const newPlayer = await playersApi.create({
  id: 'p1',
  name: 'João Silva',
  position: 'Ala',
  jerseyNumber: 10,
  // ... outros campos
});

// Atualizar jogador
await playersApi.update('p1', { name: 'João Silva Santos' });

// Deletar jogador
await playersApi.delete('p1');
```

---

## 🔒 Segurança

### Por que não precisa de API Key?

A URL do Google Apps Script Web App que você já configurou como "Qualquer pessoa, mesmo sem login" é **segura** porque:

1. ✅ A URL é única e difícil de adivinhar
2. ✅ O Google Apps Script valida as requisições
3. ✅ Você controla as permissões na publicação
4. ✅ Dados sensíveis (como salários) podem ser protegidos no Google Sheets

### Se Quiser Mais Segurança:

1. **Proteger abas específicas** no Google Sheets (ex: coluna salary)
2. **Adicionar validação** no Google Apps Script
3. **Limitar acesso** por domínio (se tiver domínio próprio)

---

## 📝 Próximos Passos

1. ✅ Corrigir SPREADSHEET_ID no Google Apps Script
2. ✅ Testar API no navegador
3. 🔄 Integrar no App.tsx (substituir localStorage)
4. 🔄 Testar todas as funcionalidades

---

## 🧪 Testar a API

Abra no navegador para testar:

```
https://script.google.com/macros/s/SUA_URL/exec?path=players&method=GET
```

Deve retornar JSON com os dados da aba "players".










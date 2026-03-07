# 📋 CONFIGURAR ABA SCHEDULES NA PLANILHA

## ⚠️ PROBLEMA
O erro "Record not found" acontece porque a aba `schedules` não existe ou não está configurada corretamente na planilha do Google Sheets.

## ✅ SOLUÇÃO: Criar/Configurar a Aba `schedules`

### 1. Verificar se a aba existe
1. Abra sua planilha no Google Sheets
2. Veja se existe uma aba chamada **`schedules`** (exatamente assim, minúsculo)
3. Se não existir, crie uma nova aba

### 2. Criar a aba (se não existir)
1. Clique no botão **"+"** no final das abas (ou botão direito > Inserir aba)
2. Renomeie a aba para: **`schedules`** (exatamente assim, minúsculo, sem espaços)

### 3. Configurar os cabeçalhos (IMPORTANTE!)
Na **primeira linha** da aba `schedules`, coloque exatamente estes cabeçalhos (um em cada coluna):

**Coluna A:** `id`
**Coluna B:** `startDate`
**Coluna C:** `endDate`
**Coluna D:** `title`
**Coluna E:** `days`
**Coluna F:** `createdAt`
**Coluna G:** `isActive`

**IMPORTANTE:** As observações de cada dia estão dentro do campo `days` (JSON). Não precisa criar uma coluna separada para observações.

**Exemplo visual na planilha:**
```
A              | B           | C           | D                        | E      | F              | G
---------------|-------------|-------------|--------------------------|--------|----------------|--------
id             | startDate   | endDate     | title                    | days   | createdAt      | isActive
1767056824911  | 2025-12-28  | 2025-12-31  | Programação 28/12...     | [...]  | 1767056824911  | false
```

### 4. Detalhes das colunas

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `id` | Texto/Número | ID único da programação | `1767056824911` |
| `startDate` | Data/Texto | Data de início (YYYY-MM-DD) | `2025-12-28` |
| `endDate` | Data/Texto | Data de fim (YYYY-MM-DD) | `2025-12-31` |
| `title` | Texto | Título da programação | `Programação 28/12/2025 a 31/12/2025` |
| `days` | Texto (JSON) | Array de dias em formato JSON | `[{"date":"2025-12-28",...}]` |
| `createdAt` | Número | Timestamp de criação | `1767056824911` |
| `isActive` | Texto/Boolean | Se está ativa (`true` ou `false`) | `false` |

### 5. Verificar dados existentes
Se você já tinha programações salvas antes, elas podem estar em uma aba com nome diferente ou com estrutura diferente. 

**Opções:**
- **Opção A**: Se você tem dados antigos, copie-os para a nova aba `schedules` com os cabeçalhos corretos
- **Opção B**: Se não tem dados importantes, deixe a aba vazia (só com os cabeçalhos) e crie novas programações

## 🔍 VERIFICAÇÃO

### 1. Verificar se está correto
1. Aba existe e se chama **`schedules`** (minúsculo)
2. Primeira linha tem os cabeçalhos: `id`, `startDate`, `endDate`, `title`, `days`, `createdAt`, `isActive`
3. A coluna `id` está na primeira coluna (coluna A)

### 2. Testar
1. Recarregue a página (F5)
2. Tente criar uma nova programação
3. Tente deletar uma programação
4. Tente ativar uma programação

## 📝 IMPORTANTE

- O nome da aba deve ser **exatamente** `schedules` (minúsculo, sem espaços, sem acentos)
- A primeira linha **DEVE** ter os cabeçalhos
- A coluna `id` **DEVE** existir e estar na primeira coluna
- Os IDs devem ser strings ou números (o código converte para string automaticamente)

## 🚨 Se ainda não funcionar

1. Abra o Console (F12)
2. Tente deletar uma programação
3. Veja os logs que aparecem
4. Me envie:
   - O ID que está sendo procurado (aparece no log: "Tentando deletar schedules com ID: ...")
   - Uma captura de tela da aba `schedules` mostrando os cabeçalhos e os dados

---

**Depois de configurar a aba, recarregue a página e teste novamente!**


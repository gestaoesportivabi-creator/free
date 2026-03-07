# 📋 Instruções: Criar Aba "time_controls" na Planilha

## ✅ O que foi implementado no código:

1. ✅ Nova aba `time_controls` adicionada no Google Apps Script
2. ✅ Rota `time-controls` configurada na API
3. ✅ API `timeControlsApi` criada no frontend
4. ✅ Componente `TimeControl` integrado e funcional

## 📝 O QUE VOCÊ PRECISA FAZER:

### 1. Criar a Aba na Planilha do Google Sheets

1. Abra sua planilha do Google Sheets
2. Clique no botão **"+"** no final das abas (ou clique com botão direito em uma aba existente → **Inserir aba**)
3. Renomeie a nova aba para: **`time_controls`** (exatamente assim, em minúsculas, com underscore)

### 2. Criar as Colunas (Headers) na Primeira Linha

Na primeira linha da aba `time_controls`, crie as seguintes colunas (na ordem abaixo):

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| **id** | ID único do registro | `match123-player456` |
| **matchId** | ID da partida | `1234567890` |
| **date** | Data da partida | `2024-01-15` |
| **playerId** | ID do jogador | `p1` |
| **playerName** | Nome do jogador | `João Silva` |
| **position** | Posição do jogador | `Ala` |
| **jerseyNumber** | Número da camisa | `10` |
| **timeEntries** | Array JSON de entradas/saídas | `[{"entryTime":"00:00","exitTime":"20:00"},{"entryTime":"25:00","exitTime":"40:00"}]` |
| **totalTime** | Tempo total em minutos (calculado) | `35` |

### 3. Formato da Coluna `timeEntries`

A coluna `timeEntries` armazena um **array JSON** com objetos contendo:
- `entryTime`: Tempo de entrada (formato "MM:SS" ou "M:SS")
- `exitTime`: Tempo de saída (formato "MM:SS" ou "M:SS", opcional)

**Exemplo de valor na célula:**
```json
[{"entryTime":"00:00","exitTime":"20:00"},{"entryTime":"25:00","exitTime":"40:00"}]
```

### 4. Estrutura Final da Aba

A primeira linha deve ficar assim:

```
| id | matchId | date | playerId | playerName | position | jerseyNumber | timeEntries | totalTime |
```

### 5. Verificação

Após criar a aba:
1. ✅ Verifique se o nome está exatamente: `time_controls` (minúsculas, com underscore)
2. ✅ Verifique se todas as colunas estão na primeira linha
3. ✅ A coluna `id` deve ser a primeira coluna (importante para o funcionamento)

## 🔄 Próximos Passos

Após criar a aba:
1. O sistema criará automaticamente os registros quando você salvar tempos na aba "Controle de Tempo"
2. Os dados serão salvos automaticamente no formato JSON para `timeEntries`
3. O `totalTime` será calculado automaticamente pelo sistema

## ⚠️ IMPORTANTE

- A coluna `id` é **obrigatória** e deve ser a primeira coluna
- O nome da aba deve ser exatamente `time_controls` (case-sensitive)
- A coluna `timeEntries` armazena JSON, então não edite manualmente a menos que saiba o formato correto

## 📌 Resumo

**Nome da Aba:** `time_controls`

**Colunas (na ordem):**
1. id
2. matchId
3. date
4. playerId
5. playerName
6. position
7. jerseyNumber
8. timeEntries
9. totalTime

**Pronto!** Após criar a aba, o sistema já está configurado para salvar os dados automaticamente.








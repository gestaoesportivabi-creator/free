# 📊 Guia Rápido - Configuração Google Sheets

## 🎯 Resumo das Abas

Crie estas **12 abas** na sua planilha do Google Sheets:

1. **players** - Jogadores
2. **matches** - Jogos  
3. **match_player_stats** - Estatísticas individuais por jogo
4. **injuries** - Lesões
5. **assessments** - Avaliações Físicas
6. **schedules** - Programações
7. **schedule_days** - Dias das programações
8. **budget_entries** - Entradas Orçamentárias
9. **budget_expenses** - Despesas Orçamentárias
10. **competitions** - Competições
11. **stat_targets** - Metas de Estatísticas
12. **users** - Usuários (opcional)

---

## 📋 Headers (Primeira Linha de Cada Aba)

### **1. players**
```
id | name | nickname | position | photoUrl | jerseyNumber | dominantFoot | age | height | lastClub | isTransferred | transferDate | salary | salaryStartDate | salaryEndDate
```

### **2. matches**
```
id | competition | opponent | location | date | result | videoUrl | team_minutesPlayed | team_goals | team_goalsConceded | team_assists | team_yellowCards | team_redCards | team_passesCorrect | team_passesWrong | team_wrongPassesTransition | team_tacklesWithBall | team_tacklesCounterAttack | team_tacklesWithoutBall | team_shotsOnTarget | team_shotsOffTarget | team_rpeMatch | team_goalsScoredOpenPlay | team_goalsScoredSetPiece | team_goalsConcededOpenPlay | team_goalsConcededSetPiece
```

### **3. match_player_stats**
```
id | matchId | playerId | minutesPlayed | goals | goalsConceded | assists | yellowCards | redCards | passesCorrect | passesWrong | wrongPassesTransition | tacklesWithBall | tacklesCounterAttack | tacklesWithoutBall | shotsOnTarget | shotsOffTarget | rpeMatch | goalsScoredOpenPlay | goalsScoredSetPiece | goalsConcededOpenPlay | goalsConcededSetPiece
```

### **4. injuries**
```
id | playerId | date | endDate | type | location | severity | daysOut
```

### **5. assessments**
```
id | playerId | date | chest | axilla | subscapular | triceps | abdominal | suprailiac | thigh | bodyFatPercent | actionPlan
```

### **6. schedules**
```
id | startDate | endDate | title | createdAt | isActive
```

### **7. schedule_days**
```
id | scheduleId | date | weekday | activity | time | location | notes
```

### **8. budget_entries**
```
id | type | expectedDate | value | status | receivedDate | category | startDate | endDate
```

### **9. budget_expenses**
```
id | type | date | value | status | paidDate | category | startDate | endDate
```

### **10. competitions**
```
name
```

### **11. stat_targets**
```
id | goals | assists | passesCorrect | passesWrong | shotsOn | shotsOff | tacklesPossession | tacklesNoPossession | tacklesCounter | transitionError
```

### **12. users** (opcional)
```
id | name | email | role | linkedPlayerId | photoUrl
```

---

## 🔒 Segurança - Proteger Dados Sensíveis

### **Proteger Coluna de Salários:**

1. Selecione a aba **players**
2. Clique com botão direito na coluna **salary**
3. Escolha "Proteger intervalo"
4. Adicione apenas pessoas autorizadas (ex: Diretor, Administrador)
5. Remova permissões de visualização para outros usuários

---

## ✅ Validação de Dados (Opcional mas Recomendado)

### **Para aba "position" (players):**
- Validação: Lista de itens
- Itens: `Goleiro, Fixo, Ala, Pivô, Armador, Ponta, Meia`

### **Para aba "location" (matches):**
- Validação: Lista de itens  
- Itens: `Mandante, Visitante`

### **Para aba "result" (matches):**
- Validação: Lista de itens
- Itens: `Vitória, Derrota, Empate`

### **Para aba "type" (injuries):**
- Validação: Lista de itens
- Itens: `Muscular, Trauma, Articular, Outros`

### **Para aba "severity" (injuries):**
- Validação: Lista de itens
- Itens: `Leve, Moderada, Grave`

### **Para aba "status" (budget_entries e budget_expenses):**
- Validação: Lista de itens
- Itens: `Pendente, Recebido` (entries) ou `Pendente, Pago` (expenses)

### **Para aba "category" (budget_entries e budget_expenses):**
- Validação: Lista de itens
- Itens: `Fixo, Variável`

---

## 📝 Formato de Datas

Use formato: **YYYY-MM-DD** (ex: 2024-03-15)

Ou configure a coluna como tipo "Data" no Google Sheets.

---

## 🔗 Vinculações Importantes

- **match_player_stats.matchId** → **matches.id**
- **match_player_stats.playerId** → **players.id**
- **injuries.playerId** → **players.id**
- **assessments.playerId** → **players.id**
- **schedule_days.scheduleId** → **schedules.id**

Use **VLOOKUP** ou fórmulas para garantir consistência!

---

## 📊 Exemplo de Dados Iniciais

### **competitions:**
```
name
Copa Santa Catarina
Série Prata
JASC
```

### **stat_targets:**
```
id | goals | assists | passesCorrect | passesWrong | shotsOn | shotsOff | tacklesPossession | tacklesNoPossession | tacklesCounter | transitionError
default | 3 | 3 | 30 | 5 | 8 | 5 | 10 | 10 | 5 | 2
```

---

## 🚀 Próximo Passo

Após criar a planilha:
1. Compartilhe com as pessoas necessárias (definindo permissões)
2. Proteja dados sensíveis (coluna salary)
3. Obtenha credenciais da API do Google
4. Integre no código React

---

**📚 Para mais detalhes, consulte: DATABASE_OPTIONS.md**










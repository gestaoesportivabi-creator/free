# 🗄️ Opções de Banco de Dados - SCOUT 21

## 📊 Análise Comparativa

### **Google Sheets vs MySQL**

| Característica | Google Sheets | MySQL |
|----------------|---------------|-------|
| **Custo** | ✅ Gratuito | ⚠️ Hospedagem paga (ou gratuito limitado) |
| **Complexidade** | ✅ Muito fácil | ⚠️ Requer conhecimento técnico |
| **Escalabilidade** | ⚠️ Limitado (5 milhões de células) | ✅ Ilimitado |
| **Performance** | ⚠️ Lento com muitos dados | ✅ Muito rápido |
| **Relacionamentos** | ❌ Manual (VLOOKUP) | ✅ Relações reais (JOIN) |
| **Integração** | ✅ API REST simples | ⚠️ Requer backend |
| **Backup** | ✅ Automático (Google) | ⚠️ Precisa configurar |
| **Colaboração** | ✅ Nativo | ❌ Não |
| **Segurança** | ⚠️ Básica | ✅ Avançada |
| **Dados Sensíveis** | ⚠️ Precisa proteger aba | ✅ Níveis de acesso |
| **Queries Complexas** | ❌ Limitado | ✅ SQL completo |
| **Offline** | ❌ Não | ✅ Sim (com cache) |

---

## 🏆 RECOMENDAÇÃO PARA ESTE PROJETO

### **Para Começar Rápido: Google Sheets** ⭐

**Recomendado se:**
- ✅ Você quer começar AGORA sem configuração complexa
- ✅ Equipe pequena (< 10 usuários)
- ✅ Volume de dados médio (< 1000 jogos/ano)
- ✅ Não precisa de queries muito complexas
- ✅ Quer colaboração fácil entre membros da equipe

**Vantagens:**
- Zero configuração
- Gratuito
- Fácil de visualizar e editar manualmente se necessário
- API simples de integrar

---

### **Para Crescimento e Profissionalismo: MySQL**

**Recomendado se:**
- ✅ Planeja ter muitos usuários simultâneos
- ✅ Volume alto de dados (múltiplas temporadas)
- ✅ Precisa de performance alta
- ✅ Quer segurança avançada (dados sensíveis de salários)
- ✅ Precisa de relatórios complexos
- ✅ Planeja integrar com outros sistemas

**Vantagens:**
- Performance superior
- Escalabilidade
- Relacionamentos reais entre tabelas
- Segurança avançada
- Queries complexas

---

## 📋 ESTRUTURA COMPLETA - GOOGLE SHEETS

### **Abas a Criar:**

1. **players** - Jogadores
2. **matches** - Jogos
3. **match_player_stats** - Estatísticas de jogadores por jogo
4. **injuries** - Lesões
5. **assessments** - Avaliações Físicas
6. **schedules** - Programações
7. **schedule_days** - Dias das programações
8. **budget_entries** - Entradas Orçamentárias
9. **budget_expenses** - Despesas Orçamentárias
10. **competitions** - Competições
11. **stat_targets** - Metas de Estatísticas
12. **users** - Usuários (opcional, se quiser persistir)

---

### **📝 DETALHAMENTO DAS ABAS**

#### **1. ABA: players**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único (ex: p1, p2) | Sim |
| name | Texto | Nome completo | Sim |
| nickname | Texto | Apelido | Não |
| position | Texto | Posição (Goleiro, Fixo, Ala, Pivô) | Sim |
| photoUrl | Texto | URL da foto | Sim |
| jerseyNumber | Número | Número da camisa | Sim |
| dominantFoot | Texto | Destro, Canhoto, Ambidestro | Não |
| age | Número | Idade | Não |
| height | Número | Altura em cm | Não |
| lastClub | Texto | Último clube | Não |
| isTransferred | Booleano | Transferido? (TRUE/FALSE) | Não |
| transferDate | Data | Data da transferência | Não |
| salary | Número | Salário (DADOS SENSÍVEIS - proteger aba) | Não |
| salaryStartDate | Data | Início do contrato | Não |
| salaryEndDate | Data | Fim do contrato | Não |

**📌 DICA:** Proteja a coluna "salary" com permissões restritas!

---

#### **2. ABA: matches**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único (ex: m1, m2) | Sim |
| competition | Texto | Competição | Sim |
| opponent | Texto | Adversário | Sim |
| location | Texto | Mandante ou Visitante | Sim |
| date | Data | Data do jogo (YYYY-MM-DD) | Sim |
| result | Texto | Vitória, Derrota, Empate | Sim |
| videoUrl | Texto | URL do vídeo | Não |
| team_minutesPlayed | Número | Minutos jogados (time) | Não |
| team_goals | Número | Gols marcados | Não |
| team_goalsConceded | Número | Gols sofridos | Não |
| team_assists | Número | Assistências | Não |
| team_yellowCards | Número | Cartões amarelos | Não |
| team_redCards | Número | Cartões vermelhos | Não |
| team_passesCorrect | Número | Passes certos | Não |
| team_passesWrong | Número | Passes errados | Não |
| team_wrongPassesTransition | Número | Passes errados em transição | Não |
| team_tacklesWithBall | Número | Desarmes com bola | Não |
| team_tacklesCounterAttack | Número | Desarmes em contra-ataque | Não |
| team_tacklesWithoutBall | Número | Desarmes sem bola | Não |
| team_shotsOnTarget | Número | Chutes no gol | Não |
| team_shotsOffTarget | Número | Chutes para fora | Não |
| team_rpeMatch | Número | RPE do jogo (0-10) | Não |
| team_goalsScoredOpenPlay | Número | Gols em jogo aberto | Não |
| team_goalsScoredSetPiece | Número | Gols em bola parada | Não |
| team_goalsConcededOpenPlay | Número | Gols sofridos em jogo aberto | Não |
| team_goalsConcededSetPiece | Número | Gols sofridos em bola parada | Não |

---

#### **3. ABA: match_player_stats** ⚠️ IMPORTANTE

Esta aba armazena as estatísticas individuais de cada jogador em cada jogo.

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| matchId | Texto | ID do jogo (vincular com matches.id) | Sim |
| playerId | Texto | ID do jogador (vincular com players.id) | Sim |
| minutesPlayed | Número | Minutos jogados | Não |
| goals | Número | Gols | Não |
| goalsConceded | Número | Gols sofridos | Não |
| assists | Número | Assistências | Não |
| yellowCards | Número | Cartões amarelos | Não |
| redCards | Número | Cartões vermelhos | Não |
| passesCorrect | Número | Passes certos | Não |
| passesWrong | Número | Passes errados | Não |
| wrongPassesTransition | Número | Passes errados em transição | Não |
| tacklesWithBall | Número | Desarmes com bola | Não |
| tacklesCounterAttack | Número | Desarmes em contra-ataque | Não |
| tacklesWithoutBall | Número | Desarmes sem bola | Não |
| shotsOnTarget | Número | Chutes no gol | Não |
| shotsOffTarget | Número | Chutes para fora | Não |
| rpeMatch | Número | RPE (0-10) | Não |
| goalsScoredOpenPlay | Número | Gols em jogo aberto | Não |
| goalsScoredSetPiece | Número | Gols em bola parada | Não |
| goalsConcededOpenPlay | Número | Gols sofridos em jogo aberto | Não |
| goalsConcededSetPiece | Número | Gols sofridos em bola parada | Não |

---

#### **4. ABA: injuries**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| playerId | Texto | ID do jogador | Sim |
| date | Data | Data da lesão | Sim |
| endDate | Data | Data de recuperação | Não |
| type | Texto | Muscular, Trauma, Articular, Outros | Sim |
| location | Texto | Localização da lesão | Sim |
| severity | Texto | Leve, Moderada, Grave | Sim |
| daysOut | Número | Dias fora | Não |

---

#### **5. ABA: assessments**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| playerId | Texto | ID do jogador | Sim |
| date | Data | Data da avaliação | Sim |
| chest | Número | Dobra peitoral (mm) | Não |
| axilla | Número | Dobra axilar (mm) | Não |
| subscapular | Número | Dobra subescapular (mm) | Não |
| triceps | Número | Dobra tríceps (mm) | Não |
| abdominal | Número | Dobra abdominal (mm) | Não |
| suprailiac | Número | Dobra supra-ilíaca (mm) | Não |
| thigh | Número | Dobra coxa (mm) | Não |
| bodyFatPercent | Número | % de gordura corporal | Não |
| actionPlan | Texto | Plano de ação | Não |

---

#### **6. ABA: schedules**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| startDate | Data | Data início | Sim |
| endDate | Data | Data fim | Sim |
| title | Texto | Título da programação | Sim |
| createdAt | Número | Timestamp de criação | Não |
| isActive | Booleano | Programação ativa? (TRUE/FALSE) | Não |

---

#### **7. ABA: schedule_days**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| scheduleId | Texto | ID da programação | Sim |
| date | Data | Data do dia | Sim |
| weekday | Texto | Dia da semana | Não |
| activity | Texto | Tipo de atividade | Não |
| time | Texto | Horário | Não |
| location | Texto | Local | Não |
| notes | Texto | Observações | Não |

---

#### **8. ABA: budget_entries**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| type | Texto | Tipo de entrada | Sim |
| expectedDate | Data | Data prevista | Sim |
| value | Número | Valor | Sim |
| status | Texto | Pendente, Recebido | Sim |
| receivedDate | Data | Data recebido | Não |
| category | Texto | Fixo, Variável | Não |
| startDate | Data | Data início período | Não |
| endDate | Data | Data fim período | Não |

**Valores para "type":**
- Patrocínios Masters
- Patrocínios
- Apoiadores
- Recursos Municipal
- Recursos Estaduais
- Recursos Federais
- Bilheteria
- Outros

---

#### **9. ABA: budget_expenses**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| type | Texto | Tipo de despesa | Sim |
| date | Data | Data da despesa | Sim |
| value | Número | Valor | Sim |
| status | Texto | Pendente, Pago | Sim |
| paidDate | Data | Data pago | Não |
| category | Texto | Fixo, Variável | Não |
| startDate | Data | Data início período | Não |
| endDate | Data | Data fim período | Não |

**Valores para "type":**
- Salários Jogadores
- Salários Comissão Técnica
- Alimentação Diária
- Alimentação Viagens
- Transporte
- Hotel
- Arbitragem
- Materiais
- Uniformes
- Moradia
- Água
- Luz
- Outros

---

#### **10. ABA: competitions**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| name | Texto | Nome da competição | Sim |

**Exemplo de dados:**
- Copa Santa Catarina
- Série Prata
- JASC

---

#### **11. ABA: stat_targets**

Esta aba armazena as metas de estatísticas. Pode ter apenas 1 linha ou várias (por período).

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| goals | Número | Meta de gols | Não |
| assists | Número | Meta de assistências | Não |
| passesCorrect | Número | Meta de passes certos | Não |
| passesWrong | Número | Meta de passes errados | Não |
| shotsOn | Número | Meta de chutes no gol | Não |
| shotsOff | Número | Meta de chutes para fora | Não |
| tacklesPossession | Número | Meta de desarmes com posse | Não |
| tacklesNoPossession | Número | Meta de desarmes sem posse | Não |
| tacklesCounter | Número | Meta de desarmes em contra-ataque | Não |
| transitionError | Número | Meta de erros em transição | Não |

---

#### **12. ABA: users** (Opcional)

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| id | Texto | ID único | Sim |
| name | Texto | Nome | Sim |
| email | Texto | E-mail | Sim |
| role | Texto | Treinador, Preparador Físico, etc. | Sim |
| linkedPlayerId | Texto | ID do jogador vinculado | Não |
| photoUrl | Texto | URL da foto | Não |

---

## 🗄️ ESTRUTURA COMPLETA - MYSQL

### **Script SQL Completo**

```sql
-- ============================================
-- SCOUT 21 - Estrutura de Banco de Dados
-- ============================================

CREATE DATABASE IF NOT EXISTS scout21 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scout21;

-- ============================================
-- TABELA: players (Jogadores)
-- ============================================
CREATE TABLE players (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    position ENUM('Goleiro', 'Fixo', 'Ala', 'Pivô', 'Armador', 'Ponta', 'Meia') NOT NULL,
    photoUrl TEXT,
    jerseyNumber INT NOT NULL,
    dominantFoot ENUM('Destro', 'Canhoto', 'Ambidestro'),
    age INT,
    height INT COMMENT 'Altura em cm',
    lastClub VARCHAR(255),
    isTransferred BOOLEAN DEFAULT FALSE,
    transferDate DATE,
    salary DECIMAL(10, 2) COMMENT 'DADOS SENSÍVEIS',
    salaryStartDate DATE,
    salaryEndDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_jerseyNumber (jerseyNumber),
    INDEX idx_isTransferred (isTransferred)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: competitions (Competições)
-- ============================================
CREATE TABLE competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: matches (Jogos)
-- ============================================
CREATE TABLE matches (
    id VARCHAR(50) PRIMARY KEY,
    competition VARCHAR(255) NOT NULL,
    opponent VARCHAR(255) NOT NULL,
    location ENUM('Mandante', 'Visitante') NOT NULL,
    date DATE NOT NULL,
    result ENUM('Vitória', 'Derrota', 'Empate') NOT NULL,
    videoUrl TEXT,
    
    -- Estatísticas do Time
    team_minutesPlayed INT DEFAULT 0,
    team_goals INT DEFAULT 0,
    team_goalsConceded INT DEFAULT 0,
    team_assists INT DEFAULT 0,
    team_yellowCards INT DEFAULT 0,
    team_redCards INT DEFAULT 0,
    team_passesCorrect INT DEFAULT 0,
    team_passesWrong INT DEFAULT 0,
    team_wrongPassesTransition INT DEFAULT 0,
    team_tacklesWithBall INT DEFAULT 0,
    team_tacklesCounterAttack INT DEFAULT 0,
    team_tacklesWithoutBall INT DEFAULT 0,
    team_shotsOnTarget INT DEFAULT 0,
    team_shotsOffTarget INT DEFAULT 0,
    team_rpeMatch DECIMAL(3,1) COMMENT 'RPE 0-10',
    team_goalsScoredOpenPlay INT DEFAULT 0,
    team_goalsScoredSetPiece INT DEFAULT 0,
    team_goalsConcededOpenPlay INT DEFAULT 0,
    team_goalsConcededSetPiece INT DEFAULT 0,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_competition (competition),
    INDEX idx_date (date),
    INDEX idx_opponent (opponent),
    INDEX idx_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: match_player_stats (Estatísticas de Jogadores por Jogo)
-- ============================================
CREATE TABLE match_player_stats (
    id VARCHAR(50) PRIMARY KEY,
    matchId VARCHAR(50) NOT NULL,
    playerId VARCHAR(50) NOT NULL,
    
    minutesPlayed INT DEFAULT 0,
    goals INT DEFAULT 0,
    goalsConceded INT DEFAULT 0,
    assists INT DEFAULT 0,
    yellowCards INT DEFAULT 0,
    redCards INT DEFAULT 0,
    passesCorrect INT DEFAULT 0,
    passesWrong INT DEFAULT 0,
    wrongPassesTransition INT DEFAULT 0,
    tacklesWithBall INT DEFAULT 0,
    tacklesCounterAttack INT DEFAULT 0,
    tacklesWithoutBall INT DEFAULT 0,
    shotsOnTarget INT DEFAULT 0,
    shotsOffTarget INT DEFAULT 0,
    rpeMatch DECIMAL(3,1) COMMENT 'RPE 0-10',
    goalsScoredOpenPlay INT DEFAULT 0,
    goalsScoredSetPiece INT DEFAULT 0,
    goalsConcededOpenPlay INT DEFAULT 0,
    goalsConcededSetPiece INT DEFAULT 0,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_match_player (matchId, playerId),
    INDEX idx_matchId (matchId),
    INDEX idx_playerId (playerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: injuries (Lesões)
-- ============================================
CREATE TABLE injuries (
    id VARCHAR(50) PRIMARY KEY,
    playerId VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    endDate DATE,
    type ENUM('Muscular', 'Trauma', 'Articular', 'Outros') NOT NULL,
    location VARCHAR(255) NOT NULL,
    severity ENUM('Leve', 'Moderada', 'Grave') NOT NULL,
    daysOut INT,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_playerId (playerId),
    INDEX idx_date (date),
    INDEX idx_type (type),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: assessments (Avaliações Físicas)
-- ============================================
CREATE TABLE assessments (
    id VARCHAR(50) PRIMARY KEY,
    playerId VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    -- Dobras Cutâneas (mm)
    chest DECIMAL(5,2),
    axilla DECIMAL(5,2),
    subscapular DECIMAL(5,2),
    triceps DECIMAL(5,2),
    abdominal DECIMAL(5,2),
    suprailiac DECIMAL(5,2),
    thigh DECIMAL(5,2),
    
    bodyFatPercent DECIMAL(5,2) COMMENT 'Percentual de gordura corporal',
    actionPlan TEXT COMMENT 'Plano de ação',
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_playerId (playerId),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: schedules (Programações)
-- ============================================
CREATE TABLE schedules (
    id VARCHAR(50) PRIMARY KEY,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    createdAt BIGINT COMMENT 'Timestamp para auto-delete após 30 dias',
    isActive BOOLEAN DEFAULT FALSE,
    
    INDEX idx_startDate (startDate),
    INDEX idx_endDate (endDate),
    INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: schedule_days (Dias das Programações)
-- ============================================
CREATE TABLE schedule_days (
    id VARCHAR(50) PRIMARY KEY,
    scheduleId VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    weekday VARCHAR(20),
    activity VARCHAR(255),
    time VARCHAR(20),
    location VARCHAR(255),
    notes TEXT,
    
    FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
    INDEX idx_scheduleId (scheduleId),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: budget_entries (Entradas Orçamentárias)
-- ============================================
CREATE TABLE budget_entries (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM(
        'Patrocínios Masters',
        'Patrocínios',
        'Apoiadores',
        'Recursos Municipal',
        'Recursos Estaduais',
        'Recursos Federais',
        'Bilheteria',
        'Outros'
    ) NOT NULL,
    expectedDate DATE NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    status ENUM('Pendente', 'Recebido') NOT NULL,
    receivedDate DATE,
    category ENUM('Fixo', 'Variável'),
    startDate DATE,
    endDate DATE,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_expectedDate (expectedDate),
    INDEX idx_status (status),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: budget_expenses (Despesas Orçamentárias)
-- ============================================
CREATE TABLE budget_expenses (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM(
        'Salários Jogadores',
        'Salários Comissão Técnica',
        'Alimentação Diária',
        'Alimentação Viagens',
        'Transporte',
        'Hotel',
        'Arbitragem',
        'Materiais',
        'Uniformes',
        'Moradia',
        'Água',
        'Luz',
        'Outros'
    ) NOT NULL,
    date DATE NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    status ENUM('Pendente', 'Pago') NOT NULL,
    paidDate DATE,
    category ENUM('Fixo', 'Variável'),
    startDate DATE,
    endDate DATE,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: stat_targets (Metas de Estatísticas)
-- ============================================
CREATE TABLE stat_targets (
    id VARCHAR(50) PRIMARY KEY,
    goals INT DEFAULT 3,
    assists INT DEFAULT 3,
    passesCorrect INT DEFAULT 30,
    passesWrong INT DEFAULT 5,
    shotsOn INT DEFAULT 8,
    shotsOff INT DEFAULT 5,
    tacklesPossession INT DEFAULT 10,
    tacklesNoPossession INT DEFAULT 10,
    tacklesCounter INT DEFAULT 5,
    transitionError INT DEFAULT 2,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: users (Usuários - Opcional)
-- ============================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('Treinador', 'Preparador Físico', 'Supervisor', 'Diretor', 'Atleta') NOT NULL,
    linkedPlayerId VARCHAR(50),
    photoUrl TEXT,
    passwordHash VARCHAR(255) COMMENT 'Hash da senha',
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (linkedPlayerId) REFERENCES players(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS (Opcional)
-- ============================================

-- Competições padrão
INSERT INTO competitions (name) VALUES 
('Copa Santa Catarina'),
('Série Prata'),
('JASC');

-- Metas padrão
INSERT INTO stat_targets (id, goals, assists, passesCorrect, passesWrong, shotsOn, shotsOff, tacklesPossession, tacklesNoPossession, tacklesCounter, transitionError) 
VALUES ('default', 3, 3, 30, 5, 8, 5, 10, 10, 5, 2);
```

---

## 🚀 PRÓXIMOS PASSOS

### **Se escolher Google Sheets:**

1. Criar planilha no Google Sheets
2. Criar todas as abas conforme especificado acima
3. Configurar permissões (proteger aba de salários)
4. Obter credenciais da API do Google
5. Integrar no código usando Google Sheets API

### **Se escolher MySQL:**

1. Instalar MySQL (local ou hospedado)
2. Executar o script SQL acima
3. Configurar conexão no backend
4. Criar API REST para comunicação
5. Integrar no código React

---

## 💡 RECOMENDAÇÃO FINAL

**Para este projeto, recomendo começar com Google Sheets** porque:
- ✅ Implementação rápida
- ✅ Gratuito
- ✅ Fácil de visualizar dados
- ✅ Colaboração nativa
- ✅ Pode migrar para MySQL depois se necessário

**Quando migrar para MySQL:**
- Quando tiver muitos dados (>1000 jogos)
- Quando precisar de performance maior
- Quando precisar de múltiplos usuários simultâneos
- Quando precisar de segurança avançada










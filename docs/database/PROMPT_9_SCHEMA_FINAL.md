# PROMPT 9 — CONVERSÃO FINAL EM BANCO DE DADOS

## Objetivo
Criar a estrutura de banco de dados do SCOUT21PRO baseada em TODAS as definições dos prompts anteriores, garantindo coerência com a landing page, uso real, simplicidade e escalabilidade.

---

## Decisões de Design

### 1. Multi-Tenancy por Clube

#### Decisão
- **Clube** é a entidade raiz de isolamento
- Todos os dados têm referência ao clube (direta ou indireta)
- Queries sempre filtram por clube

#### Implementação
- `Clube` model com relacionamentos para todas as entidades principais
- `clubeId` em entidades que pertencem diretamente ao clube
- Isolamento indireto através de equipe (equipe pertence a clube)

---

### 2. Gestão de Equipe

#### Decisão
- Suporte a múltiplas equipes por clube
- Atleta pode estar em múltiplas equipes (com temporalidade)
- Comissão técnica pode gerenciar múltiplas equipes

#### Implementação
- `Team` model com `clubeId`
- `PlayerTeam` model para relacionamento muitos-para-muitos com temporalidade
- `TeamMember` model para relacionamento muitos-para-muitos entre usuários e equipes

---

### 3. Programação Unificada

#### Decisão
- Uma única entidade `Schedule` para treinos, jogos e convocações
- Tipo diferenciado por campo `type`
- "Organização em um só lugar" como prometido

#### Implementação
- `Schedule` model com campo `type` (treino, jogo, convocacao)
- `ScheduleParticipant` para atletas convocados
- Relacionamento 1:1 com `Match` quando tipo é "jogo"

---

### 4. Jogo como Evento Central

#### Decisão
- `Match` herda de `Schedule` (relacionamento 1:1)
- Jogo é o hub que conecta todos os dados
- Scout individual e coletivo vinculados ao jogo

#### Implementação
- `Match` model com `scheduleId` único
- `MatchParticipant` para participação de atletas
- `ScoutCollective` (1:1 com Match)
- `ScoutIndividual` (1:N com Match, 1:1 com Player)

---

### 5. Scout Individual e Coletivo

#### Decisão
- Dados numéricos e qualitativos separados
- Scout individual por atleta por jogo
- Scout coletivo por jogo (um por jogo)

#### Implementação
- `ScoutIndividual` com todas as estatísticas numéricas
- `ScoutCollective` com estatísticas coletivas
- Campos para dados qualitativos (observations, rating)

---

### 6. Histórico Completo

#### Decisão
- Soft delete em todas as entidades principais
- Temporalidade preservada (createdAt, updatedAt, deletedAt)
- Relacionamentos temporais (startDate, endDate)

#### Implementação
- `deletedAt` em todas as entidades principais
- `PlayerTeam` e `TeamMember` com startDate/endDate
- Índices em `deletedAt` para queries eficientes

---

### 7. Rankings Derivados

#### Decisão
- Rankings NÃO são entidades fixas
- Rankings são calculados em tempo real
- Base: agregação de dados de `ScoutIndividual`

#### Implementação
- Não há model de Ranking
- Rankings são calculados via queries agregadas
- Performance otimizada com índices adequados

---

### 8. Evolução Temporal

#### Decisão
- Evolução é calculada, não armazenada
- Base: histórico completo de `ScoutIndividual`
- Agregação por período via queries

#### Implementação
- Não há model de Evolução
- Evolução calculada via queries temporais
- Índices em campos de data para performance

---

## Estrutura de Entidades

### Entidades Principais

1. **Clube** - Raiz de multi-tenancy
2. **User** - Usuários/comissão técnica
3. **Team** - Equipes
4. **Player** - Atletas
5. **Schedule** - Programações (treinos, jogos, convocações)
6. **Match** - Jogos (especialização de Schedule)
7. **ScoutCollective** - Scout coletivo
8. **ScoutIndividual** - Scout individual
9. **Competition** - Competições/campeonatos
10. **Assessment** - Avaliações

### Entidades de Relacionamento

1. **PlayerTeam** - Relacionamento Player ↔ Team (com temporalidade)
2. **TeamMember** - Relacionamento User ↔ Team (comissão técnica)
3. **ScheduleParticipant** - Relacionamento Schedule ↔ Player
4. **MatchParticipant** - Relacionamento Match ↔ Player

### Entidades de Configuração

1. **StatTarget** - Metas de estatísticas

---

## Relacionamentos Principais

### Hierarquia de Multi-Tenancy
```
Clube
  ├── User (comissão técnica)
  ├── Team
  │   ├── PlayerTeam (atletas)
  │   ├── TeamMember (técnicos)
  │   ├── Schedule (programações)
  │   └── Match (jogos)
  └── Competition
```

### Jogo como Evento Central
```
Match
  ├── Schedule (programação)
  ├── MatchParticipant (atletas)
  ├── ScoutCollective (dados coletivos)
  └── ScoutIndividual (dados individuais)
      └── Player
```

### Histórico e Evolução
```
Player
  ├── PlayerTeam (histórico de equipes)
  ├── MatchParticipant (histórico de jogos)
  ├── ScoutIndividual (histórico de performance)
  └── Assessment (histórico de avaliações)
```

---

## Índices Estratégicos

### Multi-Tenancy
- `[clubeId, deletedAt]` em todas as entidades principais
- Garante isolamento e performance

### Temporalidade
- `[teamId, date]` em Schedule
- `[playerId, date]` em Assessment
- `[type, date]` em Schedule

### Relacionamentos
- `[matchId, playerId]` em ScoutIndividual (único)
- `[playerId, teamId, startDate]` em PlayerTeam (único)
- `[userId, teamId, startDate]` em TeamMember (único)

### Performance
- Índices em campos frequentemente consultados
- Índices compostos para queries comuns
- Índices em campos de filtro

---

## Validação contra Checklist do Prompt 1

### Gestão de Equipe
- ✅ Clube pode ter múltiplas equipes (`Team.clubeId`)
- ✅ Equipe pode ter múltiplos atletas (`PlayerTeam`)
- ✅ Atleta pode ter histórico completo (`PlayerTeam` com temporalidade)
- ✅ Comissão técnica pode ser cadastrada (`TeamMember`)
- ✅ Usuários podem acessar o sistema (`User`)

### Programação
- ✅ Treinos podem ser programados (`Schedule` type: "treino")
- ✅ Jogos podem ser programados (`Schedule` type: "jogo" + `Match`)
- ✅ Convocações podem ser criadas (`Schedule` type: "convocacao")
- ✅ Tudo organizado em um só lugar (`Schedule` unificado)

### Scout de Jogo
- ✅ Dados individuais podem ser registrados por partida (`ScoutIndividual`)
- ✅ Dados coletivos podem ser registrados por partida (`ScoutCollective`)
- ✅ Estatísticas podem ser calculadas (dados numéricos armazenados)

### Evolução e Ranking
- ✅ Evolução do atleta pode ser acompanhada ao longo do tempo (queries temporais)
- ✅ Atletas podem ser comparados entre si (agregação de `ScoutIndividual`)
- ✅ Rankings podem ser gerados (cálculo em tempo real)

### Performance baseada em dados
- ✅ Análises podem ser geradas (dados disponíveis para cálculo)
- ✅ Indicadores podem ser calculados (dados numéricos armazenados)
- ✅ Avaliações podem ser baseadas em dados objetivos (`Assessment`)

### Uso contínuo
- ✅ Dados não são perdidos (`deletedAt` - soft delete)
- ✅ Histórico completo é mantido (temporalidade preservada)
- ✅ Sistema suporta uso diário do clube (estrutura otimizada)

---

## Decisões de Implementação

### 1. Soft Delete
- **Decisão:** Usar `deletedAt` em vez de deletar fisicamente
- **Razão:** Histórico completo, como prometido na landing page
- **Implementação:** Campo `deletedAt` em todas as entidades principais

### 2. Temporalidade em Relacionamentos
- **Decisão:** `startDate` e `endDate` em relacionamentos muitos-para-muitos
- **Razão:** Histórico completo de mudanças
- **Implementação:** `PlayerTeam` e `TeamMember` com campos temporais

### 3. Jogo Herda de Schedule
- **Decisão:** `Match` tem relacionamento 1:1 com `Schedule`
- **Razão:** Jogo é um tipo de programação, mas com dados específicos
- **Implementação:** `Match.scheduleId` único

### 4. Scout Separado (Individual vs Coletivo)
- **Decisão:** Dois models separados
- **Razão:** Dados diferentes, relacionamentos diferentes
- **Implementação:** `ScoutCollective` (1:1 com Match) e `ScoutIndividual` (N:1 com Match)

### 5. Dados Sensíveis
- **Decisão:** Campos marcados como sensíveis (salário, CPF)
- **Razão:** Proteção de dados pessoais
- **Implementação:** Campos opcionais, acesso controlado

### 6. JSON para Avaliações
- **Decisão:** Campo `data` como JSON em `Assessment`
- **Razão:** Flexibilidade para diferentes tipos de avaliação
- **Implementação:** `Json` type do Prisma

---

## Escalabilidade

### Índices Estratégicos
- Índices compostos para queries comuns
- Índices em campos de filtro (clubeId, teamId, date)
- Índices em relacionamentos (matchId, playerId)

### Performance
- Queries otimizadas com índices adequados
- Agregações eficientes para rankings
- Cache pode ser adicionado no futuro se necessário

### Crescimento
- Estrutura suporta crescimento horizontal (mais clubes)
- Estrutura suporta crescimento vertical (mais dados por clube)
- Particionamento pode ser adicionado no futuro se necessário

---

## Resumo Executivo

### Schema Completo
- **15 models principais**
- **4 models de relacionamento**
- **1 model de configuração**
- **Total: 20 models**

### Cobertura dos Prompts
- ✅ Prompt 1: Todas as entidades conceituais
- ✅ Prompt 2: Perfis e responsabilidades suportados
- ✅ Prompt 3: Gestão de equipe completa
- ✅ Prompt 4: Programação unificada
- ✅ Prompt 5: Jogo como evento central
- ✅ Prompt 6: Scout individual e coletivo
- ✅ Prompt 7: Histórico e evolução (via queries)
- ✅ Prompt 8: Multi-tenancy e escalabilidade

### Princípios Aplicados
- **Simplicidade:** Estrutura direta, sem over-engineering
- **Flexibilidade:** Fácil adicionar novos campos/tipos
- **Performance:** Índices estratégicos
- **Escalabilidade:** Suporta crescimento
- **Histórico:** Soft delete e temporalidade

---

**Documento criado em:** 2026-01-09  
**Schema Prisma:** `backend/prisma/schema.prisma`

# PROMPT 4 — PROGRAMAÇÃO (TREINOS E JOGOS)

## Objetivo
Definir a lógica de dados necessária para suportar "Programação" conforme prometido na landing page: "Organize treinos, jogos e convocações em um só lugar".

---

## Contexto da Landing Page

### Promessas Relacionadas
- "Programação - Organize treinos, jogos e convocações em um só lugar"
- "Uso diário pelo técnico"
- "Integração futura com visão geral"
- "Linha do tempo da equipe"

---

## Entidades Conceituais de Programação

### 1. Programação (Entidade Genérica)

#### 1.1. Conceito Central
- **Programação** é a entidade genérica que agrupa:
  - Treinos
  - Jogos
  - Convocações
- **Objetivo:** "Organização em um só lugar"
- **Características:**
  - Todas as atividades da equipe em um único contexto
  - Linha do tempo unificada
  - Alertas e lembretes centralizados

#### 1.2. Atributos Comuns
- **Identificação:**
  - Tipo (Treino, Jogo, Convocações)
  - Título/Descrição
  - Data
  - Horário
  - Local

- **Relacionamentos:**
  - Equipe associada
  - Criador (técnico)
  - Participantes (atletas, comissão)

- **Status:**
  - Agendado
  - Em andamento
  - Concluído
  - Cancelado

---

### 2. Treino

#### 2.1. Características Específicas
- **Tipo:** Programação de Treino
- **Objetivo:** Sessão de treinamento da equipe
- **Dados necessários:**
  - Data e horário
  - Local (quadra, campo, etc.)
  - Duração estimada
  - Objetivo do treino (opcional)
  - Tipo de treino (técnico, físico, tático, etc.)

#### 2.2. Participantes
- **Atletas convocados:**
  - Lista de atletas que devem participar
  - Status de confirmação (confirmado, pendente, ausente)
  - Presença registrada (sim/não)

- **Comissão técnica:**
  - Técnicos responsáveis
  - Preparadores físicos
  - Outros membros da comissão

#### 2.3. Relacionamentos
- Pertence a uma **Equipe**
- Criado por um **Técnico**
- Tem **Atletas** participantes
- Pode ter **Comissão Técnica** presente

---

### 3. Jogo/Partida

#### 3.1. Características Específicas
- **Tipo:** Programação de Jogo
- **Objetivo:** Partida oficial ou amistosa
- **Dados necessários:**
  - Data e horário
  - Local (mandante/visitante)
  - Adversário
  - Competição/Campeonato
  - Tipo (oficial, amistoso, etc.)

#### 3.2. Relacionamento com Scout
- Jogo é o **evento central** para scout
- Após o jogo, scout é registrado
- Dados coletivos e individuais são vinculados ao jogo
- Resultado do jogo é registrado

#### 3.3. Participantes
- **Atletas convocados:**
  - Lista de atletas que jogarão
  - Escalação (titulares, reservas)
  - Entradas e saídas durante o jogo

- **Comissão técnica:**
  - Técnico responsável
  - Membros da comissão presentes

#### 3.4. Relacionamentos
- Pertence a uma **Equipe**
- Criado por um **Técnico**
- Tem **Atletas** participantes
- Vinculado a uma **Competição/Campeonato**
- Gera **Scout** (dados coletivos e individuais)
- Tem **Resultado** (vitória, derrota, empate)

---

### 4. Convocações

#### 4.1. Características Específicas
- **Tipo:** Programação de Convocações
- **Objetivo:** Lista de atletas convocados para um evento
- **Dados necessários:**
  - Data e horário do evento
  - Local
  - Tipo de evento (treino, jogo, reunião, etc.)
  - Lista de atletas convocados
  - Observações

#### 4.2. Participantes
- **Atletas convocados:**
  - Lista específica de atletas
  - Status de confirmação
  - Motivo da convocação (opcional)

#### 4.3. Relacionamentos
- Pertence a uma **Equipe**
- Criado por um **Técnico**
- Tem **Atletas** convocados
- Pode estar vinculado a um **Treino** ou **Jogo**

---

## Estrutura de Alertas e Lembretes

### 1. Alertas Automáticos

#### 1.1. Tipos de Alertas
- **Alerta de Programação Próxima:**
  - X horas/dias antes do evento
  - Notificação para técnico
  - Notificação para atletas (futuro)

- **Alerta de Confirmação Pendente:**
  - Atletas que ainda não confirmaram presença
  - Lembrete para técnico

- **Alerta de Jogo Próximo:**
  - Destaque especial para jogos
  - Integração com visão geral

#### 1.2. Configuração de Alertas
- **Tempo de antecedência:**
  - Configurável por tipo de evento
  - Exemplo: Jogos 24h antes, Treinos 2h antes

- **Canais de notificação:**
  - Sistema (visual)
  - Email (futuro)
  - Push notification (futuro)

### 2. Lembretes

#### 2.1. Tipos de Lembretes
- **Lembrete de Preparação:**
  - Material necessário
  - Uniforme específico
  - Horário de chegada

- **Lembrete de Pós-Evento:**
  - Registrar scout (após jogo)
  - Avaliar atletas (após treino)

---

## Linha do Tempo da Equipe

### 1. Conceito
- **Linha do tempo unificada** de todas as programações
- Visualização cronológica de:
  - Treinos
  - Jogos
  - Convocações
- Organização temporal clara

### 2. Estrutura Temporal
- **Ordenação:** Por data e horário
- **Agrupamento:** Por dia, semana, mês
- **Filtros:** Por tipo (treino, jogo, convocação)
- **Status visual:** Agendado, em andamento, concluído

### 3. Integração com Visão Geral
- **Dashboard:** Próximos eventos
- **Alertas visuais:** Eventos importantes
- **Estatísticas:** Frequência de treinos, jogos

---

## Relacionamentos com Outras Entidades

### Equipe
- **Tipo:** Um-para-Muitos
- Uma equipe tem múltiplas programações
- Programação pertence a uma equipe

### Técnico
- **Tipo:** Um-para-Muitos
- Um técnico cria múltiplas programações
- Programação é criada por um técnico

### Atletas
- **Tipo:** Muitos-para-Muitos
- Uma programação tem múltiplos atletas
- Um atleta participa de múltiplas programações
- Relacionamento tem status (confirmado, presente, ausente)

### Competição/Campeonato
- **Tipo:** Um-para-Muitos (apenas para Jogos)
- Uma competição tem múltiplos jogos
- Jogo pertence a uma competição (opcional)

### Scout
- **Tipo:** Um-para-Um (apenas para Jogos)
- Um jogo pode ter scout registrado
- Scout pertence a um jogo

---

## Casos de Uso Específicos

### Caso 1: Uso Diário pelo Técnico
- **Cenário:** Técnico acessa sistema diariamente para ver programações
- **Estrutura necessária:**
  - Visualização rápida de programações do dia
  - Alertas de eventos próximos
  - Criação rápida de novas programações
  - Edição de programações existentes

### Caso 2: Integração com Visão Geral
- **Cenário:** Dashboard mostra próximos eventos
- **Estrutura necessária:**
  - Consulta eficiente de programações futuras
  - Destaque para jogos importantes
  - Estatísticas de programação (quantos treinos, jogos no mês)

### Caso 3: Linha do Tempo da Equipe
- **Cenário:** Visualização cronológica de todas as atividades
- **Estrutura necessária:**
  - Ordenação temporal eficiente
  - Agrupamento por período
  - Filtros por tipo
  - Status visual claro

### Caso 4: Alertas de Programação
- **Cenário:** Sistema alerta sobre eventos próximos
- **Estrutura necessária:**
  - Cálculo de eventos próximos
  - Configuração de tempo de antecedência
  - Notificações visuais
  - Status de visualização do alerta

---

## Estrutura de Dados para Alertas

### 1. Alertas de Programação
- **Dados necessários:**
  - Programação relacionada
  - Tipo de alerta
  - Data/hora do alerta
  - Status (não visualizado, visualizado)
  - Usuário destinatário

### 2. Configuração de Alertas
- **Dados necessários:**
  - Tipo de evento (treino, jogo, convocação)
  - Tempo de antecedência
  - Usuário que configura
  - Ativo/Inativo

---

## Organização "Em Um Só Lugar"

### Princípio Central
- **Todas as programações** (treinos, jogos, convocações) em um único contexto
- **Não há separação** entre tipos na estrutura lógica
- **Filtros e visualizações** permitem focar em tipos específicos
- **Linha do tempo unificada** mostra tudo junto

### Estrutura Lógica
```
Programação (genérica)
  ├── Tipo: Treino
  ├── Tipo: Jogo
  └── Tipo: Convocações
```

### Benefícios
- **Simplicidade:** Uma única estrutura para gerenciar
- **Consistência:** Mesmos atributos e relacionamentos
- **Flexibilidade:** Fácil adicionar novos tipos no futuro
- **Organização:** Tudo em um só lugar, como prometido

---

## Resumo Executivo

### Entidades Conceituais
1. **Programação (genérica):** Agrupa treinos, jogos e convocações
2. **Treino:** Sessão de treinamento
3. **Jogo/Partida:** Partida oficial ou amistosa
4. **Convocações:** Lista de atletas convocados

### Relacionamentos
- **Equipe ↔ Programação:** Um-para-Muitos
- **Técnico ↔ Programação:** Um-para-Muitos
- **Atletas ↔ Programação:** Muitos-para-Muitos
- **Competição ↔ Jogo:** Um-para-Muitos
- **Jogo ↔ Scout:** Um-para-Um

### Funcionalidades
- **Alertas automáticos:** Eventos próximos
- **Lembretes:** Preparação e pós-evento
- **Linha do tempo:** Visualização cronológica
- **Integração:** Com visão geral e dashboard

### Princípios
- **Organização em um só lugar:** Tudo centralizado
- **Uso diário:** Interface simples e rápida
- **Temporalidade:** Ordenação e agrupamento por tempo
- **Flexibilidade:** Fácil adicionar novos tipos

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO - "Programação"

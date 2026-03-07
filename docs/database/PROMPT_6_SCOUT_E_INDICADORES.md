# PROMPT 6 — SCOUT, INDICADORES E DADOS DE PERFORMANCE

## Objetivo
Definir como o banco de dados deve suportar scout individual, scout coletivo, indicadores de performance e dados numéricos/qualitativos, sustentando a promessa "Transforme informação em vantagem competitiva".

---

## Contexto da Landing Page

### Promessas Relacionadas
- "Scout de Jogo - Registre dados individuais e coletivos de cada partida"
- "Transforme informação em vantagem competitiva"
- "Análises baseadas em dados para decisões vencedoras"
- "Indicadores, scout e análise de performance"
- "Transformar dados brutos de 20.000 linhas de excel em insights poderosos"
- "KPIs mencionados no DNA do idealizador"

---

## Modelo Lógico de Scout Individual

### 1. Conceito de Scout Individual

#### 1.1. Definição
- **Scout Individual:** Dados de performance de um atleta específico em um jogo específico
- **Vinculação:** Pertence a um Jogo e a um Atleta
- **Objetivo:** Registrar todas as ações e estatísticas do atleta na partida

#### 1.2. Características
- **Específico por jogo:** Cada jogo tem scout individual de cada atleta
- **Histórico completo:** Todos os scouts são mantidos
- **Base para evolução:** Scouts individuais alimentam a evolução do atleta
- **Base para ranking:** Scouts individuais são agregados para rankings

---

### 2. Dados Numéricos do Scout Individual

#### 2.1. Estatísticas Ofensivas
- **Gols:**
  - Quantidade de gols marcados
  - Tipo numérico (inteiro)

- **Assistências:**
  - Quantidade de assistências
  - Tipo numérico (inteiro)

- **Chutes:**
  - Chutes a gol (on target)
  - Chutes para fora (off target)
  - Tipo numérico (inteiro)

#### 2.2. Estatísticas de Passe
- **Passes certos:**
  - Quantidade de passes completados com sucesso
  - Tipo numérico (inteiro)

- **Passes errados:**
  - Quantidade de passes que não completaram
  - Tipo numérico (inteiro)

- **Precisão de passe:**
  - Calculado: (passes certos / total de passes) * 100
  - Tipo numérico (decimal, percentual)

#### 2.3. Estatísticas Defensivas
- **Desarmes:**
  - Desarmes com posse
  - Desarmes sem posse
  - Desarmes em contra-ataque
  - Tipo numérico (inteiro)

- **Erros de transição:**
  - Quantidade de erros na transição
  - Tipo numérico (inteiro)

#### 2.4. Outras Estatísticas Numéricas
- **Minutos jogados:**
  - Tempo em campo
  - Tipo numérico (inteiro, minutos)

- **Faltas:**
  - Faltas cometidas
  - Faltas sofridas
  - Tipo numérico (inteiro)

- **Cartões:**
  - Cartões amarelos
  - Cartões vermelhos
  - Tipo numérico (inteiro)

---

### 3. Dados Qualitativos do Scout Individual

#### 3.1. Avaliação Qualitativa
- **Nota/Performance:**
  - Avaliação numérica (ex: 0-10)
  - Tipo numérico (decimal)

- **Avaliação textual:**
  - Observações sobre a performance
  - Tipo texto (string)

#### 3.2. Observações
- **Comentários:**
  - Observações específicas sobre o atleta no jogo
  - Tipo texto (string, longo)

- **Destaques:**
  - Momentos importantes da partida
  - Tipo texto (string)

---

## Modelo Lógico de Scout Coletivo

### 1. Conceito de Scout Coletivo

#### 1.1. Definição
- **Scout Coletivo:** Dados de performance da equipe como um todo em um jogo
- **Vinculação:** Pertence a um Jogo
- **Objetivo:** Registrar estatísticas e performance coletiva da equipe

#### 1.2. Características
- **Um por jogo:** Cada jogo tem um scout coletivo
- **Agregação:** Alguns dados são soma dos individuais, outros são específicos
- **Análise tática:** Base para análise de performance coletiva

---

### 2. Dados Numéricos do Scout Coletivo

#### 2.1. Estatísticas de Jogo
- **Placar:**
  - Gols marcados pela equipe
  - Gols sofridos
  - Tipo numérico (inteiro)

- **Resultado:**
  - Vitória, Derrota, Empate
  - Tipo enum ou string

#### 2.2. Estatísticas Coletivas
- **Posse de bola:**
  - Percentual de posse
  - Tipo numérico (decimal, percentual)

- **Chutes:**
  - Total de chutes a gol
  - Total de chutes para fora
  - Tipo numérico (inteiro)

- **Passes:**
  - Total de passes certos
  - Total de passes errados
  - Precisão de passe da equipe
  - Tipo numérico (inteiro/decimal)

#### 2.3. Estatísticas Defensivas Coletivas
- **Desarmes:**
  - Total de desarmes da equipe
  - Tipo numérico (inteiro)

- **Erros de transição:**
  - Total de erros de transição
  - Tipo numérico (inteiro)

#### 2.4. Outras Estatísticas Coletivas
- **Faltas:**
  - Faltas cometidas
  - Faltas sofridas
  - Tipo numérico (inteiro)

- **Cartões:**
  - Total de cartões amarelos
  - Total de cartões vermelhos
  - Tipo numérico (inteiro)

---

### 3. Dados Qualitativos do Scout Coletivo

#### 3.1. Análise Coletiva
- **Avaliação da equipe:**
  - Nota/Performance coletiva
  - Tipo numérico (decimal)

- **Observações coletivas:**
  - Análise tática
  - Observações sobre a performance da equipe
  - Tipo texto (string, longo)

#### 3.2. Análise Tática
- **Formação utilizada:**
  - Sistema tático
  - Tipo texto (string)

- **Destaques coletivos:**
  - Momentos importantes da partida
  - Tipo texto (string)

---

## Indicadores de Performance

### 1. Conceito de Indicadores

#### 1.1. Definição
- **Indicadores/KPIs:** Métricas calculadas a partir dos dados de scout
- **Objetivo:** Transformar dados brutos em insights poderosos
- **Base:** Dados numéricos e qualitativos do scout

#### 1.2. Características
- **Derivados:** Não são armazenados diretamente, são calculados
- **Temporais:** Podem ser calculados por período
- **Comparativos:** Permitem comparação entre atletas e períodos

---

### 2. Indicadores Individuais

#### 2.1. Indicadores Ofensivos
- **Média de gols por jogo:**
  - Calculado: Total de gols / Número de jogos
  - Tipo: Decimal

- **Média de assistências por jogo:**
  - Calculado: Total de assistências / Número de jogos
  - Tipo: Decimal

- **Eficiência de finalização:**
  - Calculado: (Gols / Chutes a gol) * 100
  - Tipo: Decimal (percentual)

#### 2.2. Indicadores de Passe
- **Precisão de passe:**
  - Calculado: (Passes certos / Total de passes) * 100
  - Tipo: Decimal (percentual)

- **Média de passes certos por jogo:**
  - Calculado: Total de passes certos / Número de jogos
  - Tipo: Decimal

#### 2.3. Indicadores Defensivos
- **Média de desarmes por jogo:**
  - Calculado: Total de desarmes / Número de jogos
  - Tipo: Decimal

- **Eficiência defensiva:**
  - Calculado a partir de múltiplas métricas
  - Tipo: Decimal

#### 2.4. Indicadores Gerais
- **Performance média:**
  - Média das notas/avaliações
  - Tipo: Decimal

- **Participação:**
  - Percentual de jogos que participou
  - Tipo: Decimal (percentual)

---

### 3. Indicadores Coletivos

#### 3.1. Indicadores da Equipe
- **Média de gols por jogo:**
  - Calculado: Total de gols / Número de jogos
  - Tipo: Decimal

- **Média de gols sofridos por jogo:**
  - Calculado: Total de gols sofridos / Número de jogos
  - Tipo: Decimal

- **Saldo de gols:**
  - Calculado: Gols marcados - Gols sofridos
  - Tipo: Decimal

#### 3.2. Indicadores de Eficiência
- **Eficiência ofensiva:**
  - Calculado a partir de múltiplas métricas
  - Tipo: Decimal

- **Eficiência defensiva:**
  - Calculado a partir de múltiplas métricas
  - Tipo: Decimal

- **Aproveitamento:**
  - Calculado: (Pontos conquistados / Pontos possíveis) * 100
  - Tipo: Decimal (percentual)

---

## Armazenamento de Dados Numéricos e Qualitativos

### 1. Dados Numéricos

#### 1.1. Tipos de Dados
- **Inteiros:**
  - Gols, assistências, passes, desarmes
  - Contadores simples
  - Tipo: INTEGER

- **Decimais:**
  - Percentuais, médias, notas
  - Precisão necessária
  - Tipo: DECIMAL ou FLOAT

#### 1.2. Armazenamento
- **Direto:** Valores são armazenados diretamente no scout
- **Calculado:** Alguns valores são calculados a partir de outros
- **Agregado:** Valores são agregados para indicadores

---

### 2. Dados Qualitativos

#### 2.1. Tipos de Dados
- **Texto curto:**
  - Observações breves
  - Tipo: VARCHAR

- **Texto longo:**
  - Análises detalhadas
  - Observações extensas
  - Tipo: TEXT

#### 2.2. Armazenamento
- **Direto:** Textos são armazenados diretamente
- **Estruturado:** Podem ser estruturados (JSON) para análises futuras

---

## Evolução Temporal

### 1. Como Dados Suportam Evolução

#### 1.1. Agregação Temporal
- **Por jogo:** Dados são registrados por jogo
- **Por período:** Dados são agregados por período (mês, temporada)
- **Tendências:** Evolução mostra tendências ao longo do tempo

#### 1.2. Cálculo de Evolução
- **Comparação temporal:**
  - Comparar dados de diferentes períodos
  - Identificar melhoria ou declínio
  - Tipo: Cálculo derivado

---

### 2. Estrutura para Evolução

#### 2.1. Dados Históricos
- **Todos os scouts são mantidos:**
  - Nada é deletado
  - Histórico completo
  - Base para evolução

#### 2.2. Agregação por Período
- **Períodos definidos:**
  - Por mês
  - Por temporada
  - Por período customizado

- **Cálculo de médias:**
  - Médias por período
  - Comparação entre períodos
  - Tendências

---

## Comparação entre Atletas

### 1. Estrutura para Comparação

#### 1.1. Agregação de Dados
- **Dados individuais são agregados:**
  - Soma de estatísticas
  - Médias calculadas
  - Indicadores derivados

#### 1.2. Comparação
- **Por estatística:**
  - Comparar gols entre atletas
  - Comparar assistências
  - Comparar qualquer métrica

- **Por indicador:**
  - Comparar indicadores calculados
  - Rankings derivados

---

## Princípios de Design

### 1. Dados Simples e Práticos
- **Não engessado:**
  - Estrutura flexível
  - Fácil adicionar novas estatísticas
  - Não limitado a métricas fixas

### 2. Reutilizáveis
- **Dados primários:**
  - Dados brutos são armazenados
  - Indicadores são calculados
  - Fácil recalcular indicadores

### 3. Nada Engessado
- **Extensível:**
  - Fácil adicionar novas métricas
  - Fácil adicionar novos indicadores
  - Estrutura não limita crescimento

---

## Resumo Executivo

### Modelo Lógico de Scout

1. **Scout Individual:**
   - Dados numéricos (gols, assistências, passes, etc.)
   - Dados qualitativos (notas, observações)
   - Vinculado a Jogo e Atleta

2. **Scout Coletivo:**
   - Dados numéricos coletivos (placar, posse, etc.)
   - Dados qualitativos coletivos (análise tática)
   - Vinculado a Jogo

### Indicadores de Performance

1. **Indicadores Individuais:**
   - Calculados a partir de scout individual
   - Médias, percentuais, eficiências
   - Comparáveis entre atletas

2. **Indicadores Coletivos:**
   - Calculados a partir de scout coletivo
   - Médias, saldos, aproveitamentos
   - Análise da equipe

### Armazenamento

1. **Dados Numéricos:**
   - Inteiros (contadores)
   - Decimais (médias, percentuais)

2. **Dados Qualitativos:**
   - Texto curto (observações)
   - Texto longo (análises)

### Evolução e Comparação

1. **Evolução Temporal:**
   - Agregação por período
   - Tendências identificadas
   - Comparação temporal

2. **Comparação entre Atletas:**
   - Agregação de dados
   - Comparação por métrica
   - Rankings derivados

### Princípios

- **Simples e prático:** Estrutura direta
- **Reutilizável:** Dados primários, indicadores calculados
- **Nada engessado:** Extensível e flexível
- **Comparável:** Fácil comparar atletas e períodos

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO - "Scout de Jogo" e "Transforme informação em vantagem competitiva"

# PROMPT 7 — EVOLUÇÃO, HISTÓRICO E RANKING

## Objetivo
Definir como o banco de dados deve permitir histórico completo do atleta, evolução temporal, comparação entre atletas e rankings baseados em dados reais, sustentando "Acompanhe evolução" e "Ranking em tempo real".

---

## Contexto da Landing Page

### Promessas Relacionadas
- "Acompanhe evolução - Dados e ranking em tempo real"
- "Evolução e Ranking - Acompanhe performance e compare atletas com dados reais"
- "Falta de histórico completo dos atletas" (problema que resolvemos)
- "Dificuldade em acompanhar evolução real" (problema que resolvemos)
- "Acompanhe performance e compare atletas com dados reais"

---

## Histórico Completo do Atleta

### 1. Conceito de Histórico Completo

#### 1.1. Definição
- **Histórico Completo:** Todos os dados do atleta desde o primeiro registro
- **Objetivo:** Nada é perdido, tudo é mantido
- **Solução para:** "Falta de histórico completo dos atletas"

#### 1.2. Princípios
- **Nada é deletado fisicamente:**
  - Soft delete (marcação de inativo)
  - Histórico completo é mantido
  - Dados não são perdidos

- **Temporalidade preservada:**
  - Todas as ações têm timestamp
  - Histórico é ordenado temporalmente
  - Comparação entre períodos é possível

---

### 2. Estrutura de Histórico

#### 2.1. Histórico de Equipes
- **Equipes que pertenceu:**
  - Todas as equipes, desde o início
  - Data de entrada em cada equipe
  - Data de saída (se aplicável)
  - Status em cada equipe

- **Evolução entre equipes:**
  - Mudança de equipe de base para adulta
  - Transferências
  - Retornos

#### 2.2. Histórico de Partidas
- **Todas as partidas jogadas:**
  - Desde a primeira partida
  - Todas as partidas, sem exceção
  - Scout de cada partida
  - Performance em cada partida

- **Agregação temporal:**
  - Partidas por período (mês, temporada)
  - Estatísticas acumuladas
  - Tendências identificadas

#### 2.3. Histórico de Avaliações
- **Todas as avaliações:**
  - Avaliações físicas
  - Avaliações técnicas
  - Datas de cada avaliação
  - Resultados de cada avaliação

- **Evolução física:**
  - Comparação entre avaliações
  - Tendências de melhoria/declínio
  - Metas alcançadas

#### 2.4. Histórico de Estatísticas
- **Todas as estatísticas:**
  - Gols, assistências, passes, etc.
  - Registradas por partida
  - Agregadas por período
  - Tendências identificadas

---

## Evolução Temporal

### 1. Conceito de Evolução

#### 1.1. Definição
- **Evolução:** Mudança de performance ao longo do tempo
- **Objetivo:** Identificar tendências de melhoria ou declínio
- **Solução para:** "Dificuldade em acompanhar evolução real"

#### 1.2. Características
- **Temporal:** Baseada em dados ao longo do tempo
- **Comparativa:** Compara períodos diferentes
- **Derivada:** Não é armazenada, é calculada

---

### 2. Estrutura de Evolução

#### 2.1. Agregação por Período
- **Períodos definidos:**
  - Por mês
  - Por temporada
  - Por período customizado (ex: últimos 10 jogos)

- **Dados agregados:**
  - Médias de estatísticas
  - Totais de estatísticas
  - Indicadores calculados

#### 2.2. Comparação Temporal
- **Entre períodos:**
  - Comparar mês atual vs mês anterior
  - Comparar temporada atual vs temporada anterior
  - Comparar qualquer período

- **Tendências:**
  - Melhoria: aumento de performance
  - Declínio: diminuição de performance
  - Estabilidade: performance constante

#### 2.3. Cálculo de Evolução
- **Métricas de evolução:**
  - Variação percentual
  - Variação absoluta
  - Tendência (crescente, decrescente, estável)

- **Visualização:**
  - Gráficos de evolução
  - Tabelas comparativas
  - Indicadores visuais

---

### 3. Evolução Mês a Mês

#### 3.1. Agregação Mensal
- **Dados por mês:**
  - Todas as partidas do mês
  - Estatísticas agregadas do mês
  - Indicadores calculados do mês

#### 3.2. Comparação Mensal
- **Mês atual vs mês anterior:**
  - Comparar performance
  - Identificar melhorias
  - Identificar declínios

- **Tendência mensal:**
  - Evolução ao longo dos meses
  - Padrões identificados
  - Sazonalidade (se aplicável)

---

## Comparação entre Atletas

### 1. Conceito de Comparação

#### 1.1. Definição
- **Comparação:** Análise de performance entre diferentes atletas
- **Objetivo:** "Compare atletas com dados reais"
- **Base:** Dados agregados de cada atleta

#### 1.2. Características
- **Por métrica:** Compara uma métrica específica
- **Por período:** Compara em um período específico
- **Múltiplas métricas:** Compara várias métricas simultaneamente

---

### 2. Estrutura para Comparação

#### 2.1. Agregação de Dados
- **Dados individuais agregados:**
  - Soma de estatísticas
  - Médias calculadas
  - Indicadores derivados

#### 2.2. Comparação por Métrica
- **Gols:**
  - Total de gols de cada atleta
  - Média de gols por jogo
  - Ranking de artilheiros

- **Assistências:**
  - Total de assistências
  - Média de assistências por jogo
  - Ranking de assistências

- **Qualquer métrica:**
  - Passes, desarmes, etc.
  - Qualquer estatística registrada

#### 2.3. Comparação por Período
- **Período específico:**
  - Comparar atletas em um período
  - Exemplo: Últimos 10 jogos
  - Exemplo: Temporada atual

- **Múltiplos períodos:**
  - Comparar atletas em diferentes períodos
  - Identificar consistência
  - Identificar variações

---

## Rankings Baseados em Dados Reais

### 1. Conceito de Ranking

#### 1.1. Definição
- **Ranking:** Ordenação de atletas por uma métrica específica
- **Característica fundamental:** Ranking NÃO é entidade fixa
- **Base:** Ranking nasce dos dados acumulados

#### 1.2. Princípios
- **Derivado:** Ranking é calculado, não armazenado
- **Tempo real:** Ranking é atualizado em tempo real
- **Dinâmico:** Ranking muda conforme novos dados são adicionados

---

### 2. Como Rankings São Derivados

#### 2.1. Agregação de Dados
- **Dados primários:**
  - Scout individual de cada atleta
  - Estatísticas registradas por partida
  - Dados são agregados para ranking

#### 2.2. Cálculo de Ranking
- **Por métrica:**
  - Soma total da métrica
  - Média da métrica
  - Qualquer cálculo agregado

- **Ordenação:**
  - Ordenar por valor agregado
  - Maior para menor (ou menor para maior)
  - Posição no ranking

#### 2.3. Tipos de Ranking
- **Ranking de artilheiros:**
  - Ordenado por total de gols
  - Atualizado a cada novo gol

- **Ranking de assistências:**
  - Ordenado por total de assistências
  - Atualizado a cada nova assistência

- **Ranking por qualquer métrica:**
  - Passes certos, desarmes, etc.
  - Qualquer estatística pode gerar ranking

---

### 3. Rankings por Período

#### 3.1. Ranking da Temporada
- **Agregação:**
  - Todos os jogos da temporada
  - Estatísticas agregadas
  - Ranking calculado

#### 3.2. Ranking do Mês
- **Agregação:**
  - Todos os jogos do mês
  - Estatísticas agregadas
  - Ranking calculado

#### 3.3. Ranking Personalizado
- **Período customizado:**
  - Últimos 10 jogos
  - Últimos 30 dias
  - Qualquer período definido

---

## Estrutura de Dados para Evolução

### 1. Dados Primários (Armazenados)

#### 1.1. Scout Individual
- **Por partida:**
  - Todas as estatísticas do atleta
  - Timestamp da partida
  - Base para evolução

#### 1.2. Avaliações
- **Por data:**
  - Resultados das avaliações
  - Timestamp da avaliação
  - Base para evolução física

---

### 2. Dados Derivados (Calculados)

#### 2.1. Agregações Temporais
- **Por período:**
  - Médias calculadas
  - Totais calculados
  - Indicadores derivados

#### 2.2. Evolução
- **Comparação temporal:**
  - Variações calculadas
  - Tendências identificadas
  - Gráficos gerados

#### 2.3. Rankings
- **Ordenação:**
  - Rankings calculados em tempo real
  - Não armazenados
  - Sempre atualizados

---

## Comparação entre Períodos Temporais

### 1. Estrutura para Comparação

#### 1.1. Períodos Definidos
- **Temporadas:**
  - Temporada 2024
  - Temporada 2025
  - Comparação entre temporadas

- **Meses:**
  - Janeiro 2025
  - Fevereiro 2025
  - Comparação entre meses

- **Períodos customizados:**
  - Últimos 10 jogos
  - Primeiros 10 jogos
  - Qualquer período

#### 1.2. Métricas Comparadas
- **Estatísticas:**
  - Gols, assistências, passes, etc.
  - Comparação de cada estatística

- **Indicadores:**
  - Médias, percentuais, eficiências
  - Comparação de indicadores

#### 1.3. Análise Comparativa
- **Variação:**
  - Percentual de mudança
  - Absoluto de mudança
  - Direção (melhoria/declínio)

---

## Resumo Executivo

### Histórico Completo
- **Nada é perdido:**
  - Soft delete (marcação de inativo)
  - Histórico completo mantido
  - Dados não são deletados fisicamente

- **Estrutura:**
  - Histórico de equipes
  - Histórico de partidas
  - Histórico de avaliações
  - Histórico de estatísticas

### Evolução Temporal
- **Agregação por período:**
  - Por mês
  - Por temporada
  - Por período customizado

- **Comparação temporal:**
  - Entre períodos
  - Tendências identificadas
  - Melhoria/declínio detectado

### Comparação entre Atletas
- **Agregação de dados:**
  - Dados individuais agregados
  - Médias e totais calculados

- **Comparação:**
  - Por métrica
  - Por período
  - Múltiplas métricas

### Rankings Derivados
- **Não são entidades fixas:**
  - Rankings são calculados
  - Não são armazenados
  - Atualizados em tempo real

- **Base:**
  - Dados acumulados
  - Agregação de estatísticas
  - Ordenação dinâmica

### Princípios
- **Histórico completo:** Nada é perdido
- **Evolução derivada:** Calculada, não armazenada
- **Rankings dinâmicos:** Calculados em tempo real
- **Comparação flexível:** Por métrica, por período

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO - "Evolução e Ranking" e "Acompanhe evolução"

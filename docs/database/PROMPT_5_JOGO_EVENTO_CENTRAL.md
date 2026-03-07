# PROMPT 5 — JOGO COMO EVENTO CENTRAL DO SISTEMA

## Objetivo
Definir o conceito de **JOGO** como evento central do SCOUT21PRO, alinhando "Scout de Jogo" com a estrutura de banco de dados.

---

## Contexto da Landing Page

### Promessas Relacionadas
- "Scout de Jogo - Registre dados individuais e coletivos de cada partida"
- "Registre jogos - Scout simples e eficiente"
- "Transforme informação em vantagem competitiva"
- Jogo é mencionado como ponto central de coleta de dados

---

## Jogo como Evento Central

### 1. Conceito Central

#### 1.1. Por que Jogo é Central?
- **Jogo é onde os dados são gerados:**
  - Scout individual (por atleta)
  - Scout coletivo (equipe)
  - Resultado e placar
  - Entradas e saídas

- **Jogo conecta tudo:**
  - Atletas → participam do jogo
  - Equipe → joga o jogo
  - Scout → registrado no jogo
  - Evolução → calculada a partir dos jogos
  - Ranking → derivado dos jogos
  - Programação → jogo é uma programação

#### 1.2. Jogo como Hub de Dados
```
Jogo (Central)
  ├── Atletas (participam)
  ├── Equipe (representa)
  ├── Scout Individual (dados por atleta)
  ├── Scout Coletivo (dados da equipe)
  ├── Resultado (vitória, derrota, empate)
  ├── Competição (contexto)
  └── Programação (agendamento)
```

---

## Estrutura de Dados do Jogo

### 1. Dados Básicos do Jogo

#### 1.1. Identificação
- **Data e horário:**
  - Quando o jogo aconteceu/acontecerá
  - Timestamp completo

- **Local:**
  - Mandante ou Visitante
  - Nome do local/quadra
  - Endereço (opcional)

#### 1.2. Contexto Competitivo
- **Adversário:**
  - Nome do time adversário
  - Informações do adversário (opcional)

- **Competição/Campeonato:**
  - Qual competição o jogo faz parte
  - Fase da competição (opcional)
  - Rodada (opcional)

- **Tipo de jogo:**
  - Oficial
  - Amistoso
  - Treino com outro time

---

### 2. Dados Coletivos

#### 2.1. Resultado e Placar
- **Placar:**
  - Gols da nossa equipe
  - Gols do adversário
  - Resultado final (vitória, derrota, empate)

- **Estatísticas Coletivas:**
  - Posse de bola (%)
  - Chutes a gol
  - Chutes para fora
  - Faltas cometidas
  - Faltas sofridas
  - Cartões amarelos
  - Cartões vermelhos
  - Outras estatísticas coletivas

#### 2.2. Performance da Equipe
- **Métricas coletivas:**
  - Eficiência ofensiva
  - Eficiência defensiva
  - Transições
  - Erros coletivos

---

### 3. Dados Individuais

#### 3.1. Participação dos Atletas
- **Escalação:**
  - Titulares
  - Reservas
  - Não relacionados

- **Entradas e Saídas:**
  - Quem entrou
  - Quem saiu
  - Minuto de entrada/saída
  - Substituições

#### 3.2. Scout Individual
- **Dados por atleta:**
  - Gols
  - Assistências
  - Passes certos/errados
  - Chutes a gol/para fora
  - Desarmes
  - Erros de transição
  - Outras estatísticas individuais

- **Performance individual:**
  - Avaliação qualitativa (opcional)
  - Nota (opcional)
  - Observações

---

## Relacionamentos do Jogo

### 1. Jogo ↔ Atletas

#### 1.1. Participação
- **Tipo:** Muitos-para-Muitos
- **Características:**
  - Múltiplos atletas participam de um jogo
  - Um atleta participa de múltiplos jogos
  - Relacionamento tem dados específicos:
    - Status (titular, reserva, não relacionado)
    - Minutos jogados
    - Entrada/saída
    - Scout individual

#### 1.2. Dados de Participação
- **Escalação:**
  - Posição em campo
  - Status (titular/reserva)
  - Minutos jogados

- **Substituições:**
  - Entrou no minuto X
  - Saiu no minuto Y
  - Substituiu quem / foi substituído por quem

---

### 2. Jogo ↔ Equipe

#### 2.1. Representação
- **Tipo:** Muitos-para-Um
- **Características:**
  - Um jogo pertence a uma equipe
  - Uma equipe tem múltiplos jogos
  - Jogo representa a equipe naquele momento

#### 2.2. Dados da Equipe no Jogo
- **Formação:**
  - Tática utilizada
  - Sistema de jogo

- **Performance coletiva:**
  - Estatísticas da equipe
  - Resultado
  - Análise coletiva

---

### 3. Jogo ↔ Scout

#### 3.1. Scout Individual
- **Tipo:** Um-para-Muitos
- **Características:**
  - Um jogo tem múltiplos scouts individuais (um por atleta)
  - Scout individual pertence a um jogo e um atleta
  - Dados individuais são vinculados ao jogo

#### 3.2. Scout Coletivo
- **Tipo:** Um-para-Um
- **Características:**
  - Um jogo tem um scout coletivo
  - Scout coletivo pertence a um jogo
  - Dados coletivos são vinculados ao jogo

---

### 4. Jogo ↔ Evolução

#### 4.1. Base para Evolução
- **Tipo:** Um-para-Muitos (indireto)
- **Características:**
  - Evolução do atleta é calculada a partir dos jogos
  - Cada jogo contribui para a evolução
  - Histórico de jogos forma a evolução

#### 4.2. Cálculo de Evolução
- **Agregação temporal:**
  - Jogos ao longo do tempo
  - Tendências de melhoria/declínio
  - Comparação entre períodos

---

### 5. Jogo ↔ Ranking

#### 5.1. Base para Ranking
- **Tipo:** Um-para-Muitos (indireto)
- **Características:**
  - Ranking é calculado a partir dos jogos
  - Cada jogo contribui para o ranking
  - Rankings são derivados, não armazenados

#### 5.2. Cálculo de Ranking
- **Agregação de dados:**
  - Soma de estatísticas dos jogos
  - Médias calculadas
  - Comparação entre atletas

---

### 6. Jogo ↔ Programação

#### 6.1. Jogo como Programação
- **Tipo:** Um-para-Um (especialização)
- **Características:**
  - Jogo é um tipo de programação
  - Herda atributos de programação (data, horário, local)
  - Adiciona atributos específicos (adversário, resultado, scout)

#### 6.2. Relacionamento
- **Antes do jogo:**
  - Jogo é uma programação agendada
  - Alertas e lembretes funcionam

- **Depois do jogo:**
  - Jogo tem scout registrado
  - Resultado é atualizado
  - Dados são consolidados

---

### 7. Jogo ↔ Competição/Campeonato

#### 7.1. Contexto Competitivo
- **Tipo:** Muitos-para-Um
- **Características:**
  - Um jogo pertence a uma competição (opcional)
  - Uma competição tem múltiplos jogos
  - Competição dá contexto ao jogo

#### 7.2. Dados da Competição
- **Classificação:**
  - Posição na tabela
  - Pontos conquistados
  - Jogos restantes

---

## Fluxo de Dados do Jogo

### 1. Antes do Jogo (Programação)
```
Programação (Jogo)
  ├── Data e horário agendados
  ├── Local
  ├── Adversário
  ├── Competição
  └── Atletas convocados
```

### 2. Durante o Jogo (Registro)
```
Jogo (em andamento)
  ├── Escalação (titulares)
  ├── Substituições (entradas/saídas)
  ├── Placar (atualizado em tempo real)
  └── Estatísticas parciais
```

### 3. Após o Jogo (Scout)
```
Jogo (concluído)
  ├── Resultado final
  ├── Placar final
  ├── Scout Individual (por atleta)
  ├── Scout Coletivo (equipe)
  └── Dados consolidados
      ├── Evolução (atualizada)
      └── Ranking (recalculado)
```

---

## Conexão com Scout de Jogo

### 1. Scout Individual
- **Vinculação:**
  - Scout individual pertence a um jogo
  - Scout individual pertence a um atleta
  - Um jogo tem múltiplos scouts individuais

- **Dados:**
  - Todas as estatísticas do atleta naquele jogo
  - Performance individual
  - Observações

### 2. Scout Coletivo
- **Vinculação:**
  - Scout coletivo pertence a um jogo
  - Um jogo tem um scout coletivo

- **Dados:**
  - Estatísticas da equipe como um todo
  - Performance coletiva
  - Análise tática

---

## Conexão com Evolução

### 1. Como Jogo Alimenta Evolução
- **Agregação temporal:**
  - Jogos são agregados ao longo do tempo
  - Cada jogo contribui para a evolução
  - Tendências são identificadas

### 2. Cálculo de Evolução
- **Métricas:**
  - Média de gols por jogo
  - Média de assistências
  - Tendência de melhoria/declínio
  - Comparação entre períodos

---

## Conexão com Ranking

### 1. Como Jogo Alimenta Ranking
- **Agregação de dados:**
  - Estatísticas dos jogos são somadas
  - Rankings são calculados em tempo real
  - Comparação entre atletas

### 2. Tipos de Ranking
- **Por estatística:**
  - Ranking de artilheiros (gols)
  - Ranking de assistências
  - Ranking de passes certos
  - Outros rankings

- **Por período:**
  - Ranking da temporada
  - Ranking do mês
  - Ranking dos últimos 10 jogos

---

## Diagrama: Jogo no Centro do Sistema

```
                    ┌─────────────┐
                    │   Atletas   │
                    └──────┬──────┘
                           │
                           │ participam
                           │
                    ┌──────▼──────┐
                    │    JOGO     │◄─── Programação
                    │  (Central)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐      ┌─────▼─────┐
   │  Scout  │      │  Equipe   │      │Competição│
   │Individual│      │           │      │          │
   └─────────┘      └───────────┘      └──────────┘
        │
        │
   ┌────▼────┐
   │  Scout  │
   │Coletivo │
   └─────────┘
        │
        │
   ┌────▼────┐      ┌──────────┐
   │Evolução │      │ Ranking  │
   └─────────┘      └──────────┘
```

---

## Resumo Executivo

### Jogo como Evento Central
- **Jogo é o hub** que conecta todos os dados do sistema
- **Dados são gerados** durante e após o jogo
- **Evolução e ranking** são derivados dos jogos

### Dados do Jogo
- **Básicos:** Data, horário, local, adversário, competição
- **Coletivos:** Resultado, placar, estatísticas da equipe
- **Individuais:** Scout de cada atleta, entradas/saídas

### Relacionamentos
- **Jogo ↔ Atletas:** Muitos-para-Muitos (participação)
- **Jogo ↔ Equipe:** Muitos-para-Um (representação)
- **Jogo ↔ Scout:** Um-para-Muitos (individual) e Um-para-Um (coletivo)
- **Jogo ↔ Evolução:** Base para cálculo (indireto)
- **Jogo ↔ Ranking:** Base para cálculo (indireto)
- **Jogo ↔ Programação:** Um-para-Um (especialização)
- **Jogo ↔ Competição:** Muitos-para-Um (contexto)

### Fluxo
1. **Antes:** Jogo é programado
2. **Durante:** Jogo acontece, dados são registrados
3. **Depois:** Scout é registrado, evolução e ranking são atualizados

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO - "Scout de Jogo"

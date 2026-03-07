# PROMPT 3 — ESTRUTURA DE GESTÃO DE EQUIPE

## Objetivo
Definir a estrutura lógica de dados necessária para suportar "Gestão de Equipe" e "Monte sua equipe", conforme prometido na landing page.

---

## Contexto da Landing Page

### Promessas Relacionadas
- "Cadastro completo de atletas, comissão técnica e histórico"
- "Monte sua equipe - Adicione atletas e comissão"
- "Falta de histórico completo dos atletas" (problema que resolvemos)
- "Equipes adultas e de base que buscam profissionalização"

---

## Estrutura Lógica de Gestão de Equipe

### 1. Cadastro Completo de Atletas

#### 1.1. Dados Básicos do Atleta
- **Identificação:**
  - Nome completo
  - Apelido/Nickname
  - Data de nascimento
  - CPF (opcional, para dados sensíveis)
  - Foto

- **Características Físicas:**
  - Altura
  - Peso
  - Posição (Goleiro, Fixo, Ala, Pivô, etc.)
  - Pé dominante (Destro, Canhoto, Ambidestro)
  - Número da camisa

- **Dados Profissionais:**
  - Último clube
  - Data de transferência
  - Status de transferência
  - Salário (dados sensíveis - protegidos)
  - Data início/fim de contrato

#### 1.2. Histórico Completo do Atleta
- **Histórico de Equipes:**
  - Equipes que já pertenceu
  - Período em cada equipe
  - Tipo de equipe (adulta, base, universitária)
  - Status (ativo, inativo, transferido)

- **Histórico de Performance:**
  - Todas as partidas jogadas
  - Todas as estatísticas registradas
  - Evolução ao longo do tempo
  - Tendências de melhoria/declínio

- **Histórico de Avaliações:**
  - Avaliações físicas
  - Avaliações técnicas
  - Datas de cada avaliação
  - Comparação temporal

#### 1.3. Relacionamento com Equipes
- Um atleta pode pertencer a **múltiplas equipes simultaneamente**
  - Exemplo: Atleta na equipe adulta E na equipe de base
- Um atleta pode ter **histórico de múltiplas equipes ao longo do tempo**
  - Exemplo: Começou na base, subiu para adulta
- Cada relacionamento tem:
  - Data de início
  - Data de fim (se aplicável)
  - Status atual
  - Tipo de equipe

---

### 2. Estrutura para Comissão Técnica

#### 2.1. Dados da Comissão Técnica
- **Identificação:**
  - Nome completo
  - Email (para login)
  - Foto
  - Função/Cargo (Treinador, Preparador Físico, Supervisor, Diretor, etc.)

- **Relacionamento com Equipes:**
  - Equipes que gerencia
  - Data de início em cada equipe
  - Permissões por equipe
  - Status (ativo, inativo)

#### 2.2. Usuários do Sistema
- **Conta de Acesso:**
  - Email (único)
  - Senha (hash)
  - Role/Papel no sistema
  - Status da conta

- **Permissões:**
  - Acesso a quais equipes
  - Nível de permissão (criar, editar, apenas visualizar)
  - Acesso a dados sensíveis (salários, etc.)

---

### 3. Histórico de Equipe

#### 3.1. Estrutura de Histórico
- **Temporadas:**
  - Cada equipe tem temporadas
  - Temporada tem data de início e fim
  - Atletas podem estar em diferentes temporadas
  - Histórico é mantido por temporada

- **Mudanças de Equipe:**
  - Atleta entrando na equipe
  - Atleta saindo da equipe
  - Atleta mudando de equipe (dentro do mesmo clube)
  - Data de cada mudança
  - Motivo (opcional)

#### 3.2. Histórico Completo
- **Nada é perdido:**
  - Todos os dados são mantidos
  - Soft delete (marcação de inativo)
  - Histórico completo de todas as ações
  - Auditoria de mudanças

---

### 4. Suporte a Times Adultos e de Base

#### 4.1. Tipos de Equipe
- **Equipe Adulta:**
  - Categoria principal
  - Atletas profissionais ou semi-profissionais
  - Competições principais

- **Equipe de Base:**
  - Categorias de formação
  - Atletas em desenvolvimento
  - Competições de base

- **Time Universitário:**
  - Projetos acadêmicos
  - Competições universitárias

#### 4.2. Relacionamento entre Tipos
- Um atleta pode estar em **múltiplas categorias simultaneamente**
  - Exemplo: Joga na adulta E na base
- Um atleta pode **evoluir de base para adulta**
  - Histórico é mantido
  - Dados são preservados

---

## Mapa Conceitual de Gestão de Equipe

### Hierarquia Organizacional
```
Clube
  ├── Equipe Adulta
  │   ├── Atletas (ativos)
  │   ├── Comissão Técnica
  │   └── Histórico de Temporadas
  │
  ├── Equipe de Base
  │   ├── Atletas (ativos)
  │   ├── Comissão Técnica
  │   └── Histórico de Temporadas
  │
  └── Time Universitário
      ├── Atletas (ativos)
      ├── Comissão Técnica
      └── Histórico de Temporadas
```

### Relacionamentos Temporais
```
Atleta
  ├── Equipe Atual (ativa)
  ├── Equipes Anteriores (histórico)
  └── Evolução Temporal
      ├── Temporada 2024
      ├── Temporada 2025
      └── Temporada 2026
```

---

## Relacionamentos Conceituais

### Clube ↔ Equipe
- **Tipo:** Um-para-Muitos
- **Características:**
  - Um clube tem múltiplas equipes
  - Uma equipe pertence a um clube
  - Equipe pode ser independente (sem clube) - caso especial

### Equipe ↔ Atleta
- **Tipo:** Muitos-para-Muitos
- **Características:**
  - Uma equipe tem múltiplos atletas
  - Um atleta pode estar em múltiplas equipes
  - Relacionamento tem data de início/fim
  - Relacionamento tem status (ativo, inativo)

### Equipe ↔ Comissão Técnica
- **Tipo:** Muitos-para-Muitos
- **Características:**
  - Uma equipe tem múltiplos técnicos
  - Um técnico pode gerenciar múltiplas equipes
  - Relacionamento tem permissões específicas
  - Relacionamento tem data de início/fim

### Atleta ↔ Histórico
- **Tipo:** Um-para-Muitos
- **Características:**
  - Um atleta tem múltiplos registros históricos
  - Histórico inclui: equipes, partidas, avaliações, estatísticas
  - Histórico é temporal (ordenado por data)
  - Nada é deletado, apenas marcado como inativo

---

## Casos de Uso Específicos

### Caso 1: Técnico com Múltiplas Equipes
- **Cenário:** Um técnico gerencia equipe adulta E equipe de base
- **Estrutura necessária:**
  - Técnico tem relacionamento com múltiplas equipes
  - Acesso aos dados de todas as equipes que gerencia
  - Criação de dados para qualquer equipe que gerencia
  - Visualização consolidada ou separada por equipe

### Caso 2: Equipe Mudando de Temporada
- **Cenário:** Nova temporada começa, alguns atletas saem, outros entram
- **Estrutura necessária:**
  - Temporada como conceito temporal
  - Atletas podem ter data de fim na equipe
  - Novos atletas podem entrar
  - Histórico de todas as temporadas é mantido
  - Dados de temporadas anteriores não são perdidos

### Caso 3: Atleta com Histórico Completo
- **Cenário:** Atleta começou na base, subiu para adulta, depois transferiu
- **Estrutura necessária:**
  - Histórico de todas as equipes que pertenceu
  - Histórico de todas as partidas jogadas
  - Histórico de todas as avaliações
  - Evolução ao longo do tempo
  - Comparação entre períodos

### Caso 4: Atleta em Múltiplas Equipes Simultaneamente
- **Cenário:** Atleta joga na adulta E na base (dependendo da competição)
- **Estrutura necessária:**
  - Atleta pode ter relacionamento ativo com múltiplas equipes
  - Dados de scout são separados por equipe
  - Histórico é mantido por equipe
  - Rankings podem ser por equipe ou consolidados

---

## Estrutura de Histórico

### Princípios
1. **Nada é deletado fisicamente**
   - Soft delete (marcação de inativo)
   - Histórico completo é mantido
   - Solução para "Falta de histórico completo dos atletas"

2. **Temporalidade é preservada**
   - Todas as ações têm timestamp
   - Histórico é ordenado temporalmente
   - Comparação entre períodos é possível

3. **Rastreabilidade completa**
   - Quem criou/alterou cada dado
   - Quando foi criado/alterado
   - O que foi alterado (auditoria)

### Estrutura de Dados Temporais
- **Timestamps em tudo:**
  - createdAt: Quando foi criado
  - updatedAt: Quando foi atualizado
  - deletedAt: Quando foi marcado como inativo (soft delete)

- **Relacionamentos temporais:**
  - Data de início do relacionamento
  - Data de fim do relacionamento (se aplicável)
  - Status atual do relacionamento

---

## Diagrama de Relacionamentos Temporais

### Evolução de um Atleta
```
Atleta: João Silva
  ├── 2024 - Equipe de Base
  │   ├── 15 partidas
  │   ├── 3 avaliações físicas
  │   └── Estatísticas acumuladas
  │
  ├── 2025 - Equipe Adulta
  │   ├── 25 partidas
  │   ├── 4 avaliações físicas
  │   └── Estatísticas acumuladas
  │
  └── 2026 - Equipe Adulta (atual)
      ├── 10 partidas (até agora)
      ├── 2 avaliações físicas
      └── Estatísticas acumuladas
```

### Mudança de Equipe
```
Atleta: Maria Santos
  ├── 2024-01-01 → 2024-12-31: Equipe de Base
  │   └── Status: Transferida
  │
  └── 2025-01-01 → presente: Equipe Adulta
      └── Status: Ativa
```

---

## Resumo Executivo

### Estrutura Lógica Necessária

1. **Cadastro Completo de Atletas:**
   - Dados básicos, físicos, profissionais
   - Histórico completo
   - Relacionamento com múltiplas equipes

2. **Comissão Técnica:**
   - Dados dos técnicos
   - Relacionamento com equipes
   - Permissões e acesso

3. **Histórico de Equipe:**
   - Temporadas
   - Mudanças de atletas
   - Nada é perdido

4. **Suporte a Múltiplos Tipos:**
   - Equipes adultas, de base, universitárias
   - Atletas em múltiplas categorias
   - Evolução entre categorias

### Relacionamentos Principais

- **Clube ↔ Equipe:** Um-para-Muitos
- **Equipe ↔ Atleta:** Muitos-para-Muitos (com temporalidade)
- **Equipe ↔ Comissão Técnica:** Muitos-para-Muitos (com permissões)
- **Atleta ↔ Histórico:** Um-para-Muitos (temporal)

### Princípios Fundamentais

- **Histórico completo:** Nada é perdido
- **Temporalidade:** Tudo tem timestamp
- **Flexibilidade:** Atleta em múltiplas equipes
- **Rastreabilidade:** Auditoria completa

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO - "Gestão de Equipe" e "Monte sua equipe"

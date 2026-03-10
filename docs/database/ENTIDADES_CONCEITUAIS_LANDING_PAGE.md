# Entidades Conceituais do Banco de Dados
## Baseado na Análise da Landing Page do SCOUT21

---

## 📋 RESUMO EXECUTIVO

Este documento lista todas as **entidades conceituais** que PRECISAM existir no banco de dados do SCOUT21, baseado exclusivamente no conteúdo prometido na landing page. O objetivo é garantir que o banco de dados represente fielmente o que o produto promete.

---

## 🎯 PILARES CENTRAIS (Conforme Landing Page)

1. **Gestão de Equipe**
2. **Programação**
3. **Scout de Jogo**
4. **Evolução e Ranking**
5. **Performance baseada em dados**
6. **Uso contínuo por clubes, equipes e técnicos**

---

## 📊 ENTIDADES CONCEITUAIS POR CATEGORIA

### 1. GESTÃO DE EQUIPE

#### 1.1. Organização Hierárquica
- **Clube** (Clubes de Futsal)
  - Entidade raiz do sistema
  - Suporta clubes pequenos e médios do Brasil
  - Pode ter múltiplas equipes (adultas e de base)

- **Equipe**
  - Equipes adultas
  - Equipes de base
  - Times universitários
  - Pode pertencer a um clube ou ser independente

#### 1.2. Pessoas
- **Atleta**
  - Cadastro completo
  - Histórico completo (mencionado como solução para "Falta de histórico completo dos atletas")
  - Pode pertencer a uma ou mais equipes
  - Evolução ao longo do tempo

- **Comissão Técnica**
  - Treinadores
  - Membros da comissão técnica
  - Usuários do sistema (comissões técnicas que querem dados organizados)

- **Usuário**
  - Contas de acesso ao sistema
  - Treinadores
  - Membros da comissão técnica
  - Administradores do clube

---

### 2. PROGRAMAÇÃO

#### 2.1. Eventos e Atividades
- **Programação**
  - Treinos
  - Jogos
  - Convocações
  - Organização em um só lugar (promessa da landing page)

- **Treino**
  - Tipo específico de programação
  - Data, horário, local
  - Participantes (atletas, comissão)

- **Jogo/Partida**
  - Tipo específico de programação
  - Data, horário, local
  - Adversário
  - Resultado
  - Relacionado com Scout de Jogo

- **Convocações**
  - Tipo específico de programação
  - Lista de atletas convocados
  - Data/horário do evento

---

### 3. SCOUT DE JOGO

#### 3.1. Registro de Partidas
- **Jogo/Partida** (já mencionado em Programação, mas com foco diferente aqui)
  - Dados coletivos da partida
  - Dados individuais de cada atleta
  - Resultado (vitória, derrota, empate)
  - Adversário
  - Competição/Campeonato

#### 3.2. Dados de Scout
- **Scout Individual**
  - Dados individuais de cada atleta por partida
  - Métricas de performance
  - Relacionado com "Registre dados individuais e coletivos de cada partida"

- **Scout Coletivo**
  - Dados coletivos da equipe por partida
  - Estatísticas do time como um todo

#### 3.3. Métricas e Indicadores
- **Indicadores de Performance**
  - Base para "Análises baseadas em dados para decisões vencedoras"
  - Transformar dados em insights poderosos
  - KPIs mencionados no DNA do idealizador

- **Estatísticas**
  - Dados brutos coletados
  - Base para análises e rankings

---

### 4. EVOLUÇÃO E RANKING

#### 4.1. Acompanhamento de Evolução
- **Histórico de Performance**
  - Evolução ao longo do tempo
  - Solução para "Dificuldade em acompanhar evolução real"
  - Dados históricos de cada atleta

- **Evolução do Atleta**
  - Comparação temporal
  - Tendências de melhoria/declínio
  - Base para decisões técnicas

#### 4.2. Comparação e Ranking
- **Ranking**
  - Comparação entre atletas
  - "Acompanhe performance e compare atletas com dados reais"
  - Rankings por diferentes métricas

- **Comparação de Performance**
  - Comparar atletas entre si
  - Comparar equipes
  - Comparar períodos temporais

---

### 5. PERFORMANCE BASEADA EM DADOS

#### 5.1. Análises e Insights
- **Análise de Performance**
  - "Análises baseadas em dados para decisões vencedoras"
  - Insights poderosos para o dia a dia do clube
  - Transformar dados brutos em insights (mencionado no DNA: "20.000 linhas de excel em insights poderosos")

- **Indicadores**
  - KPIs (mencionado no DNA do idealizador)
  - Métricas de alta performance
  - Metodologia corporativa aplicada ao esporte

#### 5.2. Avaliações
- **Avaliação**
  - Solução para "Avaliações subjetivas sem base de dados"
  - Avaliações baseadas em dados objetivos
  - Histórico de avaliações

- **Avaliação Física**
  - Métricas físicas dos atletas
  - Evolução física ao longo do tempo

---

### 6. COMPETIÇÕES E CAMPEONATOS

#### 6.1. Competições
- **Campeonato**
  - Competições que a equipe participa
  - Contexto para os jogos

- **Competição**
  - Campeonato Estadual
  - Copa Regional
  - Liga Local
  - Supercopa Regional
  - Taça Cidade
  - Torneio Municipal

#### 6.2. Partidas em Competições
- **Partida de Campeonato**
  - Jogos dentro de competições
  - Relacionado com Scout de Jogo
  - Resultados e classificação

---

### 7. GESTÃO TÉCNICA E DECISÕES

#### 7.1. Decisões Técnicas
- **Decisão Técnica**
  - "Base sólida para escolhas técnicas"
  - Decisões baseadas em dados
  - Histórico de decisões

#### 7.2. Metas e Objetivos
- **Meta de Performance**
  - Metas para atletas
  - Metas para equipe
  - Acompanhamento de cumprimento

- **Objetivo**
  - Objetivos da equipe
  - Objetivos individuais dos atletas

---

### 8. DADOS E HISTÓRICO

#### 8.1. Armazenamento de Dados
- **Histórico Completo**
  - Solução para "Falta de histórico completo dos atletas"
  - Histórico de todas as atividades
  - Dados não perdidos (solução para "Planilhas desorganizadas e dados perdidos")

#### 8.2. Dados Temporais
- **Período/Temporada**
  - Organização temporal dos dados
  - Comparação entre temporadas
  - Evolução ao longo das temporadas

---

## 🔗 RELACIONAMENTOS CONCEITUAIS ESSENCIAIS

### Hierarquia Organizacional
```
Clube
  └── Equipe(s)
      ├── Atletas
      ├── Comissão Técnica
      └── Programações
          ├── Treinos
          ├── Jogos
          └── Convocações
```

### Fluxo de Dados
```
Jogo
  ├── Scout Individual (por Atleta)
  ├── Scout Coletivo (Equipe)
  └── Resultado
      └── Análise de Performance
          └── Ranking
              └── Evolução
                  └── Decisões Técnicas
```

### Contexto Competitivo
```
Campeonato/Competição
  └── Partidas
      └── Scout de Jogo
          └── Estatísticas
              └── Ranking
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Gestão de Equipe
- [ ] Clube pode ter múltiplas equipes
- [ ] Equipe pode ter múltiplos atletas
- [ ] Atleta pode ter histórico completo
- [ ] Comissão técnica pode ser cadastrada
- [ ] Usuários podem acessar o sistema

### Programação
- [ ] Treinos podem ser programados
- [ ] Jogos podem ser programados
- [ ] Convocações podem ser criadas
- [ ] Tudo organizado em um só lugar

### Scout de Jogo
- [ ] Dados individuais podem ser registrados por partida
- [ ] Dados coletivos podem ser registrados por partida
- [ ] Estatísticas podem ser calculadas

### Evolução e Ranking
- [ ] Evolução do atleta pode ser acompanhada ao longo do tempo
- [ ] Atletas podem ser comparados entre si
- [ ] Rankings podem ser gerados

### Performance baseada em dados
- [ ] Análises podem ser geradas
- [ ] Indicadores podem ser calculados
- [ ] Avaliações podem ser baseadas em dados objetivos

### Uso contínuo
- [ ] Dados não são perdidos
- [ ] Histórico completo é mantido
- [ ] Sistema suporta uso diário do clube

---

## 🎯 CONCEITOS ADICIONAIS (Implícitos na Landing Page)

### Personalização
- **Configuração do Clube**
  - "Personalizável conforme a realidade do seu clube"
  - Cada clube pode ter suas próprias configurações

### Multi-tenancy
- **Isolamento de Dados**
  - Cada clube/equipe tem seus próprios dados
  - Dados não se misturam entre clubes

### Foco em Futsal
- **Esporte Específico**
  - "Foco exclusivo em esportes de quadra (futsal)"
  - Métricas e indicadores específicos para futsal

---

## 📝 NOTAS IMPORTANTES

1. **Não criar tabelas ainda**: Este documento lista apenas as entidades conceituais, não a estrutura física do banco.

2. **Baseado exclusivamente na landing page**: Todas as entidades listadas têm fundamento direto no texto da landing page.

3. **Foco nos pilares**: As entidades estão organizadas pelos 6 pilares centrais mencionados.

4. **Relacionamentos conceituais**: Os relacionamentos mostram como as entidades se conectam logicamente.

5. **Validação futura**: O checklist serve para validar se o banco de dados implementado cobre todos os conceitos prometidos.

---

## 🚀 PRÓXIMOS PASSOS

1. Validar se o banco de dados atual cobre todas essas entidades
2. Identificar entidades faltantes
3. Projetar estrutura de tabelas (se necessário)
4. Garantir que os relacionamentos estejam corretos
5. Validar que o sistema suporta todos os casos de uso prometidos

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21 (branch `landingPage`)

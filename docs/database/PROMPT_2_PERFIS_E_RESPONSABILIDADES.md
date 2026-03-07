# PROMPT 2 — PERFIS DE USO E RESPONSABILIDADE DOS DADOS

## Objetivo
Definir quem cria, quem vê e quem é dono dos dados no SCOUT21PRO, baseado no fluxo "Crie sua conta → Monte sua equipe → Registre jogos" da landing page.

---

## Fluxo Principal da Landing Page

Conforme a seção "Como Funciona":
1. **Crie sua conta** - Cadastro rápido e gratuito
2. **Monte sua equipe** - Adicione atletas e comissão
3. **Registre jogos** - Scout simples e eficiente
4. **Acompanhe evolução** - Dados e ranking em tempo real
5. **Tome decisões** - Base sólida para escolhas técnicas

---

## Perfis de Uso Identificados

### 1. Clube
- **Descrição:** Entidade organizacional raiz
- **Responsabilidade:** Dono dos dados da organização
- **Características:**
  - Pode ter múltiplas equipes (adultas e de base)
  - Representa a organização esportiva
  - Pode ter múltiplos usuários associados

### 2. Técnico / Comissão Técnica
- **Descrição:** Usuários ativos do sistema que criam e gerenciam dados
- **Responsabilidade:** Criadores e gestores principais dos dados operacionais
- **Características:**
  - Treinadores que querem dados organizados para decisões
  - Podem ter acesso a múltiplas equipes (se técnico de várias equipes)
  - Criadores de programações, scout, avaliações
  - Visualizadores de análises e rankings

### 3. Atleta (Dados Passivos)
- **Descrição:** Sujeito dos dados, não cria dados diretamente
- **Responsabilidade:** Objeto de registro, não agente ativo
- **Características:**
  - Dados são criados SOBRE ele, não POR ele
  - Histórico completo é mantido
  - Performance é registrada e analisada
  - Pode ter acesso limitado para visualizar próprios dados (futuro)

### 4. Sistema (Automático)
- **Descrição:** Processos automáticos que geram dados derivados
- **Responsabilidade:** Cálculos, rankings, alertas, análises
- **Características:**
  - Gera rankings a partir de dados acumulados
  - Calcula evoluções e tendências
  - Cria alertas de programação
  - Não cria dados primários, apenas deriva

---

## Hierarquia de Dados

```
Conta (Usuário)
  └── Clube (Organização)
      └── Equipe(s)
          ├── Atletas (Dados passivos)
          ├── Comissão Técnica (Usuários ativos)
          └── Dados Operacionais
              ├── Programações
              ├── Jogos
              ├── Scout
              └── Avaliações
```

### Explicação da Hierarquia

1. **Conta (Usuário):** Ponto de entrada no sistema
   - Um usuário pode pertencer a um clube
   - Um usuário pode ser técnico de múltiplas equipes
   - Autenticação e autorização começam aqui

2. **Clube:** Organização esportiva
   - Dono dos dados da organização
   - Pode ter múltiplas equipes
   - Isolamento de dados (multi-tenancy)

3. **Equipe:** Unidade operacional
   - Pertence a um clube
   - Tem atletas associados
   - Tem comissão técnica associada
   - Tem programações, jogos, scout

4. **Atletas:** Dados passivos
   - Pertencem a uma ou mais equipes
   - Histórico completo é mantido
   - Dados são criados SOBRE eles

5. **Comissão Técnica:** Usuários ativos
   - Criadores de dados operacionais
   - Visualizadores de análises
   - Podem ter acesso a múltiplas equipes

---

## Matriz de Responsabilidades (CRUD)

### Legenda
- **C** = Create (Criar)
- **R** = Read (Ler/Visualizar)
- **U** = Update (Atualizar)
- **D** = Delete (Deletar)
- **X** = Não tem acesso
- **O** = Owner (Dono - acesso total)

### Clube

| Entidade | Create | Read | Update | Delete | Observações |
|----------|--------|------|--------|--------|------------|
| Clube | O | O | O | O | Dono da organização |
| Equipe | O | O | O | O | Pode criar múltiplas equipes |
| Atleta | O | O | O | O | Através de técnicos |
| Comissão Técnica | O | O | O | O | Gerencia usuários |
| Programação | O | O | O | O | Através de técnicos |
| Jogo | O | O | O | O | Através de técnicos |
| Scout | O | O | O | O | Através de técnicos |
| Avaliação | O | O | O | O | Através de técnicos |
| Ranking | X | O | X | X | Gerado automaticamente |
| Análises | X | O | X | X | Gerado automaticamente |

### Técnico / Comissão Técnica

| Entidade | Create | Read | Update | Delete | Observações |
|----------|--------|------|--------|--------|------------|
| Clube | X | R | X | X | Apenas visualização |
| Equipe | C | R | U | D | Das equipes que gerencia |
| Atleta | C | R | U | D | Dos atletas das suas equipes |
| Comissão Técnica | X | R | X | X | Visualização própria |
| Programação | C | R | U | D | Das suas equipes |
| Jogo | C | R | U | D | Das suas equipes |
| Scout | C | R | U | D | Dos jogos das suas equipes |
| Avaliação | C | R | U | D | Dos atletas das suas equipes |
| Ranking | X | R | X | X | Visualização apenas |
| Análises | X | R | X | X | Visualização apenas |

### Atleta (Dados Passivos)

| Entidade | Create | Read | Update | Delete | Observações |
|----------|--------|------|--------|--------|------------|
| Clube | X | X | X | X | Sem acesso |
| Equipe | X | R | X | X | Apenas equipes que pertence |
| Atleta | X | R | X | X | Apenas próprios dados (futuro) |
| Comissão Técnica | X | X | X | X | Sem acesso |
| Programação | X | R | X | X | Apenas programações que participa |
| Jogo | X | R | X | X | Apenas jogos que participou |
| Scout | X | R | X | X | Apenas próprio scout (futuro) |
| Avaliação | X | R | X | X | Apenas próprias avaliações (futuro) |
| Ranking | X | R | X | X | Visualização geral (futuro) |
| Análises | X | R | X | X | Visualização própria (futuro) |

### Sistema (Automático)

| Entidade | Create | Read | Update | Delete | Observações |
|----------|--------|------|--------|--------|------------|
| Clube | X | R | X | X | Para cálculos |
| Equipe | X | R | X | X | Para cálculos |
| Atleta | X | R | X | X | Para cálculos |
| Comissão Técnica | X | R | X | X | Para cálculos |
| Programação | X | R | X | X | Para alertas |
| Jogo | X | R | X | X | Para cálculos |
| Scout | X | R | X | X | Para cálculos |
| Avaliação | X | R | X | X | Para cálculos |
| Ranking | C | R | X | X | Gera rankings derivados |
| Análises | C | R | X | X | Gera análises derivadas |

---

## Ownership (Quem é Dono de Cada Dado)

### Dados Primários (Criados por Usuários)

1. **Clube**
   - **Owner:** Usuário que criou a conta do clube
   - **Acesso:** Todos os membros da comissão técnica do clube

2. **Equipe**
   - **Owner:** Clube
   - **Acesso:** Técnicos associados à equipe

3. **Atleta**
   - **Owner:** Equipe (através do técnico)
   - **Acesso:** Técnicos da equipe, atleta (próprios dados - futuro)

4. **Comissão Técnica (Usuários)**
   - **Owner:** Clube
   - **Acesso:** Próprio usuário, outros membros da comissão (visualização)

5. **Programação**
   - **Owner:** Técnico que criou
   - **Acesso:** Técnicos da equipe, atletas convocados (visualização)

6. **Jogo**
   - **Owner:** Técnico que criou
   - **Acesso:** Técnicos da equipe, atletas que participaram (visualização)

7. **Scout**
   - **Owner:** Técnico que registrou
   - **Acesso:** Técnicos da equipe, atleta (próprio scout - futuro)

8. **Avaliação**
   - **Owner:** Técnico que criou
   - **Acesso:** Técnicos da equipe, atleta (própria avaliação - futuro)

### Dados Derivados (Gerados pelo Sistema)

1. **Ranking**
   - **Owner:** Sistema (automático)
   - **Acesso:** Todos os técnicos da equipe/clube
   - **Observação:** Não é entidade fixa, é calculado em tempo real

2. **Análises**
   - **Owner:** Sistema (automático)
   - **Acesso:** Todos os técnicos da equipe/clube
   - **Observação:** Derivado dos dados primários

3. **Evolução**
   - **Owner:** Sistema (automático)
   - **Acesso:** Técnicos da equipe, atleta (própria evolução - futuro)
   - **Observação:** Calculado a partir do histórico

---

## Casos de Uso Específicos

### Caso 1: Técnico com Múltiplas Equipes
- Um técnico pode ser responsável por várias equipes do mesmo clube
- Acesso a dados de todas as equipes que gerencia
- Criação de dados para qualquer equipe que gerencia
- Visualização de rankings e análises de todas as equipes

### Caso 2: Atleta em Múltiplas Equipes
- Um atleta pode pertencer a várias equipes (ex: adulta e base)
- Dados de scout são separados por equipe
- Histórico completo é mantido
- Evolução pode ser vista por equipe ou consolidada

### Caso 3: Múltiplos Técnicos na Mesma Equipe
- Vários técnicos podem gerenciar a mesma equipe
- Todos têm acesso completo aos dados da equipe
- Criação e edição são compartilhadas
- Histórico de quem criou/alterou pode ser mantido (auditoria)

### Caso 4: Sistema Gerando Alertas
- Sistema lê programações
- Gera alertas automáticos
- Não cria dados primários
- Apenas notifica usuários

---

## Princípios de Isolamento de Dados

### Multi-Tenancy por Clube
- Cada clube tem isolamento completo de dados
- Técnico de um clube não vê dados de outro clube
- Atleta de um clube não vê dados de outro clube
- Rankings e análises são isolados por clube

### Isolamento por Equipe (Opcional)
- Dados podem ser isolados por equipe dentro do mesmo clube
- Técnico vê apenas equipes que gerencia
- Atleta vê apenas dados das equipes que pertence
- Rankings podem ser por equipe ou consolidados

---

## Regras de Negócio Importantes

1. **Dados não são deletados fisicamente**
   - Soft delete (marcação de inativo)
   - Histórico completo é mantido
   - Solução para "Planilhas desorganizadas e dados perdidos"

2. **Atleta não cria dados sobre si mesmo**
   - Dados são criados pelos técnicos
   - Atleta é objeto de registro, não agente
   - Futuro: atleta pode visualizar próprios dados

3. **Ranking não é entidade fixa**
   - Calculado em tempo real
   - Derivado dos dados de scout
   - Não é armazenado, apenas calculado

4. **Sistema não cria dados primários**
   - Apenas deriva dados
   - Não interfere em dados criados por usuários
   - Apenas calcula e apresenta

---

## Resumo Executivo

### Quem Cria
- **Técnicos/Comissão Técnica:** Criadores principais de todos os dados operacionais
- **Clube:** Cria estrutura organizacional (equipes, usuários)
- **Sistema:** Apenas dados derivados (rankings, análises)

### Quem Vê
- **Técnicos:** Acesso completo aos dados das equipes que gerencia
- **Clube:** Acesso a todos os dados da organização
- **Atletas:** Acesso limitado aos próprios dados (futuro)
- **Sistema:** Acesso de leitura para cálculos

### Quem é Dono
- **Clube:** Dono de toda a estrutura organizacional
- **Técnico:** Dono dos dados que cria (programações, scout, etc.)
- **Sistema:** Dono dos dados derivados (rankings, análises)

### Hierarquia
```
Conta → Clube → Equipe → Dados Operacionais
```

---

**Documento criado em:** 2026-01-09  
**Baseado em:** Landing Page do SCOUT21PRO e fluxo "Como Funciona"

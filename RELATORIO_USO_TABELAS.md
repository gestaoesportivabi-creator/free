# Relatório de Uso de Tabelas do Banco de Dados

**Data:** 2024  
**Objetivo:** Identificar todas as tabelas do banco de dados e verificar se estão sendo utilizadas no código

---

## Resumo Executivo

- **Total de Tabelas:** 24
- **Tabelas em Uso:** 18 (75%)
- **Tabelas Parcialmente Usadas:** 1 (4%)
- **Tabelas Não Usadas:** 5 (21%)

---

## 1. Tabelas de Autenticação e Usuários

### ✅ `roles` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/controllers/auth.controller.ts` - Busca roles durante registro
- **Operações:** READ
- **Recomendação:** ✅ Manter

### ✅ `users` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/controllers/auth.controller.ts` - Criação e autenticação de usuários
  - `backend/src/middleware/auth.middleware.ts` - Validação de JWT e busca de usuário
- **Operações:** CREATE, READ
- **Recomendação:** ✅ Manter

### ✅ `tecnicos` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/controllers/auth.controller.ts` - Criação automática durante registro
  - `backend/src/middleware/tenant.middleware.ts` - Identificação de tenant
- **Operações:** CREATE, READ
- **Recomendação:** ✅ Manter

### ✅ `clubes` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/controllers/auth.controller.ts` - Criação automática durante registro
  - `backend/src/middleware/tenant.middleware.ts` - Identificação de tenant
- **Operações:** CREATE, READ
- **Recomendação:** ✅ Manter

---

## 2. Tabelas de Gestão de Equipes

### ✅ `equipes` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/middleware/tenant.middleware.ts` - Identificação de equipes do tenant
- **Operações:** READ (implícito através de tenant)
- **Recomendação:** ✅ Manter

### ✅ `jogadores` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/players.repository.ts` - CRUD completo
  - `backend/src/repositories/assessments.repository.ts` - Filtro por jogadores
  - `backend/src/repositories/lesoes.repository.ts` - Filtro por jogadores
  - `backend/src/repositories/matches.repository.ts` - Estatísticas de jogadores
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

### ⚠️ `equipes_jogadores` - **PARCIALMENTE USADA**
- **Status:** Usada apenas para LEITURA, não há código que CRIA registros
- **Localização do Código:**
  - `backend/src/repositories/players.repository.ts` - Usada para filtrar jogadores por equipe (linhas 43-48, 67-71)
- **Operações:** READ apenas
- **Problema Identificado:** 
  - Quando um jogador é criado, ele não é automaticamente vinculado a uma equipe
  - A query filtra jogadores por equipe, mas se não houver registro em `equipes_jogadores`, o jogador não aparecerá
- **Recomendação:** ⚠️ **IMPLEMENTAR LÓGICA DE VINCULAÇÃO**
  - Adicionar lógica no `players.service.ts` ou `players.controller.ts` para criar registro em `equipes_jogadores` quando um jogador é criado
  - Ou criar endpoint específico para vincular/desvincular jogadores de equipes
  - Considerar vincular automaticamente à primeira equipe do técnico/clube

---

## 3. Tabelas de Jogos e Estatísticas

### ✅ `jogos` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/matches.repository.ts` - CRUD completo
  - `backend/src/repositories/timeControls.repository.ts` - Eventos de jogo
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

### ✅ `jogos_estatisticas_equipe` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/matches.repository.ts` - Criação e busca de estatísticas
- **Operações:** CREATE, READ, UPDATE
- **Recomendação:** ✅ Manter

### ✅ `jogos_estatisticas_jogador` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/matches.repository.ts` - Criação e busca de estatísticas
- **Operações:** CREATE, READ, UPDATE
- **Recomendação:** ✅ Manter

### ✅ `jogos_eventos` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/timeControls.repository.ts` - Criação e busca de eventos (entrada/saída de jogadores)
- **Operações:** CREATE, READ
- **Recomendação:** ✅ Manter

---

## 4. Tabelas de Avaliações e Lesões

### ✅ `avaliacoes_fisicas` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/assessments.repository.ts` - CRUD completo
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

### ✅ `lesoes` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/lesoes.repository.ts` - Busca por jogador
- **Operações:** READ (implícito através de jogadores)
- **Recomendação:** ✅ Manter

---

## 5. Tabelas de Programação

### ✅ `programacoes` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/schedules.repository.ts` - CRUD completo
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

### ✅ `programacoes_dias` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/schedules.repository.ts` - CRUD completo (incluído em programações)
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

---

## 6. Tabelas de Competições

### ✅ `competicoes` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/competitions.repository.ts` - CRUD completo
- **Operações:** CREATE, READ
- **Recomendação:** ✅ Manter

### ✅ `campeonatos` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/championshipMatches.repository.ts` - Busca de campeonatos
- **Operações:** READ (implícito através de campeonatos_jogos)
- **Recomendação:** ✅ Manter

### ✅ `campeonatos_jogos` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/championshipMatches.repository.ts` - CRUD completo
- **Operações:** CREATE, READ, UPDATE, DELETE
- **Recomendação:** ✅ Manter

---

## 7. Tabelas de Metas

### ✅ `metas_estatisticas` - **EM USO**
- **Status:** Totalmente implementada
- **Localização do Código:**
  - `backend/src/repositories/statTargets.repository.ts` - CRUD completo
- **Operações:** CREATE, READ, UPDATE
- **Recomendação:** ✅ Manter

---

## 8. Sistema EAV (Entity-Attribute-Value) - Registros Dinâmicos

### ❌ `categorias` - **NÃO USADA**
- **Status:** Tabela existe no banco e schema Prisma, mas não há código que a utilize
- **Localização do Código:** Nenhuma
- **Operações:** Nenhuma
- **Observações:**
  - Tabela criada no schema Prisma
  - Migration `005_add_eav_constraints_and_validation.sql` adiciona constraints
  - Frontend tem categorias hardcoded no `Sidebar.tsx` (não usa banco)
- **Recomendação:** ⚠️ **DECISÃO NECESSÁRIA**
  - **Opção 1:** Implementar sistema EAV completo (registros dinâmicos de scout)
  - **Opção 2:** Remover tabelas se não houver planos de uso
  - **Sugestão:** Se for implementar, criar endpoints para gerenciar categorias/subcategorias/campos dinamicamente

### ❌ `subcategorias` - **NÃO USADA**
- **Status:** Tabela existe no banco e schema Prisma, mas não há código que a utilize
- **Localização do Código:** Nenhuma
- **Operações:** Nenhuma
- **Observações:**
  - Relacionada com `categorias`
  - Migration `005_add_eav_constraints_and_validation.sql` adiciona constraints
- **Recomendação:** ⚠️ **DECISÃO NECESSÁRIA** (mesma de `categorias`)

### ❌ `campos` - **NÃO USADA**
- **Status:** Tabela existe no banco e schema Prisma, mas não há código que a utilize
- **Localização do Código:** Nenhuma
- **Operações:** Nenhuma
- **Observações:**
  - Relacionada com `subcategorias`
  - Constante `TIPO_CAMPO` definida em `backend/src/config/constants.ts` mas não usada
- **Recomendação:** ⚠️ **DECISÃO NECESSÁRIA** (mesma de `categorias`)

### ❌ `registros` - **NÃO USADA**
- **Status:** Tabela existe no banco e schema Prisma, mas não há código que a utilize
- **Localização do Código:** Nenhuma
- **Operações:** Nenhuma
- **Observações:**
  - Modelo tem relações com `Jogador`, `Jogo`, `Tecnico` e `Subcategoria`
  - Planejado para registros dinâmicos de scout/observações
- **Recomendação:** ⚠️ **DECISÃO NECESSÁRIA** (mesma de `categorias`)

### ❌ `registros_valores` - **NÃO USADA**
- **Status:** Tabela existe no banco e schema Prisma, mas não há código que a utilize
- **Localização do Código:** Nenhuma
- **Operações:** Nenhuma
- **Observações:**
  - Armazena valores dos campos dinâmicos de cada registro
  - Migration `005_add_eav_constraints_and_validation.sql` adiciona validações complexas
- **Recomendação:** ⚠️ **DECISÃO NECESSÁRIA** (mesma de `categorias`)

---

## Recomendações Prioritárias

### 🔴 ALTA PRIORIDADE

1. **Implementar vinculação de jogadores a equipes**
   - **Problema:** `equipes_jogadores` é usada apenas para leitura
   - **Impacto:** Jogadores criados não aparecem nas listagens porque não estão vinculados a equipes
   - **Solução:** Adicionar lógica para criar registro em `equipes_jogadores` quando um jogador é criado

### 🟡 MÉDIA PRIORIDADE

2. **Decidir sobre sistema EAV**
   - **Problema:** 5 tabelas do sistema EAV não são usadas
   - **Impacto:** Banco de dados com tabelas órfãs, possíveis confusões futuras
   - **Soluções:**
     - **Se for implementar:** Criar endpoints e lógica para gerenciar categorias/subcategorias/campos dinamicamente
     - **Se não for usar:** Remover tabelas e migrations relacionadas

### 🟢 BAIXA PRIORIDADE

3. **Documentar decisões**
   - Documentar se sistema EAV será implementado ou removido
   - Documentar lógica de vinculação de jogadores a equipes

---

## Estatísticas Finais

| Categoria | Quantidade | Percentual |
|-----------|------------|------------|
| ✅ Em Uso | 18 | 75% |
| ⚠️ Parcialmente Usada | 1 | 4% |
| ❌ Não Usada | 5 | 21% |
| **Total** | **24** | **100%** |

---

## Conclusão

O sistema está bem estruturado com a maioria das tabelas em uso. As principais ações necessárias são:

1. **Corrigir** a vinculação de jogadores a equipes (alta prioridade)
2. **Decidir** sobre o sistema EAV (média prioridade)

Todas as outras tabelas estão funcionando corretamente e sendo utilizadas pelo código.

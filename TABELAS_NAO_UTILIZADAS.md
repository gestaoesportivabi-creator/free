# Documentação: Tabelas Não Utilizadas e Sistema EAV

## Visão Geral

Este documento detalha as tabelas que não estão sendo utilizadas no código atual e fornece recomendações sobre como proceder.

---

## 1. Tabela `equipes_jogadores` - Parcialmente Usada

### Situação Atual

A tabela `equipes_jogadores` é usada apenas para **LEITURA** através do Prisma ORM. Quando o código busca jogadores, ele filtra usando a relação `equipes` que aponta para esta tabela.

### Problema Identificado

**Quando um jogador é criado, ele não é automaticamente vinculado a uma equipe.**

Isso significa que:
- Um jogador pode ser criado no banco de dados
- Mas ele não aparecerá nas listagens porque a query filtra por `equipes_jogadores`
- A query busca apenas jogadores que têm `dataFim: null` (ativos na equipe)

### Código Atual

```typescript
// backend/src/repositories/players.repository.ts
async findAll(tenantInfo: TenantInfo): Promise<JogadorDB[]> {
  return prisma.jogador.findMany({
    where: {
      equipes: {
        some: {
          equipeId: { in: equipeIds },
          dataFim: null, // Apenas jogadores ativos na equipe
        },
      },
    },
    orderBy: { nome: 'asc' },
  });
}
```

### Solução Recomendada

**Opção 1: Vincular automaticamente ao criar jogador**

Modificar `backend/src/services/players.service.ts`:

```typescript
async create(data: {...}, tenantInfo: TenantInfo): Promise<Player> {
  // Criar jogador
  const jogador = await playersRepository.create(data);
  
  // Vincular à primeira equipe do tenant
  const equipeIds = tenantInfo.equipe_ids || [];
  if (equipeIds.length > 0) {
    await prisma.equipesJogadores.create({
      data: {
        equipeId: equipeIds[0],
        jogadorId: jogador.id,
        dataInicio: new Date(),
        dataFim: null,
      },
    });
  }
  
  return transformPlayerToFrontend(jogador, [], []);
}
```

**Opção 2: Criar endpoint específico para vincular/desvincular**

Criar endpoints:
- `POST /api/players/:id/teams` - Vincular jogador a equipe
- `DELETE /api/players/:id/teams/:teamId` - Desvincular jogador de equipe

**Recomendação:** Implementar Opção 1 primeiro (mais simples) e depois considerar Opção 2 se necessário.

---

## 2. Sistema EAV (Entity-Attribute-Value)

### O que é o Sistema EAV?

O sistema EAV é um padrão de design de banco de dados que permite criar **registros dinâmicos** sem modificar o schema. É útil quando você precisa de:

- Campos customizáveis por usuário
- Diferentes tipos de dados para diferentes contextos
- Flexibilidade para adicionar novos campos sem migrations

### Estrutura do Sistema EAV no Projeto

```
categorias (ex: "Performance", "Fisiologia")
  └── subcategorias (ex: "Scout Coletivo", "Scout Individual")
      └── campos (ex: "Gols", "Assistências", "Passes Corretos")
          └── registros (observações/scout)
              └── registros_valores (valores dos campos)
```

### Tabelas do Sistema EAV

#### `categorias`
- Armazena categorias principais (ex: "Performance", "Fisiologia")
- Campos: `id`, `nome`, `descricao`, `ordem`, `created_at`

#### `subcategorias`
- Armazena subcategorias dentro de uma categoria
- Campos: `id`, `categoria_id`, `nome`, `descricao`, `ordem`, `created_at`

#### `campos`
- Armazena campos dinâmicos por subcategoria
- Campos: `id`, `subcategoria_id`, `nome`, `tipo` (INTEGER, DECIMAL, TEXT, BOOLEAN, DATE), `obrigatorio`, `valor_minimo`, `valor_maximo`, `ordem`, `created_at`

#### `registros`
- Armazena registros de scout/observações
- Campos: `id`, `jogador_id`, `tecnico_id`, `jogo_id`, `subcategoria_id`, `created_at`

#### `registros_valores`
- Armazena os valores dos campos de cada registro
- Campos: `id`, `registro_id`, `campo_id`, `valor_texto`, `valor_numero`, `valor_boolean`, `valor_data`, `created_at`

### Estado Atual

- ✅ **Schema Prisma:** Definido
- ✅ **Migrations:** Criadas (incluindo constraints complexas)
- ✅ **Constantes:** `TIPO_CAMPO` definida em `backend/src/config/constants.ts`
- ❌ **Código de Uso:** Nenhum
- ❌ **Endpoints:** Nenhum
- ❌ **Frontend:** Categorias hardcoded no `Sidebar.tsx` (não usa banco)

### Por que foi criado?

Baseado no arquivo `.cursor/plans/refatoração_backend_postgresql_a6fc8a46.plan.md`, o sistema EAV foi planejado para:

1. **Registros Dinâmicos de Scout:** Permitir que técnicos criem seus próprios campos de observação
2. **Flexibilidade:** Não precisar modificar o schema toda vez que um novo tipo de observação for necessário
3. **Extensibilidade:** Suportar diferentes tipos de scout (coletivo, individual, etc.)

### Decisão Necessária

Você precisa decidir:

#### Opção A: Implementar o Sistema EAV

**Prós:**
- Flexibilidade total para criar campos customizados
- Não precisa modificar schema para novos tipos de scout
- Permite que cada técnico/clube tenha seus próprios campos

**Contras:**
- Complexidade alta (queries mais difíceis, validações complexas)
- Performance pode ser pior (múltiplas joins)
- Mais código para manter

**O que precisa ser feito:**
1. Criar repositories para `categorias`, `subcategorias`, `campos`, `registros`, `registros_valores`
2. Criar services com lógica de negócio
3. Criar controllers e rotas
4. Criar adapters para transformar dados EAV para frontend
5. Modificar frontend para usar dados dinâmicos do banco (em vez de hardcoded)
6. Criar interface de administração para gerenciar categorias/subcategorias/campos

**Estimativa:** 2-3 semanas de desenvolvimento

#### Opção B: Remover o Sistema EAV

**Prós:**
- Código mais simples
- Melhor performance
- Menos manutenção

**Contras:**
- Perde flexibilidade para campos customizados
- Precisa modificar schema para novos tipos de scout

**O que precisa ser feito:**
1. Remover tabelas do schema Prisma
2. Criar migration para dropar as tabelas
3. Remover constantes não utilizadas
4. Remover migrations relacionadas (ou marcar como obsoletas)

**Estimativa:** 1-2 horas

### Recomendação

**Se você não tem planos imediatos de implementar o sistema EAV, recomendo REMOVER as tabelas** para manter o código limpo e evitar confusão futura.

Se no futuro precisar de campos dinâmicos, você pode:
- Criar tabelas específicas para cada tipo de scout
- Ou implementar o EAV quando realmente precisar

---

## 3. Plano de Ação Recomendado

### Fase 1: Corrigir `equipes_jogadores` (ALTA PRIORIDADE)

1. Modificar `backend/src/services/players.service.ts` para vincular jogador à equipe ao criar
2. Testar criação de jogador e verificar se aparece nas listagens
3. Considerar criar endpoint para vincular/desvincular jogadores de equipes

### Fase 2: Decidir sobre Sistema EAV (MÉDIA PRIORIDADE)

1. **Se decidir REMOVER:**
   - Criar migration para dropar tabelas
   - Remover do schema Prisma
   - Remover constantes não utilizadas
   - Documentar decisão

2. **Se decidir IMPLEMENTAR:**
   - Criar plano detalhado de implementação
   - Priorizar funcionalidades essenciais
   - Implementar em fases (categorias → subcategorias → campos → registros)

### Fase 3: Documentação (BAIXA PRIORIDADE)

1. Atualizar documentação técnica
2. Documentar decisões tomadas
3. Atualizar README se necessário

---

## 4. Checklist de Decisões

- [ ] Decidir sobre vinculação automática de jogadores a equipes
- [ ] Decidir sobre sistema EAV (implementar ou remover)
- [ ] Se remover EAV: criar migration para dropar tabelas
- [ ] Se implementar EAV: criar plano detalhado
- [ ] Documentar decisões finais

---

## 5. Referências

- **Schema Prisma:** `backend/prisma/schema.prisma` (linhas 367-442)
- **Migration EAV:** `backend/migrations/005_add_eav_constraints_and_validation.sql`
- **Constantes:** `backend/src/config/constants.ts` (linhas 26-33)
- **Plano Original:** `.cursor/plans/refatoração_backend_postgresql_a6fc8a46.plan.md`

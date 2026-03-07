# Convenções Arquiteturais - SCOUT 21 PRO Backend

## 📌 Convenção de Nomes

### Regra Oficial

- **API / Rotas / Frontend** → Inglês
  - Exemplos: `/api/players`, `players.controller.ts`, `players.service.ts`
  
- **Domínio / Banco / Models** → Português
  - Exemplos: `Jogador.ts`, tabela `jogadores`, `jogadores.repository.ts`

### Justificativa

- **API em inglês**: Facilita integração internacional e padronização
- **Domínio em português**: Reflete o negócio brasileiro e mantém coerência com schema do banco
- **Models em português**: Mantém alinhamento direto com tabelas PostgreSQL

---

## 🏗️ Arquitetura em Camadas

### Fluxo de Dados

```
Request → Controller → Service → Repository → Database
                                    ↓
Response ← Adapter ← Service ← Repository
```

### Responsabilidades por Camada

#### 1. Controller
**Responsabilidade:** Receber requisições HTTP e retornar respostas

**NUNCA:**
- ❌ Acessar ORM direto
- ❌ Aplicar lógica de negócio
- ❌ Validar dados (usa middleware)

**SEMPRE:**
- ✅ Chamar service
- ✅ Retornar formato `ApiResponse<T>`
- ✅ Aplicar middleware de tenant
- ✅ Tratar erros e retornar status HTTP apropriado

**Exemplo:**
```typescript
// ✅ CORRETO
export const getAll = async (req: Request, res: Response) => {
  try {
    const players = await playersService.getAll(req.tenantInfo!);
    return res.json({ success: true, data: players });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao buscar jogadores' });
  }
};

// ❌ ERRADO
export const getAll = async (req: Request, res: Response) => {
  const players = await prisma.jogadores.findMany(); // NUNCA
  return res.json(players);
};
```

---

#### 2. Service
**Responsabilidade:** Lógica de negócio e orquestração

**NUNCA:**
- ❌ Acessar `req` ou `res`
- ❌ Validar dados (usa validators)
- ❌ Aplicar lógica de tenant manualmente

**SEMPRE:**
- ✅ Receber dados já validados
- ✅ Aplicar tenant filter automaticamente
- ✅ Chamar repository
- ✅ Aplicar adapters antes de retornar

**Exemplo:**
```typescript
// ✅ CORRETO
export const getAll = async (tenantInfo: TenantInfo): Promise<Player[]> => {
  const jogadores = await playersRepository.findAll(tenantInfo);
  const lesoes = await lesoesRepository.findByJogadores(jogadores.map(j => j.id), tenantInfo);
  const lesoesMap = new Map(lesoes.map(l => [l.jogador_id, [l]]));
  
  return jogadores.map(j => 
    transformPlayerToFrontend(j, lesoesMap.get(j.id) || [], [])
  );
};

// ❌ ERRADO
export const getAll = async (req: Request): Promise<Player[]> => {
  const jogadores = await prisma.jogadores.findMany(); // NUNCA
  return jogadores;
};
```

---

#### 3. Repository
**Responsabilidade:** Acesso a dados (abstração do ORM)

**NUNCA:**
- ❌ Aplicar regra de negócio
- ❌ Validar dados
- ❌ Transformar dados para frontend

**SEMPRE:**
- ✅ Apenas acesso a dados
- ✅ Receber `tenantContext` quando necessário
- ✅ Retornar dados do banco (sem transformação)
- ✅ Usar ORM (Prisma/TypeORM)

**Exemplo:**
```typescript
// ✅ CORRETO
export const findAll = async (tenantInfo: TenantInfo): Promise<JogadorDB[]> => {
  const { where, params } = getEquipesTenantFilter(tenantInfo);
  return prisma.jogadores.findMany({
    where: {
      equipes_jogadores: {
        some: {
          equipe_id: { in: tenantInfo.equipe_ids || [] }
        }
      }
    }
  });
};

// ❌ ERRADO
export const findAll = async (): Promise<Player[]> => {
  // NUNCA transformar aqui
  return prisma.jogadores.findMany();
};
```

---

#### 4. Adapter
**Responsabilidade:** Transformar dados do banco para formato do frontend

**NUNCA:**
- ❌ Acessar banco de dados
- ❌ Validar regra de negócio
- ❌ Aplicar filtros de tenant

**SEMPRE:**
- ✅ Última etapa antes do response
- ✅ Transformar dados do banco para formato frontend
- ✅ Ser função pura (sem side effects)

**Exemplo:**
```typescript
// ✅ CORRETO
export function transformPlayerToFrontend(
  jogador: JogadorDB,
  lesoes: LesaoDB[],
  avaliacoes: AvaliacaoFisicaDB[]
): Player {
  // Apenas transformação
  return {
    id: jogador.id,
    name: jogador.nome,
    nickname: jogador.apelido || jogador.nome,
    // ...
    injuryHistory: lesoes.map(transformLesaoToFrontend)
  };
}

// ❌ ERRADO
export async function transformPlayerToFrontend(id: string): Promise<Player> {
  const jogador = await prisma.jogadores.findUnique({ where: { id } }); // NUNCA
  return { ... };
}
```

---

## 🔒 Multi-tenancy

### Isolamento de Dados

**Regra:** TODAS as queries devem ser filtradas por tenant (técnico ou clube).

**Implementação:**
- Middleware `tenantMiddleware` aplicado em todas as rotas
- `req.tenantInfo` disponível em todos os controllers
- Repositories recebem `tenantInfo` e aplicam filtros automaticamente

**Exceções:**
- Rotas públicas (login, registro)
- Rotas de administração (requer role ADMIN)
- Rotas que devem ser explicitamente documentadas

---

## ✅ Validações

### Camadas de Validação

1. **Frontend**: Validação de UX (opcional, pode ser bypassada)
2. **Backend (Validators)**: Validação de formato e regras de negócio
3. **Database (Constraints)**: Validação de integridade e tipos

### Validações Implementadas

- CPF/CNPJ com dígitos verificadores
- Email com regex e validações adicionais
- Números (não aceita letras, ranges min/max)
- Campos obrigatórios
- Constraints de banco (CHECK, FK, UNIQUE)

---

## 🚫 O Que NÃO Fazer

### Regras Críticas

- ❌ **Não mover validação para o controller**
  - Validações devem estar em validators ou middleware
  
- ❌ **Não pular adapter "porque é mais rápido"**
  - Adapters garantem compatibilidade com frontend
  
- ❌ **Não acessar ORM direto no service**
  - Sempre usar repository
  
- ❌ **Não criar lógica de tenant fora do middleware**
  - Tenant deve ser aplicado automaticamente
  
- ❌ **Não "simplificar" removendo camadas**
  - Cada camada tem responsabilidade específica

---

## 📊 Fluxo Completo de uma Requisição

### Exemplo: GET /api/players

1. **Request chega** → `players.routes.ts`
2. **Middleware de autenticação** → Verifica JWT
3. **Middleware de tenant** → Adiciona `req.tenantInfo`
4. **Controller** → `playersController.getAll(req, res)`
5. **Service** → `playersService.getAll(tenantInfo)`
6. **Repository** → `playersRepository.findAll(tenantInfo)`
7. **ORM** → Query no PostgreSQL com filtro de tenant
8. **Repository** → Retorna `JogadorDB[]`
9. **Service** → Busca lesões relacionadas
10. **Service** → Aplica adapter: `transformPlayerToFrontend()`
11. **Service** → Retorna `Player[]`
12. **Controller** → Formata resposta: `{ success: true, data: players }`
13. **Response** → JSON enviado ao frontend

---

## 🔮 Extensibilidade Futura

### Quando Crescer

**Pasta domain/** (opcional futuro):
```
src/domain/
├── entities/      # Entidades de domínio
├── value-objects/  # Objetos de valor
└── enums/          # Enumeradores
```

**Repositórios por agregado** (quando escalar):
- Hoje: `players.repository.ts`, `matches.repository.ts`
- Futuro: `team.repository.ts` (equipe + jogadores), `match.repository.ts` (jogo + stats + eventos)

**Nota:** A estrutura atual já permite essas evoluções sem refatoração dolorosa.

---

## ✅ Checklist de Qualidade

Seu backend está pronto quando:

- ✅ Multi-tenancy centralizado
- ✅ Backend não conhece frontend (adapters isolam)
- ✅ Frontend não conhece banco (adapters transformam)
- ✅ Validação em 3 níveis (frontend / backend / DB)
- ✅ Adapters cuidam de compatibilidade
- ✅ Migrations incrementais
- ✅ Nada hardcoded
- ✅ Convenções documentadas e seguidas

---

**Última atualização:** 2025-01-06


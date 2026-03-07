---
name: Refatoração Backend PostgreSQL
overview: Refatorar o backend do sistema esportivo de Google Sheets para PostgreSQL, criando uma arquitetura escalável, normalizada e extensível com sistema de roles, categorias dinâmicas e validações robustas, mantendo 100% de compatibilidade com o frontend existente.
todos: []
---

#Refatoração Backend para PostgreSQL - Sistema Esportivo

## 1. Análise do Sistema Atual

### Entidades Identificadas

- **Usuários**: Treinadores, Preparadores, Supervisores, Diretores, Atletas
- **Jogadores**: Dados pessoais, posição, histórico de lesões
- **Partidas**: Jogos com estatísticas coletivas e individuais
- **Avaliações Físicas**: Dados de composição corporal e performance
- **Programações**: Schedules semanais com atividades
- **Campeonatos**: Tabelas de jogos programados
- **Competições**: Lista de competições
- **Stat Targets**: Metas de estatísticas configuráveis

### Categorias do Sistema (Sidebar)

- **Gestão de Equipe**: Cadastro, Programação, Tabela de Campeonato
- **Performance**: Dados do Jogo, Scout Coletivo, Scout Individual, Ranking
- **Fisiologia**: Monitoramento Fisiológico, Avaliação Física, Academia

---

## 2. Schema PostgreSQL Completo

### 2.1 Tabelas de Autenticação e Roles

**`roles`**

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, TECNICO, CLUBE, ATLETA
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`users`**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`tecnicos`**

```sql
CREATE TABLE tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  registro_profissional VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`clubes`**

```sql
CREATE TABLE clubes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razao_social VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Tabelas de Gestão de Equipe

**`equipes`**

```sql
CREATE TABLE equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(50), -- sub-15, adulto, etc
  temporada VARCHAR(20), -- 2024, 2024/2025
  tecnico_id UUID NOT NULL REFERENCES tecnicos(id),
  clube_id UUID REFERENCES clubes(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`jogadores`**

```sql
CREATE TABLE jogadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  apelido VARCHAR(100),
  data_nascimento DATE,
  funcao_em_quadra VARCHAR(50), -- Goleiro, Fixo, Ala, Pivô
  numero_camisa INTEGER CHECK (numero_camisa >= 0 AND numero_camisa <= 99),
  pe_dominante VARCHAR(20) CHECK (pe_dominante IN ('Destro', 'Canhoto', 'Ambidestro')),
  altura DECIMAL(5,2) CHECK (altura > 0), -- em metros
  peso DECIMAL(5,2) CHECK (peso > 0), -- em kg
  ultimo_clube VARCHAR(255),
  foto_url TEXT,
  is_transferido BOOLEAN DEFAULT false,
  data_transferencia DATE,
  is_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`equipes_jogadores`**

```sql
CREATE TABLE equipes_jogadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(equipe_id, jogador_id, data_inicio)
);
```

### 2.3 Tabelas de Jogos e Partidas

**`jogos`**

```sql
CREATE TABLE jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES equipes(id),
  adversario VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  campeonato VARCHAR(255),
  local VARCHAR(255),
  resultado CHAR(1) CHECK (resultado IN ('V', 'D', 'E')), -- Vitória, Derrota, Empate
  gols_pro INTEGER DEFAULT 0 CHECK (gols_pro >= 0),
  gols_contra INTEGER DEFAULT 0 CHECK (gols_contra >= 0),
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`jogos_estatisticas_equipe`**

```sql
CREATE TABLE jogos_estatisticas_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID UNIQUE NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  minutos_jogados INTEGER DEFAULT 0 CHECK (minutos_jogados >= 0),
  gols INTEGER DEFAULT 0 CHECK (gols >= 0),
  gols_sofridos INTEGER DEFAULT 0 CHECK (gols_sofridos >= 0),
  assistencias INTEGER DEFAULT 0 CHECK (assistencias >= 0),
  cartoes_amarelos INTEGER DEFAULT 0 CHECK (cartoes_amarelos >= 0),
  cartoes_vermelhos INTEGER DEFAULT 0 CHECK (cartoes_vermelhos >= 0),
  passes_corretos INTEGER DEFAULT 0 CHECK (passes_corretos >= 0),
  passes_errados INTEGER DEFAULT 0 CHECK (passes_errados >= 0),
  passes_errados_transicao INTEGER DEFAULT 0 CHECK (passes_errados_transicao >= 0),
  desarmes_com_bola INTEGER DEFAULT 0 CHECK (desarmes_com_bola >= 0),
  desarmes_contra_ataque INTEGER DEFAULT 0 CHECK (desarmes_contra_ataque >= 0),
  desarmes_sem_bola INTEGER DEFAULT 0 CHECK (desarmes_sem_bola >= 0),
  chutes_no_gol INTEGER DEFAULT 0 CHECK (chutes_no_gol >= 0),
  chutes_fora INTEGER DEFAULT 0 CHECK (chutes_fora >= 0),
  rpe_partida INTEGER CHECK (rpe_partida >= 0 AND rpe_partida <= 10),
  gols_marcados_jogo_aberto INTEGER DEFAULT 0 CHECK (gols_marcados_jogo_aberto >= 0),
  gols_marcados_bola_parada INTEGER DEFAULT 0 CHECK (gols_marcados_bola_parada >= 0),
  gols_sofridos_jogo_aberto INTEGER DEFAULT 0 CHECK (gols_sofridos_jogo_aberto >= 0),
  gols_sofridos_bola_parada INTEGER DEFAULT 0 CHECK (gols_sofridos_bola_parada >= 0)
);
```

**`jogos_estatisticas_jogador`**

```sql
CREATE TABLE jogos_estatisticas_jogador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  minutos_jogados INTEGER DEFAULT 0 CHECK (minutos_jogados >= 0),
  gols INTEGER DEFAULT 0 CHECK (gols >= 0),
  gols_sofridos INTEGER DEFAULT 0 CHECK (gols_sofridos >= 0),
  assistencias INTEGER DEFAULT 0 CHECK (assistencias >= 0),
  cartoes_amarelos INTEGER DEFAULT 0 CHECK (cartoes_amarelos >= 0),
  cartoes_vermelhos INTEGER DEFAULT 0 CHECK (cartoes_vermelhos >= 0),
  passes_corretos INTEGER DEFAULT 0 CHECK (passes_corretos >= 0),
  passes_errados INTEGER DEFAULT 0 CHECK (passes_errados >= 0),
  passes_errados_transicao INTEGER DEFAULT 0 CHECK (passes_errados_transicao >= 0),
  desarmes_com_bola INTEGER DEFAULT 0 CHECK (desarmes_com_bola >= 0),
  desarmes_contra_ataque INTEGER DEFAULT 0 CHECK (desarmes_contra_ataque >= 0),
  desarmes_sem_bola INTEGER DEFAULT 0 CHECK (desarmes_sem_bola >= 0),
  chutes_no_gol INTEGER DEFAULT 0 CHECK (chutes_no_gol >= 0),
  chutes_fora INTEGER DEFAULT 0 CHECK (chutes_fora >= 0),
  rpe_partida INTEGER CHECK (rpe_partida >= 0 AND rpe_partida <= 10),
  gols_marcados_jogo_aberto INTEGER DEFAULT 0 CHECK (gols_marcados_jogo_aberto >= 0),
  gols_marcados_bola_parada INTEGER DEFAULT 0 CHECK (gols_marcados_bola_parada >= 0),
  gols_sofridos_jogo_aberto INTEGER DEFAULT 0 CHECK (gols_sofridos_jogo_aberto >= 0),
  gols_sofridos_bola_parada INTEGER DEFAULT 0 CHECK (gols_sofridos_bola_parada >= 0),
  UNIQUE(jogo_id, jogador_id)
);
```

**`jogos_eventos`** (Entradas e Saídas)

```sql
CREATE TABLE jogos_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  jogador_id UUID NOT NULL REFERENCES jogadores(id),
  tipo_evento VARCHAR(10) NOT NULL CHECK (tipo_evento IN ('ENTRADA', 'SAIDA')),
  minuto INTEGER NOT NULL CHECK (minuto >= 0),
  segundo INTEGER NOT NULL CHECK (segundo >= 0 AND segundo <= 59),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 Tabelas de Lesões

**`lesoes`**

```sql
CREATE TABLE lesoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  data_fim DATE,
  tipo VARCHAR(100) NOT NULL,
  localizacao VARCHAR(100) NOT NULL,
  lado VARCHAR(20) CHECK (lado IN ('Direito', 'Esquerdo', 'Bilateral', 'N/A')),
  severidade VARCHAR(50),
  origem VARCHAR(20) CHECK (origem IN ('Treino', 'Jogo', 'Outros')),
  dias_afastado INTEGER CHECK (dias_afastado >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 Tabelas de Avaliação Física

**`avaliacoes_fisicas`**

```sql
CREATE TABLE avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  peso DECIMAL(5,2) CHECK (peso > 0),
  altura DECIMAL(5,2) CHECK (altura > 0),
  gordura_corporal DECIMAL(5,2) CHECK (gordura_corporal >= 0 AND gordura_corporal <= 100),
  massa_muscular DECIMAL(5,2) CHECK (massa_muscular > 0),
  vo2max DECIMAL(5,2) CHECK (vo2max > 0),
  flexibilidade DECIMAL(5,2) CHECK (flexibilidade >= 0),
  velocidade DECIMAL(5,2) CHECK (velocidade > 0),
  forca DECIMAL(5,2) CHECK (forca > 0),
  agilidade DECIMAL(5,2) CHECK (agilidade > 0),
  -- Dobras cutâneas (opcional)
  peitoral DECIMAL(5,2),
  axilar DECIMAL(5,2),
  subescapular DECIMAL(5,2),
  triceps DECIMAL(5,2),
  abdominal DECIMAL(5,2),
  suprailiaca DECIMAL(5,2),
  coxa DECIMAL(5,2),
  plano_acao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(jogador_id, data)
);
```

### 2.6 Tabelas de Programação

**`programacoes`**

```sql
CREATE TABLE programacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES equipes(id),
  titulo VARCHAR(255) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL CHECK (data_fim >= data_inicio),
  is_ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`programacoes_dias`**

```sql
CREATE TABLE programacoes_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id UUID NOT NULL REFERENCES programacoes(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  dia_semana VARCHAR(20),
  atividade VARCHAR(255),
  horario TIME,
  localizacao VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.7 Tabelas de Campeonato

**`campeonatos`**

```sql
CREATE TABLE campeonatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  equipe_id UUID REFERENCES equipes(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`campeonatos_jogos`**

```sql
CREATE TABLE campeonatos_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campeonato_id UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIME,
  equipe VARCHAR(255) NOT NULL,
  adversario VARCHAR(255) NOT NULL,
  competicao VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.8 Tabelas de Configuração

**`competicoes`**

```sql
CREATE TABLE competicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`metas_estatisticas`**

```sql
CREATE TABLE metas_estatisticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID REFERENCES equipes(id),
  gols INTEGER DEFAULT 0 CHECK (gols >= 0),
  assistencias INTEGER DEFAULT 0 CHECK (assistencias >= 0),
  passes_corretos INTEGER DEFAULT 0 CHECK (passes_corretos >= 0),
  passes_errados INTEGER DEFAULT 0 CHECK (passes_errados >= 0),
  chutes_no_gol INTEGER DEFAULT 0 CHECK (chutes_no_gol >= 0),
  chutes_fora INTEGER DEFAULT 0 CHECK (chutes_fora >= 0),
  desarmes_com_posse INTEGER DEFAULT 0 CHECK (desarmes_com_posse >= 0),
  desarmes_sem_posse INTEGER DEFAULT 0 CHECK (desarmes_sem_posse >= 0),
  desarmes_contra_ataque INTEGER DEFAULT 0 CHECK (desarmes_contra_ataque >= 0),
  erros_transicao INTEGER DEFAULT 0 CHECK (erros_transicao >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.9 Sistema de Categorias Dinâmicas (Extensível)

**`categorias`**

```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE, -- Gestão, Performance, Fisiologia
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`subcategorias`**

```sql
CREATE TABLE subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL, -- Scout Coletivo, Scout Individual, etc
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(categoria_id, nome)
);
```

**`campos`**

```sql
CREATE TABLE campos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategoria_id UUID NOT NULL REFERENCES subcategorias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INTEGER', 'DECIMAL', 'TEXT', 'BOOLEAN', 'DATE')),
  obrigatorio BOOLEAN DEFAULT false,
  valor_minimo NUMERIC,
  valor_maximo NUMERIC,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subcategoria_id, nome)
);
```

**`registros`**

```sql
CREATE TABLE registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES tecnicos(id),
  jogo_id UUID REFERENCES jogos(id) ON DELETE SET NULL,
  subcategoria_id UUID NOT NULL REFERENCES subcategorias(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`registros_valores`**

```sql
CREATE TABLE registros_valores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  campo_id UUID NOT NULL REFERENCES campos(id),
  valor_texto TEXT,
  valor_numero NUMERIC,
  valor_boolean BOOLEAN,
  valor_data DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(registro_id, campo_id),
  -- Constraint: apenas um valor deve ser preenchido
  CONSTRAINT check_single_value CHECK (
    (valor_texto IS NOT NULL)::INTEGER +
    (valor_numero IS NOT NULL)::INTEGER +
    (valor_boolean IS NOT NULL)::INTEGER +
    (valor_data IS NOT NULL)::INTEGER = 1
  )
);
```

### 2.10 Índices e Performance

```sql
-- Índices para consultas frequentes
CREATE INDEX idx_jogos_equipe_data ON jogos(equipe_id, data DESC);
CREATE INDEX idx_jogos_estatisticas_jogador_jogo ON jogos_estatisticas_jogador(jogo_id);
CREATE INDEX idx_jogos_estatisticas_jogador_jogador ON jogos_estatisticas_jogador(jogador_id);
CREATE INDEX idx_lesoes_jogador ON lesoes(jogador_id, data DESC);
CREATE INDEX idx_avaliacoes_jogador ON avaliacoes_fisicas(jogador_id, data DESC);
CREATE INDEX idx_programacoes_equipe ON programacoes(equipe_id, data_inicio);
CREATE INDEX idx_registros_jogador ON registros(jogador_id, created_at DESC);
CREATE INDEX idx_registros_subcategoria ON registros(subcategoria_id);
CREATE INDEX idx_equipes_jogadores_equipe ON equipes_jogadores(equipe_id);
CREATE INDEX idx_equipes_jogadores_jogador ON equipes_jogadores(jogador_id);
```

---

## 3. Estrutura do Backend Node.js + Express

### 3.1 Estrutura de Pastas

```javascript
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuração Prisma/TypeORM
│   │   └── env.ts               # Variáveis de ambiente
│   ├── models/                  # Models Prisma ou TypeORM
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Tecnico.ts
│   │   ├── Clube.ts
│   │   ├── Equipe.ts
│   │   ├── Jogador.ts
│   │   ├── Jogo.ts
│   │   └── ...
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── players.controller.ts
│   │   ├── matches.controller.ts
│   │   ├── assessments.controller.ts
│   │   └── ...
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── players.service.ts
│   │   ├── validation.service.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── players.routes.ts
│   │   ├── matches.routes.ts
│   │   └── ...
│   ├── validators/
│   │   ├── player.validator.ts
│   │   ├── match.validator.ts
│   │   └── ...
│   ├── utils/
│   │   ├── logger.ts
│   │   └── errors.ts
│   └── app.ts                   # Express app
├── prisma/                      # Se usar Prisma
│   ├── schema.prisma
│   └── migrations/
├── migrations/                  # Se usar TypeORM
│   └── ...
├── .env.example
├── package.json
└── tsconfig.json
```

### 3.2 Escolha de ORM

**Opção A: Prisma (Recomendado)**

- Type-safe, migrations automáticas
- Geração automática de tipos TypeScript
- Boa documentação

**Opção B: TypeORM**

- Mais flexível, suporta queries complexas
- Padrão Active Record e Data Mapper

---

## 4. API Endpoints (Compatibilidade com Frontend)

### 4.1 Mapeamento de Rotas Atuais

Manter compatibilidade com [`services/api.ts`](21Scoutpro/services/api.ts):**GET `/api/players`** → `playersApi.getAll()`**GET `/api/players/:id`** → `playersApi.getById()`**POST `/api/players`** → `playersApi.create()`**PUT `/api/players/:id`** → `playersApi.update()`**DELETE `/api/players/:id`** → `playersApi.delete()`Aplicar o mesmo padrão para:

- `/api/matches`
- `/api/assessments`
- `/api/schedules`
- `/api/competitions`
- `/api/stat-targets`
- `/api/championship-matches`

### 4.2 Formato de Resposta

Manter formato atual:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 5. Validações e Constraints

### 5.1 Validações no Backend

**Campos Numéricos:**

- Não permitir letras
- Validar ranges (min/max)
- Validar tipos (INTEGER vs DECIMAL)

**Campos Obrigatórios:**

- Verificar antes de salvar
- Retornar erro claro se faltar

**Integridade Referencial:**

- Foreign Keys com ON DELETE CASCADE/SET NULL apropriados
- Validar existência de entidades relacionadas

**Validações Específicas:**

- `jogos_eventos`: minuto >= 0, segundo entre 0-59
- `jogadores`: numero_camisa entre 0-99
- `avaliacoes_fisicas`: gordura_corporal entre 0-100
- `rpe_partida`: entre 0-10

### 5.2 Middleware de Validação

Usar bibliotecas como:

- `express-validator` ou `zod` para validação de schemas
- Validação em camada de serviço antes de persistir

---

## 6. Autenticação e Autorização

### 6.1 Sistema de Auth

- JWT tokens para sessões
- Middleware `auth.middleware.ts` para proteger rotas
- Verificar role do usuário antes de operações sensíveis

### 6.2 Multi-tenancy

- Cada técnico/clube tem seus próprios dados
- Filtrar queries por `tecnico_id` ou `clube_id`
- Isolamento completo entre tenants

---

## 7. Plano de Implementação

### Fase 1: Setup Inicial

1. Criar projeto Node.js + Express + TypeScript
2. Configurar Prisma ou TypeORM
3. Criar schema inicial no PostgreSQL
4. Configurar variáveis de ambiente

### Fase 2: Models e Migrations

1. Criar todos os models baseados no schema
2. Gerar migrations
3. Popular dados iniciais (roles, categorias padrão)

### Fase 3: API Básica

1. Implementar endpoints de autenticação
2. Implementar CRUD de jogadores
3. Implementar CRUD de partidas
4. Testar compatibilidade com frontend

### Fase 4: Funcionalidades Completas

1. Implementar todas as rotas restantes
2. Adicionar validações
3. Implementar sistema de categorias dinâmicas
4. Testes de integração

### Fase 5: Deploy e Monitoramento

1. Configurar ambiente de produção
2. Deploy do backend
3. Atualizar frontend para usar nova API
4. Monitoramento e logs

---

## 8. Compatibilidade com Frontend

### 8.1 Manter Interface Atual

O frontend em [`services/api.ts`](21Scoutpro/services/api.ts) não precisa mudar. Apenas atualizar `config.ts`:

```typescript
// Antes: Google Apps Script URL
export const getApiUrl = () => { ... }

// Depois: Backend PostgreSQL URL
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};
```

### 8.2 Transformação de Dados

Criar adapters no backend para transformar dados do PostgreSQL no formato esperado pelo frontend (se necessário).---

## 9. Extensibilidade Futura

### 9.1 Novos Esportes

- Adicionar campo `esporte` em `equipes`
- Criar tabela `esportes` com configurações específicas
- Campos dinâmicos por esporte

### 9.2 Novas Categorias

- Inserir em `categorias` e `subcategorias` sem alterar schema
- Frontend pode buscar dinamicamente

### 9.3 Personalizações por Clube

- Tabela `configuracoes_clube` para settings customizados
- Campos adicionais em várias tabelas via JSONB (PostgreSQL)

---

## 10. Considerações de Performance

- Índices em foreign keys e campos de busca frequente
- Paginação em listagens grandes
- Cache de queries frequentes (Redis opcional)
- Connection pooling no PostgreSQL

---

## Arquivos a Criar/Modificar

**Novos:**

- `backend/` (nova pasta raiz)
- `backend/src/` (código fonte)
- `backend/prisma/schema.prisma` ou `backend/src/models/` (TypeORM)
- `backend/migrations/` (se TypeORM)

**Modificar:**

- [`21Scoutpro/config.ts`](21Scoutpro/config.ts) - Atualizar URL da API
- [`21Scoutpro/services/api.ts`](21Scoutpro/services/api.ts) - Manter interface, apenas URL muda

**Manter Intacto:**

- Todos os componentes React

---

## 11. REVISÃO CRÍTICA DO PLANO (CTO Review)

### 11.1 O QUE ESTÁ CORRETO E NÃO DEVE SER ALTERADO

**Schema PostgreSQL:**

- Estrutura geral de tabelas está sólida e bem normalizada
- Uso consistente de UUID como chave primária é adequado
- Relacionamentos FK estão corretos na maioria dos casos
- Sistema de categorias dinâmicas (EAV) está bem estruturado
- Constraints CHECK estão apropriadas para validação de dados
- Índices propostos cobrem os casos de uso principais

**Arquitetura Backend:**

- Separação controller/service/repository está adequada
- Estrutura de pastas segue boas práticas
- Escolha de Prisma ou TypeORM é flexível e adequada

**Compatibilidade Frontend:**

- Estratégia de manter interface atual é correta
- Formato de resposta ApiResponse está alinhado
- Mapeamento de rotas está completo

**Validações:**

- Constraints de banco estão bem definidas
- Validações específicas (RPE, número camisa, etc.) estão corretas

---

### 11.2 AJUSTES RECOMENDADOS (Impacto Baixo)

#### A. Schema PostgreSQL - Correções Técnicas

**1. Tabela `users` - Campo `name` ausente**

```sql
-- ADICIONAR após linha 52
name VARCHAR(255) NOT NULL, -- Nome completo do usuário
```

**Justificativa:** Frontend espera `User.name` (verificado em `types.ts` linha 6). Campo obrigatório para exibição.**2. Tabela `users` - Campo `photo_url` ausente**

```sql
-- ADICIONAR após name
photo_url TEXT, -- URL da foto do perfil
```

**Justificativa:** Frontend usa `User.photoUrl` (linha 9 de `types.ts`).**3. Tabela `jogadores` - Campo `age` ausente**

```sql
-- ADICIONAR após data_nascimento
idade INTEGER CHECK (idade >= 0 AND idade <= 150), -- Idade calculada ou armazenada
```

**Justificativa:** Frontend espera `Player.age` (linha 52 de `types.ts`). Pode ser calculado de `data_nascimento`, mas armazenar evita cálculos repetidos.**4. Tabela `jogos` - Relacionamento com `competicoes`**

```sql
-- MODIFICAR linha 153
campeonato VARCHAR(255), -- DEPRECADO: usar competicao_id
competicao_id UUID REFERENCES competicoes(id),
```

**Justificativa:** Normalização adequada. Manter `campeonato` temporariamente para compatibilidade durante migração.**5. Tabela `jogos_eventos` - Validação de sequência**

```sql
-- ADICIONAR constraint após linha 231
-- Garantir que não haja múltiplas entradas sem saída
CONSTRAINT check_entrada_saida CHECK (
  tipo_evento = 'SAIDA' OR 
  NOT EXISTS (
    SELECT 1 FROM jogos_eventos je2 
    WHERE je2.jogo_id = jogos_eventos.jogo_id 
    AND je2.jogador_id = jogos_eventos.jogador_id 
    AND je2.tipo_evento = 'ENTRADA' 
    AND (je2.minuto < jogos_eventos.minuto OR (je2.minuto = jogos_eventos.minuto AND je2.segundo < jogos_eventos.segundo))
  )
)
```

**Justificativa:** Validação de negócio importante. Evita dados inconsistentes de entradas/saídas.**6. Tabela `lesoes` - Campo `data_inicio` ausente**

```sql
-- MODIFICAR linha 245
data DATE NOT NULL, -- Renomear para data_inicio para clareza
data_inicio DATE NOT NULL, -- Data de início da lesão
data_fim DATE, -- Data de recuperação
```

**Justificativa:** Frontend usa `InjuryRecord.startDate` (linha 40 de `types.ts`). Nome mais claro.**7. Tabela `avaliacoes_fisicas` - Campos ausentes do frontend**

```sql
-- ADICIONAR após linha 285 (antes de plano_acao)
velocidade DECIMAL(5,2) CHECK (velocidade > 0), -- Já existe, OK
forca DECIMAL(5,2) CHECK (forca > 0), -- Já existe, OK
-- VERIFICAR: frontend tem 'speed' e 'strength' (linhas 98-99 types.ts)
-- Mapear corretamente no adapter
```

**Justificativa:** Campos existem no schema, mas nomes podem precisar de mapeamento no adapter.**8. Tabela `programacoes_dias` - Estrutura de atividades**

```sql
-- O schema atual está correto, mas o frontend espera estrutura aninhada
-- WeeklySchedule.days é array de DaySchedule com activities[]
-- ADICIONAR campo para agrupar atividades por dia
dia_semana_numero INTEGER CHECK (dia_semana_numero >= 0 AND dia_semana_numero <= 6), -- 0=Dom, 6=Sáb
```

**Justificativa:** Facilita queries e ordenação. Frontend usa estrutura aninhada que precisa ser desnormalizada ou mapeada.**9. Tabela `campeonatos_jogos` - Relacionamento com `jogos`**

```sql
-- ADICIONAR após linha 350
jogo_id UUID REFERENCES jogos(id), -- Link opcional para jogo realizado
```

**Justificativa:** Permite vincular jogo programado ao jogo realizado. Melhora rastreabilidade.**10. Tabela `registros_valores` - Validação de tipo vs campo**

```sql
-- ADICIONAR constraint após linha 469
-- Garantir que o tipo do valor corresponde ao tipo do campo
CONSTRAINT check_tipo_valor CHECK (
  (SELECT tipo FROM campos WHERE id = campo_id) = 'INTEGER' AND valor_numero IS NOT NULL AND valor_numero = FLOOR(valor_numero) OR
  (SELECT tipo FROM campos WHERE id = campo_id) = 'DECIMAL' AND valor_numero IS NOT NULL OR
  (SELECT tipo FROM campos WHERE id = campo_id) = 'TEXT' AND valor_texto IS NOT NULL OR
  (SELECT tipo FROM campos WHERE id = campo_id) = 'BOOLEAN' AND valor_boolean IS NOT NULL OR
  (SELECT tipo FROM campos WHERE id = campo_id) = 'DATE' AND valor_data IS NOT NULL
)
```

**Justificativa:** Validação crítica para integridade do sistema EAV. Evita dados inconsistentes.

#### B. Multi-tenancy - Ajustes de Segurança

**11. Isolamento por técnico/clube - Adicionar índices**

```sql
-- ADICIONAR após seção 2.10
CREATE INDEX idx_equipes_tecnico ON equipes(tecnico_id);
CREATE INDEX idx_equipes_clube ON equipes(clube_id);
CREATE INDEX idx_jogos_equipe_tecnico ON jogos(equipe_id) INCLUDE (equipe_id) WHERE equipe_id IN (SELECT id FROM equipes);
```

**Justificativa:** Performance em queries filtradas por tenant. Essencial para escalabilidade.**12. Middleware de tenant - Documentar obrigatoriedade**

```typescript
// ADICIONAR em 6.2 Multi-tenancy
// TODAS as queries devem incluir filtro por tecnico_id ou clube_id
// Criar helper: getTenantFilter(user) que retorna WHERE clause apropriado
```

**Justificativa:** Segurança crítica. Sem filtro, dados podem vazar entre tenants.

#### C. Compatibilidade Frontend - Adapters Necessários

**13. Adapter para `MatchRecord` - Estrutura aninhada**

```typescript
// O frontend espera MatchRecord com playerStats: { [playerId]: MatchStats }
// Backend tem jogos + jogos_estatisticas_jogador separados
// CRIAR adapter em services/matches.service.ts:
function transformMatchToFrontend(jogo, estatisticasJogadores): MatchRecord {
  return {
    id: jogo.id,
    opponent: jogo.adversario,
    date: jogo.data,
    result: jogo.resultado,
    goalsFor: jogo.gols_pro,
    goalsAgainst: jogo.gols_contra,
    competition: jogo.campeonato,
    playerStats: estatisticasJogadores.reduce((acc, stat) => {
      acc[stat.jogador_id] = transformStats(stat);
      return acc;
    }, {}),
    teamStats: transformTeamStats(jogo.estatisticas_equipe)
  };
}
```

**Justificativa:** Estrutura de dados diferente entre backend normalizado e frontend. Adapter obrigatório.**14. Adapter para `WeeklySchedule` - Estrutura aninhada**

```typescript
// Frontend espera days: DaySchedule[] com activities[]
// Backend tem programacoes + programacoes_dias (flat)
// CRIAR adapter que agrupa por dia
```

**Justificativa:** Mesma situação do MatchRecord. Necessário agrupamento.**15. Adapter para `Player` - `injuryHistory` aninhado**

```typescript
// Frontend espera Player.injuryHistory?: InjuryRecord[]
// Backend tem lesoes em tabela separada
// JOIN necessário + transformação
```

**Justificativa:** Relacionamento 1:N precisa ser agregado no adapter.

#### D. Validações - Ajustes de Aplicação

**16. Validação de CPF/CNPJ - Adicionar no backend**

```typescript
// ADICIONAR em validators/tecnico.validator.ts e validators/clube.validator.ts
// Validar formato e dígitos verificadores
```

**Justificativa:** Integridade de dados. CPF/CNPJ são campos críticos.**17. Validação de email - Adicionar constraint**

```sql
-- MODIFICAR users.email
email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
```

**Justificativa:** Validação básica no banco + validação completa no backend.---

### 11.3 AJUSTES OPCIONAIS (Futuro)

**1. Soft Delete**

- Adicionar `deleted_at TIMESTAMP` em tabelas críticas (jogadores, jogos, equipes)
- Permite recuperação de dados deletados acidentalmente

**2. Auditoria**

- Tabela `audit_log` para rastrear mudanças em dados sensíveis
- Campos: `table_name`, `record_id`, `action`, `user_id`, `old_value`, `new_value`, `timestamp`

**3. Versionamento de Schema**

- Tabela `schema_versions` para rastrear migrations aplicadas
- Útil para rollback e auditoria

**4. Campos JSONB para extensibilidade**

- Adicionar `metadata JSONB` em tabelas principais
- Permite campos customizados sem alterar schema

**5. Full-text search**

- Índices GIN para busca em nomes, descrições
- Melhora UX em buscas

---

### 11.4 PONTOS DE ATENÇÃO (Riscos Reais)

**1. RISCO ALTO: Transformação de dados frontend/backend**

- **Problema:** Estruturas aninhadas do frontend vs normalização do backend
- **Impacto:** Adapters complexos, possível degradação de performance
- **Mitigação:** Criar adapters bem testados, considerar cache de transformações

**2. RISCO MÉDIO: Sistema EAV (categorias dinâmicas)**

- **Problema:** Queries complexas, possível degradação com muitos registros
- **Impacto:** Performance em relatórios e buscas
- **Mitigação:** Índices adequados, considerar materialized views para relatórios frequentes

**3. RISCO MÉDIO: Multi-tenancy sem row-level security**

- **Problema:** Filtros manuais podem ser esquecidos
- **Impacto:** Vazamento de dados entre tenants
- **Mitigação:** Middleware obrigatório, testes de isolamento, considerar PostgreSQL RLS

**4. RISCO BAIXO: Migração de dados (se houver no futuro)**

- **Problema:** Estrutura Google Sheets vs PostgreSQL é diferente
- **Impacto:** Dados podem ser perdidos ou corrompidos
- **Mitigação:** Scripts de migração bem testados, validação pós-migração

**5. RISCO BAIXO: Campos opcionais vs obrigatórios**

- **Problema:** Frontend pode enviar dados incompletos
- **Impacto:** Erros de validação, UX ruim
- **Mitigação:** Validação clara no backend, mensagens de erro descritivas

---

### 11.5 CONFIRMAÇÃO DE INTEGRIDADE

**O plano está estruturalmente íntegro e pronto para implementação após os ajustes recomendados.Resumo:**

- ✅ Schema PostgreSQL está sólido (após ajustes de campos ausentes)
- ✅ Arquitetura backend está adequada
- ✅ Compatibilidade frontend é mantida (com adapters)
- ✅ Validações estão bem definidas
- ✅ Multi-tenancy está contemplado (requer atenção na implementação)
- ✅ Sistema de categorias dinâmicas está bem projetado

**Próximos passos recomendados:**

1. Aplicar ajustes recomendados na seção 11.2
2. Criar adapters de transformação de dados (itens 13-15)
3. Implementar middleware de multi-tenancy robusto
4. Testes de integração focados em compatibilidade frontend
5. Documentar mapeamento de campos frontend ↔ backend

**Decisões arquiteturais confirmadas:**

- ✅ PostgreSQL como banco principal
- ✅ Node.js + Express + TypeScript
- ✅ Prisma ou TypeORM (escolha do time)
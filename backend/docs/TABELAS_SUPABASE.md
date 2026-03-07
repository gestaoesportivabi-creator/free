# Tabelas e colunas do Supabase (PostgreSQL) utilizadas pelo backend

O backend SCOUT 21 PRO usa o Prisma para acessar o PostgreSQL do Supabase. As tabelas abaixo correspondem ao `@@map` do [schema.prisma](../prisma/schema.prisma). As colunas listadas são os nomes reais no banco (quando há `@map`, o nome da coluna é o valor do map).

## Middleware de tenant (multi-tenancy)

Antes de acessar dados, o backend resolve o **tenant** do usuário logado:

1. **users** – usuário autenticado (id, email, role_id).
2. **tecnicos** ou **clubes** – registro vinculado ao `user_id` (um usuário é técnico OU clube).
3. **equipes** – listagem por `tecnico_id` ou `clube_id`; o resultado vira `equipe_ids` no request.

Rotas protegidas (players, matches, schedules, etc.) usam `equipe_ids` para filtrar e isolar dados por tenant. **Criar jogador** exige que o usuário tenha técnico (ou clube) e ao menos uma equipe; se não houver equipe, o service pode criar uma equipe padrão "Elenco" para o técnico.

## Row Level Security (RLS)

O PostgreSQL (Supabase) tem **RLS ativo** nas tabelas de dados por tenant. Assim, mesmo que haja bug na aplicação ou acesso direto ao banco com o mesmo role, o PostgreSQL só retorna/altera linhas do tenant definido para aquele request.

- **Variáveis de sessão:** As políticas RLS leem `app.equipe_ids` (string com UUIDs separados por vírgula), `app.tecnico_id` e `app.clube_id`. Uma função auxiliar `current_equipe_ids_array()` retorna `uuid[]` a partir de `app.equipe_ids`.
- **Quem define as variáveis:** O backend define essas variáveis **por request**. Cada rota protegida por tenant roda dentro de uma transação Prisma; no início da transação o backend executa `set_config('app.equipe_ids', ..., true)`, `set_config('app.tecnico_id', ..., true)` e `set_config('app.clube_id', ..., true)` com os valores de `req.tenantInfo`. Todas as queries desse request usam a mesma conexão e enxergam as variáveis; as políticas RLS aplicam o filtro corretamente.
- **Onde está o código:** O helper `runWithTenant(req, fn)` em [backend/src/utils/transactionWithTenant.ts](../src/utils/transactionWithTenant.ts) inicia a transação, chama `set_config` e executa o callback com o cliente transacional `tx`. Controllers de players, matches, schedules, teams, assessments, championshipMatches, timeControls e statTargets envolvem as chamadas ao service em `runWithTenant(req, (tx) => service.xxx(..., tx))`.
- **Tabelas com RLS:** equipes, jogadores, equipes_jogadores, jogos, jogos_estatisticas_equipe, jogos_estatisticas_jogador, jogos_eventos, lesoes, avaliacoes_fisicas, programacoes, programacoes_dias, campeonatos, campeonatos_jogos, metas_estatisticas. Tabelas globais (roles, users, competicoes) podem não ter RLS ou ter política permissiva para o role da aplicação.
- **Migration:** As políticas e a função auxiliar estão em [backend/migrations/013_enable_rls_policies.sql](../migrations/013_enable_rls_policies.sql).

---

## Tabelas

### roles
Papel do usuário (auth/roles).

| Coluna       | Tipo        | Uso                    |
|-------------|-------------|------------------------|
| id          | uuid        | PK                     |
| name        | varchar(50) | Nome do role (único)   |
| description | text        | Opcional               |
| created_at  | timestamp   |                        |

---

### users
Usuários do sistema (login e vínculo com técnico/clube).

| Coluna        | Tipo         | Uso                    |
|---------------|--------------|------------------------|
| id            | uuid         | PK                     |
| email         | varchar(255) | Único                  |
| password_hash | varchar(255) | Senha hasheada         |
| name          | varchar(255) | Nome                   |
| photo_url     | varchar      | Opcional               |
| role_id       | uuid         | FK → roles             |
| is_active     | boolean      |                        |
| created_at    | timestamp    |                        |
| updated_at    | timestamp    |                        |

---

### tecnicos
Técnico vinculado a um usuário (tenant tipo técnico).

| Coluna                 | Tipo         | Uso                    |
|------------------------|--------------|------------------------|
| id                     | uuid         | PK                     |
| user_id                | uuid         | FK → users (único)     |
| nome                   | varchar(255) |                        |
| cpf                    | varchar(14)  | Opcional, único        |
| registro_profissional  | varchar(50)  | Opcional               |
| created_at             | timestamp    |                        |

---

### clubes
Clube vinculado a um usuário (tenant tipo clube).

| Coluna        | Tipo         | Uso                |
|---------------|--------------|--------------------|
| id            | uuid         | PK                 |
| user_id       | uuid         | FK → users (único) |
| razao_social  | varchar(255) |                    |
| cnpj          | varchar(18)  | Único              |
| cidade        | varchar(100) | Opcional           |
| estado        | varchar(2)   | Opcional           |
| created_at    | timestamp    |                    |

---

### equipes
Equipes (time/elenco). Pertencem a um técnico ou a um clube.

| Coluna       | Tipo         | Uso                |
|--------------|--------------|--------------------|
| id           | uuid         | PK                 |
| nome         | varchar(255) |                    |
| categoria    | varchar(50)  | Opcional           |
| temporada    | varchar(20)  | Opcional           |
| tecnico_id   | uuid         | FK → tecnicos      |
| clube_id     | uuid         | FK → clubes (opt.) |
| created_at   | timestamp    |                    |

---

### jogadores
Cadastro de atletas.

| Coluna             | Tipo         | Uso                |
|--------------------|--------------|--------------------|
| id                 | uuid         | PK                 |
| nome               | varchar(255) |                    |
| apelido            | varchar(100) | Opcional           |
| data_nascimento    | date         | Opcional           |
| idade              | smallint     | Opcional           |
| funcao_em_quadra   | varchar(50)  | Opcional           |
| numero_camisa      | smallint     | Opcional           |
| pe_dominante       | varchar(20)  | Opcional           |
| altura             | decimal(5,2) | Opcional           |
| peso               | decimal(5,2) | Opcional           |
| ultimo_clube       | varchar(255) | Opcional           |
| foto_url           | text         | Opcional           |
| max_loads_json     | json         | Opcional           |
| is_transferido     | boolean      |                    |
| data_transferencia | date         | Opcional           |
| is_ativo           | boolean      |                    |
| created_at         | timestamp    |                    |
| updated_at         | timestamp    |                    |

---

### equipes_jogadores
Vínculo jogador–equipe (período na equipe).

| Coluna      | Tipo      | Uso                |
|-------------|-----------|--------------------|
| id          | uuid      | PK                 |
| equipe_id   | uuid      | FK → equipes       |
| jogador_id  | uuid      | FK → jogadores     |
| data_inicio | date      | Início do vínculo  |
| data_fim    | date      | Opcional (null = ativo) |
| created_at  | timestamp |                    |

Unique: (equipe_id, jogador_id, data_inicio).

---

### jogos
Partidas (jogos).

| Coluna                 | Tipo         | Uso                |
|------------------------|--------------|--------------------|
| id                     | uuid         | PK                 |
| equipe_id              | uuid         | FK → equipes       |
| adversario             | varchar(255) |                    |
| data                   | date         |                    |
| campeonato             | varchar(255) | Opcional           |
| competicao_id          | uuid         | FK → competicoes (opt.) |
| local                  | varchar(255) | Opcional           |
| resultado              | char(1)      | V/D/E              |
| gols_pro               | int          |                    |
| gols_contra            | int          |                    |
| video_url              | varchar      | Opcional           |
| post_match_event_log   | json         | Opcional           |
| player_relationships   | json         | Opcional           |
| lineup                 | json         | Opcional           |
| substitution_history   | json         | Opcional           |
| created_at             | timestamp    |                    |

---

### jogos_estatisticas_equipe
Estatísticas da equipe por jogo.

| Coluna                      | Tipo | Uso                |
|----------------------------|------|--------------------|
| id                         | uuid | PK                 |
| jogo_id                    | uuid | FK → jogos (único) |
| minutos_jogados             | int  |                    |
| gols                       | int  |                    |
| gols_sofridos              | int  |                    |
| assistencias               | int  |                    |
| cartoes_amarelos           | int  |                    |
| cartoes_vermelhos          | int  |                    |
| passes_corretos            | int  |                    |
| passes_errados             | int  |                    |
| passes_errados_transicao   | int  |                    |
| desarmes_com_bola          | int  |                    |
| desarmes_contra_ataque     | int  |                    |
| desarmes_sem_bola          | int  |                    |
| chutes_no_gol              | int  |                    |
| chutes_fora                | int  |                    |
| rpe_partida                | int  | Opcional           |
| gols_marcados_jogo_aberto  | int  |                    |
| gols_marcados_bola_parada  | int  |                    |
| gols_sofridos_jogo_aberto  | int  |                    |
| gols_sofridos_bola_parada  | int  |                    |

---

### jogos_estatisticas_jogador
Estatísticas por jogador por jogo.

| Coluna                      | Tipo   | Uso                |
|----------------------------|--------|--------------------|
| id                         | uuid   | PK                 |
| jogo_id                    | uuid   | FK → jogos         |
| jogador_id                 | uuid   | FK → jogadores     |
| minutos_jogados             | int    |                    |
| gols, gols_sofridos        | int    |                    |
| assistencias               | int    |                    |
| cartoes_amarelos/vermelhos | int    |                    |
| passes_corretos/errados    | int    |                    |
| passes_errados_transicao   | int    |                    |
| desarmes_*                 | int    |                    |
| chutes_no_gol, chutes_fora | int    |                    |
| rpe_partida                | int    | Opcional           |
| gols_marcados_* / gols_sofridos_* | int |                    |

Unique: (jogo_id, jogador_id).

---

### jogos_eventos
Eventos de tempo (time controls: entradas/saídas de jogadores no jogo).

| Coluna      | Tipo      | Uso                |
|-------------|-----------|--------------------|
| id          | uuid      | PK                 |
| jogo_id     | uuid      | FK → jogos         |
| jogador_id  | uuid      | FK → jogadores     |
| tipo_evento | varchar(10) |                  |
| minuto      | int       |                    |
| segundo     | int       |                    |
| created_at  | timestamp |                    |

---

### lesoes
Registro de lesões por jogador.

| Coluna        | Tipo        | Uso                |
|---------------|-------------|--------------------|
| id            | uuid        | PK                 |
| jogador_id    | uuid        | FK → jogadores     |
| data          | date        |                    |
| data_inicio   | date        |                    |
| data_fim      | date        | Opcional           |
| tipo          | varchar(100)|                    |
| localizacao   | varchar(100)|                    |
| lado          | varchar(20) | Opcional           |
| severidade    | varchar(50) | Opcional           |
| origem        | varchar(20) | Opcional           |
| dias_afastado | int         | Opcional           |
| created_at    | timestamp   |                    |

---

### avaliacoes_fisicas
Avaliações físicas por jogador e data.

| Coluna            | Tipo         | Uso                |
|------------------|--------------|--------------------|
| id               | uuid         | PK                 |
| jogador_id       | uuid         | FK → jogadores     |
| data             | date         |                    |
| peso, altura     | decimal(5,2) | Opcional           |
| gordura_corporal | decimal(5,2) | Opcional           |
| massa_muscular   | decimal(5,2) | Opcional           |
| vo2max, flexibilidade, velocidade, forca, agilidade | decimal | Opcional |
| peitoral, axilar, subescapular, triceps, abdominal, suprailiaca, coxa | decimal | Opcional |
| plano_acao       | varchar      | Opcional           |
| created_at       | timestamp    |                    |

Unique: (jogador_id, data).

---

### programacoes
Programação de treinos/atividades por equipe.

| Coluna      | Tipo         | Uso                |
|-------------|--------------|--------------------|
| id          | uuid         | PK                 |
| equipe_id   | uuid         | FK → equipes       |
| titulo      | varchar(255) |                    |
| data_inicio | date         |                    |
| data_fim    | date         |                    |
| is_ativo    | boolean      |                    |
| created_at  | timestamp    |                    |

---

### programacoes_dias
Dias/atividades dentro de uma programação.

| Coluna          | Tipo         | Uso                |
|-----------------|--------------|--------------------|
| id              | uuid         | PK                 |
| programacao_id  | uuid         | FK → programacoes  |
| data            | date         |                    |
| dia_semana      | varchar(20)  | Opcional           |
| dia_semana_numero | int        | Opcional           |
| atividade       | varchar(255) | Opcional           |
| horario         | varchar(10)  | Opcional           |
| localizacao     | varchar(255) | Opcional           |
| observacoes     | text         | Opcional           |
| exercicio_id    | varchar(50)  | Opcional           |
| carga_percent   | int          | Opcional           |
| created_at      | timestamp    |                    |

---

### campeonatos
Campeonatos (podem estar vinculados a uma equipe).

| Coluna      | Tipo         | Uso                |
|-------------|--------------|--------------------|
| id          | uuid         | PK                 |
| nome        | varchar(255) |                    |
| equipe_id   | uuid         | FK → equipes (opt.)|
| created_at  | timestamp    |                    |

---

### campeonatos_jogos
Jogos programados do campeonato (calendário).

| Coluna         | Tipo         | Uso                |
|----------------|--------------|--------------------|
| id             | uuid         | PK                 |
| campeonato_id  | uuid         | FK → campeonatos   |
| data           | date         |                    |
| horario        | varchar(10)  | Opcional           |
| equipe         | varchar(255) |                    |
| adversario     | varchar(255) |                    |
| competicao     | varchar(255) | Opcional           |
| local          | varchar(50)  | Opcional           |
| meta_pontuacao | varchar(255) | Opcional           |
| jogo_id        | uuid         | FK → jogos (opt.)  |
| created_at     | timestamp    |                    |

---

### competicoes
Competições (nome único, ex.: "Liga Nacional").

| Coluna     | Tipo         | Uso                |
|------------|--------------|--------------------|
| id         | uuid         | PK                 |
| nome       | varchar(255) | Único              |
| created_at | timestamp    |                    |

---

### metas_estatisticas
Metas de estatísticas por equipe.

| Coluna                 | Tipo      | Uso                |
|------------------------|-----------|--------------------|
| id                     | uuid      | PK                 |
| equipe_id              | uuid      | FK → equipes (opt.)|
| gols                   | int       |                    |
| assistencias           | int       |                    |
| passes_corretos        | int       |                    |
| passes_errados         | int       |                    |
| chutes_no_gol          | int       |                    |
| chutes_fora            | int       |                    |
| desarmes_com_posse     | int       |                    |
| desarmes_sem_posse     | int       |                    |
| desarmes_contra_ataque | int       |                    |
| erros_transicao        | int       |                    |
| created_at             | timestamp |                    |
| updated_at             | timestamp |                    |

---

## Fluxos principais que usam essas tabelas

- **Login:** `users` (email, password_hash), `roles` (role_id).
- **Tenant (todas as rotas protegidas):** `users` → `tecnicos` ou `clubes` → `equipes` → `equipe_ids`.
- **Criar jogador:** valida tenant; insere em `jogadores` e em `equipes_jogadores` (vínculo com equipe; se não houver equipe, o service pode criar "Elenco" em `equipes` para o técnico).
- **Criar jogo:** `jogos` (equipe_id, adversario, data, etc.); em seguida `jogos_estatisticas_equipe` e `jogos_estatisticas_jogador`.
- **Time controls:** `jogos_eventos`.
- **Avaliações físicas:** `avaliacoes_fisicas`.
- **Programação/semana:** `programacoes`, `programacoes_dias`.
- **Campeonatos e jogos programados:** `campeonatos`, `campeonatos_jogos`, `jogos` (jogo_id quando a partida for registrada).

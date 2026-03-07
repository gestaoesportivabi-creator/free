# Checklist: jogadores não carregam após login (GET /api/players vazio)

Use este checklist no **Supabase SQL Editor** para descobrir por que a lista de jogadores vem vazia. Substitua os placeholders pelos IDs reais (do usuário logado, do técnico, das equipes).

## 1. Migrações

Garantir que as migrações estão aplicadas, principalmente **009** e **011**. Ver [APLICAR_MIGRACOES_SUPABASE.md](APLICAR_MIGRACOES_SUPABASE.md). Ordem sugerida: 000, 001, ..., 012 (arquivos em [backend/migrations/](../migrations/)).

---

## 2. Usuário e técnico

Troque `<USER_ID>` pelo `id` do usuário logado (ex.: decodifique o JWT ou consulte a tabela `users` pelo email).

```sql
SELECT id, email, name, role_id FROM users WHERE id = '<USER_ID>';
SELECT id, user_id, nome FROM tecnicos WHERE user_id = '<USER_ID>';
```

- Se não existir linha em `tecnicos` (e nem em `clubes` para esse `user_id`), o tenant fica sem equipes e o backend retorna `[]`. **Solução**: criar registro em `tecnicos` (ou `clubes`) para esse `user_id`.

---

## 3. Equipes do técnico

Troque `<TECNICO_ID>` pelo `id` do técnico obtido no passo 2.

```sql
SELECT id, nome, tecnico_id, created_at FROM equipes WHERE tecnico_id = '<TECNICO_ID>';
```

- Se não houver equipes, GET /api/players retorna `[]`. **Solução**: criar ao menos uma equipe para esse `tecnico_id` ou cadastrar o primeiro jogador pelo app (o service cria a equipe "Elenco").

---

## 4. Vínculos jogador–equipe

Use os `id` das equipes do passo 3 em `<EQUIPE_ID_1>`, `<EQUIPE_ID_2>` (ou quantas tiver).

```sql
SELECT ej.id, ej.equipe_id, ej.jogador_id, ej.data_inicio, ej.data_fim
FROM equipes_jogadores ej
WHERE ej.equipe_id IN ('<EQUIPE_ID_1>', '<EQUIPE_ID_2>')
  AND ej.data_fim IS NULL;
```

- Se não retornar linhas, a API não encontra jogadores (condição: vínculo ativo com `data_fim` NULL). **Solução**: cadastrar jogadores pelo app (cria o vínculo) ou inserir linhas em `equipes_jogadores` ligando jogadores às equipes do tenant com `data_fim` NULL.

---

## 5. Jogadores no banco

```sql
SELECT id, nome, created_at FROM jogadores LIMIT 5;
```

- Confirma se existem jogadores. Se não houver, o vazio é esperado até haver cadastro (ou seed que popule também `equipes_jogadores`).

---

## Resposta da API com diagnóstico

O GET /api/players pode devolver um campo **`reason`** quando a lista vem vazia:

- **`no_teams`**: tenant sem equipes (`equipe_ids` vazio). Resolver com passo 2 e 3.
- **`no_players_linked`**: há equipes mas nenhum jogador vinculado com `data_fim` NULL. Resolver com passo 4.

Os logs do servidor (ex.: Vercel) também registram qual caso ocorreu.

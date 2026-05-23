# Acesso do atleta ao Scout 21 Pro

## Para a comissão técnica / clube

1. Abra **Gestão de Equipe → Elenco**.
2. Clique em **Novo atleta** (ou edite um atleta existente).
3. Preencha a ficha normalmente (nome, posição, etc.).
4. Na secção **Permitir login do atleta no app**:
   - Mantenha o checkbox ligado para criar acesso.
   - Informe **Email de acesso** (único no sistema).
   - Informe **Senha inicial** (mínimo 8 caracteres).
5. Salve o atleta.

Na edição, é possível:

- Alterar o email de acesso.
- Usar **Redefinir senha** + nova senha.
- Desligar **Acesso ativo** para bloquear o login (sem apagar o histórico de fisiologia).

## Para o atleta

1. Aceda à página de **Login** do Scout 21.
2. Use o **email** e a **senha** definidos pelo clube.
3. O menu mostra apenas:
   - **Hoje** — o que falta preencher
   - **PSE** / **PSR** / **Bem-estar diário**
   - **Meu perfil** (alterar senha)

O atleta **não** vê elenco, scout, relatórios nem dados de outros jogadores.

## Segurança

- Conta com role `ATLETA` e vínculo `users.jogador_id`.
- APIs de staff (`/api/players`, `/api/matches`, etc.) retornam 403 para atletas.
- Dados de fisiologia do atleta passam por `/api/me/*`, filtrados pelo `jogador_id` da sessão.

## Migração de base de dados

Execute a migration `backend/migrations/021_add_athlete_user.sql` (role `ATLETA` + coluna `users.jogador_id`).

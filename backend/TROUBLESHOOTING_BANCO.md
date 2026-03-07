# 🔧 Solução de Problemas - Conexão com Banco de Dados

## Erro: "Can't reach database server at db.xxx.supabase.co:5432"

Este erro indica que o backend **não consegue conectar** ao Supabase. Abaixo as soluções mais comuns:

---

## ✅ 1. Projeto Supabase Pausado (MAIS COMUM)

Projetos gratuitos do Supabase **pausam após 7 dias de inatividade**.

### Como resolver:

1. Acesse: **https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm**
2. Faça login via GitHub
3. Localize o projeto **jhjrqnggsfeztgkpqcjm**
4. Se aparecer **"Project paused"** ou **"Restore project"**, clique para **restaurar**
5. Aguarde 1-2 minutos para o banco voltar
6. Reinicie o backend: `npm run dev`

---

## ✅ 2. Usar Connection Pooler (Alternativa)

Se a conexão direta (porta 5432) falhar, tente o **Connection Pooler** do Supabase:

1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm) (login via GitHub)
2. Vá em: **Settings → Database**
3. Na seção **Connection Pooling**, copie a URL **"Transaction"** (porta 6543)
4. Adicione `?pgbouncer=true` no final da URL
5. Atualize o arquivo `backend/.env`:

```env
# Use a URL do Connection Pooler (Transaction mode)
DATABASE_URL=postgresql://postgres.jhjrqnggsfeztgkpqcjm:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Importante:** Substitua `[SENHA]` pela senha real (use `%23` no lugar de `#`) e `[REGIAO]` pela região do seu projeto (ex: `us-east-1`).

---

## ✅ 3. Verificar Credenciais

Confirme no Supabase Dashboard (Settings > Database):

- **Host:** db.jhjrqnggsfeztgkpqcjm.supabase.co
- **Senha:** A senha deve ter `#` codificado como `%23` na URL
- Exemplo: senha `#Gestaoesportiva21` → `%23Gestaoesportiva21`

---

## ✅ 4. Testar Conexão Manualmente

```powershell
cd backend
npx prisma db pull
```

Se funcionar, o schema será baixado. Se falhar, o problema é de rede ou credenciais.

---

## ✅ 5. Usar PostgreSQL Local (Desenvolvimento Offline)

Se o Supabase não estiver acessível, use Docker para rodar PostgreSQL localmente:

```powershell
docker run --name scout21pro-postgres -e POSTGRES_USER=scout21pro -e POSTGRES_PASSWORD=scout21pro -e POSTGRES_DB=scout21pro -p 5432:5432 -d postgres:14
```

Depois atualize o `backend/.env`:

```env
DATABASE_URL=postgresql://scout21pro:scout21pro@localhost:5432/scout21pro?schema=public
```

E execute as migrations:

```powershell
cd backend
npx prisma migrate dev --name init
npm run seed:demo
```

---

## 📞 Links Úteis

- **Dashboard Supabase:** https://supabase.com/dashboard/project/jhjrqnggsfeztgkpqcjm (login via GitHub)
- **Documentação Supabase:** https://supabase.com/docs/guides/database/connecting-to-postgres

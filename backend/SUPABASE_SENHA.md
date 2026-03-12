# Configurar senha do Supabase (projeto mymuvraqtnoqrtuzoimj)

1. Acesse: https://supabase.com/dashboard/project/mymuvraqtnoqrtuzoimj/settings/database
2. Em **Connection string**, clique em **URI** e copie a senha (ou use **Reset database password** se não souber)
3. Abra `backend/.env` e substitua **ambas** as ocorrências de `[SENHA]` pela senha real
4. Se a senha tiver o caractere `#`, troque por `%23` na URL
5. No **Vercel** (Settings → Environment Variables), atualize DATABASE_URL e DIRECT_URL com a mesma senha

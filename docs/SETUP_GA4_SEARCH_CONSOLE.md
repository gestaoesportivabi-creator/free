# Setup — GA4 e Google Search Console

Passo a passo para quem tem acesso à Vercel e ao Google. Não precisa de deploy nem de código — só configuração de painel.

## Situação atual

- O código do GA4 já está pronto no site (`index.html` + `utils/analytics.ts`), incluindo modo de consentimento (LGPD) e os eventos de cadastro (`signup_completed`, `signup_error`, cliques de CTA).
- **Fluxo Web:** Scout 21 · `https://scout21.com.br` · ID de medição **`G-JDLX263HXT`**
- `VITE_GA4_ID=G-JDLX263HXT` está em `21Scoutpro/.env.production` (e fallback no `index.html`).
- Na Vercel, ainda vale setar a mesma env em Production para ficar explícito no painel.
- Search Console: verificar se a propriedade `scout21.com.br` está confirmada.

---

## 1. Criar/obter o GA4 e pegar o ID

1. Acesse [analytics.google.com](https://analytics.google.com)
2. Se não existir propriedade do Scout21: **Admin → Criar propriedade** → nome "Scout21" → fuso horário Brasil
3. Em **Fluxos de dados → Web**, adicione o site `https://scout21.com.br`
4. Copie o **ID de medição** (formato `G-XXXXXXXXXX`)

## 2. Colocar o ID na Vercel

1. Acesse o projeto na Vercel → **Settings → Environment Variables**
2. Adicione:
   - Nome: `VITE_GA4_ID`
   - Valor: `G-XXXXXXXXXX` (o ID copiado acima)
   - Ambiente: **Production** (e Preview, se quiser testar antes)
3. Salve e faça um **redeploy** (a env var só entra em builds novos — um redeploy manual do último commit resolve)

## 3. Confirmar que está funcionando

1. Abra `https://scout21.com.br` numa aba anônima
2. No GA4, vá em **Relatórios → Tempo real** — deve aparecer 1 usuário ativo em poucos segundos
3. Teste um cadastro completo e confira se o evento `signup_completed` aparece em Tempo real → Eventos

## 4. Google Search Console

**Já pronto no site**
- Sitemap: `https://scout21.com.br/sitemap.xml` (robots.txt já aponta para ele)
- Meta de verificação: só aparece se `VITE_GSC_VERIFICATION` estiver no build (sem placeholder quebrado)

**O que só o Google / você fazem (conta Google)**

1. Abra [search.google.com/search-console](https://search.google.com/search-console) com a conta do Scout21 (`gestaoesportivabi@gmail.com` ou a que usa no Analytics)
2. **Adicionar propriedade**
   - Preferência rápida: tipo **Prefixo do URL** → `https://scout21.com.br`
   - (Domínio `scout21.com.br` também serve, mas exige TXT no DNS da Hostinger)
3. Método **Tag HTML** → copie o `content="..."` da meta (só o código, tipo `abc123...`)
4. Me mande esse código **ou** cole em `21Scoutpro/.env.production`:
   ```
   VITE_GSC_VERIFICATION=cole_o_codigo_aqui
   ```
5. Após o deploy, volte no Search Console e clique **Verificar**
6. **Sitemaps → Adicionar sitemap** → `sitemap.xml`
7. Em **Configurações → Usuários**, confirme o mesmo e-mail do GA4 se quiser unificar relatórios

### Critério de pronto (Search Console)

- [ ] Propriedade `https://scout21.com.br` (ou domínio) verificada
- [ ] Sitemap `sitemap.xml` enviado (status “Recebido” / sem erro)
- [ ] Meta `google-site-verification` visível no HTML da home (View Source)
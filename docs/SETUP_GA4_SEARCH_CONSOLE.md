# Setup — GA4 e Google Search Console

Passo a passo para quem tem acesso à Vercel e ao Google. Não precisa de deploy nem de código — só configuração de painel.

## Situação atual

- O código do GA4 já está pronto no site (`index.html` + `utils/analytics.ts`), incluindo modo de consentimento (LGPD) e os eventos de cadastro (`signup_completed`, `signup_error`, cliques de CTA).
- **Falta apenas a chave `VITE_GA4_ID`** — sem ela, o código não envia nada.
- Não há confirmação de que o site está verificado no Search Console.

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

1. Acesse [search.google.com/search-console](https://search.google.com/search-console)
2. **Adicionar propriedade** → tipo "Domínio" → `scout21.com.br`
3. Verificação: método **DNS (registro TXT)** — a Vercel/Hostinger só precisa adicionar o registro que o Google fornecer
   - Alternativa mais rápida se o DNS demorar: verificação por **tag HTML** (o Google dá uma meta tag pra colar no `index.html` — me avisem se escolherem esse caminho, é 2 minutos de código)
4. Depois de verificado: **Sitemaps → Adicionar sitemap** → `sitemap.xml`
   (o arquivo já existe e está correto: `https://scout21.com.br/sitemap.xml`, 58 URLs)

## Critério de pronto

- [ ] `VITE_GA4_ID` setado na Vercel + redeploy feito
- [ ] Tempo real do GA4 mostrando visitas
- [ ] Evento `signup_completed` aparecendo ao testar um cadastro
- [ ] Propriedade verificada no Search Console
- [ ] Sitemap enviado no Search Console

Com isso fechado, dá pra responder a pergunta que hoje não dá: **quantos visitantes viram cadastro, e de onde vieram.**

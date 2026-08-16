# Domínio scout21.com.br (Hostinger → Vercel)

**Canônico:** `https://scout21.com.br`  
**App no Vercel:** projeto `gestaoesportivabi-creator/free` (mesmo deploy front + `/api`)

## 1. Vercel — adicionar o domínio

1. Vercel → Project → **Settings → Domains**
2. Add `scout21.com.br` e `www.scout21.com.br`
3. Preferir apex (`scout21.com.br`) como primary; `www` → redirect 301 para apex
4. Copiar os registros DNS que o Vercel mostrar (A / CNAME)

## 2. Hostinger — DNS

No painel Hostinger (domínio `scout21.com.br` → **DNS / Zona DNS**):

| Tipo | Nome | Valor (exemplo — use o do painel Vercel) |
|------|------|------------------------------------------|
| **A** | `@` | `76.76.21.21` (IP que a Vercel indicar) |
| **CNAME** | `www` | `cname.vercel-dns.com` (ou o host que a Vercel indicar) |

- Remova A/CNAME antigos da Hostinger que apontem para parking/site builder se conflitar.
- Propagação: minutos a algumas horas.
- SSL: a Vercel emite automaticamente quando o DNS resolve.

**Não** hospede o site na Hostinger — só o DNS do domínio. O app continua no Vercel.

## 3. Variáveis de ambiente (Vercel)

Atualizar no projeto (Production):

```bash
FRONTEND_URL=https://scout21.com.br
CORS_ORIGIN=https://scout21.com.br
PUBLIC_API_URL=https://scout21.com.br
```

Opcional (e-mail — domínio verificado na Resend + caixa na Hostinger):

```bash
EMAIL_FROM=SCOUT21 <contato@scout21.com.br>
EMAIL_REPLY_TO=contato@scout21.com.br
# RESEND_API_KEY=... (já deve existir; manter)
```

## 7. E-mail — contato@scout21.com.br

A API usa **Resend** (`backend/src/services/email/email.service.ts`):

| Campo | Função |
|-------|--------|
| `EMAIL_FROM` | Remetente que aparece na caixa do destinatário |
| `EMAIL_REPLY_TO` | Para onde vai a resposta do utilizador |
| `RESEND_API_KEY` | Chave da Resend |

Defaults no código: `contato@scout21.com.br` (FROM + Reply-To).

### Checklist Hostinger + Resend

1. **Hostinger → E-mails**  
   Criar caixa `contato@scout21.com.br` (ou forward para o Gmail que você lê).

2. **Resend → Domains → Add `scout21.com.br`**  
   Copiar os registros (SPF, DKIM, opcional DMARC) para a zona DNS da Hostinger.  
   Aguardar status **Verified**.

3. **Vercel → Environment Variables (Production)**  
   ```
   EMAIL_FROM=SCOUT21 <contato@scout21.com.br>
   EMAIL_REPLY_TO=contato@scout21.com.br
   FRONTEND_URL=https://scout21.com.br
   ```
   Redeploy.

4. **Teste**  
   Cadastro em `/criar-conta` ou “esqueci a senha” — o e-mail deve chegar de `contato@scout21.com.br` e “Responder” deve ir para essa caixa.

**Atenção:** sem domínio verificado na Resend, o envio falha ou cai em spam. O domínio antigo `intersomos.com.br` deixa de ser o default.

## 4. Código (já no repo)

- `CANONICAL_ORIGIN` → `https://scout21.com.br` (`21Scoutpro/utils/seo.ts`)
- `index.html`, sitemap, robots.txt, OG/JSON-LD

## 5. Redirects dos hosts antigos

No Vercel, para `scout21.vercel.app` e `gestaoesportiva-free.vercel.app`, configurar redirect permanente para `https://scout21.com.br/:path*` (Domains → Redirect), ou usar `docs/legacy-redirect.vercel.json` no projeto legado.

## 6. Pós-go-live

- [ ] Abrir https://scout21.com.br e https://scout21.com.br/criar-conta
- [ ] Login + `/api/health`
- [ ] Search Console: propriedade `scout21.com.br` + enviar `sitemap.xml`
- [ ] Resend: SPF/DKIM/DMARC no DNS Hostinger (ver `PLANO_MESTRE_TRIAL_30D.md` §7.2)

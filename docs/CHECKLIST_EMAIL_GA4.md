# Checklist operacional — e-mail (P3-2) e GA4 (P3-3)

Itens que **não se fecham só com código**. Marque após validar em produção.

## P3-2 — Entregabilidade de e-mail (trial)

Fonte: Resend + domínio `scout21.com.br` (ver `docs/DOMINIO_SCOUT21.md`).

- [ ] SPF: `v=spf1 include:_spf.resend.com ~all` no DNS Hostinger
- [ ] DKIM: registros fornecidos pela Resend publicados e **Verified** no painel Resend
- [ ] DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@scout21.com.br`
- [ ] `EMAIL_FROM` / `EMAIL_REPLY_TO` apontam para o domínio verificado (não localhost)
- [ ] Teste real: cadastro trial → e-mail chega na **inbox** (não spam) em:
  - [ ] Gmail
  - [ ] Outlook / Hotmail
  - [ ] Yahoo

## P3-3 — GA4 funil de cadastro + Google Ads

- [ ] `VITE_GA4_ID=G-JDLX263HXT` no deploy de produção
- [ ] Consentimento aceito → hits em **Relatórios → Tempo real** (agora libera `ad_storage` também)
- [ ] Cadastro completo dispara `signup_completed` **e** `sign_up` (`trackSignupCompleted` em `SignUp.tsx`)
- [ ] GA4 ↔ Google Ads: propriedade vinculada
- [ ] Em GA4: marcar `sign_up` (e/ou `signup_completed`) como **evento-chave** / conversão
- [ ] Em Ads: importar a conversão a partir do GA4 **ou** definir:
  - `VITE_GOOGLE_ADS_ID=AW-…`
  - `VITE_GOOGLE_ADS_CONVERSION_ID=AW-…/label` no Vercel
- [ ] Propriedade do site verificada no Google Search Console (`scout21.com.br`)
- [ ] Funil revisado: landing CTA → `/criar-conta` → Aceitar cookies → cadastro → `sign_up` → Ads

Quando os dois blocos estiverem verdes, marque P3-2 e P3-3 no `docs/PLANO_ACABAMENTO_10.md`.

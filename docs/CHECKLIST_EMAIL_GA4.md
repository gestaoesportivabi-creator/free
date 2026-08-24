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

## P3-3 — GA4 funil de cadastro

- [ ] `VITE_GA4_ID=G-JDLX263HXT` no deploy de produção
- [ ] Consentimento aceito → hits em **Relatórios → Tempo real**
- [ ] Cadastro completo dispara evento `signup_completed` (já instrumentado em `SignUp.tsx`)
- [ ] Propriedade do site verificada no Google Search Console (`scout21.com.br`)
- [ ] Funil revisado: landing CTA → `/criar-conta` → `signup_completed` → `/bem-vindo`

Quando os dois blocos estiverem verdes, marque P3-2 e P3-3 no `docs/PLANO_ACABAMENTO_10.md`.

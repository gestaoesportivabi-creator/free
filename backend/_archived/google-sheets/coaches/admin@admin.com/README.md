# Treinador: Administrador

## 📋 Informações

- **Email:** admin@admin.com
- **Time:** Admin Team
- **Esporte:** futsal
- **Criado em:** 05/01/2026

## 🚀 Próximos Passos

### Opção 1: Usar Localmente (Rápido) ⚡

Você já pode fazer login no sistema:

```bash
npm run dev
```

Acesse: http://localhost:5173
- Email: admin@admin.com
- Senha: (a que você definiu)

⚠️ **Nota:** Os dados serão salvos localmente (localStorage).

---

### Opção 2: Configurar Google Sheets (Completo)

Para sincronizar com Google Sheets:

#### 1. Criar Planilha

1. Acesse: https://sheets.google.com
2. Crie nova planilha: **"Admin Team - Scout 21 Pro"**

#### 2. Criar Abas

Crie estas 11 abas (exatamente com estes nomes):

1. players
2. matches
3. match_player_stats
4. injuries
5. assessments
6. schedules
7. schedule_days
8. competitions
9. stat_targets
10. time_controls
11. championship_matches

#### 3. Adicionar Headers

Veja os headers em: `GOOGLE_SHEETS_SETUP.md`

#### 4. Configurar Apps Script

1. Na planilha: Extensões > Apps Script
2. Cole o código de: `google-apps-script-COMPLETO.js`
3. Atualize o SPREADSHEET_ID
4. Implante como Web App

#### 5. Configurar no Sistema

Edite: `src/config.ts`

```typescript
export const API_URL = 'SUA_URL_DO_APPS_SCRIPT';
```

---

## ✅ Status

- [x] Treinador criado
- [ ] Planilha configurada (opcional)
- [ ] Apps Script implantado (opcional)

---

**🏆 Pronto para começar!**

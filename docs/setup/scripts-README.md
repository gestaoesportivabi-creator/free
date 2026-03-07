# 🛠️ Scripts CLI - Scout 21 Pro

Scripts para gerenciar treinadores do sistema.

## 📋 Comandos Disponíveis

### 1. Criar Novo Treinador

```bash
node scripts/create-coach.js
```

Cria um novo treinador com pasta e configuração próprias.

**Dados solicitados:**
- Nome completo
- Email (será o login)
- Senha
- Nome do time
- Esporte (futsal, futebol, etc)
- URL da foto (opcional)

**O que é criado:**
- Pasta em `data/coaches/{email}/`
- Arquivo `config.json` com dados do treinador
- Arquivo `spreadsheet-id.txt` para configurar planilha
- Arquivo `README.md` com instruções

---

### 2. Listar Treinadores

```bash
node scripts/list-coaches.js
```

Lista todos os treinadores cadastrados com suas informações.

**Informações exibidas:**
- Nome e email
- Time e esporte
- Status (ativo/inativo)
- Status da planilha (configurada/pendente)
- Data de criação

---

### 3. Deletar Treinador

```bash
node scripts/delete-coach.js [email]
```

**Exemplo:**
```bash
node scripts/delete-coach.js joao@email.com
```

⚠️ **ATENÇÃO:** Esta ação é IRREVERSÍVEL!

Remove completamente o treinador e sua pasta com todos os dados.

---

## 📁 Estrutura de Dados

Cada treinador tem sua própria pasta:

```
data/
└── coaches/
    └── joao@email.com/
        ├── config.json           # Configuração do treinador
        ├── spreadsheet-id.txt    # ID da planilha Google Sheets
        └── README.md             # Instruções passo a passo
```

### Arquivo config.json

```json
{
  "id": "uuid-gerado",
  "name": "João Silva",
  "email": "joao@email.com",
  "passwordHash": "hash-sha256",
  "teamName": "AFC Lions",
  "sport": "futsal",
  "photoUrl": "https://...",
  "role": "Treinador",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "spreadsheetId": "",
  "active": true
}
```

---

## 🔐 Segurança

- Senhas são armazenadas com hash SHA-256
- Email é usado como identificador único
- Cada treinador tem acesso apenas aos seus dados
- Planilhas do Google Sheets são privadas por padrão

---

## 🚀 Fluxo Completo

### 1. Criar Treinador

```bash
node scripts/create-coach.js
```

### 2. Configurar Google Sheets

1. Criar planilha no Google Sheets
2. Criar as abas necessárias (ver `GOOGLE_SHEETS_SETUP.md`)
3. Configurar Google Apps Script
4. Copiar ID da planilha

### 3. Adicionar ID da Planilha

```bash
# Editar o arquivo spreadsheet-id.txt
echo "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" > data/coaches/joao@email.com/spreadsheet-id.txt
```

### 4. Testar Login

Acesse http://localhost:5173 e faça login com:
- Email: joao@email.com
- Senha: (a que você definiu)

---

## 🔄 Integração com o Sistema

O sistema React busca os dados dos treinadores em:

**Desenvolvimento Local:**
- Lê `data/coaches/` diretamente (via API Node.js)

**Produção (Deploy):**
- API backend fornece lista de treinadores
- Autenticação via JWT ou similar
- Cada treinador acessa apenas sua planilha

---

## 📝 Notas Importantes

1. **Backup:** Faça backup regular da pasta `data/coaches/`
2. **Senhas:** Use senhas fortes em produção
3. **Planilhas:** Cada treinador deve ter sua própria planilha
4. **Permissões:** Configure permissões corretas nas planilhas do Google

---

## 🆘 Solução de Problemas

### Erro ao criar treinador:

```
❌ Email inválido!
```
- Verifique o formato do email (deve ter @ e domínio)

### Treinador já existe:

```
❌ Treinador com email joao@email.com já existe!
```
- Use outro email ou delete o treinador existente primeiro

### Não consegue fazer login:

1. Verifique se o email está correto
2. Verifique se a senha está correta
3. Execute `node scripts/list-coaches.js` para ver treinadores ativos
4. Verifique se `active: true` no config.json

---

## 🔧 Manutenção

### Reativar treinador inativo:

```bash
# Editar config.json manualmente
vim data/coaches/joao@email.com/config.json
# Mudar "active": false para "active": true
```

### Resetar senha:

```bash
# Gerar novo hash
node -e "console.log(require('crypto').createHash('sha256').update('nova-senha').digest('hex'))"
# Atualizar passwordHash no config.json
```

---

Para mais informações, consulte a documentação principal do projeto.


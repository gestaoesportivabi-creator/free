#!/usr/bin/env node

/**
 * Script CLI para criar treinadores com integração Google Drive
 * Cria automaticamente pasta e planilha no Drive
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const {
  authorize,
  createDriveFolder,
  createSpreadsheet,
  setupSpreadsheetStructure,
  installAppsScript
} = require('./google-drive-setup');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DATA_DIR = path.join(__dirname, '..', 'data', 'coaches');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function createCoachWithDrive() {
  console.log('\n🏆 SCOUT 21 PRO - Criar Treinador com Google Drive\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Coletar dados do treinador
    const name = await question('👤 Nome completo: ');
    if (!name.trim()) {
      console.error('❌ Nome é obrigatório!');
      rl.close();
      return;
    }

    let email = await question('📧 Email (será o login): ');
    email = email.trim().toLowerCase();
    
    if (!isValidEmail(email)) {
      console.error('❌ Email inválido!');
      rl.close();
      return;
    }

    const coachDir = path.join(DATA_DIR, email);
    if (fs.existsSync(coachDir)) {
      console.error(`❌ Treinador com email ${email} já existe!`);
      rl.close();
      return;
    }

    const password = await question('🔒 Senha: ');
    if (password.length < 4) {
      console.error('❌ Senha deve ter no mínimo 4 caracteres!');
      rl.close();
      return;
    }

    const teamName = await question('⚽ Nome do time: ');
    if (!teamName.trim()) {
      console.error('❌ Nome do time é obrigatório!');
      rl.close();
      return;
    }

    const sport = await question('🏃 Esporte (futsal/futebol/handebol/basquete) [futsal]: ') || 'futsal';
    const photoUrl = await question('📷 URL da foto (opcional, Enter para pular): ') || '';

    console.log('\n📋 Resumo dos Dados:\n');
    console.log(`Nome: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Time: ${teamName}`);
    console.log(`Esporte: ${sport}`);
    console.log(`Foto: ${photoUrl || 'Nenhuma'}`);

    const confirm = await question('\n✅ Confirmar criação? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
      console.log('❌ Criação cancelada.');
      rl.close();
      return;
    }

    // 2. Autorizar Google Drive
    console.log('\n🔐 Autorizando Google Drive...');
    const auth = await authorize();
    console.log('✅ Autorizado com sucesso!');

    // 3. Criar estrutura local
    console.log('\n📁 Criando estrutura local...');
    ensureDir(DATA_DIR);
    ensureDir(coachDir);

    const coachId = crypto.randomUUID();
    
    // 4. Criar pasta no Google Drive
    console.log('\n☁️  Criando pasta no Google Drive...');
    const folderName = `Scout 21 Pro - ${teamName}`;
    const folder = await createDriveFolder(auth, folderName);
    
    // 5. Criar planilha
    console.log('\n📊 Criando Google Sheets...');
    const spreadsheetTitle = `${teamName} - Dados`;
    const spreadsheet = await createSpreadsheet(auth, spreadsheetTitle, folder.id);
    
    // 6. Configurar estrutura da planilha
    console.log('\n⚙️  Configurando estrutura da planilha...');
    await setupSpreadsheetStructure(auth, spreadsheet.spreadsheetId);
    
    // 7. Preparar Apps Script
    console.log('\n📝 Preparando Google Apps Script...');
    const scriptCode = await installAppsScript(auth, spreadsheet.spreadsheetId);
    
    // Salvar código do script para referência
    const scriptPath = path.join(coachDir, 'apps-script.js');
    fs.writeFileSync(scriptPath, scriptCode);
    console.log(`✅ Código salvo em: ${scriptPath}`);

    // 8. Salvar configuração do treinador
    const coachData = {
      id: coachId,
      name: name.trim(),
      email: email,
      passwordHash: hashPassword(password),
      teamName: teamName.trim(),
      sport: sport.toLowerCase(),
      photoUrl: photoUrl.trim(),
      role: 'Treinador',
      createdAt: new Date().toISOString(),
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      driveFolderId: folder.id,
      driveFolderUrl: folder.webViewLink,
      active: true
    };

    const configPath = path.join(coachDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(coachData, null, 2));
    console.log(`✅ Configuração salva: ${configPath}`);

    // Salvar ID da planilha
    const spreadsheetIdPath = path.join(coachDir, 'spreadsheet-id.txt');
    fs.writeFileSync(spreadsheetIdPath, spreadsheet.spreadsheetId);

    // Criar README
    const readmePath = path.join(coachDir, 'README.md');
    const readmeContent = `# Treinador: ${name}

## 📋 Informações

- **Email:** ${email}
- **Time:** ${teamName}
- **Esporte:** ${sport}
- **Criado em:** ${new Date().toLocaleDateString('pt-BR')}

## ☁️  Google Drive

### Pasta
- **Link:** ${folder.webViewLink}
- **ID:** ${folder.id}

### Planilha
- **Link:** ${spreadsheet.spreadsheetUrl}
- **ID:** ${spreadsheet.spreadsheetId}

## 📝 Próximos Passos

### 1. Configurar Google Apps Script

1. Abra a planilha: ${spreadsheet.spreadsheetUrl}
2. Vá em **Extensões > Apps Script**
3. Copie o conteúdo do arquivo: \`apps-script.js\` (nesta pasta)
4. Cole no editor do Apps Script
5. Clique em **Salvar** (💾)
6. Clique em **Implantar > Nova implantação**
7. Escolha **Aplicativo da Web**
8. Configure:
   - **Executar como:** Eu (${email})
   - **Quem tem acesso:** Qualquer pessoa
9. Clique em **Implantar**
10. **Copie a URL gerada** (algo como: https://script.google.com/macros/s/.../exec)

### 2. Configurar URL da API

Edite o arquivo: \`src/config.ts\` no projeto React

\`\`\`typescript
export const API_URL = 'SUA_URL_AQUI';
\`\`\`

### 3. Fazer Login

Acesse: http://localhost:5173

- **Email:** ${email}
- **Senha:** (a que você definiu)

## ✅ Estrutura Criada

- ✅ Pasta no Google Drive
- ✅ Planilha criada com 11 abas
- ✅ Headers configurados
- ✅ Dados iniciais adicionados
- ✅ Apps Script preparado (precisa implantar)
- ✅ Configuração local salva

## 🔗 Links Rápidos

- [Abrir Pasta no Drive](${folder.webViewLink})
- [Abrir Planilha](${spreadsheet.spreadsheetUrl})
- [Google Apps Script](${spreadsheet.spreadsheetUrl}/edit#gid=0) (Extensões > Apps Script)

---

**🏆 Scout 21 Pro - Tudo configurado e pronto para usar!**
`;
    fs.writeFileSync(readmePath, readmeContent);

    // Resultado final
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TREINADOR CRIADO COM SUCESSO!\n');
    console.log('📁 Estrutura Local:', coachDir);
    console.log('☁️  Pasta Drive:', folder.webViewLink);
    console.log('📊 Planilha:', spreadsheet.spreadsheetUrl);
    console.log('\n📝 Próximos passos:');
    console.log('1. Configurar Google Apps Script (veja README.md)');
    console.log('2. Copiar URL do Web App para config.ts');
    console.log('3. Fazer login no sistema');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: (a que você definiu)`);
    console.log('\n📖 Leia o README.md na pasta do treinador para mais detalhes.');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro ao criar treinador:', error.message);
    if (error.code === 'ENOENT' && error.path?.includes('google-credentials.json')) {
      console.log('\n💡 Execute: node scripts/setup-google-credentials.js');
    }
  } finally {
    rl.close();
  }
}

// Executar
createCoachWithDrive();


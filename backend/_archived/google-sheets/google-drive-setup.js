#!/usr/bin/env node

/**
 * Script para configurar integração com Google Drive
 * Cria pasta e planilha automaticamente para cada treinador
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects'
];

const TOKEN_PATH = path.join(__dirname, 'google-token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');

/**
 * Lê credenciais do arquivo
 */
function loadCredentials() {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Arquivo google-credentials.json não encontrado!');
    console.log('\n📋 Para configurar:');
    console.log('1. Acesse: https://console.cloud.google.com');
    console.log('2. Crie um novo projeto (ou use existente)');
    console.log('3. Habilite as APIs:');
    console.log('   - Google Drive API');
    console.log('   - Google Sheets API');
    console.log('   - Apps Script API');
    console.log('4. Crie credenciais OAuth 2.0');
    console.log('5. Baixe o JSON e salve como: scripts/google-credentials.json');
    console.log('\n📖 Veja: GOOGLE_DRIVE_SETUP.md para instruções completas\n');
    process.exit(1);
  }
}

/**
 * Autoriza e retorna cliente autenticado
 */
async function authorize() {
  const credentials = loadCredentials();
  const config = credentials.installed || credentials.web;
  const { client_secret, client_id } = config;
  const redirect_uri = config.redirect_uris?.[0] || config.javascript_origins?.[0] || 'http://localhost';

  console.log('\n🔎 Debug Configuração OAuth:');
  console.log(`   Client ID: ...${String(client_id).slice(-6)}`);
  console.log(`   Redirect URI sendo usada: ${redirect_uri}`);
  if (redirect_uri === 'http://localhost' && config.redirect_uris?.[0] !== 'http://localhost') {
    console.log('   ⚠️  Aviso: As credenciais podem não estar configuradas para localhost.');
    console.log('   Se der erro 400, adicione http://localhost nas REdirect URIs do console.');
  }

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  // Verificar se já temos token salvo
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Obter novo token
  return getNewToken(oAuth2Client);
}

/**
 * Obtém novo token de autorização
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 Autorize o acesso visitando esta URL:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const askForCode = () => {
      rl.question('📝 Cole o código de autorização (ou a URL completa da barra de endereços): ', (input) => {
        let code = input.trim();

        // Check if empty
        if (!code) {
          console.log('⚠️  Entrada vazia. Por favor, cole o código ou a URL.');
          return askForCode(); // Ask again
        }

        // Check if it's the base URL without code
        if (code.match(/^http:\/\/localhost(:\d+)?\/?$/)) {
          console.log('⚠️  Você colou apenas a URL base. Preciso da URL completa que contém "?code=..."');
          console.log('   Dica: Faça o login no navegador e copie TUDO da barra de endereços.');
          return askForCode(); // Ask again
        }

        // Auto-fix: Check for URL with code param
        if (code.includes('code=')) {
          const match = code.match(/code=([^&]+)/);
          if (match && match[1]) {
            code = decodeURIComponent(match[1]);
            console.log('✨ Detectei uma URL! Extraindo o código automaticamente...');
          } else {
            console.log('⚠️  Parece uma URL, mas não consegui extrair o código.');
            return askForCode();
          }
        }

        rl.close();

        oAuth2Client.getToken(code, (err, token) => {
          if (err) {
            console.error('❌ Erro ao obter token:', err.response?.data || err.message);
            // Instead of rejecting, maybe offer to try again?
            // For now, let's reject to avoid infinite loops on real API errors
            return reject(err);
          }
          oAuth2Client.setCredentials(token);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
          console.log('✅ Token salvo em:', TOKEN_PATH);
          resolve(oAuth2Client);
        });
      });
    };

    askForCode();
  });
}

/**
 * Cria pasta no Google Drive
 */
async function createDriveFolder(auth, folderName) {
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink',
    });

    console.log(`✅ Pasta criada: ${response.data.name}`);
    console.log(`📁 ID: ${response.data.id}`);
    console.log(`🔗 Link: ${response.data.webViewLink}`);

    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar pasta:', error.message);
    throw error;
  }
}

/**
 * Cria Google Sheets na pasta
 */
async function createSpreadsheet(auth, title, folderId) {
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Criar planilha
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title,
        },
      },
    });

    const spreadsheetId = response.data.spreadsheetId;
    console.log(`✅ Planilha criada: ${title}`);
    console.log(`📊 ID: ${spreadsheetId}`);

    // Mover para a pasta (se fornecida)
    if (folderId) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        fields: 'id, parents',
      });
      console.log(`✅ Planilha movida para a pasta`);
    } else {
      console.log(`✅ Planilha criada na raiz do Drive`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar planilha:', error.message);
    throw error;
  }
}

/**
 * Configura abas e headers na planilha
 */
async function setupSpreadsheetStructure(auth, spreadsheetId) {
  const sheets = google.sheets({ version: 'v4', auth });

  const tabs = [
    { name: 'players', headers: ['id', 'name', 'nickname', 'position', 'photoUrl', 'jerseyNumber', 'dominantFoot', 'age', 'height', 'lastClub', 'isTransferred', 'transferDate'] },
    { name: 'matches', headers: ['id', 'competition', 'opponent', 'location', 'date', 'result', 'videoUrl', 'team_minutesPlayed', 'team_goals', 'team_goalsConceded', 'team_assists', 'team_yellowCards', 'team_redCards', 'team_passesCorrect', 'team_passesWrong', 'team_wrongPassesTransition', 'team_tacklesWithBall', 'team_tacklesCounterAttack', 'team_tacklesWithoutBall', 'team_shotsOnTarget', 'team_shotsOffTarget', 'team_rpeMatch', 'team_goalsScoredOpenPlay', 'team_goalsScoredSetPiece', 'team_goalsConcededOpenPlay', 'team_goalsConcededSetPiece'] },
    { name: 'match_player_stats', headers: ['id', 'matchId', 'playerId', 'minutesPlayed', 'goals', 'goalsConceded', 'assists', 'yellowCards', 'redCards', 'passesCorrect', 'passesWrong', 'wrongPassesTransition', 'tacklesWithBall', 'tacklesCounterAttack', 'tacklesWithoutBall', 'shotsOnTarget', 'shotsOffTarget', 'rpeMatch', 'goalsScoredOpenPlay', 'goalsScoredSetPiece', 'goalsConcededOpenPlay', 'goalsConcededSetPiece'] },
    { name: 'injuries', headers: ['id', 'playerId', 'date', 'endDate', 'type', 'location', 'severity', 'daysOut'] },
    { name: 'assessments', headers: ['id', 'playerId', 'date', 'chest', 'axilla', 'subscapular', 'triceps', 'abdominal', 'suprailiac', 'thigh', 'bodyFatPercent', 'actionPlan'] },
    { name: 'schedules', headers: ['id', 'startDate', 'endDate', 'title', 'createdAt', 'isActive'] },
    { name: 'schedule_days', headers: ['id', 'scheduleId', 'date', 'weekday', 'activity', 'time', 'location', 'notes'] },
    { name: 'competitions', headers: ['name'] },
    { name: 'stat_targets', headers: ['id', 'goals', 'assists', 'passesCorrect', 'passesWrong', 'shotsOn', 'shotsOff', 'tacklesPossession', 'tacklesNoPossession', 'tacklesCounter', 'transitionError'] },
    { name: 'time_controls', headers: ['id', 'matchId', 'playerId', 'periods'] },
    { name: 'championship_matches', headers: ['id', 'date', 'time', 'team', 'opponent', 'competition'] },
  ];

  try {
    // Pegar informações da planilha atual
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    // Criar todas as abas PRIMEIRO
    const requests = tabs.map(tab => ({
      addSheet: {
        properties: {
          title: tab.name
        }
      }
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests }
    });

    console.log('✅ Abas criadas');

    // DEPOIS deletar aba padrão (Sheet1)
    const defaultSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Sheet1');
    if (defaultSheet) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          requestBody: {
            requests: [{
              deleteSheet: {
                sheetId: defaultSheet.properties.sheetId
              }
            }]
          }
        });
        console.log('🗑️  Aba padrão "Sheet1" removida');
      } catch (e) {
        console.warn('⚠️  Não foi possível deletar Sheet1 (pode ser a única restante ou erro não crítico)');
      }
    }

    // Adicionar headers em cada aba
    for (const tab of tabs) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${tab.name}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [tab.headers]
        }
      });
    }

    console.log('✅ Headers adicionados');

    // Adicionar dados iniciais
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'competitions!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Copa Santa Catarina'],
          ['Série Prata'],
          ['JASC']
        ]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'stat_targets!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['default', 3, 3, 30, 5, 8, 5, 10, 10, 5, 2]
        ]
      }
    });

    console.log('✅ Dados iniciais adicionados');

  } catch (error) {
    console.error('❌ Erro ao configurar estrutura:', error.message);
    throw error;
  }
}

/**
 * Instala Google Apps Script na planilha
 */
async function installAppsScript(auth, spreadsheetId) {
  console.log('\n📝 Instalando Google Apps Script...');

  // Ler o código do Apps Script
  const scriptPath = path.join(__dirname, '..', 'google-apps-script.js');
  let scriptCode = fs.readFileSync(scriptPath, 'utf8');

  // Substituir SPREADSHEET_ID
  scriptCode = scriptCode.replace(
    /const SPREADSHEET_ID = ['"].*?['"]/,
    `const SPREADSHEET_ID = '${spreadsheetId}'`
  );

  console.log('✅ Código do Apps Script preparado');
  console.log('\n⚠️  ATENÇÃO: A instalação automática do Apps Script requer configuração adicional.');
  console.log('📋 Por enquanto, você precisará:');
  console.log('1. Abrir a planilha no Google Sheets');
  console.log('2. Ir em Extensões > Apps Script');
  console.log('3. Colar o código e implantar como Web App');
  console.log('\n💡 O código já foi ajustado com o SPREADSHEET_ID correto.');

  return scriptCode;
}

module.exports = {
  authorize,
  createDriveFolder,
  createSpreadsheet,
  setupSpreadsheetStructure,
  installAppsScript
};

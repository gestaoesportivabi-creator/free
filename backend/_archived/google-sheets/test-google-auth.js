#!/usr/bin/env node

/**
 * Script para testar autorização com Google Drive
 */

const { authorize } = require('./google-drive-setup');

async function testAuth() {
  console.log('\n🔐 Testando Autorização Google Drive\n');
  console.log('═'.repeat(60));
  
  try {
    console.log('📝 Iniciando processo de autorização...\n');
    
    const auth = await authorize();
    
    console.log('\n✅ AUTORIZAÇÃO BEM-SUCEDIDA!');
    console.log('═'.repeat(60));
    console.log('\n💾 Token salvo em: scripts/google-token.json');
    console.log('\n🎯 Agora você pode usar:');
    console.log('   node scripts/create-coach-drive.js\n');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO na autorização:');
    console.error(error.message);
    console.log('\n💡 Verifique:');
    console.log('1. Arquivo google-credentials.json existe');
    console.log('2. APIs estão habilitadas no Google Cloud');
    console.log('3. Tela de consentimento configurada');
    console.log('\n📖 Veja: GOOGLE_DRIVE_SETUP.md\n');
    console.log('═'.repeat(60) + '\n');
  }
}

testAuth();


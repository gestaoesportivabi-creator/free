/**
 * Serverless Function Entry Point para Vercel
 * Wrapper do Express App para funcionar como serverless function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Importar o app Express compilado dinamicamente
// O backend compila para CommonJS
const getApp = () => {
  try {
    const path = require('path');
    const fs = require('fs');
    
    // Tentar diferentes caminhos possíveis
    const possiblePaths = [
      path.join(__dirname, '../backend/dist/app.js'),
      path.join(process.cwd(), 'backend/dist/app.js'),
      '../backend/dist/app.js',
      './backend/dist/app.js',
    ];
    
    let backendApp;
    let foundPath = null;
    
    for (const tryPath of possiblePaths) {
      try {
        const resolvedPath = path.resolve(tryPath);
        if (fs.existsSync(resolvedPath)) {
          console.log('✅ Backend encontrado em:', resolvedPath);
          backendApp = require(resolvedPath);
          foundPath = resolvedPath;
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }
    
    if (!backendApp) {
      throw new Error(`Backend não encontrado. Tentados: ${possiblePaths.join(', ')}`);
    }
    
    console.log('✅ Backend carregado com sucesso de:', foundPath);
    return backendApp.default || backendApp;
  } catch (error: any) {
    console.error('❌ Erro ao carregar backend:', error);
    console.error('❌ Caminho atual (__dirname):', __dirname);
    console.error('❌ Caminho atual (process.cwd):', process.cwd());
    throw error;
  }
};

// Cache do app para evitar recarregar a cada requisição
let cachedApp: any = null;

// Handler serverless para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Carregar o app na primeira requisição
    if (!cachedApp) {
      cachedApp = getApp();
    }
    
    // Garantir que o path comece com /api se necessário
    // O Vercel pode passar o path sem o prefixo /api após o rewrite
    const originalUrl = req.url || '';
    if (!originalUrl.startsWith('/api') && !originalUrl.startsWith('/health')) {
      req.url = `/api${originalUrl}`;
    }
    
    // O app Express já está configurado com todas as rotas
    // Apenas passar o request e response para ele
    return cachedApp(req as any, res as any);
  } catch (error: any) {
    console.error('❌ Erro no handler:', error);
    console.error('❌ URL:', req.url);
    console.error('❌ Method:', req.method);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error?.message || 'Erro desconhecido'
      });
    }
  }
}

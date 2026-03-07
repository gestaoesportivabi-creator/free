import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ React app rendered successfully');
} catch (error) {
  console.error('❌ Error rendering React app:', error);
  rootElement.innerHTML = `
    <div style="color: white; padding: 20px; font-family: Arial; background: black; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 500px;">
        <h1 style="color: #ff4444; margin-bottom: 20px;">Erro ao carregar a aplicação</h1>
        <p style="color: #ccc; margin-bottom: 10px;">${error instanceof Error ? error.message : String(error)}</p>
        <p style="color: #888; margin-bottom: 20px;">Por favor, abra o console do navegador (F12) para mais detalhes.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #00f0ff; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
          Recarregar Página
        </button>
      </div>
    </div>
  `;
}

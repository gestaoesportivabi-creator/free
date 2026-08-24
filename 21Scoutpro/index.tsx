import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConsentBanner } from './components/ConsentBanner';
import { NewsletterPopup } from './components/NewsletterPopup';
import { shouldBootPublicApp } from './publicBoot';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

function renderShell(children: React.ReactNode) {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        {children}
        <ConsentBanner />
        <NewsletterPopup />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

async function boot() {
  try {
    if (shouldBootPublicApp()) {
      const { PublicApp } = await import('./PublicApp');
      renderShell(<PublicApp />);
    } else {
      const { default: App } = await import('./App');
      renderShell(<App />);
    }

    if (typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/newsletter') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scout21:newsletter-open'));
      }, 400);
    }
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    rootElement.innerHTML = `
    <div style="color: white; padding: 20px; font-family: Arial; background: black; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 500px;">
        <h1 style="color: #ff4444; margin-bottom: 20px;">Erro ao carregar a aplicação</h1>
        <p style="color: #ccc; margin-bottom: 10px;">${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #00f0ff; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
          Recarregar Página
        </button>
      </div>
    </div>
  `;
  }
}

void boot();

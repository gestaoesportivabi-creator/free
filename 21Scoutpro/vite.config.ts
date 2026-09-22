import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Substitui %VITE_*% no index.html pelo valor do env (fallback string vazia). */
function htmlEnvPlaceholders(mode: string): Plugin {
  return {
    name: 'html-env-placeholders',
    transformIndexHtml(html) {
      const env = loadEnv(mode, process.cwd(), 'VITE_');
      return html.replace(/%VITE_([A-Z0-9_]+)%/g, (_match, key: string) => {
        const full = `VITE_${key}`;
        return env[full] ?? '';
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), htmlEnvPlaceholders(mode)],
  server: {
    proxy: {
      '/api': {
        target: 'https://scout21.com.br',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
}));

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild', // Usar esbuild ao invés de terser (mais rápido e já incluído)
  },
});
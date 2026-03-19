import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  resolve: {
    alias: {
      '@pdf-builder/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});

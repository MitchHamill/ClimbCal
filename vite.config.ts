import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      types: path.resolve(__dirname, 'src/types'),
      calendar: path.resolve(__dirname, 'public/calendar/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    cssMinify: 'esbuild',
  },
});

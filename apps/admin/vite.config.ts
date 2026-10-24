import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: process.env.SITEABOARD_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4310,
    strictPort: true,
    cors: false,
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.local/**', '*.{pem,key}'] },
  },
  preview: { host: '127.0.0.1', port: 4310, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
});

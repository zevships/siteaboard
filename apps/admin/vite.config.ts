import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const local = process.env.SITEABOARD_DATA_SOURCE === 'local';
export default defineConfig({
  define: { __SITEABOARD_DATA_SOURCE__: JSON.stringify(local ? 'local' : 'demo') },
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: local ? '/' : (process.env.SITEABOARD_BASE_PATH ?? '/'),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4310,
    strictPort: true,
    cors: false,
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.local/**', '*.{pem,key}'] },
  },
  preview: { host: '127.0.0.1', port: 4310, strictPort: true },
  build: { outDir: local ? 'dist-local' : 'dist', emptyOutDir: true, sourcemap: false },
});

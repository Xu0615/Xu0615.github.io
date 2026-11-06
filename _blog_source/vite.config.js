import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: '/blog/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { app: resolve(import.meta.dirname, 'src/app.js') },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunk-[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});

// Se importa desde vitest/config para poder declarar la sección `test`.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // En desarrollo el proxy evita configurar CORS por cada puerto.
    proxy: {
      '/api': {
        target: process.env['VITE_API_PROXY_TARGET'] ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Montar jsdom cuesta varios segundos por archivo y ese coste lo absorbe la
    // primera prueba de cada uno. Con el límite por defecto de 5s, la primera
    // prueba fallaba de forma intermitente sin que hubiera nada lento en ella.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Hilos en lugar de procesos: cada proceso arranca su propio Node y su propio
    // jsdom, y con veinte archivos la máquina se queda sin recursos antes de que
    // los workers respondan. Los hilos comparten proceso y arrancan mucho antes.
    pool: 'threads',
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: ['src/test/**', '**/*.config.*'],
    },
  },
});

import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT is only used by the dev server — never during a production build.
// Falls back to 5173 when the variable is absent (Vercel CI, local builds, etc.).
const port = Number(process.env.PORT ?? 5173);

// BASE_PATH is a Replit path-routing prefix. Defaults to '/' on Vercel.
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    // Split the bundle so each lazy-loaded page is its own chunk
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom'],
          // Routing
          'vendor-router': ['wouter'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // QR scanner (large — keep separate)
          'vendor-scanner': ['@zxing/browser', '@zxing/library'],
          // Date utility
          'vendor-date': ['date-fns'],
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

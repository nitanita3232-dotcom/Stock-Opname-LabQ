import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT is only needed by the dev server, never during a production build.
// Fall back to 5173 so `vite build` (e.g. on Vercel CI) doesn't throw.
const port = Number(process.env.PORT ?? 5173);

// BASE_PATH is a Replit-specific path prefix. Default to '/' everywhere else
// (Vercel, local builds, etc.).
const basePath = process.env.BASE_PATH ?? '/';

const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig(async () => ({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Only load the Replit dev-overlay in the Replit environment.
    ...(isReplit ? [runtimeErrorOverlay()] : []),
    // Cartographer and dev-banner are Replit-only dev-mode tools.
    ...(isReplit && process.env.NODE_ENV !== 'production'
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
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
}));

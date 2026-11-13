import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'serve-public-static',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const cleanUrl = req.url.split('?')[0];
          if (cleanUrl.startsWith('/assets/') && cleanUrl.endsWith('.js')) {
            const requestedFile = path.resolve(import.meta.dirname, 'dist', cleanUrl.replace(/^\//, ''));
            if (!fs.existsSync(requestedFile)) {
              // Dynamically resolve stale hash chunk requests across deploys/rebuilds
              const basename = path.basename(cleanUrl);
              const prefix = basename.split('-')[0];
              const assetsDir = path.resolve(import.meta.dirname, 'dist', 'assets');
              if (fs.existsSync(assetsDir)) {
                try {
                  const files = fs.readdirSync(assetsDir);
                  const match = files.find(f => f.startsWith(prefix + '-') && f.endsWith('.js'));
                  if (match) {
                    const content = fs.readFileSync(path.join(assetsDir, match));
                    res.setHeader('Content-Type', 'text/javascript');
                    res.setHeader('Content-Length', content.length);
                    res.end(content);
                    return;
                  }
                } catch {}
              }
            }
          }
          next();
        });
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const cleanUrl = req.url.split('?')[0];
          const relativePath = cleanUrl.replace(/^\//, '');
          if (!relativePath) return next();
          const publicPath = path.resolve(import.meta.dirname, 'public', relativePath);
          if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
            const ext = path.extname(publicPath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.webp': 'image/webp',
              '.json': 'application/json',
            };
            const fileBuf = fs.readFileSync(publicPath);
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Content-Length', fileBuf.length);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(fileBuf);
            return;
          }
          next();
        });
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Golden Leaf Finance',
        short_name: 'GLF',
        description: 'Finance Collection & Loan Management System',
        theme_color: '#D4AF37',
        background_color: '#1A1A1A',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/pdfGenerator*', '**/jspdf*', '**/html2canvas*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps) => {
        return deps.filter((dep) => !dep.includes('charts'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('framer-motion')) {
              return 'animation';
            }
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    preTransformRequests: false,
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/.env*', '**/vite.config.*', '**/tsconfig*'],
    },
  },
  optimizeDeps: {
    entries: ['src/main.tsx'],
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// PocketOS build config.
// - React + Fast Refresh
// - PWA: offline service worker, installable manifest, fullscreen launch
// - "@/..." path alias maps to src/
// - BASE_PATH sets the public path: "/" by default (Vercel, Netlify, a custom domain),
//   "/PocketOS/" for the GitHub Pages demo
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'PocketOS',
        short_name: 'PocketOS',
        description:
          'A desktop environment in your phone browser. Windows, files, a terminal and apps, fully offline.',
        id: base,
        start_url: base,
        scope: base,
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `${base}icon-maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,html,svg,png,ico,woff,woff2,webmanifest}', 'assets/index-*.js'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        // The core OS is precached for instant offline. Heavy, lazily loaded chunks
        // (Monaco, xterm, language packs) are cached on first use instead of bloating
        // the install, then stay available offline.
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin, request }) =>
              sameOrigin &&
              (request.destination === 'script' ||
                request.destination === 'worker' ||
                request.destination === 'style'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pocketos-runtime',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Keep the service worker out of `vite dev` so it never serves stale modules while developing.
        // Offline behaviour is exercised against the production build via `npm run preview`.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2020',
    sourcemap: false,
    // Monaco ships a few large chunks on purpose; they are lazy-loaded and runtime-cached.
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        // Keep Monaco in its own chunk (name not matched by the precache glob) so it stays
        // out of the install and is runtime-cached on first use instead.
        manualChunks(id) {
          if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
            return 'monaco'
          }
          return undefined
        },
      },
    },
  },
})

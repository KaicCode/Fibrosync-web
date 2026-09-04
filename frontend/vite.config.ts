import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'offline.html'],
      manifest: {
        name: 'FibroSync',
        short_name: 'FibroSync',
        description: 'Plataforma de acompanhamento para pessoas com fibromialgia.',
        lang: 'pt-BR',
        theme_color: '#7C3AED',
        background_color: '#F8F9FD',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // SPA app shell: precached index.html serves every navigation that
        // isn't otherwise matched. `registerType: 'autoUpdate'` keeps this
        // precache fresh on every deploy, so this is effectively
        // stale-while-revalidate at the app-shell level without the risk of
        // a hand-rolled navigation strategy fighting the precache. A
        // dedicated static offline.html (see runtimeCaching entry below and
        // OfflineScreen at the React level) covers the case where nothing
        // has ever been cached yet.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Security-critical: every call to the NestJS API (auth, refresh,
          // daily records, reports, doctor/admin endpoints, everything —
          // the backend mounts all of it under /api/) must never be served
          // from or written to any cache, regardless of origin (the API is
          // cross-origin in production). No tokens, no clinical data, no
          // reports ever touch the service worker cache.
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'GET',
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'POST',
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'PATCH',
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'PUT',
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'DELETE',
          },
          // Same-origin static assets built by Vite are already precached
          // (content-hashed filenames); this just covers any same-origin
          // image requested at runtime that isn't part of the build. A
          // RegExp urlPattern (unlike a function one) is same-origin only.
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'same-origin-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          // Decorative, non-clinical exercise photos served from Unsplash.
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'exercise-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

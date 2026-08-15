import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable PWA so students can "Add to Home Screen" on their phone
    // and use the app like a native app (works offline via service worker).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Scholarship Matcher',
        short_name: 'ScholarMatch',
        description:
          'Automatically match students to scholarships they are eligible for.',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Take over immediately on update so students always get the latest
        // scholarship data + bug fixes (no stuck old service worker).
        skipWaiting: true,
        clientsClaim: true,
        // Firebase Auth needs network; do not block navigation requests.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 12000,
    host: true,
    // Allow the phone-accessible preview hostnames so the public workhost URL
    // (and the generated phone link) is not blocked by Vite's host check.
    allowedHosts: ['.prod-runtime.all-hands.dev'],
  },
});

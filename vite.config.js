import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// Ultima versione dello script Exporter, letta dall'@version dello userscript nel repo:
// l'app la confronta con quella che l'exporter installato comunica, per proporre
// "Aggiorna script". Una sola fonte, niente da aggiornare a mano.
const EXPORTER_LATEST = (readFileSync(new URL('./util/OValue_Exporter_v3.user.js', import.meta.url), 'utf8')
  .match(/^\/\/\s*@version\s+(\S+)/m) || [])[1] || null

export default defineConfig({
  define: {
    __EXPORTER_LATEST__: JSON.stringify(EXPORTER_LATEST)
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'ovalue.png'],
      manifest: {
        name: 'OValue - OGame Tools Suite',
        short_name: 'OValue',
        description: 'Calcolatori avanzati per OGame: produzione miniere, pack exchange e shopping list.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'it',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2}'],
        // /fusion/ is the Exodus rankings, proxied from GitHub Pages (netlify.toml, worker/index.js): the service worker must
        // let those pages through instead of answering with the Vue app's index.html
        navigateFallbackDenylist: [/^\/fusion/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cloud\.umami\.is\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
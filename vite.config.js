import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
        globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2}'],
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
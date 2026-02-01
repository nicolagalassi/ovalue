import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
    // Rimosso splitVendorChunkPlugin() perché deprecato
  ],
  build: {
    // Usiamo il minificatore di default (esbuild) che è più veloce e non richiede pacchetti extra
    minify: true, 
    rollupOptions: {
        output: {
            // Questa funzione separa le librerie (node_modules) dal tuo codice
            manualChunks(id) {
                if (id.includes('node_modules')) {
                    return 'vendor';
                }
            }
        }
    }
  }
})
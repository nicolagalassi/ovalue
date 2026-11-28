/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // Hover solo dove c'è un puntatore: su touch lo stato hover non resta "incollato" dopo un tap
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        ogame: {
          bg: '#070c18',        // Void — sfondo pagina
          panel: '#0d1525',     // Hull — card/pannelli principali
          surface: '#0a101e',   // Deep Surface — input, inner card
          raised: '#131d31',    // Elemento attivo / barra risultati
          line: '#1e293b',      // Bordo standard dei pannelli
          border: '#2d3748',
          accent: '#00f0ff',    // Ciano Cyberpunk
          success: '#00ff9d',   // Verde Neon
          danger: '#ff2a6d',    // Rosso Neon
          warning: '#ffb800',   // Oro
          dm: '#9d00ff',        // Viola scuro
          text: '#e2e8f0',
        }
      },
    },
  },
  plugins: [],
}
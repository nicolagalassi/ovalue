/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ogame: {
          bg: '#0b0e14',        // Più scuro, quasi nero profondo
          panel: '#151923',     // Blu notte desaturato
          border: '#2d3748',    
          accent: '#00f0ff',    // Ciano Cyberpunk
          success: '#00ff9d',   // Verde Neon
          danger: '#ff2a6d',    // Rosso Neon
          warning: '#ffb800',   // Oro
          dm: '#9d00ff',        // Viola scuro
          text: '#e2e8f0'
        }
      },
      boxShadow: {
        'neon-blue': '0 0 5px theme("colors.blue.500"), 0 0 20px theme("colors.blue.900")',
        'neon-gold': '0 0 5px theme("colors.yellow.500"), 0 0 20px theme("colors.yellow.900")',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}
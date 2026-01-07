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
          bg: '#0d1014',       
          panel: '#161b22',    
          border: '#30363d',   
          accent: '#3399ff',   
          success: '#238636',  
          danger: '#da3633',   
          warning: '#d29922', 
          dm: '#7834bc', 
          money: '#2ea043', 
          text: '#c9d1d9'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
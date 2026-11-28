import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // <--- Importa il router

const app = createApp(App);
app.use(router); // <--- Dillo a Vue di usarlo
app.mount('#app');
// La rotella del mouse sopra un campo numerico con il focus ne cambia il valore
// (es. tassi 3:2:1 che diventano 3:3:3 scorrendo la pagina): si toglie il focus
// al campo, così la rotella scorre la pagina e il valore resta quello scritto.
document.addEventListener('wheel', (e) => {
    const el = document.activeElement;
    if (el && el.type === 'number' && el === e.target) el.blur();
}, { passive: true });

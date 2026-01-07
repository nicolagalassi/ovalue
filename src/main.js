import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // <--- Importa il router

const app = createApp(App);
app.use(router); // <--- Dillo a Vue di usarlo
app.mount('#app');
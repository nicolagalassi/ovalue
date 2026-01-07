import { createRouter, createWebHistory } from 'vue-router';

// Importiamo le pagine appena create
import Home from './views/Home.vue';
import MetalCalc from './views/MetalCalc.vue';
import PackCalc from './views/PackCalc.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/metal', component: MetalCalc },
    { path: '/pack', component: PackCalc },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
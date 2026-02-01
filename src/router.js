import { createRouter, createWebHistory } from 'vue-router';

// 1. PERFORMANCE: Lazy Loading
// Invece di importare tutto all'inizio, carichiamo i componenti solo quando servono.
// Rimuovi gli import statici:
// import Home from './views/Home.vue';
// import MetalCalc from './views/MetalCalc.vue';
// import PackCalc from './views/PackCalc.vue';

const routes = [
    { 
        path: '/', 
        component: () => import('./views/Home.vue'), // Lazy Load
        meta: { 
            title: 'OValue - OGame Tools Suite',
            description: 'Calcolatori avanzati per OGame: Produzione miniere, Crawler, e Pack Exchange ottimizzato.'
        }
    },
    { 
        path: '/metal', 
        component: () => import('./views/MetalCalc.vue'),
        meta: { 
            title: 'Production Core - OValue',
            description: 'Ottimizza la produzione delle tue miniere, calcola il bonus plasma, item e crawlers.'
        }
    },
    { 
        path: '/pack', 
        component: () => import('./views/PackCalc.vue'),
        meta: { 
            title: 'Pack Exchange - OValue',
            description: 'Calcolatore costi costruzioni e convertitore risorse in pacchetti MO (Dark Matter).'
        }
    },
    
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    // 2. USABILITY: Torna in cima alla pagina quando cambi rotta
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    },
});

// 3. SEO: Aggiornamento dinamico dei Meta Tag
router.beforeEach((to, from, next) => {
    // Aggiorna il titolo del documento
    document.title = to.meta.title || 'OValue';

    // Aggiorna la meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', to.meta.description || 'OGame Tools');
    } else {
        // Se non esiste, creala (utile se manca in index.html)
        const meta = document.createElement('meta');
        meta.name = "description";
        meta.content = to.meta.description || 'OGame Tools';
        document.head.appendChild(meta);
    }

    next();
});

export default router;
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
    {
        path: '/shopping',
        component: () => import('./views/ShoppingList.vue'),
        meta: {
            title: 'Shopping List - OValue',
            description: 'Crea una lista della spesa per strutture, navi e ricerche e calcola il costo totale in risorse.'
        }
    },
    {
        path: '/expirations',
        component: () => import('./views/ExpirationsView.vue'),
        meta: {
            title: 'Scadenziario - OValue',
            description: 'Gestisci e monitora le scadenze di ufficiali e item.'
        }
    },
    {
        path: '/settings',
        component: () => import('./views/SettingsView.vue'),
        meta: {
            title: 'Impostazioni - OValue',
            description: 'Gestisci profili, sincronizzazione e preferenze di OValue.'
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('./views/NotFound.vue'),
        meta: {
            title: '404 - Pagina Non Trovata - OValue',
            description: 'La pagina che stai cercando non esiste.'
        }
    }
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
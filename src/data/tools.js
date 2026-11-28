// Identità dei quattro strumenti: colore, icona e immagine di gioco.
// Unica fonte per header, titoli di pagina, barre dei risultati e Home:
// il colore dice al giocatore in quale strumento si trova.
export const TOOLS = [
    {
        id: 'metal', to: '/metal', color: '#38bdf8',
        titleKey: 'card_metal_title', descKey: 'card_metal_desc',
        img: '/Immagini%20Ogame/40%20metallo.png',
        // barre di produzione
        icon: ['M4 20h16', 'M6 16v-4', 'M10 16V8', 'M14 16v-6', 'M18 16V5'],
    },
    {
        id: 'pack', to: '/pack', color: '#fbbf24',
        titleKey: 'card_pack_title', descKey: 'card_pack_desc',
        img: '/Immagini%20Ogame/packmetal.png',
        // pacchetto
        icon: ['M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'],
    },
    {
        id: 'shopping', to: '/shopping', color: '#a78bfa',
        titleKey: 'shopping_title', descKey: 'card_shopping_desc',
        img: '/Immagini%20Ogame/geologo.jpg',
        // carrello
        icon: ['M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'],
    },
    {
        id: 'strategy', to: '/strategy', color: '#34d399',
        titleKey: 'card_strategy_title', descKey: 'card_strategy_desc',
        img: '/Immagini%20Ogame/res40.png',
        // crescita
        icon: ['M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'],
    },
];

export const toolByPath = (path) => TOOLS.find(t => path === t.to || path.startsWith(t.to + '/')) || null;

// NOTA: In Vue/Vite dobbiamo usare "export const" davanti al nome
export const OGAME_DB = {
    resources: {
        type: 'building',
        items: {
            metal_mine: { cost: [60, 15, 0], factor: 1.5 },
            crystal_mine: { cost: [48, 24, 0], factor: 1.6 },
            deuterium_synthesizer: { cost: [225, 75, 0], factor: 1.5 },
            solar_plant: { cost: [75, 30, 0], factor: 1.5 },
            fusion_reactor: { cost: [900, 360, 180], factor: 1.8 },
            metal_storage: { cost: [1000, 0, 0], factor: 2 },
            crystal_storage: { cost: [1000, 500, 0], factor: 2 },
            deuterium_tank: { cost: [1000, 1000, 0], factor: 2 },
            solar_satellite: { cost: [0, 2000, 500], factor: 1, type: 'unit' }, // Solar Satellite is a unit, not a building
            crawler: { cost: [2000, 2000, 1000], factor: 1, type: 'unit' }
        }
    },
    facilities: {
        type: 'building',
        items: {
            robotics_factory: { cost: [400, 120, 200], factor: 2 },
            shipyard: { cost: [400, 200, 100], factor: 2 },
            research_lab: { cost: [200, 400, 200], factor: 2 },
            alliance_depot: { cost: [20000, 40000, 0], factor: 2 },
            missile_silo: { cost: [20000, 20000, 1000], factor: 2 },
            nanite_factory: { cost: [1000000, 500000, 100000], factor: 2 },
            terraformer: { cost: [0, 50000, 100000, 1000], factor: 2 }, // Last is Energy
            space_dock: { cost: [200, 0, 50, 50], factor: 5 }, // Energy is used for special logic in OGame but simplified here
            lunar_base: { cost: [20000, 40000, 20000], factor: 2 },
            sensor_phalanx: { cost: [20000, 40000, 20000], factor: 2 },
            jump_gate: { cost: [2000000, 4000000, 2000000], factor: 2 }
        }
    },
    research: {
        type: 'research',
        items: {
            energy_technology: { cost: [0, 800, 400], factor: 2 },
            laser_technology: { cost: [200, 100, 0], factor: 2 },
            ion_technology: { cost: [1000, 300, 100], factor: 2 },
            hyperspace_technology: { cost: [0, 4000, 2000], factor: 2 },
            plasma_technology: { cost: [2000, 4000, 1000], factor: 2 },
            combustion_drive: { cost: [400, 0, 600], factor: 2 },
            impulse_drive: { cost: [2000, 4000, 600], factor: 2 },
            hyperspace_drive: { cost: [10000, 20000, 6000], factor: 2 },
            espionage_technology: { cost: [200, 1000, 200], factor: 2 },
            computer_technology: { cost: [0, 400, 600], factor: 2 },
            astrophysics: { cost: [4000, 8000, 4000], factor: 1.75 },
            intergalactic_research_network: { cost: [240000, 400000, 160000], factor: 2 },
            graviton_technology: { cost: [0, 0, 0, 300000], factor: 3 },
            weapons_technology: { cost: [800, 200, 0], factor: 2 },
            shielding_technology: { cost: [200, 600, 0], factor: 2 },
            armor_technology: { cost: [1000, 0, 0], factor: 2 },
            mineralogy_centre: { cost: [10000, 10000, 5000], factor: 1.5, type: 'lf_research' }
        }
    },
    // LifeForms Data
    lf_humans: {
        type: 'lf_building',
        items: {
            1001: { cost: [7, 2, 0, 0], factors: [1.2, 1.2, 0, 0], name: 'Settore Residenziale' },
            1002: { cost: [5, 2, 0, 8], factors: [1.23, 1.23, 0, 1.02], name: 'Fattoria Biosferica' },
            1003: { cost: [20000, 25000, 10000, 10], factors: [1.3, 1.3, 1.3, 1.08], name: 'Centro di Ricerca' },
            1004: { cost: [5000, 3200, 1500, 15], factors: [1.7, 1.7, 1.7, 1.25], name: 'Accademia delle Scienze' },
            1005: { cost: [50000, 40000, 50000, 30], factors: [1.7, 1.7, 1.7, 1.25], name: 'Centro di Neuro-calibrazione' },
            1006: { cost: [9000, 6000, 3000, 40], factors: [1.5, 1.5, 1.5, 1.1], name: 'Fusione ad alta energia' },
            1007: { cost: [25000, 13000, 7000, 0], factors: [1.09, 1.09, 1.09, 0], name: 'Magazzino Alimentare' },
            1008: { cost: [50000, 25000, 15000, 80], factors: [1.5, 1.5, 1.5, 1.1], name: 'Tecniche estrattive a fusione' },
            1009: { cost: [75000, 20000, 25000, 50], factors: [1.09, 1.09, 1.09, 1.02], name: 'Grattacielo' },
            1010: { cost: [150000, 30000, 15000, 60], factors: [1.12, 1.12, 1.12, 1.03], name: 'Laboratorio Biotecnologico' },
            1011: { cost: [80000, 35000, 60000, 90], factors: [1.5, 1.5, 1.5, 1.05], name: 'Metropolis', nameEn: 'Metropolis' },
            1012: { cost: [250000, 125000, 125000, 100], factors: [1.15, 1.15, 1.15, 1.02], name: 'Scudo planetario' }
        }
    },
    lf_humans_res: {
        type: 'lf_research',
        items: {
            1101: { cost: [5000, 2500, 500, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Ambasciatori intergalattici', bonus: [0, 0, 0] },
            1102: { cost: [7000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Estrattori ad alto rendimento', nameEn: 'High-Performance Extractors', bonus: [0.0006, 0.0006, 0.0006, 0, 0, 0] },
            1103: { cost: [15000, 10000, 5000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Propulsore a fusione', bonus: [0, 0, 0] },
            1104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Generatore di campo mimetico', bonus: [0, 0, 0] },
            1105: { cost: [24750, 19800, 9900, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Nascondiglio Orbitale', bonus: [0, 0, 0] },
            1106: { cost: [35000, 25000, 15000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'AI di ricerca', bonus: [0, 0, 0] },
            1107: { cost: [70000, 40000, 20000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Terraformer ad alte prestazioni', bonus: [0, 0, 0] },
            1108: { cost: [80000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologie di estrazione migliorate', nameEn: 'Enhanced Production Technologies', bonus: [0.0006, 0.0006, 0.0006, 0, 0, 0] },
            1109: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Caccia leggero mk II', bonus: [0, 0, 0] },
            1110: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Incrociatore mk II', bonus: [0, 0, 0] },
            1111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologia di laboratorio migliorata', bonus: [0, 0, 0] },
            1112: { cost: [100000, 40000, 30000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Terraformer al plasma', bonus: [0, 0, 0] },
            1113: { cost: [200000, 100000, 100000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Propulsori a bassa temperatura', bonus: [0, 0, 0] },
            1114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Bombardiere mk II', bonus: [0, 0, 0] },
            1115: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Corazzata mk II', bonus: [0, 0, 0] },
            1116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Incrociatore da battaglia mk II', bonus: [0, 0, 0] },
            1117: { cost: [300000, 180000, 120000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Assistenti robot', bonus: [0, 0, 0] },
            1118: { cost: [500000, 300000, 200000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Supercomputer', bonus: [0, 0, 0] }
        }
    },
    lf_rocktal: {
        type: 'lf_building',
        items: {
            2001: { cost: [9, 3, 0, 0], factors: [1.2, 1.2, 0, 0], name: 'Enclave di Meditazione' },
            2002: { cost: [7, 2, 0, 10], factors: [1.2, 1.2, 0, 1.03], name: 'Produzione di cristalli' },
            2003: { cost: [40000, 10000, 15000, 15], factors: [1.3, 1.3, 1.3, 1.1], name: 'Tecnologicus Runarum' },
            2004: { cost: [5000, 3800, 1000, 20], factors: [1.7, 1.7, 1.7, 1.35], name: 'Fucina delle Rune' },
            2005: { cost: [50000, 40000, 50000, 60], factors: [1.65, 1.65, 1.65, 1.3], name: 'Orictorium' },
            2006: { cost: [10000, 8000, 1000, 40], factors: [1.4, 1.4, 1.4, 1.1], name: 'Fusione magmatica' },
            2007: { cost: [20000, 15000, 10000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Camera di Disgregazione' },
            2008: { cost: [50000, 35000, 15000, 80], factors: [1.5, 1.5, 1.5, 1.3], name: 'Monolite' },
            2009: { cost: [85000, 44000, 25000, 90], factors: [1.4, 1.4, 1.4, 1.1], name: 'Cristalleria' },
            2010: { cost: [120000, 50000, 20000, 90], factors: [1.4, 1.4, 1.4, 1.1], name: 'Sintonizzatore di deuterio' },
            2011: { cost: [250000, 150000, 100000, 120], factors: [1.8, 1.8, 1.8, 1.3], name: 'Centro di Mineralogia' },
            2012: { cost: [250000, 125000, 125000, 100], factors: [1.5, 1.5, 1.5, 1.1], name: 'Impianto di Riciclaggio' }
        }
    },
    lf_rocktal_res: {
        type: 'lf_research',
        items: {
            2101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Batterie vulcaniche', bonus: [0, 0, 0] },
            2102: { cost: [7500, 12500, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sondaggio acustico', bonus: [0, 0.0008, 0, 0, 0, 0] },
            2103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sistemi di pompaggio ad alta energia', bonus: [0, 0, 0.0008, 0, 0, 0] },
            2104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Espansione stiva (navi civili)', bonus: [0, 0, 0] },
            2105: { cost: [25000, 20000, 10000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecniche estrattive magmatiche', nameEn: 'Magma-Powered Production', bonus: [0.0008, 0.0008, 0.0008, 0, 0, 0] },
            2106: { cost: [50000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Centrali Geotermoelettriche', bonus: [0, 0, 0] },
            2107: { cost: [70000, 40000, 20000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sondaggio da alte profondita', nameEn: 'Depth Sounding', bonus: [0.0008, 0, 0, 0, 0, 0] },
            2108: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Potenziamento da cristallo ionico (Caccia pesante)', bonus: [0, 0, 0] },
            2109: { cost: [75000, 55000, 25000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Concentratore astrale', nameEn: 'Improved Stellarator', bonus: [0, 0, 0] },
            2110: { cost: [85000, 40000, 35000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Punte di diamante irrobustite', nameEn: 'Hardened Diamond Drill Heads', bonus: [0.0008, 0, 0, 0, 0, 0] },
            2111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologie minerarie sismiche', bonus: [0, 0.0008, 0, 0, 0, 0] },
            2112: { cost: [100000, 40000, 30000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sistema di pompaggio al magma', bonus: [0, 0, 0.0008, 0, 0, 0] },
            2113: { cost: [200000, 100000, 100000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Moduli Cristalli ionici', nameEn: 'Ion Crystal Modules', bonus: [0, 0, 0] },
            2114: { cost: [220000, 110000, 110000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Costruzione Base ottimizzata', bonus: [0, 0, 0] },
            2115: { cost: [240000, 120000, 120000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Trasmettitore energetico Diamante', bonus: [0, 0, 0] },
            2116: { cost: [250000, 250000, 250000, 0], factors: [1.4, 1.4, 1.4, 0], name: 'Miglioramento Scudo ossidiana', bonus: [0, 0, 0] },
            2117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Scudi runici', bonus: [0, 0, 0] },
            2118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0], name: 'Potenziamento Collezionista Rocktal', bonus: [0, 0, 0, 0, 0, 0, 0.002] }
        }
    },
    lf_mecha: {
        type: 'lf_building',
        items: {
            3001: { cost: [6, 2, 0, 0], factors: [1.21, 1.21, 0, 0], name: 'Linea di produzione' },
            3002: { cost: [5, 2, 0, 8], factors: [1.18, 1.18, 0, 1.02], name: 'Fabbrica Celle a fusione' },
            3003: { cost: [30000, 20000, 10000, 13], factors: [1.3, 1.3, 1.3, 1.08], name: 'Centro Ricerca Robotica' },
            3004: { cost: [5000, 3800, 1000, 10], factors: [1.8, 1.8, 1.8, 1.2], name: 'Network Aggiornamento' },
            3005: { cost: [50000, 40000, 50000, 40], factors: [1.8, 1.8, 1.8, 1.2], name: 'Centro Calcolo Quantistico' },
            3006: { cost: [7500, 7000, 1000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Centro Assemblaggio Automatizzato' },
            3007: { cost: [35000, 15000, 10000, 40], factors: [1.5, 1.5, 1.5, 1.05], name: 'Trasformatore ad alta potenza', nameEn: 'High-Performance Transformer' },
            3008: { cost: [50000, 20000, 30000, 40], factors: [1.07, 1.07, 1.07, 1.01], name: 'Linea di produzione Micochip' },
            3009: { cost: [100000, 10000, 3000, 80], factors: [1.14, 1.14, 1.14, 1.04], name: 'Sala Catena di Montaggio' },
            3010: { cost: [100000, 40000, 20000, 60], factors: [1.5, 1.5, 1.5, 1.1], name: 'Sintetizzatore Alte prestazioni' },
            3011: { cost: [55000, 50000, 30000, 70], factors: [1.5, 1.5, 1.5, 1.05], name: 'Produzione di massa di chip', nameEn: 'Chip Mass Production' },
            3012: { cost: [250000, 125000, 125000, 100], factors: [1.4, 1.4, 1.4, 1.05], name: 'Nanobot Riparazione' }
        }
    },
    lf_mecha_res: {
        type: 'lf_research',
        items: {
            3101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologia Catalizzatore', bonus: [0, 0, 0.0008, 0, 0, 0] },
            3102: { cost: [7500, 12500, 5000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Unita al plasma', bonus: [0, 0, 0] },
            3103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Modulo Efficienza', bonus: [0, 0, 0] },
            3104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0], name: 'IA deposito', bonus: [0, 0, 0] },
            3105: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Caccia leggero)', bonus: [0, 0, 0] },
            3106: { cost: [50000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Linee di trasporto automatizzate', nameEn: 'Automated Transport Lines', bonus: [0.0006, 0.0006, 0.0006, 0, 0, 0] },
            3107: { cost: [70000, 40000, 20000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'IA Droni migliorata', bonus: [0, 0, 0] },
            3108: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnica sperimentale Rigenerazione', bonus: [0, 0, 0] },
            3109: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Incrociatore)', bonus: [0, 0, 0] },
            3110: { cost: [85000, 40000, 35000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Pilota automatico Slingshot', bonus: [0, 0, 0] },
            3111: { cost: [120000, 30000, 25000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Superconduttore Alta temperatura', bonus: [0, 0, 0] },
            3112: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Nave da battaglia)', bonus: [0, 0, 0] },
            3113: { cost: [200000, 100000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Intelligenza collettiva artificiale', nameEn: 'Artificial Swarm Intelligence', bonus: [0.0006, 0.0006, 0.0006, 0, 0, 0] },
            3114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Incrociatore da battaglia)', bonus: [0, 0, 0] },
            3115: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Bombardiere)', bonus: [0, 0, 0] },
            3116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Revisione generale (Corazzata)', bonus: [0, 0, 0] },
            3117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologia Armi sperimentale', bonus: [0, 0, 0] },
            3118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0], name: 'Rinforzo generale Mecha', bonus: [0, 0, 0] }
        }
    },
    lf_kaelesh: {
        type: 'lf_building',
        items: {
            4001: { cost: [4, 3, 0, 0], factors: [1.21, 1.21, 0, 0], name: 'Rifugio' },
            4002: { cost: [6, 3, 0, 9], factors: [1.2, 1.2, 0, 1.02], name: 'Condensatore Antimateria' },
            4003: { cost: [20000, 15000, 15000, 10], factors: [1.3, 1.3, 1.3, 1.08], name: 'Camera Vortex' },
            4004: { cost: [7500, 5000, 800, 15], factors: [1.8, 1.8, 1.8, 1.3], name: 'Sale della Conoscenza' },
            4005: { cost: [60000, 30000, 50000, 30], factors: [1.8, 1.8, 1.8, 1.3], name: 'Forum della Trascendenza' },
            4006: { cost: [8500, 5000, 3000, 0], factors: [1.25, 1.25, 1.25, 0], name: 'Convettore Antimateria' },
            4007: { cost: [15000, 15000, 5000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Laboratorio Clonazione', nameEn: 'Cloning Laboratory' },
            4008: { cost: [75000, 25000, 30000, 30], factors: [1.05, 1.05, 1.05, 1.03], name: 'Acceleratore Crisalide' },
            4009: { cost: [87500, 25000, 30000, 40], factors: [1.2, 1.2, 1.2, 1.02], name: 'Biomodificatore' },
            4010: { cost: [150000, 30000, 30000, 140], factors: [1.4, 1.4, 1.4, 1.05], name: 'Modulatore psionico' },
            4011: { cost: [75000, 50000, 55000, 90], factors: [1.2, 1.2, 1.2, 1.04], name: 'Sala Fabbricazione Navi' },
            4012: { cost: [500000, 250000, 250000, 100], factors: [1.4, 1.4, 1.4, 1.05], name: 'Soprarifrattore' }
        }
    },
    lf_kaelesh_res: {
        type: 'lf_research',
        items: {
            4101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Recupero calore', bonus: [0, 0, 0.0008, 0, 0, 0] },
            4102: { cost: [7500, 12500, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologia Processo al solfuro', bonus: [0, 0, 0] },
            4103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Network psionico', bonus: [0, 0, 0] },
            4104: { cost: [20000, 15000, 7500, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Raggio di trazione telecinetico', bonus: [0, 0, 0] },
            4105: { cost: [25000, 20000, 10000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Tecnologia Sensori migliorata', bonus: [0, 0, 0] },
            4106: { cost: [50000, 50000, 20000, 0], factors: [1.3, 1.3, 1.3, 0], name: 'Compattatore neuromodulare', bonus: [0, 0, 0] },
            4107: { cost: [70000, 40000, 20000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Interfaccia neurologica', bonus: [0, 0, 0] },
            4108: { cost: [80000, 50000, 20000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Network di analisi superglobale', bonus: [0, 0, 0] },
            4109: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Overclocking (Caccia pesante)', bonus: [0, 0, 0] },
            4110: { cost: [85000, 40000, 35000, 0], factors: [1.2, 1.2, 1.2, 0], name: 'Sistema Potenziamento telecinetico', bonus: [0, 0, 0] },
            4111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sesto senso', bonus: [0, 0, 0] },
            4112: { cost: [100000, 40000, 30000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Armonizzatore psicologico', nameEn: 'Psychoharmoniser', bonus: [0.0006, 0.0006, 0.0006, 0, 0, 0] },
            4113: { cost: [200000, 100000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Intelligenza collettiva efficiente', bonus: [0, 0, 0] },
            4114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Overclocking (Cargo pesante)', bonus: [0, 0, 0] },
            4115: { cost: [240000, 120000, 120000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Sensori Gravita', bonus: [0, 0, 0] },
            4116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Overclocking (Nave da battaglia)', bonus: [0, 0, 0] },
            4117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0], name: 'Matrice Protezione psionica', bonus: [0, 0, 0] },
            4118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0], name: 'Rinforzo Esploratore Kaelesh', bonus: [0, 0, 0] }
        }
    },

    "fleet": {
        "items": {
            "small_cargo": { "cost": [2000, 2000, 0], "f": 1, "type": "unit" },
            "large_cargo": { "cost": [6000, 6000, 0], "f": 1, "type": "unit" },
            "light_fighter": { "cost": [3000, 1000, 0], "f": 1, "type": "unit" },
            "heavy_fighter": { "cost": [6000, 4000, 0], "f": 1, "type": "unit" },
            "cruiser": { "cost": [20000, 7000, 2000], "f": 1, "type": "unit" },
            "battleship": { "cost": [45000, 15000, 0], "f": 1, "type": "unit" },
            "colony_ship": { "cost": [1000, 20000, 10000], "f": 1, "type": "unit" },
            "recycler": { "cost": [10000, 6000, 2000], "f": 1, "type": "unit" },
            "espionage_probe": { "cost": [0, 1000, 0], "f": 1, "type": "unit" },
            "bomber": { "cost": [50000, 25000, 15000], "f": 1, "type": "unit" },
            "destroyer": { "cost": [60000, 50000, 15000], "f": 1, "type": "unit" },
            "deathstar": { "cost": [5000000, 4000000, 1000000], "f": 1, "type": "unit" },
            "battlecruiser": { "cost": [30000, 40000, 15000], "f": 1, "type": "unit" },
            "reaper": { "cost": [85000, 55000, 20000], "f": 1, "type": "unit" },
            "pathfinder": { "cost": [8000, 15000, 8000], "f": 1, "type": "unit" },
            "rocket_launcher": { "cost": [2000, 0, 0], "f": 1, "type": "unit" },
            "light_laser": { "cost": [1500, 500, 0], "f": 1, "type": "unit" },
            "heavy_laser": { "cost": [6000, 2000, 0], "f": 1, "type": "unit" },
            "gauss_cannon": { "cost": [20000, 15000, 2000], "f": 1, "type": "unit" },
            "ion_cannon": { "cost": [2000, 6000, 0], "f": 1, "type": "unit" },
            "plasma_turret": { "cost": [50000, 50000, 30000], "f": 1, "type": "unit" },
            "small_shield_dome": { "cost": [10000, 10000, 0], "f": 1, "type": "unit" },
            "large_shield_dome": { "cost": [50000, 50000, 0], "f": 1, "type": "unit" },
            "interplanetary_missile": { "cost": [12500, 2500, 10000], "f": 1, "type": "unit" },
            "antiballistic_missile": { "cost": [8000, 0, 2000], "f": 1, "type": "unit" }
        }
    },
    premium_items_legacy: {
        items: {
            metal_booster_bronze: { cost: 2500, type: "booster" },
            metal_booster_silver: { cost: 8500, type: "booster" },
            metal_booster_gold: { cost: 25000, type: "booster" },
            crystal_booster_bronze: { cost: 2500, type: "booster" },
            crystal_booster_silver: { cost: 8500, type: "booster" },
            crystal_booster_gold: { cost: 25000, type: "booster" },
            deut_booster_bronze: { cost: 2500, type: "booster" },
            deut_booster_silver: { cost: 8500, type: "booster" },
            deut_booster_gold: { cost: 25000, type: "booster" },
            kraken_bronze: { cost: 2500, type: "reducer" },
            kraken_silver: { cost: 8500, type: "reducer" },
            kraken_gold: { cost: 25000, type: "reducer" },
            detroid_bronze: { cost: 2500, type: "reducer" },
            detroid_silver: { cost: 8500, type: "reducer" },
            detroid_gold: { cost: 25000, type: "reducer" },
            newtron_bronze: { cost: 2500, type: "reducer" },
            newtron_silver: { cost: 8500, type: "reducer" },
            newtron_gold: { cost: 25000, type: "reducer" }
        }
    }
};

export const SHOP_ITEMS = {
    categories: [
        { id: "resources", name: "shop_cat_resources" },
        { id: "classes", name: "shop_cat_classes" },
        { id: "officers_only", name: "shop_cat_officers_only" },
        { id: "boosters", name: "shop_cat_boosters" },
        { id: "slots", name: "shop_cat_slots" },
        { id: "fields", name: "shop_cat_fields" },
        { id: "construction", name: "shop_cat_construction" },
        { id: "expedition", name: "shop_cat_expedition" },
        { id: "ingame", name: "shop_cat_ingame" }
    ],
    durations: [
        { id: "base", name: "dur_base" },
        { id: "7d", name: "dur_7d" },
        { id: "30d", name: "dur_30d" },
        { id: "90d", name: "dur_90d" }
    ],
    items: {
        // Resources
        "res_package_all": { cat: "resources", tier: "none", costs: { "none": { "base": 360000 } } },
        "res_package_deut": { cat: "resources", tier: "none", costs: { "none": { "base": 180000 } } },
        "res_package_crystal": { cat: "resources", tier: "none", costs: { "none": { "base": 120000 } } },
        "res_package_metal": { cat: "resources", tier: "none", costs: { "none": { "base": 60000 } } },
        
        // Classes & Alliance Staff
        "class_collector": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        "class_general": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        "class_discoverer": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_researcher": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_merchant": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_warrior": { cat: "classes", tier: "none", costs: { "none": { "base": 500000 } } },
        
        // Officers & Command Staff
        "officer_commander": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 10000, "90d": 100000 } } },
        "officer_admiral": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 5000, "90d": 50000 } } },
        "officer_engineer": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 5000, "90d": 50000 } } },
        "officer_geologist": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 12500, "90d": 125000 } } },
        "officer_technocrat": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 10000, "90d": 100000 } } },
        "staff_command": { cat: "officers_only", tier: "none", costs: { "none": { "7d": 42500, "90d": 425000 } } },

        // Resource Boosters
        "booster_metal": { cat: "boosters", tier: "multi", costs: {
            "platinum": { "7d": 30000, "30d": 110000, "90d": 300000 },
            "gold": { "7d": 20000, "30d": 75000, "90d": 200000 },
            "silver": { "7d": 7500, "30d": 28000, "90d": 80000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},
        "booster_crystal": { cat: "boosters", tier: "multi", costs: {
            "platinum": { "7d": 30000, "30d": 110000, "90d": 300000 },
            "gold": { "7d": 20000, "30d": 75000, "90d": 200000 },
            "silver": { "7d": 7500, "30d": 28000, "90d": 80000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},
        "booster_deut": { cat: "boosters", tier: "multi", costs: {
            "platinum": { "7d": 30000, "30d": 110000, "90d": 300000 },
            "gold": { "7d": 20000, "30d": 75000, "90d": 200000 },
            "silver": { "7d": 7500, "30d": 28000, "90d": 80000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},

        // Energy Amplifiers
        "booster_energy": { cat: "boosters", tier: "multi", costs: {
            "platinum": { "7d": 30000, "30d": 110000, "90d": 300000 },
            "gold": { "7d": 20000, "30d": 75000, "90d": 200000 },
            "silver": { "7d": 7500, "30d": 28000, "90d": 80000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},

        // Planet Fields
        "fields_planet": { cat: "fields", tier: "multi", costs: {
            "platinum": { "base": 350000 },
            "gold": { "base": 300000 },
            "silver": { "base": 150000 },
            "bronze": { "base": 75000 }
        }},

        // Moon Fields
        "fields_moon": { cat: "fields", tier: "multi", costs: {
            "platinum": { "base": 130000 },
            "gold": { "base": 100000 },
            "silver": { "base": 50000 },
            "bronze": { "base": 30000 }
        }},

        // Costruzioni (ordine tier in UI: platino → oro → argento → bronzo)
        "moons": { cat: "fields", tier: "multi", costs: {
            "gold": { "base": 100000 },
            "silver": { "base": 50000 },
            "bronze": { "base": 30000 }
        }},
        "kraken": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},
        "detroid": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},
        "newtron": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},

        // Forme di vita (stessi tagli; platino indicativo ~27k MO quando in vendita)
        "kraken_lifeforms": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},
        "detroid_lifeforms": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},
        "newtron_lifeforms": { cat: "construction", tier: "multi", costs: {
            "platinum": { "base": 27000 },
            "gold": { "base": 7000 },
            "silver": { "base": 2500 },
            "bronze": { "base": 700 }
        }},

        // Expedition Slots
        "slot_expedition": { cat: "slots", tier: "multi", costs: {
            "gold": { "7d": 45000, "30d": 168750, "90d": 472500 },
            "silver": { "7d": 30000, "30d": 112500, "90d": 315000 },
            "bronze": { "7d": 15000, "30d": 56250, "90d": 157500 }
        }},

        // Fleet Slots
        "slot_fleet": { cat: "slots", tier: "multi", costs: {
            "gold": { "7d": 15000, "30d": 56250, "90d": 157500 },
            "silver": { "7d": 10000, "30d": 37500, "90d": 105000 },
            "bronze": { "7d": 5000, "30d": 18750, "90d": 52500 }
        }},

        "avatar_star_turtle": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        "avatar_smith_of_destiny": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        
        // In-game Utilities
        "ingame_merchant": { cat: "ingame", tier: "none", costs: { "none": { "base": 3500 } } },
        "ingame_relocate": { cat: "ingame", tier: "none", costs: { "none": { "base": 240000 } } },

        // Expedition Items (Delay Reduction)
        "exp_delay_50": { cat: "expedition", tier: "none", costs: { "none": { "7d": 50000, "30d": 170000, "90d": 450000 } } },
        "exp_delay_75": { cat: "expedition", tier: "none", costs: { "none": { "7d": 75000, "30d": 255000, "90d": 675000 } } },
        "exp_delay_100": { cat: "expedition", tier: "none", costs: { "none": { "7d": 125000, "30d": 425000, "90d": 1125000 } } },

        // Resource Amplifiers (produzione pianeta) — solo tier Bronzo noto; durate 30d/90d
        "res_amp_15": { cat: "boosters", tier: "multi", costs: { "bronze": { "30d": 110000, "90d": 250000 } } },
        "res_amp_20": { cat: "boosters", tier: "multi", costs: { "bronze": { "30d": 130000, "90d": 300000 } } },
        "res_amp_25": { cat: "boosters", tier: "multi", costs: { "bronze": { "30d": 170000, "90d": 380000 } } },
        "res_amp_30": { cat: "boosters", tier: "multi", costs: { "bronze": { "30d": 210000, "90d": 480000 } } },
        "res_amp_40": { cat: "boosters", tier: "multi", costs: { "bronze": { "30d": 260000, "90d": 600000 } } },

        // Expedition Resource Amplifiers — solo tier Bronzo noto; durate 7d/30d/90d
        "exp_res_amp_10": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 75000,  "30d": 290000, "90d": 700000 } } },
        "exp_res_amp_15": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 112500, "30d": 400000, "90d": 1000000 } } },
        "exp_res_amp_20": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 145000, "30d": 525000, "90d": 1260000 } } },
        "exp_res_amp_25": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 180000, "30d": 650000, "90d": 1500000 } } },
        "exp_res_amp_30": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 200000, "30d": 700000, "90d": 1700000 } } },
        "exp_res_amp_35": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 230000, "30d": 800000, "90d": 1900000 } } },
        "exp_res_amp_40": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 255000, "30d": 900000, "90d": 2000000 } } },

        // Expedition Computer — solo tier Bronzo noto; durate 7d/30d/90d
        "exp_computer": { cat: "expedition", tier: "multi", costs: { "bronze": { "7d": 250000, "30d": 1000000, "90d": 2500000 } } },

        // Scrap Dealer Offers (Mercante di ferri vecchi) — costo singolo, nessuna durata
        "scrap_offer_77": { cat: "ingame", tier: "none", costs: { "none": { "base": 150000 } } },
        "scrap_offer_79": { cat: "ingame", tier: "none", costs: { "none": { "base": 300000 } } },
        "scrap_offer_81": { cat: "ingame", tier: "none", costs: { "none": { "base": 450000 } } },
        "scrap_offer_83": { cat: "ingame", tier: "none", costs: { "none": { "base": 600000 } } },
        "scrap_offer_85": { cat: "ingame", tier: "none", costs: { "none": { "base": 750000 } } }
    }
};

// ── Pacchetti Materia Oscura (tagli acquistabili) ────────────────────────────
// Fonte condivisa tra PackCalc (ottimizzatore) e Shopping List (selettore tagli MO).
//   cost   = prezzo in € del taglio
//   amount = MO base ottenuta (senza bonus)
// Bonus applicabili:
//   - Bonus metodo di pagamento (PayPal/Carta/Amazon): +DM_PAYMENT_BONUS_PER_EUR × €
//   - Bonus evento (moltiplicatore %): uno tra DM_EVENT_BONUSES
// MO effettiva = floor( (amount + (pagamento ? cost × DM_PAYMENT_BONUS_PER_EUR : 0)) × (1 + bonus%/100) )
export const DM_PACKAGES = [
    { cost: 200, amount: 5100000 },
    { cost: 100, amount: 2525000 },
    { cost: 50,  amount: 1140000 },
    { cost: 25,  amount: 480000 },
    { cost: 10,  amount: 150000 },
    { cost: 5,   amount: 60000 }
];
export const DM_EVENT_BONUSES = [0, 30, 40, 50, 60, 100, 130];
export const DM_PAYMENT_BONUS_PER_EUR = 1000;

// MO effettiva di un taglio dati i bonus attivi.
export const dmPackageAmount = (pkg, { paymentBonus = true, eventBonus = 0 } = {}) => {
    const base = pkg.amount + (paymentBonus ? pkg.cost * DM_PAYMENT_BONUS_PER_EUR : 0);
    return Math.floor(base * (1 + (parseInt(eventBonus) || 0) / 100));
};